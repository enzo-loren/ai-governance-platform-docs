import React,{useMemo,useState} from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import CopyToClipboard from "@cloudscape-design/components/copy-to-clipboard";
import Table from "@cloudscape-design/components/table";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Badge from "@cloudscape-design/components/badge";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import {usePrototype,Explanation} from "./main.jsx";

// DEMO: valores sin validez criptográfica ni conexión AWS. No usan credenciales reales.
// La cadena ficticia SOLO se mantiene en el estado local del modal de revelación.
// El registro compartido guarda únicamente referencia, sufijo y estado.
const demoEndpoint="https://gateway.example.invalid/inference/v1";
const models=[
 {label:"Modelo del catálogo A",value:"bedrock-a"},
 {label:"Modelo del catálogo B",value:"bedrock-b"},
 {label:"Proveedor simulado (si se habilita)",value:"simulado"}
];
const createDemoKey=()=>({id:"cred-"+crypto.randomUUID().slice(0,12),secret:"gov_demo_"+crypto.randomUUID().replaceAll("-","")});
const descriptor=key=>({id:key.id,suffix:key.secret.slice(-4),status:"Activa",created:"En esta sesión (demo)"});
const selectedFrom=simulation=>simulation.agentRegistry.find(x=>x.id===simulation.selectedAgentId)||simulation.agentRegistry[0];
const activeCount=agent=>(agent?.tokens||[]).filter(x=>x.status==="Activa").length;
function AgentSelector(){
 const {simulation,setSimulation}=usePrototype();
 const agent=selectedFrom(simulation);
 return <FormField label="Agente" description={undefined}>
  <Select ariaLabel="Seleccionar agente" selectedOption={{value:agent.id,label:agent.name}}
   options={simulation.agentRegistry.map(x=>({label:x.name,value:x.id}))}
   onChange={({detail})=>setSimulation(prev=>{
    const found=prev.agentRegistry.find(x=>x.id===detail.selectedOption.value);
    return found?{...prev,selectedAgentId:found.id,agent:found.name,mode:found.mode}:prev;
   })}/>
 </FormField>;
}
export function OneTimeCredential({reveal,onClose}){
 const [visible,setVisible]=useState(false);
 if(!reveal)return null;
 const example="BASE_URL="+demoEndpoint+"\nAPI_KEY="+reveal.secret;
 return <Modal visible={true} header="Credencial emitida · una sola visualización"
  onDismiss={onClose} closeAriaLabel="Cerrar credencial"
  footer={<Box float="right"><Button variant="primary" onClick={onClose}>He guardado la credencial</Button></Box>}>
  <SpaceBetween size="m">
   <Alert type="warning" header="Cópiala ahora">La API key de este agente solo se muestra en este paso. Al cerrar, no vuelve a estar disponible: deberás rotarla para obtener otra. No la compartas ni la pegues en código fuente.</Alert>
   <KeyValuePairs columns={2} items={[{label:"Agente",value:reveal.agentName},{label:"Canales",value:"A · inferencia / B · MCP (si se conecta)"}]}/>
   <FormField label="BASE_URL · inferencia"><Input value={demoEndpoint} readOnly/></FormField>
   <FormField label="API key · agent_token" description="Clave de demostración SIN VALIDEZ, generada únicamente en este navegador.">
    <div className="gov-reveal-row">
     <Input type={visible?"text":"password"} value={reveal.secret} readOnly/>
     <Button onClick={()=>setVisible(x=>!x)}>{visible?"Ocultar":"Mostrar"}</Button>
    </div>
   </FormField>
   <CopyToClipboard textToCopy={example} copyButtonText="Copiar BASE_URL + API key" copySuccessText="Ejemplo copiado" copyErrorText="Error al copiar"/>
   <Explanation>La clave real se genera en el servidor y se almacena como hash. La URL .invalid es un marcador de ejemplo, sin tráfico permitido.</Explanation>
  </SpaceBetween>
 </Modal>;
}
export function AgentEnrollment(){
 const {simulation,setSimulation,notify,showExplanations,slice,navigate}=usePrototype();
 const [agentName,setAgentName]=useState("");
 const [owner,setOwner]=useState("");
 const [model,setModel]=useState(models[0]);
 const [reveal,setReveal]=useState(null);
 const [lookup,setLookup]=useState("");
 const agent=selectedFrom(simulation);
 const duplicate=simulation.agentRegistry.some(x=>x.name.toLowerCase()===agentName.trim().toLowerCase());
 const valid=!!agentName.trim()&&!!owner.trim()&&!duplicate;
 const register=()=>{
  if(!valid)return;
  const key=createDemoKey();
  const id="agt-"+crypto.randomUUID().slice(0,8);
  const registered={id,name:agentName.trim(),owner:owner.trim(),mode:"Descubrimiento",model:model.value,tokens:[descriptor(key)]};
  setSimulation(prev=>({...prev,agent:registered.name,mode:registered.mode,selectedAgentId:id,agentRegistry:[...prev.agentRegistry,registered]}));
  setReveal({agentName:registered.name,secret:key.secret});
  notify("Agente "+registered.name+" registrado en la DEMO, aislado de los demás. No se creó una identidad AWS.");
  setAgentName("");setOwner("");setModel(models[0]);
 };
 const filtered=simulation.agentRegistry.filter(x=>x.name.toLowerCase().includes(lookup.toLowerCase()));
 const controlAvailable=Number(slice.slice(1))>=2;
 const selectAgent=x=>setSimulation(prev=>({...prev,selectedAgentId:x.id,agent:x.name,mode:x.mode}));
 const manage=x=>{selectAgent(x);navigate("s2-activate");};
 return <SpaceBetween size="l">
  <Container header={<Header variant="h2" description={showExplanations?"REG-02 · alta, identidad del workload y token individual":undefined}>Registrar agente</Header>}>
   <SpaceBetween size="m">
    <ColumnLayout columns={3}>
     <FormField label="Nombre del agente" errorText={duplicate?"Ya existe un agente con este nombre":undefined}>
      <Input ariaLabel="Nombre del agente" value={agentName} placeholder="Ej.: soporte-interno" onChange={({detail})=>setAgentName(detail.value)}/>
     </FormField>
     <FormField label="Responsable">
      <Input ariaLabel="Responsable" value={owner} placeholder="Persona o equipo responsable" onChange={({detail})=>setOwner(detail.value)}/>
     </FormField>
     <FormField label="Modelo permitido inicial">
      <Select ariaLabel="Modelo permitido inicial" selectedOption={model} options={models} onChange={({detail})=>setModel(detail.selectedOption)}/>
     </FormField>
    </ColumnLayout>
    <SpaceBetween direction="horizontal" size="s">
     <Button variant="primary" disabled={!valid} onClick={register}>Registrar y emitir API key</Button>
     <Badge color="grey">Cada agente tiene su propia credencial</Badge>
    </SpaceBetween>
    <Box color="text-body-secondary" fontSize="body-s">Modo inicial: descubrimiento.</Box>
   </SpaceBetween>
  </Container>
  <Container header={<Header variant="h2" description={showExplanations?"Credenciales existentes ocultas: solo puede verse una nueva al emitirla.":undefined}>Agentes registrados</Header>}>
   <SpaceBetween size="m">
    <FormField label="Filtrar agentes"><Input ariaLabel="Filtrar agentes" value={lookup} onChange={({detail})=>setLookup(detail.value)} placeholder="Buscar por nombre"/></FormField>
    <div className="desktop-table"><Table items={filtered} trackBy="id" variant="embedded" empty={<Box color="text-body-secondary">No hay agentes con ese nombre.</Box>} columnDefinitions={[
     {id:"name",header:"Agente",cell:x=><Button variant="link" onClick={()=>selectAgent(x)}>{x.name}</Button>},
     {id:"owner",header:"Responsable",cell:x=>x.owner},
     {id:"mode",header:"Modo",cell:x=>x.mode},
     {id:"credentials",header:"API keys activas",cell:x=>activeCount(x)},
     {id:"id",header:"Identidad",cell:x=><Box fontFamily="monospace" fontSize="body-s">{x.id}</Box>},
      ...(controlAvailable?[{id:"manage",header:"Acción",cell:x=><Button onClick={()=>manage(x)}>Administrar</Button>}]:[])
    ]}/></div>
    <div className="mobile-cards"><SpaceBetween size="s">
     {filtered.map(x=><Container key={x.id} header={<Header variant="h3" actions={<SpaceBetween direction="horizontal" size="xs"><Button onClick={()=>selectAgent(x)}>Seleccionar</Button>{controlAvailable&&<Button onClick={()=>manage(x)}>Administrar</Button>}</SpaceBetween>}>{x.name}</Header>}>
      <KeyValuePairs columns={2} items={[{label:"Responsable",value:x.owner},{label:"Modo",value:x.mode},{label:"Claves vigentes",value:String(activeCount(x))},{label:"Identidad",value:x.id}]}/>
     </Container>)}
     {!filtered.length&&<Box color="text-body-secondary">No hay agentes con ese nombre.</Box>}
    </SpaceBetween></div>
    <Explanation>Cada agente utiliza su propia clave para A y B. Las claves existentes no pueden recuperarse: solo pueden rotarse o revocarse. La suspensión individual se incorpora en S2.</Explanation>
    {agent&&<KeyValuePairs columns={2} items={[{label:"Agente seleccionado",value:agent.name},{label:"Credencial vigente",value:agent.tokens.filter(x=>x.status==="Activa").map(x=>"•••• "+x.suffix).join(" / ")||"Ninguna"}]}/>}
   </SpaceBetween>
  </Container>
  <OneTimeCredential key={reveal?.secret||"none"} reveal={reveal} onClose={()=>setReveal(null)}/>
 </SpaceBetween>;
}
export function AgentCredentialControls(){
 const {simulation,setSimulation,notify,showExplanations}=usePrototype();
 const [reveal,setReveal]=useState(null);
 const [revoke,setRevoke]=useState(null);
 const agent=selectedFrom(simulation);
 const current=agent?.tokens||[];
 const active=activeCount(agent);
 const issue=()=>{
  if(active>=2||agent.mode==="Retirado")return;
  const key=createDemoKey();
  setSimulation(prev=>({...prev,agentRegistry:prev.agentRegistry.map(x=>
   x.id===agent.id?{...x,tokens:[...x.tokens,descriptor(key)]}:x)}));
  setReveal({agentName:agent.name,secret:key.secret});
  notify("Nueva credencial de "+agent.name+" emitida SOLO en DEMO. La anterior continúa vigente hasta que se revoque.");
 };
 const revokeKey=()=>{
  if(!revoke)return;
  const {agentId,keyId}=revoke;
  setSimulation(prev=>({...prev,agentRegistry:prev.agentRegistry.map(x=>
   x.id===agentId?{...x,tokens:x.tokens.map(k=>k.id===keyId?{...k,status:"Revocada"}:k)}:x)}));
  notify("API key revocada para "+agent.name+" (simulación). En producción se exige 401 en A y B en ≤60 s.");
  setRevoke(null);
 };
 return <SpaceBetween size="m">
  <Container header={<Header variant="h2" actions={<Button onClick={issue} disabled={active>=2||agent.mode==="Retirado"}>{active===0?"Emitir API key":"Rotar API key"}</Button>}>Credenciales del agente</Header>}>
   <SpaceBetween size="m">
    <KeyValuePairs columns={3} items={[
     {label:"Agente",value:agent.name},
     {label:"API keys vigentes",value:active+" de 2 durante rotación"},
     {label:"Canales",value:"A · inferencia / B · MCP"}
    ]}/>
    <div className="desktop-table">
     <Table items={current} trackBy="id" variant="embedded" empty="Sin credenciales" columnDefinitions={[
      {id:"token",header:"API key",cell:x=><Box fontFamily="monospace">•••• {x.suffix}</Box>},
      {id:"status",header:"Estado",cell:x=><StatusIndicator type={x.status==="Activa"?"success":"stopped"}>{x.status}</StatusIndicator>},
      {id:"created",header:"Creación",cell:x=>x.created},
      {id:"action",header:"Acción",cell:x=><Button disabled={x.status!=="Activa"} onClick={()=>setRevoke({agentId:agent.id,keyId:x.id,suffix:x.suffix})}>Revocar</Button>}
     ]}/>
    </div>
    <div className="mobile-cards"><SpaceBetween size="s">{current.map(x=><Container key={x.id}>
     <SpaceBetween size="s">
      <Box fontFamily="monospace">•••• {x.suffix}</Box>
      <StatusIndicator type={x.status==="Activa"?"success":"stopped"}>{x.status}</StatusIndicator>
      <Button disabled={x.status!=="Activa"} onClick={()=>setRevoke({agentId:agent.id,keyId:x.id,suffix:x.suffix})}>Revocar API key</Button>
     </SpaceBetween>
    </Container>)}</SpaceBetween></div>
    {active===2&&<Alert type="warning">Hay dos claves vigentes durante la rotación. Revoca la antigua antes de emitir otra.</Alert>}
    {active===0&&<Alert type="error">{agent.mode==="Retirado"?"Agente retirado: ninguna credencial puede volver a activarse.":"El agente no tiene API key vigente; sus llamadas deben fallar con 401 hasta emitir una nueva."}</Alert>}
    <Explanation>Durante una rotación, la clave antigua sigue vigente hasta su revocación. La nueva se revela una sola vez; cada agente mantiene sus propias credenciales.</Explanation>
   </SpaceBetween>
  </Container>
  <OneTimeCredential key={reveal?.secret||"none"} reveal={reveal} onClose={()=>setReveal(null)}/>
  <Modal visible={!!revoke} header="Confirmar revocación de API key" onDismiss={()=>setRevoke(null)}
   footer={<Box float="right"><SpaceBetween size="s" direction="horizontal"><Button onClick={()=>setRevoke(null)}>Cancelar</Button><Button variant="primary" onClick={revokeKey}>Revocar clave (demo)</Button></SpaceBetween></Box>}>
   <SpaceBetween size="s">
    <Alert type="warning">La clave •••• {revoke?.suffix} de {agent.name} dejará de funcionar en inferencia y MCP. Los demás agentes no se verán afectados.</Alert>
     <Explanation>El producto real debe rechazar la clave revocada con HTTP 401 en ambos canales en menos de 60 segundos.</Explanation>
    <Explanation>El SDK usa como API key el agent_token del agente, no la clave de Bedrock. Ninguna acción de esta pantalla modifica AWS.</Explanation>
   </SpaceBetween>
  </Modal>
 </SpaceBetween>;
}
export {AgentSelector,selectedFrom};
