# Vistas incrementales por slice · Módulo A

Esta matriz documenta **qué pantalla se incorpora o cambia** en cada entrega. La fuente canónica para capacidades y dependencias es [insumo/requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml); los archivos \`insumo/slices/\` son derivados. La galería de la portada es **una propuesta visual** con datos sintéticos, no una afirmación de implementación ni una planificación de fechas.

## Regla de composición

1. La portada muestra **solo cambios del slice seleccionado** por defecto; no replica pantallas anteriores como si fueran nuevas.
2. El selector **Producto acumulado** conserva cada superficie funcional una sola vez, con su **última versión** hasta ese slice. Una modificación solo sustituye una pantalla cuando conserva todas sus tareas previas. Listado y ficha, o catálogo y ejecución por MCP, son superficies independientes.
3. Los botones dentro de la maqueta no ejecutan lógica de negocios ni llaman a AWS; los iconos de información explican qué debería hacer la función según requisitos.
4. Los requisitos de backend, interoperabilidad y QA se documentan aquí y se reflejan en contextos pertinentes, **sin inventar menús ni páginas adicionales**.
5. Los slices S0–S6 describen el **Módulo A**. B0–B3 son un agente de prueba externo y su suite; AGT-07 (chat web) es SHOULD, no interfaz obligatoria del producto.
6. El orden S0→S6 es **orden de presentación**, no un grafo de dependencias universal. En la fuente, S3, S4 y S6 no requieren todos los slices intermedios para ser técnicamente independientes: S3 depende S2; S4 depende S2; S5 depende S4; S6 depende S2. Las conexiones B y C también son independientes.

## Pantallas y cambios (sin duplicados)

| Entrega | Cambio visible | Pantalla / ID | Sustituye | Requisitos directos |
|---|---|---|---|---|
| S0 | Nueva | Alta y conexión · \`s0-connect\` | — | REG-02, CON-01, INF-01 |
| S0 | Nueva | Flujo en vivo básico · \`s0-live\` | — | CON-02, CON-03, EVD-01, NFR-05 (telemetría subyacente) |
| S1 | Nueva | Tarjeta de gobernanza · \`s1-coverage\` | — | CON-04, POL-01, POL-03 |
| S1 | Nueva | Tools autodescubiertas · \`s1-inventory\` | — | INF-02 |
| S1 | Nueva | Decisión en sombra · \`s1-shadow\` | — | INF-04, GRD-01, GRD-02, FIN-01, POL-01, POL-03 |
| S2 | Nueva | Control individual del agente · \`s2-activate\` | — | REG-01, REG-03, INF-03, INF-05, NFR-01, EVD-04, CON-08 |
| S2 | Nueva | Consumo y límites · \`s2-limits\` | — | CON-06, FIN-02 |
| S3 | Nueva | Identidad y acceso por rol · \`s3-identity\` | — | IDN-01, GRD-03 |
| S3 | Modifica | Consumo por persona · \`s3-user-spend\` | \`s2-limits\` | FIN-03 |
| S4 | Nueva | Ejecución por MCP · \`s4-mcp\` | — | MCP-01, PLT-02, GRD-04, CON-07 |
| S4 | Nueva | Constructor de reglas · \`s4-policy\` | — | POL-04 |
| S4 | Nueva | Guía A/B/C · \`s4-guide\` | — | OPS-01; POL-02 es prueba backend, no pantalla |
| S5 | Nueva | Bandeja de aprobaciones · \`s5-approvals\` | — | HITL-01, HITL-02, HITL-03, CON-05 |
| S6 | Nueva | Búsqueda de transacciones · \`s6-search\` | — | EVD-02 |
| S6 | Nueva | Ruta forense e inmutabilidad · \`s6-forensic\` | — | EVD-03, EVD-05, EVD-06 |

### Conteos de producto

| Corte | Nuevas | Modificadas | Cambios visibles | Pantallas acumuladas sin versiones obsoletas |
|---|---:|---:|---:|---:|
| S0 | 2 | 0 | 2 | 2 |
| S1 | 3 | 0 | 3 | 5 |
| S2 | 2 | 0 | 2 | 7 |
| S3 | 1 | 1 | 2 | 8 |
| S4 | 3 | 0 | 3 | 11 |
| S5 | 1 | 0 | 1 | 12 |
| S6 | 2 | 0 | 2 | 14 |

Las 15 versiones visuales representan **14 superficies de producto** a S6 (una sustitución). La actualización S3 de Consumo conserva los límites por agente y añade la edición por persona. La ficha individual S2 y la ejecución MCP S4 coexisten con el listado de agentes S0 y el catálogo de tools S1.

## Controles contra afirmaciones no sustentadas

- **S0, PLT-01, PLT-03, NFR-02/03/04/05:** CDK, proveedor simulado, aislamiento Módulo B, latencia, seguridad de IaC y OTLP son capacidades técnicas verificables, **no pantallas nuevas**. La maqueta S0 enlaza alta y flujo; muestra la telemetría como dato del flujo. Nota de consistencia: el archivo derivado \`S0-fundacion.md\` omite NFR-05 en su lista pero \`requisitos.yaml\` lo incluye como MUST; prevalece YAML.
- **S1, FIN-01:** costo, tokens y latencia ya medidos en S1; no se anticipa la edición de límites, que llega en S2. **GRD-01 y GRD-02** actúan según su semántica incluso en descubrimiento; Cedar permanece en sombra donde corresponda.
- **S2, POL-05:** simular un Preset alternativo es SHOULD. No se presenta como pantalla obligatoria. **CON-08** se representa como capacidad del control activo, no como producto separado.
- **S3, GRD-03:** la comparación de RUT/correo refiere al texto de respuesta del **modelo**, porque el control directo de resultados de **tools MCP** (GRD-04) aparece recién en S4. Sin token válido, la solicitud puede usar \`solo_workload\`, según contrato/configuración.
- **S4, POL-02:** matriz automatizada de ≥30 escenarios esperados/observados sin modelo real. No se ha inventado una página de administración de esa matriz; se menciona dentro de la guía. B parcial siempre deja fuera de puerta las tools locales.
- **S5, HITL-03:** aprobación distinta de su originador cuando hay usuario verificado (C); sin C, \`agent_token\` no es aprobador. **S5 depende de B**. Si SP-05 requiere plan B, la topología cambia; la maqueta describe el contrato deseado, no AWS desplegado.
- **S6, EVD-06:** S3 Object Lock GOVERNANCE: el intento de borrado y su rechazo son operaciones exigidas por el producto, **no se ejecutan** desde los prototipos de la web.
- **Cifras:** nombres de agentes, fechas, tokens, US$, número de solicitudes, eventos y resultados ilustrados en maquetas son ficticios. No se hacen afirmaciones de cobertura medida, resultados reales de tests o estado de entrega.

## Fuentes

- [Requisitos YAML](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml)
- [Modelo A/B/C](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/01-modelo-de-conexion.md)
- [Contrato de la puerta](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/02-contrato.md)
- [Políticas y estado](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md)
- [UX](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md)
- [Decisiones técnicas](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/05-decisiones-tecnicas.md)
- [Spikes](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/06-spikes.md)
