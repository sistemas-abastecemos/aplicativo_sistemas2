<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 12 · Seguridad

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Documento**        | 12 — Seguridad                                                                                                                    |
| **Versión**          | 1.0                                                                                                                               |
| **Fecha**            | 14 de julio de 2026                                                                                                               |
| **Depende de**       | 02 · Arquitectura · 03 · Backend · 04 · Frontend · 05 · Framework · 08 · Infraestructura · 10 · Autenticación · 11 · Autorización |
| **Lo usan**          | 25 · Refactorización · 26 · Deuda Técnica · 27 · Riesgos · 28 · Roadmap · 19 · Operación                                          |
| **Confidencialidad** | Uso interno — sensible                                                                                                            |

---

## 1 · Objetivo

Consolidar el **análisis integral de seguridad** del sistema en un solo documento: superficie de ataque, defensas existentes, vulnerabilidades observables, buenas prácticas ya aplicadas y áreas de mejora priorizadas.

Este documento **no descubre nada nuevo**: reúne evidencia ya analizada en los documentos 03, 04, 05, 08, 10 y 11, la organiza por categoría (red, credenciales, sesión, aplicación, datos) y añade el juicio de un evaluador senior sobre postura general y prioridades.

**Alcance:** aplicativo interno (`aplicativo.supermercadobelalcazar.com` + framework LAN). Fuera de alcance: seguridad del ERP Siesa Biable, del aplicativo de Proveedores adyacente, de los POS de sedes.

---

## 2 · Modelo de amenazas (síntesis)

### 2.1 Activos protegidos

| Activo                                                                  | Impacto si se compromete                                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| Credenciales de usuarios del aplicativo                                 | Suplantación de identidad, acceso a operaciones autorizadas |
| Datos del ERP (PostgreSQL) — comprobantes, notas, retenciones, recaudos | Fuga contable, riesgo regulatorio DIAN                      |
| Base MySQL del aplicativo — permisos, actas, visitantes, CVM            | Pérdida de trazabilidad, modificación no autorizada         |
| Configuración DIAN                                                      | Facturación electrónica corrupta                            |
| Endpoints de negocio (formularios, pedidos, publicidad)                 | Sabotaje operativo, pedidos fraudulentos                    |
| Token M2M (`API_SECRET` / `LAN_API_TOKEN`)                              | Acceso directo al framework LAN sin usuario                 |
| `MICROSOFT_CLIENT_SECRET`                                               | Emisión de tokens Azure falsos para el aplicativo           |

### 2.2 Actores de amenaza considerados

| Actor                                    | Motivación                          | Capacidad                               |
| ---------------------------------------- | ----------------------------------- | --------------------------------------- |
| **Empleado curioso / disgustado**        | Curiosidad, exfiltración, venganza  | Sesión válida, acceso al navegador      |
| **Empleado que sale de la organización** | Retención de datos post-despido     | Credenciales antiguas si no se revocan  |
| **Atacante externo — script kiddie**     | Oportunista                         | Escaneo de puertos, fuerza bruta básica |
| **Atacante externo — dirigido**          | Robo de datos contables, ransomware | Ingeniería social, phishing, XSS        |
| **Proveedor comprometido**               | Movimiento lateral                  | Sesión en aplicativo de proveedores     |
| **Insider con acceso a hosting**         | Modificar código o BD               | Panel cPanel, phpMyAdmin                |

### 2.3 Vectores fuera de alcance

- Ataques físicos al servidor LAN (asumen control físico de la oficina).
- Compromiso de Cloudflare como proveedor.
- Compromiso del proveedor de correo electrónico (`mail.…`).
- Ataques a Microsoft Entra (delegado a Microsoft).

---

## 3 · Postura de seguridad — evaluación general

Antes del detalle por categoría, evaluación honesta del estado actual:

