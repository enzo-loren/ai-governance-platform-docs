# Estimador AWS integrado al pie de la arquitectura

La página pública `assets/arquitectura.html` vuelve a mostrar **costos por servicio** debajo del diagrama, no en una página oculta ni como una cifra de cobertura del catálogo. El acceso «Costos AWS ↓» también figura en la barra de herramientas del mapa.

## Origen y elección del modelo

Se recuperaron dos antecedentes:

- [Mapa AWS original](../assets/arquitectura-aws-original.html#costos): tres escenarios de 10.000, 300.000 y 3.000.000 de turnos, 13 partidas y totales redondeados de USD 22, 163 y 1.480 al mes. Este cuadro no incluye consumo de modelos; emplea simplificaciones de topología y recursos.
- [Arquitectura AWS auditada](../assets/arquitectura-auditada.html) y [metodología](arquitectura-aws-auditada.md#6-método-de-costo-mensual-usd-us-east-1): estimador editable que incorpora tres Lambdas (fachada, REQUEST, RESPONSE), dos API REST, dos ACL WAF, tokens referenciales de SP-03 y 10 partidas de costo explícitas.

La sección restaurada conserva **la comparación de tres escalas** del original, pero **calcula sus importes con la metodología de la auditoría**, por ser más específica respecto de la implementación examinada. Por ello, **los nuevos importes no deben presentarse como una reproducción literal de los totales históricos**.

## Supuestos iniciales y resultado reproducible

- USD/mes, región de referencia `us-east-1`, on-demand, sin impuestos ni descuentos ni free tier.
- 300.000 inferencias A/mes y 30.000 llamadas administrativas separadas. Un completion por solicitud; ninguna invocación MCP extra contabilizada.
- Modelo de referencia `gpt-oss-20b` con 1.000 tokens de entrada y 300 de salida por solicitud, usando tarifas SP-03 del 29-10-2026.
- Guardrail de contenido: 3 unidades de texto por petición (USD 0,15/1.000 unidades).
- Lambda fachada: 256 MiB × 3 s, más dos interceptores de 256 MiB × 0,15 s cada uno.
- DynamoDB: 4 WRU y 2 RRU por petición (supuesto, no consumo medido). S3: 4 KiB de evidencia y una copia PUT por petición, 1 mes equivalente. CloudWatch Logs: 2 KiB ingeridos por petición.
- Cargos fijos ilustrativos: dos WAF ACL + tres reglas USD 13, una clave KMS y un secreto USD 1,40.

**Total inicial parcial de referencia: USD 207,20/mes** (USD 207,195431956... sin redondear). Este importe no es presupuesto validado por AWS ni TCO. No incluye todo el camino de monitoreo/OTLP, MCP, identidad de usuarios, HITL ni las demás exclusiones enumeradas en la página.

El costo del AgentCore Gateway se mantiene como **hipótesis de USD 5 por millón de invocaciones** para el escenario de inferencia, siguiendo la auditoría. La tarifa oficial para operaciones documentadas del Gateway (ListTools, InvokeTool, Ping) es USD 0,005/1.000; **debe confirmarse qué operaciones de inferencia contabiliza la implementación** y no transferir esa tarifa automáticamente al tráfico del diagrama A. Fuentes: [AWS AgentCore](https://aws.amazon.com/bedrock/agentcore/pricing/), [AWS Guardrails](https://aws.amazon.com/bedrock/pricing/).

## Reglas de interpretación

1. La arquitectura interactiva superior expresa combinaciones **A / A+B / A+C / A+B+C** a nivel conceptual, no recursos desplegados por slice.
2. El estimador inferior corresponde a la implementación **auditada de inferencia A**. Al activar B o C en el diagrama no se recalculan cargos desconocidos. Las tools MCP, identidades y servicios adicionales requieren medición e hipótesis propias.
3. Las tres tarjetas de volumen usan los mismos supuestos editables, con 30.000 invocaciones administrativas fijas; al elegir una tarjeta cambia el volumen seleccionado y el desglose. La entrada de un volumen no predefinido deja todas las tarjetas sin selección.
4. Los enlaces a fuentes, exclusiones y parámetros secundarios están dentro de elementos `details` nativos: la lectura inicial prioriza cifras, costo por operación y desglose, sin ocultar la incertidumbre.

## Verificación

`tests/architecture-costs-qa.mjs` y `.github/workflows/architecture-costs-qa.yml`: Playwright/Chromium sobre página HTML real en **1440×900, 820×1000 y 390×844**. Verifica posición de la sección, diez servicios, cálculo exacto del caso base, tres volúmenes, supresión de guardrails/modelo, cambio de tokens, entrada de volumen personalizado, preservación independiente de toggles A/B/C, ausencia de errores y desbordes horizontales. Genera capturas y reporte JSON como artefactos CI.

La calculadora `assets/arquitectura-auditada.html` permanece intacta para comparación histórica y revisión de su método.
