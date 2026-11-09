import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
const base="http://127.0.0.1:8877/";
const out="artifacts/cloudscape-qa";
await mkdir(out,{recursive:true});
const server=spawn("python3",["-m","http.server","8877","--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
const failures=[],records=[];
const views=[
 ["S0","s0-connect"],["S0","s0-live"],["S1","s1-coverage"],["S1","s1-inventory"],
 ["S1","s1-shadow"],["S2","s2-activate"],["S2","s2-limits"],["S3","s3-identity"],
 ["S3","s3-user-spend"],["S4","s4-mcp"],["S4","s4-policy"],["S4","s4-guide"],
 ["S5","s5-approvals"],["S6","s6-search"],["S6","s6-forensic"]
];
function check(cond,msg){if(!cond)failures.push(msg)}
const wait=async()=>{for(let i=0;i<45;i++){try{if((await fetch(base)).ok)return}catch{}await new Promise(r=>setTimeout(r,200));}throw Error("HTTP local no disponible");};
const route=(slice,view)=>base+"assets/console.html?slice="+slice+"&screen="+view;
try{
 await wait();
 browser=await chromium.launch({headless:true});
 for(const vp of [{id:"desktop",width:1440,height:900},{id:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const errs=[];
  page.on("pageerror",e=>errs.push(e.message));
  for(const [slice,view] of views){
   console.log("Testing",vp.id,slice,view); await page.goto(route(slice,view),{waitUntil:"domcontentloaded",timeout:15000});
   try {await page.locator("#governance-root h1").first().waitFor({timeout:6500})}
   catch(e){failures.push(vp.id+"/"+view+" no se renderiza h1 · "+e.message.slice(0,180));throw e}
   const data=await page.evaluate(()=>{
    const root=document.querySelector("#governance-root"), h=document.querySelector("h1");
    const content=document.querySelector("#console-content");
    return {title:h?.textContent||"",cloudscape:root.querySelectorAll('[class*="awsui_"]').length,
      pageOverflow:document.documentElement.scrollWidth-window.innerWidth,
      hasLayout:!!content,renderedChildren:root.children.length}
   });
   check(data.cloudscape>10,vp.id+"/"+view+" no usa componentes reales Cloudscape: "+data.cloudscape);
   check(data.hasLayout,vp.id+"/"+view+" no tiene Layout");
   check(data.pageOverflow<6,vp.id+"/"+view+" overflow horizontal "+data.pageOverflow+"px");
   records.push({viewport:vp.id,slice,view,...data});
   if(vp.id==="desktop"||["s0-connect","s4-mcp","s5-approvals","s6-forensic"].includes(view)){
    await page.screenshot({path:out+"/"+vp.id+"-"+view+".png",fullPage:true});
   }
   // Explicación emergente, con teclado y cierre real.
   if(vp.id==="desktop"){
    await page.getByRole("button",{name:"¿Qué muestra?"}).click();
    check(await page.getByText("Prototipo informativo:",{exact:false}).count()>0,vp.id+"/"+view+" la ayuda no abre");
    await page.keyboard.press("Escape");
   }
  }
  check(errs.length===0,vp.id+" errores JS: "+JSON.stringify(errs));
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base,{waitUntil:"load"});
 await page.locator(".screen-card").first().waitFor({timeout:12000});
 check(await page.locator("[data-stage]").count()===7,"Roadmap: 7 slices no encontrados");
 check(await page.locator(".screen-card").count()===2,"Roadmap S0: se esperan 2 novedades");
 // Los previews son iframes HTML reales (no <img>).
 check(await page.locator(".cloudscape-preview").count()===2,"Roadmap: los previews no son iframes");
 await page.locator("[data-stage='S4']").click();
 check(await page.locator(".screen-card").count()===3,"Roadmap S4: se esperan 3 cambios");
 await page.locator("#mode-all").click();
 check(await page.locator(".screen-card").count()===9,"Roadmap S4: 9 superficies acumuladas");
 await page.locator("#mode-delta").click();
 await page.screenshot({path:out+"/roadmap-s4.png",fullPage:true});
 await page.locator(".open-screen").first().click();
 await page.locator("#governance-root h1").first().waitFor({timeout:12000});
 check(page.url().includes("console.html?slice=S4"),"Enlace Navegar no abre app HTML");
 check(await page.locator('[class*="awsui_"]').count()>10,"Navegación no usa Cloudscape");
 await page.getByRole("button",{name:"¿Qué muestra?"}).click();
 await page.keyboard.press("Escape");
 check(errors.length===0,"Errores JS desde roadmap "+JSON.stringify(errors));
 await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
await writeFile(out+"/report.json",JSON.stringify({failures,records},null,2));
console.log("Visual QA:",records.length,"vistas en Chromium, fallas:",failures.length);
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
