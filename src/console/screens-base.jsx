import React,{useState,useMemo,useEffect} from "react";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Badge from "@cloudscape-design/components/badge";
import Alert from "@cloudscape-design/components/alert";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import ProgressBar from "@cloudscape-design/components/progress-bar";
import Modal from "@cloudscape-design/components/modal";
import CopyToClipboard from "@cloudscape-design/components/copy-to-clipboard";
import Toggle from "@cloudscape-design/components/toggle";
import Tabs from "@cloudscape-design/components/tabs";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import {usePrototype,Explanation} from "./main.jsx";
import {AgentEnrollment,AgentSelector,AgentCredentialControls,selectedFrom} from "./agent-credentials.jsx";

const SIM="Simulación local: ningún dato fue guardado ni se invocó AWS.";
const STATUS={
 "Permitido":"success",
 "En sombra":"info",
 "Denegado":"error",
 "Filtrado":"warning",
 "Limitado":"warning",
 "Pendiente":"pending",
 "Fuera de la puerta":"stopped",
 "Sin evidencia":"error",
 "Registrada":"success",
 "Vencida":"warning"
};
function ShadowLabel(){
 return <span className="governance-shadow"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.8"/></svg>En sombra</span>;
}
function Decision({state,reason}){
 return <SpaceBetween size="xxs">{state==="En sombra"?<ShadowLabel/>:<StatusIndicator type={STATUS[state]||"info"}>{state}</StatusIndicator>}{reason&&<Box color="text-body-secondary" fontSize="body-s">{reason}</Box>}</SpaceBetween>;
}
function Why({title,children}){
 const {helpOn,showExplanations}=usePrototype();
 if(!showExplanations)return null;
 return <Button variant="link" onClick={()=>helpOn(title,children)}>¿Por qué?</Button>;
}
function Panel({title,children,info,actions}){
 return <Container header={<Header variant="h2" info={info&&<Why title={title}>{info}</Why>} actions={actions}>{title}</Header>}>{children}</Container>;
}
const dummyTools=[
 {id:"consultar_ficha",kind:"Lectura",status:"Aprobada",target:"Lambda MCP",schema:"v1"},
 {id:"actualizar_precio",kind:"Escritura",status:"Aprobada",target:"OpenAPI MCP",schema:"v1"},
 {id:"eliminar_registro",kind:"Destructiva",status:"No aprobada",target:"Lambda MCP",schema:"v1"},
 {id:"procesar_lote",kind:"Sin clasificar",status:"Pendiente de revisión",target:"Local",schema:"v2"}
];
const demoCalls=[
 {id:"TRC-0101",time:"10:43:08",agent:"agente-demo",model:"Bedrock modelo A",state:"Permitido",reason:"Inferencia aceptada",cost:"US$ 0,003",channel:"A",tokens:"1.300",latency:"128 ms"},
 {id:"TRC-0102",time:"10:42:57",agent:"agente-demo",model:"Simulado",state:"Permitido",reason:"Modelo de prueba respondió",cost:"US$ 0,000",channel:"A",tokens:"840",latency:"94 ms"},
 {id:"TRC-0103",time:"10:42:11",agent:"agente-demo",model:"—",state:"Denegado",reason:"Credencial inválida",cost:"—",channel:"A",tokens:"0",latency:"12 ms"}
];
const users=[
 {value:"ana",label:"Ana · consulta",name:"ana.consulta",role:"consulta",pii:false,requests:4,spent:10},
 {value:"elena",label:"Elena · aprobadora",name:"elena.aprobadora",role:"aprobador",pii:true,requests:2,spent:17},
 {value:"workload",label:"Sin usuario · solo_workload",name:"solo_workload",role:"agente",pii:false,requests:4,spent:14}
];
function Banner({children,type="info"}){return <Explanation type={type}>{children}</Explanation>}
function SmallKpi({title,value,context}){
 return <div className="kpi-item"><Box color="text-body-secondary" fontSize="body-s">{title}</Box><div className="kpi-value">{value}</div><Box color="text-body-secondary" fontSize="body-s">{context}</Box></div>;
}
const parseVal=x=>Number(String(x).replace(",","."));
const selectOptions=(list)=>list.map(([value,label])=>({value,label}));

function BasicAgents(){
 return <SpaceBetween size="l"><AgentEnrollment/><AgentCredentialControls/></SpaceBetween>;
}


