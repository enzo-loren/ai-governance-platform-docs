import { chromium } from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const base='http://127.0.0.1:8877/';
const folder='artifacts/roadmap-v2';
const server=spawn('python3',['-m','http.server','8877','--bind','127.0.0.1'],{stdio:'ignore'});
await mkdir(folder,{recursive:true});
const scenarios=[{name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:800},{name:'mobile',width:390,height:844}];
const counts={S0:[2,2],S1:[3,5],S2:[2,6],S3:[2,7],S4:[3,9],S5:[1,10],S6:[2,12]};
const report=[],failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
async function httpReady(){
 for(let i=0;i<40;i++){
  try{if((await fetch(base)).ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw Error('Servidor local no disponible');
}
let browser;
try{
 await httpReady();
 browser=await chromium.launch({headless:true});
 for(const scenario of scenarios){
  const page=await browser.newPage({viewport:{width:scenario.width,height:scenario.height},deviceScaleFactor:1});
  const exceptions=[],legacyCalls=[];
  page.on('pageerror',err=>exceptions.push(err.message));
  page.on('request',req=>{if(/assets\/slices\.js(?:\?|$)/.test(req.url()))legacyCalls.push(req.url())});
  // Si el navegador intenta ejecutar la versión antigua, el test detecta un conflicto fatal.
  await page.route('**/assets/slices.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'throw Error("SCRIPT_ANTIGUO_INCOMPATIBLE")'}));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('.screen-card .open-screen').first().waitFor({timeout:12000});
  const script=await page.locator('script[src*="roadmap-cloudscape-v3"]').getAttribute('src');
  check(!!script,scenario.name+' no usa JS con ruta versionada');
  check(await page.locator('[data-stage]').count()===7,scenario.name+' no presenta siete cortes');
  for(const [stage,expected] of Object.entries(counts)){
   await page.locator('[data-stage="'+stage+'"]').click();
   await page.waitForFunction(s=>document.querySelector('[data-stage="'+s+'"]')?.getAttribute('aria-current')==='step',stage);
   check(await page.locator('.screen-card').count()===expected[0],scenario.name+' '+stage+' cambios esperados '+expected[0]);
   const stageFocused=await page.evaluate(()=>document.activeElement?.getAttribute('data-stage'));
   check(stageFocused===stage,scenario.name+' '+stage+' pierde el foco del selector');
   check(await page.locator('.screen-card .preview-link').count()===expected[0],scenario.name+' '+stage+' previews navegables');
   check(await page.locator('.screen-card .open-screen').count()===expected[0],scenario.name+' '+stage+' falta CTA');
   const items=await page.locator('.screen-card').allTextContents();
   check(items.every(t=>/Explorar/.test(t)),scenario.name+' '+stage+' botón sin verbo claro');
   if(['S0','S4','S6'].includes(stage)){
    const frames=await page.locator(".screen-card iframe.cloudscape-preview").count();
    for(let frameIndex=0;frameIndex<frames;frameIndex++){
      await page.locator(".screen-card iframe.cloudscape-preview").nth(frameIndex).scrollIntoViewIfNeeded();
      await page.waitForFunction(index=>{
        const frame=document.querySelectorAll(".screen-card iframe.cloudscape-preview")[index];
        return !!frame?.contentDocument?.querySelector("#governance-root h1");
      },frameIndex,{timeout:18000});
    }
    await page.screenshot({path:folder+'/'+scenario.name+'-'+stage.toLowerCase()+'-cambios.png',fullPage:true});
   }
   await page.locator('#mode-all').click();
   check(await page.locator('.screen-card').count()===expected[1],scenario.name+' '+stage+' acumulado '+expected[1]);
   if(stage==='S6')await page.screenshot({path:folder+'/'+scenario.name+'-s6-acumulado.png',fullPage:true});
   await page.locator('#mode-delta').click();
  }
  // El área de la imagen no es inerte: abre la página HTML real.
  await page.locator('[data-stage="S4"]').click();
  await page.locator('.screen-card .preview-link').first().click();
  await page.locator('#governance-root h1').first().waitFor({timeout:14000});
  check(page.url().includes('/assets/console.html?slice=S4&screen='),scenario.name+' preview no navega a consola');
  check((await page.locator('#governance-root [class*="awsui_"]').count())>10,scenario.name+' Cloudscape no se montó');
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('[data-stage="S4"][aria-current="step"]').waitFor();
  check(await page.locator('.screen-card').count()===3,scenario.name+' no conserva slice al volver');
  const bounds=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
  check(bounds.width<=bounds.viewport+4,scenario.name+' scroll horizontal accidental: '+JSON.stringify(bounds));
  check(exceptions.length===0,scenario.name+' errores JavaScript: '+JSON.stringify(exceptions));
  check(legacyCalls.length===0,scenario.name+' ejecuta archivo antiguo en caché');
  report.push({viewport:scenario.name,scenarios:7,interactiveHTML:true,legacyCalls:legacyCalls.length,errors:exceptions.length,bounds});
  await page.close();
 }
 // Falla deliberada de JS: los enlaces de S0 no deben desaparecer.
 const noJS=await browser.newPage({javaScriptEnabled:false});
 await noJS.goto(base,{waitUntil:'domcontentloaded'});
 check(await noJS.locator('.fallback-card .open-screen').count()===2,'La página sin JavaScript no conserva navegación inicial');
 const link=await noJS.locator('.fallback-card .open-screen').first().getAttribute('href');
 check(link.includes('console.html?slice=S0&screen=s0-connect'),'Fallback apunta a URL incorrecta');
 await noJS.close();
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
await writeFile(folder+'/report.json',JSON.stringify({pass:failures.length===0,failures,report},null,2));
console.log('Roadmap cache/navigation/UX QA:',report.length,'viewports; errors:',failures.length);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
