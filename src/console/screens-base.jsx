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
import {mcpFor,approvalsFor,supervisionFor} from "./agent-tool-state.js";

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
   <SmallKpi title={paused?"En espera":"Denegadas"} value={paused?String(queued.length):String(events.filter(x=>x.state==="Denegado").length)} context={paused?"Se incorporan al reanudar":"Solicitudes de ejemplo"}/>
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
 const {simulation,slice,showExplanations,navigate}=usePrototype();
 const [evidence,setEvidence]=useState({value:"observado",label:"Con actividad"});
 const agent=selectedFrom(simulation);
 const rank=Number(slice.slice(1));
 const hasB=rank>=4,hasC=rank>=3;
 const bCount=hasB?mcpFor(simulation,agent.id).length:0;
 const max=hasB?(hasC?89:67):(hasC?56:41);
 const noData=evidence.value!=="observado";
 const outcomes=[
  {id:"infer",title:"Solicitudes",effect:rank>=2?"Se registran decisiones, consumo y bloqueos según el modo del agente.":"Se observan las solicitudes, el modelo utilizado y su consumo.",target:"s0-live",action:"Ver flujo"},
  {id:"tools",title:"Herramientas",effect:hasB?bCount+" de 4 pasan por MCP; "+(4-bCount)+" siguen ejecutándose fuera de la puerta.":"Se descubren las herramientas solicitadas; su ejecución aún queda fuera de la puerta.",target:hasB?"s4-mcp":"s1-inventory",action:"Ver herramientas"},
  ...(rank>=2?[{id:"limits",title:"Límites",effect:"Las solicitudes pueden detenerse o generar avisos al superar el presupuesto configurado.",target:rank>=3?"s3-user-spend":"s2-limits",action:"Ver consumo"}]:[]),
  ...(hasC?[{id:"person",title:"Acceso por persona",effect:"Un usuario identificado puede tener límites y acceso a datos distintos de otro.",target:"s3-identity",action:"Ver acceso"}]:[]),
  ...(rank>=5?[{id:"approval",title:"Operaciones críticas",effect:"Una operación retenida espera la decisión de un aprobador antes de ejecutarse.",target:"s5-approvals",action:"Ver pendientes"}]:[]),
  ...(rank>=6?[{id:"audit",title:"Investigación",effect:"Cada solicitud permite reconstruir la decisión y consultar la regla aplicada.",target:"s6-forensic",action:"Ver ruta"}]:[])
 ];
 const modeText=agent.mode==="Descubrimiento"?"3 de 12 solicitudes de muestra se habrían detenido":agent.mode==="Activo"?"Las reglas pueden detener solicitudes":"El acceso está limitado por el modo actual";
 const go=target=>navigate(target);
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2">Gobernanza de {agent.name}</Header>}>
   <SpaceBetween size="m">
    <div className="gov-agent-picker"><AgentSelector/></div>
    <ColumnLayout columns={3}>
     <div><Box color="text-body-secondary">Inferencia · A</Box><StatusIndicator type={noData?"warning":"success"}>{noData?"Sin actividad verificada":"Conectada en demo"}</StatusIndicator></div>
     <div><Box color="text-body-secondary">Herramientas · B</Box><StatusIndicator type={hasB&&bCount>0?"success":"stopped"}>{hasB?bCount+" de 4 tools por MCP":"Sin conexión MCP"}</StatusIndicator></div>
     <div><Box color="text-body-secondary">Personas · C</Box><StatusIndicator type={hasC?"success":"stopped"}>{hasC?"2 de 3 JWT válidos (demo)":"Sin identidad de usuario"}</StatusIndicator></div>
    </ColumnLayout>
    <ColumnLayout columns={3} variant="text-grid">
     <SmallKpi title="Modo" value={agent.mode} context={modeText}/>
     <SmallKpi title="Cobertura medida" value="Sin datos" context="Sin telemetría real"/>
     <SmallKpi title="Herramientas protegidas" value={hasB?bCount+" de 4":"0 de 4"} context={hasB?"Solo las que pasan por MCP":"Ejecución fuera de la puerta"}/>
    </ColumnLayout>
    {evidence.value==="sin_trafico"&&<Alert type="warning">Sin tráfico: no hay un índice de cobertura medido para esta ventana.</Alert>}
    {evidence.value==="fallo"&&<Alert type="error">Sin evidencia: un control que no pudo evaluarse no cuenta como cumplido.</Alert>}
    {showExplanations&&<SpaceBetween size="s">
     <FormField label="Simular estado de la evidencia">
      <Select selectedOption={evidence} onChange={({detail})=>setEvidence(detail.selectedOption)}
       options={[{value:"observado",label:"Con actividad"},{value:"sin_trafico",label:"Sin tráfico"},{value:"fallo",label:"Evaluación sin evidencia"}]}/>
     </FormField>
     <Explanation>Máximo teórico con estas conexiones: {max} %. Es una referencia de catálogo, no una puntuación observada. Calcular cobertura real requiere tráfico, controles aplicables y evidencia válida.</Explanation>
    </SpaceBetween>}
   </SpaceBetween>
  </Container>
  <Panel title="Qué ocurre en la plataforma" info="Casos que ilustran la diferencia entre observar una solicitud, detenerla y gobernar la ejecución de una tool.">
   <div className="desktop-table">
    <Table variant="embedded" trackBy="id" items={outcomes} columnDefinitions={[
     {id:"case",header:"Situación",cell:x=><strong>{x.title}</strong>},
     {id:"effect",header:"Resultado",cell:x=>x.effect},
     {id:"action",header:"Explorar",cell:x=><Button variant="link" onClick={()=>go(x.target)}>{x.action}</Button>}
    ]}/>
   </div>
   <div className="mobile-cards"><SpaceBetween size="s">{outcomes.map(x=>
    <Container key={x.id} header={<Header variant="h3">{x.title}</Header>}>
     <SpaceBetween size="xs"><Box>{x.effect}</Box><Button variant="link" onClick={()=>go(x.target)}>{x.action}</Button></SpaceBetween>
    </Container>
   )}</SpaceBetween></div>
  </Panel>
  {simulation.agentRegistry.length>1&&<ExpandableSection headerText="Otros agentes" variant="footer">
    <Table items={simulation.agentRegistry} trackBy="id" variant="embedded" columnDefinitions={[
     {id:"agent",header:"Agente",cell:x=>x.name},
     {id:"mode",header:"Modo",cell:x=>x.mode},
     {id:"connections",header:"Conexiones",cell:()=>hasB?"A+B"+(hasC?"+C":""):hasC?"A+C":"A"},
     {id:"coverage",header:"Índice",cell:()=>"Sin datos"}
    ]}/>
   </ExpandableSection>}
 </SpaceBetween>;
}

