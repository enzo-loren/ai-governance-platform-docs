# Guía de conexión B: escenarios multicloud para integrar tools MCP

Fecha: 2026-11-10. Página: [assets/guia-conexion-b.html](../assets/guia-conexion-b.html). Acceso: [Guías de conexión](../assets/guias-conexion.html).

## Objetivo

Proveer una clasificación cualitativa de dificultad para integrar la conexión B en arquitecturas AWS, Azure, Google Cloud e híbridas. Los casos son patrones de referencia, no resultados medidos, estimaciones de esfuerzo en días ni pruebas de despliegue. Mantener visible la diferencia entre las capacidades de Amazon Bedrock AgentCore Gateway y las que el MVP D-03 contempla.

## Contrato arquitectónico de B

La conexión A observa inferencia e intenciones de herramientas. B exige que el agente use el Gateway MCP para que la plataforma pueda gobernar la ejecución real de cada tool.

- Entrada: POST {gateway}/mcp, Authorization: Bearer agent_token, opcional X-Gov-User-Token si existe C.
- Operaciones: tools/list y tools/call; nombres target___tool.
- Modo activo: una tool no aprobada o denegada no llega al target y responde como error MCP con isError=true. Aprobaciones dependen de SP-04 y SP-05.
- Cobertura B: tools declaradas y centralizadas / tools declaradas al modelo, por ventana.
- No existe garantía de exclusividad de uso de la puerta sin controles externos de IAM, credenciales y red (CTRL-25).
- Con A+B sin C, principal solo_workload: el Preset 2 puede bloquear escritura y destructivas que requieren usuario identificado.

## Fuentes canónicas

1. [insumo/requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), especialmente S4, MCP-01, CTRL-12–19 y CTRL-25.
2. [01-modelo-de-conexion.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/01-modelo-de-conexion.md), cobertura B, parcialidad y límites.
3. [02-contrato.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/02-contrato.md), MCP y nombres target___tool.
4. [03-politicas-y-estado-inicial.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md), Preset 2 y combinaciones A+B y A+B+C.
5. [05-decisiones-tecnicas.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/05-decisiones-tecnicas.md), D-03 con targets Lambda/OpenAPI en el MVP.
6. [06-spikes.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/06-spikes.md), SP-01, SP-04 y SP-05.

## Base técnica de la clasificación

| Escenario | Dificultad relativa | Justificación | Fuente primaria |
|---|---|---|---|
| MCP remoto AWS | Baja a nivel de servicio, pero fuera de D-03 | AgentCore soporta MCP server targets; MVP contempla inicialmente Lambda/OpenAPI | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-MCPservers.html |
| API Gateway REST / OpenAPI | Baja–media | OpenAPI está contemplado; API Gateway nativo tiene restricciones de cuenta/región/autorización | https://docs.aws.amazon.com/apigateway/latest/developerguide/mcp-server.html |
| Lambda existente | Baja–media | Requiere schema, formato del evento y permisos | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-add-target-lambda.html |
| Azure API Management | Media | APIM expone REST como MCP, pero en MVP la opción prevista es OpenAPI | https://learn.microsoft.com/en-us/azure/api-management/export-rest-mcp-server |
| Apigee/Cloud Run | Media | Apigee publica APIs como MCP; necesita conectividad, autenticación y compatibilidad de target | https://docs.cloud.google.com/apigee/docs/api-platform/apigee-mcp/apigee-mcp-overview |
| Tools locales Python | Media–alta | Extraer funciones a un servicio remoto y modificar invocación del agente | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-building.html |
| boto3 directo a DynamoDB/S3/RDS | Alta | Crear capa de ejecución y restringir permisos IAM originales para evitar bypass | CTRL-25 |
| Sistemas privados y pagos | Alta | Red privada, identidad downstream, idempotencia y aprobación efectiva | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-vpc-egress.html |

## Precauciones

- A no garantiza B: suprimir tool_calls gobierna intención, no impide una vía alternativa de ejecución.
- B no garantiza cierre del bypass: restringir permisos IAM y rutas alternativas es responsabilidad del cliente (CTRL-25).
- B no transporta identidad humana implícitamente; con A+B sin C se evalúa como solo_workload.
- AgentCore soporta versiones MCP con handshake y la versión sin sesión 2026-07-28; el contrato del proyecto documenta initialize. Debe validarse antes de afirmar compatibilidad.
- Aprobación humana ejecutable extremo a extremo requiere validar SP-04 y SP-05; no es suficiente con registrar una tool.
- Algunos escenarios técnicamente sencillos para AgentCore no están cubiertos todavía por D-03 del MVP.

## QA y seguimiento

- Ejecutar node tests/connection-b-guide-qa.mjs: navegación, ocho casos, filtros, fuentes, contrato y alcance.
- Ejecutar node tests/connection-guide-qa.mjs: regresión de conexión C.
- El workflow connection-guide-qa.yml ejecuta ambos tests.
- El sitio es estático y pages.yml copia todos los archivos de assets tras merge a main.
- Pendiente: SP-04, SP-05, revisión de tipos de target, bypass IAM/red y prueba E2E de MCP.

Nota metodológica: niveles de dificultad cualitativos, no una métrica empírica.
