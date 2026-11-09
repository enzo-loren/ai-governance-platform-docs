import React,{useState,useMemo} from "react";
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
 const {simulation,setSimulation,notify,helpOn,showExplanations}=usePrototype();
 const [agent,setAgent]=useState(simulation.agent);
 const [model,setModel]=useState({value:"bedrock-a",label:"Modelo del catálogo A"});
 const [created,setCreated]=useState(false);
 const models=selectOptions([["bedrock-a","Modelo del catálogo A"],["bedrock-b","Modelo del catálogo B"],["simulado","Modelo simulado (si se habilita)"]]);
 return <SpaceBetween size="l">
  <Panel title="Nuevo agente" info="S0: registro, dueño y credencial. El agente nace en el modo inicial de la configuración.">
   <ColumnLayout columns={2} variant="text-grid">
    <SpaceBetween size="m">
     <FormField label="Nombre del agente" description={showExplanations?"Identificador visible en la consola":undefined}>
      <Input value={agent} onChange={({detail})=>setAgent(detail.value)} />
     </FormField>
     <FormField label="Modelo inicial" description={showExplanations?"Configurable desde el catálogo":undefined}>
      <Select selectedOption={model} options={models} onChange={({detail})=>setModel(detail.selectedOption)}/>
     </FormField>
     <FormField label="Responsable"><Input readOnly value="Operador plataforma" /></FormField>
     <SpaceBetween direction="horizontal" size="s">
      <Button variant="primary" disabled={!agent.trim()} onClick={()=>{setSimulation(x=>({...x,agent:agent.trim()}));setCreated(true);notify("Agente creado en el prototipo. "+SIM);}}>Dar de alta</Button>
      <Why title="Token del agente">El token real se muestra una sola vez, se almacena únicamente su hash y puede rotarse. Este prototipo usa una cadena ficticia sin validez.</Why>
     </SpaceBetween>
    </SpaceBetween>
    <SpaceBetween size="m">
     <Banner>Conexión A · Inferencia mediante OpenAI Chat Completions.</Banner>
     <FormField label="BASE_URL"><Input readOnly value="{gateway}/inference/v1"/></FormField>
     {created ? <>
      <FormField label="agent_token (ficticio)"><Input readOnly value="gov_demo_sin_validez"/></FormField>
      <CopyToClipboard textToCopy={'BASE_URL={gateway}/inference/v1\nAPI_KEY=gov_demo_sin_validez'} copyButtonText="Copiar ejemplo" copySuccessText="Ejemplo copiado" copyErrorText="No se pudo copiar"/>
      <Alert type="success">Credencial de ejemplo creada. No se generó ni guardó un token real.</Alert>
     </> : <Explanation>Al registrar el agente aparecerá una credencial de ejemplo. El token de producción se muestra una sola vez.</Explanation>}
    </SpaceBetween>
   </ColumnLayout>
  </Panel>
 </SpaceBetween>;
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
 const {navigate,slice}=usePrototype();
 const stage=Number(slice.slice(1));
 return <SpaceBetween size="l">
  <ColumnLayout columns={3} variant="text-grid">
   <Panel title="A · Inferencia"><StatusIndicator type="success">Conectada</StatusIndicator><Box fontSize="body-s">Solicitudes, respuestas e intenciones observadas.</Box></Panel>
   <Panel title="B · Tools MCP"><StatusIndicator type="stopped">No conectada</StatusIndicator><Box fontSize="body-s">Sin control sobre ejecuciones locales.</Box></Panel>
   <Panel title="C · Identidad"><StatusIndicator type="stopped">No conectada</StatusIndicator><Box fontSize="body-s">Principal: solo_workload.</Box></Panel>
  </ColumnLayout>
  <Panel title="Estado de los controles" info="La cobertura no es una puntuación absoluta de seguridad: depende del catálogo, la conexión real, el modo y las evidencias.">
   <Table variant="embedded" items={[
    {c:"Autenticación del agente",state:"Activo",reason:"agent_token verificado"},
    {c:"Evidencia y flujo",state:"Activo",reason:"Índice durable"},
    {c:"Políticas de tools",state:"En sombra",reason:"Se evalúan sin bloquear por política"},
    {c:"Ejecución fuera de MCP",state:"No disponible",reason:"El agente ejecuta localmente"}
   ]} columnDefinitions={[
    {id:"c",header:"Control",cell:x=>x.c},{id:"state",header:"Estado",cell:x=>x.state==="En sombra"?<ShadowLabel/>:<StatusIndicator type={x.state==="Activo"?"success":"stopped"}>{x.state}</StatusIndicator>},
    {id:"reason",header:"Por qué",cell:x=>x.reason}
   ]}/>
  </Panel>
  <Explanation type="warning">Fuera del perímetro: red/IAM del agente, autenticación usuario→agente y aviso final de IA.</Explanation>
 </SpaceBetween>;
}
function Inventory(){
 const {helpOn}=usePrototype();
 const [filter,setFilter]=useState("");
 const [selected,setSelected]=useState(null);
 const items=dummyTools.filter(x=>x.id.includes(filter.toLowerCase()));
 return <SpaceBetween size="l">
  <Panel title="Clasificación automática" info="Las herramientas se descubren desde el campo tools de la inferencia. Su clase es una sugerencia y requiere revisión.">
   <ColumnLayout columns={3}><SmallKpi title="Declaradas" value="4" context="Payload de inferencia"/><SmallKpi title="Sin clasificar" value="1" context="Revisión necesaria"/><SmallKpi title="MCP" value="0" context="B se incorpora en S4"/></ColumnLayout>
  </Panel>
  <Table items={items} trackBy="id" header={<Header variant="h2">Inventario de tools</Header>}
   filter={<TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Filtrar por nombre"/>}
   columnDefinitions={[
    {id:"name",header:"Tool",cell:x=><Button variant="link" onClick={()=>setSelected(x)}>{x.id}</Button>},
    {id:"kind",header:"Clase sugerida",cell:x=>x.kind},
    {id:"schema",header:"Esquema",cell:x=>x.schema},
    {id:"state",header:"Revisión",cell:x=>x.status==="Aprobada"?<StatusIndicator type="success">Sugerida</StatusIndicator>:<StatusIndicator type="warning">Pendiente</StatusIndicator>},
    {id:"coverage",header:"Ejecución",cell:()=><StatusIndicator type="stopped">Fuera de la puerta</StatusIndicator>}
   ]}/>
  <Explanation>En S1 se observa la intención del modelo. El control de ejecución real por MCP llega en S4.</Explanation>
  <Modal visible={!!selected} header={selected?.id||"Tool"} onDismiss={()=>setSelected(null)} footer={<Box float="right"><Button onClick={()=>setSelected(null)}>Cerrar</Button></Box>}>
   <KeyValuePairs columns={2} items={[{label:"Clase sugerida",value:selected?.kind||""},{label:"Versión del esquema",value:selected?.schema||""},{label:"Estado",value:selected?.status||""},{label:"Canal",value:"A · inferencia"}]}/>
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
 const mode=simulation.mode;
 const apply=()=>{
  const next=dialog==="activate"?"Activo":"Suspendido";
  setSimulation(s=>({...s,mode:next}));notify("Modo "+next.toLowerCase()+" aplicado únicamente al prototipo. "+SIM);
  setDialog(null);
 };
 return <SpaceBetween size="l">
  <Panel title={simulation.agent} actions={<SpaceBetween direction="horizontal" size="s">
   <Button onClick={()=>setSimulation(x=>({...x,presentation:!x.presentation}))}>{simulation.presentation?"Salir de presentación":"Modo presentación"}</Button>
   {mode==="Descubrimiento"?<Button variant="primary" onClick={()=>setDialog("activate")}>Pasar a activo</Button>:null}
   {mode==="Activo"?<Button onClick={()=>setDialog("suspend")}>Suspender agente</Button>:null}
   {mode==="Suspendido"?<Button onClick={()=>{setSimulation(x=>({...x,mode:"Activo"}));notify("Agente reactivado en simulación.")}}>Reactivar</Button>:null}
  </SpaceBetween>}>
   <ColumnLayout columns={3}><SmallKpi title="Modo" value={mode} context="Estado simulado"/><SmallKpi title="Modelo permitido" value="1" context="Catálogo configurado"/><SmallKpi title="Preset" value="1" context="Caja Negra Segura"/></ColumnLayout>
  </Panel>
  <ColumnLayout columns={showExplanations?2:1}>
   <Panel title="Impacto antes de activar" info="REG-01: el operador recibe las denegaciones que habrían ocurrido y la lista de tools sin clasificar antes de confirmar el cambio.">
    <SpaceBetween size="m"><SmallKpi title="Denegaciones en sombra" value="3" context="Ventana de prueba"/><StatusIndicator type="warning">2 tools pendientes de revisión</StatusIndicator></SpaceBetween>
   </Panel>
   {showExplanations&&<Panel title="Qué cambia en modo activo"><SpaceBetween size="m">
    <Decision state="Denegado" reason="Tool destructiva no permitida · Preset 1"/>
    <Decision state="Denegado" reason="Modelo no habilitado por el agente"/>
    <StatusIndicator type="error">Falla cerrada si falla el motor de políticas</StatusIndicator>
   </SpaceBetween></Panel>}
  </ColumnLayout>
  <Modal visible={!!dialog} header={dialog==="activate"?"Confirmar paso a activo":"Suspender agente"} onDismiss={()=>setDialog(null)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s"><Button onClick={()=>setDialog(null)}>Cancelar</Button><Button variant="primary" onClick={apply}>Confirmar simulación</Button></SpaceBetween></Box>}>
    {dialog==="activate"?<Alert type="warning">3 solicitudes se habrían denegado y 2 tools están pendientes. El cambio real exigiría responsable y quedaría auditado.</Alert>:
    <Alert type="warning">El Kill Switch real rechaza las solicitudes del agente en ≤60 segundos. En este prototipo solo cambiará la etiqueta.</Alert>}
  </Modal>
 </SpaceBetween>;
}
function Limits({byUser=false}){
 const {simulation,setSimulation,notify}=usePrototype();
 const [budget,setBudget]=useState(String(simulation.budget));
 const [rate,setRate]=useState(String(simulation.rate));
 const [policy,setPolicy]=useState({label:"Bloqueo (403)",value:"block"});
 const [user,setUser]=useState(users[0]);
 const isValid=Number.isFinite(parseVal(budget))&&parseVal(budget)>0&&Number.isFinite(parseVal(rate))&&parseVal(rate)>0;
 return <SpaceBetween size="l">
  <ColumnLayout columns={3}><SmallKpi title={byUser?"Consumo del agente":"Costo del período"} value={"US$ "+simulation.spent.toFixed(2)} context="Cifras ilustrativas"/><SmallKpi title="Tokens" value="74.200" context="de 100.000"/><SmallKpi title="Solicitudes/min" value="28" context={"de "+simulation.rate}/></ColumnLayout>
  {byUser&&<FormField label="Principal para analizar">
   <Select options={users.map(x=>({label:x.label,value:x.value}))} selectedOption={{label:user.label,value:user.value}} onChange={({detail})=>setUser(users.find(x=>x.value===detail.selectedOption.value))}/>
  </FormField>}
  <Panel title={byUser?"Límites y gasto por principal":"Presupuesto por agente"}>
   <SpaceBetween size="m">
    {byUser&&<SmallKpi title={"Principal: "+user.name} value={"US$ "+user.spent.toFixed(2)} context={user.requests+" solicitudes sintéticas · "+user.role}/>}
    <ProgressBar value={byUser?Math.round(user.spent/20*100):Math.min(100,Math.round(simulation.spent/simulation.budget*100))} additionalInfo={byUser?"Referente ilustrativo: US$ 20":"50/80/100 % · presupuesto de prueba"} description={byUser?"Costo del principal":"Presupuesto del agente"} />
    <ColumnLayout columns={3}>
     <FormField label="Presupuesto (USD)" errorText={!Number.isFinite(parseVal(budget))||parseVal(budget)<=0?"Introduce un monto mayor que cero.":undefined}><Input value={budget} onChange={({detail})=>setBudget(detail.value)} type="number"/></FormField>
     <FormField label="Solicitudes/minuto"><Input value={rate} onChange={({detail})=>setRate(detail.value)} type="number"/></FormField>
     <FormField label="Al superar el límite"><Select selectedOption={policy} options={selectOptions([["alert","Solo alerta"],["throttle","Limitar (429)"],["block","Bloqueo (403)"]])} onChange={({detail})=>setPolicy(detail.selectedOption)} /></FormField>
    </ColumnLayout>
    <Button variant="primary" disabled={!isValid} onClick={()=>{setSimulation(x=>({...x,budget:parseVal(budget),rate:parseVal(rate)}));notify("Límites actualizados en el prototipo. "+SIM)}}>Guardar límites (simulación)</Button>
   </SpaceBetween>
  </Panel>
  <Explanation>El sistema objetivo permite cambiar límites sin despliegue, con alertas y respuestas 429/403. Esta vista solo simula los valores.</Explanation>
 </SpaceBetween>;
}
function Identity(){
 const {showExplanations}=usePrototype();
 const [user,setUser]=useState(users[0]);
 return <SpaceBetween size="l">
  <FormField label="Principal de la solicitud" description={showExplanations?"Conexión C valida el JWT: firma, emisor, vigencia y audiencia.":undefined}>
   <Select selectedOption={{label:user.label,value:user.value}} options={users.map(x=>({label:x.label,value:x.value}))} onChange={({detail})=>setUser(users.find(x=>x.value===detail.selectedOption.value))}/>
  </FormField>
  <ColumnLayout columns={2}>
   <Panel title="Identidad verificada"><KeyValuePairs columns={1} items={[{label:"Usuario",value:user.name},{label:"Rol",value:user.role},{label:"Permiso de datos personales",value:user.pii?"pii_access":"No concedido"}]}/></Panel>
   <Panel title="Respuesta del modelo">
    <SpaceBetween size="s"><StatusIndicator type={user.pii?"success":"info"}>{user.pii?"Datos visibles con permiso":"Datos personales enmascarados"}</StatusIndicator>
    <Box fontFamily="monospace">RUT: {user.pii?"12.345.678-5":"**.***.***-*"}<br/>Correo: {user.pii?"persona@ejemplo.cl":"***@***"}</Box>
    </SpaceBetween>
   </Panel>
  </ColumnLayout>
  <Explanation>Sin X-Gov-User-Token, se utiliza solo_workload. La puerta no autentica el tramo usuario → aplicación → agente.</Explanation>
 </SpaceBetween>;
}

export {BasicAgents,Live,Coverage,Inventory,Shadow,ActiveAgent,Limits,Identity};