| Área                            | Puntaje           | Comentario                                                                          |
| ------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| **Autenticación de usuarios**   | 🟢 Buena          | bcrypt, tokens CSPRNG, SSO Microsoft (con silent SSO desde v1.2), doble verificación por request |
| **Autenticación de aplicaciones (v1.x)** | 🟢 Buena | API keys hasheadas SHA-256, `hash_equals`, scopes, IP allowlist opcional, rate limit 30/min      |
| **Autorización**                | 🟢 Buena          | Deny by default, AND rol × cargo, sin bypass automático, revocación en vivo, scopes por API key  |
| **Aislamiento del ERP**         | 🟢 Buena          | Framework LAN + túnel Cloudflared + IP allow-list + Bearer M2M + `X-Usuario-Origen` |
| **Seguridad de red perimetral** | 🟢 Buena          | Cloudflare WAF, TLS, ningún puerto entrante en LAN                                  |
| **Gestión de secretos**         | 🟡 Regular        | Credenciales BD/SMTP hardcodeadas en PHP (DT-001, DT-002); `.env` con secretos coexisten. **API keys en v1.x ya hasheadas** |
| **Protección contra XSS**       | 🟡 Regular        | Token en `localStorage`, sin CSP declarada en las respuestas del backend legacy. **Nuevas superficies v1 ya con headers de seguridad** |
| **Rate limiting**               | 🟡 Regular        | **Aplicado en superficie pública v1 (30/min)**. Sigue faltando en `login.php` legacy (DT-005 abierto) |
| **Endurecimiento de headers**   | 🟡 Regular        | **Superficies v1 con X-Content-Type-Options, X-Frame-Options, Referrer-Policy, sin X-Powered-By**. Backend legacy sigue sin ellos (DT-015 abierto) |
| **Ocultamiento de errores**     | 🟢 Buena (v1) 🟡 Regular (legacy) | Superficies v1: `display_errors=off`, detalles nunca se filtran al cliente, solo `request_id`. Legacy pendiente |
| **Auditoría y logs**            | 🟢 Buena          | Centralización, trazabilidad usuario → ERP, contexto rico, `X-Request-ID` en v1 |
| **Rotación de secretos**        | 🔴 No documentada | `API_SECRET`, `MICROSOFT_CLIENT_SECRET`, passwords BD sin política                  |
| **Backups y recuperación**      | 🔴 No observable  | Requiere consulta a operación (doc 19)                                              |
| **Cumplimiento / retención**    | 🟡 Regular        | Logs guardan `login_intentado` — revisar retención                                  |

Interpretación: **postura sólida en las áreas críticas (auth, autorización, aislamiento del ERP)** con debilidades tácticas en gestión de secretos y protección del cliente. Ninguna vulnerabilidad crítica observada; múltiples oportunidades de endurecimiento.

**Cambio importante desde v1.x (2026-07-17):** las nuevas superficies `api/v1/public` y `api/v1/private` incorporan de inicio buenas prácticas que se recomendaban en 25 para el backend legacy — endurecimiento de headers, ocultamiento de errores, rate limiting, hash de credenciales. **El bug pattern del pasado no se propaga a código nuevo**, aunque el legacy sigue con las mismas deudas hasta que se refactorice.

---

## 4 · Seguridad de red

### 4.1 Superficie externa

Solo dos hostnames del aplicativo interno están publicados en Internet:

| Hostname                                | Puerto | Servicio detrás                       |
| --------------------------------------- | ------ | ------------------------------------- |
| `aplicativo.supermercadobelalcazar.com` | 443    | Frontend + Backend cPanel             |
| `api-biable.supermercadobelalcazar.com` | 443    | Framework LAN (vía Cloudflare Tunnel) |

Ambos pasan por Cloudflare (WAF + TLS + anti-DDoS). Ningún otro puerto está expuesto.

### 4.2 Defensas en capa de red

- **Cloudflare WAF** — reglas por defecto del plan + posibles reglas custom (no observables desde código).
- **TLS 1.2+** — terminado en Cloudflare.
- **Cloudflare Tunnel (`cloudflared`)** — publica el framework LAN sin abrir puertos entrantes en la red corporativa. **Es una fortaleza estructural clave.**
- **IP allow-list** en el framework LAN (`repo/.env` → `ALLOWED_IP`): 4 IPs autorizadas. Un compromiso del token M2M sin una IP autorizada no rinde acceso.

### 4.3 Modo TLS de Cloudflare — no observable

⚠ El modo TLS entre Cloudflare y el origin (Full / Full Strict / Flexible) **no es observable desde el código**. Es un elemento crítico:

- **Flexible:** el tráfico Cloudflare ↔ hosting va sin cifrar (visible en la ruta). **No recomendado.**
- **Full:** cifrado pero sin validación de certificado del origin. Aceptable.
- **Full Strict:** cifrado con validación. **Recomendado.**

**Acción para 19-Operación:** confirmar que ambos hostnames están en **Full Strict**.

### 4.4 CORS del backend cPanel

Allow-list explícita en `backend/api/middlewares/cors.php`:

- `http://localhost:3000`, `http://localhost:3001` — solo para desarrollo.
- `https://aplicativo.supermercadobelalcazar.com` — producción del propio aplicativo.
- `https://proveedor.supermercadobelalcazar.com` — aplicativo de proveedores adyacente.

**Observaciones:**

- ✅ Sin `*` en `Access-Control-Allow-Origin`.
- ✅ `Access-Control-Allow-Credentials: true` solo si el origen coincide con la allow-list.
- ✅ Origen no permitido queda registrado en logs.
- 🟡 Los orígenes de `localhost` no deberían estar en la lista de producción — se recomienda separar `cors.php` por entorno (o cargar la lista desde `.env`).

