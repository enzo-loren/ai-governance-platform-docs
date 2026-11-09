import React,{useState} from "react";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
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
import {usePrototype} from "./main.jsx";

const tools=[
 {id:"consultar_ficha",kind:"Lectura",target:"Lambda MCP",approved:true,when:"Permitido"},
 {id:"actualizar_precio",kind:"Escritura",target:"OpenAPI MCP",approved:true,when:"Permitido"},
 {id:"eliminar_registro",kind:"Destructiva",target:"Lambda MCP",approved:false,when:"Denegado"},
 {id:"procesar_lote",kind:"Sin clasificar",target:"Local",approved:false,when:"Fuera de la puerta"}
];
const requests=[
 {id:"APR42",name:"cambiar_fondo",from:"Diego · operador",time:"12 min",amount:"USD 12.000"},
 {id:"APR43",name:"procesar_lote",from:"solo_workload",time:"4 min",amount:"—"},
 {id:"APR41",name:"transferir_fondos",from:"Bruno · operador",time:"Vencida",amount:"USD 890"}
];
const audit=[
 {id:"TRC-0137",who:"ana.consulta",agent:"agente-demo",tool:"actualizar_precio",decision:"Denegado",reason:"descuento 25 > 10"},
 {id:"TRC-0122",who:"solo_workload",agent:"agente-demo",tool:"eliminar_registro",decision:"Denegado",reason:"tool destructiva"},
 {id:"TRC-0104",who:"diego.operador",agent:"agente-demo",tool:"cambiar_fondo",decision:"Pendiente",reason:"aprobación humana"}
];
function Panel({title,children,actions,help}){
 const {helpOn}=usePrototype();
 return <Container header={<Header variant="h2" info={help&&<Button variant="link" onClick={()=>helpOn(title,help)}>¿Qué significa?</Button>} actions={actions}>{title}</Header>}>{children}</Container>;
}
function State({value}){
 const types={Permitido:"success",Denegado:"error",Pendiente:"pending",Vencida:"warning","Fuera de la puerta":"stopped"};
 return <StatusIndicator type={types[value]||"info"}>{value}</StatusIndicator>;
}
function MCP(){
 const {simulation,setSimulation,notify,helpOn}=usePrototype();
 const [filter,setFilter]=useState("");
 const [row,setRow]=useState(null);
 const mcp=simulation.toolsMcp;
 return <SpaceBetween size="l">
  <ColumnLayout columns={3}>
   <Panel title="Tools declaradas"><div className="kpi-value">4</div><Box color="text-body-secondary">En inferencia A</Box></Panel>
   <Panel title="Tools por MCP"><div className="kpi-value">{mcp.length} de 4</div><Box color="text-body-secondary">Cobertura B parcial</Box></Panel>
   <Panel title="Fuera de la puerta"><div className="kpi-value">{4-mcp.length}</div><Box color="text-body-secondary">Ejecución no gobernada</Box></Panel>
  </ColumnLayout>
  <Table items={tools.filter(x=>x.id.includes(filter.toLowerCase()))} trackBy="id"
   header={<Header variant="h2" info={<Button variant="link" onClick={()=>helpOn("Cobertura B","B gobierna la ejecución exclusivamente de tools invocadas por targets MCP. Las tools locales permanecen fuera de la puerta.")}>¿Qué cubre B?</Button>}>Herramientas y destinos</Header>}
   filter={<TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Filtrar tools"/>}
   columnDefinitions={[
    {id:"name",header:"Tool",cell:x=><Button variant="link" onClick={()=>setRow(x)}>{x.id}</Button>},
    {id:"class",header:"Clase",cell:x=>x.kind},
    {id:"target",header:"Destino",cell:x=>mcp.includes(x.id)?x.target:"Local"},
    {id:"state",header:"Decisión",cell:x=><State value={!mcp.includes(x.id)?"Fuera de la puerta":x.when}/>},
    {id:"toggle",header:"Usar MCP (demo)",cell:x=><Toggle checked={mcp.includes(x.id)} onChange={({detail})=>{setSimulation(s=>({...s,toolsMcp:detail.checked?[...new Set([...s.toolsMcp,x.id])]:s.toolsMcp.filter(v=>v!==x.id)}));notify("Cobertura MCP modificada solo en esta demostración.")}}>MCP</Toggle>}
   ]}/>
  <Alert type="info">Claves de targets en AgentCore Identity o Secrets Manager; el agente nunca las recibe. Respuestas de tools MCP protegidas por el control PII.</Alert>
  <Modal visible={!!row} header={row?.id||"Tool"} onDismiss={()=>setRow(null)} footer={<Box float="right"><Button onClick={()=>setRow(null)}>Cerrar</Button></Box>}>
   <KeyValuePairs columns={2} items={[{label:"Clase",value:row?.kind||""},{label:"Destino",value:row?.target||""},{label:"Cobertura B",value:row&&mcp.includes(row.id)?"MCP":"Local"},{label:"Estado del catálogo",value:row?.approved?"Aprobada":"Pendiente / no aprobada"}]}/>
  </Modal>
 </SpaceBetween>;
}
function Policy(){
 const {notify,helpOn}=usePrototype();
 const [threshold,setThreshold]=useState("10");
 const [effect,setEffect]=useState({label:"Denegar",value:"DENY"});
 const [version,setVersion]=useState(3);
 const valid=threshold!==""&&Number.isFinite(Number(threshold))&&Number(threshold)>=0;
 const result=n=>valid&&effect.value==="DENY"&&n>Number(threshold)?"Denegado":"Permitido";
 return <SpaceBetween size="l">
  <Panel title="Constructor de reglas" help="Una regla Cedar tipada valida el parámetro antes de guardar y se evalúa en la intención (A) y ejecución MCP (B).">
   <SpaceBetween size="m">
    <ColumnLayout columns={2}>
     <FormField label="Tool"><Input readOnly value="actualizar_precio"/></FormField>
     <FormField label="Efecto"><Select selectedOption={effect} options={[{label:"Denegar",value:"DENY"},{label:"Permitir",value:"ALLOW"}]} onChange={({detail})=>setEffect(detail.selectedOption)}/></FormField>
     <FormField label="Parámetro numérico"><Input readOnly value="descuento"/></FormField>
     <FormField label="Condición: mayor que" errorText={!valid?"Introduce un umbral numérico no negativo.":undefined}><Input type="number" value={threshold} onChange={({detail})=>setThreshold(detail.value)}/></FormField>
    </ColumnLayout>
    <Alert type="info">{valid?(effect.value+" si descuento > "+threshold):"Borrador inválido"}</Alert>
    <SpaceBetween direction="horizontal" size="s">
     <Button variant="primary" disabled={!valid} onClick={()=>{setVersion(n=>n+1);notify("Versión "+(version+1)+" creada en el prototipo. No se cambió Cedar real.")}}>Guardar versión simulada</Button>
     <Button onClick={()=>helpOn("Editor Cedar","El producto incluye un editor Cedar con validación contra el esquema. Aquí se muestra primero el constructor comprensible para una persona operadora.")}>Editor Cedar</Button>
    </SpaceBetween>
   </SpaceBetween>
  </Panel>
  <Panel title={"Simulación de la regla · v"+version}><ColumnLayout columns={2}>
   <div><Box variant="h3">descuento = 8</Box><State value={result(8)}/></div>
   <div><Box variant="h3">descuento = 25</Box><State value={result(25)}/></div>
  </ColumnLayout></Panel>
 </SpaceBetween>;
}
function Guide(){
 const {helpOn}=usePrototype();
 const [tab,setTab]=useState("a");
 const tabs=[
  {id:"a",label:"A · Inferencia",content:<SpaceBetween size="m"><Alert type="success">BASE_URL y agent_token en el SDK OpenAI. Es la conexión base.</Alert><CopyToClipboard textToCopy={"BASE_URL={gateway}/inference/v1\nAPI_KEY=gov_demo_sin_validez"} copyButtonText="Copiar ejemplo A" copySuccessText="Copiado" copyErrorText="Error al copiar"/></SpaceBetween>},
  {id:"b",label:"B · MCP",content:<SpaceBetween size="m"><Alert type="warning">La cobertura solo abarca tools ejecutadas por MCP, incluso si B es parcial.</Alert><CopyToClipboard textToCopy={"MCP_URL={gateway}/mcp\nAGENT_TOKEN=gov_demo_sin_validez"} copyButtonText="Copiar ejemplo B" copySuccessText="Copiado" copyErrorText="Error al copiar"/></SpaceBetween>},
  {id:"c",label:"C · Usuario",content:<SpaceBetween size="m"><Alert type="info">JWT de usuario verificado por solicitud; B y C son independientes.</Alert><CopyToClipboard textToCopy="X-Gov-User-Token: <JWT OIDC del cliente>" copyButtonText="Copiar cabecera C" copySuccessText="Copiado" copyErrorText="Error al copiar"/></SpaceBetween>}
 ];
 return <SpaceBetween size="l">
  <Panel title="Conectar por partes" help="Conexión A obligatoria; B y C independientes. Conectar un servicio no garantiza automáticamente su cobertura efectiva.">
   <Tabs tabs={tabs} activeTabId={tab} onChange={({detail})=>setTab(detail.activeTabId)}/>
  </Panel>
  <Panel title="Cierre de brechas">
   <Alert type="warning">procesar_lote sigue local y no se gobierna su ejecución. Se debe registrar como target MCP, clasificar y aprobar.</Alert>
   <Button onClick={()=>helpOn("Validación técnica","POL-02 exige una matriz versionada de al menos 30 escenarios ALLOW/DENY contra el proveedor simulado. No es otra pantalla de gerencia.")}>Validaciones exigidas</Button>
  </Panel>
 </SpaceBetween>;
}
function Approvals(){
 const {simulation,setSimulation,notify}=usePrototype();
 const [selected,setSelected]=useState("APR42");
 const [confirm,setConfirm]=useState(null);
 const status=id=>simulation.approvals[id]||"Pendiente";
 const chosen=requests.find(x=>x.id===selected)||requests[0];
 const decide=()=>{
  if(!confirm)return;
  const result=confirm==="approve"?"Aprobada · ejecutada":"Rechazada · no ejecutada";
  setSimulation(s=>({...s,approvals:{...s.approvals,[chosen.id]:result}}));
  notify(chosen.id+": "+result+". Ninguna tool fue ejecutada.");
  setConfirm(null);
 };
 return <SpaceBetween size="l">
  <Alert type="info">Sesión simulada: Elena · rol aprobadora. El agent_token no es credencial para aprobar.</Alert>
  <ColumnLayout columns={2}>
   <Table items={requests} trackBy="id" header={<Header variant="h2">Solicitudes</Header>}
    columnDefinitions={[
     {id:"name",header:"Operación",cell:x=><Button variant="link" onClick={()=>setSelected(x.id)}>{x.id} · {x.name}</Button>},
     {id:"state",header:"Estado",cell:x=><StatusIndicator type={status(x.id)==="Pendiente"?"pending":status(x.id)==="Vencida"?"warning":"success"}>{status(x.id)}</StatusIndicator>},
     {id:"time",header:"Plazo",cell:x=>x.time}
    ]}/>
   <Panel title={"Solicitud "+chosen.id} help="El sistema retiene la tool y devuelve PENDING_APPROVAL. Solo un humano autorizado puede aprobar; el originador no puede aprobar lo suyo.">
    <SpaceBetween size="m">
     <KeyValuePairs columns={2} items={[{label:"Tool",value:chosen.name},{label:"Originador",value:chosen.from},{label:"Monto",value:chosen.amount},{label:"Estado",value:status(chosen.id)}]}/>
     {status(chosen.id)==="Pendiente"?<SpaceBetween direction="horizontal" size="s"><Button variant="primary" onClick={()=>setConfirm("approve")}>Aprobar (demo)</Button><Button onClick={()=>setConfirm("reject")}>Rechazar (demo)</Button></SpaceBetween>:<Alert>Esta solicitud ya fue resuelta o venció.</Alert>}
    </SpaceBetween>
   </Panel>
  </ColumnLayout>
  <Alert type="warning">En caso de falla del servicio de aprobación, la ejecución se deniega. El agente obtiene el resultado posteriormente mediante gov_aprobacion_estado.</Alert>
  <Modal visible={!!confirm} header={confirm==="approve"?"Confirmar aprobación":"Confirmar rechazo"} onDismiss={()=>setConfirm(null)} footer={<Box float="right"><SpaceBetween direction="horizontal" size="s"><Button onClick={()=>setConfirm(null)}>Cancelar</Button><Button variant="primary" onClick={decide}>Confirmar (demo)</Button></SpaceBetween></Box>}>
   <Alert type="warning">Esta acción modifica solo los datos de muestra en memoria; no ejecuta MCP.</Alert>
  </Modal>
 </SpaceBetween>;
}
function Search(){
 const {navigate}=usePrototype();
 const [query,setQuery]=useState("");
 const [decision,setDecision]=useState({label:"Todas",value:"all"});
 const [applied,setApplied]=useState({query:"",decision:"all"});
 const items=audit.filter(x=>(applied.decision==="all"||x.decision===applied.decision)&&[x.id,x.who,x.agent,x.tool].join(" ").toLowerCase().includes(applied.query.toLowerCase()));
 return <SpaceBetween size="l">
  <Panel title="Buscar transacciones" help="La búsqueda real combina trace ID, usuario, agente, período, modelo, tool, decisión, canal y conexiones. Meta: menos de 5 segundos.">
   <SpaceBetween direction="horizontal" size="m">
    <FormField label="ID, usuario, agente o tool"><Input value={query} onChange={({detail})=>setQuery(detail.value)} placeholder="Ej.: actualizar_precio"/></FormField>
    <FormField label="Decisión"><Select selectedOption={decision} options={[{label:"Todas",value:"all"},{label:"Denegado",value:"Denegado"},{label:"Pendiente",value:"Pendiente"}]} onChange={({detail})=>setDecision(detail.selectedOption)}/></FormField>
    <Button variant="primary" onClick={()=>setApplied({query,decision:decision.value})}>Buscar</Button>
   </SpaceBetween>
  </Panel>
  <Table items={items} trackBy="id" header={<Header variant="h2" counter={"("+items.length+")"}>Resultados</Header>}
   columnDefinitions={[
    {id:"id",header:"Trace ID",cell:x=><Button variant="link" onClick={()=>navigate("s6-forensic")}>{x.id}</Button>},
    {id:"who",header:"Usuario",cell:x=>x.who},{id:"agent",header:"Agente",cell:x=>x.agent},
    {id:"tool",header:"Tool",cell:x=>x.tool},{id:"state",header:"Decisión",cell:x=><State value={x.decision}/>},
    {id:"action",header:"Detalle",cell:()=><Button variant="link" onClick={()=>navigate("s6-forensic")}>Ver ruta forense</Button>}
   ]}
   empty={<Box textAlign="center" padding="l">No hay transacciones para estos filtros. Cambia los criterios.</Box>}/>
 </SpaceBetween>;
}
function Forensic(){
 const [step,setStep]=useState(3);
 const [seal,setSeal]=useState(false);
 const events=[
  {id:1,name:"Solicitud de usuario",reason:"ana.consulta · identidad verificada"},
  {id:2,name:"Inferencia del modelo",reason:"tool_call actualizar_precio · descuento 25"},
  {id:3,name:"Decisión Cedar",reason:"Denegado: descuento 25 > máximo 10 · regla v3"},
  {id:4,name:"Respuesta gobernada",reason:"Tool no ejecutada; evidencia sellada"}
 ];
 return <SpaceBetween size="l">
  <ColumnLayout columns={2}>
   <Panel title="Historia de la transacción" help="Cada paso guarda el principal, agente, regla, resultado y tipo de correlación. También se explicitan saltos fuera de MCP.">
    <SpaceBetween size="s">{events.map(x=><div className={"step-entry "+(step===x.id?"selected":"")} key={x.id}><Button variant="link" onClick={()=>setStep(x.id)}>{x.id}. {x.name}</Button><Box color="text-body-secondary">{x.reason}</Box></div>)}</SpaceBetween>
   </Panel>
   <SpaceBetween size="l">
    <Panel title="Regla determinante" help="Se conserva la versión exacta de la regla y configuración evaluadas, aun cuando se publiquen versiones posteriores.">
     <KeyValuePairs columns={1} items={[
      {label:"Conjunto y versión",value:"descuento_máximo · v3"},
      {label:"Texto de la condición",value:"DENY si descuento > 10"},
      {label:"Cambio administrativo",value:"operador plataforma"},
      {label:"Detalle elegido",value:events.find(x=>x.id===step)?.reason||""}
     ]}/>
    </Panel>
    <Panel title="Sello de evidencia"><SpaceBetween size="m">
     <StatusIndicator type="success">Object Lock GOVERNANCE</StatusIndicator>
     <Box color="text-body-secondary">Objeto en S3 bajo la retención configurada.</Box>
     <Button onClick={()=>setSeal(true)}>Probar inmutabilidad (demo)</Button>
    </SpaceBetween></Panel>
   </SpaceBetween>
  </ColumnLayout>
  <Modal visible={seal} header="Prueba de inmutabilidad" onDismiss={()=>setSeal(false)} footer={<Box float="right"><Button variant="primary" onClick={()=>setSeal(false)}>Cerrar</Button></Box>}>
   <Alert type="info">Resultado esperado del sistema final: S3 rechaza el borrado sin permiso de bypass y conserva el objeto. Este prototipo no ejecutó ninguna llamada a AWS.</Alert>
  </Modal>
 </SpaceBetween>;
}
export {MCP,Policy,Guide,Approvals,Search,Forensic};
