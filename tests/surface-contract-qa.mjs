import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {readFile,mkdir,writeFile} from "node:fs/promises";

const data=JSON.parse(await readFile("assets/console-data.json","utf8"));
const doc=await readFile("docs/slices-vistas-trazabilidad.md","utf8");
const output="artifacts/incremental-functional-qa/surface-contract",base="http://127.0.0.1:8896/";
await mkdir(output,{recursive:true});
const errors=[],records=[];
const assert=(ok,reason)=>{if(!ok)errors.push(reason);};
const index=id=>data.stages.findIndex(x=>x.id===id);
const current=stage=>{
 const seen=new Map();
 for(const s of data.screens.filter(s=>index(s.slice)<=index(stage)))seen.set(s.surface,s);
 return [...seen.values()];
};
const expected={S0:2,S1:5,S2:7,S3:8,S4:11,S5:12,S6:14};
assert(data.screens.length===15,"El catálogo no contiene 15 entregas");
assert(new Set(data.screens.map(s=>s.surface)).size===14,"El cierre no contiene 14 superficies");
assert(data.screens.filter(s=>s.type==="update").map(s=>s.id).join(",")==="s3-user-spend","Consumo no es la única actualización");
for(const [stage,count] of Object.entries(expected))assert(current(stage).length===count,stage+" acumula "+current(stage).length+" y esperaba "+count);
assert(data.screens.find(x=>x.id==="s0-connect")?.surface!==data.screens.find(x=>x.id==="s2-activate")?.surface,"Alta y ficha están indebidamente unificadas");
assert(data.screens.find(x=>x.id==="s1-inventory")?.surface!==data.screens.find(x=>x.id==="s4-mcp")?.surface,"Catálogo y ejecución están indebidamente unificados");
assert(doc.includes("14 superficies")&&doc.includes("una sustitución"),"Documentación de cardinalidad desactualizada");
const expectations={
 "s0-connect":["REG-02"],
 "s2-activate":["REG-01","REG-03","INF-05"],
 "s1-inventory":["INF-02"],
 "s4-mcp":["MCP-01","PLT-02","GRD-04"],
 "s2-limits":["FIN-02","CON-06"],
 "s3-user-spend":["FIN-03"]
};
for(const [id,reqs] of Object.entries(expectations)){
 const ids=data.screens.find(x=>x.id===id)?.requirements||[];
 for(const requirement of reqs)assert(ids.includes(requirement),id+" perdió trazabilidad "+requirement);
}