---

## 5 · Seguridad en la capa de aplicación (backend)

### 5.1 Ejecución de código PHP

- **PHP 7 o 8** con directivas relajadas en `.htaccess` (`upload_max_filesize=300M`, `memory_limit=512M`) — necesarias para el módulo de codificación de productos y para los cronjobs de precios.
- **`display_errors=0`** en producción (implícito por el logger central que captura excepciones) — mensajes internos no llegan al cliente.
- **`.env` protegido** por `.htaccess` en el framework LAN (`repo/.htaccess`).

### 5.2 Inyección SQL

**Postura: buena.** Todo el código usa PDO con **prepared statements**:

- `PDO::ATTR_EMULATE_PREPARES = false` en el framework LAN (`repo/core/database.php`) — asegura que las consultas se preparen en el servidor, no simuladas.
- Uso sistemático de `prepare()` + `execute([...])` o `bindParam`.
- La única interpolación dinámica observada es en `check_permission.php` sustituyendo el nombre de la columna (`puede_ver` / `puede_crear` / `puede_editar` / `puede_eliminar`) — pero el valor sale de un **mapa interno**, nunca del cliente. Es seguro.

**No se han encontrado concatenaciones de input del usuario en SQL.**

### 5.3 Inyección de comandos

**No se ha observado** uso de `shell_exec`, `exec`, `system`, `passthru` o `popen` en el código analizado. La generación de PDF y Excel se hace en proceso PHP con librerías vendorizadas — sin fork de procesos externos.

### 5.4 Deserialización insegura

**No se ha observado** uso de `unserialize()` con input del cliente. El intercambio es exclusivamente JSON con `json_decode` (safe by default).

### 5.5 Path traversal en uploads

- `backend/files/` recibe uploads del módulo Codificación de Productos (`upload_file.php`, `upload_image.php`).
- ⚠ Requiere revisión detallada en 23-Compras / Codificación Productos: verificar que el nombre de archivo se sanitize (no acepte `../`) y que la extensión se valide.
- El módulo `utils/proxy_image.php` requiere revisión análoga (¿acepta rutas arbitrarias?).

### 5.6 Ejecución de PHP arbitrario en uploads

- ⚠ Si `backend/files/**` es accesible por HTTP y Apache ejecuta `.php`, un atacante que subiera un `.php` obtendría RCE.
- **Mitigación:** verificar que `backend/files/` tenga `.htaccess` con `php_flag engine off` o `Options -ExecCGI`.
- **Acción:** revisar en 19-Operación y añadir si falta.

### 5.7 Rate limiting

- `middlewares/rate_limit.php` implementa rate limit por archivos JSON en `sys_get_temp_dir()`.
- Defaults: 30 requests / 60 s por `identifier`.
- ⚠ **No está aplicado en `login.php`** — el endpoint más crítico. Es la mitigación clave contra fuerza bruta.
- **Acción prioritaria (25):** añadir `RateLimit::check("login-" . $ip, 5, 60)` al inicio de `login.php` y `login_microsoft.php`.

### 5.8 Enmascaramiento con 404 falso (`check_role.php`)

Ver 11 §11. Es una técnica de **security-through-obscurity de bajo costo**. Aporta valor marginal contra reconocimiento automatizado, no sustituye a defensas reales.

### 5.9 Superficies API v1 — endurecimiento por defecto (2026-07-17)

Las nuevas superficies `api/v1/public` y `api/v1/private` (documentadas en [03 §5.3](./03-arquitectura-backend.md)) incorporan las siguientes protecciones como línea base:

**Endurecimiento vía `.htaccess`** — ambas superficies:

```apache
# Bloqueo de acceso directo a archivos sensibles
<FilesMatch "\.(env|log|bak|sql|md|json)$">
    Require all denied
</FilesMatch>

# Deshabilitar listado de directorios
Options -Indexes

# Cabeceras de seguridad
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header unset X-Powered-By
Header always unset X-Powered-By
```

**Diferencias entre superficies:**

| Header               | Pública                                | Privada                                |
|----------------------|----------------------------------------|----------------------------------------|
| `Access-Control-Allow-Origin` | `*` (abierto)                    | Mismo origen                           |
| `X-Frame-Options`    | No aplica (API — sin embed HTML)      | `SAMEORIGIN`                           |
| Rate limit           | 30/min por API key                     | Sin rate limit dedicado (dep. auth)    |

**Justificación del CORS abierto en pública:** la API está diseñada para consumo desde cualquier cliente. La seguridad recae en `X-API-KEY` + rate limit + HTTPS, no en CORS. Bloquear CORS solo entorpecería a integraciones legítimas.

