# Vista limpia y explicaciones opcionales

## Decisión UX

La interfaz del producto debe poder presentarse sin documentación superpuesta. Por eso la portada y la consola Cloudscape **inician con explicaciones desactivadas**; un control visible permite mostrarlas u ocultarlas en el acto.

### Siempre visible

- Navegación de slices, pantallas, tablas, filtros, formularios, decisiones y motivos operativos.
- Estado de la aprobación, mensajes de error, confirmaciones y advertencias necesarias antes de una acción crítica.
- Etiqueta breve de DEMO / sin conexión AWS para distinguir prototipo de producto real.

### Visible al activar «Mostrar explicaciones»

- Introducción y notas de alcance en la portada, preguntas de tarjetas y contexto del Módulo B.
- Subtítulo explicativo de la pantalla, enlaces «¿Qué muestra?» / «¿Por qué?», notas de políticas, límites y fuentes del prototipo.
- Panel explicativo opcional de cambios de modo, aclaraciones sobre conexión A/B/C y alcances de los controles.

### Estado y enlaces

- Sin parámetro, el estado inicial es limpio. La elección no se guarda entre visitas; así no se rompe el valor por defecto.
- Con el parámetro de URL `explain=1`, la ayuda está activada y es compartible entre portada y consola.
- Los iframes de miniatura con `preview=1` son **siempre limpios**, incluso si el roadmap tiene explicaciones activadas.
- El switch de la consola es el componente `Toggle` de AWS Cloudscape. La portada usa un botón con `aria-pressed`.
- Si se desactiva la ayuda con un modal informativo abierto, ese modal se cierra.

## Fuentes y alcance

- Requisitos UI: `insumo/contexto/04-ux.md` (jerarquía, estados con texto, progresión resumen → detalle).
- Fuente de funcionalidades: `insumo/requisitos.yaml`, no inferida a partir de una maqueta.
- Sistema visual: `@cloudscape-design/components` y estilos globales Cloudscape, con composición de portada adaptada al mismo lenguaje.
- Referencia editorial: Scientific Writing Editor, preservando condiciones y consecuencias en estados operativos; se evita convertir el producto en prosa de justificación.

## Evidencia reproducible

Las pruebas `tests/cloudscape-ui-qa.mjs`, `tests/roadmap-v2-navigation-qa.mjs` y `tests/explanations-mode-qa.mjs` validan en Chromium las dos modalidades, URLs, 15 pantallas, responsive, navegación y que las confirmaciones relevantes no se oculten.

**Limitaciones:** las pruebas automatizadas no certifican WCAG ni sustituyen la revisión humana en navegador. La consola mantiene datos sintéticos y no está conectada a AWS.