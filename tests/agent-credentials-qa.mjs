import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
const base="http://127.0.0.1:8877/";
const output="artifacts/agent-security-qa";
await mkdir(output,{recursive:true});
const server=spawn("python3",["-m","http.server","8877","--bind","127.0.0.1"],{stdio:"ignore"});
const failures=[],records=[];
const check=(cond,msg)=>{if(!cond)failures.push(msg)};
let browser;
async function ready(){for(let i=0;i<45;i++){try{if((await fetch(base)).ok)return}catch{}await new Promise(r=>setTimeout(r,250))}throw Error("Sin servidor local")}
const goto=(page,slice,screen)=>page.goto(base+"assets/console.html?slice="+slice+"&screen="+screen,{waitUntil:"domcontentloaded"});
async function keyFromModal(page){
 await page.getByText("Credencial emitida · una sola visualización",{exact:true}).waitFor();
 const input=page.locator('input[type="password"]').first();
 await input.waitFor();
 const key=await input.inputValue();
 check(key.startsWith("gov_demo_"),"No se emite clave distinta de un token de demo");
 await page.screenshot({path:output+"/emision-oculta.png",fullPage:true});
 await page.getByRole("button",{name:"He guardado la credencial"}).click();
 check(await page.locator('input[value="'+key+'"]').count()===0,"La key sigue en DOM después de cerrar su revelación");
 return key;
}
try{
 await ready();browser=await chromium.launch({headless:true});
 for(const vp of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
  const js=[];
  page.on("pageerror",e=>js.push(e.message));
  await goto(page,"S0","s0-connect");await page.getByRole("button",{name:"Registrar y emitir API key"}).waitFor();
  check(await page.getByRole("button",{name:"Administrar"}).count()===0,vp.name+" S0 anticipa operación de S2");
  await goto(page,"S2","s0-connect");
  check(await page.getByText("Agentes registrados").count()===1,vp.name+" no muestra registro");
  check(await page.locator('input[value^="gov_demo_"]').count()===0,vp.name+" expone key antes del alta");
  check(await page.getByRole("button",{name:"Registrar y emitir API key"}).isDisabled(),vp.name+" acepta agente sin nombre/responsable");
  const create=async(name,owner)=>{
   await page.getByRole("textbox",{name:"Nombre del agente"}).fill(name);
   await page.getByRole("textbox",{name:"Responsable"}).fill(owner);
   await page.getByRole("button",{name:"Registrar y emitir API key"}).click();
   return await keyFromModal(page);
  };
  const keyA=await create("agente-ventas","Equipo ventas");
  const keyB=await create("agente-soporte","Equipo soporte");
  check(keyA!==keyB,vp.name+" dos agentes recibieron la misma API key");
  check((await page.locator("#console-content").innerText()).includes("agente-ventas")&&
        (await page.locator("#console-content").innerText()).includes("agente-soporte"),
        vp.name+" registro no enumera ambos agentes");
  await page.screenshot({path:output+"/"+vp.name+"-registro-aislado.png",fullPage:true});

  // La ficha es una pantalla distinta del listado; seleccionar conserva el registro.
  check(await page.getByTestId("screen-version-selector").count()===0,vp.name+" la ficha no es versión del listado");
  await page.getByRole("button",{name:"Administrar"}).last().click();
  await page.locator("#governance-root h1").first().waitFor();
  check(await page.locator("#governance-root h1").first().textContent()==="Control del agente",vp.name+" no abre la ficha individual");
  check((await page.locator("#console-content").innerText()).includes("agente-soporte"),vp.name+" perdió agente seleccionado");
  check((await page.locator("#console-content").innerText()).includes("1 de 2 durante rotación"),vp.name+" no muestra el total de claves actuales");
  await page.screenshot({path:output+"/"+vp.name+"-credenciales-S2.png",fullPage:true});

  await page.getByRole("button",{name:"Rotar API key"}).click();
  const rotated=await keyFromModal(page);
  check(rotated!==keyA&&rotated!==keyB,vp.name+" rotación reutiliza una key");
  check((await page.locator("#console-content").innerText()).includes("2 de 2 durante rotación"),vp.name+" rotación invalida la key antigua");
  check(await page.getByRole("button",{name:"Rotar API key"}).isDisabled(),vp.name+" permite más de dos claves vigentes");

  // Se revoca UNA clave en este agente; no todas ni otro agente.
  const revokeButtons=page.getByRole("button",{name:/^Revocar(?: API key)?$/});
  await revokeButtons.first().click();
  await page.getByText("Confirmar revocación de API key",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Revocar clave (demo)"}).click();
  check((await page.locator("#console-content").innerText()).includes("1 de 2 durante rotación"),vp.name+" revocación incorrecta");
  await page.screenshot({path:output+"/"+vp.name+"-rotacion-revocacion.png",fullPage:true});

  // Cambiar el agente no debe compartir claves ni modo.
  const switcher=page.locator(".gov-agent-picker").locator("button,[role=combobox]").first();
  await switcher.click();
  await page.getByRole("option",{name:"agente-ventas"}).click();
  check((await page.locator("#console-content").innerText()).includes("Equipo ventas"),vp.name+" no selecciona primer agente");
  check((await page.locator("#console-content").innerText()).includes("1 de 2 durante rotación"),vp.name+" clave del primer agente fue revocada por accidente");
  await page.getByRole("button",{name:"Suspender agente"}).click();
  await page.getByRole("button",{name:"Confirmar (demo)"}).click();
  check((await page.locator("#console-content").innerText()).includes("Agente suspendido:"),vp.name+" suspensión no aplicada");
  await switcher.click();
  await page.getByRole("option",{name:"agente-soporte"}).click();
  check((await page.locator("#console-content").innerText()).includes("Descubrimiento"),vp.name+" suspender agente-ventas cambió el modo de soporte");

  // Retirar debe revocar todas sus claves y bloquear cualquier reemisión.
  await page.getByRole("button",{name:"Retirar agente"}).click();
  await page.getByRole("button",{name:"Confirmar (demo)"}).click();
  check(await page.getByRole("button",{name:"Emitir API key"}).isDisabled(),vp.name+" el agente retirado permite crear credenciales");
  check((await page.locator("#console-content").innerText()).includes("Agente retirado"),vp.name+" falta estado retirado");

  // La guía no puede volver a exponer la misma key reutilizada ni claves reveladas.
  await goto(page,"S4","s4-guide");await page.getByRole("tab",{name:"A · Inferencia"}).waitFor();
  const guideHtml=await page.content();
  check(!guideHtml.includes(keyA)&&!guideHtml.includes(keyB)&&!guideHtml.includes(rotated),
   vp.name+" la guía reexpuso credenciales tras cerrar el modal");
  check(guideHtml.includes("AGENT_TOKEN_DE_"),vp.name+" la guía no distingue el agente");
  await page.getByRole("tab",{name:"B · MCP"}).click();
  check((await page.locator("#console-content").innerText()).includes("Mismo agent_token de A"),vp.name+" guía MCP sugiere otro token");
  await page.getByRole("tab",{name:"C · Usuario"}).click();
  check((await page.locator("#console-content").innerText()).includes("JWT OIDC"),vp.name+" guía no distingue C del agente");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  check(overflow<6,vp.name+" scroll horizontal "+overflow);
  check(js.length===0,vp.name+" excepciones JS: "+JSON.stringify(js));
  records.push({viewport:vp.name,distinctKeys:true,oneTime:true,rotation:true,isolation:true,retirement:true,guide:true,jsErrors:js.length});
  await page.close();
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
await writeFile(output+"/report.json",JSON.stringify({passed:failures.length===0,failures,records},null,2));
console.log("Agent credential security UI:",records.length,"viewports,",failures.length,"failures");
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