function Live(){
 const {slice,navigate}=usePrototype();
 const rank=Number(slice.slice(1));
 const [paused,setPaused]=useState(false);
 const [filter,setFilter]=useState("");
 const [status,setStatus]=useState({value:"all",label:"Todos"});
 const [channel,setChannel]=useState({value:"all",label:"Todos"});
 const [principal,setPrincipal]=useState({value:"all",label:"Todos"});
 const [extra,setExtra]=useState([]);
 const [queued,setQueued]=useState([]);
 const [selection,setSelection]=useState(null);
 const base=demoCalls.map((call,i)=>({...call,principal:"solo_workload",connections:"A",medium:"Inferencia",target:call.model,policy:i===2?"auth-agent-v1":"inference-preset-1",context:i===2?"agent_token inválido":"model permitido · presupuesto disponible"}));
 const incremental=[
  {since:2,id:"TRC-0201",time:"10:44:15",agent:"agente-demo",principal:"solo_workload",medium:"Inferencia",target:"Bedrock modelo A",model:"Bedrock modelo A",state:"Denegado",reason:"Intención de eliminar_registro bloqueada",cost:"US$ 0,002",tokens:"920",latency:"112 ms",connections:"A",policy:"cedar-tool-deny-v2",context:"tool=eliminar_registro · modo activo"},
  {since:3,id:"TRC-0301",time:"10:45:23",agent:"agente-demo",principal:"ana.consulta",medium:"Inferencia",target:"Bedrock modelo A",model:"Bedrock modelo A",state:"Permitido",reason:"Rol consulta: RUT enmascarado",cost:"US$ 0,003",tokens:"1100",latency:"121 ms",connections:"A+C",policy:"pii-role-v1",context:"JWT válido · role=consulta"},
  {since:4,id:"TRC-0401",time:"10:46:32",agent:"agente-demo",principal:"ana.consulta",medium:"MCP",target:"actualizar_precio",model:"—",state:"Denegado",reason:"descuento 25 supera el máximo 10",cost:"—",tokens:"0",latency:"35 ms",connections:"A+B+C",policy:"cedar-mcp-v3",context:"tool=actualizar_precio · descuento=25"},
  {since:5,id:"TRC-0501",time:"10:47:40",agent:"agente-demo",principal:"elena.aprobadora",medium:"MCP",target:"cambiar_fondo",model:"—",state:"Pendiente",reason:"Operación retenida hasta aprobación",cost:"—",tokens:"0",latency:"29 ms",connections:"A+B+C",policy:"hitl-v1",context:"requiere_aprobacion · APR42 · plazo 15 min"},
  {since:6,id:"TRC-0601",time:"10:48:17",agent:"agente-demo",principal:"elena.aprobadora",medium:"MCP",target:"consultar_ficha",model:"—",state:"Permitido",reason:"Ejecución y evidencia correlacionadas",cost:"—",tokens:"0",latency:"47 ms",connections:"A+B+C",policy:"cedar-mcp-v3",context:"trace explícito · tool_call_id asociado"}
 ].filter(x=>x.since<=rank);
 const events=[...extra,...incremental,...base];
 const principals=[...new Set(events.map(x=>x.principal))];
 const filtered=events.filter(x=>(status.value==="all"||x.state===status.value)&&
  (channel.value==="all"||x.medium===channel.value)&&
  (principal.value==="all"||x.principal===principal.value)&&
  [x.agent,x.id,x.reason,x.target,x.principal].join(" ").toLowerCase().includes(filter.toLowerCase()));
 const addEvent=()=>{
  const i=extra.length+queued.length+1;
  const x={...base[0],id:"TRC-DEMO-"+String(i).padStart(3,"0"),time:new Date().toLocaleTimeString("es-CL",{hour12:false}),reason:"Nueva inferencia de demostración "+i};
  if(paused)setQueued(old=>[x,...old]);else setExtra(old=>[x,...old]);
 };
 const togglePause=()=>{
  if(paused){setExtra(old=>[...queued,...old]);setQueued([]);}
  setPaused(x=>!x);
 };
 const choose=x=>setSelection(x);
 return <SpaceBetween size="l">
  <ColumnLayout columns={3} variant="text-grid">
   <SmallKpi title="Solicitudes visibles" value={String(events.length)} context={"Datos sintéticos del corte "+slice}/>
   <SmallKpi title="Canales" value={rank>=4?"A + MCP":"A"} context={rank>=4?"Inferencia y ejecución":"Solo inferencia"}/>
   <SmallKpi title={paused?"En espera":"Evidencia"} value={paused?String(queued.length):"DEMO"} context={paused?"Se incorporan al reanudar":"No es telemetría AWS"}/>
  </ColumnLayout>
  <Container header={<Header variant="h2" actions={<SpaceBetween direction="horizontal" size="xs">
   <Button onClick={addEvent}>Simular solicitud</Button>
   <Button onClick={togglePause} iconName={paused?"play":"pause"}>{paused?"Reanudar":"Pausar"}</Button>
  </SpaceBetween>}>Flujo de solicitudes</Header>}>
   <SpaceBetween size="m">
    <ColumnLayout columns={2}>
     <FormField label="Buscar agente, tool, motivo o trace ID">
      <Input value={filter} onChange={({detail})=>setFilter(detail.value)} placeholder="Ej.: TRC-0401"/>
     </FormField>
     <FormField label="Estado">
      <Select selectedOption={status} onChange={({detail})=>setStatus(detail.selectedOption)}
       options={selectOptions([["all","Todos"],["Permitido","Permitido"],["Denegado","Denegado"],["Pendiente","Pendiente"]])}/>
     </FormField>
     <FormField label="Usuario">
      <Select selectedOption={principal} onChange={({detail})=>setPrincipal(detail.selectedOption)}
       options={[{value:"all",label:"Todos"},...principals.map(x=>({value:x,label:x}))]}/>
     </FormField>
     <FormField label="Canal">
      <Select selectedOption={channel} onChange={({detail})=>setChannel(detail.selectedOption)}
       options={selectOptions([["all","Todos"],["Inferencia","Inferencia A"],["MCP","Tools MCP B"]])}/>
     </FormField>
    </ColumnLayout>
    {paused&&<Alert type="warning">Vista pausada; el agente sigue operando. {queued.length} eventos de ejemplo esperan reanudación.</Alert>}
    <div className="desktop-table">
     <Table items={filtered} trackBy="id" header={<Header variant="h3" counter={"("+filtered.length+")"}>Solicitudes</Header>}
      columnDefinitions={[
       {id:"id",header:"Trace ID",width:104,cell:x=><Button variant="link" onClick={()=>choose(x)}>{x.id}</Button>},
       {id:"agent",header:"Agente / usuario",cell:x=><span>{x.agent} · {x.principal}</span>},
       {id:"medium",header:"Canal / destino",cell:x=><span>{x.medium} · {x.target}</span>},
       {id:"connections",header:"Conexiones",cell:x=>x.connections},
       {id:"state",header:"Decisión",cell:x=><Decision state={x.state} reason={x.reason}/>},
       {id:"cost",header:"Costo",cell:x=>x.cost},
       {id:"actions",header:"Detalle",width:70,cell:x=><Button variant="link" ariaLabel={"Ver decisión "+x.id} onClick={()=>choose(x)}>Ver</Button>}
      ]} empty={<Box textAlign="center" padding="l">No hay eventos para estos filtros.</Box>}/>
    </div>
    <div className="mobile-cards">
     <SpaceBetween size="s">{filtered.map(x=><div className="mobile-request" key={x.id}><Container header={<Header variant="h3" actions={<Button onClick={()=>choose(x)}>Detalle</Button>}>{x.id}</Header>}>
      <SpaceBetween size="s"><Decision state={x.state} reason={x.reason}/><KeyValuePairs columns={2} items={[
       {label:"Usuario",value:x.principal},{label:"Canal",value:x.medium},{label:"Conexiones",value:x.connections},{label:"Costo",value:x.cost}]}/></SpaceBetween>
     </Container></div>)}</SpaceBetween>
    </div>
   </SpaceBetween>
  </Container>
  <Explanation>Las filas ilustran cómo crece el flujo: inferencia A, bloqueos en S2, identidad C, MCP B, aprobaciones y auditoría. El índice real debe actualizarse en menos de 3 segundos.</Explanation>
  <Modal visible={!!selection} onDismiss={()=>setSelection(null)} header={"Decisión "+(selection?.id||"")}
   footer={<Box float="right"><Button variant="primary" onClick={()=>setSelection(null)}>Cerrar</Button></Box>}>
   {selection&&<SpaceBetween size="m">
    <Decision state={selection.state} reason={selection.reason}/>
    <KeyValuePairs columns={2} items={[
     {label:"Agente",value:selection.agent},{label:"Usuario",value:selection.principal},
     {label:"Canal y destino",value:selection.medium+" · "+selection.target},{label:"Conexiones",value:selection.connections},
     {label:"Regla",value:selection.policy},{label:"Contexto evaluado",value:selection.context},
     {label:"Tokens",value:selection.tokens},{label:"Costo",value:selection.cost}]}/>
    <Box fontFamily="monospace" fontSize="body-s">{JSON.stringify({trace_id:selection.id,decision:selection.state,policy_id:selection.policy,context:selection.context,channel:selection.medium},null,2)}</Box>
    {rank>=6&&<Button onClick={()=>{setSelection(null);navigate("s6-forensic");}}>Abrir ruta forense</Button>}
   </SpaceBetween>}
  </Modal>
 </SpaceBetween>;
}


