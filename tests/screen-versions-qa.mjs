import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {readFile,mkdir,writeFile} from "node:fs/promises";

const base="http://127.0.0.1:8877/";
const output="artifacts/screen-versions-qa";
await mkdir(output,{recursive:true});
const data=JSON.parse(await readFile("assets/console-data.json","utf8"));
const stageIndex=id=>data.stages.findIndex(s=>s.id===id);
const stageName=id=>data.stages.find(s=>s.id===id)?.name;
const versions=surface=>data.screens
 .filter(screen=>screen.surface===surface)
 .sort((a,b)=>stageIndex(a.slice)-stageIndex(b.slice));
const errors=[],results=[];
const check=(condition,message)=>{if(!condition)errors.push(message)};
const server=spawn("python3",["-m","http.server","8877","--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
async function ready(){
 for(let i=0;i<45;i++){
  try{if((await fetch(base)).ok)return}catch{}
  await new Promise(done=>setTimeout(done,250));
 }
 throw Error("HTTP local no disponible");
}
const url=(s)=>base+"assets/console.html?slice="+s.slice+"&screen="+s.id;
async function pageReady(page){
 await page.locator("#governance-root h1").first().waitFor({timeout:12000});
}
async function verifyChrome(page,screen,viewport){
 check(await page.getByText("Consola · Módulo A",{exact:true}).count()===0,
  viewport+" "+screen.id+" muestra la navegación lateral");
 check(await page.locator('a[href^="?slice="]').count()===0,
  viewport+" "+screen.id+" conserva enlaces del menú de otras pantallas");
 const menuButtons=await page.locator('button[aria-label]').evaluateAll(nodes=>nodes.filter(el=>{
  const label=el.getAttribute("aria-label")||"";
  const visible=!!el.getClientRects().length;
  return visible&&/(open|show|abrir|mostrar).*(navigation|navegación)|(?:menu|menú) de navegación/i.test(label);
 }).map(el=>el.getAttribute("aria-label")));
 check(menuButtons.length===0,viewport+" "+screen.id+" conserva hamburguesa "+JSON.stringify(menuButtons));
 check(await page.getByRole("link",{name:"Volver a slices"}).count()===1,
  viewport+" "+screen.id+" no presenta regreso al roadmap");
 check(await page.locator("#governance-root h1").first().textContent()===screen.title,
  viewport+" "+screen.id+" título no corresponde a versión solicitada");
 check(await page.getByText("DEMO · Sin conexión AWS",{exact:true}).count()===1,
  viewport+" "+screen.id+" falta identificación del entorno simulado");
 check(await page.getByText("Mostrar explicaciones",{exact:true}).count()===1,
  viewport+" "+screen.id+" falta interruptor de explicaciones");
 check(await page.locator(".prototype-footer").count()===0,
  viewport+" "+screen.id+" muestra pie técnico sin solicitarlo");
 const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 check(over<6,viewport+" "+screen.id+" scroll horizontal inesperado "+over);
}
try{
 await ready();browser=await chromium.launch({headless:true});
 for(const vp of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const exceptions=[];
  page.on("pageerror",e=>exceptions.push(e.message));
  for(const screen of data.screens){
   await page.goto(url(screen),{waitUntil:"domcontentloaded"});
   await pageReady(page);
   await verifyChrome(page,screen,vp.name);
   const siblings=versions(screen.surface);
   const selector=page.getByTestId("screen-version-selector");
   const singleton=page.getByTestId("screen-version-static");
   if(siblings.length===1){
    check(await selector.count()===0,vp.name+" "+screen.id+" presenta un selector inútil");
    check(await singleton.count()===1,vp.name+" "+screen.id+" no identifica su slice único");
    check((await singleton.innerText()).includes(screen.slice),
      vp.name+" "+screen.id+" etiqueta de slice incorrecta");
   }else{
    check(await selector.count()===1,vp.name+" "+screen.id+" no tiene selector de versiones");
    check(await singleton.count()===0,vp.name+" "+screen.id+" muestra etiqueta en lugar de selector");
    const trigger=selector.locator("button,[role=combobox]").first();
    check(await trigger.count()===1,vp.name+" "+screen.id+" selector Cloudscape no interactivo");
    if(await trigger.count()){
     await trigger.click();
     const options=page.locator('[role="option"]');
     const available=await options.allTextContents();
     const expected=siblings.map(s=>s.slice+" · "+stageName(s.slice));
     check(available.length===expected.length,
      vp.name+" "+screen.id+" opciones "+JSON.stringify(available)+"; esperado "+JSON.stringify(expected));
     for(const x of expected){
      check(available.some(actual=>actual.includes(x)),
       vp.name+" "+screen.id+" falta versión "+x);
     }
     const other=siblings.find(x=>x.id!==screen.id);
     const otherLabel=other.slice+" · "+stageName(other.slice);
     const target=options.filter({hasText:otherLabel}).first();
     check(await target.count()===1,vp.name+" "+screen.id+" no puede elegir "+otherLabel);
     if(await target.count()){
      await target.click();
      await page.waitForFunction(title=>document.querySelector("#governance-root h1")?.textContent===title,other.title);
      check(new URL(page.url()).searchParams.get("screen")===other.id,
       vp.name+" "+screen.id+" cambio a "+other.id+" no actualiza URL");
      check(new URL(page.url()).searchParams.get("slice")===other.slice,
       vp.name+" "+screen.id+" cambio de versión no actualiza slice");
      await page.goBack({waitUntil:"domcontentloaded"});
      await page.waitForFunction(title=>document.querySelector("#governance-root h1")?.textContent===title,screen.title);
      check((await page.locator("#governance-root h1").first().textContent())===screen.title,
       vp.name+" "+screen.id+" el historial no restaura la pantalla original");
     }
    }
   }
   // Capturar todas las vistas y ambas dimensiones; permite detectar truncamientos internos.
   await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
   await page.waitForTimeout(80);
   await page.screenshot({path:output+"/"+vp.name+"-"+screen.id+".png",fullPage:true});
   results.push({viewport:vp.name,screen:screen.id,slice:screen.slice,versions:siblings.map(x=>x.slice),hasSelector:siblings.length>1});
  }
  // Vista acumulada: abrir una versión anterior no debe forzar a mostrar otra pantalla.
  await page.goto(base+"assets/console.html?slice=S6&screen=s1-inventory",{waitUntil:"domcontentloaded"});
  await pageReady(page);
  check(await page.locator("#governance-root h1").first().textContent()==="Tools por MCP",
   vp.name+" acumulado no resuelve la versión vigente de la misma superficie");
  check(await page.getByTestId("screen-version-selector").count()===1,
   vp.name+" el acumulado rompe versiones de Tools");

  // Modo vista previa, sin controles ni navegación lateral.
  await page.goto(base+"assets/console.html?slice=S6&screen=s6-forensic&preview=1",{waitUntil:"domcontentloaded"});
  await pageReady(page);
  check(await page.locator(".prototype-controls").count()===0,
   vp.name+" preview muestra controles editoriales");
  check(await page.getByText("Consola · Módulo A",{exact:true}).count()===0,
   vp.name+" preview sigue mostrando el explorador lateral");
  check(exceptions.length===0,vp.name+" errores JS "+JSON.stringify(exceptions));
  await page.close();
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
await writeFile(output+"/report.json",JSON.stringify({passed:errors.length===0,failures:errors,results},null,2));
console.log("QA screen-only: "+results.length+" vistas; errores "+errors.length);
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
