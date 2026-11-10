# Ajustes de alta y flujo: modelos autorizados y acción de detalle

## Contrato normativo

**Fuentes:** [`insumo/contexto/03-politicas-y-estado-inicial.md` §5 y §7](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md) y [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml): `REG-02`, `INF-01`, `INF-03` y `PLT-03`.

| Comportamiento exigido | Implementación del prototipo |
|---|---|
| `modelos_permitidos` es una lista del catálogo, por defecto **todos** | S0 permite seleccionar varios modelos y los guarda en `modelos_permitidos: string[]`. S2 conserva el mismo formato al editar la ficha. |
| En modo activo se rechaza cualquier modelo fuera de la lista | La UI permite editar la lista y muestra advertencias; **no ejecuta inferencia ni verifica rechazo 403**. |
| El catálogo proviene de la configuración y determina proveedor, destino y tarifa | El prototipo mantiene un catálogo fijo exclusivamente ilustrativo, sin afirmar que corresponde a proveedores registrados en AWS. |
| El proveedor simulado solo existe si `simulado.habilitado` | La función `getModelCatalog(simulatedEnabled)` lo excluye cuando la opción es falsa. En la demo queda habilitado para representar pruebas. |
| El cliente indica el modelo en cada llamada por `model` | No se añadió un supuesto «modelo predeterminado de inferencia» al agente; la selección representa **autorización**, no el modelo de cada solicitud. |

**Nombres explícitos pedidos para la demo:** *GPT-6 Luna (DEMO)* y *Claude 5.5 Haiku (DEMO)*. Sus IDs (`demo-gpt-6-luna`, `demo-claude-5-5-haiku`) **no son identificadores reales de modelo, no confirman disponibilidad comercial, ni aseguran soporte en Amazon Bedrock**. En producción deben reemplazarse por el catálogo de modelos realmente configurados.

## Error visual de TRC-0103

La última columna de la tabla de flujo tenía un ancho declarado de 70 px, insuficiente en una tabla de siete columnas; en resoluciones estrechas la palabra «Ver» podía aparecer partida en letras verticales. Se definió una anchura estable para el detalle, se impidió el corte de palabras en el botón y se habilitó desplazamiento **dentro de la tabla**, sin desbordar la página. Las tarjetas móviles mantienen su botón «Detalle».

## Pruebas de regresión

`tests/model-selection-flow-qa.mjs` se ejecuta desde `incremental-functional-qa.mjs` en CI. Comprueba el catálogo con simulado habilitado/deshabilitado, selección inicial de todos, multiselección S0 y conservación al entrar en S2, botones y apertura de TRC-0103, ausencia de texto vertical y desbordamiento en **1440, 820 y 390 px**.

Esta es una verificación de UI con datos sintéticos: no acredita conectividad, precios, disponibilidad de los modelos ni enforcement real de `INF-03`.
