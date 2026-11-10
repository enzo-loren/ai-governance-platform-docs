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
eq({...base,preset:"2",kind:"escritura",scenario:"A+C",principal:"aprobador"},"Denegado","P2 rol aprobador no puede escribir con semilla inicial");
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

  async function chooseOption(visible,optionName){
   const trigger=page.getByText(visible,{exact:true}).first();
   await trigger.click();
   await page.getByRole("option",{name:optionName}).first().click();
  }
  await open("S2","s2-activate");
  let content=await page.locator("#console-content").innerText();
  check(content.includes("Preset de políticas"),vp.name+" falta selector de preset");
  check(!content.includes("Qué permite y bloquea este preset"),vp.name+" la guía larga sigue ocupando el formulario");
  check(!content.includes("Conexiones del ejemplo"),vp.name+" aparecen controles didácticos de laboratorio");
  check(!content.includes("Comparar los tres presets"),vp.name+" aparece una segunda pantalla de comparaciones");
  check(!content.includes("Impacto real: sin datos medidos"),vp.name+" se muestra impacto sin haber cambiado preset");
  const help=page.getByRole("button",{name:"¿Qué significa el preset de políticas?"});
  check(await help.count()===1,vp.name+" falta ayuda accesible junto al campo");
  if(await help.count()){
   const size=await help.evaluate(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}});
   check(size.w<=32&&size.h<=32,vp.name+" icono de ayuda es demasiado grande "+JSON.stringify(size));
   await help.click();
   const text=await page.locator("body").innerText();
   check(text.includes("¿Qué controla este preset?"),vp.name+" la ayuda no se abre");
   check(text.includes("1 · Caja Negra Segura")&&text.includes("2 · Operación Supervisada")&&text.includes("3 · Blindaje Estricto"),vp.name+" faltan descripciones de presets");
   check(text.includes("Las herramientas pendientes o sin clasificar"),vp.name+" falta advertencia de aprobación");
   const layer=await page.locator(".gov-preset-help-panel").evaluate(el=>{
    const container=el.closest(".gov-preset-help-popover");
    const rect=container?.getBoundingClientRect();
    const point=rect?document.elementFromPoint(rect.left+rect.width/2,rect.top+15):null;
    return {z:container?Number(getComputedStyle(container).zIndex):0,bg:getComputedStyle(container).backgroundColor,visible:container?.contains(point)};
   });
   check(layer.z>=10000&&layer.bg==="rgb(255, 255, 255)"&&layer.visible,vp.name+" ayuda queda detrás de la navegación o no es opaca: "+JSON.stringify(layer));
   await page.screenshot({path:output+"/"+vp.name+"-ayuda-preset-abierta.png",fullPage:true});
   check(await page.getByRole("dialog",{name:"¿Qué controla este preset?"}).isVisible(),vp.name+" la ayuda se cierra involuntariamente al desplazarse o capturar");
   await page.keyboard.press("Escape");
  }
  await page.screenshot({path:output+"/"+vp.name+"-selector-limpio.png",fullPage:true});
  await chooseOption("1 · Caja Negra Segura",/2 · Operación Supervisada/);
  content=await page.locator("#console-content").innerText();
  check(content.includes("Para escribir se necesita un usuario autorizado"),vp.name+" no se explica requisito de C");
  check(content.includes("aprobación por MCP (B)"),vp.name+" no se explica requisito de B");
  check(content.includes("No hay datos suficientes para estimar"),vp.name+" se inventó impacto de POL-05");
  check(!content.includes("Conexiones del ejemplo"),vp.name+" guía extensa reaparece al cambiar preset");
  await page.screenshot({path:output+"/"+vp.name+"-cambio-preset2.png",fullPage:true});
  await page.getByRole("button",{name:"Guardar configuración (demo)"}).click();
  content=await page.locator("#console-content").innerText();
  check(content.includes("Preset de políticas"),vp.name+" se perdió el campo al guardar");
  check(!content.includes("No hay datos suficientes para estimar"),vp.name+" persiste advertencia de cambios no guardados");
  await page.screenshot({path:output+"/"+vp.name+"-preset2-guardado.png",fullPage:true});
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
