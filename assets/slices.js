/* Prototipos de interfaz por slice: insumo/requisitos.yaml es vinculante.
 * Las escenas usan únicamente datos sintéticos y NO realizan acciones de producto.
 */
(function(){
'use strict';
const STAGES=[
 {id:'S0',name:'Fundación',headline:'Conectar un agente y observar su primera inferencia.',short:'La base funciona: alta, conexión, flujo en vivo y evidencia.'},
 {id:'S1',name:'Visibilidad',headline:'Entender el riesgo antes de aplicar reglas.',short:'Catálogo automático, evaluación en sombra, guardrail y costo.'},
 {id:'S2',name:'Control activo',headline:'Empezar a decidir sin romper al agente.',short:'Activación con impacto previo, límites y suspensión.'},
 {id:'S3',name:'Identidad',headline:'Saber quién pidió qué y aplicar permisos por persona.',short:'JWT, roles, datos personales y gasto por usuario.'},
 {id:'S4',name:'Tools MCP',headline:'Controlar la ejecución real de las herramientas.',short:'Targets MCP, credenciales, reglas por parámetro y guía.'},
 {id:'S5',name:'Supervisión',headline:'Retener acciones críticas hasta una decisión humana.',short:'Bandeja, vencimiento y separación de funciones.'},
 {id:'S6',name:'Auditoría',headline:'Reconstruir una transacción hasta su evidencia.',short:'Búsqueda, regla versionada, ruta forense y sello S3.'}
];
const SCREENS=[
 {id:'s0-connect',slice:'S0',surface:'agentes',type:'new',title:'Alta y conexión del agente',tag:'Primera pantalla',caption:'REG-02 · CON-01',requirements:['REG-02','CON-01','INF-01'],summary:'El operador registra un agente y obtiene una credencial de conexión que se muestra una sola vez.',help:'Alta y conexión del agente',about:'S0 introduce la consola autenticada y el alta de un agente. Solo se necesitan BASE_URL y agent_token; no hay todavía tarjeta de cobertura ni modos de control configurables.'},
 {id:'s0-live',slice:'S0',surface:'flujo',type:'new',title:'Flujo en vivo básico',tag:'Nueva pantalla',caption:'CON-02 · CON-03 · EVD-01',requirements:['CON-02','CON-03','EVD-01','NFR-05'],summary:'Las solicitudes entran al flujo, con su decisión, costo y registro de evidencia.',help:'La primera observabilidad',about:'S0 ya incluye flujo, costo por llamada, índice durable y copia S3 GOVERNANCE. OTLP se exige en NFR-05, aunque no haga falta una pantalla independiente.'},
 {id:'s1-coverage',slice:'S1',surface:'gobernanza',type:'new',title:'Tarjeta de gobernanza',tag:'Nueva pantalla',caption:'CON-04 · POL-03',requirements:['CON-04','POL-03','POL-01'],summary:'El operador ve qué controles actúan, cuáles están en sombra y qué conexiones faltan.',help:'Cobertura visible',about:'La tarjeta no es un porcentaje abstracto de seguridad: describe controles del catálogo, aplicabilidad, modo, evidencia y cobertura real de B/C. Los números reales dependen de tráfico y configuración.'},
 {id:'s1-inventory',slice:'S1',surface:'tools',type:'new',title:'Tools autodescubiertas',tag:'Nueva pantalla',caption:'INF-02',requirements:['INF-02'],summary:'Las tools declaradas por el agente aparecen con clase sugerida y estado de revisión.',help:'Inventario antes que ejecución',about:'S1 descubre tools desde las solicitudes al modelo. Aún no las ejecuta mediante MCP: la conexión B y sus targets llegan en S4. La clase sugerida exige revisión del operador.'},
 {id:'s1-shadow',slice:'S1',surface:'decision',type:'new',title:'Decisión en sombra',tag:'Nueva pantalla',caption:'POL-01 · GRD-01 · GRD-02',requirements:['POL-01','POL-03','GRD-01','GRD-02','INF-04','FIN-01'],summary:'Una transacción revela la regla que habría actuado, separada de guardrail y enmascaramiento.',help:'Observar sin bloquear por política',about:'En descubrimiento, las reglas Cedar dejan pasar una acción que habrían denegado en activo. Guardrail y PII sí pueden actuar: guardrail bloquea por defecto salvo configuración sombra, y PII se enmascara siempre.'},
 {id:'s2-activate',slice:'S2',surface:'agentes',type:'update',title:'Activación y Kill Switch',tag:'Agentes · versión S2',caption:'REG-01 · REG-03 · INF-05',requirements:['REG-01','REG-03','INF-03','INF-05','NFR-01','EVD-04','CON-08'],summary:'La ficha de S0 evoluciona: muestra impacto en sombra, modelo permitido y suspensión.',help:'El mismo agente, con control',about:'S2 añade el diálogo de impacto antes de pasar a activo, denegación por política dentro del protocolo, selección de modelos y Kill Switch. Reemplaza la versión S0 de la ficha, no se muestra duplicada.'},
 {id:'s2-limits',slice:'S2',surface:'consumo',type:'new',title:'Consumo y límites',tag:'Nueva pantalla',caption:'CON-06 · FIN-02',requirements:['CON-06','FIN-02'],summary:'Un operador puede establecer topes de USD, tokens y tasa por agente.',help:'Presupuestos operables',about:'Los medidores muestran umbrales y acción asociada: solo alerta, throttle (429) o bloqueo (403). Los límites se actualizan sin redesplegar. Los importes del mock son ficticios.'},
 {id:'s3-identity',slice:'S3',surface:'identidad',type:'new',title:'Identidad y acceso por rol',tag:'Nueva pantalla',caption:'IDN-01 · GRD-03',requirements:['IDN-01','GRD-03'],summary:'Una respuesta se enmascara según pii_access y las reglas distinguen usuario de solo_workload.',help:'El agente actúa en nombre de alguien',about:'C recibe X-Gov-User-Token; se verifican JWKS, issuer, vigencia y audiencia. Las llamadas sin JWT siguen como solo_workload. Este ejemplo muestra la respuesta del MODELO; el control de resultado MCP corresponde a S4.'},
 {id:'s3-user-spend',slice:'S3',surface:'consumo',type:'update',title:'Consumo por persona',tag:'Consumo · versión S3',caption:'FIN-03',requirements:['FIN-03'],summary:'La vista de S2 suma costo, cuotas y decisiones por usuario verificado.',help:'Límites atribuibles',about:'S3 extiende los límites por agente con límites por usuario. El total del agente sigue existiendo; las solicitudes sin identidad se atribuyen a solo_workload, no a una persona inventada.'},
 {id:'s4-mcp',slice:'S4',surface:'tools',type:'update',title:'Tools por la puerta',tag:'Tools · versión S4',caption:'MCP-01 · PLT-02 · CON-07',requirements:['MCP-01','PLT-02','GRD-04','CON-07'],summary:'El inventario S1 se convierte en control de ejecución MCP, con credenciales en bóveda.',help:'De intención a ejecución',about:'Las tools declaradas al modelo pueden ejecutarse por MCP con targets Lambda/OpenAPI y credenciales en AgentCore Identity o Secrets Manager. Una tool local sigue fuera de la puerta aunque B esté activada parcialmente.'},
 {id:'s4-policy',slice:'S4',surface:'reglas',type:'new',title:'Constructor de reglas',tag:'Nueva pantalla',caption:'POL-04',requirements:['POL-04'],summary:'Crear y validar una regla Cedar sobre parámetros sin redesplegar.',help:'Reglas editables',about:'El constructor visual define efecto, agente/principal, tool y condición tipada. También existe editor Cedar. La misma regla se evalúa en intención (A) y ejecución (B); el esquema se valida antes de aplicar.'},
 {id:'s4-guide',slice:'S4',surface:'guia',type:'new',title:'Guía de conexión A/B/C',tag:'Nueva pantalla',caption:'OPS-01 · POL-02',requirements:['OPS-01','POL-02'],summary:'Pasos para activar B y C, sin confundir conexiones configuradas con cobertura real.',help:'Integración progresiva',about:'La guía explica BASE_URL, token, targets MCP y JWT de usuario. Los escenarios automatizados ≥30 son una suite técnica de S4, no una pantalla de gerencia inventada.'},
 {id:'s5-approvals',slice:'S5',surface:'aprobaciones',type:'new',title:'Bandeja de aprobaciones',tag:'Nueva pantalla',caption:'HITL-01/02/03 · CON-05',requirements:['HITL-01','HITL-02','HITL-03','CON-05'],summary:'Una acción retenida se aprueba, rechaza o vence sin ejecutar por adelantado.',help:'Un humano decide',about:'Solo una operación permitida por reglas y marcada requiere_aprobacion se retiene. Hay aprobación separada por persona con C, o por aprobador humano cuando solo existe A+B. El agente recibe PENDING_APPROVAL por MCP y consulta gov_aprobacion_estado.'},
 {id:'s6-search',slice:'S6',surface:'busqueda',type:'new',title:'Búsqueda de transacciones',tag:'Nueva pantalla',caption:'EVD-02',requirements:['EVD-02'],summary:'Buscar por agente, usuario, período, modelo, tool y decisión en una sola consulta.',help:'Llegar rápido al caso',about:'S6 incorpora búsqueda combinable desde la consola y API, con objetivo de resultados < 5 segundos usando el índice durable. El flujo en vivo de S0 no se reutiliza como sustituto de búsqueda forense.'},
 {id:'s6-forensic',slice:'S6',surface:'forense',type:'new',title:'Ruta forense e inmutabilidad',tag:'Nueva pantalla',caption:'EVD-03/05/06',requirements:['EVD-03','EVD-05','EVD-06'],summary:'Cada paso, regla y versión se vincula a una evidencia protegida por Object Lock.',help:'De la decisión a la prueba',about:'La ruta forense ordena inferencias, tools, aprobaciones, reglas y cambios administrativos. La prueba de inmutabilidad intenta borrar con rol sin bypass y exhibe el rechazo de S3; ningún botón aquí llama realmente a AWS.'}
];
const NAV=[{name:'Agentes',start:0},{name:'Flujo en vivo',start:0},{name:'Gobernanza',start:1},{name:'Tools',start:1},{name:'Consumo',start:2},{name:'Identidad',start:3},{name:'Reglas y MCP',start:4},{name:'Aprobaciones',start:5},{name:'Auditoría',start:6}];
const $=id=>document.getElementById(id);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const tip=(title,body)=>'<button type="button" class="m-hotspot" aria-label="Explicar '+escape(title)+'" data-tip="'+escape(title+'|'+body)+'">i</button>';
const badge=(text,cls='')=>'<span class="m-badge '+cls+'">'+text+'</span>';
const pill=(text,cls='')=>badge(text,cls);
const btn=(text,cls='')=>'<span class="m-btn '+cls+'">'+text+'</span>';
const field=(label,value)=>'<label class="m-field">'+label+'<span class="m-input">'+value+'</span></label>';
const kpi=(label,val,sub)=>'<div class="m-kpi"><label>'+label+'</label><strong>'+val+'</strong><small>'+sub+'</small></div>';
const panel=(title,body,right='')=>'<div class="m-panel"><div class="m-panel-title"><span>'+title+'</span>'+right+'</div>'+body+'</div>';
const table=(headers,rows,widths=[])=>'<table class="m-table"><colgroup>'+headers.map((_,i)=>'<col'+(widths[i]?' style="width:'+widths[i]+'%"':'')+'>').join('')+'</colgroup><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
const bar=(pct,cls='')=>'<div class="m-progress '+cls+'"><span style="width:'+pct+'%"></span></div>';
const mHeader=(title,sub,action='')=>'<div class="m-heading"><div><h3>'+title+'</h3><p>'+sub+'</p></div><div class="m-tools">'+action+'</div></div>';
const mFact=(name,content)=>'<div class="m-tile"><b>'+name+'</b><small>'+content+'</small></div>';
const explanations={
 coverage:'El índice se calcula según catálogo, modo, aplicabilidad, conexión efectivamente usada y evidencia. No es una nota general de seguridad.',
 shadow:'En modo descubrimiento, Cedar registra lo que habría bloqueado sin modificar la solicitud. Esto permite ver impacto antes de activar.',
 pii:'El RUT, correo y teléfono de la salida se enmascaran. El modelo recibe los argumentos intactos; una excepción de pii_access llega en S3.',
 live:'La consola consulta el índice durable. El evento tiene decisión, motivo y referencia de evidencia; S0 no muestra aún evaluación Cedar.',
 tokens:'El agent_token se muestra una sola vez. Se almacena hash y se rota con dos credenciales vigentes durante la transición.',
 mcp:'B cubre solo las tools efectivamente registradas y usadas por MCP. Una tool local permanece fuera del control de ejecución.',
 approval:'La solicitud no ejecuta la tool hasta una decisión humana. Si vence o se rechaza, no se ejecuta.',
 immutable:'La evidencia se confirma duradera antes de responder y se copia a S3 con Object Lock GOVERNANCE. La prueba activa de borrado aparece en S6.'
};
let selected='S0', mode='delta', current=null, shotsObserver=null;
const stageIndex=id=>STAGES.findIndex(s=>s.id===id);
function stageScreens(stage,which){
 const idx=stageIndex(stage);
 if(which==='delta')return SCREENS.filter(s=>s.slice===stage);
 const map=new Map();
 SCREENS.filter(s=>stageIndex(s.slice)<=idx).forEach(s=>map.set(s.surface,s));
 return [...map.values()].sort((a,b)=>stageIndex(a.slice)-stageIndex(b.slice));
}
function counts(id){
 const delta=stageScreens(id,'delta'),active=stageScreens(id,'all');
 return {fresh:delta.filter(s=>s.type==='new').length,update:delta.filter(s=>s.type==='update').length,total:active.length};
}
function iconNav(name){return '<span class="m-nav-dot"></span>'+name}
function mkFrame(screen,content){
 const idx=stageIndex(screen.slice);
 const nav=NAV.filter(x=>x.start<=idx);
 const active=screen.surface==='agentes'?'Agentes':screen.surface==='flujo'?'Flujo en vivo':
 screen.surface==='gobernanza'||screen.surface==='decision'?'Gobernanza':screen.surface==='consumo'?'Consumo':
 screen.surface==='identidad'?'Identidad':screen.surface==='tools'?'Tools':
 screen.surface==='aprobaciones'?'Aprobaciones':screen.surface==='forense'||screen.surface==='busqueda'?'Auditoría':
 screen.surface==='reglas'||screen.surface==='guia'?'Reglas y MCP':'Agentes';
 return '<div class="m-app"><aside class="m-rail"><div class="m-logo"><span class="m-logo-icon">G·</span> Gobernanza</div>'+
  nav.map(x=>'<div class="m-nav '+(x.name===active?'active':'')+'">'+iconNav(x.name)+'</div>').join('')+
  '<div class="m-rail-foot">MÓDULO A<br>Vista propuesta · '+screen.slice+'</div></aside>'+
  '<div class="m-work"><div class="m-top"><span class="m-top-path">Plataforma / '+escape(screen.title)+'</span><span class="m-profile"><span class="m-avatar">OP</span> Operador · demo</span></div>'+
  '<div class="m-content">'+content+'</div><div class="m-bottom"><span>Datos sintéticos · no conectado a AWS</span><b>'+screen.slice+' · '+screen.requirements[0]+'</b></div></div></div>';
}
function renderScene(id){
 const screen=SCREENS.find(x=>x.id===id);
 if(!screen)throw Error('Pantalla no encontrada: '+id);
 const body=SCENE[id]();
 return mkFrame(screen,body);
}
function fitShots(){
 document.querySelectorAll('.shot, .dialog-stage').forEach(container=>{
  const canvas=container.querySelector('.screen-canvas');
  if(!canvas)return;
  const mobile=container.classList.contains('dialog-stage') && window.innerWidth<=700;
  const scale=mobile?1:Math.max(0.1,container.clientWidth/900);
  canvas.style.transform=mobile?'none':'scale('+scale+')';
 });
}
function renderSteps(){
 $('steps').innerHTML=STAGES.map(s=>{
  const n=counts(s.id),active=s.id===selected;
  return '<button type="button" class="step" data-stage="'+s.id+'" aria-pressed="'+active+'">'+
    '<span class="step-num">'+s.id+'</span><span class="step-name">'+s.name+'</span>'+
    '<span class="step-foot">+'+n.fresh+' nueva'+(n.fresh!==1?'s':'')+
      (n.update?' · '+n.update+' cambio'+(n.update!==1?'s':''):'')+'</span></button>';
 }).join('');
}
function renderGallery(){
 const st=STAGES.find(s=>s.id===selected),items=stageScreens(selected,mode),c=counts(selected),idx=stageIndex(selected);
 $('stage-code').textContent='SLICE '+idx+' · '+st.name.toUpperCase();
 $('section-title').textContent=st.name;
 $('stage-promise').textContent=st.headline;
 $('stage-metrics').innerHTML='<span><strong>'+c.fresh+'</strong> nueva'+(c.fresh===1?'':'s')+'</span>'+
   (c.update?'<span><strong>'+c.update+'</strong> modificada'+(c.update===1?'':'s')+'</span>':'')+
   '<span class="metric-divider"></span><span><strong>'+c.total+'</strong> en producto</span>';
 $('mode-delta').classList.toggle('is-active',mode==='delta');
 $('mode-all').classList.toggle('is-active',mode==='all');
 $('mode-delta').setAttribute('aria-pressed',String(mode==='delta'));
 $('mode-all').setAttribute('aria-pressed',String(mode==='all'));
 $('gallery-label').textContent=mode==='delta'?'Solo lo que se entrega en '+selected:'Producto acumulado al cerrar '+selected;
 $('gallery-count').textContent=items.length+' vista'+(items.length===1?'':'s');
 $('gallery').innerHTML=items.map(s=>
  '<article class="screen-card"><div class="screen-meta"><span class="screen-eyebrow">'+s.slice+' · '+s.tag+'</span>'+
  '<span class="'+(mode==='all'&&s.slice!==selected?'delta-existing':s.type==='update'?'delta-update':'delta-new')+'">'+
   (mode==='all'&&s.slice!==selected?'Ya disponible':s.type==='update'?'Actualizada':'Nueva')+'</span></div>'+
  '<div class="shot" aria-hidden="true"><div class="screen-canvas">'+renderScene(s.id)+'</div></div>'+
  '<div class="card-bottom"><div><h3>'+escape(s.title)+'</h3><p>'+escape(s.caption)+'</p></div>'+
   '<button type="button" class="open-screen" data-open="'+s.id+'" aria-label="Explorar '+escape(s.title)+'">Explorar <span aria-hidden="true">↗</span></button></div></article>'
 ).join('');
 $('prev-slice').disabled=idx===0; $('next-slice').disabled=idx===6;
 $('prev-slice').textContent=idx?'← '+STAGES[idx-1].id+' · '+STAGES[idx-1].name:'← Inicio';
 $('next-slice').textContent=idx<6?STAGES[idx+1].id+' · '+STAGES[idx+1].name+' →':'Último slice';
 renderSteps();
 requestAnimationFrame(fitShots);
}
function choose(stage,updateHash=true){
 if(!STAGES.some(s=>s.id===stage))return;
 selected=stage;renderGallery();
 if(updateHash)history.replaceState(null,'','#'+stage.toLowerCase());
}
function openScreen(id){
 const s=SCREENS.find(x=>x.id===id);if(!s)return;
 current=s;
 $('dialog-title').textContent=s.title;
 $('dialog-slice').textContent=s.slice+' · '+(s.type==='update'?'PANTALLA MODIFICADA':'PANTALLA NUEVA');
 $('dialog-hint').textContent=s.summary;
 $('dialog-reqs').innerHTML=s.requirements.map(r=>'<span>'+r+'</span>').join('');
 $('dialog-render').innerHTML=renderScene(s.id);
 $('explain').hidden=true;
 $('screen-dialog').showModal();
 requestAnimationFrame(fitShots);
}
function explain(title,body){
 $('explain-title').textContent=title;
 $('explain-body').textContent=body;
 $('explain').hidden=false;
}
function init(){
 const hash=location.hash.slice(1).toUpperCase();
 if(STAGES.some(s=>s.id===hash))selected=hash;
 renderGallery();
 $('steps').addEventListener('click',e=>{const btn=e.target.closest('[data-stage]');if(btn)choose(btn.dataset.stage)});
 $('gallery').addEventListener('click',e=>{const btn=e.target.closest('[data-open]');if(btn)openScreen(btn.dataset.open)});
 $('mode-delta').addEventListener('click',()=>{mode='delta';renderGallery()});
 $('mode-all').addEventListener('click',()=>{mode='all';renderGallery()});
 $('prev-slice').addEventListener('click',()=>choose(STAGES[stageIndex(selected)-1]?.id||selected));
 $('next-slice').addEventListener('click',()=>choose(STAGES[stageIndex(selected)+1]?.id||selected));
 $('close-dialog').addEventListener('click',()=>$('screen-dialog').close());
 $('screen-dialog').addEventListener('close',()=>{$('explain').hidden=true;current=null});
 $('screen-dialog').addEventListener('click',e=>{
  const b=e.target.closest('[data-tip]');
  if(b){const [title,...body]=b.dataset.tip.split('|');explain(title,body.join('|'));}
 });
 $('explain-close').addEventListener('click',()=>$('explain').hidden=true);
 window.addEventListener('resize',()=>requestAnimationFrame(fitShots));
 window.addEventListener('hashchange',()=>{const h=location.hash.slice(1).toUpperCase();if(STAGES.some(s=>s.id===h))choose(h,false)});
}
const SCENE={
 // __SCENES__
};
init();
})();