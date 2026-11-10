import React,{useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";

// Ayuda de un solo campo, con panel fuera del árbol de apilamiento de la consola.
// El portal evita que KPI y cabecera fija aparezcan sobre el contenido en móvil.
export default function PresetHelp(){
 const [open,setOpen]=useState(false);
 const [position,setPosition]=useState({top:16,left:16,width:310});
 const trigger=useRef(null),panel=useRef(null),closeButton=useRef(null);
 const close=()=>{setOpen(false);trigger.current?.focus();};
 const toggle=()=>{
  if(open){close();return}
  const rect=trigger.current.getBoundingClientRect();
  const width=Math.min(310,window.innerWidth-32);
  const left=Math.max(16,Math.min(window.innerWidth-width-16,rect.left+rect.width/2-width/2));
  const estimate=Math.min(365,window.innerHeight-32);
  let top=rect.top>=estimate+24?rect.top-estimate-8:rect.bottom+8;
  top=Math.max(16,Math.min(window.innerHeight-estimate-16,top));
  setPosition({top,left,width});
  setOpen(true);
 };
 useEffect(()=>{
  if(!open)return;
  closeButton.current?.focus();
  const key=e=>{if(e.key==="Escape"){e.preventDefault();close()}};
  const outside=e=>{if(!trigger.current?.contains(e.target)&&!panel.current?.contains(e.target))setOpen(false)};
  document.addEventListener("keydown",key);
  document.addEventListener("mousedown",outside);
  const resized=()=>setOpen(false);
  window.addEventListener("resize",resized);
  return()=>{
   document.removeEventListener("keydown",key);
   document.removeEventListener("mousedown",outside);
   window.removeEventListener("resize",resized);

  };
 },[open]);
 return <>
  <button ref={trigger} className="gov-preset-help" type="button"
   aria-label="¿Qué significa el preset de políticas?" aria-expanded={open}
   aria-controls={open?"gov-preset-help-popover":undefined} title="¿Qué significa el preset de políticas?"
   onClick={toggle}>?</button>
  {open&&createPortal(
   <div id="gov-preset-help-popover" ref={panel} role="dialog" aria-modal="false"
    aria-label="¿Qué controla este preset?" className="gov-preset-help-popover"
    style={{top:position.top,left:position.left,width:position.width}}>
    <div className="gov-preset-help-heading">
     <strong>¿Qué controla este preset?</strong>
     <button ref={closeButton} type="button" className="gov-preset-help-close"
      onClick={close} aria-label="Cerrar ayuda">×</button>
    </div>
    <div className="gov-preset-help-panel">
     <SpaceBetween size="s">
      <div><strong>1 · Caja Negra Segura</strong><Box>Permite consultar y modificar mediante herramientas aprobadas. Avisa de las modificaciones y bloquea operaciones críticas.</Box></div>
      <div><strong>2 · Operación Supervisada</strong><Box>Para modificar, exige un usuario identificado con permiso. Las operaciones críticas requieren además aprobación humana y ejecución por MCP.</Box></div>
      <div><strong>3 · Blindaje Estricto</strong><Box>Bloquea las herramientas hasta que autorices expresamente cada operación. Las críticas también requieren aprobación.</Box></div>
      <Box color="text-body-secondary" fontSize="body-s">Las herramientas pendientes o sin clasificar no se permiten en modo activo. En descubrimiento, las reglas se evalúan sin detener al agente.</Box>
     </SpaceBetween>
    </div>
   </div>,document.body
  )}
 </>;
}
