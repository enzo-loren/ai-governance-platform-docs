import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";

const base="http://127.0.0.1:8894/";
const output="artifacts/incremental-functional-qa";
await mkdir(output,{recursive:true});
const server=spawn("python3",["-m","http.server","8894","--bind","127.0.0.1"],{stdio:"ignore"});
const failures=[],results=[];
function assert(value,message){if(!value)failures.push(message)}
async function ready(){
 for(let i=0;i<40;i++){
  try{if((await fetch(base)).ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw Error("Servidor local no inicia");
}
let browser;
try{
 await ready();browser=await chromium.launch({headless:true});
 for(const vp of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
  const pageErrors=[];
  page.on("pageerror",e=>pageErrors.push(e.message));
  async function open(slice,screen){
   await page.goto(base+"assets/console.html?slice="+slice+"&screen="+screen,{waitUntil:"domcontentloaded"});
   await page.locator("#governance-root h1").first().waitFor({timeout:20000});
  }
  async function text(){return page.locator("#console-content").innerText();}
  async function screenshot(name){await page.screenshot({path:output+"/"+vp.name+"-"+name+".png",fullPage:true});}
  async function overflow(){
   const x=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
   assert(x.scroll<=x.width+2,vp.name+" overflow "+JSON.stringify(x));
  }

  await open("S0","s0-connect");
  assert((await text()).includes("API keys"),vp.name+" S0 sin gestión de credenciales");
  if(vp.name==="mobile")assert((await page.locator(".mobile-cards").first().innerText()).includes("Responsable"),"S0 móvil no presenta ficha de agente");
  await screenshot("s0-agentes");
  await overflow();

  await open("S1","s1-coverage");
  let content=await text();
  assert(content.includes("Sin conexión MCP")&&content.includes("41 %"),vp.name+" S1 no diferencia A de B/C");
  assert(content.includes("Cobertura medida")&&content.includes("Sin datos"),vp.name+" S1 presenta cobertura simulada como medida");
  assert(!content.includes("Ver los 27 controles"),vp.name+" S1 muestra inventario técnico al usuario");
  if(vp.name==="mobile")assert((await page.locator(".mobile-cards").first().innerText()).includes("ejecución aún queda fuera"),"S1 móvil oculta la diferencia entre intención y ejecución");
  await screenshot("s1-gobernanza");

  await open("S3","s1-coverage");
  content=await text();
  assert(content.includes("2 de 3 JWT válidos")&&content.includes("56 %"),vp.name+" S3 no hereda tarjeta y C");
  assert(content.includes("Acumulado hasta S3"),vp.name+" S3 perdió el contexto del corte");
  await screenshot("s3-gobernanza");

  await open("S4","s1-coverage");
  content=await text();
  assert(content.includes("3 de 4 tools")&&content.includes("89 %"),vp.name+" S4 no incorpora B+C a tarjeta");
  await screenshot("s4-gobernanza");

  await open("S6","s0-live");
  content=await text();
  assert(content.includes("TRC-0401")&&content.includes("TRC-0501"),vp.name+" S6 no acumula eventos MCP/HITL");
  assert(content.includes("A+B+C"),vp.name+" S6 no muestra conexiones del flujo");
  assert(content.includes("Acumulado hasta S6"),vp.name+" S6 perdió el contexto del corte");
  await screenshot("s6-flujo");
  await overflow();
  await page.getByRole("button",{name:"Pausar"}).first().click();
  await page.getByRole("button",{name:"Simular solicitud"}).first().click();
  assert((await text()).includes("1 eventos de ejemplo esperan"),vp.name+" pausa no retiene eventos");
  await page.getByRole("button",{name:"Reanudar"}).first().click();
  assert((await text()).includes("TRC-DEMO-001"),vp.name+" reanudación no incorpora cola");

  await open("S1","s1-inventory");
  if(vp.name==="mobile")await page.getByRole("button",{name:"Revisar"}).first().click();
  else await page.getByRole("button",{name:"consultar_ficha"}).first().click();
  await page.getByRole("button",{name:"Simular cambio de esquema"}).click();
  assert((await text()).includes("v2"),vp.name+" inventario no detecta versión de esquema");
  await screenshot("s1-esquema");

  await open("S2","s2-activate");
  assert((await text()).includes("Pendientes: eliminar_registro"),vp.name+" S2 no identifica tools pendientes");
  await screenshot("s2-activacion");

  await open("S4","s4-mcp");
  content=await text();
  assert(content.includes("3 de 4")&&content.includes("Fuera de la puerta"),vp.name+" S4 no muestra cobertura MCP parcial");
  if(vp.name==="desktop"){
   const firstColumn=page.locator(".desktop-table table tbody tr td").first();
   const box=await firstColumn.boundingBox();
   assert(Boolean(box)&&box.width>=125,vp.name+" S4 comprime verticalmente los nombres de tools (ancho "+box?.width+")");
  }
  if(vp.name==="mobile")assert((await page.locator(".mobile-cards").first().innerText()).includes("Secrets Manager"),"S4 móvil recorta información de credenciales de targets");
  await screenshot("s4-mcp");
  await overflow();

  await open("S4","s4-policy");
  content=await text();
  assert(content.includes("Usuario o rol")&&content.includes("Tool o clase"),vp.name+" POL-04 sin constructor completo");
  await page.getByRole("tab",{name:"Editor Cedar"}).click();
  assert((await text()).includes("Validar ejemplo"),vp.name+" editor Cedar sin validación ilustrativa");
  await screenshot("s4-cedar");

  await open("S4","s4-guide");
  content=await text();
  assert(content.includes("Próximo paso")&&content.includes("Añadir B"),vp.name+" guía no propone aumento de cobertura");
  await screenshot("s4-guia");

  await open("S5","s5-approvals");
  content=await text();
  assert(content.includes("Argumentos")&&content.includes("Trace ID"),vp.name+" HITL no muestra argumentos y traza");
  await screenshot("s5-aprobaciones");

  await open("S6","s6-forensic");
  content=await text();
  assert(content.includes("Ver texto de la regla aplicada")&&content.includes("no verificado"),vp.name+" auditoría no distingue política histórica de prueba AWS");
  await page.getByText("Ver texto de la regla aplicada",{exact:true}).click();
  assert((await text()).includes("context.parametros.descuento"),vp.name+" regla histórica no disponible tras la apertura");
  await screenshot("s6-forense");
  await overflow();

  assert(!pageErrors.length,vp.name+" errores JavaScript: "+JSON.stringify(pageErrors));
  results.push({viewport:vp.name,screenshots:12,jsErrors:pageErrors});
  await page.close();
 }
} catch(e){failures.push("Falló ejecución: "+(e?.stack||e));}
finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
 await writeFile(output+"/report.json",JSON.stringify({passed:failures.length===0,failures,results},null,2));
 console.log(JSON.stringify({passed:failures.length===0,failures,results}));
 if(failures.length)process.exitCode=1;
}
