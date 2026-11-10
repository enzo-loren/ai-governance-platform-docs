# Presets de políticas · guía operativa S2

**Alcance:** prototipo de consola, sin motor Cedar ni datos operativos. La guía añade explicaciones sobre el efecto de cambiar un preset. No afirma que las conexiones A/B/C estén realmente configuradas en el agente ni ejecuta reglas.

## Fuente normativa y preguntas de producto

- [`insumo/contexto/03-politicas-y-estado-inicial.md`, §1 y §2](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md): modos, reglas sobre clase, estado de aprobación, roles `presets.roles`, combinaciones A/B/C, supervisión por defecto.
- [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml): **POL-01 MUST**, **POL-03 MUST**, **POL-05 SHOULD**, **CON-07 MUST**, **EVD-04 MUST**.
- [`insumo/contexto/04-ux.md`, §4](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md): «Tools y reglas» debe mostrar el preset con advertencias de conexión.

## Comportamiento visual implementado

En `s2-activate` se mantiene la selección por agente de **Preset 1 Caja Negra Segura**, **2 Operación Supervisada** y **3 Blindaje Estricto**. Al seleccionar un candidato, la guía compara el **preset guardado** con el **candidato** (sin modificarlo hasta pulsar Guardar).

La tabla de escenarios cambia según:
1. **Conexiones del ejemplo**: A, A+C, A+B y A+B+C (solo hipótesis, no activan ninguna).
2. **Quién solicita la operación**: `solo_workload`, rol `consulta` o rol `operador`. Sin C siempre es `solo_workload`, sin atribución de usuario.
3. **Clase y aprobación de una tool**: lectura aprobada, escritura aprobada, destructiva aprobada *hipotética*, destructiva no aprobada y herramienta sin clasificar.

Se muestran decisiones didácticas y razones:
- **Preset 1**: lectura y escritura aprobadas pasan (escritura notifica); destructivas y sin clasificar no.
- **Preset 2**: lectura aprobada pasa, escritura requiere C y rol operador, destructiva exige además B y aprobación humana; nada de ello supera una tool no aprobada.
- **Preset 3**: se deniega hasta definir permisos nominales explícitos; los ejemplos deliberadamente no incluyen excepciones.

**Advertencias**: sin C, el Preset 2 bloquea escrituras, y sin B no puede tramitar aprobación humana para las críticas. Estas condiciones no equivalen a una conexión real del agente. Se advierte que en **descubrimiento** la decisión se observa en sombra, mientras en **activo** se aplica; el preset por sí mismo no cambia el modo.

Desde `s4-policy` hay un vínculo para abrir la ficha donde se compara y cambia el preset, manteniendo el agente seleccionado.

## Correspondencia con las exigencias

| Requisito | Evidencia de interfaz | Límite |
|---|---|---|
| **POL-01 MUST** | Los tres nombres normativos; lógica de **ejemplos** por clase, aprobación y roles para A/B/C; pruebas unitarias de 17 casos | El ejemplo JavaScript **no es** el intérprete Cedar. No verifica reglas `forbid`, decisión real, versión ni 30 casos integrados |
| **POL-03 MUST** | Mensaje explícito cuando el agente está en descubrimiento, resultado ilustrativo «si estuviera activo» | No se produjo `ALLOW_SHADOW` ni evidencia inmutable |
| **POL-05 SHOULD** | Comparación por ejemplo entre preset actual y candidato | La consola muestra **«Impacto real: sin datos medidos»**; no se puede atribuir cuántas solicitudes cambiarían sin reevaluar contextos de tráfico real |
| **CON-07 MUST** | Advertencia al simular Preset 2 sin C o B; acceso desde herramientas/reglas a la selección del agente | No hay estado real y verificado de conexión C por agente ni supervisión ejecutada |
| **EVD-04 MUST** | El cambio de preset sigue guardándose en la sesión ficticia | No produce auditoría durable con actor, antes/después y firma/retención |

## Reproducción y verificación

En el proyecto, desde S2 abre **Control del agente**, cambia el preset a **2** y revisa el escenario **Solo A**: escritura denegada por falta de C. Cambia el escenario a **A+B+C** y el principal a **operador**: escritura permitida y crítica aprobada queda pendiente de aprobación. En **Preset 3** sin reglas explícitas, todas las tools quedan denegadas. La tool no aprobada sigue denegada con cualquier preset.

Para reproducir automáticamente: `node tests/preset-guide-qa.mjs`, o la suite principal `node tests/incremental-functional-qa.mjs`. El script comprueba contrato de ejemplos, navegación y visualización en escritorio/móvil. Las pruebas no reemplazan integración real con AWS, Cedar, guardrails, MCP o identidad OIDC.

### Trabajo pendiente para satisfacer POL-05

Cuando exista evidencia real, recargar los contextos de las solicitudes dentro de la ventana elegida y reevaluarlos con el **motor Cedar** y la configuración candidata, comparándolos con el preset actual. La UI debe mostrar cantidad verificable de cambios y **muestras identificadas por trace ID**, respetando controles de acceso y evitando exponer PII. Hasta entonces, el estado correcto es **«Sin datos medidos»**, no una cifra arbitraria.
