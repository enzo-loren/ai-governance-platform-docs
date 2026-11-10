import React, {useState,useEffect,useMemo,useCallback,createContext,useContext} from "react";
import {createRoot} from "react-dom/client";
import "@cloudscape-design/global-styles/index.css";
import AppLayout from "@cloudscape-design/components/app-layout";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Select from "@cloudscape-design/components/select";
import FormField from "@cloudscape-design/components/form-field";
import Modal from "@cloudscape-design/components/modal";
import Flashbar from "@cloudscape-design/components/flashbar";
import Badge from "@cloudscape-design/components/badge";
import Toggle from "@cloudscape-design/components/toggle";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import data from "../../assets/console-data.json";
import editorialBoard from "./editorial-board.json";
import {getModelCatalog,initialAllowedModelIds} from "./model-catalog.js";
import {RenderScreen} from "./screens.jsx";
import PresentationStage,{PRESENTATION_SCREEN_IDS} from "./presentation-stage.jsx";
import "./presentation-stage.css";
import "./app.css";

const PrototypeContext=createContext(null);
export const usePrototype=()=>useContext(PrototypeContext);
const sliceIndex=s=>data.stages.findIndex(x=>x.id===s);
const findScreen=id=>data.screens.find(x=>x.id===id);
// Cada superficie tiene una o más versiones, solo en slices donde se creó o cambió.
// No se trata del producto acumulado: una vista sin cambios no debe repetirse.
const screenVersions=surface=>data.screens
 .filter(screen=>screen.surface===surface)
 .sort((a,b)=>sliceIndex(a.slice)-sliceIndex(b.slice));
const versionAt=(surface,stage)=>screenVersions(surface)
 .filter(screen=>sliceIndex(screen.slice)<=sliceIndex(stage)).at(-1)||null;
