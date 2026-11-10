// Proyección didáctica del contrato de presets (§2 de 03-politicas-y-estado-inicial).
// NO es un intérprete Cedar ni un cálculo basado en transacciones reales.
export const PRESET_DESCRIPTIONS=[
 {value:"1",name:"Caja Negra Segura",summary:"Lecturas y escrituras aprobadas pueden pasar; las destructivas no.",detail:"Las escrituras notifican. Una tool no aprobada o sin clasificar se deniega."},
 {value:"2",name:"Operación Supervisada",summary:"Las escrituras exigen identidad C y rol operador.",detail:"Una operación destructiva exige además B y aprobación humana, nunca se ejecuta solo por elegir este preset."},
 {value:"3",name:"Blindaje Estricto",summary:"Las tools se deniegan hasta definir permisos nominales.",detail:"Las excepciones deben ser explícitas por tool, rol y, para escrituras, condición sobre parámetros; las críticas conservan aprobación."}
];
export const CONNECTION_SCENARIOS=[
 {value:"A",label:"Solo A · inferencia",hasB:false,hasC:false},
 {value:"A+C",label:"A+C · identidad",hasB:false,hasC:true},
 {value:"A+B",label:"A+B · ejecución MCP",hasB:true,hasC:false},
 {value:"A+B+C",label:"A+B+C · identidad y MCP",hasB:true,hasC:true}
];
export const PRINCIPALS=[
 {value:"solo_workload",label:"Sin usuario · solo_workload"},
 {value:"consulta",label:"Usuario verificado · consulta"},
 {value:"operador",label:"Usuario verificado · operador"}
];
export const TOOL_EXAMPLES=[
 {id:"lectura",label:"Consultar ficha",kind:"lectura",approved:true},
 {id:"escritura",label:"Actualizar precio",kind:"escritura",approved:true},
 {id:"critica",label:"Operación crítica aprobada · ejemplo hipotético",kind:"destructiva_o_critica",approved:true},
 {id:"no_aprobada",label:"Eliminar registro · no aprobada",kind:"destructiva_o_critica",approved:false},
 {id:"sin_clase",label:"Procesar lote · sin clasificar",kind:"sin_clasificar",approved:false}
];
const allow=(reason,supervision="autonoma")=>({outcome:"Permitido",reason,supervision});
const deny=reason=>({outcome:"Denegado",reason});
const pending=reason=>({outcome:"Requiere aprobación",reason});
// Este evaluador replica casos ilustrativos de §2, sin conexiones ni usuarios reales.
export function evaluatePresetExample({preset,kind,approved,scenario="A",principal="solo_workload"}){
 const connections=CONNECTION_SCENARIOS.find(x=>x.value===scenario)||CONNECTION_SCENARIOS[0];
 const actor=connections.hasC?principal:"solo_workload";
 if(!approved)return deny("La tool no está aprobada");
 if(kind==="sin_clasificar")return deny("La tool aún no está clasificada");
 if(preset==="1"){
  if(kind==="lectura")return allow("Lectura aprobada");
  if(kind==="escritura")return allow("Escritura aprobada; se notifica","notificar");
  return deny("Operación destructiva prohibida en Preset 1");
 }
 if(preset==="2"){
  if(kind==="lectura")return allow("Lectura para solo_workload o rol de lectura");
  if(kind==="escritura"){
   if(!connections.hasC)return deny("Sin conexión C: requiere usuario identificado");
   if(actor!=="operador")return deny("El rol no autoriza escritura");
   return allow("Rol operador: permitida con notificación","notificar");
  }
  if(!connections.hasB)return deny("Sin conexión B: no puede tramitar aprobación");
  if(!connections.hasC)return deny("Sin conexión C: requiere usuario identificado");
  if(actor!=="operador")return deny("El rol no autoriza una operación crítica");
  return pending("Rol operador con B+C: necesita aprobación humana");
 }
 return deny("Preset 3: falta permiso nominal explícito para esta tool");
}
export function presetRows({preset,previousPreset,scenario,principal}){
 return TOOL_EXAMPLES.map(example=>({
  ...example,
  current:previousPreset?evaluatePresetExample({...example,preset:previousPreset,scenario,principal}):null,
  candidate:evaluatePresetExample({...example,preset,scenario,principal})
 }));
}
