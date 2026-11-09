# Auditoría integral de las 15 vistas Cloudscape (S0–S6)

**Corte:** 9 de noviembre de 2026. **Objeto:** revisar la fidelidad del prototipo navegable frente a `insumo/requisitos.yaml`, las fichas generadas `insumo/slices/S*.md`, los contratos de conexiones A/B/C y las decisiones de UI. **Interpretación:** no se evalúa implementación AWS real; el prototipo utiliza datos sintéticos y operaciones locales. **Alcance:** quince versiones de pantallas, doce superficies de producto.

## Hallazgo ejecutivo

La distribución por slices es razonable y no requiere crear pantallas adicionales solo para rellenar hitos. La brecha real era la **profundidad funcional dentro de ciertas vistas**: una pantalla podía mostrar un estado pero no el ajuste o el contraste previsto por su requisito. El riesgo de la API key compartida en las primeras maquetas era el ejemplo más importante, resuelto en la actualización anterior. La revisión actual consolida cuatro correcciones focalizadas y cataloga lo que queda pendiente de backend.

## Matriz de correspondencia pantalla → requisito → estado

| Slice · vista | Evidencia de interfaz | Evaluación | Mejora en esta revisión o límite explícito |
|---|---|---|---|
| **S0 · Alta del agente** | Nombre, responsable, modelo, `agent_token` único de DEMO, emisión de una sola vez y lista de agentes | **Representada** | No demuestra hash, revocación real ni `401`: requieren backend |
| **S0 · Flujo en vivo** | Trace ID, modelo, decisión, costo, registro | **Mejorada** | Se muestran tokens y latencia ilustrativa por solicitud; no se confunden con mediciones de AWS |
| **S1 · Tarjeta de gobernanza** | Conexiones A/B/C, controles efectivos y en sombra, referencia de índice de catálogo | **Representada con límites** | 41 % es referencia máxima de catálogo para A, no resultado medido ni puntuación de seguridad |
| **S1 · Inventario de tools** | Tools declaradas, clase, esquema, estado de clasificación y cobertura de ejecución | **Mejorada** | Modal para corregir/confirmar clase sin confundir esa revisión con aprobar la ejecución; versiones de esquema todavía simuladas |
| **S1 · Decisión en sombra** | Autenticación, evaluación Cedar, Guardrail y PII diferenciadas | **Adecuada para demostración** | No reemplaza tests de falsos positivos, inyección ni `stream` |
| **S2 · Modo activo y suspensión** | Selector de agente, credenciales, rotación/revocación, modo, modelo y Preset, Kill Switch, retiro | **Mejorada** | Vista previa de cambio de Preset con recuento y muestra **sintéticos**, antes de guardar (POL-05); requiere reevaluación sobre evidencia real |
| **S2 · Consumo y límites** | Presupuesto, período, tokens, solicitudes/minuto y acción alerta/429/403 por agente | **Representada** | Umbrales y respuestas en backend aún no verificadas |
| **S3 · Identidad y acceso** | JWT válido/ausente/inválido, `solo_workload`, autorización PII y 401/degradación | **Representada** | Falta autenticación real OIDC y política aplicada por el motor |
| **S3 · Consumo por persona** | Gasto ilustrativo, principal y edición de límites | **Mejorada** | Límites por usuario almacenados separadamente por agente, no sobrescriben los del agente ni los de otros usuarios; `solo_workload` hereda límites del workload |
| **S4 · Tools por MCP** | Targets, credenciales de destino, cobertura parcial, aprobación y control por tool | **Representada** | La UI no ejecuta MCP; secreto de target y token de agente son identidades diferentes |
| **S4 · Constructor de reglas** | Builder + borrador Cedar, efectos y ejemplos | **Parcial, deliberadamente** | Editor no valida sintaxis/esquema: debe implementar validación real, pruebas `ALLOW/DENY` y versionado durable |
| **S4 · Guía de conexión** | A con `BASE_URL` y API key del agente, B con el mismo token, C con JWT distinto | **Representada** | El detalle de credenciales es informativo; la plataforma no hace integración automática por mostrar ejemplos |
| **S5 · Aprobaciones** | Bandeja, estado y vencimiento de muestra, actor, rol y separación de funciones | **Mejorada** | Selector de los tres niveles de supervisión **autónoma / notificar / requiere_aprobacion** por tool. No hay workflow HITL real, idempotencia ni ejecución controlada |
| **S6 · Búsqueda de auditoría** | Trace ID, principal/agente/tool, decisión, fecha, modelo, canal, conexiones | **Representada** | El índice real y su latencia de consulta siguen pendientes |
| **S6 · Ruta forense** | Transacción elegida, correlación, principal, regla, versión, autor y objeto de evidencia | **Representada con límites** | No demuestra inmutabilidad real; Object Lock GOVERNANCE admite bypass expresamente autorizado y debe verificarse con AWS |