function Coverage(){
 const {simulation,slice,showExplanations}=usePrototype();
 const [evidence,setEvidence]=useState({value:"observado",label:"Eventos de ejemplo"});
 const agent=selectedFrom(simulation);
 const rank=Number(slice.slice(1));
 const hasC=rank>=3,hasB=rank>=4;
 const connected=hasB&&simulation.toolsMcp.length>0;
 const bCount=connected?simulation.toolsMcp.length:0;
 const max=hasB?(hasC?89:67):(hasC?56:41);
 const noData=evidence.value!=="observado";
 const next=rank<2?"Revisar el catálogo de tools antes de activar en S2":!hasC?"Conectar identidad C para reglas y consumo por usuario":!hasB?"Centralizar la ejecución de tools por MCP B":bCount<4?"Mover las tools locales restantes a MCP":"Revisar las excepciones y mantener evidencia";

 const catalog=[
  ["CTRL-01","Autenticación de agente",["A"],false],["CTRL-02","Inventario de modelos",["A"],false],
  ["CTRL-03","Modelos permitidos",["A"],true],["CTRL-04","Inventario de tools",["A"],false],
  ["CTRL-05","Guardrail semántico",["A"],false],["CTRL-06","PII de respuestas del modelo",["A"],false],
  ["CTRL-07","Intenciones de tools bloqueadas",["A"],true],["CTRL-08","Costo y tokens por agente",["A"],false],
  ["CTRL-09","Presupuesto y tasa",["A"],false],["CTRL-10","Suspensión en inferencia",["A"],false],
  ["CTRL-11","Evidencia de inferencia",["A"],false],
  ["CTRL-12","Solo tools MCP aprobadas",["A","B"],true],["CTRL-13","Credenciales de tools en bóveda",["A","B"],false],
  ["CTRL-14","Reglas sobre parámetros reales",["A","B"],true],["CTRL-15","PII en respuestas MCP",["A","B"],false],
  ["CTRL-16","Aprobación humana de tools",["A","B"],true],["CTRL-17","Evidencia de ejecución MCP",["A","B"],false],
  ["CTRL-18","Suspensión de acciones MCP",["A","B"],false],
  ["CTRL-19","Principal humano en auditoría",["A","C"],false],["CTRL-20","Cuotas por usuario",["A","C"],false],
  ["CTRL-21","Acceso a PII por rol",["A","C"],false],["CTRL-22","Intención de tool por rol",["A","C"],true],
  ["CTRL-23","Ejecución real por rol",["A","B","C"],true],["CTRL-24","Separación de funciones",["A","B","C"],true],
  ["CTRL-25","Restricción de red/IAM del agente",["fuera"],false],
  ["CTRL-26","Login del usuario en aplicación del cliente",["fuera"],false],
  ["CTRL-27","Aviso y reclamos de IA en interfaz cliente",["fuera"],false]
 ];
 const fullCatalog=catalog.map(([id,name,requires,shadow])=>{
  const available=!requires.includes("fuera")&&(!requires.includes("B")||hasB)&&(!requires.includes("C")||hasC);
  const state=!available?"No disponible":noData?"Sin evidencia":shadow&&agent.mode!=="Activo"?"En sombra":"Representado";
  return {id,name,requires:requires.join("+"),state};
 });

 const controls=[
  {name:"Autenticación del agente",state:noData?"Sin evidencia":"Activo",reason:"agent_token individual · canal A"},
  {name:"Guardrail y protección de datos",state:noData?"Sin evidencia":"Activo",reason:"Inferencia A"},
  {name:"Políticas Cedar sobre intención",state:noData?"Sin evidencia":agent.mode==="Activo"?"Activo":"En sombra",reason:agent.mode==="Activo"?"Bloqueo preventivo":"Modo descubrimiento"},
  {name:"Autorización de ejecución MCP",state:hasB?(noData?"Sin evidencia":"Activo"):"No disponible",reason:hasB?bCount+" de 4 tools por MCP":"Requiere conexión B"},
  {name:"Identidad humana y límites por usuario",state:hasC?(noData?"Sin evidencia":"Activo"):"No disponible",reason:hasC?"JWT válido en 2 de 3 solicitudes de muestra":"Requiere conexión C"}
 ];
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2">Gobernanza de {agent.name}</Header>}>
   <SpaceBetween size="m">
    <div className="gov-agent-picker"><AgentSelector/></div>
    <ColumnLayout columns={3}>
     <div><Box color="text-body-secondary">A · Inferencia</Box><StatusIndicator type={noData?"warning":"success"}>{noData?"Sin datos en ventana":"Conectada · DEMO"}</StatusIndicator></div>
     <div><Box color="text-body-secondary">B · Tools MCP</Box><StatusIndicator type={hasB?"success":"stopped"}>{hasB?bCount+" de 4 tools (demo)":"No conectada"}</StatusIndicator></div>
     <div><Box color="text-body-secondary">C · Usuario</Box><StatusIndicator type={hasC?"success":"stopped"}>{hasC?"2 de 3 JWT válidos (demo)":"No conectada · solo_workload"}</StatusIndicator></div>
    </ColumnLayout>
    <ColumnLayout columns={3}>
     <SmallKpi title="Modo actual" value={agent.mode} context="3 días en este modo · DEMO"/>
     <SmallKpi title="Decisiones en sombra" value={agent.mode==="Descubrimiento"?"3 de 12":"0"} context="Solicitudes ilustrativas"/>
     <SmallKpi title="Índice calculado" value="Sin medición" context="No hay backend conectado"/>
    </ColumnLayout>
    <ProgressBar value={max} label={"Máximo de catálogo: "+max+" %"} description="Referencia con conexiones completas y controles aplicables en activo, no índice medido"/>
    <FormField label="Estado de la evidencia · ejemplo">
     <Select selectedOption={evidence} onChange={({detail})=>setEvidence(detail.selectedOption)} options={[
      {value:"observado",label:"Eventos de ejemplo"},{value:"sin_trafico",label:"Sin tráfico"},{value:"fallo",label:"Evaluación sin evidencia"}]}/>
    </FormField>
    {evidence.value==="sin_trafico"&&<Alert type="warning">Sin datos: no se calcula un índice si el agente no tuvo tráfico en la ventana.</Alert>}
    {evidence.value==="fallo"&&<Alert type="error">Sin evidencia: un control sin evaluación válida no cuenta como cumplido.</Alert>}
    <Alert type="info">Siguiente paso recomendado: {next}.</Alert>
   </SpaceBetween>
  </Container>
  <Panel title="Estado de los controles" info="El índice depende de evidencia, conexiones disponibles, aplicabilidad y modo. No mide seguridad absoluta.">
   <div className="desktop-table"><Table variant="embedded" items={controls} columnDefinitions={[
    {id:"name",header:"Control",cell:x=>x.name},
    {id:"state",header:"Estado",cell:x=>x.state==="En sombra"?<ShadowLabel/>:<StatusIndicator type={x.state==="Activo"?"success":x.state==="Sin evidencia"?"error":"stopped"}>{x.state}</StatusIndicator>},
    {id:"reason",header:"Motivo / dependencia",cell:x=>x.reason}
   ]}/></div>
   <div className="mobile-cards"><SpaceBetween size="s">{controls.map(x=><Container key={x.name} header={<Header variant="h3">{x.name}</Header>}>
    <SpaceBetween size="xs">{x.state==="En sombra"?<ShadowLabel/>:<StatusIndicator type={x.state==="Activo"?"success":x.state==="Sin evidencia"?"error":"stopped"}>{x.state}</StatusIndicator>}
     <Box color="text-body-secondary">{x.reason}</Box></SpaceBetween>
   </Container>)}</SpaceBetween></div>
  </Panel>

  <ExpandableSection headerText="Ver los 27 controles del catálogo" variant="footer">
   <div className="desktop-table"><Table items={fullCatalog} trackBy="id" variant="embedded" columnDefinitions={[
    {id:"id",header:"ID",cell:x=>x.id},
    {id:"control",header:"Control",cell:x=>x.name},
    {id:"needs",header:"Requiere",cell:x=>x.requires},
    {id:"status",header:"Estado de muestra",cell:x=>x.state==="En sombra"?<ShadowLabel/>:<StatusIndicator type={x.state==="Representado"?"info":x.state==="Sin evidencia"?"error":"stopped"}>{x.state}</StatusIndicator>}
   ]}/></div>
   <div className="mobile-cards"><SpaceBetween size="s">{fullCatalog.map(x=><Container key={x.id} header={<Header variant="h3">{x.id} · {x.name}</Header>}>
    <KeyValuePairs columns={1} items={[{label:"Requiere",value:x.requires},{label:"Estado de muestra",value:x.state}]}/>
   </Container>)}</SpaceBetween></div>
   <Explanation>“Representado” describe una capacidad de la interfaz, no una prueba de cumplimiento AWS. CTRL-25 a CTRL-27 están fuera del perímetro.</Explanation>
  </ExpandableSection>

  <Panel title="Agentes en el catálogo">
   <div className="desktop-table"><Table variant="embedded" items={simulation.agentRegistry} trackBy="id" columnDefinitions={[
    {id:"name",header:"Agente",cell:x=>x.name},
    {id:"mode",header:"Modo",cell:x=>x.mode},
    {id:"connections",header:"Conexiones en este corte",cell:()=>hasB?"A+B"+(hasC?"+C":""):hasC?"A+C":"A"},
    {id:"score",header:"Índice de cobertura",cell:()=>"Sin medición"}
   ]}/></div>
   <div className="mobile-cards"><SpaceBetween size="s">{simulation.agentRegistry.map(x=><Container key={x.id} header={<Header variant="h3">{x.name}</Header>}>
     <KeyValuePairs columns={2} items={[{label:"Modo",value:x.mode},{label:"Conexiones",value:hasB?"A+B"+(hasC?"+C":""):hasC?"A+C":"A"},{label:"Índice",value:"Sin medición"}]}/>
   </Container>)}</SpaceBetween></div>
  </Panel>
  {showExplanations&&<Alert type="info">Referencias máximas del catálogo para A / A+C / A+B / A+B+C: 41 % / 56 % / 67 % / 89 %. No equivalen a una medición en este prototipo.</Alert>}
 </SpaceBetween>;
}

