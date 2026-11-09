# Corrección del despliegue Cloudscape y la vista limpia por defecto

## Síntoma reproducido

La imagen de S6 mostraba el encabezado **«AI Governance · prototipo»**, el título **«¿Qué pasó y por qué?»**, el pie de requisitos y ningún interruptor de explicaciones. Sin embargo, `src/console/main.jsx` en `main` ya mostraba **«AI Governance»**, encabezado `active.title`, y un `Toggle` de Cloudscape **«Mostrar explicaciones»** apagado por defecto.

Por tanto, la captura corresponde a una versión de interfaz anterior a la disponible en fuente. **No disponemos del registro de red de ese navegador** y no podemos afirmar si cargó una copia cacheada, un bundle antiguo publicado, o ambas cosas.

## Fallos de entrega confirmados

1. Antes de este cambio, `.github/workflows/pages.yml` copiaba los archivos de `assets/` sin ejecutar `npm run build`. Esto podía desplegar bundles viejos aunque React fuente ya estuviera actualizado.
2. `assets/console.html` enlazaba `console-build/app.js` y `app.css` sin una versión de contenido; un navegador o caché intermedio podía conservar el mismo URL entre despliegues.
3. La portada enlazaba la consola sin versión en las URLs y cargaba los recursos del roadmap bajo rutas fijas.

## Corrección

- `npm run build` ejecuta Vite y luego `scripts/stamp-console-assets.mjs`, que calcula una huella SHA-256 truncada a 16 dígitos sobre **los bytes reales** de `app.js` y `app.css`.
- La huella se incorpora a `assets/console.html`, los enlaces iniciales de `index.html`, los recursos JS/CSS del roadmap y las rutas dinámicas `assets/roadmap-cloudscape-v3.js` mediante `?v=<huella>`.
- El manifiesto `assets/console-build/version.json` permite verificar qué bundle y qué HTML se publican juntos.
- `.github/workflows/pages.yml` **instala, compila y verifica** antes de copiar los artefactos a GitHub Pages. El deploy deja de depender de un bundle estático previamente subido a Git.
- La automatización de build en ramas también incorpora los HTML y el manifiesto en el mismo commit que los recursos compilados; las pruebas de navegador recompilan antes de inspeccionar.

## Criterios de aceptación

- `tests/console-build-integrity.mjs` rechaza manifiestos cuyo hash no corresponda a los bytes JS/CSS, enlaces sin versión y bundles que aún contengan el encabezado antiguo.
- `tests/cloudscape-ui-qa.mjs` verifica las 15 pantallas con componentes Cloudscape en desktop y móvil.
- `tests/explanations-mode-qa.mjs` incluye ahora S6 forense directo en escritorio y móvil: **título «Ruta forense»**, toggle visible y apagado, ausencia inicial de «¿Qué muestra?» y pie de requisitos, y aparición de las ayudas cuando se activan. También observa que cada solicitud de `app.js` lleva la versión actual.
- `tests/roadmap-v2-navigation-qa.mjs` valida las 7 etapas y el retorno desde consola.

## Condiciones y límites

- No cambia la funcionalidad simulada, las reglas de negocio ni `insumo/`.
- Un documento HTML **ya abierto y nunca recargado** conserva su JavaScript anterior en memoria hasta que se vuelva a cargar. No es posible actualizar retroactivamente ese proceso desde los archivos nuevos.
- Tras fusionar la PR y desplegar Pages, una **recarga completa** de las pestañas antiguas puede ser necesaria una sola vez. La navegación nueva lleva versiones de contenido para evitar la reutilización posterior.
- Los tests y los datos del prototipo no acreditan una instalación AWS real.