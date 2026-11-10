# Ayuda contextual para los presets de políticas en S2

**Objetivo:** que el operador configure el agente sin atravesar una guía didáctica extensa. El selector de preset se muestra junto a **Modelos autorizados** y un pequeño signo **«?»** abre la explicación solo cuando la necesita.

## Interacción final

- **En reposo:** se muestra el campo `Preset de políticas` y un botón de ayuda circular, accesible por teclado. Sin tablas, escenarios hipotéticos ni secciones explicativas adicionales.
- **Al pulsar «?»**: una ventana contextual compacta explica los tres presets en lenguaje de usuario final: Caja Negra Segura (lectura/escritura aprobadas, críticas bloqueadas), Operación Supervisada (identidad y rol para escrituras, aprobación para críticas), Blindaje Estricto (permisos explícitos), más la regla transversal sobre tools pendientes o sin clasificar.
- **Al cambiar el preset, antes de guardar**: aparece una única frase sobre la principal consecuencia. Para el preset 2 informa que las escrituras requieren identidad **C** y que las operaciones críticas requieren aprobación por MCP **B**; no afirma que el agente tenga o no conectadas esas vías si no existe un dato verificable. Para el preset 3 advierte del bloqueo por defecto. También indica de manera breve que no hay datos suficientes para cuantificar solicitudes afectadas.
- **Al guardar**: desaparece la advertencia de cambios no guardados. No se modifica el valor de otro agente. La operación sigue identificada como **demo**.

## Fuentes normativas

- [`contexto/03-politicas-y-estado-inicial.md` §2](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md): los tres presets, clases, estado de aprobación, rol de escritura y distinción descubrimiento/activo.
- [`requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml): **POL-01 MUST** (semántica), **POL-05 SHOULD** (comparación mediante evidencia real), **CON-07 MUST** (advertencias al necesitar conexiones) y **EVD-04 MUST** (cambio auditado).
- [`contexto/04-ux.md` §1 y §4](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md): lenguaje de negocio primero, detalle técnico opcional y preset integrado en Tools y reglas.

**Límites:** el botón «?» no evalúa Cedar; B/C no se detectan de manera real en este prototipo. No existe cálculo del impacto en solicitudes históricas (`POL-05`) ni registro de auditoría durable (`EVD-04`). La función pura de ejemplos permanece en `preset-guide.js` para contrastar casos de contrato, pero no aparece como controles de producción en el formulario.

## Verificación

`node tests/preset-guide-qa.mjs` conserva **18 pruebas de reglas de ejemplo** y cambia la revisión de Playwright a lo que interesa en producto: selector compacto por defecto, apertura de ayuda con clic, explicaciones completas bajo demanda, advertencia corta solo cuando existe un cambio sin guardar, persistencia en la sesión, ausencia de desbordamiento y errores JavaScript en escritorio y móvil. Se ejecuta asimismo desde `incremental-functional-qa.mjs`.