**Ocultamiento de errores:**

```ini
; php.ini overrides al inicio del bootstrap.php
display_errors = Off
log_errors = On
```

Cualquier excepción no controlada se convierte en:

```json
{ "success": false, "meta": {...}, "error": { "code": "internal_error", "message": "Ha ocurrido un error interno" } }
```

Los detalles reales (stack trace, mensaje de excepción, query SQL fallida) **se registran en `RemoteLogger` correlacionados con el `X-Request-ID`** — accesibles solo desde el módulo de bitácora del aplicativo.

**Whitelist de `empresa`:** el parámetro `empresa` (usado para conmutar entre `biable01` y `biable02`) se valida en el controlador **antes** de propagarlo al framework LAN. Cualquier valor fuera de `['abastecemos', 'tobar']` genera `400 invalid_parameter`. Sin este whitelist, el parámetro podría inyectar nombres de bases de datos arbitrarios al framework.

**Enmascaramiento de API keys en logs:** las llaves nunca se registran completas. Formato aceptado: `sk_ab...cdef` (primeros 4 + últimos 4 caracteres).

---

## 6 · Seguridad en la capa de aplicación (frontend)

### 6.1 Almacenamiento de secretos en el bundle

**Toda variable que empieza con `VITE_` queda embebida en el bundle JS distribuido al navegador.** Consecuencia:

| Variable                                                                              | Sensibilidad | Riesgo                                                                       |
| ------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`                                                                   | Baja         | Información pública                                                          |
| `VITE_MICROSOFT_TENANT_ID`, `VITE_MICROSOFT_CLIENT_ID`, `VITE_MICROSOFT_REDIRECT_URI` | Baja         | OAuth 2.0 designa estos como públicos                                        |
| `VITE_LECTOR_PASSWORD`                                                                | **🔴 ALTA**  | Cualquiera con DevTools puede leerla — bypass del gate del lector de precios |
| `VITE_WEBSOCKET_AGENT_PRINTER`                                                        | Media        | Revela puerto local `8181`                                                   |
| `VITE_TOKEN_AGENT_PRINTER`                                                            | **🔴 ALTA**  | Cualquiera puede impersonar el frontend contra el agente de impresora        |

**Acción prioritaria (12/25):** ninguna variable de tipo "secret" debe llevar prefijo `VITE_`. Alternativas:

- Para el lector de precios: gate por endpoint backend (verificar contraseña server-side), no un compare client-side.
- Para el agente de impresora: mantener el token si el agente solo escucha en `127.0.0.1` (loopback) — el riesgo se limita a alguien con acceso a esa máquina — pero **documentar la limitación** y considerar autenticación por handshake mutuo.

### 6.2 Token de sesión en `localStorage`

- `localStorage.authToken` es accesible por cualquier script del mismo origen.
- Un **XSS exitoso** puede exfiltrar el token.
- Mitigaciones actuales:
  - **Sesión única por usuario** — un token robado deja de servir en cuanto el usuario vuelve a entrar.
  - **Expiración de 24 h** — limita la ventana de abuso.
  - **`activo=1` verificado en cada request** — permite corte manual.
- Mitigaciones **no** aplicadas:
  - No hay **Content Security Policy** declarada en las respuestas del backend.
  - No hay uso de cookies **HttpOnly**.
- **Recomendación (25):** migrar el token a cookie `HttpOnly; Secure; SameSite=Strict` con endpoint dedicado que la lea. Fase de transición: mantener el header `Authorization: Bearer` como fallback.

### 6.3 Protección XSS en tiempo de render

- **React 19** escapa por defecto los valores interpolados en JSX — buena protección base.
- Riesgo residual: uso de `dangerouslySetInnerHTML`. **No se han observado** en los archivos revisados, pero es una revisión pendiente para módulos aún no leídos (23).
- URLs y IDs de imágenes de terceros (p. ej. proxy `utils/proxy_image.php`) merecen atención adicional.

### 6.4 Content Security Policy

**No se observa CSP** en headers de respuesta. Recomendación mínima:

```
Content-Security-Policy: default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api-biable.supermercadobelalcazar.com https://login.microsoftonline.com https://graph.microsoft.com;
  frame-src 'none';
  object-src 'none';
```

Añadir en `.htaccess` o en un middleware `cors.php` extendido.

### 6.5 Headers de seguridad adicionales recomendados

| Header                      | Valor propuesto                                                          | Efecto                                                                         |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`                                    | Fuerza HTTPS                                                                   |
| `X-Content-Type-Options`    | `nosniff`                                                                | Evita MIME sniffing (ya presente en framework LAN, faltante en backend cPanel) |
| `X-Frame-Options`           | `DENY`                                                                   | Anti-clickjacking                                                              |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                        | Reduce leak de URLs                                                            |
| `Permissions-Policy`        | Restringir según features realmente usadas (webcam, camera, geolocation) | Minimiza superficie                                                            |

