<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 26 · Deuda Técnica

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                                    |
| -------------------- | -------------------------------------------------- |
| **Documento**        | 26 — Deuda Técnica                                 |
| **Versión**          | 1.0                                                |
| **Fecha**            | 14 de julio de 2026                                |
| **Depende de**       | Todos los documentos previos                       |
| **Lo usan**          | 25 · Refactorización · 27 · Riesgos · 28 · Roadmap |
| **Confidencialidad** | Uso interno — sensible                             |

---

## 1 · Objetivo

**Inventariar y clasificar** toda la deuda técnica observable en el proyecto. Este documento consolida los hallazgos que quedaron dispersos por los documentos anteriores. **No propone soluciones** — eso es responsabilidad del [25 · Refactorización](./25-refactorizacion.md).

Este documento debe ser el **punto de partida** para cualquier plan de mejoras.

---

## 2 · Método de clasificación

Cada ítem de deuda se cataloga con:

| Campo                 | Valor posible                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **ID**                | `DT-<nnn>` (correlativo)                                                                  |
| **Categoría**         | Seguridad · Estructura · Datos · Performance · Duplicación · UX · Documentación · Testing |
| **Severidad**         | 🔴 Alta · 🟡 Media · 🟢 Baja                                                              |
| **Impacto**           | Descripción breve de qué se degrada si no se resuelve                                     |
| **Esfuerzo estimado** | XS (< 1 h) · S (< 1 día) · M (< 1 semana) · L (< 1 mes) · XL (> 1 mes)                    |
| **Referencia**        | Documento donde se observó                                                                |

---

## 3 · Resumen por categoría

| Categoría     | 🔴 Alta | 🟡 Media | 🟢 Baja |  Total |
| ------------- | ------: | -------: | ------: | -----: |
| Seguridad     |       5 |        4 |       2 | **11** |
| Estructura    |       2 |        5 |       3 | **10** |
| Datos         |       1 |        4 |       2 |  **7** |
| Duplicación   |       3 |        4 |       1 |  **8** |
| Performance   |       0 |        2 |       2 |  **4** |
| UX            |       0 |        2 |       1 |  **3** |
| Documentación |       0 |        1 |       2 |  **3** |
| Testing       |       1 |        1 |       1 |  **3** |
| **Total**     |  **12** |   **23** |  **14** | **49** |

Interpretación:

- **12 ítems de severidad alta** — atender en ≤ 3 meses.
- **23 ítems de severidad media** — planificar en 6–12 meses.
- **14 ítems de severidad baja** — mantener en backlog.

---

## 4 · Deuda 🔴 alta

### 4.1 Seguridad

| ID         | Item                                                                                         | Impacto                              | Esfuerzo | Ref                                                                    |
| ---------- | -------------------------------------------------------------------------------------------- | ------------------------------------ | -------- | ---------------------------------------------------------------------- |
| **DT-001** | Credenciales MySQL hardcoded en `backend/api/config/database.php` y `database_proveedor.php` | Fuga si el repo se filtra            | S        | [12 §7](./12-seguridad.md) · [15 §6.1](./15-configuracion.md)          |
| **DT-002** | Credenciales MySQL hardcoded en 5 cronjobs `subir_checker_mysql*.php`                        | Multiplicación del problema anterior | S        | [12 §7](./12-seguridad.md)                                             |
| **DT-003** | `VITE_LECTOR_PASSWORD` embebida en el bundle JS                                              | Cualquiera con DevTools la ve        | M        | [04 §15](./04-arquitectura-frontend.md) · [12 §6.1](./12-seguridad.md) |
| **DT-004** | `VITE_TOKEN_AGENT_PRINTER` embebida en el bundle JS                                          | Idem                                 | M        | [04 §15](./04-arquitectura-frontend.md) · [12 §6.1](./12-seguridad.md) |
| **DT-005** | Sin rate limiting en `/api/login.php` legacy. **🟡 Parcialmente atendido (v1.x)**: superficie pública `api/v1/public` ya con 30 req/min. Falta aplicar a `login.php`, `login_microsoft.php` | Fuerza bruta lenta posible           | XS       | [12 §11.6](./12-seguridad.md)                                          |

