# Pantalla específica: versiones por slice y sin barra lateral

## Regla de diseño

La consola de prototipo se utiliza como **visor de una pantalla concreta**, no como un explorador paralelo al roadmap. La elección de pantalla ocurre en la página principal; la consola solo permite comparar sus versiones cuando realmente existen.

**Fuente:** `insumo/requisitos.yaml` y `insumo/contexto/04-ux.md`; las versiones se obtienen directamente de `assets/console-data.json`, por la clave `surface`, sin mantener un segundo catálogo manual.

## Versiones relevantes

| Superficie | Pantallas | Versiones del selector |
|---|---|---|
| Agentes | `s0-connect` → `s2-activate` | S0 y S2 |
| Consumo | `s2-limits` → `s3-user-spend` | S2 y S3 |
| Tools | `s1-inventory` → `s4-mcp` | S1 y S4 |

Las nueve superficies restantes tienen una única versión y, por tanto, **no muestran un desplegable**. La interfaz se limita a indicar su slice. Todos los ejemplos corresponden al catálogo S0–S6 actual, no suponen futuras versiones todavía no planificadas.

## Navegación

- El menú lateral de Cloudscape se elimina completamente, **incluido su botón de apertura**. Se utiliza `AppLayout` con `navigation={null}`, `navigationHide` y `navigationTriggerHide`; así se conserva la estructura Cloudscape del contenido.
- El enlace superior «Volver a slices» permanece como única salida al roadmap. Se retira el botón duplicado dentro del encabezado de cada pantalla.
- Al seleccionar otra versión, la pantalla permanece en la **misma superficie**. Se actualizan el título, la URL `slice`/`screen` y los datos simulados propios de la versión. La navegación Atrás restaura la selección anterior.
- Una URL al producto acumulado, por ejemplo `?slice=S6&screen=s1-inventory`, muestra la última versión disponible de la superficie Tools (S4), no una pantalla ajena.
- El modo predeterminado **sin explicaciones** y el interruptor opcional se conservan, así como la advertencia de prototipo con datos sintéticos.

## Verificación

`tests/screen-versions-qa.mjs` prueba las 15 versiones declaradas, en desktop y móvil: selector solo para superficies con cambios, opciones exactas, cambio de versión, historial del navegador, etiquetas para versiones únicas, ausencia de enlaces del menú lateral, vista previa y desbordes horizontales.

`tests/cloudscape-ui-qa.mjs`, `tests/roadmap-v2-navigation-qa.mjs` y `tests/explanations-mode-qa.mjs` se ejecutan en la misma CI, después de compilar el bundle y verificar la huella de contenido, para no repetir el problema de recursos desactualizados.

**Límites:** estas pantallas siguen siendo prototipos navegables con datos sintéticos y sin integración real con AWS. La correspondencia es con las modificaciones documentadas actualmente en `insumo/`, no una promesa de que cada pantalla no vaya a evolucionar en slices posteriores.