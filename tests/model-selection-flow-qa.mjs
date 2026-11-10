import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {getModelCatalog,initialAllowedModelIds,allowedModelOptions} from "../src/console/model-catalog.js";

const output="artifacts/incremental-functional-qa/model-selection-flow";
await mkdir(output,{recursive:true});
const failures=[],records=[];
const check=(ok,message)=>{if(!ok)failures.push(message);};

const withSimulated=getModelCatalog(true);
const withoutSimulated=getModelCatalog(false);
check(withSimulated.length===3&&withoutSimulated.length===2,"El simulado no está condicionado por habilitación");
check(withoutSimulated.every(x=>x.value!=="simulado"),"Simulado aparece con habilitación desactivada");
check(withSimulated.some(x=>x.label==="GPT-6 Luna (DEMO)")&&withSimulated.some(x=>x.label==="Claude 5.5 Haiku (DEMO)"),"Faltan los modelos ilustrativos solicitados");
check(initialAllowedModelIds(withSimulated).length===3,"Por defecto no se autorizan todos los modelos habilitados");
check(allowedModelOptions(withoutSimulated,["demo-gpt-6-luna"]).length===1,"Selección de modelos no respeta catálogo");

const base="http://127.0.0.1:8886/";
const server=spawn("python3",["-m","http.server","8886","--bind","127.0.0.1"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 let online=false;
 for(let i=0;i<50;i++){try{online=(await fetch(base)).ok;}catch{}if(online)break;await sleep(200);}
 if(!online)throw Error("Servidor local no inicia");
 browser=await chromium.launch({headless:true});
 for(const vp of [{name:"desktop",width:1440,height:900},{name:"tablet",width:820,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
  const jsErrors=[];
  page.on("pageerror",err=>jsErrors.push(err.message));
  async function open(slice,screen){await page.goto(base+"assets/console.html?slice="+slice+"&screen="+screen,{waitUntil:"domcontentloaded"});await page.locator("#governance-root h1").first().waitFor({timeout:20000});}
  const content=()=>page.locator("#console-content").innerText();

  await open("S2","s0-connect");
  const initial=await content();
  check(initial.includes("Modelos autorizados"),vp.name+" mantiene el campo singular anterior");
  check(initial.includes("GPT-6 Luna (DEMO)")&&initial.includes("Claude 5.5 Haiku (DEMO)"),vp.name+" no muestra modelos con nombres específicos");
  check(!initial.includes("Modelo del catálogo A")&&!initial.includes("Modelo del catálogo B"),vp.name+" aún muestra catálogo genérico");
  const select=page.locator('[aria-label="Modelos autorizados"]').first();
  check(await select.count()===1,vp.name+" falta control multiselección accesible");
  await page.screenshot({path:output+"/"+vp.name+"-alta-multimodelo.png",fullPage:true});

  if(await select.count()){
   await select.click();
   const option=page.getByRole("option",{name:/Claude 5\.5 Haiku/}).first();
   if(await option.count()){
    await option.click();
    // La otra opción continua autorizada: una selección individual no debe reemplazar toda la lista.
    check((await content()).includes("GPT-6 Luna (DEMO)"),vp.name+" selección múltiple borró GPT-6 Luna");
   }else{
    check(false,vp.name+" no se puede deseleccionar un modelo en multiselect");
   }
  }

  await page.getByRole("textbox",{name:"Nombre del agente"}).fill("catalogo-"+vp.name);
  await page.getByRole("textbox",{name:"Responsable"}).fill("Equipo QA");
  await page.getByRole("button",{name:"Registrar y emitir API key"}).click();
  await page.getByRole("button",{name:"He guardado la credencial"}).click();
  await page.getByRole("button",{name:"Administrar"}).last().click();
  check((await page.locator("#governance-root h1").first().textContent())==="Control del agente",vp.name+" registro no accede a control individual");
  const active=await content();
  check(active.includes("Modelos autorizados"),vp.name+" ficha sigue siendo selección singular");
  check(active.includes("GPT-6 Luna (DEMO)"),vp.name+" ficha perdió modelos elegidos en alta");
  await page.screenshot({path:output+"/"+vp.name+"-ficha-multimodelo.png",fullPage:true});

  await open("S0","s0-live");
  if(vp.name!=="mobile"){
   const button=page.getByRole("button",{name:"Ver decisión TRC-0103"}).first();
   check(await button.count()===1,vp.name+" falta detalle de TRC-0103");
   if(await button.count()){
    await button.scrollIntoViewIfNeeded();
    const style=await button.evaluate(el=>{
     const box=el.getBoundingClientRect();
     return {width:box.width,height:box.height,whiteSpace:getComputedStyle(el).whiteSpace,wrapper:getComputedStyle(el.parentElement).whiteSpace};
    });
    check(style.width>=26&&style.height<48&&style.wrapper==="nowrap",vp.name+" botón Ver se comprime verticalmente "+JSON.stringify(style));
    await button.click();
    check(await page.getByText("Decisión TRC-0103",{exact:true}).count()>=1,vp.name+" botón Ver no abre detalle");
    await page.getByRole("button",{name:"Cerrar"}).last().click();
   }
  }else{
   check(await page.getByRole("button",{name:"Detalle"}).count()>0,vp.name+" se perdió detalle en tarjetas móviles");
  }
  await page.screenshot({path:output+"/"+vp.name+"-flujo-ver.png",fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(overflow<6,vp.name+" scroll horizontal de página "+overflow);
  check(jsErrors.length===0,vp.name+" error JavaScript: "+JSON.stringify(jsErrors));
  records.push({viewport:vp.name,flowOverflow:overflow,jsErrors});
  await page.close();
 }
}catch(e){failures.push("Excepción: "+(e?.stack||String(e)));}
finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
 const report={passed:failures.length===0,failures,records,catalogAssertions:5};
 await writeFile(output+"/report.json",JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(failures.length)process.exitCode=1;
}
