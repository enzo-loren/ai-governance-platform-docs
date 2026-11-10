# Prototipo navegable Cloudscape · trazabilidad de diseño

## Carácter del artefacto

La portada (\`index.html\`) es un **roadmap ejecutivo incremental**. Cada tarjeta contiene una vista previa **HTML** de la misma aplicación React utilizada por la consola (\`assets/console.html\`). «Navegar» abre una ruta real con estado en URL: \`?slice=S4&screen=s4-mcp\`. **No se muestran PNG ni capturas** como mecanismo de navegación.

La aplicación usa \`@cloudscape-design/components\`, \`@cloudscape-design/global-styles\`, React y un bundle estático versionado en \`assets/console-build/\`; no depende de un servidor de aplicaciones para GitHub Pages. \`assets/console-data.json\` es el registro compartido por la portada y la consola, de modo que la selección de slice y el menú lateral no pueden divergir por tablas de pantallas independientes.

**Importante:** los datos, las identidades, los saldos, las aprobaciones, los errores y los estados son sintéticos. Los botones son **interactivos en memoria** (o guían a otra vista) pero no ejecutan AWS ni un motor de políticas. Un estado actualizado en el prototipo no prueba cumplimiento funcional del requisito.

## Referencia normativa de UX

Fuente canónica: [insumo/contexto/04-ux.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md). Se aplicaron sus reglas:

- Una pregunta por vista; el título principal de cada pantalla es esa pregunta.
- Recorrido de resumen a detalle: navegación lateral → vista → fila/situación → explicación contextual.
- Estado **con palabra y motivo**, no solo color. Se mantienen explícitos los estados que no representan cobertura (fuera de la puerta, sin identidad, simulación).
- Nivel 1 redactado en lenguaje de negocio; información técnica desplazada a \`¿Qué significa?\` / \`¿Por qué?\` o al segundo nivel.
- No adelantar funciones: la navegación depende del slice; S0 no muestra MCP ni auditoría.
- Las operaciones críticas tienen confirmación, estado y explicación. Las operaciones del prototipo no usan servicios reales.
- Estados vacíos y errores muestran información de recuperación o límites.

La fuente canónica de **comportamiento** sigue siendo [insumo/requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), por encima de maquetas o documentación derivada.

## Componentes genuinos

Basado en la [documentación oficial de Cloudscape](https://cloudscape.design/get-started/for-developers/using-cloudscape-components/): \`AppLayout\`, \`TopNavigation\`, \`SideNavigation\`, \`ContentLayout\`, \`Header\`, \`Container\`, \`Table\`, \`TextFilter\`, \`FormField\`, \`Input\`, \`Select\`, \`Modal\`, \`Alert\`, \`StatusIndicator\`, \`ProgressBar\`, \`Tabs\`, \`Toggle\`, \`KeyValuePairs\`, \`CopyToClipboard\`, \`Flashbar\`, \`Badge\` y utilidades. La capa propia sólo organiza la portada, los KPI y los eventos narrativos, dentro de los límites permitidos por \`04-ux.md\` §7.

## Revisión adicional de diseño frontend (skill de comunidad)

Se contrastó la UI con la skill pública [Frontend Design · PracticalSwan](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/SKILL.md), en particular sus criterios de accesibilidad como requisito no negociable, jerarquía del contenido, adaptabilidad, interacción completa y comprobación en navegador. Se adoptó también la secuencia propuesta por [better-web-ui/frontend-design](https://github.com/aladicf/better-web-ui/blob/main/skills/frontend-design/SKILL.md): claridad y jerarquía en escala de grises, escala limitada de tipografía y espaciado, color solo para significado semántico, divulgación progresiva y controles reconocibles.

Aplicación concreta: componentes Cloudscape reales en vez de figuras estáticas, respuestas y estados con icono más texto, acciones con confirmación visible, rutas sin páginas falsas, tests de Chrome en escritorio/móvil y tarjetas para aprobaciones en móvil (la tabla de escritorio estrechaba el nombre de la operación). Una prueba automática sin errores **no certifica** contraste AA, accesibilidad completa ni fidelidad de implementación; estas verificaciones continúan siendo parte de la aceptación del producto.

## Skill de comunidad usada como revisión

[UI/UX Pro Max — referencia de comunidad](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/templates/base/quick-reference.md): prioridad de accesibilidad, acciones con foco visible y nombre accesible, tamaño táctil, un sistema de iconos consistente, tipografía legible, márgenes y agrupación, colores semánticos, navegación predecible, acciones con feedback y reducción de movimiento. No se importó código de esta skill: se usó su guía pública como checklist junto con las reglas de Cloudscape y las de \`insumo/contexto/04-ux.md\`.

## Trazabilidad por slice

Las 15 versiones siguen el mapeo detallado de [slices-vistas-trazabilidad.md](slices-vistas-trazabilidad.md): en la portada solo se muestran las novedades, y «Producto acumulado» deja únicamente la versión más reciente de cada superficie (14 superficies al cerrar S6; 15 entregas y una sola actualización de Consumo S2→S3). El catálogo y MCP, y el listado y ficha individual, coexisten. S0–S6 son pantallas del Módulo A; B0–B3 son un banco de pruebas externo. A es obligatoria; B y C son independientes. Los controles técnicos que no requieren una pantalla propia no se convierten artificialmente en menú.

## Comportamiento verificable en prototipo

- Navegación por \`?slice=&screen=\`, enlaces de pantalla y menú lateral, con historial del navegador.
- Selección de usuario/rol que actualiza la respuesta de muestra en la vista de identidad.
- Filtrado de flujo, herramientas y búsqueda forense; detalle de filas.
- Edición simulada de límites, reglas y conexiones MCP, con mensajes de confirmación.
- Confirmaciones simuladas de activación/suspensión y aprobaciones.
- Tabs de la guía A/B/C y fragmentos copiables.
- Modales de explicación y de «probar inmutabilidad» que **no** llaman S3.

## Revisión antes de merge

Se entrega un workflow de Playwright que comprueba las 15 pantallas en escritorio y móvil, navegación desde la portada, uso real de componentes Cloudscape, render, errores JavaScript, profundidad de enlaces y ausencia de scroll horizontal involuntario. Sus capturas permiten inspección humana.

La inspección automatizada, incluso si pasa, **no certifica** WCAG ni prueba correspondencia visual perfecta con la futura implementación. Las revisiones de contraste con tecnología de asistencia, roles reales, semántica de autorizaciones y backend quedan como tareas de implementación y aceptación del producto.