const server=spawn("python3",["-m","http.server","8896","--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let online=false;
 for(let i=0;i<40;i++){try{online=(await fetch(base)).ok;}catch{}if(online)break;await sleep(250);}
 if(!online)throw Error("Servidor local no disponible");
 browser=await chromium.launch({headless:true});
 for(const viewport of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
  const javascriptErrors=[];
  page.on("pageerror",e=>javascriptErrors.push(e.message));
  const prefix=viewport.name+": ";
  async function open(slice,screen){
   await page.goto(base+"assets/console.html?slice="+slice+"&screen="+screen,{waitUntil:"domcontentloaded"});
   await page.locator("#governance-root h1").first().waitFor({timeout:20000});
  }
  const content=()=>page.locator("#console-content").innerText();
  const heading=()=>page.locator("#governance-root h1").first().textContent();
  const capture=async name=>page.screenshot({path:output+"/"+viewport.name+"-"+name+".png",fullPage:true});
  const budget=()=>page.locator('input[type="number"]').first();
  const selectAgent=async name=>{
   await page.locator(".gov-agent-picker").locator('button,[role="combobox"]').first().click();
   await page.getByRole("option",{name}).click();
  };

  await open("S0","s2-activate");
  assert((await heading())==="Alta del agente",prefix+"un enlace S0 adelanta la ficha S2");
  await open("S1","s4-mcp");
  assert((await heading())==="Tarjeta de gobernanza",prefix+"un enlace S1 adelanta MCP S4");
  await open("S0","s0-connect");
  assert(await page.getByRole("button",{name:"Administrar"}).count()===0,prefix+"S0 anticipa S2");
  assert(await page.getByTestId("screen-version-selector").count()===0,prefix+"S0 ofrece versiones falsas");
  await open("S2","s0-connect");
  assert(await page.getByRole("button",{name:"Administrar"}).count()===1,prefix+"S2 listado no ofrece ficha");
  await page.getByRole("button",{name:"Administrar"}).click();
  assert((await heading())==="Control del agente",prefix+"no abrió control individual");
  assert((await content()).includes("agente-demo"),prefix+"perdió selección al abrir ficha");
  await capture("ficha-individual");
  await page.getByRole("button",{name:"Volver al listado de agentes"}).click();
  assert((await heading())==="Alta del agente",prefix+"no regresó al listado");

  await open("S2","s2-limits");
  assert(!(await content()).includes("Personas y consumo"),prefix+"S2 anticipa FIN-03");
  await open("S3","s3-user-spend");
  assert(await page.getByTestId("screen-version-selector").count()===1,prefix+"S3 no conserva única actualización real");
  assert((await content()).includes("Límites por agente")&&(await content()).includes("Consumo por persona"),prefix+"S3 reemplazó los límites del agente");
  await capture("consumo-acumulativo");
  await budget().fill("80");
  await page.getByRole("button",{name:"Guardar límites (simulación)"}).click();
  await page.getByRole("button",{name:"Configurar persona"}).first().click();
  assert((await content()).includes("Límites de ana.consulta"),prefix+"no cambia a la cuota de Ana");
  await budget().fill("15");
  await page.getByRole("button",{name:"Guardar límites (simulación)"}).click();
  await page.getByRole("button",{name:"Límites del agente"}).click();
  assert((await budget().inputValue())==="80",prefix+"cuota personal sobrescribió al agente");
  await page.getByRole("button",{name:"Límites por persona"}).click();
  assert((await budget().inputValue())==="15",prefix+"cuota del agente sobrescribió al usuario");
  await capture("consumo-dos-alcances");

  await open("S1","s1-inventory");
  assert(await page.getByRole("button",{name:"Administrar ejecución MCP"}).count()===0,prefix+"S1 anticipa MCP");
  await open("S4","s1-inventory");
  assert((await heading())==="Tools detectadas",prefix+"S4 convirtió catálogo en ejecución");
  assert(await page.getByRole("button",{name:"Administrar ejecución MCP"}).count()===1,prefix+"catálogo no enlaza ejecución");
  await (viewport.name==="desktop"?page.getByRole("button",{name:"consultar_ficha"}).first():page.getByRole("button",{name:"Revisar"}).first()).click();
  await page.getByRole("button",{name:"Simular cambio de esquema"}).click();
  assert((await content()).includes("v2"),prefix+"S4 perdió la versión de esquema del catálogo");
  await capture("catalogo-s4");
  await page.getByRole("button",{name:"Administrar ejecución MCP"}).click();
  assert((await heading())==="Ejecución por MCP",prefix+"catálogo no abrió ejecución");
  assert((await content()).includes("3 de 4"),prefix+"MCP inicial de muestra incorrecto");
  await capture("ejecucion-mcp");
  await page.getByRole("button",{name:"Volver al catálogo"}).click();
  assert((await heading())==="Tools detectadas"&&(await content()).includes("v2"),prefix+"retorno del MCP perdió catálogo o esquema");

  await open("S4","s0-connect");
  await page.getByRole("textbox",{name:"Nombre del agente"}).fill("aislado-"+viewport.name);
  await page.getByRole("textbox",{name:"Responsable"}).fill("Equipo QA");
  await page.getByRole("button",{name:"Registrar y emitir API key"}).click();
  await page.getByRole("button",{name:"He guardado la credencial"}).click();
  await page.getByRole("button",{name:"Administrar"}).last().click();
  assert((await content()).includes("aislado-"+viewport.name),prefix+"ficha ignora agente recién creado");
  await page.getByRole("button",{name:"Administrar ejecución MCP"}).click();
  assert((await content()).includes("0 de 4"),prefix+"agente nuevo heredó herramientas MCP ajenas");
  await selectAgent("agente-demo");
  assert((await content()).includes("3 de 4"),prefix+"agente base perdió configuración MCP");
  await selectAgent("aislado-"+viewport.name);
  assert((await content()).includes("0 de 4"),prefix+"selección de agente filtra mal herramientas");
  await capture("aislamiento-agentes");
  const over=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(over<=2,prefix+"desbordamiento horizontal "+over);
  assert(javascriptErrors.length===0,prefix+"errores JS: "+JSON.stringify(javascriptErrors));
  records.push({viewport:viewport.name,scenarios:6,jsErrors:javascriptErrors,horizontalOverflow:over});
  await page.close();
 }
}catch(e){errors.push("Excepción de la prueba: "+(e?.stack||String(e)));}
finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
 const report={passed:errors.length===0,failures:errors,records,contractChecks:16};
 await writeFile(output+"/report.json",JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(errors.length)process.exitCode=1;
}
