<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 18 · Manual de Soporte

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------- |
| **Documento**        | 18 — Soporte                                                                                 |
| **Versión**          | 1.0                                                                                          |
| **Fecha**            | 14 de julio de 2026                                                                          |
| **Depende de**       | 06 · Flujo · 08 · Infraestructura · 10 · Autenticación · 12 · Seguridad · 14 · Base de Datos |
| **Lo usan**          | 19 · Operación                                                                               |
| **Confidencialidad** | Uso interno                                                                                  |

---

## 1 · Objetivo

Guía práctica para el equipo de soporte técnico y sistemas: cómo **diagnosticar** errores reportados por usuarios, dónde **buscar los logs**, cómo **descartar hipótesis** y qué **acciones correctivas** aplicar en incidentes frecuentes.

Este documento está orientado a "primera línea" — no cubre implementación. Ver [17](./17-manual-desarrollador.md) y [19](./19-manual-operacion.md) para eso.

---

## 2 · Herramientas de diagnóstico

| Herramienta                              | Cómo se accede                                                                 | Para qué sirve                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **DevTools del navegador**               | F12 en Chrome/Edge → Network / Console                                         | Ver requests, errores JS, payloads                                     |
| **`sys_logs` de MySQL**                  | phpMyAdmin del hosting → base `supermer_AplicativoSistemas` → tabla `sys_logs` | Errores del backend cPanel, warnings de auth/permisos                  |
| **Módulo Sistemas → Logs (frontend)**    | UI del aplicativo, rol admin                                                   | Consulta unificada de `sys_logs` con filtros                           |
| **`repo/logs/fallback_error.log`**       | SSH al servidor LAN                                                            | Errores del framework cuando la API central de logs no está disponible |
| **API central de logs**                  | UI del aplicativo → Sistemas → Logs con filtro `aplicacion=API_Biable_CentOS`  | Errores del framework LAN centralizados                                |
| **error_log del hosting cPanel**         | cPanel → Metrics → Errors, o `/home/<user>/logs/` vía File Manager             | Errores PHP nivel bajo (segfaults, memory errors)                      |
| **Cloudflare Analytics**                 | Dashboard Cloudflare                                                           | 5xx del origen, geografía, WAF blocks                                  |
| **`journalctl -u cloudflared`**          | SSH al servidor LAN                                                            | Estado del túnel                                                       |
| **`systemctl status apache2` / `nginx`** | SSH al servidor LAN                                                            | Estado del servidor web LAN                                            |

---

## 3 · Cómo trazar una petición de un usuario

Ya cubierto en [06 §11](./06-flujo-de-una-peticion.md). Resumen:

```sql
-- 1) Encontrar al usuario y su sesión
SELECT id, login FROM usuarios WHERE login = 'jperez';
-- Digamos que devuelve id = 42

SELECT id_usuario, LEFT(token, 8) AS token_prefix, fecha_inicio, fecha_expira
FROM sesiones
WHERE id_usuario = 42;

-- 2) Eventos del usuario en la última hora
SELECT timestamp, tipo_log, aplicacion, mensaje, ip
FROM sys_logs
WHERE usuario = 'jperez'
  AND timestamp > NOW() - INTERVAL 1 HOUR
ORDER BY timestamp DESC;

-- 3) Errores del framework LAN por ese usuario
SELECT timestamp, mensaje, stack_trace
FROM sys_logs
WHERE usuario LIKE '42 - jperez%'
  AND aplicacion = 'API_Biable_CentOS'
  AND tipo_log = 'ERROR'
  AND timestamp > NOW() - INTERVAL 1 HOUR;
```

---

## 4 · Incidentes frecuentes — guías paso a paso

### 4.1 "No puedo iniciar sesión"

**Diagnóstico:**

1. Preguntar al usuario: ¿mensaje exacto en pantalla?
2. **Si dice "Usuario o contrasena incorrectos":**
   - Verificar mayúsculas del login.
   - Verificar Caps Lock.
   - Confirmar que el usuario existe:
     ```sql
     SELECT id, login, activo FROM usuarios WHERE login = 'jperez';
     ```
   - Si existe, revisar `sys_logs`:
     ```sql
     SELECT * FROM sys_logs WHERE mensaje LIKE '%jperez%' AND timestamp > NOW() - INTERVAL 30 MINUTE;
     ```
   - Si el usuario dice haber olvidado la contraseña, **reset manual** desde AdminPanel → Usuarios (no hay flujo público de recuperación en el aplicativo interno).
3. **Si dice "Usuario inactivo":**
   - `SELECT activo FROM usuarios WHERE login = 'jperez'` → si es `0`, activarlo desde AdminPanel.
