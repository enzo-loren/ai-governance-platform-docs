import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {evaluatePresetExample as evaluate,PRESET_DESCRIPTIONS,CONNECTION_SCENARIOS,presetRows} from "../src/console/preset-guide.js";
const output="artifacts/incremental-functional-qa/preset-guide";
await mkdir(output,{recursive:true});
let contract=0;
const eq=(args,outcome,reason)=>{const value=evaluate(args);assert.equal(value.outcome,outcome,reason);contract++};
assert.deepEqual(PRESET_DESCRIPTIONS.map(x=>x.value),["1","2","3"]);
assert.deepEqual(CONNECTION_SCENARIOS.map(x=>x.value),["A","A+C","A+B","A+B+C"]);
const base={approved:true,scenario:"A",principal:"solo_workload"};
eq({...base,preset:"1",kind:"lectura"},"Permitido","P1 lectura");
eq({...base,preset:"1",kind:"escritura"},"Permitido","P1 escritura");
eq({...base,preset:"1",kind:"destructiva_o_critica"},"Denegado","P1 destructiva");
eq({...base,preset:"1",kind:"sin_clasificar"},"Denegado","Sin clase");
eq({...base,preset:"1",kind:"lectura",approved:false},"Denegado","Sin aprobación");
eq({...base,preset:"2",kind:"lectura"},"Permitido","P2 lectura");
eq({...base,preset:"2",kind:"escritura"},"Denegado","P2 A sin identidad");
eq({...base,preset:"2",kind:"destructiva_o_critica"},"Denegado","P2 A sin MCP");
eq({...base,preset:"2",kind:"escritura",scenario:"A+B",principal:"operador"},"Denegado","P2 B sin C no inventa un usuario");
eq({...base,preset:"2",kind:"escritura",scenario:"A+C",principal:"consulta"},"Denegado","P2 rol consulta no escribe");
eq({...base,preset:"2",kind:"escritura",scenario:"A+C",principal:"operador"},"Permitido","P2 rol operador puede escribir");
eq({...base,preset:"2",kind:"destructiva_o_critica",scenario:"A+C",principal:"operador"},"Denegado","P2 C sin B no puede aprobar");
eq({...base,preset:"2",kind:"destructiva_o_critica",scenario:"A+B+C",principal:"consulta"},"Denegado","P2 rol lectura no puede destruir");
eq({...base,preset:"2",kind:"destructiva_o_critica",scenario:"A+B+C",principal:"operador"},"Requiere aprobación","P2 critica necesita aprobación");
eq({...base,preset:"2",kind:"destructiva_o_critica",scenario:"A+B+C",principal:"operador",approved:false},"Denegado","Tool no aprobada no llega a HITL");
eq({...base,preset:"3",kind:"lectura",scenario:"A+B+C",principal:"operador"},"Denegado","P3 sin permiso nominal bloquea");
eq({...base,preset:"3",kind:"escritura",scenario:"A+B+C",principal:"operador"},"Denegado","P3 sin permiso nominal bloquea escritura");
assert(presetRows({preset:"2",previousPreset:"1",scenario:"A+B+C",principal:"operador"}).some(x=>x.current?.outcome==="Denegado"&&x.candidate.outcome==="Requiere aprobación"));
const failures=[],records=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const server=spawn("python3",["-m","http.server","8891","--bind","127.0.0.1"],{stdio:"ignore"});
const url="http://127.0.0.1:8891/";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 let ready=false;
 for(let i=0;i<50;i++){try{ready=(await fetch(url)).ok}catch{}if(ready)break;await sleep(200);}
 if(!ready)throw Error("Servidor local no respondió");
 browser=await chromium.launch({headless:true});
 for(const vp of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  async function open(slice,screen){
   await page.goto(url+"assets/console.html?slice="+slice+"&screen="+screen,{waitUntil:"domcontentloaded"});
   await page.locator("#governance-root h1").first().waitFor({timeout:15000});
  }
  const content=()=>page.locator("#console-content").innerText();
  async function chooseOption(visible,optionName){
   const trigger=page.getByText(visible,{exact:true}).first();
   await trigger.click();
   await page.getByRole("option",{name:optionName}).first().click();
  }
  await open("S2","s2-activate");
  let text=await content();
  check(text.includes("Qué permite y bloquea este preset"),vp.name+" no explica preset");
  check(text.includes("Impacto real: sin datos medidos"),vp.name+" miente sobre datos medidos");
  check(text.includes("descubrimiento"),vp.name+" omite distinción de modo");
  check(!text.includes("3 de 12"),vp.name+" conserva conteo ficticio de POL-05");
  await page.screenshot({path:output+"/"+vp.name+"-preset1-inicial.png",fullPage:true});
  await chooseOption("1 · Caja Negra Segura",/2 · Operación Supervisada/);
  text=await content();
  check(text.includes("Estás comparando el Preset 1 con el Preset 2"),vp.name+" no compara actual contra candidato");
  check(text.includes("Sin identidad C, las escrituras quedan bloqueadas"),vp.name+" incumple advertencia sin C");
  check(text.includes("Requiere aprobación")||text.includes("Sin conexión B"),vp.name+" no explica B");
  await page.screenshot({path:output+"/"+vp.name+"-preset2-solo-A.png",fullPage:true});
  await chooseOption("Solo A · inferencia",/A\+B\+C/);
  await chooseOption("Sin usuario · solo_workload",/Usuario verificado · operador/);
  text=await content();
  check(text.includes("Requiere aprobación"),vp.name+" no explica aprobación para rol operador en B+C");
  check(text.includes("No se han reevaluado transacciones históricas"),vp.name+" confunde escenarios con evidencia");
  await page.screenshot({path:output+"/"+vp.name+"-preset2-ABC-operador.png",fullPage:true});
  await page.getByRole("button",{name:"Guardar configuración (demo)"}).click();
  text=await content();
  check(text.includes("2 · Operación Supervisada"),vp.name+" no guardó el preset del agente");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(overflow<=2,vp.name+" desbordamiento horizontal "+overflow);
  check(errors.length===0,vp.name+" errores JavaScript "+JSON.stringify(errors));
  records.push({viewport:vp.name,overflow,jsErrors:errors});
  await page.close();
 }
}catch(e){failures.push(String(e?.stack||e))}
finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
 const report={passed:failures.length===0,failures,contractCases:contract,records};
 await writeFile(output+"/report.json",JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(failures.length)process.exitCode=1;
}
