<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 19 · Manual de Operación

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Documento**        | 19 — Operación                                                                          |
| **Versión**          | 1.0                                                                                     |
| **Fecha**            | 14 de julio de 2026                                                                     |
| **Depende de**       | 08 · Infraestructura · 12 · Seguridad · 15 · Configuración · 16 · Deploy · 18 · Soporte |
| **Lo usan**          | Sistemas · TI                                                                           |
| **Confidencialidad** | Uso interno                                                                             |

---

## 1 · Objetivo

Guía **operacional continua** del sistema en producción: backups, actualizaciones, monitoreo, cronjobs, rotación de secretos y ciclo de mantenimiento periódico. Este documento es la referencia diaria del área de Sistemas.

---

## 2 · Panorama — dónde vive cada cosa

| Recurso operacional             | Vive en                           | Acceso                    |
| ------------------------------- | --------------------------------- | ------------------------- |
| Frontend estático + Backend PHP | Hosting cPanel                    | Panel cPanel + SFTP       |
| MySQL del aplicativo            | Hosting cPanel                    | phpMyAdmin + MySQL client |
| Cronjobs                        | Hosting cPanel                    | cPanel → Cron Jobs        |
| Correo saliente                 | `mail.supermercadobelalcazar.com` | cPanel → Email            |
| Framework LAN + PostgreSQL      | Servidor LAN interno              | SSH                       |
| Cloudflared daemon              | Servidor LAN                      | SSH + systemd             |
| DNS + tunnel                    | Cloudflare Dashboard              | Cuenta admin Cloudflare   |
| App OAuth Microsoft             | Azure Portal                      | Cuenta admin Entra ID     |
| Agente WebSocket                | PCs individuales de sedes         | Instalador MSI            |

---

## 3 · Backups

### 3.1 MySQL del aplicativo

**Estrategia recomendada:**

- **Diario:** backup automático de `supermer_AplicativoSistemas` — cPanel dispone de JetBackup o Backups en la mayoría de planes.
- **Semanal:** dump manual con phpMyAdmin (Export → SQL) para tener una copia offsite.
- **Retención:** 30 diarios + 12 semanales + 12 mensuales.

**Comando de dump manual desde SSH del hosting** (si está habilitado):

```bash
mysqldump -u supermer_Jonathan -p supermer_AplicativoSistemas \
  --single-transaction --quick --lock-tables=false \
  | gzip > /home/<user>/backups/aplicativo-$(date +%Y%m%d).sql.gz
```

⚠ **Con `sys_logs` creciendo indefinidamente, el dump crece cada mes.** Ver §7 para política de purga.

**Restauración:**

```bash
gunzip < backup.sql.gz | mysql -u <user> -p supermer_AplicativoSistemas
```

Probar restauración **al menos una vez al trimestre** con backup a una BD alternativa (`supermer_AplicativoTest`).

### 3.2 PostgreSQL del ERP

**Fuera del control directo del aplicativo** — es responsabilidad del equipo del ERP Siesa Biable. Coordinar con ellos:

- Frecuencia (recomendado diario).
- Ubicación de los backups.
- Procedimiento de restauración.
- Prueba periódica.

⚠ Documento aquí (a completar): fecha del último backup verificado, responsable, ubicación.

### 3.3 Framework LAN

El código del framework debe estar en Git. Los archivos `logs/` no necesitan backup (son ephemeral). El `.env` **sí** debe estar respaldado en un vault (Bitwarden, 1Password, o similar) — nunca en Git.

### 3.4 Frontend + Backend PHP

El código fuente debe estar en Git. El **build** (`dist/`) se regenera. Los archivos runtime (`backend/files/**`, `backend/images/**`) sí necesitan backup:

- Backup semanal a otro servidor o a un bucket externo.
- Contienen: fotos de codificación de productos, evidencias CVM, archivos de solicitudes, `CHECKER*.TXT` reciente.

### 3.5 Configuración (`.env` y `config/*.php`)

- Los `.env` de producción **no deben estar en Git**.
- Guardar copia cifrada en un vault.
- Rotar credenciales que aparezcan expuestas (ver §5).

---

## 4 · Actualizaciones

### 4.1 Sistema operativo (Servidor LAN)

- **Frecuencia:** mensual para parches de seguridad.
- **Ventana:** fuera de horario comercial (después de las 22:00 o domingos).
- **Precaución:** reiniciar `cloudflared` y verificar el túnel tras el reboot.