4. **Si dice "El usuario no existe":** confirmar deletreo. Si el usuario cree que sí existe, crear cuenta desde AdminPanel.
5. **Si el error es genérico "Error al iniciar sesión":**
   - Revisar `sys_logs` tipo ERROR en la última hora.
   - Verificar conectividad MySQL desde el hosting.

### 4.2 "Login Microsoft no funciona"

1. **Verificar** que el usuario tiene `correo` correcto en `usuarios`:
   ```sql
   SELECT id, login, correo FROM usuarios WHERE correo = 'user@empresa.com';
   ```
2. **Si el resultado es 0 filas** — el correo no está registrado. Actualizar desde AdminPanel.
3. **Si el resultado son 2+ filas** — conflicto de identidad (HTTP 498, ver [10 §4.2](./10-autenticacion.md)). Consolidar en una sola cuenta.
4. **Si el error viene de Azure** ("AADSTS..."), revisar:
   - Client ID y Tenant ID correctos.
   - Redirect URI en Azure debe coincidir con `VITE_MICROSOFT_REDIRECT_URI`.
   - Client secret no expirado.

### 4.3 "Se me cierra la sesión mientras trabajo"

Causas más comunes:

1. **Expiración normal (24 h).** Verificar `fecha_inicio` en `sesiones`.
2. **Login desde otro dispositivo.** El nuevo login invalida el anterior (sesión única por usuario, ver [10 §2.2](./10-autenticacion.md)).
   - Preguntar al usuario si abrió el aplicativo en otro navegador/PC.
3. **Usuario marcado inactivo por admin.** `SELECT activo FROM usuarios WHERE id = ...`.
4. **Alguien limpió `sesiones` manualmente.**

**Solución:** volver a hacer login. Si es recurrente, revisar si el usuario usa múltiples dispositivos y decidir si se necesita habilitar sesión multi-dispositivo (25).

### 4.4 "Sin permiso para X"

1. Confirmar la **ruta** del menú donde ocurre (URL en el navegador).
2. Consultar los permisos:
   ```sql
   SELECT u.login, r.nombre AS rol, c.nombre AS cargo,
          m.ruta, rm.puede_ver, rm.puede_crear, rm.puede_editar, rm.puede_eliminar,
          cm.puede_ver AS c_ver, cm.puede_crear AS c_crear
   FROM usuarios u
   JOIN roles r ON r.id = u.id_rol
   JOIN cargos c ON c.id = u.id_cargo
   JOIN menus m ON m.ruta = '/ruta/en/cuestion'
   LEFT JOIN rol_menu rm ON rm.id_rol = u.id_rol AND rm.id_menu = m.id
   LEFT JOIN cargo_menu cm ON cm.id_cargo = u.id_cargo AND cm.id_menu = m.id
   WHERE u.login = 'jperez';
   ```
3. Recordar la **lógica AND** ([11 §6](./11-autorizacion.md)): necesita `1` tanto en `rol_menu` como en `cargo_menu`.
4. Ajustar la matriz desde AdminPanel → Menús → editar el menú → permisos.
5. **Recordar al usuario:** los cambios se ven en 60 s (refresco silencioso) sin necesidad de logout.

### 4.5 "Los datos del ERP no cargan / se demora mucho"

1. **Verificar estado del framework LAN:**
   - UI del aplicativo → Sistemas → Status (o llamar directo a `/api/system/status/endpoint.php`).
   - Si retorna `offline`, saltar al §4.6.
2. **Verificar tipo de reporte.** Reportes como Recaudos pueden tardar hasta 2 min (ver [06 §4.3](./06-flujo-de-una-peticion.md)).
3. **Revisar `sys_logs`:**
   ```sql
   SELECT * FROM sys_logs
   WHERE aplicacion = 'API_Biable_CentOS'
     AND tipo_log IN ('ERROR', 'WARN')
     AND timestamp > NOW() - INTERVAL 30 MINUTE
   ORDER BY timestamp DESC;
   ```
4. **Ampliar el filtro** por usuario originador si aplica: `usuario LIKE '42 - jperez%'`.

### 4.6 "Framework LAN offline"

Verificar en orden:

1. **Túnel Cloudflared:**
   ```bash
   # SSH al servidor LAN
   sudo systemctl status cloudflared
   sudo journalctl -u cloudflared --since "10 minutes ago"
   ```

   - Si el servicio no está corriendo: `sudo systemctl start cloudflared`.
   - Si dice "connection error to Cloudflare": problema de red saliente en la oficina.
