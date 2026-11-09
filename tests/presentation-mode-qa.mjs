import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";

const base="http://127.0.0.1:8877/";
const output="artifacts/presentation-qa";
await mkdir(output,{recursive:true});
const screens=[
 ["S0","s0-connect","Un agente, una identidad"],
 ["S0","s0-live","Qué ocurre en cada solicitud"],
 ["S1","s1-coverage","Hasta dónde llega el control"],
 ["S1","s1-shadow","La regla observa antes de bloquear"],
 ["S2","s2-activate","Del descubrimiento al control"],
 ["S5","s5-approvals","Una operación crítica necesita a otra persona"],
 ["S6","s6-forensic","Reconstruir una decisión"]
];
const contexts=[
 {name:"1080p",width:1920,height:1080},
 {name:"desktop",width:1366,height:768},
 {name:"mobile",width:390,height:844}
];
const failures=[],records=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};
const server=spawn("python3",["-m","http.server","8877","--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
async function waitServer(){
 for(let i=0;i<50;i++){
  try{if((await fetch(base)).ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 throw Error("Servidor HTTP local inaccesible");
}
const url=(slice,screen)=>base+"assets/console.html?slice="+slice+"&screen="+screen;
async function scene(page){
 const el=page.getByTestId("presentation-stage");
 await el.waitFor({state:"visible",timeout:10000});
 return el;
}
try{
 await waitServer();
 browser=await chromium.launch({headless:true});
 for(const viewport of contexts){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
  const pageErrors=[];page.on("pageerror",err=>pageErrors.push(err.message));
  for(const [slice,id,title] of screens){
   await page.goto(url(slice,id),{waitUntil:"domcontentloaded"});
   await page.getByRole("button",{name:"Modo presentación"}).waitFor();
   check(await page.getByTestId("presentation-stage").count()===0,viewport.name+"/"+id+" inicia en presentación");
   await page.getByRole("button",{name:"Modo presentación"}).click();
   const root=await scene(page);
   check(await page.getByRole("heading",{name:title,exact:true}).count()===1,viewport.name+"/"+id+" título de escena incorrecto");
   check(await page.getByText("DEMO · Datos sintéticos",{exact:true}).count()===1,viewport.name+"/"+id+" falta aviso DEMO");
   check(await page.locator(".prototype-controls").count()===0,viewport.name+"/"+id+" todavía presenta la consola operativa");
   check(await page.locator("#console-top").count()===0,viewport.name+"/"+id+" sigue la navegación del producto");
   check(await root.locator(".gov-present-metric").count()===3,viewport.name+"/"+id+" no tiene tres datos esenciales");
   check(await root.getByRole("button",{name:"Siguiente"}).count()===1,viewport.name+"/"+id+" recorrido no es interactivo");
   const dimensions=await page.evaluate(()=>{
    const bounds=(selector)=>{
     const r=document.querySelector(selector)?.getBoundingClientRect();
     return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null;
    };
    return {
     viewport:{w:innerWidth,h:innerHeight},
     page:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
     shell:bounds(".gov-present-shell"),
     lastMetric:bounds(".gov-present-metric:last-child"),
     footer:bounds(".gov-present-bottom"),
     signal:bounds(".gov-present-signal")
    };
   });
   check(dimensions.page.width<=viewport.width+5,viewport.name+"/"+id+" desbordamiento horizontal "+JSON.stringify(dimensions));
   check(dimensions.signal&&dimensions.signal.width>150,viewport.name+"/"+id+" panel de resultado ilegible");
   if(viewport.name==="1080p"){
    check(dimensions.page.height<=viewport.height+15,viewport.name+"/"+id+" necesita scroll vertical en pantalla 1080p ("+dimensions.page.height+")");
    check(dimensions.footer?.bottom<=viewport.height+12,viewport.name+"/"+id+" navegación fuera del área visible");
   }
   if(id==="s2-activate"){
    check(await page.getByText("3 de 12",{exact:true}).count()===1,viewport.name+" S2 no muestra impacto ilustrativo");
    await page.getByRole("button",{name:"Siguiente"}).click();
    check(await page.getByRole("heading",{name:"La decisión pasa a ser exigible"}).count()===1,viewport.name+" S2 no expone cambio a modo activo");
    check(await page.getByText("503",{exact:true}).count()===1,viewport.name+" S2 no hace visible fail-closed");
    await page.getByRole("button",{name:"Siguiente"}).click();
    check(await page.getByRole("heading",{name:"Se detiene ese agente, no todos"}).count()===1,viewport.name+" S2 no ilustra Kill Switch individual");
    check(await page.getByText("≤ 60 s",{exact:true}).count()===1,viewport.name+" S2 no indica objetivo de suspensión");
    await page.screenshot({path:output+"/"+viewport.name+"-s2-suspension.png",fullPage:true});
    await page.getByRole("button",{name:"Volver al inicio"}).click();
    check(await page.getByRole("heading",{name:"Entendemos el impacto sin bloquear"}).count()===1,viewport.name+" S2 no vuelve a primera etapa");
   }else{
    await root.getByRole("button",{name:"Siguiente"}).click();
    check(await root.locator(".gov-present-step.is-active").count()===1,viewport.name+"/"+id+" sin cambio de etapa");
    await root.getByRole("button",{name:"Anterior"}).click();
   }
   await page.screenshot({path:output+"/"+viewport.name+"-"+id+".png",fullPage:true});
   if(viewport.name==="1080p"&&id==="s0-live"){
    // Elegir pasos manualmente pausa la rotación; reanudar antes de probar pausa.
    if(await page.getByRole("button",{name:"Reanudar"}).count()){
     await page.getByRole("button",{name:"Reanudar"}).click();
    }
    await page.getByRole("button",{name:"Pausar"}).click();
    const before=await page.locator(".gov-present-feature h2").textContent();
    await page.waitForTimeout(4800);
    const after=await page.locator(".gov-present-feature h2").textContent();
    check(before===after,"Flujo en pausa avanzó automáticamente");
    await page.getByRole("button",{name:"Reanudar"}).click();
    await page.waitForFunction(title=>document.querySelector(".gov-present-feature h2")?.textContent!==title,before,{timeout:5500});
   }
   await page.keyboard.press("Escape");
   check(await page.getByTestId("presentation-stage").count()===0,viewport.name+"/"+id+" Escape no vuelve a la consola");
   check(await page.locator(".prototype-controls").count()===1,viewport.name+"/"+id+" no restaura controles operativos");
   check(await page.getByRole("heading",{name:title,exact:true}).count()===0,viewport.name+"/"+id+" al cerrar conserva el título de la escena");
   check(await page.getByText("DEMO · Sin conexión AWS",{exact:true}).count()===1,viewport.name+"/"+id+" no restaura el aviso de prototipo");
   records.push({viewport:viewport.name,screen:id,title,stages:await page.locator(".gov-present-step").count(),horizontalOverflow:dimensions.page.width-viewport.width,vertical1080p:dimensions.page.height});
  }
  // No se presenta en vistas ajenas a CON-08 ni dentro del iframe de portada.
  await page.goto(url("S4","s4-policy"),{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Constructor de reglas"}).waitFor();
  check(await page.getByRole("button",{name:"Modo presentación"}).count()===0,viewport.name+" modo presentación se muestra en vista no contemplada");
  await page.goto(url("S2","s2-activate")+"&preview=1",{waitUntil:"domcontentloaded"});
  await page.locator("#governance-root h1").first().waitFor();
  check(await page.getByRole("button",{name:"Modo presentación"}).count()===0,viewport.name+" preview ofrece modo presentación");
  check(pageErrors.length===0,viewport.name+" errores JS "+JSON.stringify(pageErrors));
  await page.close();
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
await writeFile(output+"/report.json",JSON.stringify({passed:failures.length===0,failures,records},null,2));
console.log("CON-08 presentation QA: "+records.length+" scenes, "+failures.length+" failures");
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
