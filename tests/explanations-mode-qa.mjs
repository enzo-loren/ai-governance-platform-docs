import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,readFile} from "node:fs/promises";
const assetVersion=JSON.parse(await readFile("assets/console-build/version.json","utf8")).version;

const base="http://127.0.0.1:8877/";
const output="artifacts/explanations-mode";
await mkdir(output,{recursive:true});
const server=spawn("python3",["-m","http.server","8877","--bind","127.0.0.1"],{stdio:"ignore"});
const failures=[],results=[];
const check=(ok,message)=>{if(!ok)failures.push(message)};
const viewports=[{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}];
let browser;
async function waitReady(){
 for(let k=0;k<40;k++){
  try{if((await fetch(base)).ok)return}catch{}
  await new Promise(ok=>setTimeout(ok,300));
 }
 throw Error("No se pudo iniciar el servidor local");
}
async function checkPageErrors(page,context){
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 return ()=>check(!errors.length,context+" errores JS "+JSON.stringify(errors));
}
async function waitPreview(page){
 const frame=page.locator(".screen-card iframe.cloudscape-preview").first();
 await frame.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{
  const iframe=document.querySelector("iframe.cloudscape-preview");
  return iframe?.contentDocument?.querySelector("#governance-root h1")!=null;
 },{timeout:20000});
}
try{
 await waitReady();
 browser=await chromium.launch({headless:true});
 for(const viewport of viewports){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
  const verifyErrors=await checkPageErrors(page,viewport.name);
  await page.goto(base,{waitUntil:"domcontentloaded"});
  await page.locator('[data-stage="S0"]').waitFor();
  const button=page.getByRole("button",{name:"Mostrar explicaciones"});
  check(await button.getAttribute("aria-pressed")==="false",viewport.name+" roadmap: estado inicial");
  check(await page.locator(".hero-note").isHidden(),viewport.name+" roadmap: anotación visible por defecto");
  check(await page.locator(".stage-promise").isHidden(),viewport.name+" roadmap: promesa visible por defecto");
  check(await page.locator(".project-note").isHidden(),viewport.name+" roadmap: nota técnica visible por defecto");
  await page.locator('[data-stage="S4"]').click();
  check(await page.locator(".screen-card").count()===3,viewport.name+" roadmap S4: 3 vistas");
  await waitPreview(page);
  const preview=page.locator("iframe.cloudscape-preview").first();
  check(await preview.evaluate(el=>!el.contentDocument.querySelector(".prototype-controls")),viewport.name+" la vista previa muestra controles de prototipo");
  await page.screenshot({path:output+"/"+viewport.name+"-roadmap-limpio.png",fullPage:true});

  await page.getByRole("button",{name:"Mostrar explicaciones"}).click();
  check(await page.getByRole("button",{name:"Ocultar explicaciones"}).getAttribute("aria-pressed")==="true",viewport.name+" roadmap: no activa ayuda");
  check(await page.locator(".hero-note").isVisible(),viewport.name+" roadmap: no muestra contexto");
  check(await page.locator(".stage-promise").isVisible(),viewport.name+" roadmap: no muestra subtítulo");
  check(await page.locator(".project-note").isVisible(),viewport.name+" roadmap: no muestra explicación módulo B");
  check(new URL(page.url()).searchParams.get("explain")==="1",viewport.name+" roadmap: ayuda no compartible");
  const href=await page.locator(".screen-card .open-screen").first().getAttribute("href");
  check(href.includes("explain=1"),viewport.name+" roadmap: enlace no propaga modo");
  await waitPreview(page);
  await page.screenshot({path:output+"/"+viewport.name+"-roadmap-explicaciones.png",fullPage:true});

  await page.locator(".screen-card .open-screen").first().click();
  await page.locator("#governance-root h1").first().waitFor({timeout:15000});
  check(page.url().includes("slice=S4")&&page.url().includes("explain=1"),viewport.name+" consola: enlace equivocado");
  let switcher=page.locator(".explanations-switch input[type=checkbox]");
  check(await switcher.isChecked(),viewport.name+" consola: el modo no se hereda");
  check(await page.getByRole("button",{name:"¿Qué muestra?"}).count()===1,viewport.name+" consola: no muestra ayuda contextual");
  check(await page.locator(".prototype-footer").isVisible(),viewport.name+" consola: no muestra fuentes al activar explicaciones");
  await page.screenshot({path:output+"/"+viewport.name+"-consola-explicaciones.png",fullPage:true});

  await page.getByText("Mostrar explicaciones",{exact:true}).click();
  check(!await switcher.isChecked(),viewport.name+" consola: ayuda no desactivada");
  check(await page.getByRole("button",{name:"¿Qué muestra?"}).count()===0,viewport.name+" consola: explicación quedó visible");
  check(await page.locator(".prototype-footer").count()===0,viewport.name+" consola: pie verboso visible");
  check(new URL(page.url()).searchParams.get("explain")===null,viewport.name+" consola: URL conserva ayuda desactivada");
  check(await page.getByText("DEMO · Sin conexión AWS",{exact:true}).count()===1,viewport.name+" consola: advertencia demo ausente");
  await page.screenshot({path:output+"/"+viewport.name+"-consola-limpia.png",fullPage:true});

  await page.getByText("Ver roadmap",{exact:true}).click();
  await page.locator('[data-stage="S4"]').waitFor();
  check(await page.getByRole("button",{name:"Mostrar explicaciones"}).getAttribute("aria-pressed")==="false",viewport.name+" regreso a portada no preserva modo limpio");
  await page.getByRole("button",{name:"Mostrar explicaciones"}).click();
  await page.locator(".screen-card .open-screen").first().click();
  await page.locator("#governance-root h1").first().waitFor();
  check(await page.locator(".explanations-switch input[type=checkbox]").isChecked(),viewport.name+" activación repetida no funciona");

  // Al volver a una nueva visita limpia, la ayuda NO persiste de forma sorprendente.
  await page.goto(base+"assets/console.html?slice=S5&screen=s5-approvals",{waitUntil:"domcontentloaded"});
  await page.locator("#governance-root h1").first().waitFor();
  check(!await page.locator(".explanations-switch input[type=checkbox]").isChecked(),viewport.name+" visita nueva activa ayuda por defecto");
  check(await page.getByText("Elena · aprobadora",{exact:true}).count()>0,viewport.name+" desapareció la identidad de aprobación");
  const pending=await page.getByRole("button",{name:"Aprobar (demo)"}).count();
  check(pending>0,viewport.name+" desaparece acción esencial de aprobación");
  await page.getByRole("button",{name:"Aprobar (demo)"}).click();
  check(await page.getByText("Esta acción modifica solo los datos de muestra",{exact:false}).count()>0,
    viewport.name+" el modo limpio oculta una confirmación de seguridad");

  // Regresión reportada por el usuario: al abrir directamente Ruta forense S6
  // deben verse título de producto y el interruptor; nunca la vieja pregunta.
  const scriptRequests=[];
  const watchScript=request=>{
    const url=new URL(request.url());
    if(url.pathname.endsWith("/assets/console-build/app.js"))scriptRequests.push(url.searchParams.get("v"));
  };
  page.on("request",watchScript);
  await page.goto(base+"assets/console.html?slice=S6&screen=s6-forensic&v="+assetVersion,{waitUntil:"domcontentloaded"});
  await page.locator("#governance-root h1").first().waitFor({timeout:12000});
  check(scriptRequests.length>=1 && scriptRequests.every(v=>v===assetVersion),
    viewport.name+" S6: JavaScript del bundle cargado sin huella actual: "+JSON.stringify(scriptRequests));
  page.off("request",watchScript);
  check((await page.locator("#governance-root h1").first().textContent()).trim()==="Ruta forense",
    viewport.name+" S6: sigue mostrando pregunta antigua en lugar del título");
  const s6Toggle=page.locator(".explanations-switch input[type=checkbox]");
  check(await s6Toggle.isVisible(),viewport.name+" S6: el interruptor no es visible");
  check(!await s6Toggle.isChecked(),viewport.name+" S6: no inicia limpio");
  check(await page.getByRole("button",{name:"¿Qué muestra?"}).count()===0,
    viewport.name+" S6: el botón contextual aparece sin pedirlo");
  check(await page.locator(".prototype-footer").count()===0,
    viewport.name+" S6: aparecen requisitos al iniciar");
  await page.screenshot({path:output+"/"+viewport.name+"-s6-forense-limpia.png",fullPage:true});
  await page.getByText("Mostrar explicaciones",{exact:true}).click();
  check(await s6Toggle.isChecked(),viewport.name+" S6: el interruptor no activa explicaciones");
  check(await page.getByRole("button",{name:"¿Qué muestra?"}).count()===1,
    viewport.name+" S6: faltan ayudas tras activar el interruptor");
  check(await page.locator(".prototype-footer").count()===1,
    viewport.name+" S6: faltan fuentes tras activar el interruptor");
  await page.screenshot({path:output+"/"+viewport.name+"-s6-forense-explicaciones.png",fullPage:true});

  results.push({viewport:viewport.name,roadmapToggle:true,consoleToggle:true,deepLinks:true,cleanDefault:true,forensicS6:true,protectedConfirmations:true});
  verifyErrors();
  await page.close();
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
await writeFile(output+"/report.json",JSON.stringify({passed:failures.length===0,failures,results},null,2));
console.log("Explain mode QA: "+results.length+" viewports, "+failures.length+" fallas.");
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