## Decisiones UX

1. **No crear una pantalla por requisito.** Cada slice sigue siendo una entrega visible de cambios o pantallas nuevas; se agregan controles operativos dentro de las vistas existentes.
2. **Navegación centrada en la pantalla:** no se reintroduce menú lateral; selección de slices solo cuando una superficie realmente cambia (Agentes S0/S2; Consumo S2/S3; Tools S1/S4).
3. **Divulgación progresiva:** se mantiene modo limpio por defecto; la ayuda se habilita con «Mostrar explicaciones». Los estados críticos y las advertencias de validación nunca dependen de ese interruptor.
4. **Simulación honesta:** cifras y cambios sintéticos se identifican como DEMO; ningún clic equivale a registrar un agente, guardar Cedar, emitir tokens, aprobar o desplegar en AWS.
5. **Mantener Cloudscape real:** componentes `Container`, `Table`, `Select`, `FormField`, `Alert`, `StatusIndicator`, `Modal`, `KeyValuePairs` y `AppLayout`.

## Deuda de interfaz y backend priorizada

**P0 · Seguridad real (impide producción):** hash y verificación del token por agente; emisión y rotación server-side; revocación en ambos canales ≤60 s; autenticación de la consola y RBAC; JWKS/issuer/audience en C; enforcement de permisos y Kill Switch; evidencia durable y fail-closed. Son **contratos**, no funciones demostradas por este HTML.

**P1 · Fidelidad de casos reales (antes de declarar los slices terminados):** evaluación real de impacto al cambiar Preset (POL-05), confirmación y versiones de clasificación de tools (INF-02), límites independientes `FIN-03`, supervisión HITL por tool, estado `PENDING_APPROVAL` + TTL + comprobación idempotente, validación Cedar según esquema y matriz ≥30 escenarios (POL-02/POL-04), retención y acceso a objetos de evidencia, filtros e índices de transacciones. La revisión mejora su representación, pero no certifica su backend.

**P2 · Pulido visual posterior:** acciones sobre listas grandes (filtros y densidad de tablas), comparaciones longitudinales de gasto con métricas reales, estados vacíos y skeletons de carga, pruebas de teclado/foco y contraste además de la inspección responsive.

## Casos de aceptación recomendados para automatizar con un backend real

- Dos agentes con API keys distintas: revocar o suspender uno no altera el otro; 401 para token inválido, 403 al suspender, ambos canales.
- Una tool sin clasificación permanece fuera de ejecución en activo; su clase sugerida puede corregirse sin aprobarla.
- Cambio de Preset: reevaluación de una ventana real con recuento trazable; aplicación solo tras confirmar; rastro administrativo y vigencia ≤10 s.
- Dos usuarios de un mismo agente con distintos límites: el que excede recibe 429, el otro permanece atendido; `solo_workload` consume cuota del agente.
- Aprobación por originador, usuario no autorizado y `agent_token` siempre se rechaza; la aprobación autorizada ejecuta exactamente una vez dentro del plazo.
- Auditoría: búsqueda de una transacción multi-salto, versión exacta de la regla y evidencia inmutable bajo configuración real de Object Lock GOVERNANCE.

## Fuentes

- `agentic-ai-governance-platform/insumo/requisitos.yaml` (normativo)
- `insumo/slices/S0-fundacion.md` a `S6-auditoria.md` (derivados del YAML)
- `insumo/contexto/01-modelo-de-conexion.md`, `03-politicas-y-estado-inicial.md`, `04-ux.md`, `05-decisiones-tecnicas.md`
- `ai-governance-platform-docs/assets/console-data.json` y `src/console/` (implementación de prototipo)