```bash
sudo dnf update -y    # Rocky/CentOS
# o
sudo apt update && sudo apt upgrade -y   # Debian/Ubuntu

sudo reboot

# Después del reboot
sudo systemctl status cloudflared
sudo systemctl status apache2   # o nginx
sudo systemctl status postgresql
```

### 4.2 PHP

- Mantenerse en versión **soportada** (7.4 EOL noviembre 2022, ya vencido; 8.1 EOL diciembre 2025; 8.2 EOL diciembre 2026; 8.3+ recomendado).
- **Antes de cambiar versión:** probar en staging con todas las librerías vendorizadas.
- Aplicar via MultiPHP Manager en cPanel; en LAN vía paquetes del SO.

### 4.3 Dependencias frontend (npm)

```bash
cd frontend
npm outdated
npm update              # updates minor + patch
npm audit fix           # vulnerabilidades
# Para majors, revisar CHANGELOG de cada dependencia
```

- **Frecuencia:** mensual para audit; trimestral para majors.

### 4.4 Librerías vendorizadas del backend

Sin gestor. Procedimiento manual:

1. Suscribirse a las release notes de las 7 librerías (13 §5).
2. Al aparecer CVE crítico:
   - Descargar la nueva versión.
   - Comparar diffs con la actual.
   - Reemplazar la carpeta en `backend/utils/`.
   - Probar los módulos que la usan (Separatas → Excel, Retenciones → PDF, etc.).

**Recomendado (25):** migrar a Composer.

### 4.5 cloudflared

Cloudflare actualiza el binario ocasionalmente. Comando en Rocky/CentOS:

```bash
sudo dnf install cloudflared    # si viene por repo oficial
# o descarga manual del release en GitHub
sudo systemctl restart cloudflared
```

### 4.6 Cliente OAuth Microsoft

Client secret **expira periódicamente**. Ver [16 §10.2](./16-deploy.md):

1. En Azure Portal, crear un nuevo secret **antes** de que expire el actual.
2. Actualizar el `.env` del backend.
3. Verificar login SSO.
4. Eliminar el secret viejo.

**Fechas críticas** a tener en la agenda operacional:

- Expiración del secret actual.
- 30 días antes: recordatorio para rotar.

---

## 5 · Rotación de secretos

Frecuencia sugerida:

| Secreto                                         | Frecuencia                             | Notas                                          |
| ----------------------------------------------- | -------------------------------------- | ---------------------------------------------- |
| Contraseña MySQL cPanel                         | Anual                                  | Cambiar en cPanel + en `config/database.php`   |
| Contraseñas PostgreSQL (`biable01`, `biable02`) | Anual                                  | Coordinado con equipo ERP                      |
| `API_SECRET` / `LAN_API_TOKEN`                  | Anual                                  | Cambio sincrónico en dos lugares               |
| `MICROSOFT_CLIENT_SECRET`                       | Automática por Azure (12 meses típico) | Rotar antes de que expire                      |
| Contraseña SMTP `no-responder@…`                | Anual                                  | cPanel → Email → cambiar password              |
| `LOG_API_KEY`                                   | Anual                                  | Cambiar en `sys_logs`.`api_keys` + `repo/.env` |
| Keys en `api_keys` (aplicativo proveedor, etc.) | Anual                                  | Coordinado con cada consumidor                 |

### 5.1 Procedimiento estándar de rotación

1. **Anunciar** ventana de mantenimiento a usuarios.
2. **Generar** el nuevo secret (`openssl rand -hex 32` para tokens, contraseñas fuertes para BD).
3. **Actualizar** todas las ubicaciones del secret (ver §5.2 para el checklist específico).
4. **Verificar** que todo funciona con el nuevo valor.
5. **Documentar** la fecha en la agenda operativa.

### 5.2 Cheatsheet — dónde cambiar cada secret

**Password MySQL:**

- cPanel → MySQL → Change Password.
- `backend/api/config/database.php` → `$password`.

**`API_SECRET` (token M2M):**

- `repo/.env` en LAN → `API_SECRET=`.
- `backend/api/config/lan_api.php` → `LAN_API_TOKEN`.
- Reiniciar Apache/PHP-FPM en LAN (para forzar recarga si hay OpCache).

**`MICROSOFT_CLIENT_SECRET`:**

- Azure Portal → App registration → Certificates & secrets → New client secret.
- Backend `.env` del hosting → `MICROSOFT_CLIENT_SECRET`.

**Password SMTP:**

- cPanel → Email Accounts → Manage → Change Password.
- `backend/api/config/correo_config.php` → `password`.

---

## 6 · Cronjobs — supervisión

### 6.1 Inventario y frecuencia esperada

