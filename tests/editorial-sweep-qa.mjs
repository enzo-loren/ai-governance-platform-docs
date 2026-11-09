import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {readFile,mkdir,writeFile} from "node:fs/promises";

const data=JSON.parse(await readFile("assets/console-data.json","utf8"));
const editorial=JSON.parse(await readFile("src/console/editorial-board.json","utf8"));
const base="http://127.0.0.1:8899/";
const folder="artifacts/editorial-sweep";
await mkdir(folder,{recursive:true});
const server=spawn("python3",["-m","http.server","8899","--bind","127.0.0.1"],{stdio:"ignore"});
const errors=[],results=[];
function assert(ok,message){if(!ok)errors.push(message);}
async function ready(){
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));}
 throw Error("Servidor de vistas no disponible");
}
const expected={
 "s0-connect":"Registrar agente",
 "s0-live":"Flujo de solicitudes",
 "s1-coverage":"Qué ocurre en la plataforma",
 "s1-inventory":"Tools detectadas",
 "s1-shadow":"Historia de la transacción",
 "s2-activate":"Impacto de activar",
 "s2-limits":"Presupuesto",
 "s3-identity":"Principal efectivo",
 "s3-user-spend":"Presupuesto",
 "s4-mcp":"Tools por MCP",
 "s4-policy":"Constructor visual",
 "s4-guide":"Instrucciones por conexión",
 "s5-approvals":"Solicitudes",
 "s6-search":"Buscar transacciones",
 "s6-forensic":"Motivo de la decisión"
};
const processText=[
 /Ver los 27 controles del catálogo/i,
 /\b(?:REG|CON|INF|MCP|FIN|IDN|EVD|POL|HITL|GRD|OPS|PLT)-\d{2}\b/,
 /(?:cuentas?|aplican?) de un catálogo de 27 controles/i,
 /\ben el producto(?: real)?\b/i,
 /\bla plataforma final debe\b/i,
 /\bparser Cedar\b/i,
 /\bObject Lock GOVERNANCE\b/i,
 /\bHTTP (?:401|403|429)\b/i,
 /\bPizarra editorial y trazabilidad\b/i,
 /\bjustificación editorial\b/i
];
let browser;
try{
 await ready();browser=await chromium.launch({headless:true});
 for(const vp of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
  const pageErrors=[];
  page.on("pageerror",err=>pageErrors.push(err.message));
  for(const screen of data.screens){
   await page.goto(base+"assets/console.html?slice="+screen.slice+"&screen="+screen.id,{waitUntil:"domcontentloaded"});
   await page.locator("#governance-root h1").first().waitFor({timeout:20000});
   const text=await page.locator("#console-content").innerText();
   const prefix=vp.name+" "+screen.id;
   assert(text.includes(expected[screen.id]),prefix+" carece de su operación principal");
   assert(text.includes("DEMO · Sin conexión AWS"),prefix+" no distingue prototipo");
   for(const pattern of processText){
    assert(!pattern.test(text),prefix+" expone material de explicación técnica en vista limpia: "+pattern);
   }
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   assert(overflow.scroll<=overflow.client+2,prefix+" tiene desbordamiento horizontal "+JSON.stringify(overflow));
   assert(await page.getByTestId("editorial-board").count()===0,prefix+" expone la pizarra por defecto");
   assert(Boolean(editorial[screen.surface]),prefix+" carece de pizarra propia");
   await page.screenshot({path:folder+"/"+vp.name+"-"+screen.id+"-limpia.png",fullPage:true});
   await page.getByText("Mostrar explicaciones",{exact:true}).click();
   const board=page.getByTestId("editorial-board");
   assert(await board.count()===1,prefix+" no ofrece pizarra bajo explicaciones");
   if(await board.count()){
    const toggle=board.getByText("Pizarra editorial y trazabilidad",{exact:true});
    assert(await toggle.isVisible(),prefix+" no muestra título de pizarra");
    const beforeOpen=await board.getByText("Decisión editorial:",{exact:false}).isVisible().catch(()=>false);
    assert(!beforeOpen,prefix+" muestra el contenido de la pizarra sin abrirla");
    await toggle.click();
    assert((await board.innerText()).includes("Decisión editorial"),prefix+" perdió la decisión editorial");
   }
   await page.getByText("Mostrar explicaciones",{exact:true}).click();
   assert(await page.getByTestId("editorial-board").count()===0,prefix+" deja la pizarra al desactivar ayuda");
   results.push({viewport:vp.name,id:screen.id,surface:screen.surface,overflow:overflow.scroll-overflow.client});
  }
  assert(pageErrors.length===0,vp.name+" tuvo errores JS "+pageErrors.join("; "));
  await page.close();
 }
}catch(e){errors.push(e.stack||String(e));}
finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
 await writeFile(folder+"/report.json",JSON.stringify({passed:errors.length===0,failures:errors,results,checked:results.length},null,2));
 console.log(JSON.stringify({passed:errors.length===0,failures:errors,checked:results.length,results:results.length}));
 if(errors.length)process.exitCode=1;
}
