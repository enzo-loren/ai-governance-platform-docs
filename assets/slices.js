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

 's0-connect':()=>mHeader('Agentes','Registrar un agente y conectarlo a la puerta.',btn('+ Dar de alta','primary')+tip('Alta del agente','REG-02: el operador emite un agent_token opaco. Se muestra una sola vez y se almacena solo su hash.'))+
  '<div class="m-grid" style="grid-template-columns:1.05fr .95fr">'+
   panel('Nuevo agente · modo inicial',field('Nombre','agente-demo')+'<div style="height:8px"></div>'+field('Responsable','Operador plataforma')+
    '<div class="m-grid" style="margin-top:10px">'+field('Modo','Descubrimiento')+field('Modelo','Modelo del catálogo')+'</div>'+
    '<div style="margin-top:12px">'+btn('Guardar agente','primary')+'</div>')+
   panel('Conexión A · inferencia '+tip('Dos datos de conexión',explanations.tokens),
    '<div class="m-code">BASE_URL=<em>{gateway}/inference/v1</em><br>API_KEY=<em>gov_••••••••</em></div>'+
    '<p class="m-section-note">Token mostrado una sola vez. Copiar ahora y guardar de forma segura.</p>'+
    '<div class="m-rule">'+badge('A · conectable','blue')+'<span>SDK OpenAI compatible</span></div>')+
  '</div><div class="m-tiles" style="margin-top:11px">'+mFact('Acceso de consola','Usuario autenticado con rol. La API administrativa es independiente del canal del agente.')+
  mFact('Estado inicial','Descubrimiento. Sin catálogo de herramientas todavía ni porcentajes de cobertura.')+'</div>',

 's0-live':()=>mHeader('Flujo en vivo','Cada inferencia deja decisión, costo y evidencia.',badge('● Actualizando','green')+tip('Primera evidencia',explanations.live))+
  '<div class="m-filter"><span>Agente: todos</span><span>Canal: inferencia</span><span>Estado: todos</span>'+btn('Pausar','muted')+'</div>'+
  '<div class="m-grid three" style="margin-bottom:12px">'+kpi('Solicitudes visibles','3','Ejemplo · último minuto')+kpi('Canal','A','Inferencia Chat Completions')+kpi('Evidencia','3 de 3','Índice durable')+'</div>'+
  panel('Solicitudes recientes '+tip('Registro durable y S3',explanations.immutable),
   table(['Hora','Agente','Modelo','Estado','Costo','Evidencia'],[
    ['10:43:08','agente-demo','bedrock-modelo-1',pill('Permitido','green'),'US$ 0,003',pill('Registrada','blue')],
    ['10:42:57','agente-demo','simulado',pill('Permitido','green'),'US$ 0,000',pill('Registrada','blue')],
    ['10:42:11','agente-demo','—',pill('Sin credencial','red'),'—',pill('Registrada','blue')]
   ],[13,18,26,20,12,16]))+
  '<div class="m-tiles" style="margin-top:11px">'+mFact('Copia protegida','S3 Object Lock GOVERNANCE. La confirmación de la copia puede ser asíncrona.')+
  mFact('Telemetría técnica','OTLP con gen_ai, trazas, métricas y logs. Sin secretos ni PII en claro.')+'</div>',

 's1-coverage':()=>mHeader('Tarjeta de gobernanza','agente-demo · Descubrimiento · Preset 1',badge('En descubrimiento','purple')+tip('Qué significa cobertura',explanations.coverage))+
  '<div class="m-grid three" style="margin-bottom:12px">'+
    '<div class="m-kpi"><label>Conexión A</label><strong style="font-size:18px;color:#186fae">Conectada</strong><small>Inferencia observada</small></div>'+
    '<div class="m-kpi"><label>Conexión B</label><strong style="font-size:18px;color:#8997a6">Ausente</strong><small>Ejecución MCP no cubierta</small></div>'+
    '<div class="m-kpi"><label>Conexión C</label><strong style="font-size:18px;color:#8997a6">Ausente</strong><small>Principal solo_workload</small></div>'+
  '</div><div class="m-grid">'+
    panel('Controles por estado '+tip('Modo descubrimiento',explanations.shadow),
      '<div class="m-list">'+
      '<div class="m-rule"><span>'+badge('Activo','green')+' Autenticación y evidencia</span><span>REG-02 · EVD-01</span></div>'+
      '<div class="m-rule"><span>'+badge('En sombra','purple')+' Política Cedar</span><span>POL-03</span></div>'+
      '<div class="m-rule"><span>'+badge('No disponible')+' Tools MCP / identidad</span><span>B / C</span></div></div>')+
    panel('Límites explícitos','<p class="m-section-note">Fuera del perímetro: red/IAM del agente, autenticación del usuario antes del agente y aviso de IA en el cliente.</p>'+
      '<div class="m-divider"></div><div class="m-bubble">'+badge('A','blue')+' Intención de tools visible, ejecución local no gobernada.</div>'+
      '<div style="height:9px"></div>'+btn('Ver catálogo de controles'))+
  '</div>',

 's1-inventory':()=>mHeader('Tools descubiertas','El agente declara tools en la inferencia; la clase es sugerida.',badge('A · solo intención','blue')+tip('Clasificación sugerida','INF-02: primero anotaciones MCP si existen, después método HTTP y reglas de nombre. Una clasificación automática no confirma que la herramienta sea segura.'))+
  '<div class="m-grid three" style="margin-bottom:13px">'+kpi('Declaradas','4','Del payload tools')+kpi('Sin clasificar','1','Revisión necesaria')+kpi('Por MCP','0','B aún no integrada')+'</div>'+
  panel('Inventario · esquema y revisión',table(['Tool','Clase sugerida','Estado','Esquema','Origen'],[
   ['consultar_ficha',pill('Lectura','green'),'Aprobada · sugerida','v1','Inferencia A'],
   ['actualizar_precio',pill('Escritura','blue'),'Aprobada · sugerida','v1','Inferencia A'],
   ['cambiar_fondo',pill('Crítica','amber'),'Pendiente de revisión','v1','Inferencia A'],
   ['procesar_lote',pill('Sin clasificar','red'),'Pendiente de revisión','v2','Inferencia A']
  ],[25,18,27,12,18]))+
  '<div class="m-warning" style="margin-top:13px">S1 <b>no ejecuta</b> estas herramientas por la puerta. Solo registra intención y catálogo; el control real por MCP se incorpora en S4.</div>',

 's1-shadow':()=>mHeader('Detalle de decisión','TRACE-DEMO-0007 · inferencia · usuario no identificado',badge('En sombra','purple')+tip('Qué significa en sombra',explanations.shadow))+
  '<div class="m-grid three" style="margin-bottom:11px">'+kpi('Resultado del modelo','Conservado','ALLOW_SHADOW')+kpi('Costo','US$ 0,003','Ejemplo sintético')+kpi('Correlación','Trace ID','tool_call_id')+'</div>'+
  '<div class="m-grid">'+
   panel('Historia del turno', '<div class="m-event"><div><strong>1. Solicitud recibida</strong><small>agent_token válido · modelo permitido</small></div>'+badge('OK','green')+'</div>'+
    '<div class="m-event amber"><div><strong>2. Cedar evalúa tool_call</strong><small>eliminar_registro · Preset 1</small></div>'+badge('Sombra','purple')+'</div>'+
    '<div class="m-event green"><div><strong>3. Respuesta devuelta</strong><small>La intención se conserva en descubrimiento</small></div>'+badge('Paso','green')+'</div>')+
   panel('Controles separados','<div class="m-rule"><div><strong>Cedar</strong><div class="m-section-note">En activo se habría denegado.</div></div>'+badge('En sombra','purple')+'</div>'+
    '<div class="m-rule" style="margin-top:8px"><div><strong>Guardrail</strong><div class="m-section-note">Último turno del usuario y salida.</div></div>'+badge('Sin intervención','green')+'</div>'+
    '<div class="m-rule" style="margin-top:8px"><div><strong>PII '+tip('Datos personales en la salida',explanations.pii)+'</strong><div class="m-section-note">RUT detectado y enmascarado.</div></div>'+badge('Enmascarada','blue')+'</div>')+
  '</div>',

 's2-activate':()=>mHeader('Control del agente','agente-demo · responsable asignado',badge('Activo','green')+btn('Suspender','danger')+tip('Suspensión','REG-03: el Kill Switch corta el tráfico de inferencia y MCP del agente en 60 segundos o menos. Reactivar restaura su modo anterior.'))+
  '<div class="m-grid three" style="margin-bottom:12px">'+kpi('Modo actual','Activo','REG-01 · cambio registrado')+kpi('Modelos','1','Permitido en catálogo')+kpi('Preset','1','Caja Negra Segura')+'</div>'+
  '<div class="m-columns">'+
    panel('Impacto previo a la activación '+tip('Activación informada','REG-01: antes de pasar a activo el operador ve denegaciones hipotéticas y tools sin clasificar. No se activa a ciegas.'),
     '<div class="m-grid">'+kpi('Denegaciones en sombra','3','Ventana de ejemplo')+kpi('Tools sin revisar','2','Impiden pasos del catálogo')+'</div>'+
     '<div class="m-warning" style="margin-top:12px">Confirmación previa: 3 solicitudes habrían sido denegadas; 2 tools siguen pendientes.</div>')+
    panel('Controles activos','<div class="m-rule"><span>Bloquear tool destructiva</span>'+badge('DENY','red')+'</div>'+
      '<div class="m-rule" style="margin-top:8px"><span>Modelo distinto al permitido</span>'+badge('403','red')+'</div>'+
      '<div class="m-rule" style="margin-top:8px"><span>Falla de política</span>'+badge('Cerrada','red')+'</div>'+
      '<p class="m-section-note">El agente recibe el motivo dentro del protocolo cuando corresponde.</p>')+
  '</div>',

 's2-limits':()=>mHeader('Consumo y límites','Presupuesto y tasa por agente · ajustes sin despliegue.',btn('Editar límites','primary')+tip('Tres acciones al alcanzar el límite','FIN-02: solo alerta, throttle con HTTP 429/Retry-After o bloqueo con 403. Avisos en 50, 80 y 100 %.'))+
  '<div class="m-grid three" style="margin-bottom:14px">'+kpi('Costo del período','US$ 41','Presupuesto US$ 50')+kpi('Tokens','74.200','Máximo 100.000')+kpi('Solicitudes/min','28','Máximo 50')+'</div>'+
  panel('Presupuesto diario', '<div class="m-statline"><strong>US$ 41 de US$ 50</strong><span>82 % · alerta 80 %</span></div><div style="height:9px"></div>'+bar(82,'amber')+
   '<div style="display:flex;gap:8px;margin-top:13px">'+badge('50 %','green')+badge('80 %','amber')+badge('100 % · bloquear','red')+'</div>')+
  '<div class="m-grid" style="margin-top:12px">'+panel('Acción por límite','<div class="m-rule"><span>Presupuesto USD</span>'+badge('Bloquear · 403','red')+'</div><div class="m-rule" style="margin-top:7px"><span>Solicitudes/minuto</span>'+badge('Throttling · 429','amber')+'</div>')+
  panel('Seguimiento','<div class="m-rule"><span>Latencia gobierno p50/p95</span><strong>Medida</strong></div><div class="m-rule" style="margin-top:7px"><span>Tarifas por modelo</span><strong>Versionadas</strong></div>')+'</div>',

 's3-identity':()=>mHeader('Identidad y resultados por rol','Conexión C · el usuario viaja en X-Gov-User-Token.',badge('C · opcional','purple')+tip('Autenticación del usuario','IDN-01: la puerta verifica la firma y claims del JWT enviado por el agente; no administra la autenticación entre usuario y aplicación cliente.'))+
  '<div class="m-grid" style="margin-bottom:11px">'+
    panel('Ana · rol consulta','<div class="m-identity"><span class="m-person">A</span><div><b>ana.consulta</b><br><small>Token válido · sin pii_access</small></div></div>'+
    '<div class="m-divider"></div><span class="m-mini-tag">RESPUESTA DEL MODELO</span><div class="m-rule" style="margin-top:8px"><span>RUT: <b>**.***.***-*</b><br>Correo: <b>***@***</b></span>'+badge('PII oculto','blue')+'</div>')+
    panel('Elena · rol aprobador + pii_access','<div class="m-identity"><span class="m-person">E</span><div><b>elena.aprobadora</b><br><small>Token válido · permiso pii_access</small></div></div>'+
    '<div class="m-divider"></div><span class="m-mini-tag">RESPUESTA DEL MODELO</span><div class="m-rule" style="margin-top:8px"><span>RUT: <b>12.345.678-5</b><br>Correo: <b>elena@ejemplo.cl</b></span>'+badge('Autorizado','green')+'</div>')+
  '</div><div class="m-warning">Sin JWT, la solicitud no falla: se registra como <b>solo_workload</b>, y las reglas aplican al agente, no a un usuario inventado.</div>',

 's3-user-spend':()=>mHeader('Consumo por usuario','La misma consola S2, ahora con atribución por persona.',badge('A + C','purple')+tip('Cuotas por usuario','FIN-03 agrega costo, presupuesto, tokens y tasa por usuario cuando C está presente; mantiene métricas agregadas por agente.'))+
  '<div class="m-grid three" style="margin-bottom:11px">'+kpi('Agente demo','US$ 41','Total de todas sus solicitudes')+kpi('Con C válido','6 / 10','Solicitudes ilustrativas')+kpi('Sin usuario','4 / 10','solo_workload')+'</div>'+
  panel('Consumo y límites por principal',table(['Principal','Rol','Solicitudes','Costo','Límite USD','Estado'],[
   ['ana.consulta','consulta','4','US$ 10','US$ 15',pill('Alerta 80 %','amber')],
   ['elena.aprobadora','aprobador','2','US$ 17','US$ 20',pill('Alerta 80 %','amber')],
   ['solo_workload','agente','4','US$ 14','—',pill('Sin C','blue')]
  ],[24,17,16,15,13,15]))+
  '<div class="m-grid" style="margin-top:12px">'+panel('Política de usuario','<div class="m-rule"><span>ana.consulta · presupuesto diario</span>'+badge('Solo alerta','blue')+'</div>')+
   panel('Condición de medición','<div class="m-section-note">Usuario registrado solo con JWT válido. Los ejemplos no corresponden a usuarios reales.</div>')+'</div>',


 's4-mcp':()=>mHeader('Tools por la puerta','Inventario S1 ampliado: ejecución y credenciales.',badge('B · parcial','amber')+tip('Cobertura parcial de B',explanations.mcp))+
   '<div class="m-grid three" style="margin-bottom:11px">'+kpi('Tools declaradas','4','Inferencia A')+kpi('Vía MCP','3 de 4','Solo 3 gobernadas')+kpi('Fuera de puerta','1','Ejecución no controlada')+'</div>'+
   panel('Catálogo de tools y targets',table(['Tool','Clase','Destino','Aprobación','Ejecución'],[
    ['consultar_ficha',pill('Lectura','green'),'Lambda MCP',pill('Aprobada','green'),pill('Gobernada','green')],
    ['actualizar_precio',pill('Escritura','blue'),'OpenAPI MCP',pill('Aprobada','green'),pill('Gobernada','green')],
    ['eliminar_registro',pill('Crítica','red'),'Lambda MCP',pill('No aprobada','red'),pill('Bloqueada','red')],
    ['procesar_lote',pill('Sin clasificar','amber'),'Local',pill('Por revisar','amber'),pill('Fuera','amber')]
   ],[24,17,18,20,21]))+
   '<div class="m-grid" style="margin-top:11px">'+
    panel('Credenciales del destino '+tip('Bóveda de credenciales','PLT-02: AgentCore Identity o Secrets Manager. El agente no conoce la API key de la tool.'),
       '<div class="m-rule"><span>Target OpenAPI · API key</span>'+badge('En bóveda','green')+'</div>')+
    panel('Control de respuesta '+tip('Datos personales en MCP','GRD-04: la respuesta de tools/call se enmascara, salvo pii_access con C. El contenido de evidencia también se protege.'),
       '<div class="m-rule"><span>tools/call · respuesta</span>'+badge('PII filtrada','blue')+'</div>')+
   '</div>',

 's4-policy':()=>mHeader('Constructor de reglas','Condiciones por parámetro · esquema validado.',btn('Guardar regla','primary')+tip('Una sola regla sobre dos canales','POL-04: se configura desde consola, valida parámetros tipados y se evalúa tanto en intención de tool (A) como en ejecución MCP (B).'))+
  '<div class="m-columns">'+
   panel('Nueva regla', '<div class="m-grid">'+field('Efecto','Denegar')+field('Tool','actualizar_precio')+
    field('Parámetro numérico','descuento')+field('Condición','mayor que 10')+'</div>'+
    '<div class="m-divider"></div><div class="m-rule"><span><b>DENEGAR</b> si descuento &gt; 10</span>'+badge('Borrador','amber')+'</div>'+
    '<p class="m-section-note">Principal: operador · herramienta aprobada. Guardado genera una versión nueva.</p>')+
   panel('Validación antes de aplicar','<div class="m-test-rows" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+
     '<div class="m-test"><small>descuento = 8</small><strong style="color:#087f68">ALLOW</strong><small>Condición falsa</small></div>'+
     '<div class="m-test"><small>descuento = 25</small><strong style="color:#b64245">DENY</strong><small>Condición verdadera</small></div></div>'+
     '<div class="m-divider"></div><div class="m-good">Parámetro declarado en el esquema JSON de la tool: número.</div>'+
     '<div style="height:11px"></div>'+btn('Abrir editor Cedar')+
     '<p class="m-section-note">Una regla inválida no se guarda. Su versión y autor se conservan.</p>')+
  '</div>',

 's4-guide':()=>mHeader('Guía de conexión','El agente se integra por partes, en cualquier orden después de A.',badge('A + B parcial + C','blue')+tip('Conexión progresiva','OPS-01: muestra los pasos A/B/C y lo que habilita cada conexión. B y C son independientes y su cobertura real se mide, no se presume.'))+
  '<div class="m-grid three" style="margin-bottom:12px">'+
    panel('A · inferencia '+badge('Conectada','green'),'<div class="m-code" style="margin-top:6px;font-size:10px">BASE_URL={gateway}<br>/inference/v1</div><p class="m-section-note">Modelo, costo y tool_calls.</p>')+
    panel('B · tools MCP '+badge('Parcial','amber'),'<div class="m-code" style="margin-top:6px;font-size:10px">MCP_URL={gateway}<br>/mcp</div><p class="m-section-note">3/4 tools usan la puerta.</p>')+
    panel('C · identidad '+badge('Habilitada','green'),'<div class="m-code" style="margin-top:6px;font-size:10px">X-Gov-User-Token:<br>&lt;JWT OIDC válido&gt;</div><p class="m-section-note">Rol por solicitud.</p>')+
  '</div>'+panel('Siguiente paso recomendado','<div class="m-rule"><span>Registrar procesar_lote como target MCP y aprobar su clasificación</span>'+btn('Ver instrucciones','primary')+'</div>'+
    '<div class="m-hint" style="margin-top:11px">Una tool local sigue fuera de la puerta. No se contabiliza como gobernada por ejecución.</div>')+
  '<div class="m-section-note">Validación técnica asociada a S4: matriz versionada de ≥30 escenarios ALLOW/DENY con proveedor simulado (POL-02). No es una pantalla adicional del producto.</div>',

 's5-approvals':()=>mHeader('Aprobaciones','Solicitudes críticas retenidas; nunca ejecutadas por anticipado.',badge('2 pendientes','amber')+tip('Retención de operación',explanations.approval))+
  '<div class="m-grid three" style="margin-bottom:12px">'+kpi('Pendientes','2','A la espera de aprobador')+kpi('Vencidas','1','Sin ejecución')+kpi('Plazo por defecto','15 min','Configurable por solicitud')+'</div>'+
  '<div class="m-columns reverse">'+
    panel('Bandeja de trabajo', '<div class="m-event amber"><div><strong>APR-0042 · cambiar_fondo</strong><small>Diego · operador · 12 min</small></div>'+badge('Pendiente','amber')+'</div>'+
     '<div class="m-event amber"><div><strong>APR-0043 · procesar_lote</strong><small>solo_workload · 4 min</small></div>'+badge('Pendiente','amber')+'</div>'+
     '<div class="m-event"><div><strong>APR-0041 · transferir_fondos</strong><small>Venció · no ejecutada</small></div>'+badge('Vencida')+'</div>')+
    panel('Solicitud APR-0042 '+tip('Separación de funciones','HITL-03: el originador no puede aprobar su propia solicitud. Sin C, un agent_token tampoco puede aprobar; sí puede un humano con rol aprobador.'),
      '<div class="m-statline"><strong>cambiar_fondo</strong>'+badge('12 min restantes','amber')+'</div>'+
      '<div class="m-divider"></div><div class="m-grid">'+
      field('Agente','agente-demo')+field('Originador','Diego · operador')+
      field('Parámetro','fondo = balanceado')+field('Estado','PENDING_APPROVAL')+'</div>'+
      '<div class="m-warning" style="margin-top:12px">El originador no puede aprobar. Su herramienta todavía no se ha ejecutado.</div>'+
      '<div class="m-tools" style="margin-top:13px">'+btn('Aprobar','primary')+btn('Rechazar','danger')+tip('Resultado en el protocolo','HITL-02: la aprobación válida ejecuta una sola vez; el agente recupera el resultado con gov_aprobacion_estado. Rechazar y vencer nunca ejecutan.')+'</div>')+
  '</div>',

 's6-search':()=>mHeader('Buscar transacciones','Filtrar evidencia por varios criterios a la vez.',btn('Buscar','primary')+tip('Consulta del índice','EVD-02: filtros combinables por trace_id, usuario, agente, período, modelo, tool, decisión, canal y conexiones. Meta de respuesta < 5 s.'))+
  '<div class="m-filter"><span>Agente: agente-demo</span><span>Usuario: todos</span><span>Decisión: DENY</span><span>Canal: todos</span></div>'+
  '<div class="m-filter"><span>Período: últimos 7 días</span><span>Modelo: todos</span><span>Tool: todas</span><span>Conexiones: A/B/C</span></div>'+
  panel('Resultados de la búsqueda',table(['Trace ID','Agente','Usuario','Tool / modelo','Decisión','Fecha'],[
   ['TRC-0137','agente-demo','ana.consulta','actualizar_precio',pill('DENY','red'),'03 nov, 10:44'],
   ['TRC-0122','agente-demo','solo_workload','eliminar_registro',pill('DENY','red'),'03 nov, 10:02'],
   ['TRC-0104','agente-demo','diego.operador','cambiar_fondo',pill('DENY','red'),'02 nov, 17:11']
  ],[17,17,18,21,13,14]))+
  '<div class="m-tiles" style="margin-top:12px">'+
   mFact('Consulta trazable','Cada resultado abre la ruta forense sin consultar manualmente DynamoDB o S3.')+
   mFact('Acceso por rol','Auditor: solo lectura. No puede editar reglas ni aprobar solicitudes.')+'</div>',

 's6-forensic':()=>mHeader('Ruta forense','TRC-0137 · caso completo · correlación tool_call_id',badge('Evidencia S3','green')+tip('Prueba de inmutabilidad',explanations.immutable))+
  '<div class="m-grid" style="grid-template-columns:1.08fr .92fr">'+
   panel('Secuencia de una transacción','<div class="m-list">'+
    '<div class="m-list-item"><span class="m-marker">1</span><div><strong>Solicitud del usuario</strong><div class="m-section-note">ana.consulta → agente-demo · JWT verificado</div></div></div>'+
    '<div class="m-list-item"><span class="m-marker">2</span><div><strong>Modelo sugiere actualizar_precio</strong><div class="m-section-note">tool_call_id call_29 · descuento 25</div></div></div>'+
    '<div class="m-list-item"><span class="m-marker">3</span><div><strong>Denegación Cedar</strong><div class="m-section-note">regla descuento_máximo · v3 · DENY</div></div></div>'+
    '<div class="m-list-item"><span class="m-marker">4</span><div><strong>Respuesta gobernada</strong><div class="m-section-note">Sin tool_call denegado · evidencia sellada</div></div></div>'+
    '</div>')+
   '<div class="m-stack">'+
    panel('Regla y autor '+tip('Versión exacta','EVD-03: la transacción conserva la versión de reglas y configuración con la que se decidió, aunque luego se hayan modificado.'),
      '<div class="m-rule"><div><strong>descuento_máximo · v3</strong><div class="m-section-note">DENY si descuento &gt; 10</div></div>'+badge('Aplicada','red')+'</div>'+
      '<div class="m-section-note">Creada por operador plataforma · historial versionado.</div>')+
    panel('Sello Object Lock '+tip('Borrado de prueba','EVD-06: se intenta borrar el objeto con un rol sin permiso de bypass y se registra el rechazo S3. El botón es ilustrativo, no ejecuta AWS.'),
      '<div class="m-rule"><span>Object Lock · GOVERNANCE</span>'+badge('Retenido','green')+'</div>'+
      '<div class="m-statline" style="margin:10px 0"><span>Retención según configuración</span><span>S3 · evidencia JSON</span></div>'+
      btn('Probar inmutabilidad','primary')+'<div class="m-good" style="margin-top:10px">Ejemplo esperado: S3 rechaza el borrado; el objeto permanece.</div>')+
   '</div></div>',


};
init();
})();