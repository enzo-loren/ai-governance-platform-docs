# Pizarra editorial · vistas S0–S6

**Fuente de esta pizarra:** [`src/console/editorial-board.json`](../src/console/editorial-board.json). El JSON es el registro por superficie que la consola incorpora **solo al activar «Mostrar explicaciones»** y abrir «Pizarra editorial y trazabilidad». Este archivo es una nota de diseño; no reemplaza los requisitos de `insumo/` ni acredita implementación AWS.

## Criterio editorial

La interfaz predeterminada está dirigida al operador y a quien evalúa la propuesta de producto. Las capacidades se presentan mediante **una situación, su resultado y la acción disponible**, no mediante un inventario normativo.

La información se clasifica por función, siguiendo Scientific Writing Editor:

- **REQUIRED — visible:** estado, decisión, límite de control y consecuencia de acciones; una omisión cambiaría la interpretación. Ejemplos: «sin medición», «tool fuera de MCP», «JWT inválido», «aprobación pendiente», «integridad sin verificar».
- **OPTIONAL — Mostrar explicaciones:** referencia metodológica, contrato de integración, detalles de esquemas, criterios de cálculo, diferencias A/B/C, políticas y tiempos esperados que no son imprescindibles para ejecutar la acción.
- **PROCESS_ONLY — pizarra editorial:** razones por las que se conservó, reformuló o trasladó un elemento. Nunca se insertan en la pantalla normal.

## Decisiones de esta revisión

| Superficie | Mensaje práctico en vista normal | Información trasladada |
|---|---|---|
| Agentes | Alta, clave individual, rotación y revocación | Proceso criptográfico y propagación |
| Flujo | Solicitud, resultado, canal, usuario y detalle | Contrato de correlación e índice |
| Gobernanza | Situación → resultado → abrir pantalla | Catálogo de 27 controles y cálculo del techo |
| Tools | Qué se descubrió, aprobó y centralizó | Esquemas y anotaciones detallados |
| Decisiones | Qué habría cambiado al activar | Mecánica de políticas en sombra |
| Consumo | Gasto, límites, efectos por agente/persona | Contadores y códigos de protocolo |
| Identidad | Usuario efectivo y datos visibles u ocultos | Emisión y validación OIDC |
| Reglas | Constructor, ejemplo de efecto e historial | Parser Cedar, matriz de aceptación |
| Guía | Configuración copiable A/B/C y siguiente paso | Ganancias en controles del catálogo |
| Aprobaciones | Qué operación espera, quién decide, plazo | Idempotencia, TTL y contrato MCP |
| Búsqueda | Filtros, resultados y ruta del caso | Objetivos de desempeño e índices |
| Forense | Qué ocurrió, motivo, regla aplicada y evidencia | Código completo de Cedar y Object Lock |

No se eliminan capacidades de la propuesta; se conserva el acceso por navegación, acciones y detalles cuando el usuario lo necesita. La pantalla de gobernanza deja de ser un manual sobre controles.

## Protecciones contra interpretaciones indebidas

La insignia **DEMO · Sin conexión AWS** permanece visible. Los datos simulados nunca se presentan como evidencia medida. El porcentaje teórico de cobertura está identificado como referencia y no como índice alcanzado. La ausencia de C significa ausencia de identidad humana, no de autenticación del agente. La ausencia de B implica que la ejecución de tools locales sigue fuera del perímetro. Un sello de auditoría no verificado nunca aparece como íntegro.

## Comprobación

`tests/incremental-functional-qa.mjs` verifica la evolución de capacidades y que la vista principal no incluya el listado de 27 controles. `tests/explanations-mode-qa.mjs` verifica que la pizarra solo sea accesible con explicaciones activadas y que desaparezca al desactivarlas. Ambos se ejecutan en `.github/workflows/cloudscape-ui-qa.yml` con capturas desktop/móvil.

**Fuentes del contrato:** [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), [`contexto/04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md) y [`catalogo-controles.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/catalogo-controles.md).
