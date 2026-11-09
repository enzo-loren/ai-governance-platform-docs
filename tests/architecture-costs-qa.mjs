import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";

const base="http://127.0.0.1:8877/assets/arquitectura.html";
const folder="artifacts/architecture-costs-qa";
await mkdir(folder,{recursive:true});
const server=spawn("python3",["-m","http.server","8877","--bind","127.0.0.1"],{stdio:"ignore"});
const failures=[],records=[];
const assert=(ok,message)=>{if(!ok)failures.push(message)};
const USD=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
let browser;
async function ready(){
 for(let i=0;i<45;i++){
  try{if((await fetch(base)).ok)return}catch{}
  await new Promise(r=>setTimeout(r,220));
 }
 throw Error("Servidor local no disponible");
}
async function output(page,id){return (await page.locator("#costs-"+id).textContent()).trim()}
try{
 await ready();browser=await chromium.launch({headless:true});
 for(const vp of [{name:"desktop",width:1440,height:900},{name:"tablet",width:820,height:1000},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const exceptions=[];
  page.on("pageerror",e=>exceptions.push(e.message));
  await page.goto(base,{waitUntil:"domcontentloaded"});
  await page.locator("#costs-monthly").waitFor();
  await page.waitForFunction(()=>document.querySelector("#costs-monthly")?.textContent!=="—");
  assert((await page.locator("#costos h2").textContent()).includes("¿Cuánto cuesta"),vp.name+" heading absent");
  assert(await page.locator("#costs-rows tr").count()===10,vp.name+" no ten services");
  assert(await output(page,"monthly")==="$207.20",vp.name+" audited formula mismatch "+await output(page,"monthly"));
  assert((await page.locator(".aws-costs .costs-disclaimer").textContent()).includes("no cotización"),vp.name+" caveat missing");
  assert((await page.locator(".aws-costs .costs-scope").textContent()).includes("MCP"),vp.name+" no B/C exclusion");
  assert(await page.locator("button.costs-scenario").count()===3,vp.name+" no scenario trio");
  assert(await page.locator('#b-toggle').count()===1&&await page.locator('#c-toggle').count()===1,
    vp.name+" architecture controls changed");
  // Cost section is below architecture and inside the document.
  const loc=await page.evaluate(()=>{
   const section=document.querySelector("#costos"), frame=document.querySelector("#frame");
   return {costsTop:section.getBoundingClientRect().top+scrollY,diagramBottom:frame.getBoundingClientRect().bottom+scrollY,docOverflow:document.documentElement.scrollWidth-innerWidth,
     sections:document.querySelectorAll(".aws-costs").length};
  });
  assert(loc.costsTop>loc.diagramBottom,vp.name+" costs overlap map");
  assert(loc.sections===1,vp.name+" duplicate section");
  assert(loc.docOverflow<8,vp.name+" document horizontal overflow "+loc.docOverflow);
  // Three scenarios reproduce the audited model with different fixed-cost absorption.
  await page.locator('.costs-scenario[data-volume="10000"]').click();
  assert(await page.locator("#costs-n").inputValue()==="10000",vp.name+" scenario 10k not applied");
  assert((await output(page,"monthly"))===(await output(page,"scenario-10000")),vp.name+" 10k card mismatch");
  assert(await page.locator('.costs-scenario[data-volume="10000"]').getAttribute("aria-pressed")==="true",vp.name+" selected scenario state");
  await page.locator('.costs-scenario[data-volume="3000000"]').click();
  assert(await page.locator("#costs-n").inputValue()==="3000000",vp.name+" scenario 3M not applied");
  assert((await output(page,"monthly"))===(await output(page,"scenario-3000000")),vp.name+" 3M card mismatch");
  await page.locator('.costs-scenario[data-volume="300000"]').click();
  // Guardrails off should reduce exactly $135 in the 300k scenario.
  await page.locator("#costs-guard").selectOption("0");
  assert(await output(page,"monthly")==="$72.20",vp.name+" disable Guardrails expected 135 reduction, got "+await output(page,"monthly"));
  // Zero tokens with simulated model; changing model costs should alter total.
  await page.locator("#costs-model").selectOption("none");
  assert(await output(page,"monthly")==="$24.20",vp.name+" simulate model excludes token spend");
  // Expanding assumptions changes forecast and does not break layout.
  await page.locator(".costs-details").first().locator("summary").click();
  await page.locator("#costs-inputTokens").fill("5000");
  assert(await output(page,"monthly")==="$24.20",vp.name+" changing tokens under mock model should not change cost");
  await page.locator("#costs-model").selectOption("120");
  assert(await output(page,"monthly")==="$303.20",vp.name+" 120b rate mismatch: "+await output(page,"monthly"));
  // Custom volume selects no predefined tier.
  await page.locator("#costs-n").fill("125000");
  assert(await page.locator('.costs-scenario[aria-pressed="true"]').count()===0,vp.name+" custom volume matches a tier");
  assert(await page.locator("#costs-rows tr").count()===10,vp.name+" breakdown not updated");
  // B/C diagram toggles stay independent of numeric forecast.
  const costBefore=await output(page,"monthly");
  await page.locator("#b-toggle").click();await page.locator("#c-toggle").click();
  assert(await output(page,"monthly")===costBefore,vp.name+" toggles incorrectly imply priced MCP/C");
  assert(await page.locator("#b-toggle").getAttribute("aria-pressed")==="true"&&
   await page.locator("#c-toggle").getAttribute("aria-pressed")==="true",vp.name+" diagram toggles stopped working");
  await page.locator(".aws-costs").screenshot({path:folder+"/"+vp.name+"-costs.png"});
  if(vp.name==="mobile")await page.screenshot({path:folder+"/mobile-full-page.png",fullPage:true});
  assert(exceptions.length===0,vp.name+" JS errors "+JSON.stringify(exceptions));
  records.push({viewport:vp.name,defaultTotal:"$207.20",services:10,scenarios:3,inlineCostSection:true,errors:exceptions.length});
  await page.close();
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
await writeFile(folder+"/report.json",JSON.stringify({passed:failures.length===0,failures,records},null,2));
console.log("Architecture AWS cost QA:",records.length,"viewports;",failures.length,"failures");
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