### 4.2 Estructura

| ID         | Item                                               | Impacto                                            | Esfuerzo | Ref                       |
| ---------- | -------------------------------------------------- | -------------------------------------------------- | -------- | ------------------------- |
| **DT-006** | Sin ambiente de staging separado                   | Cambios se prueban directamente en producción      | L        | [16 §14](./16-deploy.md)  |
| **DT-007** | Sin sistema de migraciones automatizado para MySQL | Cambios de esquema son manuales, propensos a error | M        | [16 §6.2](./16-deploy.md) |

### 4.3 Duplicación

| ID         | Item                                                                             | Impacto                               | Esfuerzo | Ref                                                                           |
| ---------- | -------------------------------------------------------------------------------- | ------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| **DT-008** | 5 endpoints `lector_precios/get_producto_b*.php` casi idénticos                  | Cualquier cambio requiere 5 ediciones | M        | [03 §17](./03-arquitectura-backend.md) · [09 §18](./09-api-endpoints.md)      |
| **DT-009** | 5 tablas `checker1..11` idénticas + 5 cronjobs `subir_checker_mysql_*.php`       | Idem, además tabla × 5 en BD          | M        | [14 §9.2](./14-base-de-datos.md) · [08 §7](./08-diagramas-infraestructura.md) |
| **DT-010** | 4 librerías de escaneo de códigos (`@zxing/*`, `html5-qrcode`, `jsqr`, `quagga`) | Bundle inflado 500–800 KB extra       | M        | [13 §3.6](./13-dependencias.md)                                               |

### 4.4 Datos

| ID         | Item                                      | Impacto                                             | Esfuerzo | Ref                                                              |
| ---------- | ----------------------------------------- | --------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| **DT-011** | Sin política de retención para `sys_logs` | Tabla crece indefinidamente, riesgo de agotar cuota | XS       | [12 §10.2](./12-seguridad.md) · [14 §5.1](./14-base-de-datos.md) |

### 4.5 Testing

| ID         | Item                                         | Impacto                                             | Esfuerzo | Ref                                     |
| ---------- | -------------------------------------------- | --------------------------------------------------- | -------- | --------------------------------------- |
| **DT-012** | Sin tests automatizados en ningún componente | Regresiones invisibles hasta que el usuario reporta | XL       | [04 §19](./04-arquitectura-frontend.md) |

---

## 5 · Deuda 🟡 media

### 5.1 Seguridad

