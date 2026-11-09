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
 {id:"TRC-0137",who:"ana.consulta",agent:"agente-demo",tool:"actualizar_precio",decision:"Denegado",reason:"descuento 25 > 10"},
 {id:"TRC-0122",who:"solo_workload",agent:"agente-demo",tool:"eliminar_registro",decision:"Denegado",reason:"tool destructiva"},
 {id:"TRC-0104",who:"diego.operador",agent:"agente-demo",tool:"cambiar_fondo",decision:"Pendiente",reason:"aprobación humana"}
];
function Panel({title,children,actions,help}){
 const {helpOn,showExplanations}=usePrototype();
 return <Container header={<Header variant="h2" info={showExplanations&&help?<Button variant="link" onClick={()=>helpOn(title,help)}>¿Qué significa?</Button>:undefined} actions={actions}>{title}</Header>}>{children}</Container>;
}
function State({value}){
 const types={Permitido:"success",Denegado:"error",Pendiente:"pending",Vencida:"warning","Fuera de la puerta":"stopped"};
 return <StatusIndicator type={types[value]||"info"}>{value}</StatusIndicator>;
}
function MCP(){
 const {simulation,setSimulation,notify,helpOn,showExplanations}=usePrototype();
 const [filter,setFilter]=useState("");
 const [row,setRow]=useState(null);
 const mcp=simulation.toolsMcp;
 const filtered=tools.filter(x=>x.id.toLowerCase().includes(filter.toLowerCase()));
 const toggle=(id,checked)=>{
  setSimulation(v=>({...v,toolsMcp:checked?[...new Set([...v.toolsMcp,id])]:v.toolsMcp.filter(name=>name!==id)}));
  notify("Cobertura MCP modificada solo en esta demostración.");
 };
 const decision=x=>mcp.includes(x.id)?x.when:"Fuera de la puerta";
 return <SpaceBetween size="l">
  <ColumnLayout columns={3}>
   <Panel title="Tools declaradas"><div className="kpi-value">4</div><Box color="text-body-secondary">En inferencia A</Box></Panel>
   <Panel title="Tools por MCP"><div className="kpi-value">{mcp.length} de 4</div><Box color="text-body-secondary">Cobertura B parcial</Box></Panel>
   <Panel title="Fuera de la puerta"><div className="kpi-value">{4-mcp.length}</div><Box color="text-body-secondary">Ejecución no gobernada</Box></Panel>
  </ColumnLayout>
  <div className="desktop-table">
   <Table items={filtered} trackBy="id"
    header={<Header variant="h2" info={showExplanations?<Button variant="link" onClick={()=>helpOn("Cobertura B","B gobierna la ejecución exclusivamente de tools invocadas por targets MCP. Las tools locales permanecen fuera de la puerta.")}>¿Qué cubre B?</Button>:undefined}>Herramientas y destinos</Header>}
    filter={<TextFilter filteringText={filter} onChange={({detail})=>setFilter(detail.filteringText)} filteringPlaceholder="Filtrar tools"/>}
    columnDefinitions={[
     {id:"name",header:"Tool",cell:x=><Button variant="link" onClick={()=>setRow(x)}>{x.id}</Button>},
     {id:"class",header:"Clase",cell:x=>x.kind},
     {id:"target",header:"Destino",cell:x=>mcp.includes(x.id)?x.target:"Local"},
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
      <KeyValuePairs columns={2} items={[{label:"Clase",value:x.kind},{label:"Destino",value:mcp.includes(x.id)?x.target:"Local"}]}/>
      <Button variant="link" onClick={()=>setRow(x)}>Ver detalle de tool</Button>
     </SpaceBetween>
    </Container>)}
   </SpaceBetween>
  </div>
  <Explanation>Las credenciales viven en AgentCore Identity o Secrets Manager. El agente no las recibe y las respuestas MCP pasan por protección PII.</Explanation>
  <Modal visible={!!row} header={row?.id||"Tool"} onDismiss={()=>setRow(null)} footer={<Box float="right"><Button onClick={()=>setRow(null)}>Cerrar</Button></Box>}>
   <KeyValuePairs columns={2} items={[{label:"Clase",value:row?.kind||""},{label:"Destino",value:row?.target||""},{label:"Cobertura B",value:row&&mcp.includes(row.id)?"MCP":"Local"},{label:"Estado del catálogo",value:row?.approved?"Aprobada":"Pendiente / no aprobada"}]}/>
  </Modal>
 </SpaceBetween>;
}
function Policy(){
 const {notify,helpOn,showExplanations}=usePrototype();
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
    <Box color={valid?"text-body-secondary":"text-status-error"} fontSize="body-s">{valid?(effect.value+" si descuento > "+threshold):"Borrador inválido"}</Box>
    <SpaceBetween direction="horizontal" size="s">
     <Button variant="primary" disabled={!valid} onClick={()=>{setVersion(n=>n+1);notify("Versión "+(version+1)+" creada en el prototipo. No se cambió Cedar real.")}}>Guardar versión simulada</Button>
     {showExplanations&&<Button onClick={()=>helpOn("Editor Cedar","El producto incluye un editor Cedar con validación contra el esquema. Esta maqueta muestra primero el constructor visual.")}>Editor Cedar · información</Button>}
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
  <Badge color="grey">Elena · aprobadora</Badge>
  <Explanation>Solo la persona con rol aprobador puede decidir. agent_token no permite aprobar una tool.</Explanation>
  <ColumnLayout columns={2}>
   <div className="desktop-table"><Table items={requests} trackBy="id" header={<Header variant="h2">Solicitudes</Header>}
    columnDefinitions={[
     {id:"name",header:"Operación",cell:x=><Button variant="link" onClick={()=>setSelected(x.id)}>{x.id} · {x.name}</Button>},
     {id:"state",header:"Estado",cell:x=><StatusIndicator type={status(x.id)==="Pendiente"?"pending":status(x.id)==="Vencida"?"warning":"success"}>{status(x.id)}</StatusIndicator>},
     {id:"time",header:"Plazo",cell:x=>x.time}
    ]}/></div>
   <div className="mobile-cards">
    <Container header={<Header variant="h2">Solicitudes</Header>}>
     <SpaceBetween size="s">
      {requests.map(item=><div key={item.id} className="mobile-request">
       <SpaceBetween size="xxs">
        <Button variant="link" onClick={()=>setSelected(item.id)}>{item.id} · {item.name}</Button>
        <StatusIndicator type={status(item.id)==="Pendiente"?"pending":status(item.id)==="Vencida"?"warning":"success"}>{status(item.id)}</StatusIndicator>
        <Box fontSize="body-s" color="text-body-secondary">{item.time}</Box>
       </SpaceBetween>
      </div>)}
     </SpaceBetween>
    </Container>
   </div>
   <Panel title={"Solicitud "+chosen.id} help="El sistema retiene la tool y devuelve PENDING_APPROVAL. Solo un humano autorizado puede aprobar; el originador no puede aprobar lo suyo.">
    <SpaceBetween size="m">
     <KeyValuePairs columns={2} items={[{label:"Tool",value:chosen.name},{label:"Originador",value:chosen.from},{label:"Monto",value:chosen.amount},{label:"Estado",value:status(chosen.id)}]}/>
     {status(chosen.id)==="Pendiente"?<SpaceBetween direction="horizontal" size="s"><Button variant="primary" onClick={()=>setConfirm("approve")}>Aprobar (demo)</Button><Button onClick={()=>setConfirm("reject")}>Rechazar (demo)</Button></SpaceBetween>:<Alert>Esta solicitud ya fue resuelta o venció.</Alert>}
    </SpaceBetween>
   </Panel>
  </ColumnLayout>
  <Explanation type="warning">Si falla el servicio de aprobación, la ejecución se deniega. El agente consulta después gov_aprobacion_estado.</Explanation>
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