function Inventory(){
 const {notify,simulation,setSimulation,slice,navigate}=usePrototype();
 const currentAgent=selectedFrom(simulation);
 const rank=Number(slice.slice(1));
 const mcp=rank>=4?mcpFor(simulation,currentAgent.id):[];
 const approved=rank>=4?approvalsFor(simulation,currentAgent.id):[];
 const supervision=rank>=5?supervisionFor(simulation,currentAgent.id):{};
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
  <Panel title="Descubrimiento de herramientas" info="INF-02: cada declaración de tools se cataloga por agente y versión de esquema; la clase automática es sugerida, no una aprobación." actions={rank>=4?<Button onClick={()=>navigate("s4-mcp")}>Administrar ejecución MCP</Button>:undefined}>
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
    {id:"coverage",header:"Ejecución",cell:tool=><StatusIndicator type={mcp.includes(tool.id)?"success":"stopped"}>{mcp.includes(tool.id)?"Por MCP":"Fuera de MCP"}</StatusIndicator>},
    ...(rank>=4?[{id:"approval",header:"Aprobación",cell:tool=><StatusIndicator type={approved.includes(tool.id)?"success":"warning"}>{approved.includes(tool.id)?"Aprobada":"Pendiente"}</StatusIndicator>}]:[])
   ]}/>
  </div>
  <div className="mobile-cards">
   <SpaceBetween size="s">
    <TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Buscar tool"/>
    {items.map(tool=><Container key={tool.id} header={<Header variant="h3" actions={<Button onClick={()=>open(tool)}>Revisar</Button>}>{tool.id}</Header>}>
     <SpaceBetween size="s">
      <KeyValuePairs columns={2} items={[{label:"Clase",value:tool.kind},{label:"Esquema",value:tool.schema}]}/>
      <StatusIndicator type={tool.status==="Revisada"?"success":"warning"}>{tool.status==="Revisada"?"Clasificación revisada":"Clase sugerida"}</StatusIndicator>
      <StatusIndicator type={mcp.includes(tool.id)?"success":"stopped"}>{mcp.includes(tool.id)?"Ejecución por MCP":"Ejecución fuera de MCP"}</StatusIndicator>
      {rank>=4&&<StatusIndicator type={approved.includes(tool.id)?"success":"warning"}>{approved.includes(tool.id)?"Aprobada":"Pendiente de aprobación"}</StatusIndicator>}
      {rank>=5&&<Box fontSize="body-s">Supervisión: {supervision[tool.id]||"Autónoma"}</Box>}
     </SpaceBetween>
    </Container>)}
   </SpaceBetween>
  </div>
  {rank>=4&&<Button variant="link" onClick={()=>navigate("s4-mcp")}>Ver destinos y ejecución por MCP</Button>}
  <Explanation>El catálogo sigue disponible al conectar B. A descubre la intención del modelo; B gobierna la ejecución únicamente de las tools centralizadas. Clasificar una herramienta no la aprueba.</Explanation>
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
    <Alert type="info">Clasificar una herramienta no autoriza su ejecución.</Alert>
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
 const {simulation,setSimulation,notify,showExplanations,navigate}=usePrototype();
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
    <Button variant="link" onClick={()=>navigate("s0-connect")}>Volver al listado de agentes</Button>
    <ColumnLayout columns={4}>
     <SmallKpi title="Estado" value={mode} context="Solo este agente"/>
     <SmallKpi title="API keys vigentes" value={selected.tokens.filter(x=>x.status==="Activa").length.toString()} context="Solo este agente"/>
     <SmallKpi title="Preset" value={preset} context="Configuración individual"/>
     <SmallKpi title="Responsable" value={selected.owner||"Sin asignar"} context=""/>
    </ColumnLayout>
    <SpaceBetween direction="horizontal" size="s">
     {mode==="Descubrimiento"&&<Button variant="primary" onClick={()=>setDialog("activate")}>Pasar a activo</Button>}
     {mode!=="Suspendido"&&mode!=="Retirado"&&<Button onClick={()=>setDialog("suspend")}>Suspender agente</Button>}
     {mode==="Suspendido"&&<Button onClick={()=>setDialog("resume")}>Reactivar agente</Button>}
     {mode!=="Retirado"&&<Button onClick={()=>setDialog("retire")}>Retirar agente</Button>}
    </SpaceBetween>
    {mode==="Suspendido"&&<Alert type="warning">Agente suspendido: sus solicitudes A y MCP se rechazarían; los demás agentes siguen operando.</Alert>}
    {mode==="Retirado"&&<Alert type="error">Agente retirado: sus credenciales dejan de dar acceso; su evidencia se conserva.</Alert>}
    {mode!=="Retirado"&&<ColumnLayout columns={2}>
     <FormField label="Modelo permitido" description={showExplanations?"Cambio individual de catálogo; se aplica en ≤10 s en el producto real.":undefined}>
      <Select selectedOption={options} options={models} onChange={({detail})=>setModelEdit(detail.selectedOption)}/>
     </FormField>
     <FormField label="Preset de políticas">
      <Select selectedOption={policyOption} options={presets} onChange={({detail})=>setPresetEdit(detail.selectedOption)}/>
     </FormField>
    </ColumnLayout>}
    {mode!=="Retirado"&&<SpaceBetween size="s">
     {policyOption.value==="2"&&<Alert type="warning">Las escrituras requieren usuario identificado. Las herramientas críticas necesitan conexión MCP para su aprobación.</Alert>}
     {policyOption.value==="3"&&<Alert type="warning">Sin reglas específicas de acceso, las solicitudes se deniegan.</Alert>}
     {presetEdit&&presetEdit.value!==preset&&<Container header={<Header variant="h3">Vista previa del cambio · datos sintéticos</Header>}>
      <SpaceBetween size="s">
       <KeyValuePairs columns={3} items={[
        {label:"Preset actual",value:presets.find(x=>x.value===preset)?.label||preset},
        {label:"Candidato",value:presetEdit.label},
        {label:"Solicitudes cuya decisión cambiaría",value:presetEdit.value==="3"?"3 de 12":presetEdit.value==="2"?"2 de 12":"1 de 12"}
       ]}/>

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
      ?"Las solicitudes A y MCP de "+selected.name+" se rechazarían. Ningún otro agente se suspende."
      :dialog==="retire"
       ?"Se desactivan las claves de "+selected.name+" y se conserva su evidencia. Los demás agentes no cambian."
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
 const actions=selectOptions([["alert","Solo alerta"],["throttle","Reducir frecuencia"],["block","Bloquear"]]);
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
     <SmallKpi title="Gasto" value={"US$ "+simulation.spent.toFixed(2)} context="Datos de ejemplo"/>
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
    <ProgressBar value={Math.min(100,Math.round((byUser&&!workload?user.spent:simulation.spent)/parsed(budget)*100)||0)} description={"Presupuesto de "+(byUser&&!workload?user.name:selected.name)}/>
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
    {showExplanations&&<Alert type="info">Los umbrales de alerta son 50, 80 y 100 % del presupuesto. En el producto, los cambios se aplican sin redesplegar: limitar responde 429 con Retry-After; bloquear responde 403; una alerta no detiene solicitudes. Los contadores se separan por agente y, con C, por usuario.</Alert>}
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
     <FormField label="Persona">
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
