import React, {useState,useEffect,useMemo,useCallback,createContext,useContext} from "react";
import {createRoot} from "react-dom/client";
import "@cloudscape-design/global-styles/index.css";
import AppLayout from "@cloudscape-design/components/app-layout";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import SideNavigation from "@cloudscape-design/components/side-navigation";
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
import data from "../../assets/console-data.json";
import {RenderScreen} from "./screens.jsx";
import "./app.css";

const PrototypeContext=createContext(null);
export const usePrototype=()=>useContext(PrototypeContext);
const sliceIndex=s=>data.stages.findIndex(x=>x.id===s);
const findScreen=id=>data.screens.find(x=>x.id===id);
const fromLocation=()=>{
 const q=new URLSearchParams(location.search);
 const valid=data.stages.some(x=>x.id===q.get("slice"))?q.get("slice"):"S0";
 const wanted=findScreen(q.get("screen"));
 const current=wanted&&sliceIndex(wanted.slice)<=sliceIndex(valid)?wanted:null;
 return {slice:valid,screen:current?.id||data.screens.find(x=>x.slice===valid)?.id||"s0-connect"};
};
function latestScreens(slice){
 const list=data.screens.filter(x=>sliceIndex(x.slice)<=sliceIndex(slice));
 const bySurface=new Map();
 list.forEach(x=>bySurface.set(x.surface,x));
 return [...bySurface.values()].sort((a,b)=>sliceIndex(a.slice)-sliceIndex(b.slice));
}
function Application(){
 const [route,setRoute]=useState(fromLocation);
 const [help,setHelp]=useState(null);
 const [message,setMessage]=useState(null);
 const [simulation,setSimulation]=useState({agent:"agente-demo",mode:"Descubrimiento", budget:50,spent:41.2, rate:50, piiRole:"consulta", policies:[], toolsMcp:["consultar_ficha","actualizar_precio","eliminar_registro"], approvals:{APR42:"Pendiente",APR43:"Pendiente",APR41:"Vencida"}});
 const [focusId,setFocusId]=useState(null);
 const preview=new URLSearchParams(location.search).get("preview")==="1";
 const slice=route.slice;
 const active=findScreen(route.screen)||data.screens[0];
 const visible=useMemo(()=>latestScreens(slice),[slice]);
 const navigate=useCallback((screenId,newSlice=slice,replace=false)=>{
  if(!data.stages.some(s=>s.id===newSlice))return;
  let target=findScreen(screenId);
  if(!target||sliceIndex(target.slice)>sliceIndex(newSlice))target=latestScreens(newSlice)[0];
  const next={slice:newSlice,screen:target.id};
  const q=new URLSearchParams(location.search);
  q.set("slice",newSlice);q.set("screen",target.id);
  q.delete("preview");
  const url=location.pathname+"?"+q.toString();
  history[replace?"replaceState":"pushState"](null,"",url);
  setRoute(next);setHelp(null);setMessage(null);
  const main=document.querySelector("#console-content");if(main)main.scrollTo({top:0});
 },[slice]);
 useEffect(()=>{
  const listener=()=>setRoute(fromLocation());
  window.addEventListener("popstate",listener);
  return()=>window.removeEventListener("popstate",listener);
 },[]);
 const switchSlice=useCallback((id)=>{
  const latest=latestScreens(id);
  const same=latest.find(x=>x.surface===active.surface);
  navigate((same||latest[0]).id,id);
 },[navigate,active.surface]);
 const notify=(content,type="success")=>setMessage({id:String(Date.now()),content,type});
 const helpOn=(title,content)=>setHelp({title,content});
 const navItems=visible.map(x=>({type:"link",text:x.title,href:"?slice="+slice+"&screen="+x.id}));
 const selectedHref="?slice="+slice+"&screen="+active.id;
 const ctx={slice,screen:active,visible,simulation,setSimulation,notify,helpOn,navigate,preview};
 return <PrototypeContext.Provider value={ctx}>
  {!preview&&<div id="console-top">
   <TopNavigation
     identity={{href:"../index.html",title:"AI Governance · prototipo"}}
     utilities={[{type:"button",text:"Volver a slices",href:"../index.html"}]}
   />
  </div>}
  <AppLayout
   headerSelector="#console-top"
   navigationHide={preview}
   toolsHide
   navigationWidth={250}
   maxContentWidth={1220}
   activeHref={selectedHref}
   navigation={<SideNavigation header={{text:"Módulo A · pantallas",href:"../index.html"}} activeHref={selectedHref}
     items={navItems}
     onFollow={event=>{
       const url=new URL(event.detail.href,location.href);
       const q=new URLSearchParams(url.search);
       const screen=q.get("screen");
       if(screen){event.preventDefault();navigate(screen)}
     }} />}
   content={<div id="console-content">
      <SpaceBetween size="l">
       {!preview&&<div className="prototype-controls">
        <div><span className="prototype-tag">PROTOTIPO INTERACTIVO · DATOS SINTÉTICOS</span>
        <Box variant="small" color="text-body-secondary">No conectado a AWS. Las acciones se simulan localmente.</Box></div>
        <FormField label="Corte del producto">
         <Select selectedOption={{label:slice+" · "+data.stages[sliceIndex(slice)].name,value:slice}}
          options={data.stages.map(x=>({label:x.id+" · "+x.name,value:x.id}))}
          onChange={({detail})=>switchSlice(detail.selectedOption.value)} ariaLabel="Elegir slice"/>
        </FormField>
       </div>}
       <ContentLayout header={<Header variant="h1" description={active.title}
        info={<Button variant="link" onClick={()=>helpOn(active.title,"Esta pantalla corresponde a "+active.slice+". "+active.question+" Los datos y acciones son simulados y están delimitados por los requisitos "+active.requirements.join(", ")+".")}>¿Qué muestra?</Button>}
        actions={preview?null:<SpaceBetween direction="horizontal" size="xs"><Badge color="blue">{active.slice}</Badge><Button href={"../index.html#"+slice.toLowerCase()}>Ver roadmap</Button></SpaceBetween>}>
          {active.question}
       </Header>}>
         <SpaceBetween size="l">
          {message&&<Flashbar items={[{...message,dismissible:true,onDismiss:()=>setMessage(null)}]}/>}
          <RenderScreen id={active.id}/>
          {!preview&&<div className="prototype-footer">
            <Box color="text-body-secondary" fontSize="body-s">Requisitos: {active.requirements.join(" · ")}</Box>
            <Box color="text-body-secondary" fontSize="body-s">Propuesta de interfaz basada en insumo/requisitos.yaml y contexto/04-ux.md.</Box>
          </div>}
         </SpaceBetween>
       </ContentLayout>
      </SpaceBetween>
    </div>}
  />
  <Modal visible={!!help} header={help?.title||"Ayuda"} onDismiss={()=>setHelp(null)}
   footer={<Box float="right"><Button variant="primary" onClick={()=>setHelp(null)}>Entendido</Button></Box>}>
    <SpaceBetween size="s"><Box>{help?.content}</Box><Alert type="info">Prototipo informativo: esta explicación no implica que el control esté desplegado.</Alert></SpaceBetween>
  </Modal>
 </PrototypeContext.Provider>;
}
createRoot(document.getElementById("governance-root")).render(<Application/>);
