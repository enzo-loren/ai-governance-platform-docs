import React,{useState} from "react";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import {PRESET_DESCRIPTIONS,CONNECTION_SCENARIOS,PRINCIPALS,presetRows} from "./preset-guide.js";

const statusType={Permitido:"success",Denegado:"error","Requiere aprobación":"pending"};
function Outcome({result}){
 return <SpaceBetween size="xxs">
  <StatusIndicator type={statusType[result.outcome]}>{result.outcome}</StatusIndicator>
  <Box color="text-body-secondary" fontSize="body-s">{result.reason}</Box>
 </SpaceBetween>;
}
export default function PresetExplainer({currentPreset,candidatePreset,mode,showExplanations}){
 const [scenario,setScenario]=useState(CONNECTION_SCENARIOS[0]);
 const [principal,setPrincipal]=useState(PRINCIPALS[0]);
 const previewing=Boolean(candidatePreset&&candidatePreset!==currentPreset);
 const selected=previewing?candidatePreset:currentPreset;
 const summary=PRESET_DESCRIPTIONS.find(x=>x.value===selected)||PRESET_DESCRIPTIONS[0];
 const actor=scenario.hasC?principal.value:"solo_workload";
 const rows=presetRows({preset:selected,previousPreset:previewing?currentPreset:null,scenario:scenario.value,principal:actor});
 const changeScenario=option=>{setScenario(option);if(!option.hasC)setPrincipal(PRINCIPALS[0]);};
 return <Container header={<Header variant="h2">Qué permite y bloquea este preset</Header>}>
  <SpaceBetween size="m">
   <Box><strong>{selected} · {summary.name}.</strong> {summary.summary} {summary.detail}</Box>
   {previewing&&<Alert type="info">Estás comparando el Preset {currentPreset} con el Preset {candidatePreset}. Todavía no se ha guardado el cambio.</Alert>}
   {mode==="Descubrimiento"&&<Alert type="info">Este agente está en descubrimiento: las decisiones de sus reglas se evalúan en sombra. La tabla muestra qué ocurriría <strong>en modo activo</strong>.</Alert>}
   <Box color="text-body-secondary">Explora qué ocurriría en distintos contextos. Estos selectores <strong>no conectan B ni C</strong> y no cambian la configuración del agente.</Box>
   <ColumnLayout columns={2}>
    <FormField label="Conexiones del ejemplo">
     <Select ariaLabel="Conexiones del ejemplo" selectedOption={scenario} options={CONNECTION_SCENARIOS} onChange={({detail})=>changeScenario(detail.selectedOption)}/>
    </FormField>
    <FormField label="Quién solicita la operación" description={!scenario.hasC?"Sin C no se identifica al usuario: se aplica solo_workload.":undefined}>
     <Select ariaLabel="Quién solicita la operación" selectedOption={scenario.hasC?principal:PRINCIPALS[0]} disabled={!scenario.hasC}
      options={PRINCIPALS} onChange={({detail})=>setPrincipal(detail.selectedOption)}/>
    </FormField>
   </ColumnLayout>
   {selected==="2"&&!scenario.hasC&&<Alert type="warning" header="Sin identidad C, las escrituras quedan bloqueadas">Preset 2 permite leer, pero requiere un usuario verificado con rol operador para escribir. La aprobación de operaciones críticas también necesita B.</Alert>}
   {selected==="2"&&scenario.hasC&&!scenario.hasB&&<Alert type="warning">Aunque haya identidad C, una operación crítica no puede esperar aprobación humana sin ejecución MCP por B.</Alert>}
   {selected==="3"&&<Alert type="warning">Preset 3 no concede acceso automáticamente: hacen falta reglas nominales explícitas. Ninguna se ha configurado en estos ejemplos.</Alert>}
   <div className="desktop-table gov-preset-table">
    <Table variant="embedded" items={rows} trackBy="id"
     header={<Header variant="h3">{previewing?"Comparación de decisiones · ejemplos":"Decisiones previstas · ejemplos"}</Header>}
     columnDefinitions={[
      {id:"tool",header:"Ejemplo de tool",width:260,cell:x=>x.label},
      ...(previewing?[{id:"current",header:"Preset "+currentPreset+" · actual",cell:x=><Outcome result={x.current}/>}]:[]),
      {id:"candidate",header:previewing?"Preset "+candidatePreset+" · candidato":"Si estuviera en activo",cell:x=><Outcome result={x.candidate}/>}
     ]}/>
   </div>
   <div className="mobile-cards">
    <SpaceBetween size="s">
     {rows.map(x=><Container key={x.id} header={<Header variant="h3">{x.label}</Header>}>
      <SpaceBetween size="s">
       {previewing&&<div><Box color="text-body-secondary">Preset {currentPreset} · actual</Box><Outcome result={x.current}/></div>}
       <div><Box color="text-body-secondary">Preset {selected} · {previewing?"candidato":"en activo"}</Box><Outcome result={x.candidate}/></div>
      </SpaceBetween>
     </Container>)}
    </SpaceBetween>
   </div>
   <Alert type="info" header="Impacto real: sin datos medidos">
    No se han reevaluado transacciones históricas. Esta comparación muestra ejemplos basados en la especificación, no cuántas solicitudes reales cambiarían de decisión.
   </Alert>
   <ExpandableSection headerText="Comparar los tres presets">
    <ColumnLayout columns={3}>
     {PRESET_DESCRIPTIONS.map(x=><div key={x.value}>
      <Box variant="h3">{x.value} · {x.name}</Box>
      <Box>{x.summary}</Box>
      <Box color="text-body-secondary" fontSize="body-s">{x.detail}</Box>
     </div>)}
    </ColumnLayout>
   </ExpandableSection>
   {showExplanations&&<Alert type="info">Guía didáctica basada en POL-01 y contexto/03 §2. No evalúa Cedar, no inspecciona credenciales ni confirma conexiones reales, ni sustituye la simulación con evidencias exigida por POL-05. Una tool pendiente o sin clasificar no se autoriza en modo activo. Los modelos permitidos y los guardrails son controles independientes del preset.</Alert>}
  </SpaceBetween>
 </Container>;
}
