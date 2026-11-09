import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const url='http://127.0.0.1:8877/assets/arquitectura.html';
const dir='artifacts/architecture-visual';
await mkdir(dir,{recursive:true});
const server=spawn('python3',['-m','http.server','8877','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const failures=[],summary=[];
function check(condition,message){if(!condition)failures.push(message)}

function inspectSvg(){
 const visible=el=>!!el&&getComputedStyle(el).display!=='none'&&
   (!el.parentElement||getComputedStyle(el.parentElement).display!=='none');
 const intersects=(a,b,p=4)=>a.x<b.x+b.width+p&&a.x+a.width+p>b.x&&a.y<b.y+b.height+p&&a.y+a.height+p>b.y;
 const groups=[...document.querySelectorAll('#nodes .node')].filter(visible);
 const cards=groups.map(g=>({id:g.getAttribute('data-id'),rect:g.querySelector('.node-card').getBBox()}));
 const headings=[...document.querySelectorAll('#zones g')].filter(visible)
   .flatMap(g=>[...g.querySelectorAll('.zone-title,.zone-sub')].map(el=>el.getBBox()));
 const overflows=[];
 for(const g of groups){
  const r=g.querySelector('.node-card').getBBox();
  for(const t of g.querySelectorAll('.node-title,.node-line')){
   const b=t.getBBox();
   if(b.x<r.x+7||b.x+b.width>r.x+r.width-7||b.y+b.height>r.y+r.height-3)
     overflows.push(g.getAttribute('data-id')+': '+t.textContent);
  }
 }
 const labels=[...document.querySelectorAll('#edges g')].filter(visible)
   .map(g=>g.querySelector('.edge-label')).filter(visible);
 const labelCollisions=[];
 for(let i=0;i<labels.length;i++){
  const a=labels[i].getBBox();
  for(const {id,rect} of cards)if(intersects(a,rect))labelCollisions.push(labels[i].textContent+' / '+id);
  for(const b of headings)if(intersects(a,b))labelCollisions.push(labels[i].textContent+' / encabezado');
  for(let j=0;j<i;j++)if(intersects(a,labels[j].getBBox()))labelCollisions.push(labels[i].textContent+' / '+labels[j].textContent);
 }
 const edgeCrossings=[];
 for(const g of [...document.querySelectorAll('#edges g')].filter(visible)){
  const from=g.getAttribute('data-from'),to=g.getAttribute('data-to');
  const path=g.querySelector('path');if(!path)continue;
  const total=path.getTotalLength();
  for(let k=0;k<=total;k+=7){
   const p=path.getPointAtLength(k);
   const hit=cards.find(({id,rect})=>id!==from&&id!==to
     &&p.x>rect.x+3&&p.x<rect.x+rect.width-3&&p.y>rect.y+3&&p.y<rect.y+rect.height-3);
   if(hit){edgeCrossings.push(from+' → '+to+' atraviesa '+hit.id);break}
  }
 }
 return {overflows,labelCollisions,edgeCrossings,nodeCount:cards.length,visibleLabels:labels.length};
}
async function waitForServer(){
 for(let i=0;i<40;i++){try{const r=await fetch(url);if(r.ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,300));}
 throw new Error('Servidor HTTP local no disponible');
}
try{
 await waitForServer();
 browser=await chromium.launch({headless:true});
 for(const size of [{name:'desktop',width:1696,height:950},{name:'laptop',width:1280,height:800},{name:'mobile',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#nodes .node').first().waitFor();
  for(const [code,expected,score] of [['a','A','41 %'],['ab','A+B','67 %'],['ac','A+C','56 %'],['abc','A+B+C','89 %']]){
   await page.evaluate(code=>{
    const b=code.includes('b'),c=code.includes('c');
    const B=document.querySelector('#b-toggle'),C=document.querySelector('#c-toggle');
    if((B.getAttribute('aria-pressed')==='true')!==b)B.click();
    if((C.getAttribute('aria-pressed')==='true')!==c)C.click();
   },code);
   const result=await page.evaluate(inspectSvg);
   const actualCode=await page.locator('#view-code').textContent();
   const actualScore=await page.locator('#view-score').textContent();
   check(actualCode===expected,size.name+' '+code+' estado: '+actualCode);
   check(actualScore.startsWith(score),size.name+' '+code+' índice: '+actualScore);
   check(!result.overflows.length,size.name+' '+code+' desborde: '+JSON.stringify(result.overflows));
   check(!result.labelCollisions.length,size.name+' '+code+' rótulos: '+JSON.stringify(result.labelCollisions));
   check(!result.edgeCrossings.length,size.name+' '+code+' rutas: '+JSON.stringify(result.edgeCrossings));
   await page.screenshot({path:dir+'/'+size.name+'-'+code+'.png'});
   summary.push({viewport:size.name,code,...result});
  }
  await page.locator('#nodes [data-id="entry"]').evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  check(await page.locator('#node-inspector').isVisible(),size.name+' inspector no abre');
  check((await page.locator('#inspector-title').textContent()).includes('AgentCore'),size.name+' inspector texto');
  await page.locator('#zoom-in').click();
  check((await page.locator('#zoom-label').textContent())!=='100 %',size.name+' zoom');
  await page.locator('#inspector-close').click();
  check(await page.locator('#node-inspector').isHidden(),size.name+' inspector no cierra');
  check(!errors.length,size.name+' errores JS: '+errors.join('; '));
  await page.close();
 }
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
await writeFile(dir+'/report.json',JSON.stringify({failures,summary},null,2),'utf8');
console.log('Architecture visual QA\n'+summary.map(x=>x.viewport+' '+x.code+': '+x.nodeCount+' nodos / '+x.visibleLabels+' rótulos').join('\n'));
if(failures.length){console.error('FALLAS\n'+failures.join('\n'));process.exitCode=1}
else console.log('PASS: 12 estados/ventanas sin textos cortados, etiquetas cruzadas ni rutas atravesando tarjetas.');
