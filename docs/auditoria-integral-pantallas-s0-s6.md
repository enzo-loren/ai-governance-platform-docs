# Auditoría integral de pantallas S0–S6 (2026-11-09)

**Objeto:** las 15 versiones HTML interactivas del roadmap, agrupadas en 12 superficies.  
**Fuente normativa:** [insumo/requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), [modelo de conexiones](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/01-modelo-de-conexion.md) y [UX objetivo](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md).  
**Límite:** inspección de prototipos, no validación de backend ni certificación de seguridad.

## Resumen

No se identificó la necesidad de crear una pantalla adicional para cada requisito. La estructura de 12 superficies/15 versiones es suficiente para mostrar los hitos; sí se detectaron controles y estados omitidos dentro de varias pantallas.

La corrección prioriza **acciones reales para el operador**, **escenarios de falla** y **evidencia interpretable**, antes que texto explicativo. Se mantienen Cloudscape, la interfaz limpia por defecto, la ayuda opcional, los cambios por slice y la navegación desde el roadmap.

## Matriz por pantalla

| Pantalla | Exigencia esencial y resultado auditado | Acción de esta revisión / límite |
|---|---|---|
| S0 · Alta | REG-02: agente único, key por agente, mostrar una vez, rotar/revocar en S2 | **Conforme visualmente desde la corrección previa**; emisión/hash/revocación reales requieren servidor |
| S0 · Flujo en vivo | CON-03/EVD-01: evento, actor, decisión, costo, evidencia y latencia de visibilidad | **Conforme para demo**; tráfico, persistencia y <3 s no verificables aquí |
| S1 · Cobertura | CON-04: índice *medido* + máximo alcanzable, modo, días, evidencia y próximo paso | **Corregido:** el valor 41 % queda como techo teórico de A en activo, la DEMO indica **sin datos** para índice medido; métricas p50/p95 y consumo claramente sintéticas |
| S1 · Inventario | INF-02: esquema, clase sugerida, confirmación humana, aprobación, cambio de versión | **Corregido:** revisión de clase/aprobación, marca de esquema v2 de muestra y tarjetas móviles; automatización real pendiente |
| S1 · Sombra | POL-03, GRD-01/02: evaluación sin cortar negocio y motivos por regla | **Adecuado como simulación**; faltan pruebas reales con ejemplos E-03/E-04 en backend |
| S2 · Agente activo | REG-01/03, INF-03/05, POL-05: modo, suspensión, modelo, Preset, impacto antes de aplicar | **Corregido:** comparar Preset candidato antes de guardar; cifras solo ilustrativas. Persistencia y simulación sobre evidencia reales pendientes |
| S2 · Consumo/límites | FIN-02/CON-06: cuota de agente, USD, tokens, tasa, período, acción 429/403/alerta | **Adecuado visualmente** desde la corrección previa; faltan alertas observadas y p50/p95 verificadas |
| S3 · Identidad | IDN-01/GRD-03: JWT válido/ausente/inválido, degradación, PII por rol | **Adecuado para demo**; validaciones de JWKS/iss/aud/exp son backend |
| S3 · Consumo persona | FIN-03/E-10: límites individuales y prueba de que rebasar uno no afecta a otro | **Corregido:** editor y prueba de 429/403 por usuario, con perfil **solo_workload** imputado a agente; ambos resultados son simulados |
| S4 · Tools MCP | MCP-01, HITL-01, CON-07: clase, aprobación, supervisión, destino, cobertura parcial, uso | **Corregido:** nivel de supervisión y aprobación editables, clase y uso de muestra; sin fingir que MCP gobierna ejecución local |
| S4 · Políticas | POL-04/POL-02: constructor + editor, versionado y matriz | **Adecuado para prototipo:** editor Cedar como borrador sin validación ni despliegue |
| S4 · Guía | OPS-01: A/B/C con snippets, `X-Gov-Trace-Id`, pasos según conexiones y controles | **Corregido:** guía por agente, cabeceras C y trazabilidad, incrementos **máximos referenciales** y advertencia de B parcial |
| S5 · Aprobaciones | CON-05/HITL-03: actor distinto, enmascaramiento, vencimiento, comentario, contexto, enlace, historial | **Corregido:** contador temporal de demo, PII según permiso, texto de confirmación, comentario, historial y enlace forense de muestra |
| S6 · Buscar | EVD-02: filtros combinables, selección de transacción, tiempo de búsqueda | **Corregido:** resultados móviles en tarjetas con acceso directo al caso; consulta real <5 s pendiente |
| S6 · Forense | EVD-03/05/06: regla/configuración versionadas, ruta, retención y prueba Object Lock | **Corregido:** retención ilustrativa, bypass explícito, rol de prueba y resultado **esperado**, nunca resultado real de AWS |

