# Guías de conexión B y C — guía multicloud de identidad

**Fecha:** 2026-11-10. **Página:** [assets/guias-conexion.html](../assets/guias-conexion.html). **Alcance:** guía conceptual para equipos Solutions Architect; no certifica implementación ni despliegue. **Estado:** conexión C documentada; guía B señalada como pendiente.

## Arquitectura de información

- La portada añade «Guías de conexión» al mismo grupo de enlaces que Consola navegable, Arquitectura AWS y Requisitos.
- La guía muestra dos conexiones: B · Tools MCP (pendiente) y C · Identidad del usuario (disponible). No inventar capacidades ni instrucciones de B hasta redactar esa guía.
- C comienza con tres preguntas (usuario, tipo/audiencia del token, propagación), un mapa de ocho patrones, filtros AWS/Azure/GCP/híbrido, pasos por escenario, contrato, pruebas de aceptación y fuentes oficiales.
- La clasificación baja/media/alta es **cualitativa y condicional**. No se infieren días de trabajo ni equivalencias absolutas entre clouds.

## Fuentes vinculantes y separación entre norma y recomendación

- [insumo/requisitos.yaml](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), especialmente IDN-01, GRD-03, FIN-03 y CTRL-26.
- [01-modelo-de-conexion.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/01-modelo-de-conexion.md): C es optativa, por solicitud, independiente de B. El salto usuario→agente queda fuera del perímetro.
- [02-contrato.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/02-contrato.md): Authorization Bearer agent_token, X-Gov-User-Token con JWT access token, validaciones, rechazo/degradación y MCP.
- [03-politicas-y-estado-inicial.md](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md): cliente aceptado por agent_id, mapeos de roles, solo_workload y configuraciones por defecto.

La guía distingue una **recomendación de endurecimiento** del contrato vigente: el contrato acepta client_id **o** aud de la lista configurada; RFC 9068 exige aud del resource server para un JWT access token conforme a ese perfil. No se modifican requisitos canónicos mediante este PR, y se deja visible como decisión de arquitectura pendiente. No afirmar compatibilidad directa con cualquier JWT OIDC.

## Base técnica por escenario

| Caso | Hecho verificable | Dependencia para C | Fuente oficial |
|---|---|---|---|
| Cognito User Pools | Access tokens incluyen client_id y pueden incluir aud cuando se solicita resource binding mediante OAuth managed login | Token adecuado para el recurso, propagación en backend | https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-define-resource-servers.html |
| ECS/EKS con IdP externo | Runtime AWS no determina el formato del token de usuario | Access token JWT apropiado, vínculo con solicitud | https://www.rfc-editor.org/rfc/rfc9068.html |
| ALB authenticate-oidc | x-amzn-oidc-data es un JWT de claims firmado por ALB; x-amzn-oidc-accesstoken no está firmado por ALB | Token OAuth válido emitido para recurso previsto | https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-authenticate-users.html |
| Entra ID | OBO permite que API middle-tier obtenga token delegado para downstream API | Registro de API, scopes, consentimiento, OBO si aplica | https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow |
| Firebase / Identity Platform | Firebase ID token tiene aud de proyecto Firebase | Access token delegado para nuestro recurso | https://firebase.google.com/docs/auth/admin/verify-id-tokens |
| GCP IAP | x-goog-iap-jwt-assertion es una assertion firmada para el backend protegido por IAP | Intermediación de identidad autorizada | https://docs.cloud.google.com/iap/docs/signed-headers-howto |
| SAML / legado | Cognito User Pools puede federar con IdPs SAML y emitir JWT de su user pool | Federación y flujo OAuth de aplicación | https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-saml-idp.html |
| Workload-only | El principal sin usuario se maneja como solo_workload en el producto | C no aplica si no hay usuarios humanos | 01-modelo-de-conexion.md |

## Criterio de QA

1. La portada contiene un enlace relativo a assets/guias-conexion.html dentro de header-nav y conserva los tres enlaces previos.
2. La guía incorpora una sección B claramente pendiente y una sección C completa, sin simular B.
3. Existen ocho ejemplos, cada uno con nube, clasificación, condición, pasos y fuente.
4. El filtro por nube oculta/restaura tarjetas mediante hidden, conserva atributo aria-pressed y anuncia cantidad visible.
5. Referencias, enlaces internos y navegación relativa son correctos en un despliegue Pages bajo el subdirectorio del repositorio.
6. La página advierte explícitamente la diferencia entre access token, ID token, assertion y token de servicio, y diferencia recomendaciones de requisitos implementados.

**Pendiente externo al PR:** revisión visual end-to-end en browser y, si procede, discusión de cambio de contrato para audience/resource binding. El flujo Pages ya copia assets/ completo; no requiere cambiar workflow de despliegue.