Ver [08 §7](./08-diagramas-infraestructura.md) y [16 §9](./16-deploy.md).

| Cronjob                         | Frecuencia esperada | Verificación de éxito                              |
| ------------------------------- | ------------------- | -------------------------------------------------- |
| `subir_checker_mysql*.php` (×5) | Cada 30 min         | `SELECT COUNT(*) FROM checker1` > 1000 y creciendo |
| `verificar_registros_cvm.php`   | Diario 08:00        | Log `correo_log.txt` con éxito diario              |

### 6.2 Monitoreo diario recomendado

Cada mañana:

1. **Revisar logs de cronjobs** en `/home/<user>/logs/`.
2. **Verificar el conteo de las tablas `checker*`:**
   ```sql
   SELECT
     (SELECT COUNT(*) FROM checker1) AS c1,
     (SELECT COUNT(*) FROM checker2) AS c2,
     (SELECT COUNT(*) FROM checker5) AS c5,
     (SELECT COUNT(*) FROM checker8) AS c8,
     (SELECT COUNT(*) FROM checker11) AS c11;
   ```
   Los conteos deberían ser similares (varían un poco por catálogo de sede).
3. **Verificar que el correo diario de CVM llegó** (si aplica).

### 6.3 Fallos comunes

Ver [18 §4.9](./18-manual-soporte.md).

---

## 7 · Limpieza y retención de datos

### 7.1 `sys_logs`

- **Crecimiento estimado:** varias miles de filas por día.
- **Riesgo:** sin política de retención, la tabla crece indefinidamente hasta agotar cuota.
- **Recomendación:** purgar registros > 6 meses.

**Job manual mensual:**

```sql
DELETE FROM sys_logs WHERE timestamp < NOW() - INTERVAL 6 MONTH;
OPTIMIZE TABLE sys_logs;
```

**Alternativa mejor:** particionar por mes (25/28).

### 7.2 Sesiones expiradas

Aunque las requests con tokens expirados devuelven `401` automáticamente, es sano purgar filas viejas:

```sql
DELETE FROM sesiones WHERE fecha_expira < NOW() - INTERVAL 30 DAY;
```

Ejecutar semanal.

### 7.3 Archivos de uploads sin referencia

Los archivos en `backend/files/**` referenciados por solicitudes rechazadas o eliminadas pueden quedar huérfanos.

⚠ **Sin herramienta automatizada aún.** Recomendación (25): script mensual que:

1. Liste todos los archivos en `backend/files/**`.
2. Consulte todas las columnas `ruta_archivo`, `foto_anverso`, `foto_reverso`, `archivo_adjunto` de las tablas relevantes.
3. Elimine (o mueva a `_orphan/`) los que no coincidan.

### 7.4 `password_resets`

Tabla del aplicativo de proveedores adyacente. Debe purgarse por su cuenta.

---

## 8 · Monitoreo

### 8.1 Métricas mínimas recomendadas

Aún **sin monitor centralizado automatizado**. Recomendación (28):

| Métrica                            | Fuente                            | Umbral de alerta               |
| ---------------------------------- | --------------------------------- | ------------------------------ |
| Uptime del framework LAN           | health check `/api/system/status` | 3 fallos consecutivos → alerta |
| Latencia PostgreSQL                | health check                      | > 3s → alerta (offline)        |
| Latencia MySQL                     | monitoreo del hosting             | > 500ms sostenido              |
| Espacio disco cPanel               | cPanel Home                       | > 80%                          |
| Espacio disco servidor LAN         | `df -h`                           | > 80%                          |
| Estado cronjobs                    | logs `checker*.log`               | error 2 ejecuciones seguidas   |
| Cloudflared                        | `systemctl status`                | inactive                       |
| Certificados TLS                   | Cloudflare                        | expira en < 14 días            |
| Errores tipo `ERROR` en `sys_logs` | query                             | > 20/hora                      |
| Sesiones activas                   | `SELECT COUNT(*) FROM sesiones`   | inusualmente alta (ataque)     |

### 8.2 Alertas manuales — dashboard interno

El propio aplicativo expone algunas métricas:

- **Módulo Sistemas → Logs** — consulta filtrable.
- **Módulo Sistemas → Status** — health check del framework LAN.

Se sugiere una vista diaria de estas dos.

### 8.3 Herramientas externas sugeridas

- **UptimeRobot / Pingdom** — monitoreo externo del uptime.
- **Sentry** — recolección centralizada de errores frontend + backend (integración futura, 28).
- **Grafana + Prometheus** — para métricas de servidor LAN si crece la infraestructura.

---

