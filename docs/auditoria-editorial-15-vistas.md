# Auditoría editorial integral de las 15 versiones · S0–S6

**Corte revisado:** 9 de noviembre de 2026 · **Objeto:** prototipo Cloudscape, 15 versiones agrupadas en 12 superficies. **Directiva:** Scientific Writing Editor, con separación REQUIRED / OPTIONAL / PROCESS_ONLY. La revisión no verifica el backend ni la aceptación de requisitos AWS.

## Regla de diseño

En la vista predeterminada debe entenderse, sin leer una especificación, **qué estado existe, qué pasa y qué puede hacer la persona**. Una propiedad técnica puede permanecer cuando constituye la operación misma (por ejemplo, configurar un endpoint, elegir un parámetro Cedar, consultar un trace ID). Las justificaciones editoriales y el catálogo normativo no pertenecen al plano principal.

Los mensajes de denegación, aprobación pendiente, identidad inválida, herramienta fuera de MCP, ausencia de telemetría, gasto simulado y estado de integridad siguen siendo **REQUIRED** y permanecen visibles. La insignia DEMO no se puede ocultar. Los detalles de umbrales, IDs de requisito, códigos HTTP, cálculo teórico, formatos de protocolo y mecanismos AWS son **OPTIONAL** salvo cuando resultan necesarios para completar una acción.

## Auditoría de las 15 versiones

| Versión | Situación / resultado visible | Justificaciones y detalles reservados | Decisión |
|---|---|---|---|
| S0 · Alta | Registrar agente, clave individual, revocar/rotar | Contrato de hash, HTTP 401 y plazo de revocación | Compactar avisos; conservar riesgo al revocar |
| S0 · Flujo | Solicitud, usuario, decisión, canal, pausa y detalle | Contrato del trace, límites de indexación y evolución de slices | Evitar KPI redundante de demostración |
| S1 · Gobernanza | Efectos sobre solicitudes y herramientas, conexiones, siguiente acceso | 27 controles, porcentaje teórico, reglas de cálculo y justificación editorial | Retirar catálogo y techo del plano principal |
| S1 · Tools | Herramienta, clasificación, versión, revisión y estado | Diferencia conceptual clasificación/aprobación/MCP | Mantener nota de consecuencia breve |
| S1 · Sombra | Lo ocurrido y lo que se habría detenido | Semántica de Cedar y guardrail | Conservar: ya usa estados claros |
| S2 · Activación | Activar, suspender, retirar, posibles bloqueos y herramientas pendientes | SLA, códigos HTTP, contratos de preset, identificación de agente interna | Expresar efectos operativos sin jerga gratuita |
| S2 · Consumo | Gasto, presupuesto, solicitudes/minuto, medida y acciones al exceder | Números HTTP, Retry-After, umbrales técnicos | Mostrar consecuencias, no protocolo |
| S3 · Identidad | Usuario efectivo, tratamiento de datos, rechazo/degradación | JWT/OIDC, operación interna A/C | Conservar señales necesarias de identidad |
| S3 · Consumo por persona | Consumo por usuario, cuota y herencia sin identidad | Denominadores, cabeceras y códigos de respuesta | Mantener independencia de presupuestos visible |
| S4 · MCP | Herramientas dentro/fuera de la puerta, destinos, autorizaciones | Bóveda, diferencias de infraestructura, target auth | Resumir destinos sin ocultar la exposición |
| S4 · Reglas | Agente, rol, tool, condición, efecto e historial | Tipos de esquema, parser, matriz de pruebas | Simplificar nomenclatura, conservar editor voluntario |
| S4 · Guía | Configuración copiable y acción siguiente por conexión | Techo de catálogo y justificación del potencial | Mostrar la ganancia en ejecuciones/identidad |
| S5 · Aprobaciones | Quién puede autorizar, petición, monto, plazo, decisión | TTL, idempotencia, contrato de protocolo | Mensajes cortos, comprobaciones reales documentadas |
| S6 · Búsqueda | Filtros frecuentes, resultados y ruta forense | Índices, latencia, formato de consultas | Conservar filtros avanzados bajo demanda |
| S6 · Forense | Quién, qué, por qué, regla histórica, integridad | Texto Cedar completo y Object Lock | Conservar motivo; plegar detalle normativo |

## Prueba inversa

1. **Modo limpio:** 15 rutas válidas en dos tamaños; ninguna debe mostrar catálogo, requisitos numerados ni pizarra. Cada una debe contener una operación o resultado identificable.
2. **Información indispensable:** deben mantenerse a la vista señales de DEMO, estados, errores y consecuencias de una acción irreversible.
3. **Modo explicaciones:** cada ruta muestra su pizarra correspondiente bajo el control global; permanece cerrada inicialmente y desaparece al apagarlo.
4. **Regresión:** las pruebas funcionales de cada slice siguen comprobando que permanecen las operaciones de alta, flujo, reglas, aprobación y auditoría.
5. **Evidencia visual:** generar PNG de las 15 rutas en 1440×900 y 390×844, desde el modo limpio. Revisar presencia de párrafos de ayuda y jerarquía de información; las pruebas automáticas no sustituyen la revisión humana.

El archivo `tests/editorial-sweep-qa.mjs` automatiza los puntos comprobables. La pizarra editorial separada y los fundamentos se encuentran en `src/console/editorial-board.json` y `docs/pizarra-editorial-interfaz.md`.

## Límites

La prueba identifica términos y estructuras que **probablemente** constituyen fuga editorial. No demuestra que toda oración sea pertinente: una evaluación humana debe examinar si el texto afecta una decisión. Tampoco se debe ocultar la palabra `MCP`, `JWT` o `Cedar` cuando la persona realiza una configuración técnica. Esta auditoría se refiere a legibilidad y alcance de los textos, no a seguridad, usabilidad observacional ni implementación de requisitos de la plataforma.