---

## 7 · Gestión de credenciales y secretos

### 7.1 Inventario de secretos observados

| Secreto                                          | Ubicación actual                                           | Sensibilidad              |
| ------------------------------------------------ | ---------------------------------------------------------- | ------------------------- |
| Contraseña MySQL principal (`supermer_Jonathan`) | `backend/api/config/database.php` (hardcoded)              | 🔴 Alta                   |
| Contraseña MySQL proveedores                     | `backend/api/config/database_proveedor.php` (hardcoded)    | 🔴 Alta                   |
| Contraseña SMTP `no-responder@…`                 | `backend/api/config/correo_config.php` (hardcoded)         | 🟡 Media                  |
| Contraseñas MySQL en cronjobs                    | 5 archivos `subir_checker_mysql*.php` (hardcoded)          | 🔴 Alta (multiplicada)    |
| Passwords PostgreSQL (`biable01`, `biable02`)    | `repo/.env`                                                | 🟢 Baja-Media (en `.env`) |
| `API_SECRET` / `LAN_API_TOKEN`                   | `repo/.env` + `backend/api/config/lan_api.php` (duplicado) | 🔴 Alta                   |
| API keys de la tabla `api_keys`                  | Base MySQL (encriptado no observable)                      | 🟡 Media                  |
| `LOG_API_KEY`                                    | `repo/.env`                                                | 🟡 Media                  |
| `MICROSOFT_CLIENT_SECRET`                        | `.env` del hosting cPanel (⚠ hipótesis — no visto en ZIP)  | 🔴 Alta                   |
| `VITE_LECTOR_PASSWORD`                           | Bundle JS público                                          | 🔴 Alta (ver §6.1)        |
| `VITE_TOKEN_AGENT_PRINTER`                       | Bundle JS público                                          | 🔴 Alta (ver §6.1)        |

### 7.2 Problemas identificados

**P1 · Credenciales BD en código PHP.** `backend/api/config/database.php` contiene usuario y contraseña embebidos. Si el repositorio se filtra (Git público accidental, backup mal protegido), las credenciales se comprometen.

**P2 · Duplicación del token M2M.** El mismo valor está en `repo/.env` (LAN) y en `backend/api/config/lan_api.php` (cPanel). Rotarlo requiere sincronía perfecta entre ambos ambientes.

**P3 · Sin rotación documentada.** No hay política visible de rotación periódica de:

- Contraseñas de BD.
- `API_SECRET` / `LAN_API_TOKEN`.
- `MICROSOFT_CLIENT_SECRET`.
- Contraseña SMTP.

**P4 · Secretos versionados junto al código.** `.env.bak` en `repo/` es un riesgo directo si se sirve por Apache. Aunque `.htaccess` protege `.env`, no cubre explícitamente `.env.bak`.

### 7.3 Acciones prioritarias (25/26)

1. **Migrar credenciales de `database.php`** a variables del hosting cPanel (`getenv('DB_PASS')`) o a `.env` bajo `.htaccess`. Impacto: bajo (código simple). Prioridad: **alta**.
2. **Eliminar `.env.bak`** o moverlo fuera del docroot. Trivial.
3. **Consolidar el token M2M**: leer desde una única fuente (variable de entorno del hosting) y sincronizar solo `.env` del LAN.
4. **Documentar rotación** de secretos con frecuencia sugerida (anual mínimo) y procedimiento paso a paso (doc 19).
5. **Mover `VITE_LECTOR_PASSWORD` y `VITE_TOKEN_AGENT_PRINTER`** a lugares apropiados (ver §6.1).

---

## 8 · Seguridad de la sesión

Ver 10 · Autenticación §8.

### 8.1 Puntos fuertes

- Tokens de **256 bits** con `random_bytes()` (CSPRNG del kernel).
- **Sesión única por usuario** con `INSERT ... ON DUPLICATE KEY UPDATE`.
- **Expiración de 24 h** con vencimiento server-side (`WHERE fecha_expira > NOW()`).
- **Doble verificación** en cada request (sesión + `activo=1`) → desactivación efectiva de inmediato.
- **Índice en `token` y `fecha_expira`** de la tabla `sesiones` — verificación rápida.

### 8.2 Puntos débiles

- Token en `localStorage` (ver §6.2).
- Ningún mecanismo de **refresh token** — al expirar, el usuario vuelve a loguear (aceptable).
- Sin **fingerprint del dispositivo** para detectar uso desde otro browser/IP inesperado.
- Sin **invalidación remota** por session ID sin conocer el token (útil para forzar cierre de sesión de un usuario específico desde el panel).