| ID         | Item                                                                        | Impacto                               | Esfuerzo |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------- | -------- |
| **DT-013** | Token de sesión en `localStorage` (susceptible a XSS)                       | Riesgo si se introduce XSS            | M        |
| **DT-014** | Sin CSP declarada en respuestas del backend legacy. **🟡 Parcialmente atendido (v1.x)**: superficies v1 con headers de seguridad, pero CSP completa aún no                                | XSS más aprovechable                  | S        |
| **DT-015** | Sin `HSTS`, `X-Frame-Options`, `Referrer-Policy` en `.htaccess` del backend legacy. **🟡 Parcialmente atendido (v1.x)**: superficies v1 tienen `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, sin `X-Powered-By`. Falta HSTS y aplicar a backend legacy | Riesgo elevado de ataques secundarios | XS       |
| **DT-016** | Enumeración de usuarios posible por respuesta diferenciada de `login.php`   | Reconocimiento previo a ataque        | XS       |

### 5.2 Estructura

| ID         | Item                                                                                  | Impacto                                                 | Esfuerzo |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------- |
| **DT-017** | Dos generaciones de autorización conviven (`check_role` legacy vs `check_permission`) | Confusión, comportamiento inconsistente en denegaciones | M        |
| **DT-018** | Dos patrones de endpoint conviven (A vs B) sin guía formal                            | Decisiones por criterio individual del desarrollador    | S        |
| **DT-019** | `auth.php` actúa por efecto lateral (setea `$GLOBALS`)                                | Difícil de testear en aislamiento                       | M        |
| **DT-020** | Dos loggers en backend cPanel (`services/logger.php` vs `utils/logger.php`)           | Confusión sobre cuál usar                               | S        |
| **DT-021** | Duplicación de `models/proveedor.php` vs `models/provider.php`                        | Ambigüedad                                              | XS       |

### 5.3 Datos

| ID         | Item                                                                        | Impacto                                                   | Esfuerzo |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | -------- |
| **DT-022** | Foreign keys sin `CONSTRAINT` explícito en la mayoría de tablas MySQL       | Sin integridad referencial a nivel BD; huérfanos posibles | M        |
| **DT-023** | Collation mixta entre tablas (`utf8mb4_0900_ai_ci` vs `utf8mb4_unicode_ci`) | Riesgo silencioso en JOINs entre ambas                    | M        |
| **DT-024** | Convenciones `fecha_creacion` vs `created_at` conviven                      | Inconsistencia menor                                      | S        |
| **DT-025** | Vista `v_dias_conciliados` sin cuerpo documentado en 14                     | Falta claridad sobre auditoría DIAN                       | XS       |

### 5.4 Duplicación

| ID         | Item                                                                       | Impacto                      | Esfuerzo |
| ---------- | -------------------------------------------------------------------------- | ---------------------------- | -------- |
| **DT-026** | Tres librerías de íconos (`lucide-react`, `react-icons`, `@fortawesome/*`) | Bundle 150–300 KB extra      | M        |
| **DT-027** | Dos librerías Excel (`exceljs`, `xlsx`)                                    | Bundle inflado               | S        |
| **DT-028** | Tres librerías PDF (`TCPDF`, `tc-lib-pdf`, `fpdf`)                         | Vendorizadas duplicadas      | S        |
| **DT-029** | Instalación doble de PhpSpreadsheet (copia directa + Composer parcial)     | Ambigüedad sobre cuál se usa | S        |

### 5.5 Performance

| ID         | Item                                                                     | Impacto                         | Esfuerzo |
| ---------- | ------------------------------------------------------------------------ | ------------------------------- | -------- |
| **DT-030** | Sin lazy loading de rutas en el frontend                                 | Bundle inicial más grande       | S        |
| **DT-031** | `check_permission.php` hace SELECT en cada request autorizada, sin caché | Overhead pequeño pero constante | M        |

### 5.6 UX

| ID         | Item                                                                                 | Impacto                                        | Esfuerzo |
| ---------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- | -------- |
| **DT-032** | Sesión única por usuario impide uso legítimo multi-dispositivo                       | UX en usuarios que trabajan en desktop + móvil | M        |
| **DT-033** | Rutas declaradas manualmente en `App.jsx` — pueden desincronizarse con `menus` de BD | Rutas huérfanas o menús sin ruta               | M        |

### 5.7 Documentación

| ID         | Item                                                                      | Impacto                                                      | Esfuerzo |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ | -------- |
| **DT-034** | Sin OpenAPI/Swagger — el contrato de cada endpoint solo está en su código | Onboarding lento; consumidores externos dependen de leer PHP | L        |

### 5.8 Testing

| ID         | Item                                            | Impacto                                          | Esfuerzo |
| ---------- | ----------------------------------------------- | ------------------------------------------------ | -------- |
| **DT-035** | Sin monitoreo activo (Sentry, Datadog, similar) | Descubrimiento de errores por reporte de usuario | M        |

---

## 6 · Deuda 🟢 baja

### 6.1 Seguridad

| ID         | Item                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| **DT-036** | `.env.bak` en `repo/` conviviendo con `.env` — no cubierto por el bloqueo `.htaccess` |
| **DT-037** | Client secrets sin rotación documentada con calendario                                |

### 6.2 Estructura

| ID         | Item                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| **DT-038** | `password_resets` MySQL sin uso en el aplicativo interno (pertenece al de proveedores)   |
| **DT-039** | Endpoints raíz mezclados con carpetas de dominio (`login.php` fuera, `usuarios/` dentro) |
| **DT-040** | `forgot_password.php` en `backend/api/` pero pertenece a otro aplicativo                 |

### 6.3 Duplicación

| ID         | Item                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| **DT-041** | Dos librerías de animaciones (`framer-motion`, `react-transition-group`) |

### 6.4 Datos

| ID         | Item                                                                |
| ---------- | ------------------------------------------------------------------- |
| **DT-042** | Semántica de `ventas_registradas_pavas` no es clara desde el nombre |
| **DT-043** | Sin herramienta para auditar "quién puede hacer qué sobre un menú"  |

### 6.5 Performance

| ID         | Item                                                             |
| ---------- | ---------------------------------------------------------------- |
| **DT-044** | Framework LAN carga 18 `require_once` en cada request            |
| **DT-045** | Mapa `$rutas` monolítico en el framework LAN — crece linealmente |

### 6.6 UX

| ID         | Item                                                               |
| ---------- | ------------------------------------------------------------------ |
| **DT-046** | Sin refresh tokens — al expirar sesión, el usuario debe re-loguear |

### 6.7 Documentación

| ID         | Item                                                |
| ---------- | --------------------------------------------------- |
| **DT-047** | Sin decisiones arquitectónicas (ADRs) documentadas  |
| **DT-048** | Cronogramas de cronjobs no observables desde código |

### 6.8 Testing

| ID         | Item                                          |
| ---------- | --------------------------------------------- |
| **DT-049** | Sin pruebas de humo automatizadas post-deploy |

---

## 7 · Deuda por capa

Vista consolidada por ubicación física del código.

### 7.1 Frontend

- DT-003, DT-004, DT-010, DT-013, DT-026, DT-027, DT-030, DT-032, DT-033, DT-041, DT-046 → **11 ítems**

### 7.2 Backend cPanel

- DT-001, DT-002, DT-005, DT-008, DT-014, DT-015, DT-016, DT-017, DT-018, DT-019, DT-020, DT-021, DT-028, DT-029, DT-031, DT-034, DT-038, DT-039, DT-040 → **19 ítems**

### 7.3 Framework LAN

- DT-036, DT-044, DT-045 → **3 ítems**

### 7.4 Base de datos

- DT-009, DT-011, DT-022, DT-023, DT-024, DT-025, DT-042, DT-043 → **8 ítems**

### 7.5 Infraestructura y operación

- DT-006, DT-007, DT-035, DT-037, DT-048 → **5 ítems**

### 7.6 Documentación y proceso

- DT-034, DT-047 → **2 ítems**

### 7.7 Testing

- DT-012, DT-049 → **2 ítems**

---

## 8 · Deuda que se puede eliminar sin escribir código

Algunas deudas requieren solo trabajo administrativo — no cambios de código:

| ID         | Acción                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- |
| **DT-011** | Añadir job SQL mensual: `DELETE FROM sys_logs WHERE timestamp < NOW() - INTERVAL 6 MONTH` |
| **DT-036** | Eliminar `.env.bak` del framework LAN                                                     |
| **DT-037** | Documentar en agenda operativa las fechas de rotación (client secret, contraseñas)        |
| **DT-042** | Preguntar al equipo de negocio: qué es `ventas_registradas_pavas`                         |
| **DT-048** | Copiar el crontab a un documento en `docs/`                                               |
| **DT-025** | Extraer la vista `v_dias_conciliados` con phpMyAdmin y añadirla al doc 14                 |

**Estas 6 son las más baratas de resolver** — pueden hacerse en un solo sprint operativo.

---

## 9 · Deuda que requiere decisión de negocio

Algunos ítems no son técnicamente difíciles pero requieren consenso con áreas no-técnicas:

| ID         | Decisión que necesita                                                            |
| ---------- | -------------------------------------------------------------------------------- |
| **DT-032** | ¿Se permite sesión multi-dispositivo? Impacta política de seguridad              |
| **DT-046** | ¿Sesión más larga con refresh tokens? Impacta política de auditoría              |
| **DT-006** | ¿Presupuesto para ambiente de staging? Costo mensual adicional                   |
| **DT-035** | ¿Adopción de herramienta de monitoreo? Costo mensual adicional (Sentry, Datadog) |
| **DT-012** | ¿Inversión en testing? Costo en tiempo de desarrollo                             |

---

## 10 · Matriz costo × beneficio (top 20 priorizados)

Priorización sugerida usando **impacto de negocio × esfuerzo × exposición**:

| Rank | ID         | Item                                                | Score                                                     |
| ---: | ---------- | --------------------------------------------------- | --------------------------------------------------------- |
|    1 | **DT-005** | Rate limit en login                                 | Alto impacto seguridad · esfuerzo XS · exposición pública |
|    2 | **DT-036** | Eliminar `.env.bak`                                 | Trivial                                                   |
|    3 | **DT-011** | Retención `sys_logs`                                | Trivial, evita agotar cuota                               |
|    4 | **DT-015** | Añadir headers seguridad `.htaccess`                | Muy bajo esfuerzo · alto impacto                          |
|    5 | **DT-001** | Migrar credenciales BD a `.env`                     | Bajo esfuerzo · alto impacto                              |
|    6 | **DT-002** | Migrar credenciales cronjobs a `.env`               | Bajo esfuerzo · alto impacto                              |
|    7 | **DT-003** | Gate del lector precios server-side                 | Impacto alto seguridad                                    |
|    8 | **DT-016** | Uniformar respuesta de login                        | Bajo esfuerzo · reduce enumeración                        |
|    9 | **DT-014** | Añadir CSP básica                                   | Bajo esfuerzo · mitiga XSS                                |
|   10 | **DT-004** | Reconsiderar auth del agente de impresora           | Impacto moderado                                          |
|   11 | **DT-009** | Consolidar `checker1..11` en una sola tabla         | Ahorro significativo de mantenimiento                     |
|   12 | **DT-008** | Consolidar `lector_precios/*` en un endpoint        | Idem                                                      |
|   13 | **DT-013** | Migrar token a cookie HttpOnly                      | Impacto alto seguridad · esfuerzo M                       |
|   14 | **DT-022** | Declarar FKs con CONSTRAINT                         | Integridad de datos                                       |
|   15 | **DT-023** | Uniformar collation MySQL                           | Preventivo                                                |
|   16 | **DT-021** | Consolidar `models/proveedor.php` vs `provider.php` | Claridad                                                  |
|   17 | **DT-006** | Ambiente de staging                                 | Requiere presupuesto                                      |
|   18 | **DT-007** | Sistema de migraciones (Phinx/Flyway)               | Reduce riesgo de despliegue                               |
|   19 | **DT-034** | Adoptar OpenAPI/Swagger                             | Facilita onboarding y consumidores                        |
|   20 | **DT-012** | Empezar a introducir tests                          | Empezar por hooks y utilitarios puros                     |

---

## 11 · Deudas cerradas recientemente

Para preservar el historial y no repetir esfuerzos:

- ✅ **Refactor de `api.js` centralizado en `utils/http/`** — completado antes de la generación de esta documentación (evidencia: presencia de `utils/http/*` en frontend).
- ✅ **Extensión del sistema de permisos** de checkbox binario a permisos granulares con `check_permission.php` — completado (11 §4).
- ✅ **Consolidación del logger central** con endpoint `logs/ingest.php` — completado (05 §7).

---

## 12 · Referencias cruzadas

| Necesitas…                                                      | Documento                                       |
| --------------------------------------------------------------- | ----------------------------------------------- |
| Ver plan de refactorización priorizado con soluciones concretas | [25 · Refactorización](./25-refactorizacion.md) |
| Ver riesgos arquitectónicos y de negocio                        | [27 · Riesgos](./27-riesgos.md)                 |
| Ver roadmap propuesto                                           | [28 · Roadmap](./28-roadmap.md)                 |
| Análisis de seguridad detallado                                 | [12 · Seguridad](./12-seguridad.md)             |
| Convenciones del proyecto                                       | [22 · Convenciones](./22-convenciones.md)       |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 26 — Deuda Técnica · v1.0 · 14 de julio de 2026</sub>
</div>
