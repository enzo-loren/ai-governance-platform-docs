import React,{useEffect,useRef,useState} from "react";
import Button from "@cloudscape-design/components/button";
import Badge from "@cloudscape-design/components/badge";

/**
 * CON-08 · Proyección ejecutable de una pantalla, no zoom del formulario.
 * No accede a AWS ni modifica el estado del agente. Cada escena describe un
 * resultado contractual esperado, con cantidades explícitamente sintéticas.
 */
const STORIES={
 "s0-connect":{
  overline:"S0 · Fundación",title:"Un agente, una identidad",
  subtitle:"Conectar un agente existente sin compartir su credencial con otros.",
  steps:[
   {name:"Registrar",eyebrow:"01 · Identidad del workload",headline:"El agente tiene su propia API key",
    state:"Credencial individual",tone:"blue",
    signal:"Alta individual y entrega única",outcome:"El operador recibe BASE_URL y agent_token. No puede recuperar la clave después.",
    metrics:[["1","token por agente"],["1","entrega visible"],["A + B","mismo token del agente"]]},
   {name:"Conectar",eyebrow:"02 · Primera inferencia",headline:"La petición entra por la puerta A",
    state:"Autenticación obligatoria",tone:"green",
    signal:"SDK OpenAI → gateway → modelo",outcome:"Token incorrecto: 401. La key de un agente no da identidad de otro.",
    metrics:[["401","credencial inválida"],["A","inferencia"],["Trace ID","evidencia correlacionada"]]}
  ]
 },
 "s0-live":{
  overline:"S0 · Telemetría",title:"Qué ocurre en cada solicitud",
  subtitle:"Flujo de muestra a velocidad legible; estos eventos son ficticios.",
  auto:true,
  steps:[
   {name:"Permitida",eyebrow:"01 · TRC-0101",headline:"Inferencia gobernada",
    state:"Permitido",tone:"green",
    signal:"200 · Respuesta permitida",outcome:"El registro muestra modelo, tokens, costo y una referencia al rastro de evidencia.",
    metrics:[["1.300","tokens (demo)"],["US$ 0,003","costo ilustrativo"],["128 ms","latencia ilustrativa"]]},
   {name:"Simulada",eyebrow:"02 · TRC-0102",headline:"Proveedor de prueba",
    state:"Permitido",tone:"blue",
    signal:"200 · Modelo simulado",outcome:"El proveedor simulado permite verificar contratos sin usar un modelo facturado.",
    metrics:[["840","tokens (demo)"],["US$ 0,000","costo ilustrativo"],["94 ms","latencia ilustrativa"]]},
   {name:"Denegada",eyebrow:"03 · TRC-0103",headline:"Sin identidad válida, no hay inferencia",
    state:"Denegado",tone:"orange",
    signal:"401 · agent_token inválido",outcome:"La solicitud se rechaza antes de entrar al modelo.",
    metrics:[["0","tokens al modelo"],["401","respuesta de rechazo"],["12 ms","latencia ilustrativa"]]}
  ]
 },
 "s1-coverage":{
  overline:"S1 · Gobernanza",title:"Hasta dónde llega el control",
  subtitle:"Índice del catálogo, no una puntuación general de seguridad. Máximos referenciales en activo.",
  steps:[
   {name:"A",eyebrow:"01 · Inferencia",headline:"Conexión A",
    state:"41 %",tone:"blue",
    signal:"Máximo referencial del catálogo",outcome:"Gobierna la inferencia. No controla la ejecución de herramientas fuera de MCP.",
    metrics:[["A","obligatoria"],["B","sin cubrir ejecución"],["C","sin identidad humana"]]},
   {name:"A+C",eyebrow:"02 · Identidad",headline:"A + C",
    state:"56 %",tone:"blue",
    signal:"Máximo referencial del catálogo",outcome:"Añade identidad de usuario y controles por rol, pero no la ejecución MCP.",
    metrics:[["JWT","por solicitud"],["Roles","verificados"],["MCP","sin cobertura de ejecución"]]},
   {name:"A+B",eyebrow:"03 · Ejecución",headline:"A + B",
    state:"67 %",tone:"green",
    signal:"Máximo referencial del catálogo",outcome:"Añade targets MCP registrados. Las tools locales siguen fuera de la puerta.",
    metrics:[["MCP","solo tools conectadas"],["C","no obligatorio"],["Parcial","si hay tools locales"]]},
   {name:"A+B+C",eyebrow:"04 · Combinación",headline:"A + B + C",
    state:"89 %",tone:"green",
    signal:"Máximo referencial del catálogo",outcome:"Identidad humana y ejecución MCP; aún hay controles fuera del perímetro.",
    metrics:[["A","inferencia"],["B","ejecución MCP"],["C","identidad del usuario"]]}
  ]
 },
 "s1-shadow":{
  overline:"S1 · Evaluación",title:"La regla observa antes de bloquear",
  subtitle:"Historia ilustrativa de un turno en modo descubrimiento.",
  steps:[
   {name:"Entrada",eyebrow:"01 · Solicitud",headline:"El agent_token identifica al agente",
    state:"Autenticado",tone:"blue",
    signal:"A · Petición aceptada",outcome:"Se registra el agente y comienza la correlación del turno.",
    metrics:[["A","inferencia"],["1","agente"],["Trace ID","referencia del turno"]]},
   {name:"Sombra",eyebrow:"02 · Cedar",headline:"La política detecta sin interrumpir",
    state:"En sombra",tone:"orange",
    signal:"Habría denegado eliminar_registro",outcome:"La regla se evalúa; en descubrimiento no bloquea solo por esta decisión de Cedar.",
    metrics:[["0","bloqueos de política"],["1","denegación potencial"],["S1","descubrimiento"]]},
   {name:"Salida",eyebrow:"03 · Protección",headline:"Los datos sensibles se enmascaran",
    state:"PII protegida",tone:"green",
    signal:"Respuesta del modelo revisada",outcome:"El enmascaramiento de PII conserva su efecto incluso si Cedar opera en sombra.",
    metrics:[["PII","enmascarada"],["Cedar","sombra"],["Evidencia","registrada"]]}
  ]
 },
 "s2-activate":{
  overline:"S2 · Operación",title:"Del descubrimiento al control",
  subtitle:"Qué cambia al activar el gobierno y cómo detener un solo agente.",
  steps:[
   {name:"Descubrimiento",eyebrow:"01 · Observar primero",headline:"Entendemos el impacto sin bloquear",
    state:"Observación",tone:"blue",
    signal:"Cedar en sombra → inferencias continúan",
    outcome:"Se detectan las decisiones que cambiarían antes de activar políticas. Los datos siguientes son una muestra ficticia.",
    metrics:[["3 de 12","denegaciones potenciales (demo)"],["2","tools por revisar (demo)"],["0","bloqueos por Cedar en sombra"]]},
   {name:"Modo activo",eyebrow:"02 · Aplicar controles",headline:"La decisión pasa a ser exigible",
    state:"Enforcement",tone:"green",
    signal:"Tool destructiva: respuesta gobernada · Modelo prohibido: 403",
    outcome:"Cedar pasa de observación a bloqueo. Una falla de un control crítico debe responder 503 en activo.",
    metrics:[["403","modelo no autorizado"],["503","control indisponible"],["10 s","objetivo para cambios en caliente"]]},
   {name:"Suspensión",eyebrow:"03 · Contener un incidente",headline:"Se detiene ese agente, no todos",
    state:"Kill Switch",tone:"orange",
    signal:"A + B → 403 para el agente suspendido",
    outcome:"La suspensión afecta sus canales de inferencia y MCP. Los demás agentes y sus credenciales continúan operando.",
    metrics:[["≤ 60 s","objetivo contractual"],["1","agente suspendido"],["0","otros agentes afectados"]]}
  ]
 },
 "s5-approvals":{
  overline:"S5 · Supervisión",title:"Una operación crítica necesita a otra persona",
  subtitle:"Flujo HITL de muestra. No se ejecuta ninguna herramienta real.",
  steps:[
   {name:"Retener",eyebrow:"01 · Tool MCP",headline:"La ejecución queda pendiente",
    state:"PENDING_APPROVAL",tone:"orange",
    signal:"MCP responde con ID y vencimiento",outcome:"Se registran agente, usuario, tool y argumentos protegidos sin ejecutar la operación.",
    metrics:[["15 min","plazo por defecto"],["0","ejecuciones previas"],["ID","consulta de estado"]]},
   {name:"Separar",eyebrow:"02 · Aprobación humana",headline:"El originador no puede aprobarse",
    state:"Control de funciones",tone:"blue",
    signal:"Autoaprobación / agent_token → 403",outcome:"Solo una persona distinta con rol aprobador puede tomar la decisión.",
    metrics:[["403","actor no autorizado"],["2","roles diferenciados"],["1","decisión registrada"]]},
   {name:"Resolver",eyebrow:"03 · Resultado final",headline:"El agente obtiene una respuesta rastreable",
    state:"Ejecución única",tone:"green",
    signal:"APROBADA_EJECUTADA / RECHAZADA / VENCIDA",outcome:"En caso aprobado, la ejecución pasa otra vez por la puerta. No debe ejecutarse dos veces.",
    metrics:[["1","máximo de ejecuciones"],["MCP","misma puerta"],["Evidencia","decisión + resultado"]]}
  ]
 },
 "s6-forensic":{
  overline:"S6 · Auditoría",title:"Reconstruir una decisión",
  subtitle:"Historia ficticia para estudiar rastreabilidad; no prueba almacenamiento inmutable real.",
  steps:[
   {name:"Solicitud",eyebrow:"01 · Trace ID",headline:"Quién llamó y a qué agente",
    state:"Contexto inicial",tone:"blue",
    signal:"Principal + agente + canal + trace_id",outcome:"Se conserva la identidad efectiva y la correlación entre inferencias y tool_calls.",
    metrics:[["Trace ID","turno asociado"],["Agente","workload"],["Usuario","si existe C"]]},
   {name:"Inferencia",eyebrow:"02 · Modelo",headline:"Qué pidió hacer el modelo",
    state:"Intención registrada",tone:"blue",
    signal:"Modelo + tool_call_id + argumentos",outcome:"La intención puede observarse mediante A, incluso si la ejecución permanece fuera de MCP.",
    metrics:[["A","inferencia"],["B","ejecución solo si MCP"],["C","identidad del usuario"]]},
   {name:"Decisión",eyebrow:"03 · Cedar",headline:"Qué regla decidió y con qué versión",
    state:"Regla trazable",tone:"orange",
    signal:"Preset, política, autor y versión",outcome:"La ruta forense debe poder mostrar el texto exacto de la regla que se aplicó.",
    metrics:[["Regla","texto exacto"],["Versión","configuración"],["Autor","cambio registrado"]]},
   {name:"Evidencia",eyebrow:"04 · S3",headline:"La evidencia debe resistir borrados",
    state:"Object Lock",tone:"green",
    signal:"Modo GOVERNANCE · bypass privilegiado posible",outcome:"La inmutabilidad debe comprobarse contra AWS; el prototipo no demuestra una prueba de borrado.",
    metrics:[["S3","copia asíncrona"],["Retención","configurada"],["Prueba","pendiente en AWS"]]}
  ]
 }
};