---

## 9 · Seguridad de datos

### 9.1 En reposo

- **MySQL cPanel:** cifrado en reposo depende del proveedor de hosting. No observable desde código. Requiere consulta a operación (doc 19).
- **PostgreSQL LAN:** cifrado en reposo depende de la configuración del servidor LAN. No observable. Requiere consulta.
- **Contraseñas de usuarios:** almacenadas como **bcrypt** (`password_hash()` de PHP). ✅ Correcto.
- **Tokens de sesión:** almacenados en claro (necesario para lookup por token). Aceptable dada la corta expiración; alternativa (hash del token en BD) mejora ligeramente la postura si el dump se filtra.

### 9.2 En tránsito

- **Cliente ↔ Cloudflare:** TLS.
- **Cloudflare ↔ cPanel:** depende del modo TLS (ver §4.3). ⚠ **Debe ser Full Strict.**
- **cPanel ↔ Cloudflare ↔ LAN:** cifrado por el túnel Cloudflared.
- **Framework LAN ↔ PostgreSQL local:** sin cifrar (`localhost`). Aceptable — no cruza red.
- **Backend cPanel ↔ MySQL local:** idem.

### 9.3 Backups

⚠ **No observable.** Se detecta que se generó un `mysqlphpmyadmin.sql` reciente (14-07-2026) con phpMyAdmin. Ese dump **contiene contraseñas hasheadas de usuarios, tokens de sesión activos y logs con datos personales**. Cualquier backup del aplicativo debe:

- Almacenarse cifrado.
- Restringir acceso al equipo de operación.
- Mantener política de retención (ej. 90 días).
- Verificarse periódicamente con restore de prueba.

**Acción para 19-Operación.**

### 9.4 Retención de datos personales

Tablas con **PII (información personal identificable)**:

- `usuarios` — `login`, `nombres_completos`, `correo`.
- `actas_entrega` — `nombre_responsable`, `email`, `telefono`, `firma_recibe` (imagen).
- `visitantes` — probablemente cédula, nombre, foto (requiere revisión doc 23).
- `sys_logs` — `login_intentado` en warnings de intento fallido → puede contener logins reales de terceros que se intentaron probar.

**Recomendación:** definir política de retención y purga. Al menos:

- `sys_logs` — mantener 6 meses, purgar el resto.
- `sesiones` expiradas — job de limpieza (ya soportado por `Session::cleanExpired`).
- `actas_entrega`, `visitantes` — conservar según requisitos legales colombianos (Ley 1581 de 2012).

---

## 10 · Logs y auditoría — postura

Ver también 05 §7 y 08 §7.

### 10.1 Puntos fuertes

- **Doble logger:** el framework LAN envía a la API central; el backend cPanel guarda en MySQL y opcionalmente en la API central.
- **Trazabilidad usuario → ERP:** header `X-Usuario-Origen` propaga la identidad del usuario final hasta los logs del framework, aunque la petición sea M2M.
- **Contexto rico** en warnings de autorización: `uid`, `rol`, `cargo`, `ruta`, `accion`.
- **Fallback local** cuando el logger central falla.
- **Persistencia estructurada** en `sys_logs` — permite queries de auditoría.

### 10.2 Puntos débiles

- **No hay monitoreo activo** observable (alertas por umbral, agregación en dashboards, SIEM).
- **`login_intentado` en `sys_logs`** — riesgo de acumular logins de terceros probados por atacantes; considerar hashear o truncar.
- **Sin correlación de eventos** entre el aplicativo y Microsoft Entra (útil para detectar patrones).
- **Sin política de rotación de la tabla `sys_logs`** — puede crecer indefinidamente.

---

## 11 · Análisis por vector de ataque (STRIDE-lite)

### 11.1 **S**poofing — suplantación de identidad

| Vector                              | Nivel    | Defensa actual                                                                 |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------ |
| Robo de contraseña por fuerza bruta | 🟡 Medio | bcrypt + doble check `activo` + logs de intento; **falta rate limit en login** |
| Robo de token por XSS               | 🟡 Medio | Token en `localStorage`; **falta CSP**                                         |
| Robo de token por MITM              | 🟢 Bajo  | TLS end-to-end (asumiendo modo Full Strict)                                    |
| Suplantación de M2M                 | 🟢 Bajo  | 3 factores requeridos (POST + IP + Bearer)                                     |
| Suplantación en SSO Microsoft       | 🟢 Bajo  | Detección de correo duplicado, cruce estricto por `correo`                     |

### 11.2 **T**ampering — alteración de datos