2. **Servidor web LAN:**
   ```bash
   sudo systemctl status apache2   # o nginx
   ```
3. **PostgreSQL:**
   ```bash
   sudo systemctl status postgresql
   ```
4. **PHP-FPM** (si aplica):
   ```bash
   sudo systemctl status php-fpm
   ```
5. **Prueba local desde el mismo servidor LAN:**
   ```bash
   curl -X POST http://localhost/ngrok/index.php \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <API_SECRET>" \
     -d '{"accion":"system/database_status_check"}'
   ```

   - Si funciona localmente pero no desde el hosting: problema del túnel.
   - Si falla localmente: problema del servidor web o PHP.
6. **Si es problema de PostgreSQL:**
   ```bash
   sudo -u postgres psql -c "\l"    # listar BDs
   sudo -u postgres psql -d biable01 -c "SELECT 1"
   ```

### 4.7 "El correo automático no llegó"

Ejemplos: aprobación de solicitud, alerta CVM, notificación al comprador.

1. **Verificar `sys_logs`** entradas con `mensaje LIKE '%correo%'` o `%mail%`.
2. **Verificar la casilla:**
   - Preguntar destinatario.
   - Revisar carpeta de spam.
   - Verificar que el correo del usuario esté correcto en la BD.
3. **Verificar la cuenta remitente:** `no-responder@supermercadobelalcazar.com` — si su bandeja está llena o desactivada, no podrá enviar.
4. **Verificar configuración SMTP** (`backend/api/config/correo_config.php` — ver [15 §6.4](./15-configuracion.md)). Comprobar que `host`, `port`, `username`, `password` son correctos.
5. **Comprobar log del hosting cPanel:** cPanel → Track Delivery / Email logs.

### 4.8 "El lector de precios no muestra el producto"

Aplica a los quioscos en tienda.

1. Verificar sede: cada quiosco usa una tabla distinta (`checker1`, `_2`, `_5`, `_8`, `_11`).
2. **¿El código de barras existe en la tabla correcta?**
   ```sql
   SELECT * FROM checker5 WHERE id_codbar = '7702001234567';
   ```
3. **¿La tabla está actualizada?**
   ```sql
   SELECT COUNT(*) FROM checker5;
   ```
   Si el conteo es bajo o cero → cronjob probablemente falló. Ir a §4.9.
4. **Reiniciar el navegador** del quiosco físicamente.
5. **Verificar red** del quiosco al hosting cPanel.

### 4.9 "El cronjob de precios falló"

1. **Ver el log del cronjob:**
   ```bash
   # Vía cPanel → File Manager
   /home/<user>/logs/checker_5.log
   ```
2. **Errores típicos:**
   - "Archivo no encontrado" — `CHECKER5.TXT` no llegó al hosting. Verificar el sistema que lo sube.
   - "Archivo demasiado pequeño (<1 MB)" — validación defensiva del script; el archivo llegó truncado o vacío.
   - "MySQL connection failed" — credenciales o BD abajo.
3. **Ejecutar manualmente** para diagnosticar:
   ```bash
   php /home/<user>/public_html/cron/subir_checker_mysql_5.php
   ```
4. Corregir el archivo o las credenciales.

### 4.10 "Cargar el aplicativo demora en el primer ingreso"

Esto es normal la primera vez tras un deploy — el navegador descarga los assets nuevos. Duración típica: 3–8 segundos con una buena conexión.

- Si el usuario reporta > 30 s: verificar conexión de red.
- Si es intermitente: revisar Cloudflare Analytics para 5xx desde el origen.

### 4.11 "La página se ve rota / diseño desalineado"

Casi siempre es **caché del navegador**:

1. Ctrl+Shift+R (hard reload).
2. Si persiste: DevTools → Network → Disable cache → recargar.
3. Si persiste: abrir en modo incógnito.
4. Si persiste ahí también: es problema real del deploy — revisar assets en el hosting.

### 4.12 "Al imprimir etiqueta no pasa nada"

1. **Verificar agente WebSocket:** en la máquina del usuario, buscar el icono del agente en la bandeja del sistema.
2. Si no está corriendo: iniciarlo.
3. **Verificar impresora:** encendida, con papel, sin errores en display.
4. **Verificar el puerto 8181 en localhost:**
   ```
   telnet 127.0.0.1 8181
   ```
5. **Reinstalar el agente** si nada de lo anterior funciona.

---

## 5 · Errores comunes en `sys_logs` — diccionario

