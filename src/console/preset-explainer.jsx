import React from "react";
import Popover from "@cloudscape-design/components/popover";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";

// Ayuda orientada al operador: las condiciones que afectan la decisión
// son visibles bajo demanda, sin crear una segunda pantalla dentro del formulario.
export default function PresetHelp(){
 return <Popover
  triggerType="custom"
  position="right"
  size="medium"
  header="¿Qué controla este preset?"
  content={<SpaceBetween size="s">
   <div><strong>1 · Caja Negra Segura</strong><Box>Permite consultar y modificar mediante herramientas aprobadas. Avisa de las modificaciones y bloquea operaciones críticas.</Box></div>
   <div><strong>2 · Operación Supervisada</strong><Box>Para modificar, exige un usuario identificado con permiso. Las operaciones críticas requieren además aprobación humana y ejecución por MCP.</Box></div>
   <div><strong>3 · Blindaje Estricto</strong><Box>Bloquea las herramientas hasta que autorices expresamente cada operación. Las críticas también requieren aprobación.</Box></div>
   <Box color="text-body-secondary" fontSize="body-s">Las herramientas pendientes o sin clasificar no se permiten en modo activo. En descubrimiento, las reglas se evalúan sin detener al agente.</Box>
  </SpaceBetween>}
 >
  <button className="gov-preset-help" type="button" aria-label="¿Qué significa el preset de políticas?" title="¿Qué significa el preset de políticas?">?</button>
 </Popover>;
}
