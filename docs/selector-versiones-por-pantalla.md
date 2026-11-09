# Superficies funcionales y versiones por slice

La consola muestra una **tarea de producto**, no una pantalla arbitraria por requisito. «Producto acumulado» conserva cada superficie con sus funciones disponibles hasta el corte; una actualización reemplaza una versión anterior solo cuando **no se pierde ninguna tarea previa**.

Fuente: [requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), especialmente REG-02, REG-01, REG-03, FIN-02, FIN-03, INF-02, MCP-01 y CON-07, y [04-ux.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md).

## Veredicto por transición

| Corte | Pantalla | Clasificación | Motivo |
|---|---|---|---|
| S0 → S2 | Alta/listado de agentes → Control individual | **Dos superficies nuevas** | Registrar y listar muchos agentes no equivale a activar, suspender o configurar uno. Ambas operaciones deben coexistir. |
| S2 → S3 | Consumo y límites → Consumo por persona | **Una actualización de la misma superficie** | FIN-03 amplía los límites de FIN-02: conserva edición por agente, añade desglose y cuota por usuario, y solo_workload hereda del agente. |
| S1 → S4 | Catálogo de tools → Ejecución MCP | **Dos superficies nuevas** | INF-02 clasifica y versiona declaraciones; MCP-01 registra targets y controla ejecuciones. La consola CON-07 debe conservar ambas tareas, con acceso cruzado y estados compartidos por agente. |

## Navegación en S6

- **Agentes** (`s0-connect`) es una pantalla independiente. Desde S2 aparece **Administrar** por agente; conduce a la ficha **Control del agente** (`s2-activate`) conservando el agente seleccionado. **Volver al listado** no borra las modificaciones de la sesión.
- **Catálogo** (`s1-inventory`) permanece navegable, también al abrir `?slice=S6&screen=s1-inventory`. Desde S4 muestra para cada tool si pasa por MCP y si está aprobada, sin perder la revisión de clase o esquema. **Administrar ejecución MCP** abre `s4-mcp` y **Volver al catálogo** regresa, preservando el estado por agente.
- **Consumo** (`s2-limits` en S2 y `s3-user-spend` desde S3) es la única superficie con selector **Versión de esta pantalla**. En S3 muestra primero límites del agente y el desglose de personas, y permite cambiar el alcance para editar límites individuales.

Una URL de un corte futuro conserva la **misma superficie** de la ruta solicitada, sin forzar un salto desde el listado al detalle ni desde el catálogo a la ejecución. La ruta a una superficie todavía no disponible en el slice solicitado no debe ofrecerse desde la UI. El menú lateral no se habilita.

## Cardinalidad

S0: 2, S1: 5, S2: 7, S3: 8, S4: 11, S5: 12, S6: **14 superficies acumuladas**. El catálogo describe **15 versiones** y **una sola sustitución funcional** (Consumo S2→S3).

## Verificación

Las suites `screen-versions-qa.mjs` y `surface-contract-qa.mjs` comprueban selector único, coexistencia, cambios de corte, apertura desde listado/catálogo, persistencia por agente y por usuario, y navegación de retorno en escritorio y móvil. No acreditan backend AWS ni seguridad de credenciales reales.