## 9 · Ciclo de mantenimiento

### 9.1 Diario

- [ ] Revisar logs de cronjobs.
- [ ] Verificar conteo de tablas `checker*`.
- [ ] Ojear `sys_logs` de ERROR de la última noche.

### 9.2 Semanal

- [ ] Backup manual dump MySQL (redundancia al automático).
- [ ] Revisar espacio disco en cPanel y LAN.
- [ ] Purgar `sesiones` expiradas.
- [ ] Backup de `backend/files/**` y `backend/images/**`.

### 9.3 Mensual

- [ ] Actualizar sistema operativo del servidor LAN.
- [ ] Purgar `sys_logs` viejos.
- [ ] Revisar `npm audit` y `dependencies` outdated en frontend.
- [ ] Verificar restauración de backup MySQL (a BD test).
- [ ] Revisar allow-list IP del framework LAN (Cloudflare a veces rota rangos).

### 9.4 Trimestral

- [ ] Prueba end-to-end de restauración de backup.
- [ ] Revisión de vulnerabilidades de librerías vendorizadas.
- [ ] Revisión de permisos por rol y cargo.
- [ ] Auditoría de usuarios inactivos (`activo=1` pero sin login > 6 meses).

### 9.5 Anual

- [ ] Rotación de contraseñas de BD.
- [ ] Rotación de `API_SECRET`.
- [ ] Rotación de contraseña SMTP.
- [ ] Renovación de client secret Microsoft (si no expiró ya automáticamente).
- [ ] Revisión completa del plan de seguridad (12).

---

## 10 · Plan de respuesta a incidentes

### 10.1 Incidente de seguridad (sospecha de acceso indebido)

1. **Contención:**
   - Cambiar contraseñas del usuario comprometido.
   - Ejecutar `DELETE FROM sesiones` para forzar re-login de todos.
   - Si es sospecha de `API_SECRET` comprometido: rotarlo inmediatamente (§5.2).
2. **Investigación:**
   - Buscar en `sys_logs` accesos anómalos por IP, usuario o patrón horario.
   - Revisar Cloudflare Firewall Events.
3. **Documentación:**
   - Registrar el incidente con fecha, causa, acciones tomadas.
   - Actualizar procedimientos si aplica.
4. **Escalamiento:** informar a Gerencia.

### 10.2 Caída total del framework LAN

1. Aplicar checklist §4.6 de [18](./18-manual-soporte.md).
2. Comunicar a usuarios: "Los reportes contables están temporalmente no disponibles. Los módulos administrativos siguen operativos."
3. Meta de recuperación: **< 30 minutos**.

### 10.3 Corrupción de BD MySQL

1. **Detener escrituras**: bloquear login desde la UI (modo mantenimiento).
2. Contactar hosting para posible restauración desde snapshot.
3. Si aplica, restaurar backup semanal.
4. Notificar pérdida de datos entre el backup y el momento del incidente.

### 10.4 Ataque DDoS

- Cloudflare debería absorber la mayoría.
- Si supera capacidad del plan actual: activar "Under Attack Mode" en Cloudflare.
- Contactar soporte Cloudflare.

---

## 11 · Documentos operacionales a mantener actualizados

Junto con este manual, mantener actualizados:

- **Agenda de expiración de secretos** (client secret, certificados TLS, passwords rotativos).
- **Registro de accesos administrativos** al hosting, servidor LAN, Cloudflare, Azure.
- **Registro de incidentes** cerrados con causa y solución.
- **Lista de personal técnico** con niveles de acceso.
- **Contactos de proveedores** (hosting, Cloudflare, equipo ERP Siesa, Microsoft partner si aplica).

---

## 12 · Referencias cruzadas

| Necesitas saber…                                | Documento                                                 |
| ----------------------------------------------- | --------------------------------------------------------- |
| Cómo se despliega cada capa                     | [16 · Deploy](./16-deploy.md)                             |
| Cómo diagnosticar problemas específicos         | [18 · Soporte](./18-manual-soporte.md)                    |
| Infraestructura completa                        | [08 · Infraestructura](./08-diagramas-infraestructura.md) |
| Análisis de seguridad y prioridades de rotación | [12 · Seguridad](./12-seguridad.md)                       |
| Configuración por archivo                       | [15 · Configuración](./15-configuracion.md)               |
| Deuda técnica priorizada                        | [26 · Deuda Técnica](./26-deuda-tecnica.md)               |
| Roadmap propuesto                               | [28 · Roadmap](./28-roadmap.md)                           |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 19 — Operación · v1.0 · 14 de julio de 2026</sub>
</div>