function Inventory(){
 const {notify,simulation,setSimulation}=usePrototype();
 const currentAgent=selectedFrom(simulation);
 const [filter,setFilter]=useState("");
 const [selected,setSelected]=useState(null);
 const toolKey=id=>currentAgent.id+":"+id;
 const classes=[{value:"Lectura",label:"Lectura"},{value:"Escritura",label:"Escritura"},{value:"Destructiva",label:"Destructiva o crítica"},{value:"Sin clasificar",label:"Sin clasificar"}];
 const [draftClass,setDraftClass]=useState(classes[0]);
 const items=dummyTools.map(tool=>({...tool,...(simulation.toolOverrides?.[toolKey(tool.id)]||{}),schema:simulation.toolSchemaVersions?.[toolKey(tool.id)]||tool.schema}))
  .filter(tool=>tool.id.toLowerCase().includes(filter.toLowerCase()));
 const open=tool=>{
  setSelected(tool);
  setDraftClass(classes.find(option=>option.value===tool.kind)||classes[3]);
 };
 const reviewed=items.filter(tool=>tool.status==="Revisada").length;
 const unclassified=items.filter(tool=>tool.kind==="Sin clasificar").length;
 const changedSchemas=items.filter(tool=>tool.schema!==dummyTools.find(t=>t.id===tool.id)?.schema).length;
 const simulateSchemaChange=()=>{
  if(!selected)return;
  const previous=simulation.toolSchemaVersions?.[toolKey(selected.id)]||selected.schema;
  const next="v"+(Number(previous.replace("v",""))+1);
  setSimulation(prev=>({...prev,toolSchemaVersions:{...prev.toolSchemaVersions,[toolKey(selected.id)]:next},toolOverrides:{...prev.toolOverrides,[toolKey(selected.id)]:{kind:selected.kind,status:"Pendiente de revisión"}}}));
  notify("Esquema de "+selected.id+" actualizado a "+next+" en DEMO; requiere nueva revisión.");setSelected(null);
 };
 const confirm=()=>{
  if(!selected)return;
  setSimulation(prev=>({...prev,toolOverrides:{...prev.toolOverrides,[toolKey(selected.id)]:{kind:draftClass.value,status:"Revisada"}}}));
  notify("Clasificación de "+selected.id+" revisada solo en esta DEMO.");
  setSelected(null);
 };
 return <SpaceBetween size="l">
  <AgentSelector/>
  <Panel title="Descubrimiento de herramientas" info="INF-02: cada declaración de tools se cataloga por agente y versión de esquema; la clase automática es sugerida, no una aprobación.">
   <ColumnLayout columns={3}>
    <SmallKpi title="Detectadas" value="4" context="Inferencias simuladas"/>
    <SmallKpi title="Sin clasificar" value={String(unclassified)} context="Requieren revisión"/>
    <SmallKpi title="Revisadas" value={String(reviewed)} context={"Cambios de esquema: "+changedSchemas+" · demo"}/>
   </ColumnLayout>
  </Panel>
  <div className="desktop-table">
  <Table items={items} trackBy="id" header={<Header variant="h2">Inventario de tools</Header>}
   filter={<TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Filtrar por nombre"/>}
   columnDefinitions={[
    {id:"name",header:"Tool",cell:tool=><Button variant="link" onClick={()=>open(tool)}>{tool.id}</Button>},
    {id:"kind",header:"Clase",cell:tool=>tool.kind},
    {id:"schema",header:"Esquema",cell:tool=>tool.schema},
    {id:"state",header:"Clasificación",cell:tool=><StatusIndicator type={tool.status==="Revisada"?"success":"warning"}>{tool.status==="Revisada"?"Revisada":"Sugerida · revisar"}</StatusIndicator>},
    {id:"coverage",header:"Ejecución",cell:()=><StatusIndicator type="stopped">Fuera de MCP</StatusIndicator>}
   ]}/>
  </div>
  <div className="mobile-cards">
   <SpaceBetween size="s">
    <TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Buscar tool"/>
    {items.map(tool=><Container key={tool.id} header={<Header variant="h3" actions={<Button onClick={()=>open(tool)}>Revisar</Button>}>{tool.id}</Header>}>
     <SpaceBetween size="s">
      <KeyValuePairs columns={2} items={[{label:"Clase",value:tool.kind},{label:"Esquema",value:tool.schema}]}/>
      <StatusIndicator type={tool.status==="Revisada"?"success":"warning"}>{tool.status==="Revisada"?"Clasificación revisada":"Clase sugerida"}</StatusIndicator>
      <Box color="text-body-secondary" fontSize="body-s">Ejecución fuera de MCP</Box>
     </SpaceBetween>
    </Container>)}
   </SpaceBetween>
  </div>
  <Explanation>En S1 se observa la intención del modelo, no la ejecución local. En S4 las tools que pasan por MCP pueden gobernarse también al ejecutarse. La aprobación de una tool es independiente de revisar su clase.</Explanation>
  <Modal visible={!!selected} header={selected?.id||"Revisar clasificación"} onDismiss={()=>setSelected(null)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s">
    <Button onClick={()=>setSelected(null)}>Cancelar</Button>
    <Button onClick={simulateSchemaChange}>Simular cambio de esquema</Button>
    <Button variant="primary" onClick={confirm}>Confirmar clase (demo)</Button>
   </SpaceBetween></Box>}>
   <SpaceBetween size="m">
    <KeyValuePairs columns={2} items={[
     {label:"Clase inferida",value:dummyTools.find(tool=>tool.id===selected?.id)?.kind||""},
     {label:"Versión de esquema",value:selected?.schema||""},
     {label:"Esquema anterior",value:dummyTools.find(tool=>tool.id===selected?.id)?.schema||""},
     {label:"Estado",value:selected?.status==="Revisada"?"Revisada":"Sugerida · sin validar"},
     {label:"Canal",value:"A · intención, no ejecución"}
    ]}/>
    <FormField label="Clasificación revisada">
     <Select selectedOption={draftClass} options={classes} onChange={({detail})=>setDraftClass(detail.selectedOption)}/>
    </FormField>
    <Box fontSize="body-s" color="text-body-secondary">Revisar la clasificación no habilita automáticamente la ejecución: la aprobación y el control MCP son pasos separados.</Box>
   </SpaceBetween>
  </Modal>
 </SpaceBetween>;
}
function Shadow(){
 const [selected,setSelected]=useState("cedar");
 const history=[
  {id:"auth",n:"1. Solicitud recibida",state:"Permitido",why:"agent_token válido · modo descubrimiento"},
  {id:"cedar",n:"2. Política Cedar",state:"En sombra",why:"En activo se habría denegado eliminar_registro (Preset 1)"},
  {id:"guard",n:"3. Guardrail",state:"Permitido",why:"Sin intervención sobre último turno del usuario"},
  {id:"pii",n:"4. PII",state:"Permitido",why:"RUT del texto de salida enmascarado"}
 ];
 return <SpaceBetween size="l">
  <Panel title="Historia de la transacción">
   <SpaceBetween size="s">{history.map(x=><div key={x.id} className={"step-entry "+(selected===x.id?"selected":"")}>
    <Button variant="link" onClick={()=>setSelected(x.id)}>{x.n}</Button><Decision state={x.state} reason={x.why}/>{x.id==="pii"&&<Badge color="blue">PII enmascarada</Badge>}
   </div>)}</SpaceBetween>
  </Panel>
  <Panel title="Detalle de la evaluación">
   <KeyValuePairs columns={3} items={[{label:"Componente",value:history.find(x=>x.id===selected)?.n},{label:"Motivo",value:history.find(x=>x.id===selected)?.why},{label:"Trace ID",value:"TRC-DEMO-7"}]}/>
   <Explanation>En descubrimiento, Cedar evalúa en sombra. Guardrail y PII conservan su propia semántica de intervención.</Explanation>
  </Panel>
 </SpaceBetween>;
}
function ActiveAgent(){
 const {simulation,setSimulation,notify,showExplanations}=usePrototype();
 const [dialog,setDialog]=useState(null);
 const selected=selectedFrom(simulation);
 const mode=selected.mode;
 const [modelEdit,setModelEdit]=useState(null);
 const [presetEdit,setPresetEdit]=useState(null);
 const models=selectOptions([["bedrock-a","Modelo del catálogo A"],["bedrock-b","Modelo del catálogo B"],["simulado","Simulado, si está disponible"]]);
 const presets=selectOptions([["1","1 · Caja Negra Segura"],["2","2 · Operación Supervisada"],["3","3 · Blindaje Estricto"]]);
 const model=selected.model||"bedrock-a";
 const preset=selected.preset||"1";
 const updateSelected=change=>{
  setSimulation(prev=>{
   const updated=prev.agentRegistry.map(x=>x.id===selected.id?{...x,...change}:x);
   const next=updated.find(x=>x.id===selected.id);
   return {...prev,agentRegistry:updated,agent:next.name,mode:next.mode};
  });
 };
 const apply=()=>{
  if(dialog==="activate"&&!selected.owner){notify("El agente necesita un responsable antes de activarse.","error");return}
  if(dialog==="retire"){
   updateSelected({mode:"Retirado",tokens:selected.tokens.map(key=>({...key,status:"Revocada"}))});
   notify("Agente retirado solo en la demostración: todas sus claves dejan de valer.");
  }else if(dialog==="suspend"){
   updateSelected({mode:"Suspendido",priorMode:mode});
   notify("Agente "+selected.name+" suspendido en la demostración. Otros agentes no cambian.");
  }else if(dialog==="activate"){
   updateSelected({mode:"Activo"});
   notify("Agente "+selected.name+" pasa a activo en la demostración.");
  }else if(dialog==="resume"){
   updateSelected({mode:selected.priorMode||"Descubrimiento"});
   notify("Agente "+selected.name+" reactivado al modo anterior en demostración.");
  }
  setDialog(null);
 };
 const saveSettings=()=>{
  updateSelected({model:modelEdit?.value||model,preset:presetEdit?.value||preset});
  setModelEdit(null);setPresetEdit(null);
  notify("Modelos y Preset del agente "+selected.name+" cambiados en DEMO. No se aplicaron a AWS.");
 };
 const options=modelEdit||models.find(x=>x.value===model)||models[0];
 const policyOption=presetEdit||presets.find(x=>x.value===preset)||presets[0];
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2">Agente y operación</Header>}>
   <SpaceBetween size="m">
    <div className="gov-agent-picker"><AgentSelector/></div>
    <ColumnLayout columns={4}>
     <SmallKpi title="Estado" value={mode} context="Solo este agente"/>
     <SmallKpi title="API keys vigentes" value={selected.tokens.filter(x=>x.status==="Activa").length.toString()} context="A y B comparten agent_token"/>
     <SmallKpi title="Preset" value={preset} context="Configuración individual"/>
     <SmallKpi title="Responsable" value={selected.owner||"Sin asignar"} context={selected.id}/>
    </ColumnLayout>
    <SpaceBetween direction="horizontal" size="s">
     {mode==="Descubrimiento"&&<Button variant="primary" onClick={()=>setDialog("activate")}>Pasar a activo</Button>}
     {mode!=="Suspendido"&&mode!=="Retirado"&&<Button onClick={()=>setDialog("suspend")}>Suspender agente</Button>}
     {mode==="Suspendido"&&<Button onClick={()=>setDialog("resume")}>Reactivar agente</Button>}
     {mode!=="Retirado"&&<Button onClick={()=>setDialog("retire")}>Retirar agente</Button>}
    </SpaceBetween>
    {mode==="Suspendido"&&<Alert type="warning">Este agente está suspendido. En producción, sus inferencias y ejecuciones MCP deben recibir 403 en un máximo de 60 segundos. Los demás agentes siguen operando.</Alert>}
    {mode==="Retirado"&&<Alert type="error">Agente retirado. Sus credenciales deben devolver 401 y su evidencia se conserva.</Alert>}
    {mode!=="Retirado"&&<ColumnLayout columns={2}>
     <FormField label="Modelo permitido" description={showExplanations?"Cambio individual de catálogo; se aplica en ≤10 s en el producto real.":undefined}>
      <Select selectedOption={options} options={models} onChange={({detail})=>setModelEdit(detail.selectedOption)}/>
     </FormField>
     <FormField label="Preset de políticas">
      <Select selectedOption={policyOption} options={presets} onChange={({detail})=>setPresetEdit(detail.selectedOption)}/>
     </FormField>
    </ColumnLayout>}
    {mode!=="Retirado"&&<SpaceBetween size="s">
     {policyOption.value==="2"&&<Alert type="warning">Preset 2 exige identidad C para escrituras y conexión B para aprobar herramientas críticas. Lo que falte se deniega con motivo explícito.</Alert>}
     {policyOption.value==="3"&&<Alert type="warning">Preset 3 deniega por defecto hasta contar con reglas nominales por rol y tool.</Alert>}
     {presetEdit&&presetEdit.value!==preset&&<Container header={<Header variant="h3">Vista previa del cambio · datos sintéticos</Header>}>
      <SpaceBetween size="s">
       <KeyValuePairs columns={3} items={[
        {label:"Preset actual",value:presets.find(x=>x.value===preset)?.label||preset},
        {label:"Candidato",value:presetEdit.label},
        {label:"Solicitudes cuya decisión cambiaría",value:presetEdit.value==="3"?"3 de 12":presetEdit.value==="2"?"2 de 12":"1 de 12"}
       ]}/>
       <Box color="text-body-secondary" fontSize="body-s">Muestra de la ventana: eliminar_registro · actualizar_precio. Cantidades ilustrativas, no obtenidas de evidencia. En el producto deben recalcularse sobre trazas reales (POL-05).</Box>
      </SpaceBetween>
     </Container>}
     <Button disabled={!modelEdit&&!presetEdit} onClick={saveSettings}>Guardar configuración (demo)</Button>
    </SpaceBetween>}
   </SpaceBetween>
  </Container>
  <AgentCredentialControls/>
  <Container header={<Header variant="h2">Impacto de activar · datos de ejemplo</Header>}>
   <ColumnLayout columns={2}>
    <SmallKpi title="Decisiones que pasarían a denegado" value="3" context="Evaluadas en sombra"/>
    <SmallKpi title="Tools pendientes de revisión" value="2" context="Revisar antes de activar"/>
   </ColumnLayout>
   <Box color="text-body-secondary">Pendientes: eliminar_registro (destructiva), procesar_lote (sin clasificar).</Box>
   {showExplanations&&<Box margin={{top:"s"}} color="text-body-secondary">La confirmación debe registrar responsable, actor, versión de la configuración y reglas. Los datos de impacto aquí son sintéticos.</Box>}
  </Container>
  <Modal visible={!!dialog} header={{activate:"Confirmar paso a activo",suspend:"Suspender solo este agente",resume:"Reactivar agente",retire:"Retirar agente"}[dialog]||"Confirmar"}
   onDismiss={()=>setDialog(null)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s"><Button onClick={()=>setDialog(null)}>Cancelar</Button><Button variant="primary" onClick={apply}>Confirmar (demo)</Button></SpaceBetween></Box>}>
   <Alert type={dialog==="retire"?"error":"warning"}>
    {dialog==="activate"
     ?"Se aplicarían 3 denegaciones observadas en sombra; siguen pendientes eliminar_registro y procesar_lote. Solo cambia "+selected.name+"."
     :dialog==="suspend"
      ?"Las inferencias A y ejecuciones MCP B de "+selected.name+" deben responder 403 en ≤60 s. Ningún otro agente se suspende."
      :dialog==="retire"
       ?"Todas las claves de "+selected.name+" dejarán de funcionar con 401; su evidencia no se borrará. Los demás agentes conservan sus claves."
       :"Se recupera el modo anterior de "+selected.name+", sin cambiar a otros agentes."}
   </Alert>
  </Modal>
 </SpaceBetween>;
}
function Limits({byUser=false}){
 const {simulation,setSimulation,notify,showExplanations}=usePrototype();
 const selected=selectedFrom(simulation);
 const [user,setUser]=useState(users[0]);
 const workload=byUser&&user.value==="workload";
 const config=byUser&&!workload?(selected.userLimits?.[user.value]||{}):(selected.limits||{});
 const [budget,setBudget]=useState(String(config.budget??50));
 const [rate,setRate]=useState(String(config.rate??50));
 const [tokens,setTokens]=useState(String(config.tokens??100000));
 const [period,setPeriod]=useState({value:config.period||"day",label:config.period==="month"?"Mensual":"Diario"});
 const actions=selectOptions([["alert","Solo alerta"],["throttle","Limitar (429)"],["block","Bloqueo (403)"]]);
 const [policy,setPolicy]=useState(actions.find(x=>x.value===(config.action||"block"))||actions[2]);
 useEffect(()=>{
  const c=byUser&&!workload?(selected.userLimits?.[user.value]||{}):(selected.limits||{});
  setBudget(String(c.budget??50));setRate(String(c.rate??50));setTokens(String(c.tokens??100000));
  setPeriod({value:c.period||"day",label:c.period==="month"?"Mensual":"Diario"});
  setPolicy(actions.find(x=>x.value===(c.action||"block"))||actions[2]);
 },[selected.id,user.value,byUser,workload]);
 const parsed=x=>Number(String(x).replace(",","."));
 const valid=[budget,rate,tokens].every(x=>Number.isFinite(parsed(x))&&parsed(x)>0);
 const save=()=>{
  if(!valid)return;
  const saved={budget:parsed(budget),rate:parsed(rate),tokens:parsed(tokens),period:period.value,action:policy.value};
  setSimulation(prev=>({...prev,agentRegistry:prev.agentRegistry.map(x=>x.id===selected.id?
    byUser&&!workload?{...x,userLimits:{...x.userLimits,[user.value]:saved}}:{...x,limits:saved}
    :x)}));
  notify("Límites de "+(byUser&&!workload?user.name+" en ":"")+selected.name+" modificados únicamente en la DEMO.");
 };
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2">Consumo del agente · {selected.name}</Header>}>
   <SpaceBetween size="m">
    <AgentSelector/>
    <ColumnLayout columns={3}>
     <SmallKpi title="Gasto de muestra" value={"US$ "+simulation.spent.toFixed(2)} context="No proviene de AWS"/>
     <SmallKpi title="Tokens" value="74.200" context={"de "+tokens+" configurados"}/>
     <SmallKpi title="Solicitudes/minuto" value="28" context={"de "+rate+" permitidas"}/>
    </ColumnLayout>
   </SpaceBetween>
  </Container>
  {byUser&&<FormField label="Principal para analizar">
    <Select options={users.map(x=>({label:x.label,value:x.value}))} selectedOption={{label:user.label,value:user.value}} onChange={({detail})=>setUser(users.find(x=>x.value===detail.selectedOption.value))}/>
   </FormField>}
  <Panel title={byUser?"Límites de "+(workload?"solo_workload (hereda agente)":user.name):"Límites por agente"} info="FIN-03: límites por usuario verificado configurables dentro de cada agente, sin consumir la cuota de otro usuario.">
   <SpaceBetween size="m">
    {byUser&&<SmallKpi title={"Principal: "+user.name} value={"US$ "+user.spent.toFixed(2)} context={user.requests+" solicitudes sintéticas · "+user.role}/>}
    {byUser&&<Alert type={workload?"info":"success"}>{workload?"Sin JWT válido: solo_workload consume los límites del agente.":"Los límites de "+user.name+" son independientes de los de las demás personas en "+selected.name+"."}</Alert>}
    <ProgressBar value={Math.min(100,Math.round((byUser&&!workload?user.spent:simulation.spent)/parsed(budget)*100)||0)} additionalInfo={"Alertas 50 / 80 / 100 % · ejemplo"} description={"Presupuesto de "+(byUser&&!workload?user.name:selected.name)}/>
    <ColumnLayout columns={3}>
     <FormField label="Presupuesto (USD)" errorText={!Number.isFinite(parsed(budget))||parsed(budget)<=0?"Introduce un monto mayor que cero.":undefined}>
      <Input value={budget} onChange={({detail})=>setBudget(detail.value)} type="number"/>
     </FormField>
     <FormField label="Período">
      <Select selectedOption={period} options={[{value:"day",label:"Diario"},{value:"month",label:"Mensual"}]} onChange={({detail})=>setPeriod(detail.selectedOption)}/>
     </FormField>
     <FormField label="Solicitudes por minuto">
      <Input value={rate} onChange={({detail})=>setRate(detail.value)} type="number"/>
     </FormField>
     <FormField label="Tokens por período" errorText={!Number.isFinite(parsed(tokens))||parsed(tokens)<=0?"Introduce un límite mayor que cero.":undefined}>
      <Input value={tokens} onChange={({detail})=>setTokens(detail.value)} type="number"/>
     </FormField>
     <FormField label="Al superar el límite">
      <Select selectedOption={policy} options={actions} onChange={({detail})=>setPolicy(detail.selectedOption)}/>
     </FormField>
    </ColumnLayout>
    <Button variant="primary" disabled={!valid} onClick={save}>Guardar límites (simulación)</Button>
    {showExplanations&&<Alert type="info">En el producto, cada cambio se aplica sin redesplegar; throttle produce 429 con Retry-After, bloqueo 403 y solo_alerta no detiene solicitudes. Los contadores y alertas se miden por agente y, con C, por usuario.</Alert>}
   </SpaceBetween>
  </Panel>
 </SpaceBetween>;
}
function Identity(){
 const {showExplanations}=usePrototype();
 const [user,setUser]=useState(users[0]);
 const verification=[
  {value:"valid",label:"JWT válido"},
  {value:"missing",label:"Sin token · solo_workload"},
  {value:"reject",label:"Token inválido · rechazar"},
  {value:"degrade",label:"Token inválido · degradar"}
 ];
 const [token,setToken]=useState(verification[0]);
 const denied=token.value==="reject";
 const effective=token.value==="valid"?user:users[2];
 const authorized=!denied&&token.value==="valid"&&effective.pii;
 const status=denied?"401 · gov_user_unauthorized":token.value==="degrade"?"Token degradado · solo_workload":token.value==="missing"?"Sin usuario · solo_workload":"Usuario verificado";
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2">Identidad por solicitud</Header>}>
   <SpaceBetween size="m">
    <ColumnLayout columns={2}>
     <FormField label="Token del usuario · conexión C" description={showExplanations?"JWT de usuario, distinto del agent_token usado por A/B.":undefined}>
      <Select selectedOption={token} options={verification} onChange={({detail})=>setToken(detail.selectedOption)}/>
     </FormField>
     <FormField label="Persona (datos ficticios)">
      <Select selectedOption={{label:user.label,value:user.value}} options={users.map(x=>({label:x.label,value:x.value}))} onChange={({detail})=>setUser(users.find(x=>x.value===detail.selectedOption.value))}/>
     </FormField>
    </ColumnLayout>
    <StatusIndicator type={denied?"error":token.value==="valid"?"success":"warning"}>{status}</StatusIndicator>
    {token.value==="degrade"&&<Alert type="warning">El token inválido se trata como solo_workload y genera una alerta; no adquiere el rol elegido.</Alert>}
    {denied&&<Alert type="error">Acceso rechazado: no se llama al modelo ni se atribuye esta solicitud al usuario seleccionado.</Alert>}
   </SpaceBetween>
  </Container>
  <ColumnLayout columns={2}>
   <Panel title="Principal efectivo">
    <KeyValuePairs columns={1} items={[
     {label:"Usuario",value:denied?"Sin acceso":effective.name},
     {label:"Rol",value:denied?"Sin acceso":effective.role},
     {label:"Permiso PII",value:denied?"No evaluado":authorized?"pii_access":"No concedido"}
    ]}/>
   </Panel>
   <Panel title="Respuesta del modelo">
    <SpaceBetween size="s">
     <StatusIndicator type={denied?"error":authorized?"success":"info"}>{denied?"Solicitud detenida":authorized?"Datos visibles por permiso":"Datos personales enmascarados"}</StatusIndicator>
     {!denied&&<Box fontFamily="monospace">RUT: {authorized?"12.345.678-5":"**.***.***-*"}<br/>Correo: {authorized?"persona@ejemplo.cl":"***@***"}</Box>}
    </SpaceBetween>
   </Panel>
  </ColumnLayout>
  <Explanation>La conexión C se mide por solicitudes con JWT válido. Sin él, A/B conserva identidad del agente, no de la persona. La plataforma no autentica el salto usuario → agente.</Explanation>
 </SpaceBetween>;
}
export {BasicAgents,Live,Coverage,Inventory,Shadow,ActiveAgent,Limits,Identity};