const fromLocation=()=>{
 const query=new URLSearchParams(location.search);
 const valid=data.stages.some(stage=>stage.id===query.get("slice"))?query.get("slice"):null;
 const requested=findScreen(query.get("screen"));
 if(requested){
  const stage=valid||requested.slice;
  const target=versionAt(requested.surface,stage);
  if(target)return {slice:stage,screen:target.id};
  // Un enlace construido hacia una capacidad futura nunca debe adelantarla.
  const fallback=data.screens.find(screen=>screen.slice===stage)||data.screens[0];
  return {slice:stage,screen:fallback.id};
 }
 const stage=valid||"S0";
 const fallback=data.screens.find(screen=>screen.slice===stage)||data.screens[0];
 return {slice:fallback.slice,screen:fallback.id};
};
function latestScreens(slice){
 const list=data.screens.filter(x=>sliceIndex(x.slice)<=sliceIndex(slice));
 const bySurface=new Map();
 list.forEach(x=>bySurface.set(x.surface,x));
 return [...bySurface.values()].sort((a,b)=>sliceIndex(a.slice)-sliceIndex(b.slice));
}
function Application(){
 const preview=new URLSearchParams(location.search).get("preview")==="1";
 const [showExplanations,setShowExplanations]=useState(
  ()=>!preview&&new URLSearchParams(location.search).get("explain")==="1"
 );
 const [route,setRoute]=useState(fromLocation);
 const [help,setHelp]=useState(null);
 const [presenting,setPresenting]=useState(false);
 const [message,setMessage]=useState(null);
 const [simulation,setSimulation]=useState({agent:"agente-demo",mode:"Descubrimiento", budget:50,spent:41.2, rate:50, piiRole:"consulta", policies:[], simulatedEnabled:true, toolsMcp:["consultar_ficha","actualizar_precio","eliminar_registro"],approvedTools:["consultar_ficha","actualizar_precio"],supervision:{consultar_ficha:"autonoma",actualizar_precio:"notificar",eliminar_registro:"requiere_aprobacion",cambiar_fondo:"requiere_aprobacion"},toolOverrides:{},toolSchemaVersions:{}, approvals:{APR42:"Pendiente",APR43:"Pendiente",APR41:"Vencida"},selectedAgentId:"agt-demo",agentRegistry:[{id:"agt-demo",name:"agente-demo",owner:"Operador plataforma",mode:"Descubrimiento",modelos_permitidos:initialAllowedModelIds(getModelCatalog(true)),tokens:[{id:"cred-demo-1",suffix:"D3MO",status:"Activa",created:"Demo inicial"}]}]});
 const slice=route.slice;
 const active=findScreen(route.screen)||data.screens[0];
 const editorial=editorialBoard[active.surface];
 const canPresent=!preview&&PRESENTATION_SCREEN_IDS.includes(active.id);
 const visible=useMemo(()=>latestScreens(slice),[slice]);
 const revisions=useMemo(()=>screenVersions(active.surface),[active.surface]);
 const navigate=useCallback((screenId,newSlice=slice,replace=false)=>{
  if(!data.stages.some(s=>s.id===newSlice))return;
  const requested=findScreen(screenId);
  if(!requested)return;
  // Al cambiar versión, permanecer siempre en la misma superficie.
  const target=versionAt(requested.surface,newSlice);
  if(!target)return;
  const next={slice:newSlice,screen:target.id};
  const q=new URLSearchParams(location.search);
  q.set("slice",newSlice);q.set("screen",target.id);
  q.delete("preview");
  const url=location.pathname+"?"+q.toString();
  history[replace?"replaceState":"pushState"](null,"",url);
  setRoute(next);setHelp(null);setMessage(null);setPresenting(false);
  const main=document.querySelector("#console-content");
  if(main)main.scrollTo({top:0});
  window.scrollTo({top:0});
 },[slice]);
 useEffect(()=>{
  const listener=()=>{
   setRoute(fromLocation());
   setPresenting(false);
   window.scrollTo({top:0});
  };
  window.addEventListener("popstate",listener);
  return()=>window.removeEventListener("popstate",listener);
 },[]);
 const switchSlice=useCallback((id)=>{
  // Solo se ofrecen slices donde esta pantalla fue introducida o modificada.
  const target=screenVersions(active.surface).find(version=>version.slice===id);
  if(target)navigate(target.id,id);
 },[navigate,active.surface]);
 const notify=(content,type="success")=>setMessage({id:String(Date.now()),content,type});
 const helpOn=(title,content)=>setHelp({title,content});
 const toggleExplanations=useCallback(checked=>{
  setShowExplanations(checked);
  if(!checked)setHelp(null);
  const url=new URL(location.href);
  if(checked)url.searchParams.set("explain","1");
  else url.searchParams.delete("explain");
  history.replaceState(null,"",url.pathname+url.search+url.hash);
 },[]);
 useEffect(()=>{
  if(!presenting)return;
  const onKey=event=>{
   if(event.key==="Escape"){event.preventDefault();setPresenting(false)}
  };
  document.addEventListener("keydown",onKey);
  return()=>document.removeEventListener("keydown",onKey);
 },[presenting]);
 const returnFromPresentation=()=>{
  setPresenting(false);
  requestAnimationFrame(()=>document.getElementById("presentation-launch")?.focus());
 };
  const roadmapHref="../index.html"+(showExplanations?"?explain=1":"")+"#"+slice.toLowerCase();
 const ctx={slice,screen:active,visible,simulation,setSimulation,notify,helpOn,navigate,preview,showExplanations};
 return <PrototypeContext.Provider value={ctx}>
  {presenting?<PresentationStage screen={active} simulation={simulation} onExit={returnFromPresentation}/>:<>
  {!preview&&<div id="console-top">
   <TopNavigation
     identity={{href:roadmapHref,title:"AI Governance"}}
     utilities={[{type:"button",text:"Volver a slices",href:roadmapHref}]}
   />
  </div>}
  <AppLayout
   headerSelector="#console-top"
   navigationHide
   navigationTriggerHide
   navigation={null}
   toolsHide
   maxContentWidth={1220}
   content={<div id="console-content">
      <SpaceBetween size="l">
       {!preview&&<div className="prototype-controls">
        <div className="prototype-status" aria-label="Entorno de demostración">
         <Badge color="blue">DEMO · Sin conexión AWS</Badge>
        </div>
        <div className="prototype-actions">
         {revisions.length>1?
          <div data-testid="screen-version-selector">
           <FormField label="Versión de esta pantalla">
            <Select
             selectedOption={{label:slice+" · "+data.stages[sliceIndex(slice)].name,value:slice}}
             options={revisions.map(version=>({
              label:version.slice+" · "+data.stages[sliceIndex(version.slice)].name,
              value:version.slice
             }))}
             onChange={({detail})=>switchSlice(detail.selectedOption.value)}
             ariaLabel="Elegir versión de esta pantalla"/>
           </FormField>
          </div>
          :<div className="screen-version-single" data-testid="screen-version-static">
            <Badge color="grey">{active.slice} · {data.stages[sliceIndex(active.slice)].name}</Badge>
           </div>}
         {slice!==active.slice&&<Box color="text-body-secondary" fontSize="body-s">Acumulado hasta {slice}</Box>}
         {canPresent&&<Button id="presentation-launch" iconName="view-full" onClick={()=>{setHelp(null);setPresenting(true)}}>Modo presentación</Button>}
         <div className="explanations-switch">
          <Toggle checked={showExplanations} onChange={({detail})=>toggleExplanations(detail.checked)}>
           Mostrar explicaciones
          </Toggle>
         </div>
        </div>
       </div>}
       <ContentLayout header={<Header variant="h1" description={showExplanations?active.question:undefined}
        info={showExplanations?<Button variant="link" onClick={()=>helpOn(active.title,active.question+" Los datos son ilustrativos; la trazabilidad está disponible en la pizarra editorial al final de la pantalla.")}>¿Qué muestra?</Button>:undefined}
        >
          {active.title}
       </Header>}>
         <SpaceBetween size="l">
          {message&&<Flashbar items={[{...message,dismissible:true,onDismiss:()=>setMessage(null)}]}/>}
          <RenderScreen id={active.id}/>
          {!preview&&showExplanations&&editorial&&<div className="prototype-footer" data-testid="editorial-board">
             <ExpandableSection headerText="Pizarra editorial y trazabilidad" variant="footer">
               <SpaceBetween size="s">
                 <Box><strong>Resultado que debe entenderse:</strong> {editorial.visible}</Box>
                 <Box><strong>Condición que debe permanecer visible:</strong> {editorial.required}</Box>
                 <Box><strong>Contexto técnico opcional:</strong> {editorial.optional}</Box>
                 <Box><strong>Decisión editorial:</strong> {editorial.decision}</Box>
                 <Box fontSize="body-s" color="text-body-secondary">
                   Requisitos relacionados: {active.requirements.join(" · ")} ·
                   {" "}<a href="https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml" target="_blank" rel="noreferrer">Fuente normativa</a> ·
                   {" "}<a href="https://github.com/enzo-loren/ai-governance-platform-docs/blob/e24d1d197ec15ce62e2ca6381152fd3d64b04751/src/console/editorial-board.json" target="_blank" rel="noreferrer">Pizarra completa</a>
                 </Box>
               </SpaceBetween>
             </ExpandableSection>
           </div>}
         </SpaceBetween>
       </ContentLayout>
      </SpaceBetween>
    </div>}
  />
  </>}
  <Modal visible={!!help&&!presenting} header={help?.title||"Ayuda"} onDismiss={()=>setHelp(null)}
   footer={<Box float="right"><Button variant="primary" onClick={()=>setHelp(null)}>Entendido</Button></Box>}>
    <SpaceBetween size="s"><Box>{help?.content}</Box><Alert type="info">Esta explicación describe el diseño previsto; la funcionalidad del prototipo sigue siendo simulada.</Alert></SpaceBetween>
  </Modal>
 </PrototypeContext.Provider>;
}
export function Explanation({children,type="info"}){
 const {showExplanations}=usePrototype();
 return showExplanations?<Alert type={type}>{children}</Alert>:null;
}
createRoot(document.getElementById("governance-root")).render(<Application/>);