## Riesgos de interpretación

1. **Índice 41 % ≠ cobertura medida:** se muestra como máximo condicional del catálogo con A y modo activo; un agente en descubrimiento con tráfico no verificado debe aparecer «sin datos».
2. **A ≠ control de ejecución de tools locales:** la conexión B/MCP gobierna solo targets registrados. Describir una denegación en sombra como ejecución bloqueada es incorrecto.
3. **A/B ≠ C:** el `agent_token` es identidad del agente en ambos canales; `X-Gov-User-Token` aporta identidad del usuario y no autentica el tramo usuario→agente.
4. **Cuotas por usuario ≠ cuota por agente:** sin C se usa `solo_workload`; solo los principales válidos reciben cuotas individuales.
5. **Aprobación simulada ≠ ejecución real:** se necesitará conservar argumentos, validar roles, plazos e idempotencia en backend, ejecutar por MCP y registrar evidencia.
6. **Object Lock GOVERNANCE ≠ inmutabilidad absoluta:** un rol privilegiado con permiso de bypass es una excepción; la acción demo no intenta borrar objetos reales.
7. **Cifras sintéticas ≠ datos medidos:** todas las solicitudes, tokens, latencias, costos y porcentajes de demostración deben estar diferenciados.

## Pendientes de implementación, no de maqueta

- Gestión real de credenciales: secreto solo visible al emitir, hash en repositorio seguro, dos tokens temporalmente válidos, revocación ≤60 s por agente y canales A/B.
- Validar identidad OIDC de C: issuer, JWKS, audiencia, expiración y respuesta configurada ante token incorrecto.
- Medición de costos y latencias p50/p95 por agente/modelo/usuario/canal y tarifas versionadas; alertas de cuota 50/80/100.
- Clasificación con anotaciones MCP/HTTP, esquema versionado, revisión humana y acceso real a targets registrados.
- Evaluación Cedar contra tipos/esquemas, matriz de ≥30 escenarios y comparación de Presets usando contextos de evidencia.
- HITL: retención, cuenta regresiva basada en servidor, bloqueo de autoaprobación, límites, idempotencia y ejecución autorizada por MCP.
- Auditoría: búsqueda indexada, texto íntegro y versión de la regla histórica, correlación observada, S3 Object Lock y retención comprobada.
- Pruebas de accesibilidad con teclado/lector de pantalla y contraste visual final; las suites Chromium son verificaciones de interfaz, no auditoría WCAG completa.

## Criterios de publicación de la maqueta

- Compilar React/Vite desde el commit y verificar integridad del bundle versionado.
- Pasar recorridos de **15 pantallas × escritorio/móvil**, roadmap, modos de ayuda y navegación.
- Pasar el test **específico de completitud** para clasificación S1, Preset S2, cuotas S3, supervisión y guía S4, aprobación S5 y búsqueda S6.
- Inspeccionar capturas completas en desktop y móvil para detectar elementos cortados, desbordes, duplicación de contenido o abuso de advertencias.
- Mantener PR como borrador hasta evaluación del autor; no asumir backend AWS conectado.