| Mensaje                                      | Origen probable                          | Acción                                             |
| -------------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| `Token invalido o expirado`                  | `auth.php` — sesión caducada o eliminada | Normal, el usuario debe re-loguear                 |
| `Acceso denegado por permiso granular`       | `check_permission.php`                   | Ajustar matriz `rol_menu`/`cargo_menu`             |
| `Endpoint no encontrado`                     | Framework LAN, acción no registrada      | Verificar que el frontend usa la clave correcta    |
| `Credenciales de API invalidas`              | Framework LAN — token M2M no coincide    | Verificar sincronía `API_SECRET` ↔ `LAN_API_TOKEN` |
| `Acceso de red denegado para IP: X`          | Framework LAN — IP fuera de allow-list   | Revisar `ALLOWED_IP` en `repo/.env`                |
| `Servicio no disponible` (504)               | LanClient timeout                        | Framework LAN caído — ir a §4.6                    |
| `Fallo critico en la ejecucion del servidor` | Framework LAN, excepción no manejada     | Revisar stack trace en el mismo log                |
| `Caida catastrofica del script`              | Framework LAN, error de PHP nivel bajo   | Revisar `repo/logs/fallback_error.log`             |
| `Estructura JSON invalida o accion faltante` | Framework LAN, cliente mal formado       | Revisar el frontend / cliente que hizo la petición |

---

## 6 · Escalamiento

| Situación                      | Nivel                    | Responsable                        |
| ------------------------------ | ------------------------ | ---------------------------------- |
| Usuario individual sin acceso  | Nivel 1 — Soporte        | Ajustar permisos desde AdminPanel  |
| Módulo entero caído para todos | Nivel 2 — Sistemas       | Revisar `sys_logs` + framework LAN |
| Framework LAN offline          | Nivel 2 — Sistemas       | Revisar túnel + servidor LAN       |
| Base de datos MySQL caída      | Nivel 3 — Hosting        | Contactar proveedor cPanel         |
| PostgreSQL caído               | Nivel 3 — Equipo ERP     | Contactar equipo Siesa Biable      |
| Dominio Cloudflare caído       | Nivel 3 — Cloudflare     | Cuenta administrador Cloudflare    |
| Fuga de seguridad sospechada   | Nivel 4 — CTO / Gerencia | Ver plan de respuesta a incidentes |

---

## 7 · Reportar un bug

Formato sugerido cuando el usuario reporta:

1. **Login y sede** del afectado.
2. **URL exacta** donde ocurre.
3. **Acción intentada** ("clic en botón X", "consultar recaudos del 1 al 15").
4. **Resultado esperado** vs **resultado real**.
5. **Screenshot** o **screencast**.
6. **Hora aproximada** del incidente.
7. **Console errors** (F12 → Console) si accesible.

Con estos datos, el diagnóstico se acelera 5-10×.

---

## 8 · Preguntas frecuentes

**P: ¿Puedo tener sesión activa en dos dispositivos?**
R: No. El sistema tiene sesión única por usuario. El segundo login invalida el primero. (Ver [10 §2.2](./10-autenticacion.md).)

**P: ¿Cómo cambio mi contraseña?**
R: Perfil (arriba a la derecha) → Actualizar Perfil → cambiar contraseña.

**P: ¿Cuánto dura una sesión?**
R: 24 horas desde el login.

**P: ¿Los datos del ERP se sincronizan al momento?**
R: Los precios se sincronizan periódicamente por cronjob (cada 30 min aprox — ver [16 §9](./16-deploy.md)). Los reportes contables se consultan en tiempo real.

**P: ¿Puedo consultar desde casa?**
R: Sí, el aplicativo es accesible por internet (`aplicativo.…`). El agente de impresora **no** — solo funciona en máquinas autorizadas de las sedes.

**P: ¿Qué hago si el aplicativo entero está caído?**
R: Verificar primero conexión propia y otro sitio web. Si es el aplicativo, reportar por el canal interno con hora exacta.

---

## 9 · Referencias cruzadas

| Necesitas saber…                     | Documento                                   |
| ------------------------------------ | ------------------------------------------- |
| Flujo end-to-end de una petición     | [06 · Flujo](./06-flujo-de-una-peticion.md) |
| Autenticación y sesiones             | [10](./10-autenticacion.md)                 |
| Autorización y permisos              | [11](./11-autorizacion.md)                  |
| Cómo se despliega cada capa          | [16 · Deploy](./16-deploy.md)               |
| Operación diaria (backups, cronjobs) | [19 · Operación](./19-manual-operacion.md)  |
| Base de datos y queries útiles       | [14](./14-base-de-datos.md)                 |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 18 — Manual de Soporte · v1.0 · 14 de julio de 2026</sub>
</div>
