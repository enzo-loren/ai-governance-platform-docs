# Fidelidad funcional y progresión acumulativa de S0–S6

**Fecha de revisión:** 2026-11-09. **Ámbito:** documentación y prototipo estático Cloudscape del Módulo A. **Fuente normativa:** `agentic-ai-governance-platform/insumo/requisitos.yaml` en `main`; la documentación de este repositorio es subordinada. **Estado de implementación:** demostración local con datos sintéticos, sin comprobar AWS ni motor Cedar.

## Criterio de fidelidad

Se distinguen tres niveles, que nunca deben confundirse:

1. **Contrato**: comportamiento obligatorio del YAML, sujeto a pruebas del sistema real.
2. **Representación**: controles y estados navegables de la maqueta.
3. **Ejecución**: comprobación de efectos reales, persistencia, autorizaciones, plazos, tokens, Cedar, infraestructura y evidencia inmutable. La maqueta no acredita este nivel.

La revisión de interfaz no certifica el cumplimiento completo de ningún requisito que exige backend, AWS, políticas reales, tiempo de propagación ni seguridad criptográfica.

## Modelo de evolución

- La portada ofrece **Solo cambios** (15 versiones) y **Producto acumulado** (12 superficies al terminar S6).
- Una superficie introducida antes puede mostrar datos, decisiones o canales que solo están disponibles cuando se abre desde un corte posterior. Esto no crea otra pantalla ni otra versión nominal. El parámetro `slice` conserva el **corte del producto**, mientras `screen` identifica la **superficie/version de la vista**.
- Ejemplo: `?slice=S6&screen=s1-coverage` conserva S6 y presenta A+B+C; `?slice=S1&screen=s1-coverage` muestra solamente A.
- El selector de versiones solo aparece cuando realmente existe una revisión de la misma superficie: Agentes S0/S2; Consumo S2/S3; Tools S1/S4.

| Superficie | Entrega inicial | Progresión visible / acción |
|---|---|---|
| Agentes | S0 | Credencial individual emitida una vez y gestión de rotación/revocación en S0; S2 añade activación, impacto, suspensión y retiro |
| Flujo de solicitudes | S0 | S2 bloqueo de intención, S3 principal humano, S4 ejecución MCP, S5 aprobación, S6 correlación; filtros por canal, usuario, decisión y búsqueda |
| Tarjeta de gobernanza | S1 | Refleja B y C al agregarse; distingue máximo teórico, índice sin medir, evidencia ausente y controles en sombra; sugiere siguiente paso |
| Inventario de tools | S1 | Clase sugerida/revisada, cambio de esquema con nueva revisión pendiente |
| Control activo | S2 | Muestra nombres de tools pendientes antes de activar y alcance por agente |
| Tools MCP | S4 | Targets, aprobación y centralización por tool; supervisión disponible desde S5, con detalle de uso y esquema |
| Reglas | S4 | Constructor por agente, rol, tool/clase, efecto y parámetros; validación de ejemplo distinta de parser Cedar real |
| Guía A/B/C | S4 | Recomendación por agente, deltas de controles del catálogo y ejemplos de X-Gov-Trace-Id |
| Aprobaciones | S5 | Nivel de supervisión compartido por herramienta, operación, correlación y argumentos enmascarados |
| Auditoría | S6 | Texto de la versión histórica de política y prueba de inmutabilidad claramente no verificada |

## Principios visuales y de explicación

El modo por defecto es **sin explicaciones**. Se muestran controles, estados, motivos y consecuencias que cambian una decisión. Se ocultan bajo `Mostrar explicaciones` las notas de implementación, justificaciones de diseño, límites educativos y reglas de negocio adicionales que no hagan falta para usar la pantalla. La etiqueta **DEMO · Sin conexión AWS** permanece visible siempre.

Las decisiones de denegación, revocación, suspensión, JWT inválido, tool no aprobada y aprobación crítica se mantienen visibles aunque la ayuda esté apagada.

El diagrama de arquitectura distingue el alcance de Cedar con A (**intención**) y con B (**intención y ejecución**). Las herramientas locales siguen fuera del perímetro de ejecución aunque A observe su intención.

## Verificación reproducible

En GitHub Actions, el workflow `cloudscape-ui-qa.yml` recompila el bundle y ejecuta las suites existentes de Cloudscape, navegación, explicaciones, versiones, credenciales y presentación; además ejecuta `tests/incremental-functional-qa.mjs`.

La suite nueva abre cortes y superficies acumuladas, comprueba visibilidad de A/B/C, reconstrucción de eventos, retención al pausar, versiones de esquema, contenidos del constructor, atributos de HITL y texto histórico; revisa errores JavaScript, desbordamiento horizontal y captura PNG en 1440×900 y 390×844. El artifact `cloudscape-ui-qa` incluye los PNG y JSON de resultados. Las capturas permiten revisión visual; **no sustituyen una evaluación completa de accesibilidad WCAG, usabilidad con personas ni integración AWS**.

## Pendiente de pruebas de aceptación reales

Los `MUST` normativos siguen exigiendo validaciones independientes: autenticación real y revocación en ambos canales, clasificación y versiones de esquema persistidas, cálculo del índice sobre evidencia y aplicabilidad, guardrails/PII, bloqueos Cedar y herramientas MCP reales, validación Cedar por tipos y propagación, HITL con TTL e idempotencia, límites por persona, búsqueda real y retención Object Lock. Las vistas no deben declarar esos resultados como logrados por el hecho de representarlos.
