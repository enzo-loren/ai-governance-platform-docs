# Trazabilidad del mapa AWS explorable

Este documento acompaña el código del diagrama, pero **no aparece en la página**: las explicaciones al lector se integran en el SVG (etiquetas y fichas al seleccionar nodos). El diagrama no representa la implementación real de ninguna rama.

## Fuente vinculante

1. [insumo/index.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/index.md): prioridad de fuentes.
2. [insumo/requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml): fuente de verdad.
3. [01-modelo-de-conexion.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/01-modelo-de-conexion.md): A, B, C y cobertura.
4. [02-contrato.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/02-contrato.md): canales, headers, SSE, aprobaciones, evidencia.
5. [03-politicas-y-estado-inicial.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md): modos, Presets, clasificación, tipos Cedar.
6. [05-decisiones-tecnicas.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/05-decisiones-tecnicas.md): servicios y límites.
7. [06-spikes.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/06-spikes.md): cuestiones abiertas y alternativas.
8. [fuera-de-alcance.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/fuera-de-alcance.md): no añadir topologías o controles inexistentes.

## Regla de interpretación

- **A** siempre: inferencia por AgentCore Gateway, intérpretes REQUEST/RESPONSE, Bedrock/targets, reglas Cedar de la plataforma, guardrail y PII, índice de evidencia.
- **B** activable: MCP para las tools efectivamente registradas, AgentCore Identity, control de ejecución, HITL y aprobación. Las tools locales continúan fuera de la puerta incluso con B activa.
- **C** activable: JWT validado por solicitud, emisor OIDC configurable, rol y límites de usuario. Cognito administra la **consola**; para C también puede usarse un OIDC externo.
- **Alternativa SP-01**: la fachada API Gateway + Lambda, y el WAF sujeto a la validación del spike, aparecen solo tras activar el control «SP-01: alternativa»; no deben confundirse con la ruta deseada D-03.
- **SP-05**: ejecución de operación aprobada por el mismo Gateway es una decisión objetivo sujeta a validación, con plan B documentado.
- **Módulo B**: agente sintético de prueba desplegado por separado y opcional en el mapa. No es un componente interno del Módulo A.
- **Proveedor simulado**: target opcional activado solo por configuración.
- **Servicios de referencia**: CDK, Lambda, AgentCore Gateway/Identity, Bedrock, API Gateway, Cognito, DynamoDB y S3 Object Lock GOVERNANCE. Las credenciales de tools pueden estar en AgentCore Identity o Secrets Manager (PLT-02). La telemetría NFR-05 usa OTLP y `gen_ai`, con destino configurable (por ejemplo CloudWatch o AgentCore Observability), y no bloquea solicitudes. El diagrama expresa responsabilidades lógicas, no recursos individuales ni costos de una región real.

## Iconos y disponibilidad

Los iconos se referencian **sin modificar** desde [AWS Icons for PlantUML, tag v23.1](https://github.com/awslabs/aws-icons-for-plantuml/tree/v23.1/dist), generados a partir del paquete oficial de AWS Architecture Icons. Sus URLs exactas se enumeran en \`assets/arquitectura-explorable.js\`. Los nombres de los 12 PNG se comprobaron contra el árbol del repositorio upstream; la página no los empaqueta localmente. El detalle textual sigue siendo visible aunque la red bloquee las imágenes. El conjunto de iconos está sujeto a las condiciones de AWS publicadas por su repositorio.

## Control de calidad

**Revisado programáticamente:**

- JavaScript sintácticamente válido, con 37 nodos, 8 zonas y 43 relaciones etiquetadas (incluye alternativas y prueba opcional).
- No hay nodos superpuestos según sus rectángulos de coordenadas.
- Toda relación referencia identificadores de nodos existentes.
- Prueba de montaje de DOM simulado: A=41, A+B=67, A+B+C=89, A+C=56, zoom=140 %.
- Verificación de presencia de los 10 nombres de archivo PNG de iconos en el release v23.1.

**Pendiente:** prueba visual end-to-end en navegador (desktop y móvil), inspección real de imágenes remotas, revisión de contraste y teclado con herramientas de accesibilidad. No se ha desplegado AWS. La página pública de GitHub Pages solo se actualizará después del merge.
