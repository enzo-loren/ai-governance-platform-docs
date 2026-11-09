import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const base='http://127.0.0.1:8877/';
const output='artifacts/slices-visual';
await mkdir(output,{recursive:true});
const server=spawn('python3',['-m','http.server','8877','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const failures=[],records=[],warnings=[];
const expected=[
  {slice:'S0',new:2,updated:0,total:2},
  {slice:'S1',new:3,updated:0,total:5},
  {slice:'S2',new:1,updated:1,total:6},
  {slice:'S3',new:1,updated:1,total:7},
  {slice:'S4',new:2,updated:1,total:9},
  {slice:'S5',new:1,updated:0,total:10},
  {slice:'S6',new:2,updated:0,total:12}
];
const viewportSizes=[{name:'desktop',width:1440,height:900},{name:'laptop',width:1100,height:800},{name:'mobile',width:390,height:844}];
function check(value,message){if(!value)failures.push(message)}
async function start(){
 for(let k=0;k<40;k++){try{const r=await fetch(base);if(r.ok)return}catch{}
 await new Promise(resolve=>setTimeout(resolve,250))}
 throw Error('HTTP server unavailable');
}
function measureScene(){
 const app=document.querySelector('.screen-dialog[open] .m-app');
 if(!app)return {error:'missing .m-app'};
 const panels=[...app.querySelectorAll('.m-content,.m-panel,.m-rule,.m-heading,.m-grid,.m-table,.m-code')];
 const overflows=panels.filter(x=>x.scrollWidth>x.clientWidth+3||x.scrollHeight>x.clientHeight+4)
   .map(x=>({name:x.className||x.tagName,w:x.scrollWidth-c(x.clientWidth),h:x.scrollHeight-c(x.clientHeight)}));
 function c(n){return Math.round(n*10)/10}
 const bounds=app.getBoundingClientRect();
 const clipped=[];
 for(const element of app.querySelectorAll('.m-heading h3,.m-panel-title,.m-kpi strong,.m-table td,.m-rule strong,.m-field')){
  const rect=element.getBoundingClientRect();
  if(rect.right>bounds.right+2||rect.left<bounds.left-2||rect.bottom>bounds.bottom+2)clipped.push(element.textContent.trim().slice(0,80));
 }
 return {overflows,clipped,appWidth:app.scrollWidth,appHeight:app.scrollHeight};
}
async function setStage(page,slice){
 await page.locator('[data-stage="'+slice+'"]').click();
 await page.waitForFunction(s=>document.querySelector('#stage-code').textContent.includes(s),slice);
}
try{
 await start();
 browser=await chromium.launch({headless:true});
 for(const size of viewportSizes){
  const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
  const runtime=[];
  page.on('pageerror',err=>runtime.push(err.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('.screen-card').first().waitFor();
  for(const stage of expected){
   await setStage(page,stage.slice);
   const counts=await page.locator('.screen-card').count();
   check(counts===stage.new+stage.updated,size.name+' '+stage.slice+' delta count '+counts);
   const ids=await page.locator('[data-open]').evaluateAll(xs=>xs.map(x=>x.dataset.open));
   check(new Set(ids).size===ids.length,size.name+' '+stage.slice+' duplicate prototype');
   const labels=await page.locator('.screen-card .delta-update').count();
   check(labels===stage.updated,size.name+' '+stage.slice+' updated badges '+labels);
   if(size.name!=='mobile'){
    await page.screenshot({path:output+'/'+size.name+'-'+stage.slice.toLowerCase()+'-delta.png',fullPage:true});
   } else if(['S0','S3','S4','S6'].includes(stage.slice)){
    await page.screenshot({path:output+'/mobile-'+stage.slice.toLowerCase()+'-delta.png',fullPage:true});
   }
   for(const id of ids){
    await page.locator('[data-open="'+id+'"]').click();
    await page.locator('#screen-dialog[open]').waitFor();
    const x=await page.evaluate(measureScene);
    check(!x.error,size.name+' '+id+' failed to render');
    if(x.overflows.length)warnings.push({viewport:size.name,view:id,kind:'overflow',items:x.overflows});
    if(x.clipped.length)warnings.push({viewport:size.name,view:id,kind:'clipped',items:x.clipped});
    if(size.name==='desktop'){
      await page.screenshot({path:output+'/scene-'+id+'.png'});
    }
    const hotspot=page.locator('#dialog-render .m-hotspot').first();
    check(await hotspot.count()>0,size.name+' '+id+' missing explanation hotspot');
    if(await hotspot.count()){
     await hotspot.click();
     check(await page.locator('#explain').isVisible(),size.name+' '+id+' explanation not shown');
     check((await page.locator('#explain-body').textContent()).length>25,size.name+' '+id+' explanation content absent');
     await page.locator('#explain-close').click();
    }
    await page.locator('#close-dialog').click();
    check(!await page.locator('#screen-dialog').evaluate(x=>x.open),size.name+' '+id+' modal does not close');
    records.push({viewport:size.name,slice:stage.slice,screen:id,measured:x});
   }
   await page.locator('#mode-all').click();
   const total=await page.locator('.screen-card').count();
   check(total===stage.total,size.name+' '+stage.slice+' accumulated count '+total);
   const currentIds=await page.locator('[data-open]').evaluateAll(xs=>xs.map(x=>x.dataset.open));
   const surfaces=await page.evaluate(ids=>{
    const js=performance.getEntriesByType('resource').some(x=>x.name.includes('slices.js'));
    return {count:ids.length,js};
   },currentIds);
   check(new Set(currentIds).size===currentIds.length,size.name+' '+stage.slice+' accum duplicates');
   if(stage.slice==='S6')await page.screenshot({path:output+'/'+size.name+'-s6-accumulated.png',fullPage:size.name!=='mobile'});
   await page.locator('#mode-delta').click();
  }
  check(!runtime.length,size.name+' JS exceptions '+JSON.stringify(runtime));
  await page.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM')}
await writeFile(output+'/report.json',JSON.stringify({passed:failures.length===0,failures,warnings,records,expected},null,2));
console.log('Screens inspected:',records.length,'Warnings:',warnings.length,'Errors:',failures.length);
console.log('Warnings breakdown:',JSON.stringify(warnings.slice(0,40)));
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
if(warnings.length){console.error('VISUAL OVERFLOWS TO REVIEW');process.exitCode=1}
