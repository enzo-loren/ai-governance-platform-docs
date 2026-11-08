# Arquitectura AWS auditada y modelo de costos

**Fecha de revisión:** 2026-11-08. **Región de referencia:** us-east-1. **Estado:** propuesta técnica para revisión; no acredita despliegue ni ejecución de pruebas en esta revisión.

> **Alcance epistémico.** Se inspeccionaron el requisito de origen, las decisiones y experimentos, las construcciones CDK y el sitio publicado. «Implementado en IaC» significa que el recurso se define en código en la rama indicada; no significa que esté desplegado hoy ni que la suite pase. Los precios públicos se aplican a hipótesis transparentes, no a consumo medido. El estado «S0 desplegado» pertenece a la fotografía histórica del 2026-11-01.

## 1. Fuentes y precedencia

1. **Requisitos obligatorios:** [insumo/requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/insumo/requisitos.yaml), [insumo/index.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/insumo/index.md), [visión](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/insumo/vision.md). El directorio se llama **insumo/**, singular. Los archivos slices son derivados y no deberían modificarse independientemente del YAML.
2. **Decisiones y excepciones justificadas:** [05-decisiones-tecnicas](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/insumo/contexto/05-decisiones-tecnicas.md) y [06-spikes](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/insumo/contexto/06-spikes.md). El resultado de los spikes puede cambiar el diseño preliminar.
3. **Implementación de referencia (NO main):** rama [u13-s0-otlp](https://github.com/enzo-loren/agentic-ai-governance-platform/tree/u13-s0-otlp), en especial [puerta.ts](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/infra/lib/puerta.ts), [datos.ts](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/infra/lib/datos.ts), [consola.ts](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/infra/lib/consola.ts), [evidencia.ts](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/infra/lib/evidencia.ts), [monitoreo.ts](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/infra/lib/monitoreo.ts), [telemetria.ts](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/infra/lib/telemetria.ts).
4. **Resultados de experimentos:** [SP-01](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/docs/spikes/SP-01.md), [SP-01b](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/docs/spikes/SP-01b.md) y [SP-03](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/docs/spikes/SP-03.md). Es evidencia reportada por el proyecto, no replicación independiente.
5. **Estado histórico del producto:** [estado S0 U2](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/docs/estado-s0-fundacion.md). **La rama u13 no equivale necesariamente a implementación integral de S1–S6.**
6. **Publicación original:** [arquitectura.html](https://enzo-loren.github.io/ai-governance-platform-docs/assets/arquitectura.html) — sustituida en esta propuesta; su historial de Git conserva la versión anterior.

## 2. Invariantes de producto

La plataforma se instala **en una cuenta y una región de AWS del cliente**. El **Módulo A** es la plataforma y no importa ni despliega el **Módulo B**, agente de pruebas separable (NFR-02). Tres conexiones combinables tienen alcances distintos:

| Conexión | Canal | Qué se observa/controla | Límite que debe explicitarse |
|---|---|---|---|
| A, obligatoria | SDK OpenAI Chat Completions mediante BASE_URL y agent_token | Inferencia, respuestas, intenciones de tool_calls, consumo, reglas y controles sobre contenido | No se controla la ejecución de una tool que sucede por fuera de la puerta |
| B, opcional | MCP Gateway: targets Lambda / OpenAPI | Invocación real de tools, argumentos, identidad del target y aprobación | Solo las tools integradas por MCP están en este perímetro |
| C, opcional | X-Gov-User-Token validado como JWT | Identidad, permisos y reglas por usuario | Si falta, se conoce solo la identidad del workload/agente |

Los requisitos decisivos incluyen descubrir antes de bloquear; pasar de sombra a modo activo sin redesplegar; actualizar modo/modelos/límites en ≤10 s donde corresponda; Kill Switch ≤60 s; guardrail y evidencia durable con falla cerrada en modo activo; datos personales enmascarados; búsqueda <5 s; flujo visible <3 s; soporte de aprobaciones con separación de funciones y ejecución idempotente por la misma puerta; trazabilidad de política y configuración exactas; Object Lock **GOVERNANCE**, no COMPLIANCE.

## 3. Arquitectura lógica propuesta

\`\`\`mermaid
flowchart TB
    A["Agente externo | conexión A (obligatoria)"] -->|OpenAI Chat Completions HTTPS + gov_token| W["WAF de fachada"]
    A -->|"MCP | conexión B (opcional)"| W
    W --> R["API Gateway REST regional | puerta"]
    R --> F["Lambda fachada | normalización de headers, SigV4, respuesta"]
    F -->|"Solo este rol InvokeGateway"| G["AgentCore Gateway | AWS_IAM + resource policy"]
    G --> Q["Lambda interceptor REQUEST | identidad, estado, Cedar/limites, guardrail"]
    Q --> T["Inference target bedrock-mantle o simulado"]
    Q --> M["MCP targets Lambda / OpenAPI | AgentCore Identity"]
    T --> P["Lambda interceptor RESPONSE | salida, tools, PII, coste, decisión"]
    M --> P
    P --> F
    Q <-->|"versión, token, control"| D[("DynamoDB | agentes, credenciales, configuración, índice")]
    P -->|"registro durable antes de responder"| D
    D -->|"replicación asíncrona"| S["S3 Object Lock GOVERNANCE | evidencia/versiones"]
    D -->|"stream"| O["Lambdas OTLP / CloudWatch / X-Ray | rama U13"]
    D -->|"tarea fallida"| X["SQS DLQ + reintentos, barrido EventBridge"]
    UI["Consola React/Cloudscape | S3 privado + CloudFront"] --> API["REST API de consola + WAF + Cognito authorizer"]
    C["Usuarios OIDC | Cognito"] --> API
    API --> D
    API --> H["Aprobaciones | estados, separación de funciones, vencimiento"]
    H -->|"identidad interna y revalidación"| G
    B["Módulo B: agente de prueba | stack aparte"] -.-> A
\`\`\`

**Advertencia:** la gráfica muestra un **objetivo acumulativo**. En la rama inspeccionada hay recursos de S0 y telemetría U13; Cedar, MCP de negocio, políticas, aprobaciones y búsqueda forense son ámbitos de implementación pendiente o que deben verificarse contra código y pruebas antes de etiquetarlos como disponibles. El diagrama **no** afirma que todos estén desplegados.

### Plano de datos (inferencia y tools)

- La fachada **sí es una pieza funcional**, validada por SP-01b. Convierte credenciales de SDK en una solicitud SigV4 autorizada y completa cabeceras de respuesta; el Gateway no queda expuesto directamente. SP-01 había hallado que los headers de respuesta emitidos desde interceptor no siempre llegaban al cliente. Por ello no debe dibujarse solo REST → Gateway.
- El Gateway usa REQUEST y RESPONSE. El RESPONSE no ve el cuerpo original de REQUEST según SP-01; se reconstruye el enlace por REQUEST_ID del Gateway y el índice de evidencia. El REQUEST valida agent_token y X-Gov-User-Token, controla modelos, modo, cuotas y autorización cuando existan esas funciones.
- Para tool_calls emitidas por inferencia, la decisión sobre la **intención** puede eliminar tool_calls denegadas; no es equivalente a controlar una llamada a tool si esa ejecución ocurre fuera de B. No confundir «cobertura observada» con «todo gobernado».
- El camino desplegado en S0 usa **streaming de salida sintético con buffer**: recibe la respuesta completa, luego emite SSE. No proporciona latencia real de primer token; tiene el límite práctico de timeout de la fachada/REST de la versión ensayada (28–29 s), que exige validar respuestas largas.
- Solo el canal MCP conectado permite bloquear directamente la ejecución y enlazar credenciales de targets. El HITL debe almacenar argumentos cifrados, exponer PENDING_APPROVAL y garantizar una sola ejecución mediante transiciones condicionales/idempotencia; las operaciones deben volver a la puerta.

### Plano de control, datos y evidencia

- Consola estática: **S3 privado con CloudFront OAC**. Login de operadores/aprobadores/auditores: **Amazon Cognito**; API de consola: **API Gateway REST distinta de la fachada**, con su propio WAF, Lambda y lectura/escritura DynamoDB.
- Estado: en IaC hay **cuatro tablas DynamoDB on-demand** (agentes, credenciales, configuración y evidencia) con índices secundarios. Cuantificar RRUs/WRUs por consulta o actualización real, incluidos índices y los tamaños de registro; no suponer que un turno cuesta una única escritura.
- Durabilidad: se escribe un índice en DynamoDB sincrónicamente y se copia evidencia a S3 con Object Lock de forma asíncrona. «Índice durable antes de responder» **no es igual** a «copia WORM confirmada antes de responder»; el estado de copia y los reintentos deben poder auditarse. En código existen SQS para fallas y barrido EventBridge cada cinco minutos.
- Cifrado, resiliencia, auditoría y operaciones: KMS CMK para evidencia, IAM mínimo por Lambda, CloudWatch logs/métricas/alarmas, SNS según configuración. La rama U13 agrega Lambdas de exportación OTLP, DynamoDB Streams y SQS para trazas fallidas; no contarlas como gratuitas ni como parte necesariamente entregada en S0.
- Seguridad: activar y comprobar MFA de operadores cuando corresponda, minimizar logs y retener versiones de políticas. La retención de S3 GOVERNANCE puede ser sobrepasada por privilegios especiales autorizados; **no** equivale a WORM adversarial absoluto.

## 4. Diferencias encontradas frente a la arquitectura publicada

| Severidad | Publicación anterior / supuesto | Evidencia o corrección |
|---|---|---|
| Alta | Camino REST → Gateway, sin detallar Lambda intermedia | SP-01b y \`puerta.ts\`: existe fachada Lambda, IAM SigV4, policy de recurso y recuperación de encabezados |
| Alta | Una Lambda REQUEST y una RESPONSE por turno | Hay **tres** Lambdas en ruta mínima, incluida fachada; además API de consola, simulado y procesos asincrónicos según uso |
| Alta | 1 Web ACL + 4 reglas, IP Reputation/Common Rule Set | \`puerta.ts\`: 1 ACL de fachada con **1 regla de tasa**. \`consola.ts\`: **otra ACL** con **2 reglas de tasa**. No acreditar grupos administrados que CDK no define |
| Alta | «Costo total» por 10k/300k/3M turnos | No incluye tokens de Bedrock, APIs administrativas, polling de consola, log ingestion, SQS, reintentos, recolección OTLP, extracción, transferencias y casos de B+C |
| Media | DynamoDB $1,25/M escritura y $0,25/M lectura | AWS muestra para DynamoDB Standard on-demand US East **$0,625/M WRU** y **$0,125/M RRU**, sujeto a operación y tamaño |
| Media | Tres unidades de Guardrails por turno como constante universal | Una unidad cubre hasta 1.000 caracteres **por segmento/filtro facturable**; debe medirse y parametrizarse. S0 no usa ese guardrail |
| Media | Un registro es una escritura en índice | Registro abre, cierra, actualiza atributos y GSIs; operaciones, tamaños y reintentos deben medirse |
| Media | Costos de 3 endpoints VPC como suplemento general | El diseño básico no crea esas interfaces; PrivateLink tiene cobro por endpoint-AZ, GB procesados y topología. S3 y DynamoDB usan gateway endpoints gratuitos cuando aplica |
| Media | Diagrama da apariencia de plataforma íntegra S0–S6 | S0 histórico/ramas U3/U13 son avances parciales. Capacidad propuesta ≠ capacidad demostrada |
| Arquitectónica | AgentCore Gateway con WAF directo implica que puede eliminarse fachada | AWS habilitó WAF directo en 2026, pero no subsana por sí solo el experimento de encabezados ni la traducción SigV4; retirar fachada requiere nuevo spike |
| Arquitectónica | Suposición de respuesta inmediata en «stream» | Es SSE **buffered**, con tiempo máximo de solicitud; requisito de SLA, no solo detalle de presentación |

## 5. Servicios AWS: base, objetivo y condicionales

| Componente | Servicio | Estado/decisión |
|---|---|---|
| Borde inferencia y MCP | WAF regional, API Gateway REST, Lambda fachada | **Mantener** patrón validado SP-01b hasta sustituirlo experimentalmente |
| Punto de mediación | AgentCore Gateway e interceptores Lambda | **Mantener**; proteger invocación con IAM y resource policy |
| Modelo | Connector bedrock-mantle (ejemplos gpt-oss-20b / 120b) | Existente en IaC; uso del modelo se cobra aparte |
| Modelo de pruebas | Lambda simulada + AgentCore Identity / Secrets Manager | Opcional por configuración, **nunca** carga de producción real |
| Policy/control | Cedar embebido y ApplyGuardrail; detector RUT propio | Objetivo según requisitos, no marcar como entregado solo por diagrama |
| Datos | 4 tablas DynamoDB on-demand, GSIs | En IaC; presupuestos, estados, correlación e índice |
| Evidencia | S3 Object Lock GOVERNANCE, KMS, SQS errores, barrido Lambda/EventBridge | En IaC; validar recuperación y plazos |
| UI & auth | CloudFront+S3, Cognito, segundo REST Gateway+WAF | En IaC; el frontend no es una Lambda |
| Operaciones | CloudWatch Logs/metrics/alarms, SNS | En IaC; volumen dependiente de tráficos y muestreo |
| Telemetría extendida | OTLP Lambda, Streams, X-Ray, SQS | **Rama U13**, costo condicional separado |
| HITL | DynamoDB + Lambda/API + scheduler o barrido existente + misma puerta | **Diseño objetivo**; aprobación con versión de reglas, TTL, idempotencia, separación de funciones |
| VPC, endpoints, NAT, PrivateLink | Solo con necesidad de targets privados / aislamiento | **Condicional**; no crear 3 interface endpoints por defecto |
| Motor de búsqueda dedicado | OpenSearch (no base) | **No recomendado de entrada**: medir primero queries y GSIs; reevaluar si EVD-02 (<5 s) no cumple |

## 6. Método de costo mensual: USD, us-east-1

**Unidad de análisis:** 1 solicitud a la puerta = **una invocación de inferencia o MCP**; no equivale necesariamente a una conversación, a un intercambio de agente ni a una llamada al modelo. El escenario por defecto del simulador visual cuenta **un único chat completion por turno**, sin tools MCP ni polling de consola adicional. No descontamos créditos, promociones ni free tiers; el precio de modelos es la tarifa de referencia de SP-03 de 2026-10-29, que requiere comprobación contra la región/cuenta vigente.

| Componente | Precio de referencia y aplicación | Fuente |
|---|---|---|
| WAF | **$5/ACL/mes + $1/regla/mes + $0,60/M solicitudes**, para reglas personalizadas estándar. En IaC: 2 ACL y 3 reglas = **$13/mes** base | [AWS WAF pricing](https://aws.amazon.com/waf/pricing/) + \`puerta.ts\` y \`consola.ts\` |
| API Gateway REST regional | **$3,50/M solicitudes** primera banda + transferencia de salida, ilustrativa **$0,09/GB**. El polling consulta la API **distinta** | [API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/) |
| AgentCore Gateway | **$0,005/1.000 invocaciones de API** (ejemplos ListTools/InvokeTool/Ping); indexación y búsqueda adicionales. **Cobro preciso del path de inferencia debe confirmarse en billing** | [AgentCore pricing](https://aws.amazon.com/bedrock/agentcore/pricing/) |
| Lambda | **$0,20/M invocaciones + $0,0000166667/GB-s**. Por inferencia hipotética: fachada 256 MiB × 3 s, REQUEST y RESPONSE cada una 256 MiB × 0,15 s; 3 invocaciones | [Lambda pricing](https://aws.amazon.com/lambda/pricing/) |
| DynamoDB Standard on-demand | **$0,625/M WRU + $0,125/M RRU**. Hipótesis por turno: **4 WRU y 2 RRU** (incluye GSIs, no sustituyen medición). 25GB libres de almacenamiento sólo si se cumplen condiciones | [DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/) |
| S3 evidencia | Estimación **$0,005 por 1.000 PUT + $0,023/GB-mes** Standard, sin suponer transición a otra clase; Object Lock requiere versionado | [S3 pricing](https://aws.amazon.com/s3/pricing/) |
| Guardrail de texto (contenido) | **$0,15/1.000 unidades de texto** por el filtro. No sumar denied topics, PII managed o otros filtros si no están habilitados. Escenario con 0 o 3 unidades por turno | [Bedrock Guardrails](https://aws.amazon.com/bedrock/pricing/) |
| Modelo | SP-03, precio de referencia regional para \`openai.gpt-oss-20b\`: **$0,07/M tokens entrada** y **$0,30/M salida**; \`120b\`: **$0,15/M y $0,60/M**. Debe reconfirmarse con Price List o Billing | [SP-03](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/u13-s0-otlp/modulo-a/docs/spikes/SP-03.md), [Bedrock](https://aws.amazon.com/bedrock/pricing/) |
| AWS KMS | **$1/clave/mes** más solicitudes según uso y exenciones; estimador configurable, no asumir 2 llamadas por turno como hecho | [KMS pricing](https://aws.amazon.com/kms/pricing/) |
| Secrets Manager | **$0,40/secret/mes**, lectura y rotaciones según uso; 1 secreto simulado como referencia | [Secrets Manager](https://aws.amazon.com/secrets-manager/pricing/) |
| CloudWatch / OTLP | Logs por GB, alarmas/métricas, spans según destino y retención. El modelo incluye solo ingestión ilustrativa; **no** cubre toda observabilidad | [CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/) |
| Cognito | Diferente para usuarios directos, federación y M2M; no presupuestar gratis sin tipo de login y MAU | [Cognito pricing](https://aws.amazon.com/cognito/pricing/) |
| SQS | Solicitudes, tamaños y reintentos de colas, en especial error y OTLP; no modelar una cola por turno si solo lleva excepciones | [SQS pricing](https://aws.amazon.com/sqs/pricing/) |

### Fórmula reproducible (escenario ilustrativo)

Variables: \`N\` completions/mes, \`I\` tokens de entrada y \`O\` de salida por completion, \`U\` unidades de Guardrails por completion; \`L_f\`, \`L_r\`, \`L_s\` GB-s de Lambda facade, request y response; \`W\` WRU y \`R\` RRU de Dynamo por completion; \`B\` bytes de respuesta, \`E\` bytes de evidencia por completion.

\`Total parcial = (2*5 + 3*1 + N*0.60/1e6) [WAF] + (N*3.50/1e6 + N*B/2^30*0.09) [API] + (N*5/1e6) [Gateway estimativo] + (3*N*0.20/1e6 + N*(L_f+L_r+L_s)*0.0000166667) [Lambda] + (N*W*0.625/1e6 + N*R*0.125/1e6) [DDB] + (N*5/1e6 + N*E/2^30*0.023) [S3 1 mes] + (N*U*0.15/1000) [filtro Guardrails] + (N*I*0.07/1e6 + N*O*0.30/1e6) [20b] + (1 + 0.40) [KMS+1 secreto].\`

**No es TCO:** esta suma parcial excluye lectura/criptografía real de KMS, CloudWatch, almacenamiento adicional de índices, otros filtros, Cognito MAU, reintentos, consola, OTLP, SQS, target MCP, cross-AZ e impuestos. El simulador HTML muestra separadamente un CloudWatch ilustrativo. La «factura correcta» requiere métricas de operación, configuración y AWS Cost Explorer/Cost and Usage Report del cliente.

### Validación económica imprescindible

1. Ejecutar una carga trazada de 1.000 completions con y sin guardrail, registrar: Lambda invocations y GB-s **por función**; Bedrock input/output tokens por modelo; AgentCore metered operations; Dynamo consumed WRU/RRU **por tabla y GSI**; WAF/APIGW request counts en ambas APIs; S3 PUT/bytes/retención; KMS y logs.
2. Fijar el estado de despliegue: S0, S1+ o U13 OTLP, indicando mocks habilitados, vistas activas, número de usuarios/lecturas y cantidad de tools MCP. Sin ese estado, comparar 10k y 3M «turnos» no es válido.
3. Revisar la [AWS Pricing Calculator](https://calculator.aws/) y [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/) de la región y cuenta específica; bloquear una versión de tarifas con fecha y archivar un CSV de supuestos y resultados.
4. Evaluar por separado los modos **A**, **A+B**, **A+C** y **A+B+C**; una llamada MCP extra implica otra mediación y posible target Lambda; no se debe subsumir en un solo «turno».
5. Definir presupuesto operativo con márgenes y alertas independientes de los presupuestos que el producto controla para los agentes.

## 7. Decisiones pendientes y pruebas de aceptación

| Prueba / decisión | Criterio propuesto | Motivo |
|---|---|---|
| ADR-01, conservar fachada | No retirar sin demostrar mismas cabeceras, control de API keys, IAM, latencia y streaming | El WAF directo de Gateway ya existe, pero es insuficiente para este contrato |
| ADR-02, límites streaming | Carga con respuestas largas, payload máximo, 28 s y SSE válido con stream=True | Buffer evita streaming real y añade espera; posible 504 |
| ADR-03, consistencia del índice | Inyectar fallos Dynamo/S3/SQS, medir demora WORM y «sin evidencia» | No equiparar índice y Object Lock |
| ADR-04, correlación | Solicitudes simultáneas A/B y trace_id, sin mezclar tenants, roles ni eventos | RESPONSE no recibe request original |
| ADR-05, política | Matriz ≥30 escenarios, 0 modelos reales, defaults denegación en activo, shadow no bloquea salvo controles obligatorios | Cumplimiento S1/S2 y diferenciación de fases |
| ADR-06, HITL | Autor distinto, aprobación expiración, reintento duplicado no ejecuta dos veces | Seguridad en acciones irreversibles |
| ADR-07, búsqueda | Combinaciones de filtro ≤5 s a escala real, sin scans globales | S6 requiere GSIs o un índice de búsqueda posterior, según mediciones |
| ADR-08, privacidad | RUT dígito verificador, pii masking en respuesta y evidencia, logs sin secretos | S0 histórico solo enmascara evidencia |
| ADR-09, observabilidad | Backpressure OTLP, DLQ y volumen de logs con factura mensual | U13 no equivale a costo cero |
| ADR-10, red privada | Solo cuando MCP / datasources exijan red privada, diseño con SG, endpoints y costo detallado | Evita endpoints y NAT no necesarios |

## 8. Nota sobre la documentación pública

Esta revisión no cambia las decisiones de producto de \`insumo/requisitos.yaml\`, no modifica el motor, no edita slices derivados y no fusiona ramas funcionales. Propone reemplazar el **diagrama público** por una lectura precisa, distinguiendo **implementado en IaC**, **objetivo** y **experimental**, y un simulador con hipótesis editables. El histórico de la arquitectura anterior permanece accesible mediante Git.

**Fuentes AWS:** [WAF](https://aws.amazon.com/waf/pricing/), [AgentCore](https://aws.amazon.com/bedrock/agentcore/pricing/), [DynamoDB](https://aws.amazon.com/dynamodb/pricing/), [Bedrock](https://aws.amazon.com/bedrock/pricing/), [API Gateway](https://aws.amazon.com/api-gateway/pricing/), [Lambda](https://aws.amazon.com/lambda/pricing/), [S3](https://aws.amazon.com/s3/pricing/), [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [KMS](https://aws.amazon.com/kms/pricing/), [Cognito](https://aws.amazon.com/cognito/pricing/), [WAF y AgentCore, anuncio 2026-06-29](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-waf-amazon-bedrock-agentcore/).
