# Auditoría contractual · superficies y evolución S0–S6

**Propósito.** Justificar la clasificación de cada entrega como nueva superficie o actualización sin ocultar pérdidas de funciones. Esta revisión es del prototipo UI: los comportamientos locales y los estados ficticios no sustituyen pruebas de aceptación del backend.

**Fuente normativa primaria:** [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml). **Fuente de UX:** [`insumo/contexto/04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md), §1 (pregunta por vista), §4 (Agentes / Tarjeta individual / Consumo / Tools y reglas), §5 (veredictos, contexto y ausencia de datos). La [matriz de entregas](slices-vistas-trazabilidad.md) es un artefacto derivado, no una fuente alternativa.

## Matriz de requisitos → tarea → superficie → comprobación

| Requisito | Exigencia pertinente al diseño | Desde | Lugar y prueba visible en la maqueta | No certificado en la maqueta |
|---|---|---|---|---|
| **REG-02** | Registrar agentes, emitir token individual de una sola visualización, rotar y revocar | S0 | `s0-connect`: alta, múltiples agentes, estado de credenciales y rotación; permanece en S2–S6 | Emisión/hash server-side y revocación efectiva en 60 s |
| **REG-01** | Modo por agente, responsable y previsualización del impacto antes de activar | S2 | `s2-activate`: ficha individual con selección, diálogo y estado; se abre desde «Administrar» en el listado | Evidencia real en sombra, efecto en ≤10 s, rechazos del servidor |
| **REG-03** | Suspender/reactivar solo el agente seleccionado, recuperando modo previo | S2 | `s2-activate`: suspensión individual; registro/credenciales de otros agentes independientes en la sesión | 100 % de inferencias y MCP rechazadas en ≤60 s |
| **INF-03/05** | Modelos permitidos y bloqueo de tool_calls en modo activo | S2 | Ficha y previsualización; efectos descritos sin afirmar enforcement | Comportamiento Chat Completions y streaming con proveedor real |
| **FIN-02** | Presupuesto, tokens y frecuencia por agente, acciones al exceder y edición | S2 | `s2-limits`: los tres valores, período y comportamiento; no desaparece en S3 | Contadores, umbrales, HTTP 429/403 y aplicación ≤10 s |
| **FIN-03** | Añadir costo/límites por persona *sin sustituir* los del agente; solo_workload hereda | S3 | `s3-user-spend`: conserva bloque FIN-02, agrega tabla por usuario, cambia alcance de edición; agente y usuario guardan configuraciones distintas | Reconciliación con evidencia real; cuotas enforceables por JWT |
| **CON-06** | Vista de consumo por agente, modelo, usuario, período; medidores/alertas | S2/S3 | Evolución dentro de una misma superficie `consumo` (sin reemplazar tareas) | Desglose real por modelo, alertas de umbral y latencia no están implementados en esta maqueta |
| **INF-02** | Descubrir y versionar declaraciones, sugerir y revisar la clase por agente | S1 | `s1-inventory`: lista, clase, versión, edición y cambio de esquema; sigue accesible tras S4 | Descubrimiento automático de inferencia y procedencia de heurísticas |
| **MCP-01** | Registrar targets Lambda/OpenAPI y gobernar `tools/list` y `tools/call` según aprobación | S4 | `s4-mcp`: destinos, centralización por tool, aprobaciones, acceso desde catálogo | Servidor MCP, ejecución `tools/call`, transporte y correlación reales |
| **CON-07** | Catálogo conjunto con clase, estado, supervisión, centralización, uso reciente y enlace a reglas | S4 | El catálogo `s1-inventory` incorpora estado de B/aprobación y conserva la clasificación; el detalle MCP ofrece supervisión/uso y edición, vinculados al mismo agente | Catálogo único backend y datos de uso medidos; la revisión visual no equivale a cobertura completa de todos los campos |
| **PLT-02/GRD-04** | Credenciales de destino y enmascaramiento de resultados MCP | S4 | La vista separada muestra tipos de destino y advertencias de autenticación | Secrets Manager, AgentCore Identity y guardrails ejecutados realmente |

## Decisiones de arquitectura de interfaz

1. **Alta/listado ≠ ficha individual**. Preguntas distintas, cardinalidad distinta (colección frente a elemento) y acciones diferentes. S2 añade `control-agente` sin eliminar `agentes`. El listado enlaza a la ficha del **agente seleccionado**, y la ficha enlaza de vuelta. La simulación mantiene registro, modo y claves por agente.
2. **Consumo S3 es una actualización real**. Misma pregunta de producto y mismos campos presupuestarios de S2, más un segundo alcance de análisis. El límite `solo_workload` se ve como heredado y no puede sobreescribirse desde un usuario ficticio.
3. **Catálogo ≠ ejecución MCP**. La clasificación de la tool y la configuración de su ruta de ejecución no son la misma operación. S4 añade `mcp`, y el catálogo S1 permanece disponible. En el corte S4+ el catálogo indica si cada tool pasa por MCP y su aprobación, conservando modal de revisión/esquema. MCP ofrece la administración de destinos, aprobación y supervisión. Se puede navegar en ambos sentidos sin cambiar el agente.
4. **Aislamiento de estado de tools**. En el prototipo, MCP, aprobación y supervisión se almacenan por `agent.id`; un agente nuevo no hereda configuraciones de otro. El agente demostrativo conserva valores de ejemplo para la narración de S4.
5. **Versiones auténticas**. Solo `consumo` tiene dos entradas para la misma superficie. El selector «Versión de esta pantalla» no se usa para pasar de colección a elemento ni de catálogo a ejecución. El producto acumulado conserva 14 superficies al cierre de S6, con 15 cambios/entregas.

## Pruebas que deben acompañar la PR

- **V1 · Modelo de datos:** 15 entradas, 14 superficies, dos registros de consumo y solo uno marcado como `update`. Conteos por corte S0=2, S1=5, S2=7, S3=8, S4=11, S5=12, S6=14.
- **V2 · Navegación:** cada pantalla tiene el título, tipo y selector correcto; S0+S2 y S1+S4 coexisten; enlaces S2+, S4+; apertura de una ruta antigua desde S6 no redirige a otra superficie.
- **V3 · Conservación de funciones:** S3 permite editar presupuesto de agente y de persona separadamente, con `solo_workload` heredado y sin API real.
- **V4 · Catálogo/MCP:** revisar esquema/clase sigue funcionando en S4; se observan tool centralizada/fuera y aprobación; MCP administra ejecución; la selección se conserva al volver.
- **V5 · Aislamiento:** suspender o modificar tools de un agente no altera modos, claves, MCP ni aprobaciones de los demás en una sesión.
- **V6 · Regresión:** pruebas Playwright del roadmap, credenciales, modo explicaciones, evolución incremental, presentación y capturas de escritorio/móvil.
- **V7 · Inspección de trazabilidad:** los mensajes principales muestran consecuencias, la documentación técnica queda en «Mostrar explicaciones», y la pizarra editorial se adapta a 14 superficies.

## Límites y evidencias pendientes

Los criterios de aceptación **MUST** de los requisitos no quedan acreditados por este prototipo. Se debe comprobar en el repo de implementación la persistencia multiusuario, autorización del operador, expiración/revocación de credenciales, emisión de evidencia de decisiones y enforcement de MCP. Además, el catálogo visual todavía emplea cuatro tools sintéticas y la pantalla de consumo cifras de muestra: no proporciona conciliación medida de gastos por modelo/usuario ni ofrece una certificación CON-06/07 completa. Estas limitaciones no se ocultarán en la UI ni se declararán como pruebas superadas en la PR.
