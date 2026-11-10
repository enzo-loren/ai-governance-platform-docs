// Catálogo estrictamente ilustrativo de la consola DEMO; no son identificadores de
// inferencia desplegados ni una afirmación de disponibilidad en Amazon Bedrock.
// En el producto real se obtiene de la configuración validada (PLT-01/INF-01).
const illustrativeModels=[
 {value:"demo-gpt-6-luna",label:"GPT-6 Luna (DEMO)"},
 {value:"demo-claude-5-5-haiku",label:"Claude 5.5 Haiku (DEMO)"}
];
const simulatedModel={value:"simulado",label:"Proveedor simulado (DEMO)"};

export const getModelCatalog=(simulatedEnabled=false)=>[
 ...illustrativeModels,
 ...(simulatedEnabled?[simulatedModel]:[])
];
export const allowedModelOptions=(catalog,allowedIds)=>catalog.filter(model=>allowedIds.includes(model.value));
export const initialAllowedModelIds=catalog=>catalog.map(model=>model.value);
