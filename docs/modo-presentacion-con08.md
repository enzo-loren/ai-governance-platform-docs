# CON-08 · Modo presentación orientado a demostrar decisiones

**Estado:** prototipo interactivo de escritorio y móvil, no integración con AWS.

## Problema detectado

Antes, `simulation.presentation` únicamente agregaba `presentation-mode` al contenedor existente. Las reglas CSS afectaban `h1`, números KPI y `step-entry`, y ocultaban el pie. **No había composición distinta, jerarquía para la audiencia, recorrido ni vista a 1080p.** Además, el estado visual se almacenaba dentro de los datos de simulación de agentes, cuando es una preferencia de interfaz.

## Criterio normativo

`insumo/slices/S2-controlar-modo-activo.md`, **CON-08**: tipografía grande, alto contraste, flujo en vivo a velocidad legible, eliminación de elementos secundarios y prueba visual automatizada a 1080p en agentes, tarjeta de gobernanza, flujo en vivo, transacción y aprobaciones. No exige un cambio de configuración real cuando se presenta.

## Decisión UX

El botón **«Modo presentación»** se encuentra al lado del selector de versión (si aplica) solo en las vistas contempladas por CON-08. Al activarlo, la consola operativa es reemplazada por una escena de alto contraste con:

- título y objetivo de la pantalla;
- agente seleccionado y estado configurado **por separado** de los estados ilustrativos del relato;
- una historia por pasos, con resultado esperado en la puerta y tres indicadores de la escena;
- navegación por pasos, salida explícita y tecla **Esc**;
- pantalla completa opcional, sin ocultar la advertencia permanente **DEMO · Datos sintéticos**;
- ninguna escritura sobre agentes, credenciales, políticas ni aprobaciones al cambiar de paso.

El modo normal queda **intacto por defecto**. El modo presentación es puramente visual, no sustituye la administración ni ejecuta AWS. El control de visibilidad de explicaciones se mantiene en la consola normal, no se convierte en contenido de la proyección.

## S2 · Secuencia de demostración

1. **Descubrimiento:** evaluación Cedar en sombra; ejemplo ficticio de 3 solicitudes con bloqueo potencial sobre 12, 2 tools por revisar. Las reglas no bloquean por sí solas.
2. **Activo:** la decisión de Cedar pasa a exigible, modelo prohibido recibe 403, control crítico indisponible debe recibir 503. Objetivo ≤10 s para aplicar cambios en caliente.
3. **Suspensión:** 403 en A/B para el agente suspendido en ≤60 s por contrato, sin modificar otros agentes. Esto **no equivale a revocar la API key** (401) ni elimina la evidencia.

La propia pantalla declara que esas cifras y comportamientos son **requisitos/ejemplos**, no resultados medidos del prototipo.

## Otras escenas contempladas por CON-08

| Pantalla del prototipo | Escena | Lectura principal |
|---|---|---|
| S0 · Alta | Registro y conexión | Key individual por agente, entrega única, A+B |
| S0 · Flujo en vivo | Tres eventos ficticios | 200, respuesta simulada, 401. Avance cada 4,6 s, pausa/reanudar |
| S1 · Tarjeta de gobernanza | A, A+C, A+B, A+B+C | Índices referenciales 41/56/67/89 %, **no puntuación de seguridad** |
| S1 · Decisión en sombra | Autenticación, Cedar, PII | Diferencia entre observación y protección activa |
| S2 · Modo activo | Descubrimiento, control, Kill Switch | Efecto operativo de aplicar y suspender |
| S5 · Aprobaciones | Retención, roles, ejecución | PENDING_APPROVAL, 403 por autoaprobación, ejecución única |
| S6 · Ruta forense | Solicitud, inferencia, decisión, evidencia | Correlación, regla/versiones y límites de Object Lock |

Los restantes módulos no presentan ese botón porque CON-08 no los exige. Es una elección deliberada para no construir una segunda interfaz completa de administración que confunda la finalidad del modo.

## Verificación

`tests/presentation-mode-qa.mjs`: recorre 7 escenas × 1920×1080, 1366×768 y 390×844; comprueba acceso y salida, foco, ausencia de formulario/editorial, navegación, ejemplos S2, escaneo de recortes/desbordes, flujo pausado, exclusión de previews, y genera capturas reales. A 1080p no debe requerir desplazamiento vertical para ver los controles de la escena.

`tests/cloudscape-ui-qa.mjs`: conserva la comprobación de 15 pantallas y exige un modo de presentación distinto y navegable, no solo un selector CSS.

## Alcance de implementación

`src/console/presentation-stage.jsx` y `.css` son archivos aislados de visualización; `main.jsx` controla exclusivamente el estado de presentación, sin guardarlo como estado simulado de ningún agente. Ningún requisito de `insumo/` fue modificado. Los comportamientos de seguridad deben demostrarse en pruebas de integración antes de afirmarse como implementados.
