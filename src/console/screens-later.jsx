import React,{useState} from "react";
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
import Modal from "@cloudscape-design/components/modal";
import CopyToClipboard from "@cloudscape-design/components/copy-to-clipboard";
import Toggle from "@cloudscape-design/components/toggle";
import Tabs from "@cloudscape-design/components/tabs";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Textarea from "@cloudscape-design/components/textarea";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import {usePrototype,Explanation} from "./main.jsx";

const tools=[
 {id:"consultar_ficha",kind:"Lectura",target:"Lambda MCP",approved:true,when:"Permitido"},
 {id:"actualizar_precio",kind:"Escritura",target:"OpenAPI MCP",approved:true,when:"Permitido"},
 {id:"eliminar_registro",kind:"Destructiva",target:"Lambda MCP",approved:false,when:"Denegado"},
 {id:"procesar_lote",kind:"Sin clasificar",target:"Lambda MCP",approved:false,when:"Denegado"}
];
const requests=[
 {id:"APR42",name:"cambiar_fondo",from:"Diego · operador",time:"12 min",amount:"USD 12.000"},
 {id:"APR43",name:"procesar_lote",from:"solo_workload",time:"4 min",amount:"—"},
 {id:"APR41",name:"transferir_fondos",from:"Bruno · operador",time:"Vencida",amount:"USD 890"}
];
const audit=[
 {id:"TRC-0137",who:"ana.consulta",agent:"agente-demo",tool:"actualizar_precio",decision:"Denegado",reason:"descuento 25 > 10",model:"Bedrock modelo A",channel:"inferencia",connections:"A+B+C",date:"2026-11-09",policy:"descuento_máximo · v3",config:"cfg-agente v2",author:"operador plataforma"},
 {id:"TRC-0122",who:"solo_workload",agent:"agente-demo",tool:"eliminar_registro",decision:"Denegado",reason:"tool destructiva",model:"Simulado",channel:"inferencia",connections:"A",date:"2026-11-09",policy:"Preset 1 · v1",config:"cfg-agente v1",author:"sistema inicial"},
 {id:"TRC-0104",who:"diego.operador",agent:"agente-demo",tool:"cambiar_fondo",decision:"Pendiente",reason:"aprobación humana",model:"Bedrock modelo A",channel:"mcp",connections:"A+B+C",date:"2026-11-09",policy:"Preset 2 · v2",config:"cfg-agente v2",author:"operador plataforma"}
];
function Panel({title,children,actions,help}){
 const {helpOn,showExplanations}=usePrototype();
 return <Container header={<Header variant="h2" info={showExplanations&&help?<Button variant="link" onClick={()=>helpOn(title,help)}>¿Qué significa?</Button>:undefined} actions={actions}>{title}</Header>}>{children}</Container>;
}
function State({value}){
 const types={Permitido:"success",Denegado:"error",Pendiente:"pending",Vencida:"warning","En sombra":"info","Fuera de la puerta":"stopped"};
 return <StatusIndicator type={types[value]||"info"}>{value}</StatusIndicator>;
}
function MCP(){
 const {simulation,setSimulation,notify,helpOn,showExplanations,slice}=usePrototype();
 const rank=Number(slice.slice(1));
 const agent=simulation.agentRegistry.find(x=>x.id===simulation.selectedAgentId)||simulation.agentRegistry[0];
 const [filter,setFilter]=useState("");
 const [row,setRow]=useState(null);
 const approved=simulation.approvedTools||[];
 const supervision=simulation.supervision||{};
 const [targetName,setTargetName]=useState("");
 const [targetType,setTargetType]=useState({value:"lambda",label:"AWS Lambda"});
 const [targetModal,setTargetModal]=useState(false);
 const [targets,setTargets]=useState([
  {id:"lambda-demo",type:"AWS Lambda",secret:"IAM / AgentCore Identity",status:"Registrado (demo)"},
  {id:"openapi-demo",type:"OpenAPI HTTPS",secret:"API key / Secrets Manager",status:"Registrado (demo)"}
 ]);
 const mcp=simulation.toolsMcp;
 const filtered=tools.map(x=>({...x,...(simulation.toolOverrides?.[agent.id+":"+x.id]||{}),schema:simulation.toolSchemaVersions?.[agent.id+":"+x.id]||"v1"})).filter(x=>x.id.toLowerCase().includes(filter.toLowerCase()));
 const toggle=(id,checked)=>{
  setSimulation(prev=>({...prev,toolsMcp:checked?[...new Set([...prev.toolsMcp,id])]:prev.toolsMcp.filter(name=>name!==id)}));
  notify("Cobertura MCP de la demostración actualizada.");
 };
 const decision=x=>!mcp.includes(x.id)?"Fuera de la puerta":approved.includes(x.id)?"Permitido":agent.mode==="Descubrimiento"?"En sombra":"Denegado";
 const changeSupervision=(id,value)=>setSimulation(prev=>({...prev,supervision:{...prev.supervision,[id]:value}}));
 const register=()=>{
  if(!targetName.trim())return;
  if(targets.some(x=>x.id.toLowerCase()===targetName.trim().toLowerCase())){notify("Ya existe un target con ese nombre.","error");return}
  setTargets(old=>[...old,{id:targetName.trim(),type:targetType.label,secret:targetType.value==="lambda"?"IAM / AgentCore Identity":"Secrets Manager",status:"Registrado (demo)"}]);
  setTargetName("");setTargetModal(false);
  notify("Target registrado en la demostración. No se creó ningún recurso AWS.");
 };
 return <SpaceBetween size="l">
  <ColumnLayout columns={3}>
   <Panel title="Tools declaradas"><div className="kpi-value">4</div><Box color="text-body-secondary">En inferencia A</Box></Panel>
   <Panel title="Tools por MCP"><div className="kpi-value">{mcp.length} de 4</div><Box color="text-body-secondary">Cobertura B parcial</Box></Panel>
   <Panel title="Fuera de la puerta"><div className="kpi-value">{4-mcp.length}</div><Box color="text-body-secondary">Ejecución no gobernada</Box></Panel>
  </ColumnLayout>
  <Container header={<Header variant="h2" actions={<Button onClick={()=>setTargetModal(true)}>Registrar target (demo)</Button>}>Targets MCP y credenciales de destino</Header>}>
   <SpaceBetween size="m">
    <Table variant="embedded" items={targets} trackBy="id" columnDefinitions={[
     {id:"target",header:"Target",cell:x=>x.id},
     {id:"type",header:"Tipo",cell:x=>x.type},
     {id:"secret",header:"Autenticación hacia el target",cell:x=>x.secret},
     {id:"status",header:"Estado",cell:x=><StatusIndicator type="success">{x.status}</StatusIndicator>}
    ]}/>
    <Explanation>La clave del agente autentica A y B. Las claves propias de cada target se guardan en AgentCore Identity o Secrets Manager y no se entregan al agente.</Explanation>
   </SpaceBetween>
  </Container>
  <div className="desktop-table">
   <Table items={filtered} trackBy="id"
    header={<Header variant="h2" info={showExplanations?<Button variant="link" onClick={()=>helpOn("Cobertura B","La ejecución solo se controla si la tool pasa por un target MCP registrado. El catálogo de inferencia por sí solo no controla una ejecución local.")}>¿Qué cubre B?</Button>:undefined}>Herramientas y destinos</Header>}
    filter={<TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Filtrar tools"/>}
    columnDefinitions={[
     {id:"name",header:"Tool",cell:x=><Button variant="link" onClick={()=>setRow(x)}>{x.id}</Button>},
     {id:"class",header:"Clase",cell:x=>x.kind},
     {id:"schema",header:"Esquema",cell:x=>x.schema},
     {id:"target",header:"Destino",cell:x=>mcp.includes(x.id)?x.target:"Local"},
     {id:"approved",header:"Aprobación",cell:x=><StatusIndicator type={approved.includes(x.id)?"success":"warning"}>{approved.includes(x.id)?"Aprobada":"Pendiente / no aprobada"}</StatusIndicator>},
     {id:"supervision",header:"Supervisión",cell:x=>rank>=5?({autonoma:"Autónoma",notificar:"Notificar",requiere_aprobacion:"Requiere aprobación"}[supervision[x.id]]||"Autónoma"):"Disponible desde S5"},
     {id:"usage",header:"Último uso",cell:x=>x.id==="procesar_lote"?"No observado":"Hace 12 min (demo)"},
     {id:"state",header:"Decisión",cell:x=><State value={decision(x)}/>},
     {id:"toggle",header:"Usar MCP (demo)",cell:x=><Toggle checked={mcp.includes(x.id)} onChange={({detail})=>toggle(x.id,detail.checked)}>MCP</Toggle>}
    ]}/>
  </div>
  <div className="mobile-cards">
   <SpaceBetween size="s">
    <TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Buscar herramienta"/>
    {filtered.map(x=><Container key={x.id} header={<Header variant="h3" actions={<Toggle checked={mcp.includes(x.id)} onChange={({detail})=>toggle(x.id,detail.checked)}>MCP</Toggle>}>{x.id}</Header>}>
     <SpaceBetween size="s">
      <State value={decision(x)}/>
      <StatusIndicator type={approved.includes(x.id)?"success":"warning"}>{approved.includes(x.id)?"Aprobada":"Pendiente"}</StatusIndicator>
      <KeyValuePairs columns={2} items={[{label:"Clase",value:x.kind},{label:"Esquema",value:x.schema},{label:"Destino",value:mcp.includes(x.id)?x.target:"Local"},{label:"Supervisión",value:rank>=5?supervision[x.id]:"Disponible en S5"}]}/>
      <Button variant="link" onClick={()=>setRow(x)}>Ver detalle de tool</Button>
     </SpaceBetween>
    </Container>)}
   </SpaceBetween>
  </div>
  <Modal visible={!!row} header={row?.id||"Tool"} onDismiss={()=>setRow(null)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s">
    <Button onClick={()=>setRow(null)}>Cerrar</Button>
    {row&&<Button variant="primary" onClick={()=>{
     setSimulation(prev=>({...prev,approvedTools:approved.includes(row.id)?prev.approvedTools.filter(id=>id!==row.id):[...prev.approvedTools,row.id]}));
     notify("Aprobación de "+row.id+" modificada únicamente en DEMO.");
     setRow(null);
    }}>{approved.includes(row?.id)?"Quitar aprobación (demo)":"Aprobar tool (demo)"}</Button>}
   </SpaceBetween></Box>}>
   <SpaceBetween size="m">
    <KeyValuePairs columns={2} items={[{label:"Clase",value:row?.kind||""},{label:"Esquema",value:row?.schema||""},{label:"Destino",value:row?.target||""},{label:"Cobertura B",value:row&&mcp.includes(row.id)?"MCP":"Local"},{label:"Aprobación",value:row&&approved.includes(row.id)?"Aprobada":"Pendiente"}]}/>
    {rank>=5&&row&&<FormField label="Nivel de supervisión">
     <Select selectedOption={[{value:"autonoma",label:"Autónoma"},{value:"notificar",label:"Notificar"},{value:"requiere_aprobacion",label:"Requiere aprobación"}].find(x=>x.value===supervision[row.id])||{value:"autonoma",label:"Autónoma"}}
      options={[{value:"autonoma",label:"Autónoma"},{value:"notificar",label:"Notificar"},{value:"requiere_aprobacion",label:"Requiere aprobación"}]}
      onChange={({detail})=>changeSupervision(row.id,detail.selectedOption.value)}/>
    </FormField>}
    <Alert type="info">En activo, una tool pendiente o no aprobada se deniega; en descubrimiento la evaluación de esa regla puede operar en sombra. Esta acción solo modifica una muestra.</Alert>
   </SpaceBetween>
  </Modal>
  <Modal visible={targetModal} header="Registrar target MCP · DEMO" onDismiss={()=>setTargetModal(false)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s"><Button onClick={()=>setTargetModal(false)}>Cancelar</Button><Button variant="primary" disabled={!targetName.trim()} onClick={register}>Registrar (demo)</Button></SpaceBetween></Box>}>
   <SpaceBetween size="m">
    <FormField label="Nombre del target"><Input value={targetName} onChange={({detail})=>setTargetName(detail.value)}/></FormField>
    <FormField label="Tipo"><Select selectedOption={targetType} options={[{value:"lambda",label:"AWS Lambda"},{value:"openapi",label:"OpenAPI HTTPS"}]} onChange={({detail})=>setTargetType(detail.selectedOption)}/></FormField>
    <Alert type="info">La credencial real del destino se configura en AgentCore Identity o Secrets Manager y no se muestra al agente. Aquí no se solicitan ni almacenan secretos.</Alert>
   </SpaceBetween>
  </Modal>
 </SpaceBetween>;
}

function Policy(){
 const {notify,simulation}=usePrototype();
 const agent=simulation.agentRegistry.find(x=>x.id===simulation.selectedAgentId)||simulation.agentRegistry[0];
 const [threshold,setThreshold]=useState("10");
 const [effect,setEffect]=useState({label:"Denegar",value:"DENY"});
 const [principal,setPrincipal]=useState({label:"Cualquier rol",value:"*"});
 const [target,setTarget]=useState({label:"actualizar_precio · escritura",value:"actualizar_precio"});
 const [version,setVersion]=useState(3);
 const [tab,setTab]=useState("builder");
 const [cedar,setCedar]=useState('forbid(principal, action == Gov::Action::"UsarTool::actualizar_precio", resource)\\nwhen { context.parametros.descuento > 10 };');
 const [cedarStatus,setCedarStatus]=useState("Borrador · sin validar");
 const [validation,setValidation]=useState("");
 const [saved,setSaved]=useState([{version:3,author:"Operador plataforma · DEMO",when:"09 nov · 10:43"}]);
 const roles=[{label:"Cualquier rol",value:"*"},{label:"solo_workload",value:"solo_workload"},{label:"Rol consulta",value:"consulta"},{label:"Rol aprobador",value:"aprobador"}];
 const choices=[
  {label:"actualizar_precio · escritura",value:"actualizar_precio"},
  {label:"consultar_ficha · lectura",value:"consultar_ficha"},
  {label:"Clase escritura",value:"clase:escritura"}
 ];
 const parameter=target.value==="consultar_ficha"?"id":"descuento";
 const numeric=parameter==="descuento";
 const valid=threshold!==""&&Number.isFinite(Number(threshold))&&Number(threshold)>=0;
 const result=n=>valid&&effect.value==="DENY"&&n>Number(threshold)?"Denegado":"Permitido";
 const validateCedar=()=>{
  const syntax=/\\b(?:permit|forbid)\\s*\\([\\s\\S]+\\)\\s*when\\s*\\{[\\s\\S]+\\}\\s*;\\s*$/.test(cedar);
  const parameterMatch=cedar.match(/context\\.parametros\\.([a-zA-Z_][\\w]*)/);
  const validField=parameterMatch&&["descuento","id"].includes(parameterMatch[1]);
  const error=!syntax?"Sintaxis de ejemplo inválida: se espera permit/forbid (...) when {...};":
   !validField?"Parámetro inexistente en el esquema detectado.":"";
  setValidation(error||"Validación ilustrativa correcta. No se ha usado el parser Cedar.");
  setCedarStatus(error?"Error de validación (DEMO)":"Validación ilustrativa correcta");
  return !error;
 };
 const build=<SpaceBetween size="m">
  <ColumnLayout columns={2}>
   <FormField label="Agente"><Input readOnly value={agent.name}/></FormField>
   <FormField label="Usuario o rol"><Select selectedOption={principal} options={roles} onChange={({detail})=>setPrincipal(detail.selectedOption)}/></FormField>
   <FormField label="Tool o clase"><Select selectedOption={target} options={choices} onChange={({detail})=>setTarget(detail.selectedOption)}/></FormField>
   <FormField label="Efecto"><Select selectedOption={effect} options={[{label:"Denegar",value:"DENY"},{label:"Permitir",value:"ALLOW"}]} onChange={({detail})=>setEffect(detail.selectedOption)}/></FormField>
   <FormField label={"Parámetro del esquema · "+(numeric?"number":"string")}><Input readOnly value={parameter}/></FormField>
   <FormField label={numeric?"Condición · mayor que":"Condición · identificador"} errorText={!numeric?undefined:!valid?"Introduce un umbral numérico no negativo.":undefined}>
    <Input type={numeric?"number":"text"} value={threshold} onChange={({detail})=>setThreshold(detail.value)}/>
   </FormField>
  </ColumnLayout>
  <Box color={valid?"text-body-secondary":"text-status-error"} fontSize="body-s">{effect.label+" cuando "+principal.label+" solicita "+target.label+" con "+parameter+" > "+threshold}</Box>
  <Button variant="primary" disabled={!valid} onClick={()=>{
   setVersion(v=>v+1);setSaved(v=>[{version:version+1,author:"Operador plataforma · DEMO",when:"En esta sesión"},...v]);
   notify("Versión ilustrativa creada. No se aplicó ninguna política real.");
  }}>Guardar versión simulada</Button>
 </SpaceBetween>;
 const editor=<SpaceBetween size="m">
  <FormField label="Política Cedar · borrador">
   <Textarea rows={7} value={cedar} onChange={({detail})=>{setCedar(detail.value);setCedarStatus("Modificado · sin validar");setValidation("");}}/>
  </FormField>
  <StatusIndicator type={cedarStatus.startsWith("Error")?"error":"warning"}>{cedarStatus}</StatusIndicator>
  {validation&&<Alert type={cedarStatus.startsWith("Error")?"error":"info"}>{validation}</Alert>}
  <SpaceBetween direction="horizontal" size="s">
   <Button onClick={validateCedar}>Validar ejemplo</Button>
   <Button disabled={!cedar.trim()||cedarStatus!=="Validación ilustrativa correcta"} onClick={()=>{
    setVersion(v=>v+1);setSaved(v=>[{version:version+1,author:"Operador plataforma · DEMO",when:"En esta sesión"},...v]);
    setCedarStatus("Borrador guardado en memoria, NO publicado");
    notify("Borrador Cedar registrado solo en la demostración.");
   }}>Guardar borrador (demo)</Button>
  </SpaceBetween>
  <Explanation>La plataforma final debe validar sintaxis y tipos con Cedar y el esquema de la tool, guardar autor y texto, versionar y aplicar la regla en 10 segundos o menos. La validación de este prototipo es ilustrativa, no equivalente a Cedar.</Explanation>
 </SpaceBetween>;
 return <SpaceBetween size="l">
  <Panel title="Políticas del agente" help="La regla opera sobre la intención observada en A y, cuando la tool pasa por MCP B, sobre sus argumentos en la ejecución.">
   <Tabs tabs={[{id:"builder",label:"Constructor visual",content:build},{id:"cedar",label:"Editor Cedar",content:editor}]} activeTabId={tab} onChange={({detail})=>setTab(detail.activeTabId)}/>
  </Panel>
  <Panel title={"Probar regla · v"+version}>
   <ColumnLayout columns={2}>
    <div><Box variant="h3">descuento = 8</Box><State value={result(8)}/></div>
    <div><Box variant="h3">descuento = 25</Box><State value={result(25)}/></div>
   </ColumnLayout>
   <Explanation>Resultados de ejemplo. La matriz obligatoria de al menos 30 escenarios y el parser real de Cedar no se ejecutan aquí.</Explanation>
  </Panel>
  <Panel title="Versiones de ejemplo">
   <Table variant="embedded" items={saved} columnDefinitions={[
    {id:"v",header:"Versión",cell:x=>"v"+x.version},
    {id:"actor",header:"Autor",cell:x=>x.author},
    {id:"time",header:"Fecha",cell:x=>x.when}]}/>
  </Panel>
 </SpaceBetween>;
}

function Guide(){
 const {helpOn,showExplanations,simulation}=usePrototype();
 const [tab,setTab]=useState("a");
 const agent=simulation.agentRegistry.find(x=>x.id===simulation.selectedAgentId)||simulation.agentRegistry[0];
 const placeholder="<AGENT_TOKEN_DE_"+agent.name.toUpperCase().replace(/[^A-Z0-9]+/g,"_")+">";
 const tabs=[
  {id:"a",label:"A · Inferencia",content:<SpaceBetween size="m">
    <KeyValuePairs columns={2} items={[{label:"Agente",value:agent.name},{label:"Autenticación",value:"Bearer agent_token · uno por agente"}]}/>
    <FormField label="BASE_URL"><Input readOnly value="{gateway}/inference/v1"/></FormField>
    <FormField label="API key · agent_token"><Input readOnly value={placeholder}/></FormField>
    <CopyToClipboard textToCopy={"BASE_URL={gateway}/inference/v1\nAPI_KEY="+placeholder} copyButtonText="Copiar configuración A" copySuccessText="Copiado" copyErrorText="Error al copiar"/>
    <Box color="text-body-secondary" fontSize="body-s">La clave se entrega una sola vez al crear o rotar este agente. No se puede consultar después. La key del SDK identifica al agente; no es una key de Bedrock.</Box>
   </SpaceBetween>},
  {id:"b",label:"B · MCP",content:<SpaceBetween size="m">
    <Alert type="warning">Solo se controlan las tools registradas y ejecutadas por MCP; las locales quedan fuera de la puerta.</Alert>
    <KeyValuePairs columns={2} items={[{label:"Agente",value:agent.name},{label:"Autenticación",value:"Mismo agent_token de A"}]}/>
    <CopyToClipboard textToCopy={"MCP_URL={gateway}/mcp\nAGENT_TOKEN="+placeholder} copyButtonText="Copiar configuración B" copySuccessText="Copiado" copyErrorText="Error al copiar"/>
    <Box color="text-body-secondary" fontSize="body-s">Las credenciales hacia targets Lambda/OpenAPI se guardan en AgentCore Identity o Secrets Manager; nunca se entregan al agente.</Box>
   </SpaceBetween>},
  {id:"c",label:"C · Usuario",content:<SpaceBetween size="m">
    <KeyValuePairs columns={2} items={[{label:"Identidad agente",value:agent.name+" · agent_token"},{label:"Identidad usuario",value:"JWT OIDC por solicitud"}]}/>
    <CopyToClipboard textToCopy="X-Gov-User-Token: <JWT OIDC del usuario>" copyButtonText="Copiar cabecera C" copySuccessText="Copiado" copyErrorText="Error al copiar"/>
    <Box color="text-body-secondary" fontSize="body-s">El JWT de C no reemplaza la API key del agente. Sin JWT se usa solo_workload. Un token inválido se rechaza o degrada según configuración.</Box>
   </SpaceBetween>}
 ];
 return <SpaceBetween size="l">
  <Panel title="Conectar por partes" help="A usa una clave propia. B reutiliza esa clave para MCP. C agrega un JWT diferente, del usuario final.">
   <Tabs tabs={tabs} activeTabId={tab} onChange={({detail})=>setTab(detail.activeTabId)}/>
  </Panel>
  <Panel title="Cierre de brechas">
   <Alert type="warning">procesar_lote sigue local y no se gobierna su ejecución. Se debe registrar como target MCP, clasificar y aprobar.</Alert>
   {showExplanations&&<Button onClick={()=>helpOn("Validación técnica","POL-02 exige una matriz versionada de al menos 30 escenarios ALLOW/DENY contra el proveedor simulado. No es otra pantalla de gerencia.")}>Validaciones exigidas</Button>}
  </Panel>
 </SpaceBetween>;
}
function Approvals(){
 const {simulation,setSimulation,notify}=usePrototype();
 const [selected,setSelected]=useState("APR42");
 const [confirm,setConfirm]=useState(null);
 const [supervision,setSupervision]=useState({consultar_ficha:"autonoma",actualizar_precio:"notificar",cambiar_fondo:"requiere_aprobacion"});
 const [supervisionTool,setSupervisionTool]=useState({label:"cambiar_fondo",value:"cambiar_fondo"});
 const actors=[
  {value:"elena",label:"Elena · aprobadora",role:"aprobador",name:"Elena"},
  {value:"diego",label:"Diego · operador (originador)",role:"operador",name:"Diego"},
  {value:"ana",label:"Ana · consulta",role:"consulta",name:"Ana"},
  {value:"agent",label:"agent_token · no es una persona",role:"agente",name:"agente"}
 ];
 const [actor,setActor]=useState(actors[0]);
 const status=id=>simulation.approvals[id]||"Pendiente";
 const chosen=requests.find(x=>x.id===selected)||requests[0];
 const originator=chosen.from;
 const ownRequest=originator.toLowerCase().includes(actor.name.toLowerCase());
 const authorized=actor.role==="aprobador"&&!ownRequest;
 const pending=status(chosen.id)==="Pendiente";
 const decide=()=>{
  if(!confirm||!authorized||!pending){notify("La aprobación fue rechazada por separación de funciones o estado.","error");setConfirm(null);return}
  const result=confirm==="approve"?"Aprobada · ejecución simulada":"Rechazada · no ejecutada";
  setSimulation(prev=>({...prev,approvals:{...prev.approvals,[chosen.id]:result}}));
  notify(chosen.id+": "+result+". Ninguna tool fue ejecutada en AWS.");
  setConfirm(null);
 };
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2">Supervisión por herramienta</Header>}>
   <SpaceBetween size="m">
    <ColumnLayout columns={2}>
     <FormField label="Tool">
      <Select selectedOption={supervisionTool} options={Object.keys(supervision).map(value=>({value,label:value}))} onChange={({detail})=>setSupervisionTool(detail.selectedOption)}/>
     </FormField>
     <FormField label="Nivel de supervisión">
      <Select selectedOption={[
        {value:"autonoma",label:"Autónoma"},
        {value:"notificar",label:"Notificar"},
        {value:"requiere_aprobacion",label:"Requiere aprobación"}
       ].find(option=>option.value===supervision[supervisionTool.value])}
       options={[{value:"autonoma",label:"Autónoma"},{value:"notificar",label:"Notificar"},{value:"requiere_aprobacion",label:"Requiere aprobación"}]}
       onChange={({detail})=>setSupervision(prev=>({...prev,[supervisionTool.value]:detail.selectedOption.value}))}/>
     </FormField>
    </ColumnLayout>
    <StatusIndicator type={supervision[supervisionTool.value]==="requiere_aprobacion"?"warning":"info"}>
     {supervision[supervisionTool.value]==="requiere_aprobacion"?"La ejecución espera autorización":
      supervision[supervisionTool.value]==="notificar"?"La ejecución emite una alerta posterior":"Ejecución autónoma conforme a reglas"}
    </StatusIndicator>
    <Box color="text-body-secondary" fontSize="body-s">Configuración local de demostración. «Notificar» no bloquea; «Requiere aprobación» retiene la tool MCP hasta una decisión humana. Ningún cambio se aplica a AWS.</Box>
   </SpaceBetween>
  </Container>
  <Container header={<Header variant="h2">Sesión de aprobación</Header>}>
   <SpaceBetween size="s">
    <FormField label="Actor de la decisión · datos de demostración">
     <Select selectedOption={actor} options={actors} onChange={({detail})=>setActor(detail.selectedOption)}/>
    </FormField>
    <StatusIndicator type={authorized?"success":"error"}>{authorized?"Rol aprobador habilitado":"Sin permiso para aprobar esta solicitud"}</StatusIndicator>
    {!authorized&&<Alert type="error">La misma persona que originó la operación, un usuario sin rol aprobador y una credencial de agente no pueden autorizarla. Esta comprobación también debe existir en la API.</Alert>}
   </SpaceBetween>
  </Container>
  <ColumnLayout columns={2}>
   <div className="approval-list-column">
    <div className="desktop-table"><Table items={requests} trackBy="id" header={<Header variant="h2">Solicitudes</Header>}
    columnDefinitions={[
     {id:"name",header:"Operación",cell:x=><Button variant="link" onClick={()=>setSelected(x.id)}>{x.id} · {x.name}</Button>},
     {id:"state",header:"Estado",cell:x=><StatusIndicator type={status(x.id)==="Pendiente"?"pending":status(x.id)==="Vencida"?"warning":"success"}>{status(x.id)}</StatusIndicator>},
     {id:"time",header:"Plazo (demo)",cell:x=>x.time}
    ]}/></div>
   <div className="mobile-cards">
    <Container header={<Header variant="h2">Solicitudes</Header>}>
     <SpaceBetween size="s">
      {requests.map(item=><div key={item.id} className="mobile-request">
       <SpaceBetween size="xxs">
        <Button variant="link" onClick={()=>setSelected(item.id)}>{item.id} · {item.name}</Button>
        <StatusIndicator type={status(item.id)==="Pendiente"?"pending":status(item.id)==="Vencida"?"warning":"success"}>{status(item.id)}</StatusIndicator>
        <Box fontSize="body-s" color="text-body-secondary">{item.time} · ejemplo de plazo</Box>
       </SpaceBetween>
      </div>)}
     </SpaceBetween>
    </Container>
   </div>
   </div>
   <Panel title={"Solicitud "+chosen.id} help="HITL-02/03: aprobación separada de funciones, no ejecución sin aprobación, caducidad y consulta por gov_aprobacion_estado.">
    <SpaceBetween size="m">
     <KeyValuePairs columns={2} items={[{label:"Tool",value:chosen.name},{label:"Originador",value:originator},{label:"Monto",value:chosen.amount},{label:"Estado",value:status(chosen.id)},{label:"Plazo restante",value:chosen.time},{label:"Actor conectado",value:actor.name+" · "+actor.role}]}/>
     {pending?<SpaceBetween direction="horizontal" size="s">
      <Button variant="primary" disabled={!authorized} onClick={()=>setConfirm("approve")}>Aprobar (demo)</Button>
      <Button disabled={!authorized} onClick={()=>setConfirm("reject")}>Rechazar (demo)</Button>
     </SpaceBetween>:<Alert>Esta solicitud ya fue resuelta o venció y no puede ejecutarse de nuevo.</Alert>}
     <Box fontSize="body-s" color="text-body-secondary">El resultado MCP debe ser PENDING_APPROVAL con id y vencimiento; el agente consulta gov_aprobacion_estado. En esta maqueta no hay ejecución ni estado real de AWS.</Box>
    </SpaceBetween>
   </Panel>
  </ColumnLayout>
  <Modal visible={!!confirm} header={confirm==="approve"?"Confirmar aprobación":"Confirmar rechazo"} onDismiss={()=>setConfirm(null)}
   footer={<Box float="right"><SpaceBetween direction="horizontal" size="s"><Button onClick={()=>setConfirm(null)}>Cancelar</Button><Button variant="primary" disabled={!authorized} onClick={decide}>Confirmar (demo)</Button></SpaceBetween></Box>}>
   <Alert type="warning">Decisión simulada: la plataforma real debe volver a validar rol, originador, plazo e idempotencia antes de ejecutar por la puerta.</Alert>
  </Modal>
 </SpaceBetween>;
}
function Search(){
 const {navigate,setSimulation}=usePrototype();
 const [query,setQuery]=useState("");
 const [decision,setDecision]=useState({label:"Todas",value:"all"});
 const [model,setModel]=useState({label:"Todos",value:"all"});
 const [channel,setChannel]=useState({label:"Todos",value:"all"});
 const [connections,setConnections]=useState({label:"Todas",value:"all"});
 const [period,setPeriod]=useState("");
 const [applied,setApplied]=useState({query:"",decision:"all",model:"all",channel:"all",connections:"all",period:""});
 const items=audit.filter(x=>
   (applied.decision==="all"||x.decision===applied.decision)&&
   (applied.model==="all"||x.model===applied.model)&&
   (applied.channel==="all"||x.channel===applied.channel)&&
   (applied.connections==="all"||x.connections===applied.connections)&&
   (!applied.period||x.date===applied.period)&&
   [x.id,x.who,x.agent,x.tool].join(" ").toLowerCase().includes(applied.query.toLowerCase()));
 const show=x=>{
  setSimulation(prev=>({...prev,selectedTraceId:x.id}));
  navigate("s6-forensic");
 };
 return <SpaceBetween size="l">
  <Panel title="Buscar transacciones" help="EVD-02: filtros combinables de trace ID, usuario, agente, modelo, tool, decisión, período, canal y conexiones. La búsqueda real debe responder en menos de cinco segundos.">
   <SpaceBetween size="m">
    <ColumnLayout columns={2}>
     <FormField label="Trace ID, usuario, agente o tool">
      <Input value={query} onChange={({detail})=>setQuery(detail.value)} placeholder="Ej.: actualizar_precio"/>
     </FormField>
     <FormField label="Decisión">
      <Select selectedOption={decision} options={[{label:"Todas",value:"all"},{label:"Denegado",value:"Denegado"},{label:"Pendiente",value:"Pendiente"}]} onChange={({detail})=>setDecision(detail.selectedOption)}/>
     </FormField>
    </ColumnLayout>
    <ExpandableSection headerText="Filtros avanzados" variant="footer">
     <ColumnLayout columns={2}>
      <FormField label="Modelo">
       <Select selectedOption={model} options={[{label:"Todos",value:"all"},{label:"Bedrock modelo A",value:"Bedrock modelo A"},{label:"Simulado",value:"Simulado"}]} onChange={({detail})=>setModel(detail.selectedOption)}/>
      </FormField>
      <FormField label="Canal">
       <Select selectedOption={channel} options={[{label:"Todos",value:"all"},{label:"Inferencia",value:"inferencia"},{label:"MCP",value:"mcp"}]} onChange={({detail})=>setChannel(detail.selectedOption)}/>
      </FormField>
      <FormField label="Conexiones">
       <Select selectedOption={connections} options={[{label:"Todas",value:"all"},{label:"A",value:"A"},{label:"A+B+C",value:"A+B+C"}]} onChange={({detail})=>setConnections(detail.selectedOption)}/>
      </FormField>
      <FormField label="Fecha · AAAA-MM-DD">
       <Input value={period} onChange={({detail})=>setPeriod(detail.value)} placeholder="2026-11-09"/>
      </FormField>
     </ColumnLayout>
    </ExpandableSection>
    <Button variant="primary" onClick={()=>setApplied({query,decision:decision.value,model:model.value,channel:channel.value,connections:connections.value,period})}>Buscar</Button>
   </SpaceBetween>
  </Panel>
  <div className="desktop-table">
  <Table items={items} trackBy="id" header={<Header variant="h2" counter={"("+items.length+")"}>Resultados</Header>}
   columnDefinitions={[
    {id:"id",header:"Trace ID",cell:x=><Button variant="link" onClick={()=>show(x)}>{x.id}</Button>},
    {id:"who",header:"Principal",cell:x=>x.who},{id:"agent",header:"Agente",cell:x=>x.agent},
    {id:"tool",header:"Tool",cell:x=>x.tool},{id:"state",header:"Decisión",cell:x=><State value={x.decision}/>},
    {id:"action",header:"Detalle",cell:x=><Button variant="link" onClick={()=>show(x)}>Ver ruta forense</Button>}
   ]}
   empty={<Box textAlign="center" padding="l">No hay transacciones para estos filtros de demostración.</Box>}/>
  </div>
  <div className="mobile-cards">
   <Container header={<Header variant="h2" counter={"("+items.length+")"}>Resultados</Header>}>
    <SpaceBetween size="s">
     {items.length?items.map(tx=><div key={tx.id} className="mobile-request">
      <SpaceBetween size="s">
       <div className="gov-mobile-card-heading">
        <Box fontFamily="monospace">{tx.id}</Box>
        <State value={tx.decision}/>
       </div>
       <KeyValuePairs columns={2} items={[{label:"Usuario",value:tx.who},{label:"Agente",value:tx.agent},{label:"Tool",value:tx.tool},{label:"Canal",value:tx.channel}]}/>
       <Button onClick={()=>show(tx)} variant="link">Ver ruta forense</Button>
      </SpaceBetween>
     </div>):<Box textAlign="center" padding="m">Sin resultados para estos filtros.</Box>}
    </SpaceBetween>
   </Container>
  </div>
 </SpaceBetween>;
}
function Forensic(){
 const {simulation}=usePrototype();
 const [step,setStep]=useState(3);
 const [seal,setSeal]=useState(false);
 const record=audit.find(x=>x.id===simulation.selectedTraceId)||audit[0];
 const blocked=record.decision==="Denegado";
 const events=[
  {id:1,name:"Solicitud",reason:record.who+" · "+record.agent+" · "+record.channel},
  {id:2,name:record.channel==="mcp"?"Invocación MCP":"Inferencia del modelo",reason:record.tool+" · "+record.model+" · "+record.connections},
  {id:3,name:"Decisión de política",reason:record.decision+" · "+record.reason+" · "+record.policy},
  {id:4,name:"Respuesta y evidencia",reason:blocked?"Tool no ejecutada · respuesta gobernada":record.decision==="Pendiente"?"PENDING_APPROVAL · sin ejecución":"Respuesta entregada"}
 ];
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2">Transacción {record.id} · ejemplo</Header>}>
   <KeyValuePairs columns={3} items={[
    {label:"Principal",value:record.who},
    {label:"Agente",value:record.agent},
    {label:"Canal y conexiones",value:record.channel+" · "+record.connections},
    {label:"Decisión",value:<State value={record.decision}/>},
    {label:"Modelo",value:record.model},
    {label:"Correlación",value:"tool_call_id / inferida (demo)"}
   ]}/>
  </Container>
  <ColumnLayout columns={2}>
   <Panel title="Historia de la transacción" help="EVD-05: cada paso conserva principal, canal, regla y correlación; las ejecuciones fuera de MCP se marcan.">
    <SpaceBetween size="s">{events.map(x=><div className={"step-entry "+(step===x.id?"selected":"")} key={x.id}>
     <Button variant="link" onClick={()=>setStep(x.id)}>{x.id}. {x.name}</Button><Box color="text-body-secondary">{x.reason}</Box>
    </div>)}</SpaceBetween>
   </Panel>
   <SpaceBetween size="l">
    <Panel title="Regla y configuración determinantes" help="El sistema debe conservar el texto y la versión exactos, aun si la política se cambia después.">
     <KeyValuePairs columns={1} items={[
      {label:"Conjunto de reglas",value:record.policy},
      {label:"Texto evaluado (resumen demo)",value:record.reason},
      {label:"Versión de configuración",value:record.config},
      {label:"Autor del último cambio",value:record.author},
      {label:"Detalle seleccionado",value:events.find(x=>x.id===step)?.reason||""}
     ]}/>
    </Panel>
    <Panel title="Sello de evidencia">
     <SpaceBetween size="m">
      <StatusIndicator type="success">Object Lock GOVERNANCE · contrato objetivo</StatusIndicator>
      <KeyValuePairs columns={1} items={[
       {label:"Objeto",value:"evidencia/"+record.id+".json (ejemplo)"},
       {label:"Retención",value:"Configurada por despliegue; no medida en esta DEMO"},
       {label:"Integridad",value:"No comprobada contra AWS"}
      ]}/>
      <Button onClick={()=>setSeal(true)}>Probar inmutabilidad (demo)</Button>
     </SpaceBetween>
    </Panel>
   </SpaceBetween>
  </ColumnLayout>
  <Modal visible={seal} header="Prueba de inmutabilidad" onDismiss={()=>setSeal(false)}
   footer={<Box float="right"><Button variant="primary" onClick={()=>setSeal(false)}>Cerrar</Button></Box>}>
   <Alert type="info">Resultado esperado: S3 rechaza el borrado sin permiso de bypass y el objeto persiste. El modo GOVERNANCE permite un bypass privilegiado expresamente autorizado; este prototipo no ejecuta ninguna llamada AWS.</Alert>
  </Modal>
 </SpaceBetween>;
}
export {MCP,Policy,Guide,Approvals,Search,Forensic};
