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
 {id:"TRC-0101",time:"10:43:08",agent:"agente-demo",model:"Bedrock modelo A",state:"Permitido",reason:"Inferencia aceptada",cost:"US$ 0,003",channel:"A"},
 {id:"TRC-0102",time:"10:42:57",agent:"agente-demo",model:"Simulado",state:"Permitido",reason:"Modelo de prueba respondió",cost:"US$ 0,000",channel:"A"},
 {id:"TRC-0103",time:"10:42:11",agent:"agente-demo",model:"—",state:"Denegado",reason:"Credencial inválida",cost:"—",channel:"A"}
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
 return <AgentEnrollment/>;
}

function Live(){
 const {helpOn,navigate,slice}=usePrototype();
 const [paused,setPaused]=useState(false);
 const [filter,setFilter]=useState("");
 const [status,setStatus]=useState({value:"all",label:"Todos"});
 const [selection,setSelection]=useState(null);
 const filtered=demoCalls.filter(x=>(status.value==="all"||x.state===status.value)&&
  (x.agent+" "+x.id+" "+x.reason).toLowerCase().includes(filter.toLowerCase()));
 return <SpaceBetween size="l">
  <ColumnLayout columns={3} variant="text-grid">
   <SmallKpi title="Solicitudes" value="3" context="Ejemplo del último minuto"/>
   <SmallKpi title="Canal" value="A" context="Inferencia observada"/>
   <SmallKpi title="Evidencia" value="3 de 3" context="Índice durable"/>
  </ColumnLayout>
  <Table items={filtered} trackBy="id"
   header={<Header variant="h2" counter={"("+filtered.length+")"} actions={<Button onClick={()=>setPaused(v=>!v)} iconName={paused?"play":"pause"}>{paused?"Reanudar":"Pausar"}</Button>}>Flujo en vivo</Header>}
   filter={<div className="filter-layout">
    <TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Buscar agente, motivo o trace ID"/>
    <FormField label="Estado"><Select selectedOption={status} options={selectOptions([["all","Todos"],["Permitido","Permitido"],["Denegado","Denegado"]])} onChange={({detail})=>setStatus(detail.selectedOption)}/></FormField>
   </div>}
   columnDefinitions={[
    {id:"time",header:"Hora",cell:x=>x.time},
    {id:"agent",header:"Agente",cell:x=>x.agent},
    {id:"model",header:"Modelo",cell:x=>x.model},
    {id:"state",header:"Decisión",cell:x=><Decision state={x.state} reason={x.reason}/>},
    {id:"cost",header:"Costo",cell:x=>x.cost},
    {id:"action",header:"Evidencia",cell:x=><Button variant="link" onClick={()=>setSelection(x)}>Ver registro</Button>}
   ]}
   empty={<Box textAlign="center" padding="l">No hay eventos con estos filtros.</Box>}/>
  {paused?<Alert type="warning">Vista pausada. El agente sigue funcionando.</Alert>:<Explanation>La evidencia se indexa antes de responder y se replica a S3 Object Lock GOVERNANCE.</Explanation>}
  <Modal visible={!!selection} onDismiss={()=>setSelection(null)} header={"Registro "+(selection?.id||"")} footer={<Box float="right"><Button variant="primary" onClick={()=>setSelection(null)}>Cerrar</Button></Box>}>
   <SpaceBetween size="s">
    <Decision state={selection?.state||"Permitido"} reason={selection?.reason}/>
    <KeyValuePairs columns={2} items={[{label:"Agente",value:selection?.agent||""},{label:"Costo",value:selection?.cost||""},{label:"Evidencia",value:"Índice durable"},{label:"Conexiones",value:"A · B/C sin observar"}]}/>
    {slice==="S6"&&<Button onClick={()=>navigate("s6-forensic")}>Abrir ruta forense</Button>}
   </SpaceBetween>
  </Modal>
 </SpaceBetween>;
}
function Coverage(){
 const {simulation,showExplanations}=usePrototype();
 const agent=selectedFrom(simulation);
 const discovery=agent.mode==="Descubrimiento";
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2" description={showExplanations?"CON-04: cobertura del catálogo, no puntuación general de seguridad.":undefined}>Tarjeta de gobernanza · {agent.name}</Header>}>
   <SpaceBetween size="m">
    <ColumnLayout columns={3}>
     <div><Box color="text-body-secondary">A · Inferencia</Box><StatusIndicator type="success">Conectada · DEMO</StatusIndicator></div>
     <div><Box color="text-body-secondary">B · Tools MCP</Box><StatusIndicator type="stopped">No conectada</StatusIndicator></div>
     <div><Box color="text-body-secondary">C · Usuario</Box><StatusIndicator type="stopped">No conectada</StatusIndicator></div>
    </ColumnLayout>
    <ColumnLayout columns={3}>
     <SmallKpi title="Cobertura medida" value="Sin datos" context="Sin tráfico verificado"/>
     <SmallKpi title="Máximo con A activo" value="41 %" context="Catálogo de controles · referencia"/>
     <SmallKpi title="Modo actual" value={agent.mode} context="Días en modo: sin histórico"/>
    </ColumnLayout>
    <Box color="text-body-secondary" fontSize="body-s">En descubrimiento, las políticas en sombra no suman al índice. Se requiere evidencia efectiva de cada control y una ventana de medición antes de informar cobertura real.</Box>
   </SpaceBetween>
  </Container>
  <Container header={<Header variant="h2">Consumo y latencia · datos sintéticos</Header>}>
   <ColumnLayout columns={4}>
    <SmallKpi title="Tokens" value="74.200" context="Entrada + salida · ejemplo"/>
    <SmallKpi title="Costo" value="US$ 41,20" context="Tarifa de muestra v1"/>
    <SmallKpi title="Gobierno p50" value="23 ms" context="Ejemplo · no medido"/>
    <SmallKpi title="Gobierno p95" value="47 ms" context="Ejemplo · no medido"/>
   </ColumnLayout>
  </Container>
  <Panel title="Controles del catálogo" info="Solo suma una comprobación con evidencia válida; los fallos se muestran como «sin evidencia».">
   <Table variant="embedded" items={[
    {id:"auth",c:"Autenticación de "+agent.name,state:"Disponible",reason:"Diseño: agent_token individual por agente"},
    {id:"trace",c:"Evidencia de solicitud",state:"Sin evidencia",reason:"La DEMO no recibe tráfico real"},
    {id:"shadow",c:"Políticas de tools",state:discovery?"En sombra":"Disponible",reason:discovery?"3 posibles denegaciones · ejemplo":"Verificar decisiones ejecutadas"},
    {id:"mcp",c:"Ejecución fuera de MCP",state:"No disponible",reason:"La ejecución local no atraviesa la puerta"}
   ]} trackBy="id" columnDefinitions={[
    {id:"control",header:"Control",cell:x=>x.c},
    {id:"state",header:"Estado",cell:x=>x.state==="En sombra"?<ShadowLabel/>:<StatusIndicator type={x.state==="Disponible"?"success":x.state==="Sin evidencia"?"error":"stopped"}>{x.state}</StatusIndicator>},
    {id:"reason",header:"Detalle",cell:x=>x.reason}
   ]}/>
  </Panel>
  <Alert type="info" header="Próximo paso">Conectar tools mediante MCP (B) y, cuando corresponda, propagar identidad de usuario (C). La cobertura se medirá después sobre tráfico real.</Alert>
  {showExplanations&&<Alert>Máximos teóricos del catálogo actual con cobertura completa y en activo: A 41 %, A+C 56 %, A+B 67 %, A+B+C 89 %. No son métricas del agente ni representan garantías de seguridad.</Alert>}
 </SpaceBetween>;
}
function Inventory(){
 const {notify,showExplanations}=usePrototype();
 const [filter,setFilter]=useState("");
 const [selected,setSelected]=useState(null);
 const [draft,setDraft]=useState({kind:"Lectura",approval:"Pendiente de revisión"});
 const [reviews,setReviews]=useState({});
 const classes=selectOptions([["Lectura","Lectura"],["Escritura","Escritura"],["Destructiva","Destructiva o crítica"],["Sin clasificar","Sin clasificar"]]);
 const approvals=selectOptions([["Pendiente de revisión","Pendiente de revisión"],["Aprobada","Aprobada"],["No aprobada","No aprobada"]]);
 const info=x=>reviews[x.id]||{kind:x.kind,approval:"Pendiente de revisión",confirmed:false};
 const items=dummyTools.filter(x=>x.id.toLowerCase().includes(filter.toLowerCase()));
 const open=x=>{
  const current=info(x);
  setDraft(current);setSelected(x);
 };
 const save=()=>{
  if(!selected)return;
  setReviews(prev=>({...prev,[selected.id]:{...draft,confirmed:true}}));
  notify("Clasificación de "+selected.id+" revisada solo en la DEMO.");
  setSelected(null);
 };
 return <SpaceBetween size="l">
  <ColumnLayout columns={3}>
   <SmallKpi title="Declaradas por inferencia A" value="4" context="Datos de demostración"/>
   <SmallKpi title="Sin clasificar" value={dummyTools.filter(x=>info(x).kind==="Sin clasificar").length.toString()} context="Requieren revisión"/>
   <SmallKpi title="Ejecutadas por MCP" value="0" context="La conexión B llega en S4"/>
  </ColumnLayout>
  <Container header={<Header variant="h2" description={showExplanations?"Clases inferidas de anotaciones y patrones; un operador confirma o corrige.":undefined}>Catálogo de tools declaradas</Header>}>
   <Table items={items} trackBy="id" variant="embedded"
    filter={<TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Buscar tool"/>}
    columnDefinitions={[
     {id:"tool",header:"Tool",cell:x=><Button variant="link" onClick={()=>open(x)}>{x.id}</Button>},
     {id:"kind",header:"Clase",cell:x=>info(x).kind},
     {id:"schema",header:"Esquema",cell:x=><SpaceBetween direction="horizontal" size="xs"><Box>{x.schema}</Box>{x.schema==="v2"&&<Badge color="blue">Cambio demo</Badge>}</SpaceBetween>},
     {id:"state",header:"Clasificación",cell:x=><StatusIndicator type={info(x).confirmed?"success":"warning"}>{info(x).confirmed?"Confirmada":"Sugerida"}</StatusIndicator>},
     {id:"approval",header:"Aprobación",cell:x=><StatusIndicator type={info(x).approval==="Aprobada"?"success":"warning"}>{info(x).approval}</StatusIndicator>},
     {id:"coverage",header:"Ejecución",cell:()=><StatusIndicator type="stopped">Fuera de MCP</StatusIndicator>}
    ]}/>
  </Container>
  <Modal visible={!!selected} header={"Revisar tool · "+(selected?.id||"")} onDismiss={()=>setSelected(null)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s"><Button onClick={()=>setSelected(null)}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar revisión (demo)</Button></SpaceBetween></Box>}>
   <SpaceBetween size="m">
    <KeyValuePairs columns={2} items={[
     {label:"Tool declarada",value:selected?.id||""},
     {label:"Esquema",value:selected?.schema||""},
     {label:"Clasificación inicial",value:selected?.kind||""},
     {label:"Control de ejecución",value:"Fuera de MCP en S1"}
    ]}/>
    <FormField label="Clase confirmada">
     <Select selectedOption={classes.find(x=>x.value===draft.kind)||classes[0]} options={classes}
      onChange={({detail})=>setDraft(prev=>({...prev,kind:detail.selectedOption.value}))}/>
    </FormField>
    <FormField label="Estado de aprobación">
     <Select selectedOption={approvals.find(x=>x.value===draft.approval)||approvals[0]} options={approvals}
      onChange={({detail})=>setDraft(prev=>({...prev,approval:detail.selectedOption.value}))}/>
    </FormField>
    <Alert type="info">Una tool nueva detectada en activo comienza pendiente de revisión. Confirmar la clase no significa que su ejecución local esté gobernada. Una nueva versión del esquema debe revisarse otra vez.</Alert>
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
 const [presetPreview,setPresetPreview]=useState(false);
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
  setModelEdit(null);setPresetEdit(null);setPresetPreview(false);
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
     <Button onClick={()=>setSimulation(x=>({...x,presentation:!x.presentation}))}>{simulation.presentation?"Salir de presentación":"Modo presentación"}</Button>
    </SpaceBetween>
    {mode==="Suspendido"&&<Alert type="warning">Este agente está suspendido. En producción, sus inferencias y ejecuciones MCP deben recibir 403 en un máximo de 60 segundos. Los demás agentes siguen operando.</Alert>}
    {mode==="Retirado"&&<Alert type="error">Agente retirado. Sus credenciales deben devolver 401 y su evidencia se conserva.</Alert>}
    {mode!=="Retirado"&&<ColumnLayout columns={2}>
     <FormField label="Modelo permitido" description={showExplanations?"Cambio individual de catálogo; se aplica en ≤10 s en el producto real.":undefined}>
      <Select selectedOption={options} options={models} onChange={({detail})=>setModelEdit(detail.selectedOption)}/>
     </FormField>
     <FormField label="Preset de políticas">
      <Select selectedOption={policyOption} options={presets} onChange={({detail})=>{setPresetEdit(detail.selectedOption);setPresetPreview(false)}}/>
     </FormField>
    </ColumnLayout>}
    {mode!=="Retirado"&&<SpaceBetween size="s">
     {policyOption.value==="2"&&<Alert type="warning">Preset 2 exige identidad C para escrituras y conexión B para aprobar herramientas críticas. Lo que falte se deniega con motivo explícito.</Alert>}
     {policyOption.value==="3"&&<Alert type="warning">Preset 3 deniega por defecto hasta contar con reglas nominales por rol y tool.</Alert>}
     {presetEdit&&presetEdit.value!==preset&&<SpaceBetween size="s">
      <Button onClick={()=>setPresetPreview(true)}>Simular impacto del Preset</Button>
      {presetPreview&&<Alert type="warning" header="Comparación ilustrativa, no reevaluación real">
       <KeyValuePairs columns={2} items={[
        {label:"Preset actual",value:"Preset "+preset+" · 3 posibles denegaciones"},
        {label:"Preset propuesto",value:"Preset "+presetEdit.value+" · "+(presetEdit.value==="3"?"5":"2")+" posibles denegaciones"},
        {label:"Tool que cambiaría",value:"actualizar_precio · ejemplo de transacción"},
        {label:"Evidencia",value:"Falta reevaluar el tráfico real"}
       ]}/>
      </Alert>}
     </SpaceBetween>}
     <Button disabled={(!modelEdit&&!presetEdit)||!!(presetEdit&&presetEdit.value!==preset&&!presetPreview)} onClick={saveSettings}>Guardar configuración (demo)</Button>
    </SpaceBetween>}
   </SpaceBetween>
  </Container>
  <AgentCredentialControls/>
  <Container header={<Header variant="h2">Impacto de activar · datos de ejemplo</Header>}>
   <ColumnLayout columns={2}>
    <SmallKpi title="Decisiones que pasarían a denegado" value="3" context="Evaluadas en sombra"/>
    <SmallKpi title="Tools pendientes de revisión" value="2" context="Revisar antes de activar"/>
   </ColumnLayout>
   {showExplanations&&<Box margin={{top:"s"}} color="text-body-secondary">La confirmación debe registrar responsable, actor, versión de la configuración y reglas. Los datos de impacto aquí son sintéticos.</Box>}
  </Container>
  <Modal visible={!!dialog} header={{activate:"Confirmar paso a activo",suspend:"Suspender solo este agente",resume:"Reactivar agente",retire:"Retirar agente"}[dialog]||"Confirmar"}
   onDismiss={()=>setDialog(null)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s"><Button onClick={()=>setDialog(null)}>Cancelar</Button><Button variant="primary" onClick={apply}>Confirmar (demo)</Button></SpaceBetween></Box>}>
   <Alert type={dialog==="retire"?"error":"warning"}>
    {dialog==="activate"
     ?"Se aplicarían 3 denegaciones observadas en sombra; hay 2 tools pendientes. Solo cambia "+selected.name+"."
     :dialog==="suspend"
      ?"Las inferencias A y ejecuciones MCP B de "+selected.name+" deben responder 403 en ≤60 s. Ningún otro agente se suspende."
      :dialog==="retire"
       ?"Todas las claves de "+selected.name+" dejarán de funcionar con 401; su evidencia no se borrará. Los demás agentes conservan sus claves."
       :"Se recupera el modo anterior de "+selected.name+", sin cambiar a otros agentes."}
   </Alert>
  </Modal>
 </SpaceBetween>;
}
function UserLimits(){
 const {simulation,setSimulation,notify,showExplanations}=usePrototype();
 const agent=selectedFrom(simulation);
 const [user,setUser]=useState(users[0]);
 const [rate,setRate]=useState("5");
 const [tokens,setTokens]=useState("20000");
 const [budget,setBudget]=useState("20");
 const [period,setPeriod]=useState({value:"day",label:"Diario"});
 const actions=selectOptions([["alert","Solo alerta"],["throttle","Throttle (429)"],["block","Bloqueo (403)"]]);
 const [action,setAction]=useState(actions[1]);
 const [traffic,setTraffic]=useState({ana:4,elena:2,workload:4});
 const [result,setResult]=useState("");
 const workload=user.value==="workload";
 const saved=agent.userLimits?.[user.value];
 useEffect(()=>{
  const item=agent.userLimits?.[user.value]||{};
  setRate(String(item.rate??5));setTokens(String(item.tokens??20000));setBudget(String(item.budget??20));
  setPeriod({value:item.period||"day",label:item.period==="month"?"Mensual":"Diario"});
  setAction(actions.find(x=>x.value===(item.action||"throttle"))||actions[1]);
  setResult("");
 },[agent.id,user.value]);
 const valid=[rate,tokens,budget].every(x=>Number.isFinite(parseVal(x))&&parseVal(x)>0);
 const save=()=>{
  if(workload||!valid)return;
  const next={rate:parseVal(rate),tokens:parseVal(tokens),budget:parseVal(budget),period:period.value,action:action.value};
  setSimulation(prev=>({...prev,agentRegistry:prev.agentRegistry.map(a=>a.id===agent.id?
   {...a,userLimits:{...(a.userLimits||{}),[user.value]:next}}:a)}));
  notify("Límites de "+user.name+" en "+agent.name+" guardados solo en DEMO.");
 };
 const simulate=()=>{
  if(workload)return;
  const exceed=Math.max(parseVal(rate)+1,(traffic[user.value]||0)+1);
  setTraffic(prev=>({...prev,[user.value]:exceed}));
  setResult(user.name+": "+(action.value==="throttle"?"429 · Retry-After":action.value==="block"?"403 · cuota excedida":"Solo alerta")+". "+users.filter(x=>x.value!=="workload"&&x.value!==user.value).map(x=>x.name+" conserva su tráfico ("+(traffic[x.value]||0)+" solicitudes)").join("; "));
 };
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2" description={showExplanations?"FIN-03: las cuotas por usuario autenticado son independientes entre sí y del agente.":undefined}>Consumo por persona · {agent.name}</Header>}>
   <SpaceBetween size="m">
    <AgentSelector/>
    <FormField label="Principal">
     <Select selectedOption={{value:user.value,label:user.label}} options={users.map(x=>({value:x.value,label:x.label}))}
      onChange={({detail})=>setUser(users.find(x=>x.value===detail.selectedOption.value))}/>
    </FormField>
    <ColumnLayout columns={3}>
     <SmallKpi title="Costo estimado" value={"US$ "+user.spent.toFixed(2)} context="Usuario seleccionado · demo"/>
     <SmallKpi title="Solicitudes observadas" value={String(traffic[user.value]||0)} context="Ventana de demostración"/>
     <SmallKpi title="Estado de cuota" value={workload?"Del agente":saved?"Configurada":"Predeterminada"} context="Aislamiento por principal"/>
    </ColumnLayout>
   </SpaceBetween>
  </Container>
  {workload?<Alert type="info" header="Solo workload, sin identidad de usuario">Este tráfico se imputa a la cuota del agente. No tiene una cuota independiente de usuario; las cuotas de personas requieren C y JWT válido.</Alert>:
   <Container header={<Header variant="h2">Límite individual · {user.name}</Header>}>
    <SpaceBetween size="m">
     <ColumnLayout columns={3}>
      <FormField label="Solicitudes por minuto">
       <Input type="number" value={rate} onChange={({detail})=>setRate(detail.value)}/>
      </FormField>
      <FormField label="Tokens por período">
       <Input type="number" value={tokens} onChange={({detail})=>setTokens(detail.value)}/>
      </FormField>
      <FormField label="Presupuesto (USD)">
       <Input type="number" value={budget} onChange={({detail})=>setBudget(detail.value)}/>
      </FormField>
      <FormField label="Período"><Select selectedOption={period} options={[{value:"day",label:"Diario"},{value:"month",label:"Mensual"}]} onChange={({detail})=>setPeriod(detail.selectedOption)}/></FormField>
      <FormField label="Acción al superar"><Select selectedOption={action} options={actions} onChange={({detail})=>setAction(detail.selectedOption)}/></FormField>
     </ColumnLayout>
     <SpaceBetween direction="horizontal" size="s">
      <Button variant="primary" disabled={!valid} onClick={save}>Guardar límite (demo)</Button>
      <Button disabled={!valid} onClick={simulate}>Probar aislamiento (demo)</Button>
     </SpaceBetween>
     {result&&<Alert type={action.value==="alert"?"info":"warning"} header="Resultado simulado">{result}</Alert>}
     {showExplanations&&<Box color="text-body-secondary" fontSize="body-s">El límite de este usuario se aplica únicamente dentro de {agent.name}. Rebasarlo no debe detener a otros usuarios ni agentes; el backend real debe aplicar 429 con Retry-After, 403 o solo alerta según la configuración.</Box>}
    </SpaceBetween>
   </Container>}
 </SpaceBetween>;
}
function Limits({byUser=false}){return byUser?<UserLimits/>:<AgentLimits/>;}
function AgentLimits(){
 const byUser=false;
 const {simulation,setSimulation,notify,showExplanations}=usePrototype();
 const selected=selectedFrom(simulation);
 const config=selected.limits||{};
 const [budget,setBudget]=useState(String(config.budget??50));
 const [rate,setRate]=useState(String(config.rate??50));
 const [tokens,setTokens]=useState(String(config.tokens??100000));
 const [period,setPeriod]=useState({value:config.period||"day",label:config.period==="month"?"Mensual":"Diario"});
 const actions=selectOptions([["alert","Solo alerta"],["throttle","Limitar (429)"],["block","Bloqueo (403)"]]);
 const [policy,setPolicy]=useState(actions.find(x=>x.value===(config.action||"block"))||actions[2]);
 const [user,setUser]=useState(users[0]);
 useEffect(()=>{
  const c=selected.limits||{};
  setBudget(String(c.budget??50));setRate(String(c.rate??50));setTokens(String(c.tokens??100000));
  setPeriod({value:c.period||"day",label:c.period==="month"?"Mensual":"Diario"});
  setPolicy(actions.find(x=>x.value===(c.action||"block"))||actions[2]);
 },[selected.id]);
 const parsed=x=>Number(String(x).replace(",","."));
 const valid=[budget,rate,tokens].every(x=>Number.isFinite(parsed(x))&&parsed(x)>0);
 const save=()=>{
  if(!valid)return;
  const saved={budget:parsed(budget),rate:parsed(rate),tokens:parsed(tokens),period:period.value,action:policy.value};
  setSimulation(prev=>({...prev,agentRegistry:prev.agentRegistry.map(x=>x.id===selected.id?{...x,limits:saved}:x)}));
  notify("Límites de "+selected.name+" modificados únicamente en la DEMO.");
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
  <Panel title={byUser?"Límites por agente y gasto por principal":"Límites por agente"} info="Los límites son individuales para cada agente, no una cuota global que suspende a todos.">
   <SpaceBetween size="m">
    {byUser&&<SmallKpi title={"Principal: "+user.name} value={"US$ "+user.spent.toFixed(2)} context={user.requests+" solicitudes sintéticas · "+user.role}/>}
    <ProgressBar value={Math.min(100,Math.round(simulation.spent/parsed(budget)*100)||0)} additionalInfo={"Alertas 50 / 80 / 100 % · ejemplo"} description={"Presupuesto de "+selected.name}/>
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
  <Box color="text-body-secondary" fontSize="body-s">La conexión C se mide como la proporción de solicitudes con JWT válido. Si falta, el agente conserva su autenticación A/B, pero las reglas no reciben identidad humana. La plataforma no autentica el salto usuario → agente.</Box>
 </SpaceBetween>;
}
export {BasicAgents,Live,Coverage,Inventory,Shadow,ActiveAgent,Limits,Identity};