export const PRESENTATION_SCREEN_IDS=Object.freeze(Object.keys(STORIES));

export default function PresentationStage({screen,simulation,onExit}) {
 const story=STORIES[screen.id]||STORIES["s2-activate"];
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const [fullscreen,setFullscreen]=useState(false);
 const headingRef=useRef(null);
 const total=story.steps.length;
 const current=story.steps[index];
 const agent=simulation.agentRegistry?.find(item=>item.id===simulation.selectedAgentId)||simulation.agentRegistry?.[0];
 const agentName=agent?.name||simulation.agent||"Agente de demostración";
 const mode=agent?.mode||simulation.mode||"Descubrimiento";
 useEffect(()=>{headingRef.current?.focus()},[]);
 useEffect(()=>{
  if(!story.auto||paused)return;
  const interval=setInterval(()=>setIndex(i=>(i+1)%total),4600);
  return()=>clearInterval(interval);
 },[story.auto,paused,total]);
 useEffect(()=>{
  const changed=()=>setFullscreen(Boolean(document.fullscreenElement));
  document.addEventListener("fullscreenchange",changed);
  return()=>document.removeEventListener("fullscreenchange",changed);
 },[]);
 const toggleFullscreen=()=>{
  if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{});return}
  document.getElementById("gov-presentation")?.requestFullscreen?.().catch(()=>{});
 };
 const choose=i=>{setIndex(i);if(story.auto)setPaused(true)};
 const exit=()=>{if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});onExit()};
 return <div id="gov-presentation" className="gov-presentation" data-testid="presentation-stage" data-screen={screen.id}>
  <div className="gov-present-shell">
   <header className="gov-present-top">
    <div className="gov-present-brand">
     <span className="gov-present-wordmark">AI Governance</span>
     <span className="gov-present-divider" aria-hidden="true"></span>
     <span>Modo presentación</span>
     <Badge color="blue">DEMO · Datos sintéticos</Badge>
    </div>
    <div className="gov-present-actions">
     <Button onClick={toggleFullscreen} iconName={fullscreen?"shrink":"expand"}>{fullscreen?"Salir de pantalla completa":"Pantalla completa"}</Button>
     <Button variant="primary" onClick={exit} iconName="close" data-testid="presentation-exit">Volver a la consola</Button>
    </div>
   </header>
   <main className="gov-present-content">
    <div className="gov-present-intro">
     <div>
      <p className="gov-present-eyebrow">{story.overline} · {index+1} de {total}</p>
      <h1 ref={headingRef} tabIndex={-1} id="presentation-heading">{story.title}</h1>
      <p className="gov-present-lead">{story.subtitle}</p>
     </div>
     <div className="gov-present-agent" aria-label="Contexto del agente">
      <span>Agente seleccionado (demo)</span>
      <strong>{agentName}</strong>
      <span>Estado configurado: <b>{mode}</b></span>
     </div>
    </div>
    <div className="gov-present-main-grid" aria-live="polite" aria-atomic="true">
     <section className="gov-present-feature" aria-label="Etapa del recorrido">
      <p className="gov-present-step-kicker">{current.eyebrow}</p>
      <h2>{current.headline}</h2>
      <div className={"gov-present-state gov-present-state-"+current.tone}>
       <span className="gov-present-pulse" aria-hidden="true"></span>{current.state}
      </div>
      <p className="gov-present-outcome">{current.outcome}</p>
     </section>
     <aside className="gov-present-consequence" aria-label="Efecto en el protocolo">
      <p className="gov-present-side-title">Efecto esperado en la puerta</p>
      <div className="gov-present-signal">{current.signal}</div>
      <div className="gov-present-scope">
       <div className="gov-present-contract" role="note">Contrato objetivo · no ejecutado en AWS</div>
      </div>
     </aside>
    </div>
    <div className="gov-present-metrics" aria-label="Indicadores del escenario">
     {current.metrics.map(([value,label],i)=><div key={i} className="gov-present-metric">
      <strong>{value}</strong><span>{label}</span>
     </div>)}
    </div>
   </main>
   <nav className="gov-present-bottom" aria-label="Etapas del recorrido">
    <div className="gov-present-steps">
     {story.steps.map((item,i)=><button key={item.name} type="button" className={"gov-present-step"+(index===i?" is-active":"")}
      onClick={()=>choose(i)} aria-current={index===i?"step":undefined}>
      <span className="gov-present-step-num">{String(i+1).padStart(2,"0")}</span>
      <span>{item.name}</span>
     </button>)}
    </div>
    <div className="gov-present-navigation">
     {story.auto&&<Button onClick={()=>setPaused(s=>!s)} iconName={paused?"play":"pause"}>{paused?"Reanudar":"Pausar"}</Button>}
     <Button disabled={index===0} onClick={()=>choose(index-1)}>Anterior</Button>
     <Button variant="primary" onClick={()=>choose(index===total-1?0:index+1)}>{index===total-1?"Volver al inicio":"Siguiente"}</Button>
    </div>
   </nav>
   <div className="gov-present-footnote">Presentación del comportamiento previsto · No modifica políticas, agentes ni credenciales. Esc para salir.</div>
  </div>
 </div>;
}