| Vector                                              | Nivel       | Defensa actual                                                                       |
| --------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| Modificación no autorizada de datos ERP             | 🟢 Muy bajo | Solo una acción M2M de escritura (`auditoria_dian_config_guardar`), resto es lectura |
| Modificación de menús/permisos por usuario no-admin | 🟢 Bajo     | `check_permission` con AND rol × cargo                                               |
| Manipulación de payloads en tránsito                | 🟢 Bajo     | TLS                                                                                  |
| Modificación de archivos en hosting                 | 🟡 Medio    | Depende de la seguridad de cPanel (credenciales cPanel no observables)               |

### 11.3 **R**epudiation — negación de acciones

| Vector                                  | Nivel   | Defensa actual                                                      |
| --------------------------------------- | ------- | ------------------------------------------------------------------- |
| Usuario niega haber hecho una acción    | 🟢 Bajo | Logs con `usuario` en cada evento; en el ERP vía `X-Usuario-Origen` |
| Falta de trazabilidad de administración | 🟢 Bajo | `sys_logs` con contexto rico                                        |

### 11.4 **I**nformation Disclosure — divulgación

| Vector                                                      | Nivel    | Defensa actual                                                                     |
| ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| Exposición de credenciales por leak de repo                 | 🔴 Alto  | Credenciales hardcoded en PHP                                                      |
| Exposición de tokens en bundle JS                           | 🔴 Alto  | `VITE_LECTOR_PASSWORD`, `VITE_TOKEN_AGENT_PRINTER`                                 |
| Fuga de datos por errores expuestos                         | 🟢 Bajo  | `display_errors=0` + response genérico                                             |
| Enumeración de usuarios por respuesta diferenciada de login | 🟡 Medio | El endpoint distingue "404 no existe" de "401 credenciales" — facilita enumeración |

### 11.5 **D**enial of Service

| Vector                   | Nivel    | Defensa actual                                                                       |
| ------------------------ | -------- | ------------------------------------------------------------------------------------ |
| DDoS volumétrico         | 🟢 Bajo  | Cloudflare absorbe                                                                   |
| DoS por reportes pesados | 🟡 Medio | Reportes con `statement_timeout` + `set_time_limit` — mitigado pero no perfectamente |
| DoS por login masivo     | 🔴 Alto  | **Falta rate limit en login**                                                        |
| DoS por uploads gigantes | 🟢 Bajo  | Límite 300M en `.htaccess` (razonable)                                               |

### 11.6 **E**levation of Privilege

| Vector                                               | Nivel       | Defensa actual                                                  |
| ---------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| Elevar rol tras autenticarse                         | 🟢 Muy bajo | Rol se lee de BD en cada request, no del token                  |
| Bypass de `check_permission`                         | 🟢 Muy bajo | Sin bypass automático para admin; LEFT JOIN con COALESCE(\_, 0) |
| Path traversal para acceder a archivos privilegiados | 🟡 Medio    | Requiere revisión de módulos de upload                          |

---

## 12 · Hallazgos consolidados y priorización

### 12.1 Hallazgos por severidad

**🔴 Alta (mitigar en el corto plazo — semanas)**

1. **Credenciales de BD hardcoded** en `backend/api/config/database.php`, `database_proveedor.php` y 5 cronjobs. Migrar a variables de entorno. **(Abierto — confirmado en changelog v1.x)**
2. **`VITE_LECTOR_PASSWORD` en bundle JS**. Rediseñar el gate del lector server-side. **(Abierto)**
3. **`VITE_TOKEN_AGENT_PRINTER` en bundle JS**. Reconsiderar el modelo de auth del agente. **(Abierto)**
4. **Sin rate limiting en `login.php`**. Añadir `RateLimit::check` con umbrales estrictos (5 intentos / minuto / IP). **(Abierto — pero ya aplicado en superficie pública v1 como precedente)**
5. **`.env.bak` en `repo/`** conviviendo con `.env`. Eliminar o mover fuera del docroot. **(Abierto)**

**🟡 Media (planificar en 1–3 meses)**

6. **Token de sesión en `localStorage`**. Migrar a cookie `HttpOnly; Secure; SameSite=Strict`. **(Abierto)**
7. **Sin CSP** en respuestas del backend. Añadir política mínima. **(Parcial: nuevas superficies v1 tienen headers de seguridad; legacy pendiente)**
8. **Sin `X-Frame-Options`, `HSTS`, `Referrer-Policy`** globales. Añadir en `.htaccess` o middleware. **(Parcial: superficies v1 los tienen; backend legacy pendiente)**
9. **Modo TLS Cloudflare no confirmado**. Verificar Full Strict.
10. **Enumeración de usuarios** por respuesta diferenciada en `login.php`. Uniformar el mensaje.
11. **Sin política de rotación** de `API_SECRET`, `MICROSOFT_CLIENT_SECRET`, passwords BD.
12. **Sin política de retención** en `sys_logs`. Definir purga.
13. **Migración fase 5 pendiente** (v1.x): eliminar columna `api_keys.llave` en texto plano una vez todas las apps consumidoras estén migradas a `llave_hash`.

