/* Arquitectura objetivo: insumo/requisitos.yaml, contexto/01, 02, 03, 05 y 06.
 * Iconos: awslabs/aws-icons-for-plantuml v23.1, basados en AWS Architecture Icons.
 * No confundir con IaC implementada: los spikes se muestran como variantes.
 */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('map'), frame=document.getElementById('frame');
const $=id=>document.getElementById(id);
const iconBase='https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/v23.1/dist/';
const icons={
 core:'ArtificialIntelligence/BedrockAgentCore.png',
 bedrock:'ArtificialIntelligence/Bedrock.png',
 lambda:'Compute/Lambda.png',
 dynamo:'Database/DynamoDB.png',
 s3:'Storage/SimpleStorageServiceS3ObjectLock.png',
 gateway:'NetworkingContentDelivery/APIGateway.png',
 cognito:'SecurityIdentityCompliance/Cognito.png',
 waf:'SecurityIdentityCompliance/WAF.png',
 cdk:'DeveloperTools/CloudDevelopmentKit.png',
 cloudformation:'ManagementGovernance/CloudFormation.png',
 cloudwatch:'ManagementGovernance/CloudWatch.png',
 secrets:'SecurityIdentityCompliance/SecretsManager.png'
};
const nodes=[
{id:'user',x:68,y:177,w:325,h:104,title:'Usuario final',lines:['Aplicación del cliente','Origen fuera del perímetro'],tag:'out',details:['El usuario se comunica con la aplicación del cliente.','La puerta no autentica el salto usuario → agente (CTRL-26).','El aviso de IA y reclamos de la interfaz quedan fuera (CTRL-27).']},
{id:'app',x:68,y:317,w:325,h:105,title:'Aplicación del cliente',lines:['Login e interfaz propios','Identidad de sesión (si aplica)'],tag:'out',details:['La aplicación maneja el acceso de su usuario.','Puede proporcionar al agente un JWT de emisor OIDC configurado.','No se administra desde el Módulo A la UI del usuario final.']},
{id:'agent',x:68,y:504,w:325,h:147,title:'Agente existente',lines:['SDK OpenAI / Strands / otros','BASE_URL + agent_token','tool_calls / cliente MCP'],tag:'a',details:['A: /inference/v1/chat/completions (OpenAI Chat Completions).','B: /mcp con el mismo agent_token, solo en tools integradas.','C: X-Gov-User-Token opcional en ambos canales.','X-Gov-Trace-Id opcional; sin SDK propietario.']},
{id:'outside',x:68,y:727,w:325,h:115,title:'Tool local / externa',lines:['Sin MCP integrado','Ejecución no controlada'],tag:'out',details:['Una tool ajena al MCP puede ejecutarse fuera de la puerta.','Su resultado solo puede verse si el agente lo devuelve al modelo.','La plataforma observa intenciones, no controla esa ejecución.','Con B parcial este riesgo sigue existiendo (CTRL-25).']},
{id:'test',x:68,y:1030,w:325,h:128,title:'Módulo B · prueba',lines:['Strands Agents · Python','Agente sintético independiente','E-01…E-16 / tools ficticias'],tag:'test',details:['Paquete y stack totalmente separados del Módulo A.','Conecta A, B y C para ejercitar las mismas rutas públicas.','Tools ficticias Lambda, OpenAPI y local.','Proveedor simulado y escenarios deterministas.']},
{id:'entry',x:532,y:328,w:430,h:180,title:'Amazon Bedrock AgentCore',lines:['Gateway único · 2 canales','A: inference targets','B: targets MCP'],icon:'core',tag:'a',details:['Puerta Única del diseño objetivo (D-03).','REQUEST y RESPONSE interceptan inferencia y MCP.','A: base_url /inference/v1; B: /mcp.','Autenticación del agent_token delegada a REQUEST (SP-01).']},
{id:'facade',x:527,y:650,w:428,h:112,title:'API Gateway + Lambda',lines:['Fachada alternativa · SP-01','Solo si falla autorización delegada'],icon:'gateway',tag:'alt',details:['Plan B definido por SP-01 en insumo/.','Una fachada valida agent_token, obtiene JWT M2M y llama al Gateway.','No debe presentarse como ruta obligatoria del diseño conceptual.','WAF es parte de la validación/perímetro, no requisito de una topología fija.']},
{id:'request',x:1065,y:286,w:286,h:127,title:'Interceptor REQUEST',lines:['AWS Lambda · entrada','agent_token / JWT / límites','Cedar + guardrail inicial'],icon:'lambda',tag:'a',details:['Valida agent_token (hash SHA-256 y caché hasta 30 s).','Opcional C: JWT, JWKS, iss, exp, aud/client_id.','Cedar: modelos, tools, reglas y presupuestos.','Bedrock ApplyGuardrail sobre último turno del usuario.','Activo: falla cerrada; descubrimiento: sombra según control.']},
{id:'response',x:1065,y:534,w:286,h:126,title:'Interceptor RESPONSE',lines:['AWS Lambda · salida','tool_calls / PII / costo','Reemisión SSE buffered'],icon:'lambda',tag:'a',details:['Filtra intenciones tool_calls no autorizadas.','ApplyGuardrail sobre respuesta del modelo.','Enmascara RUT, correo y teléfono en texto saliente.','Registra tokens, costo y latencia.','stream: true: buffer y SSE válido al final (D-02).']},
{id:'cedar',x:1405,y:253,w:234,h:110,title:'Motor Cedar',lines:['Dentro de Lambda','Presets 1 / 2 / 3','Intención y ejecución'],icon:'lambda',tag:'control',details:['La misma semántica Cedar en inferencia y en MCP.','Preset 1 caja negra; 2 supervisado; 3 estricto.','Clases lectura / escritura / destructiva / sin clasificar.','Denegación por defecto en activo; sombra en descubrimiento.','No es AgentCore Policy en el MVP (D-04).']},
{id:'guardrail',x:1405,y:386,w:234,h:109,title:'Bedrock Guardrails',lines:['ApplyGuardrail','Turno usuario + salida','Sin tocar system prompt'],icon:'bedrock',tag:'control',details:['ApplyGuardrail invocado desde los interceptores.','Solo último turno de usuario y texto de salida.','Controles contra ataques y contenido no permitido.','Configuración de fuerza; SP-07 valida falsos positivos.']},
{id:'pii',x:1405,y:535,w:234,h:113,title:'Protección de PII',lines:['Detector en Lambda','RUT / correo / teléfono','Enmascara solo salidas'],icon:'lambda',tag:'control',details:['Expresiones regulares y dígito verificador del RUT.','Enmascaramiento en texto del modelo, resultados MCP y evidencia.','No cambia argumentos de tool_call ni entrada al modelo.','Con C y pii_access puede permitir exposición por rol.']},
{id:'budget',x:1405,y:685,w:234,h:110,title:'Límites y estado',lines:['DynamoDB · contadores','Tasa / tokens / costo','Modo + Kill Switch'],icon:'dynamo',tag:'control',details:['Modo inicial descubrimiento, paso a activo, suspensión y retiro.','Límites por agente; con C también por usuario.','Kill Switch: rechazo en ≤ 60 s.','Acciones solo_alerta, throttle (429), bloqueo (403).','Tarifas por modelo versionadas.']},
{id:'infer',x:1738,y:277,w:267,h:124,title:'Inference targets',lines:['AgentCore Gateway','Modelo por id / proveedor','OpenAI Chat Completions'],icon:'core',tag:'a',details:['Un solo Gateway con targets de inferencia (D-03).','Enrutamiento por campo model al target configurado.','Provider target simulado opcional.','Solo contrato Chat Completions en MVP, no Responses/Converse.']},
{id:'model',x:2107,y:246,w:270,h:130,title:'Amazon Bedrock',lines:['Modelos permitidos','Tool calling + usage','Modelos según SP-03'],icon:'bedrock',tag:'a',details:['Modelos AWS bajo una cuenta y región del cliente.','Se deben validar dos modelos con tool calling (SP-03).','El catálogo asigna tarifas por tokens y vigencia.','La respuesta retorna por el interceptor RESPONSE.']},
{id:'mcp',x:1738,y:516,w:267,h:126,title:'MCP targets',lines:['AgentCore Gateway','tools/list + tools/call','Solo tools aprobadas'],icon:'core',tag:'b',details:['B registra targets MCP de tipo Lambda u OpenAPI.','tools/list filtra según estado, Preset y principal.','tools/call controla autorización, parámetros y respuesta.','Nombres normalizados target___tool.','Solo tools integradas cuentan en la cobertura B.']},
{id:'targetLambda',x:2107,y:496,w:270,h:119,title:'Target AWS Lambda',lines:['Ejecución gobernada','Tool Lambda registrada','Resultado enmascarado'],icon:'lambda',tag:'b',details:['Target MCP de tipo Lambda.','El interceptor aplica las reglas sobre ejecución real.','No confundir con una tool local del agente.','Tool de lectura/escritura/destructiva según catálogo.']},
{id:'targetOpen',x:2423,y:496,w:258,h:119,title:'Target OpenAPI',lines:['Servicio HTTP registrado','API key en bóveda','Sin secretos en agente'],icon:'core',tag:'b',details:['Target MCP OpenAPI del Gateway.','La API key es administrada por AgentCore Identity.','Reglas Cedar por parámetros del esquema JSON.','El agente jamás recibe la clave del target.']},
{id:'identity',x:2107,y:665,w:270,h:113,title:'Credenciales MCP',lines:['AgentCore Identity','o AWS Secrets Manager','API key de targets MCP'],icon:'core',extraIcon:'secrets',tag:'b',details:['Credenciales en AgentCore Identity o AWS Secrets Manager (PLT-02).','La key se inyecta en la llamada al target; el agente no la ve.','D-08 prevé la key del proveedor simulado en AgentCore Identity.','Nunca incluir secretos en la respuesta, evidencia ni telemetría.']},
{id:'oidc',x:2423,y:665,w:258,h:113,title:'Emisor OIDC configurable',lines:['C · JWT de usuario','JWKS / iss / exp / aud','Cognito o emisor externo'],tag:'c',details:['El origen de usuarios es configurable (D-14).','El agente reenvía X-Gov-User-Token.','Se validan firma, emisor, vigencia y cliente.','Token inválido: rechazar o degradar a solo_workload según modo.','Cognito es un ejemplo de emisor, no requisito para cada cliente.']},
{id:'approval',x:1740,y:930,w:290,h:131,title:'Supervisión humana',lines:['Pendiente / aprobar / rechazar','Vence · 15 min por defecto','gov_aprobacion_estado'],icon:'lambda',tag:'b',details:['tools/call crítico permitido devuelve PENDING_APPROVAL.','La ejecución queda retenida, no se ejecuta antes de aprobar.','El agente consulta gov_aprobacion_estado.','El resultado usa el mismo protocolo MCP y PII por rol si hay C.']},
{id:'approver',x:2120,y:930,w:292,h:131,title:'Bandeja de aprobación',lines:['Operador / aprobador','Rechazo y caducidad','Origen ≠ aprobador con C'],icon:'cognito',tag:'b',details:['Decisiones humanas desde consola administrativa.','Sin C: originador de la solicitud = agente.','Con B+C: separación de funciones por usuario.','Ejecución de la acción autorizada por la puerta (D-13 / SP-05).']},
{id:'approvalRun',x:2460,y:930,w:226,h:131,title:'Ejecución aprobada',lines:['Identidad interna','Gateway · sujeto a SP-05','Sin segunda ejecución'],icon:'lambda',tag:'b',details:['D-13 pide reinvocar por la Puerta Única.','Interceptors reconocen identidad interna asociada a aprobacion_id.','SP-05 valida la posibilidad; plan B: llamar al target directo con evidencia.','Operación idempotente según control y estado de aprobación.']},
{id:'console',x:520,y:942,w:257,h:128,title:'Consola web',lines:['React + Cloudscape','Agentes / reglas / tools','Flujo / auditoría / consumo'],tag:'admin',details:['Interfaz en español, con estados y causas legibles.','Modo descubrimiento y paso a activo con impacto previo.','Tarjeta A/B/C con índice, límites y cobertura parcial.','Aprobaciones, flujos, ruta forense, búsqueda e historial.']},
{id:'api',x:834,y:942,w:255,h:128,title:'Amazon API Gateway',lines:['API administrativa REST','HTTPS + JWT del user pool','Separada del Gateway IA'],icon:'gateway',tag:'admin',details:['Entrada dedicada a la consola, no es el canal del agente.','API Gateway REST, autorizador Cognito.','Flujo en vivo por polling del índice (D-11).','Acciones administrativas auditadas.']},
{id:'apiLambda',x:1149,y:942,w:255,h:128,title:'API de consola',lines:['AWS Lambda · Python','Agentes / policies / APR','Sin redeploy'],icon:'lambda',tag:'admin',details:['API administrativa en Lambda.','Altas, rotación de token gov_, reglas y targets.','Manejo de aprobaciones y eventos administrativos.','Consulta del índice durable para búsqueda y flujo en vivo.']},
{id:'cognitoAdmin',x:1435,y:942,w:244,h:128,title:'Amazon Cognito',lines:['User pool consola','Grupos / roles / acceso','No autentica al agente'],icon:'cognito',tag:'admin',details:['Autenticación administrativa del user pool propio.','Mapeo de grupos a roles y pii_access.','No confundir con el JWT de usuario final reenviado por C.','La emisión de usuario del cliente puede ser OIDC externo.']},
{id:'live',x:520,y:1143,w:345,h:114,title:'Flujo y ruta forense',lines:['Sondeo del índice · ~1 s','trace_id + tool_call_id','Motivo y versión de regla'],tag:'admin',details:['Transacción compuesta de inferencia e invocaciones MCP.','Correlación explícita o inferida por agente/tool/hash de argumentos.','Objetivos: flujo < 3 s y búsqueda < 5 s.','Búsqueda por usuario, agente, tool, decisión.']},
{id:'config',x:926,y:1143,w:336,h:114,title:'Catálogo y políticas',lines:['Presets 1/2/3, Cedar','Clasificación y aprobación','Activo / sombra / suspensión'],tag:'control',details:['Catálogo de modelos y tools descubiertas.','tool schema + anotaciones/MCP + método HTTP + nombre.','Cambio del esquema requiere actualizar acción Cedar tipada.','Reglas, límites, precios y estado editables en caliente.']},
{id:'index',x:1375,y:1143,w:304,h:114,title:'Registro de eventos',lines:['Cada solicitud y cambio','Decisión + motivo + versión','Sin evidencia ≠ permitido'],icon:'dynamo',tag:'evidence',details:['Índice durable previo a la respuesta (D-07).','Incluye agente, principal, modo, modelo, tool, decisión y costo.','Argumentos y contenido enmascarados; no_disponible explícito.','Falla de escritura: aplicar NFR-01, no fingir éxito.']},
{id:'db',x:590,y:1431,w:340,h:140,title:'Amazon DynamoDB',lines:['Estado, tokens hash SHA-256','Agentes · reglas · aprobaciones','Índice y contadores durables'],icon:'dynamo',tag:'evidence',details:['Fuente durable de índices para consola y auditoría.','Token de agente almacenado como hash SHA-256.','Reglas y configuraciones versionadas.','Aprobaciones, contadores de límites, trazas.','Escritura síncrona de índice antes de responder.']},
{id:'s3',x:1040,y:1431,w:340,h:140,title:'Amazon S3 · Object Lock',lines:['GOVERNANCE · retención','Copia de evidencia asíncrona','Borrado sin bypass denegado'],icon:'s3',tag:'evidence',details:['Duplicación asíncrona desde el índice (D-07).','Object Lock en modo GOVERNANCE, no COMPLIANCE.','Retención en días configurables; 1 día en desarrollo.','Enmascaramiento de PII en contenido de evidencia.','SP-08 valida retención y limpieza tras el plazo.']},
{id:'cdk',x:1530,y:1431,w:337,h:140,title:'AWS CDK v2',lines:['TypeScript · IaC validada','Un stack del Módulo A','Cuenta / región configurable'],icon:'cdk',tag:'admin',details:['Despliegue parametrizable para una cuenta y región.','us-east-1 por defecto; prefijo stage configurable.','Pruebas cfn-guard, Checkov, gitleaks y scripts de retiro.','Módulo B en paquete/stack separado.']},
{id:'cfn',x:1970,y:1431,w:330,h:140,title:'AWS CloudFormation',lines:['Recursos desde CDK','Despliegue + retiro','Sin topología multi-cuenta'],icon:'cloudformation',tag:'admin',details:['CDK sintetiza IaC para desplegar recursos AWS.','Despliegue autocontenido en una cuenta y región.','No agregar VPC, OpenSearch, ECS ni multi-cuenta sin requisito.','Retiro conserva evidencia durante su retención.']},
{id:'waf',x:532,y:532,w:430,h:104,title:'AWS WAF · SP-01',lines:['Protección de entrada','Vinculación por validar','No garantizado en diseño'],icon:'waf',tag:'alt',details:['Pregunta específica del spike SP-01 sobre tasa y perímetro.','No implica una única topología final.','Se presenta como hipótesis/alternativa, no como servicio obligatorio.']},
{id:'otel',x:2370,y:1431,w:308,h:140,title:'OTLP · observabilidad',lines:['OpenTelemetry / gen_ai','Trazas · métricas · logs','Backend configurable'],icon:'cloudwatch',tag:'evidence',details:['NFR-05 MUST: OTLP con semántica gen_ai para llamadas a modelo y tools.','Correlación con X-Gov-Trace-Id, sin agent_token, secretos ni PII clara.','Telemetría a partir de la evidencia ya enmascarada.','Destino dentro de la cuenta: CloudWatch, AgentCore Observability u OTLP compatible.','Falla/lentitud del colector no debe bloquear ni alterar el resultado.']}
];
const zones=[
{x:25,y:116,w:405,h:1555,name:'FUERA DE AWS · CLIENTE',sub:'La plataforma controla solo lo que cruza la puerta',style:'zone'},
{x:452,y:116,w:2322,h:1555,name:'AWS · MÓDULO A · CUENTA Y REGIÓN ÚNICAS',sub:'Arquitectura conceptual objetivo desde insumo/ · no topología implementada',style:'aws-zone'},
{x:475,y:174,w:523,h:645,name:'PERÍMETRO DE ENTRADA',sub:'A obligatoria · B y C independientes',style:'zone'},
{x:1020,y:174,w:642,h:645,name:'GOBERNANZA EN INTERCEPTORES',sub:'Controles como software de plataforma; no servicios separados',style:'zone'},
{x:1690,y:174,w:1060,h:645,name:'DESTINOS DE INFERENCIA Y MCP',sub:'Inference targets · MCP targets · credenciales',style:'zone'},
{x:1690,y:841,w:1060,h:450,name:'APROBACIÓN HUMANA (requiere B)',sub:'Retener → decidir → ejecutar → consultar estado',style:'zone',tag:'b'},
{x:475,y:841,w:1210,h:450,name:'CONSOLA Y ADMINISTRACIÓN',sub:'Canal administrativo separado de la inferencia',style:'zone'},
{x:475,y:1320,w:2275,h:303,name:'ESTADO · EVIDENCIA · DESPLIEGUE',sub:'Persistencia y plataforma de una cuenta/región',style:'zone'}
];
const links=[
{from:'user',to:'app',type:'out',label:'sesión',p:'M230 281 V317',tx:241,ty:299},
{from:'app',to:'agent',type:'out',label:'usuario → agente',p:'M230 422 V504',tx:246,ty:452},
{from:'agent',to:'outside',type:'out',label:'tool local',p:'M150 651 V727',tx:166,ty:686},
{from:'agent',to:'entry',type:'a',label:'A · inferencia',p:'M393 558 H461 V385 H532',tx:416,ty:345},
{from:'agent',to:'entry',type:'b',label:'B · /mcp',p:'M393 617 H458 V474 H532',tx:442,ty:484},
{from:'app',to:'agent',type:'c',label:'C · JWT',p:'M345 422 V504',tx:268,ty:484},
{from:'agent',to:'request',type:'c',label:'X-Gov-User-Token',p:'M393 536 H490 V269 H1130 V286',tx:745,ty:253},
{from:'entry',to:'request',type:'a',label:'REQUEST',p:'M962 397 H1014 V352 H1065',tx:973,ty:340},
{from:'entry',to:'request',type:'b',label:'tools/call',p:'M962 474 H1036 V409 H1065',tx:990,ty:457},
{from:'request',to:'cedar',type:'control',label:'reglas',p:'M1351 320 H1405',tx:1360,ty:303},
{from:'request',to:'guardrail',type:'control',label:'entrada',p:'M1351 363 H1382 V443 H1405',tx:1355,ty:432},
{from:'response',to:'pii',type:'control',label:'salida',p:'M1351 587 H1405',tx:1361,ty:574},
{from:'request',to:'budget',type:'control',label:'cuotas',p:'M1351 391 H1378 V741 H1405',tx:1363,ty:710},
{from:'request',to:'infer',type:'a',label:'modelo',p:'M1351 350 H1372 V368 H1738',tx:1655,ty:359},
{from:'infer',to:'model',type:'a',label:'modelo permitido',p:'M2005 330 H2054 V299 H2107',tx:2040,ty:278},
{from:'infer',to:'response',type:'a',label:'respuesta / usage',p:'M1738 395 H1690 V810 H1193 V660',tx:1470,ty:797},
{from:'response',to:'entry',type:'a',label:'respuesta gobernada',p:'M1065 608 H1008 V485 H962',tx:946,ty:597},
{from:'request',to:'mcp',type:'b',label:'MCP · ejecución',p:'M1351 395 H1370 V666 H1698 V580 H1738',tx:1436,ty:673},
{from:'mcp',to:'targetLambda',type:'b',label:'Lambda',p:'M2005 558 H2107',tx:2043,ty:544},
{from:'mcp',to:'targetOpen',type:'b',label:'OpenAPI',p:'M2005 601 H2045 V638 H2400 V568 H2423',tx:2200,ty:629},
{from:'identity',to:'targetOpen',type:'b',label:'API key',p:'M2250 665 V637 H2544 V615',tx:2280,ty:627},
{from:'mcp',to:'approval',type:'b',label:'PENDING_APPROVAL',p:'M1738 620 H1710 V998 H1740',tx:1703,ty:896},
{from:'approval',to:'approver',type:'b',label:'decisión',p:'M2030 990 H2120',tx:2042,ty:975},
{from:'approver',to:'approvalRun',type:'b',label:'aprobada',p:'M2412 993 H2460',tx:2398,ty:970},
{from:'approvalRun',to:'entry',type:'b',label:'identidad interna · D-13',p:'M2575 930 V816 H990 V496 H962',tx:2265,ty:805},
{from:'oidc',to:'request',type:'c',label:'JWKS + claims',p:'M2423 727 H2390 V835 H1390 V374 H1351',tx:2185,ty:806},
{from:'console',to:'api',type:'admin',label:'REST',p:'M777 997 H834',tx:786,ty:977},
{from:'api',to:'apiLambda',type:'admin',label:'JWT',p:'M1089 997 H1149',tx:1105,ty:977},
{from:'apiLambda',to:'cognitoAdmin',type:'admin',label:'auth',p:'M1404 996 H1435',tx:1393,ty:978},
{from:'apiLambda',to:'index',type:'evidence',label:'consultas',p:'M1276 1070 V1122 H1527 V1143',tx:1305,ty:1113},
{from:'index',to:'db',type:'storage',label:'durable, síncrono',p:'M1450 1257 V1362 H745 V1431',tx:1030,ty:1348},
{from:'db',to:'s3',type:'storage',label:'copia asíncrona → Object Lock',p:'M930 1514 H1040',tx:948,ty:1496},
{from:'cdk',to:'cfn',type:'admin',label:'sintetiza / despliega',p:'M1867 1504 H1970',tx:1869,ty:1485},
{from:'response',to:'index',type:'evidence',label:'evidencia antes de responder',p:'M1220 660 V805 H1417 V1110 H1550 V1143',tx:1410,ty:1100},
{from:'request',to:'index',type:'evidence',label:'decisiones + trazas',p:'M1065 360 H1040 V815 H1417 V1110 H1550 V1143',tx:1080,ty:785},
{from:'config',to:'db',type:'storage',label:'versiones',p:'M1040 1257 V1396 H800 V1431',tx:1060,ty:1385},
{from:'approval',to:'db',type:'b',label:'estado APR',p:'M1840 1061 V1310 H962 V1495 H930',tx:1530,ty:1300},
{from:'test',to:'agent',type:'test',label:'prueba por API pública',p:'M232 1030 V870 H404 V604 H393',tx:79,ty:881},
{from:'index',to:'otel',type:'evidence',label:'OTLP · no bloqueante',p:'M1679 1200 H2525 V1431',tx:2135,ty:1186},
{from:'facade',to:'entry',type:'alt',label:'JWT M2M · plan B SP-01',p:'M740 650 V508',tx:752,ty:593},
{from:'agent',to:'waf',type:'alt',label:'entrada alternativa',p:'M393 619 H485 V580 H532',tx:420,ty:605},
{from:'waf',to:'facade',type:'alt',label:'si procede',p:'M743 636 V650',tx:752,ty:643}
];
const detailsKey={a:['A · inferencia','Modelo / prompts / tool_calls','Políticas sobre intención','Costo, límites y evidencia'],b:['B · herramientas MCP','tools/list / tools/call','Ejecución + aprobaciones','Cobertura parcial por tool'],c:['C · identidad','JWT verificado por solicitud','Rol / PII / límites personales','No autentica usuario → agente']};
let state={b:false,c:false,alt:false,test:false,focus:'all',selected:null};
let view={x:0,y:0,w:2800,h:1850};
let drag=null;
function elem(name,attrs,parent,text){
 const e=document.createElementNS(NS,name);
 if(attrs)Object.keys(attrs).forEach(k=>e.setAttribute(k,String(attrs[k])));
 if(text!==undefined)e.textContent=text;
 (parent||svg).appendChild(e);return e;
}
function lineText(g,x,y,arr,cls,dy){
 arr.forEach((t,i)=>elem('text',{x,y:y+i*(dy||21),class:cls},g,t));
}
function makeDefs(){
 const d=elem('defs');
 [['a','#276fca'],['b','#008d77'],['c','#7c56bd'],['neutral','#8b9aab'],['storage','#9b6d2b'],['alt','#b8752e']].forEach(([name,color])=>{
  const m=elem('marker',{id:'arrow-'+name,markerWidth:14,markerHeight:14,refX:13,refY:7,markerUnits:'userSpaceOnUse',orient:'auto',viewBox:'0 0 14 14'},d);
  elem('path',{d:'M0,1 L13,7 L0,13 Z',fill:color},m);
 });
}
function fitSvgText(el,maxWidth,minSize){
 if(typeof el.getComputedTextLength!=='function')return;
 let measured=el.getComputedTextLength();
 if(!Number.isFinite(measured)||measured<=maxWidth)return;
 const base=parseFloat(getComputedStyle(el).fontSize)||14;
 el.style.fontSize=Math.max(minSize,Math.floor(base*maxWidth/measured*10)/10)+'px';
 measured=el.getComputedTextLength();
 if(measured>maxWidth){el.setAttribute('textLength',maxWidth);el.setAttribute('lengthAdjust','spacingAndGlyphs');}
}
// Solo los rótulos esenciales son persistentes. El resto conserva tooltip SVG;
// al destacar una capa, se revelan los rótulos que caben sin colisiones.
function layoutLinkLabels(){
 const essential=new Set([
  'user:app:out','app:agent:out','agent:outside:out','agent:entry:a',
  'agent:entry:b','app:agent:c','agent:request:c','entry:request:a',
  'request:infer:a','request:mcp:b','oidc:request:c','mcp:targetLambda:b'
 ]);
 const intersects=(a,b,p=7)=>a.x<b.x+b.width+p&&a.x+a.width+p>b.x&&a.y<b.y+b.height+p&&a.y+a.height+p>b.y;
 const protectedBoxes=[];
 svg.querySelectorAll('#nodes .node').forEach(g=>{
  if(g.style.display!=='none'){const box=g.querySelector('.node-card');if(box)protectedBoxes.push(box.getBBox());}
 });
 svg.querySelectorAll('#zones g').forEach(g=>{
  if(g.style.display!=='none')g.querySelectorAll('.zone-title,.zone-sub').forEach(t=>protectedBoxes.push(t.getBBox()));
 });
 const accepted=[];
 svg.querySelectorAll('#edges g[data-layer]').forEach(g=>{
  const label=g.querySelector('.edge-label');
  if(!label)return;
  const type=g.getAttribute('data-layer');
  const key=g.getAttribute('data-from')+':'+g.getAttribute('data-to')+':'+type;
  const focusMatch=state.focus!=='all'&&(
    type===state.focus ||
    (state.focus==='control'&&type==='control') ||
    (state.focus==='admin'&&type==='admin') ||
    (state.focus==='evidence'&&['storage','evidence'].includes(type))
  );
  const allowed=g.style.display!=='none'&&(essential.has(key)||focusMatch)
    &&!(state.c&&key==='app:agent:out');
  label.style.display=allowed?'':'none';
  if(!allowed) return;
  const rect=label.getBBox();
  if(protectedBoxes.some(b=>intersects(rect,b))||accepted.some(b=>intersects(rect,b))){
    label.style.display='none';
  }else accepted.push(rect);
 });
}
function addZone(z,root){
 let g=elem('g',{'data-tag':z.tag||'all'},root);
 elem('rect',{x:z.x,y:z.y,width:z.w,height:z.h,rx:20,class:z.style},g);
 const title=elem('text',{x:z.x+26,y:z.y+26,class:'zone-title'},g,z.name);
 const subtitle=elem('text',{x:z.x+26,y:z.y+48,class:'zone-sub'},g,z.sub);
 fitSvgText(title,z.w-52,16);
 fitSvgText(subtitle,z.w-52,12);
 return g;
}
function addLink(l,root){
 const g=elem('g',{'data-layer':l.type,'data-from':l.from,'data-to':l.to},root);
 const type=l.type==='control'||l.type==='admin'||l.type==='evidence'||l.type==='test'?'neutral':l.type;
 const marker=(type==='out'?'neutral':type);
 elem('path',{d:l.p,class:'edge '+(l.type==='control'||l.type==='admin'||l.type==='evidence'||l.type==='test'?'':l.type), 'marker-end':'url(#arrow-'+marker+')'},g);
 if(l.label){
   elem('title',null,g,l.label+' · '+l.from+' → '+l.to);
   elem('text',{x:l.tx,y:l.ty,class:'edge-label '+(l.type==='a'||l.type==='b'||l.type==='c'||l.type==='alt'?l.type:''),'data-link-label':'true'},g,l.label);
 }
 return g;
}
function addNode(n,root){
 const g=elem('g',{class:'node'+(n.tag==='out'?' missing-node':''),'data-tag':n.tag,'data-id':n.id,tabindex:0,role:'button','aria-label':n.title+'; seleccionar para ver detalles'},root);
 elem('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:14,class:'node-card'},g);
 let tagColor={a:'#276fca',b:'#008d77',c:'#7c56bd',out:'#8b9aab',alt:'#b8752e',test:'#597e9c',evidence:'#ab7634',admin:'#587b9e',control:'#445e7f'}[n.tag]||'#5b86a9';
 elem('rect',{x:n.x,y:n.y,width:7,height:n.h,rx:3,fill:tagColor},g);
 const inset=n.extraIcon?100:(n.icon?72:22);
 if(n.icon) {
   elem('rect',{x:n.x+14,y:n.y+18,width:47,height:47,rx:9,fill:'#eef4f9'},g);
   elem('image',{href:iconBase+icons[n.icon],x:n.x+18,y:n.y+22,width:39,height:39,'aria-hidden':'true'},g);
   if(n.extraIcon)elem('image',{href:iconBase+icons[n.extraIcon],x:n.x+56,y:n.y+22,width:39,height:39,'aria-hidden':'true'},g);
 }
 let tx=n.x+inset;
 const heading=elem('text',{x:tx,y:n.y+31,class:'node-title'},g,n.title);
 fitSvgText(heading,n.w-inset-14,14);
 n.lines.forEach((line,i)=>{
   const txt=elem('text',{x:tx,y:n.y+56+i*21,class:'node-line','data-line-index':i},g,line);
   fitSvgText(txt,n.w-inset-14,11.5);
 });
 g.addEventListener('click',e=>{e.stopPropagation();showDetail(n)});
 g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showDetail(n)}});
 const title=elem('title',null,g,n.title+'. '+n.lines.join('; '));
 return g;
}
function addCanvas(){
 while(svg.firstChild)svg.removeChild(svg.firstChild);
 elem('title',{id:'map-title'},svg,'Arquitectura conceptual AWS · AI Governance Platform');
 elem('desc',{id:'map-desc'},svg,'Una sola arquitectura con inferencia A, tools MCP B, identidad C, gobierno en interceptores, evidencia durable, aprobación humana y consola.');
 makeDefs();
 const background=elem('g',{id:'zones'},svg);
 zones.forEach(z=>addZone(z,background));
 const edgeRoot=elem('g',{id:'edges'},svg);
 links.forEach(l=>addLink(l,edgeRoot));
 const nodeRoot=elem('g',{id:'nodes'},svg);
 nodes.forEach(n=>addNode(n,nodeRoot));
 elem('rect',{x:490,y:1641,width:2260,height:128,rx:13,class:'note-rect'},svg);
 lineText(svg,515,1672,[
  'CANAL A   ·   Chat Completions / tool_calls   ·   autodescubrimiento, reglas, guardrail, tokens, costos y evidencia',
  'CANAL B   ·   MCP / tools/list / tools/call   ·   ejecución, credenciales, parámetros y aprobación humana',
  'CANAL C   ·   JWT del usuario   ·   reglas por rol, pii_access, cuotas individuales y ruta forense por persona',
  'LÍMITES    ·   herramientas fuera de MCP, red/IAM del agente, entrada usuario→agente y UI final: fuera del perímetro'
 ],'note-text',26);
 elem('text',{x:60,y:1782,class:'board-footer'},svg,'FUENTES: insumo/requisitos.yaml · contexto/01 modelo de conexión · 02 contrato · 03 políticas · 05 decisiones · 06 spikes');
 elem('text',{x:60,y:1809,class:'board-footer'},svg,'ICONOS: AWS Architecture Icons · AWS Labs v23.1 · No equivalen a recursos obligatorios uno a uno.');
 elem('text',{x:60,y:1836,class:'board-footer'},svg,'Índice de catálogo: modo activo + agente con tools/usuarios + conexiones completas y evidencia; no mide seguridad absoluta.');
 refresh();
}
function visible(tag){
 if(tag==='b')return state.b;
 if(tag==='c')return state.c;
 if(tag==='alt')return state.alt;
 if(tag==='test')return state.test;
 return true;
}
function relevant(tag){
 if(state.focus==='all')return true;
 if(tag==='all'||tag==='out')return true;
 if(tag===state.focus)return true;
 if(state.focus==='a')return ['a','control'].includes(tag);
 if(state.focus==='b')return ['a','b','control'].includes(tag);
 if(state.focus==='c')return ['a','c','control'].includes(tag);
 if(state.focus==='evidence')return ['a','b','c','evidence'].includes(tag);
 if(state.focus==='admin')return ['admin','evidence','b'].includes(tag);
 if(state.focus==='control')return ['control','a','b','c'].includes(tag);
 return false;
}
function refresh(){
 const cedar=nodes.find(n=>n.id==='cedar');
 // El mismo motor Cedar existe desde A, pero la ejecución real requiere B.
 cedar.lines[2]=state.b?'Intención y ejecución':'Solo intención (con A)';
 const subtitle=svg.querySelector('#nodes .node[data-id="cedar"] [data-line-index="2"]');
 if(subtitle)subtitle.textContent=cedar.lines[2];
 svg.querySelectorAll('[data-tag]').forEach(g=>{
  const t=g.getAttribute('data-tag');g.style.display=visible(t)?'':'none';
  g.classList.toggle('group-focus-dim',!relevant(t));
 });
 svg.querySelectorAll('[data-layer]').forEach(g=>{
  const t=g.getAttribute('data-layer');
  const direct=state.alt&&g.getAttribute('data-from')==='agent'&&g.getAttribute('data-to')==='entry';
  g.style.display=visible(t)&&!direct?'':'none';
  g.classList.toggle('group-focus-dim',!relevant(t));
 });
 const key='a'+(state.b?'b':'')+(state.c?'c':'');
 const name={a:'Inferencia gobernada',ab:'Inferencia + ejecución MCP',ac:'Inferencia + identidad',abc:'Inferencia + MCP + identidad'}[key];
 $('view-code').textContent={a:'A',ab:'A+B',ac:'A+C',abc:'A+B+C'}[key];
 $('view-name').textContent=name;
 $('view-score').textContent={a:'41 %',ab:'67 %',ac:'56 %',abc:'89 %'}[key]+' · catálogo*';
 [['b-toggle','b'],['c-toggle','c'],['alt-toggle','alt'],['test-toggle','test']].forEach(([id,k])=>{
  const b=$(id); b.setAttribute('aria-pressed',String(state[k]));
  if(k==='b'||k==='c')b.querySelector('b').textContent=state[k]?'✓':'+';
 });
 $('focus-select').value=state.focus;
 layoutLinkLabels();
 if(state.selected){
  const n=nodes.find(x=>x.id===state.selected);
  if(!n||!visible(n.tag))hideDetail();
 }
}
function showInspectorHtml(n){
 const panel=$('node-inspector');
 if(!panel)return;
 $('inspector-title').textContent=n.title;
 $('inspector-sub').textContent=n.lines.join(' · ');
 const list=$('inspector-points');
 list.replaceChildren();
 n.details.forEach(detail=>{
  const item=document.createElement('li');
  item.textContent=detail;
  list.appendChild(item);
 });
 panel.hidden=false;
}
function showDetail(n){
 if(state.selected===n.id){hideDetail();return;}
 state.selected=n.id;svg.querySelectorAll('.node').forEach(g=>g.classList.toggle('selected',g.getAttribute('data-id')===n.id));
 showInspectorHtml(n);
}
function hideDetail(){
 state.selected=null;
 const panel=$('node-inspector');if(panel)panel.hidden=true;
 svg.querySelectorAll('.node.selected').forEach(n=>n.classList.remove('selected'));
}
function setView(){
 svg.setAttribute('viewBox',[view.x,view.y,view.w,view.h].map(n=>n.toFixed(1)).join(' '));
 $('zoom-label').textContent=Math.round(2800/view.w*100)+' %';
}
function zoom(factor,screenX,screenY){
 const rect=svg.getBoundingClientRect();
 const px=screenX===undefined?.5:(screenX-rect.left)/rect.width;
 const py=screenY===undefined?.5:(screenY-rect.top)/rect.height;
 const narrow=frame.clientWidth<760;
 const aspect=Math.max(.4,frame.clientWidth/Math.max(1,frame.clientHeight));
 const maxWidth=narrow?Math.min(2800,1850*aspect):2800;
 const w=Math.max(Math.min(450,maxWidth),Math.min(maxWidth,view.w/factor));
 const h=narrow?w/aspect:w*1850/2800;
 const anchorX=view.x+view.w*px,anchorY=view.y+view.h*py;
 view.x=anchorX-w*px;view.y=anchorY-h*py;view.w=w;view.h=h;
 clamp();setView();
}
function clamp(){
 view.x=Math.max(0,Math.min(2800-view.w,view.x));
 view.y=Math.max(0,Math.min(1850-view.h,view.y));
}
function resetView(){
 if(frame.clientWidth<760){
  const aspect=Math.max(.4,frame.clientWidth/Math.max(1,frame.clientHeight));
  const w=Math.min(800,1850*aspect);
  view={x:0,y:116,w,h:w/aspect};
 }else{
  view={x:0,y:0,w:2800,h:1850};
 }
 clamp();setView();
}
function setupEvents(){
 $('b-toggle').addEventListener('click',()=>{state.b=!state.b;saveHash();refresh()});
 $('c-toggle').addEventListener('click',()=>{state.c=!state.c;saveHash();refresh()});
 $('alt-toggle').addEventListener('click',()=>{state.alt=!state.alt;refresh()});
 $('test-toggle').addEventListener('click',()=>{state.test=!state.test;refresh()});
 $('focus-select').addEventListener('change',e=>{state.focus=e.target.value;refresh()});
 $('zoom-in').addEventListener('click',()=>zoom(1.4));
 $('zoom-out').addEventListener('click',()=>zoom(1/1.4));
 $('zoom-reset').addEventListener('click',resetView);
 svg.addEventListener('click',e=>{if(e.target===svg||e.target.closest('#zones')||e.target.closest('#edges'))hideDetail()});
 frame.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)},{passive:false});
 frame.addEventListener('pointerdown',e=>{
  if(e.target.closest('.node')||e.target.closest('#node-inspector'))return;
  drag={x:e.clientX,y:e.clientY,oldX:view.x,oldY:view.y};
  frame.classList.add('dragging');frame.setPointerCapture(e.pointerId);
 });
 frame.addEventListener('pointermove',e=>{
  if(!drag)return;
  const b=svg.getBoundingClientRect();
  view.x=drag.oldX-(e.clientX-drag.x)*view.w/b.width;
  view.y=drag.oldY-(e.clientY-drag.y)*view.h/b.height;
  clamp();setView();
 });
 function end(){drag=null;frame.classList.remove('dragging')}
 frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
 frame.addEventListener('keydown',e=>{
  if(e.target!==frame)return;
  const step=view.w*.08;
  if(e.key==='+'){zoom(1.25);e.preventDefault()}if(e.key==='-'){zoom(.8);e.preventDefault()}
  if(e.key==='ArrowLeft'){view.x-=step;e.preventDefault()}
  if(e.key==='ArrowRight'){view.x+=step;e.preventDefault()}
  if(e.key==='ArrowUp'){view.y-=step*.65;e.preventDefault()}
  if(e.key==='ArrowDown'){view.y+=step*.65;e.preventDefault()}
  clamp();setView();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hideDetail()});
 $('inspector-close').addEventListener('click',hideDetail);
 window.addEventListener('resize',resetView);
 window.addEventListener('hashchange',readHash);
}
function saveHash(){
 const k='a'+(state.b?'b':'')+(state.c?'c':'');history.replaceState(null,'','#'+k);
}
function readHash(){
 const s=location.hash.slice(1).toLowerCase();
 if(!['a','ab','ac','abc'].includes(s))return;
 state.b=s.includes('b');state.c=s.includes('c');refresh();
}
addCanvas();setupEvents();readHash();resetView();
})();