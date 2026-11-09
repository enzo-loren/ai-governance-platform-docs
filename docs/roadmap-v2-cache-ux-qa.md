# Corrección de navegación y revisión UX de la portada por slices

## Incidencia reproducida

Error observado por el usuario:

\`\`\`
slices.js:146 Uncaught TypeError: Cannot set properties of null (setting 'textContent')
at openScreen (...)
\`\`\`

**Causa evidenciada:** el archivo \`assets/slices.js\` presente en \`main\` tras la PR #7 no contiene \`openScreen\`; el HTML de portada publicado tampoco conserva \`#dialog-title\` ni el antiguo diálogo. La traza corresponde, por tanto, a un **JS anterior al reemplazo de las maquetas por la consola Cloudscape** que seguía ejecutándose sobre el nuevo documento. Lo más probable es una combinación de caché de navegador/CDN o pestaña abierta antes del despliegue; **no se puede distinguir exactamente cuál sin capturar la red del navegador afectado**.

No se agrega un diálogo artificial para "resolver" el error. La navegación válida es a \`assets/console.html?slice=...&screen=...\`, una página HTML/React real.

## Solución de compatibilidad

1. \`index.html\` deja de pedir \`assets/slices.js\` y \`assets/slices.css\`: utiliza archivos nuevos \`assets/roadmap-cloudscape-v2.js\` y \`assets/roadmap-cloudscape-v2.css\`. Cambiar la ruta fuerza una nueva búsqueda de recurso y evita combinar scripts cacheados de versiones incompatibles al cargar el HTML actualizado.
2. En cada pantalla hay **dos zonas de interacción con el mismo destino**: la vista previa HTML y el enlace claramente denominado **Explorar**. No hay gestión de diálogo por DOM.
3. Las vistas previas cargan HTML Cloudscape de forma diferida con \`IntersectionObserver\`, solo al acercarse al viewport. Hasta ese momento hay una previsualización textual informativa, no un recuadro vacío.
4. La selección del slice mantiene el foco de teclado después de redibujar la navegación, incluye \`aria-current="step"\`, conserva la URL \`#s0\`–\`#s6\` y permite volver desde la consola sin perder el corte seleccionado.
5. La portada incluye **dos enlaces HTML de S0 antes de ejecutar JS**: el error de la carga de datos no borra estos enlaces; sin JS siguen siendo navegables.
6. La carga del catálogo de cortes se revalida usando \`fetch(..., {cache:"no-store"})\` para disminuir las discrepancias entre datos y vista.
7. La consola no ejecuta AWS: los estados y acciones se simulan en memoria.

**Limitación:** si el navegador conserva *también* la versión antigua de \`index.html\`, no se puede forzar desde este nuevo HTML un cambio antes de que se descargue. Tras el merge y despliegue, una recarga completa de la página puede ser necesaria en pestañas antiguas.

## Criterios UX aplicados

Fuente del proyecto: [insumo/contexto/04-ux.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md). Fuentes de diseño: [Cloudscape Typography](https://cloudscape.design/foundation/visual-foundation/typography/), [Cloudscape Empty States](https://cloudscape.design/patterns/general/empty-states/) y la [guía comunitaria UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

- La portada contesta "¿qué cambia en cada slice?" y una tarjeta contesta la pregunta concreta de su vista; la navegación profunda lleva a componentes Cloudscape reales.
- **Color:** pocos colores, estados con texto (Nueva, Actualizada, Ya disponible) y contrastes de texto relevantes revisados: primario en fondo 13,1:1; secundarios en fondo ≥5,5:1; botón primario blanco/azul 4,82:1; metadato de step ≥4,7:1. Se mantienen las etiquetas además de color.
- **Tipografía:** fuente compatible con Cloudscape; cuerpo de 14px, secundarios de al menos 12px, jerarquía clara entre título, pregunta y etiqueta. Los códigos de requisitos no sustituyen a la pregunta de negocio.
- **Interacción:** enlaces reales, foco visible de alto contraste, 44px mínimos en botones de navegación, destino duplicado por imagen y CTA para mejorar descubribilidad, \`aria-current\` en el slice activo y comportamiento predecible de Atrás.
- **Carga y fallos:** placeholders significativos, cargado diferido para evitar múltiples instancias React innecesarias y navegación progresiva que no depende exclusivamente de JS.
- **Responsive:** rejilla de una columna en móvil, recorrido por slices horizontal, sin scroll horizontal involuntario del documento.
- **Movimiento:** se respeta \`prefers-reduced-motion\` y no hay animación como fuente exclusiva de significado.

## Regresión automatizada y revisión manual

\`tests/roadmap-v2-navigation-qa.mjs\` usa Playwright/Chromium en 1440×900, 1280×800 y 390×844 para:
- Comprobar las 7 etapas en ambas modalidades con conteos esperados.
- Verificar la selección accesible, conservación del foco y URL.
- Asegurar que no se solicita \`assets/slices.js\` (se sirve intencionalmente un script viejo que lanza error si alguien lo pide).
- Navegar por la vista previa hasta la consola React real, volver con el navegador y recuperar el slice.
- Esperar el montaje de componentes Cloudscape reales en vistas previas y guardar capturas con contenido cargado.
- Evaluar scroll horizontal y errores de JS.
- Probar que los dos enlaces iniciales persisten con JS desactivado.

En paralelo sigue la prueba integral \`tests/cloudscape-ui-qa.mjs\`, que abre las 15 vistas de consola en escritorio y móvil y ejercita sus acciones simuladas.

**Criterios que todavía exigen revisión humana:** experiencia con lectores de pantalla, zoom del navegador al 200–400 %, contraste en todos los componentes internos de Cloudscape, eficacia de los textos con usuarios de gerencia, permiso real por rol y funcionamiento contra backend real. Esta PR no afirma certificación WCAG ni funcionalidad de nube desplegada.