**🟢 Baja (registrar para 28 · Roadmap)**

14. **Consolidar los dos loggers** del backend cPanel (`services/logger` vs `utils/logger`).
15. **Duplicación del token M2M** en dos lugares — considerar única fuente.
16. **Sin monitoreo activo / SIEM**. Evaluar integración con solución externa.
17. **Sin fingerprint de dispositivo** para detectar uso anómalo de sesiones.
18. **Migrar `check_role` legacy a `check_permission`** progresivamente.
19. **404 falso de LiteSpeed** — verificar si el hosting real es LiteSpeed o si conviene alinear el fingerprint.

### 12.2 Elementos a validar con operación (no observables desde código)

- Modo TLS de Cloudflare (Full Strict).
- Configuración de backups y frecuencia.
- Cifrado en reposo de MySQL cPanel y PostgreSQL LAN.
- Cronograma real de los cronjobs.
- Existencia de `.htaccess` que impida ejecución PHP en `backend/files/`.
- Contenido de `MICROSOFT_CLIENT_SECRET` y su ubicación exacta.

---

## 13 · Buenas prácticas ya aplicadas (para no perderlas en el refactor)

Este bloque documenta lo que **funciona bien** y no debe romperse en futuros cambios:

1. **`password_hash` / `password_verify`** — nunca migrar a MD5/SHA1.
2. **`random_bytes(32)`** para tokens — nunca usar `rand()` o `uniqid()`.
3. **`INSERT ON DUPLICATE KEY UPDATE`** para sesión única — mantener.
4. **Doble verificación en `auth.php`** (sesión + `activo=1`) — mantener.
5. **`AND rol × cargo`** en `check_permission` — mantener (es el modelo de negocio).
6. **Sin bypass automático para rol 1** — mantener a menos que se documente break-glass.
7. **`ALLOWED_IP`** en el framework LAN — mantener y auditar periódicamente.
8. **Cloudflare Tunnel** — mantener; es una fortaleza estructural.
9. **`X-Usuario-Origen`** en `LanClient` — mantener; es la clave de la trazabilidad end-to-end.
10. **`prepared statements` con `EMULATE_PREPARES=false`** — mantener.
11. **Logs con contexto rico** en denegaciones de permiso — mantener.
12. **Detección de correo duplicado en SSO** con HTTP 498 explícito — mantener.

---

## 14 · Hoja de ruta de mejoras (resumen)

Priorización sugerida para consolidar en 25/28:

| Sprint                    | Ítems                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sprint 1 (semana 1-2)** | Rate limit en login (item 4). Eliminar `.env.bak` (item 5).                                                                                |
| **Sprint 2 (semana 3-4)** | Migrar credenciales de BD a `.env` (item 1). Verificar modo TLS y `.htaccess` de `files/` con operación.                                   |
| **Sprint 3 (mes 2)**      | Rediseñar gate del lector de precios (item 2). Reconsiderar auth del agente de impresora (item 3). Uniformar respuesta de login (item 10). |
| **Sprint 4 (mes 3)**      | Migrar token a cookie `HttpOnly` (item 6). Añadir CSP y demás headers (items 7, 8).                                                        |
| **Ongoing (trimestral)**  | Rotación de secretos, purga de logs, revisión de allow-lists.                                                                              |

---

## 15 · Referencias cruzadas

| Necesitas saber…                              | Documento                                                       |
| --------------------------------------------- | --------------------------------------------------------------- |
| Vista de red completa                         | [08 · Infraestructura](./08-diagramas-infraestructura.md)       |
| Flujos de autenticación (usuario + SSO + M2M) | [10 · Autenticación](./10-autenticacion.md)                     |
| Modelo de autorización granular               | [11 · Autorización](./11-autorizacion.md)                       |
| Framework LAN — middleware de 3 capas         | [05 · Framework Interno §5](./05-framework-interno.md)          |
| Frontend — capa HTTP y token                  | [04 · Arquitectura Frontend §17](./04-arquitectura-frontend.md) |
| Base de datos — tablas de auditoría           | [14 · Base de Datos](./14-base-de-datos.md)                     |
| Deuda técnica priorizada                      | [26 · Deuda Técnica](./26-deuda-tecnica.md)                     |
| Riesgos consolidados                          | [27 · Riesgos](./27-riesgos.md)                                 |
| Operación (backups, rotación, monitoreo)      | [19 · Manual de Operación](./19-manual-operacion.md)            |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 12 — Seguridad · v1.0 · 14 de julio de 2026</sub>
</div>
