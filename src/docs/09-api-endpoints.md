<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 09 · APIs — Catálogo de Endpoints

**Documentación técnica — Aplicativo SEAO**

</div>

---

| | |
|---|---|
| **Documento** | 09 — APIs |
| **Versión** | 1.0 |
| **Fecha** | 14 de julio de 2026 |
| **Depende de** | 02 · Arquitectura · 03 · Backend · 05 · Framework · 10 · Autenticación · 11 · Autorización |
| **Lo usan** | 06 · Flujo · 17 · Manual del Desarrollador · 18 · Soporte · 23 · Módulos |
| **Confidencialidad** | Uso interno |

---

## 1 · Objetivo

Catalogar **todos los endpoints** expuestos por el sistema: ~110 endpoints del backend cPanel legacy + 3 endpoints en la superficie `api/v1/public` + 2 endpoints en la superficie `api/v1/private` + 33 acciones del framework LAN (30 originales + 3 añadidas en v1.x: `general/listar_proveedores`, `general/buscar_proveedores_biable`, `general/buscar_proveedor_id`). Se documentan por dominio, con método HTTP, ruta, propósito, parámetros esperados, respuesta típica y códigos de error específicos.

Este documento es una **referencia de consulta**, no un tutorial. Está pensado para copiar-pegar rápidamente al implementar un nuevo cliente o al depurar una integración.

---

## 2 · Convenciones globales

### 2.1 Ruta base

- **Backend cPanel:** `https://aplicativo.supermercadobelalcazar.com/api/`
- **Framework LAN:** `https://api-biable.supermercadobelalcazar.com/ngrok/index.php` (único endpoint, se dispatcha por campo `accion` del cuerpo JSON)

### 2.2 Cabeceras estándar

**En toda petición del frontend al backend cPanel:**

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token de sesión 64 hex>
```

Excepciones: `POST /api/login.php`, `POST /api/login_microsoft.php` y `POST /api/verify_token.php` (para el arranque del frontend) no requieren el header Bearer para su lectura o lo consumen del body.

### 2.3 Cuerpo estándar de respuesta

Éxito:

```json
{
  "success": true,
  "message": "...",         // opcional
  "data": { ... }           // o el payload en la raíz según el endpoint
}
```

Fallo (regla general):

```json
{
  "success": false,
  "message": "..."
}
```

### 2.4 Códigos HTTP comunes en el backend cPanel

| Código | Uso genérico |
|---|---|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `400` | Payload inválido, campos faltantes, tipo de dato incorrecto |
| `401` | No autenticado (token faltante, inválido o expirado) |
| `403` | Autenticado pero sin permisos suficientes (`check_permission`) |
| `404` | Recurso o endpoint inexistente |
| `405` | Método HTTP no permitido |
| `409` | Conflicto (ej. login duplicado, sesión inválida por concurrencia) |
| `498` | Conflicto de identidad en SSO (múltiples usuarios con el mismo correo) |
| `500` | Error no controlado (log INFO/ERROR con stack trace) |
| `504` | Timeout hacia el framework LAN |

### 2.5 Códigos HTTP del framework LAN

Ver [05 · Framework Interno §8](./05-framework-interno.md). Resumen:

| Código | Cuerpo | Motivo |
|---|---|---|
| `200` | `{ "resultado": ... }` | Operación exitosa |
| `400` | `{ "error": "..." }` | JSON inválido / falta `accion` |
| `401` | `{ "error": "Credenciales de API invalidas" }` | Token M2M inválido |
| `403` | `{ "error": "Acceso de red denegado..." }` | IP no autorizada |
| `404` | `{ "error": "Endpoint no encontrado" }` | Acción no registrada |
| `405` | `{ "error": "Metodo HTTP no permitido" }` | Método ≠ POST |
| `500` | `{ "error": "Fallo critico..." }` | Excepción no controlada |

### 2.6 Autenticación por endpoint — anotación

En las tablas de este documento se usa la siguiente notación en la columna **Auth**:

- `—` — Sin autenticación (raro; solo pantallas públicas como lector de precios).
- `Bearer` — Requiere token de sesión válido (middleware `auth.php`).
- `Bearer + Permiso` — Requiere sesión + permiso granular por `check_permission.php`. Se indica la ruta+acción cuando aplica.
- `Bearer + Rol` — Requiere sesión + rol específico por `check_role.php` (endpoints legacy).
- `M2M` — Requiere autenticación máquina-a-máquina (solo framework LAN).
- `X-API-KEY + Scope` — **(v1.x)** Requiere header `X-API-KEY` cuyo hash SHA-256 coincida con un registro en `api_keys` activo, con el scope apropiado. Aplica exclusivamente a la superficie `api/v1/public`.

### 2.7 Envelope estándar de las superficies v1

Introducido en v1.x (2026-07-17) para las superficies `api/v1/public` y `api/v1/private`. Toda respuesta de estas superficies sigue este formato uniforme:

**Éxito:**

```json
{
  "success": true,
  "meta": {
    "request_id": "req_abc123def456",
    "timestamp": "2026-07-17T14:38:12Z"
  },
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "meta": {
    "request_id": "req_abc123def456",
    "timestamp": "2026-07-17T14:38:12Z"
  },
  "error": {
    "code": "unauthorized",
    "message": "API key inválida o inactiva"
  }
}
```

**El header `X-Request-ID` se propaga** en la respuesta HTTP y también aparece en `meta.request_id`. Es la clave para correlacionar logs remotos con incidentes reportados por el consumidor.

Los endpoints legacy (`/api/…` sin prefijo `v1`) **conservan su formato original** (`{success, message, data}`) — no se rompió compatibilidad.

---

## 3 · Superficies API v1 — introducidas en 2026-07-17

Dos nuevas superficies coexisten con el catálogo legacy documentado en las secciones siguientes:

- **`api/v1/public`** — **de solo lectura**, consumo externo (front-ends terceros, servidores, scripts, Postman). Autenticación por `X-API-KEY` + scope. Rate limit **30 peticiones por minuto por aplicación**. CORS abierto (`*`) — la seguridad recae en la key + rate limit + HTTPS.
- **`api/v1/private`** — **consumo interno exclusivo** de la propia app SEAO. Reutiliza el sistema de sesión (`auth.php`) + permisos granulares (`check_permission.php` vía `requirePermiso`). No usa API keys. CORS restringido a mismo origen (`X-Frame-Options: SAMEORIGIN`).

Ambas superficies comparten núcleo (`bootstrap.php`, `Response.php`, `Controller.php`) y el envelope estándar (§2.7). Documentado en [03 §API v1](./03-arquitectura-backend.md).

### 3.1 · `api/v1/public` — endpoints

| Método | Ruta | Auth | Scope | Propósito |
|---|---|---|---|---|
| `GET` | `/api/v1/public/proveedores` | `X-API-KEY` | `comercial.proveedores` | Listado paginado de proveedores. Delegado al framework LAN vía `LanClient` (acción `general/listar_proveedores`) |

**Contrato de respuesta simplificado** (para consumidores externos que no necesitan todos los campos del ERP):

```json
{
  "success": true,
  "meta": { "request_id": "...", "timestamp": "...", "empresa": "abastecemos" },
  "data": [
    {
      "nit": "890305234-1",
      "sucursal": "001",
      "nombre": "Proveedor Demo S.A.S.",
      "codBanco": "007",
      "banco": "Bancolombia",
      "diasPgo": 30,
      "condPgo": "CO",
      "porcDscto": 2.5
    }
  ]
}
```

**Parámetros de query soportados:**

- `empresa` — `abastecemos` (default) o `tobar`. **Whitelist estricto** — cualquier otro valor devuelve `400`.
- `q` — texto de búsqueda por código/NIT o descripción (delega en `general/buscar_proveedores_biable`).
- `id` — combinación de código + sucursal para buscar un proveedor puntual (delega en `general/buscar_proveedor_id`).

### 3.2 · `api/v1/private` — endpoints

| Método | Ruta | Auth | Permiso | Propósito |
|---|---|---|---|---|
| `GET` | `/api/v1/private/proveedores` | `Bearer` | `/comercial/proveedores · ver` | Idem que el público pero para uso interno del SPA |
| `GET` | `/api/v1/private/proveedores/buscar?q=...` | `Bearer` | `/comercial/proveedores · ver` | Búsqueda por término |

Comparten repositorio con la superficie pública (`ProveedoresRepo` del core LAN — ver [05 §12](./05-framework-interno.md)) pero pasan por autorización granular en vez de scope de API key.

### 3.3 · Router enriquecido

Ambas superficies usan un router basado en tabla enriquecida:

**Público:**

```php
[Controlador, método, módulo, métodos_http, scope]
```

**Privado:**

```php
[Controlador, método, módulo, métodos_http, moduloRutaPermiso, accionPermiso]
```

Validación temprana de método HTTP y de existencia del handler **antes** de instanciar el controlador (patrón de router-check-early).

### 3.4 · Códigos de error específicos de las superficies v1

| Código | `error.code` | Cuándo |
|---|---|---|
| `401` | `unauthorized` | X-API-KEY ausente, inválida o inactiva |
| `403` | `forbidden_scope` | La API key existe pero no tiene el scope requerido |
| `403` | `forbidden_ip` | La IP del cliente no está en `ips_permitidas` |
| `429` | `rate_limited` | Excedió 30 req/min |
| `400` | `invalid_parameter` | ej. `empresa` fuera del whitelist |
| `500` | `internal_error` | Excepción no controlada — detalles nunca se filtran, solo `request_id` |

**Los detalles de la excepción PHP nunca aparecen en el cuerpo HTTP.** `display_errors` está desactivado. Cada error queda registrado en `RemoteLogger` correlacionado con su `request_id`.

---

## 4 · Endpoints raíz — autenticación

Los cinco endpoints en la raíz del backend cPanel gestionan el ciclo de vida de la sesión. Cubiertos en profundidad en [10 · Autenticación](./10-autenticacion.md).

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `/api/login.php` | — | Login local con `login` + `password`. Devuelve `user` + `token`. |
| `POST` | `/api/login_microsoft.php` | — | Intercambio de código OAuth de Microsoft 365 por sesión local. Body: `{code, redirect_uri}`. |
| `POST` | `/api/verify_token.php` | Bearer | Consulta el usuario asociado al token actual (arranque del frontend). |
| `POST` | `/api/logout.php` | Bearer o token en body | Elimina la fila de `sesiones` correspondiente. Idempotente. |
| `POST` | `/api/forgot_password.php` | — | ⚠ Pertenece al aplicativo de Proveedores (ver 10 §10). No en uso desde el aplicativo interno. |

### 3.1 Ejemplos

**Login local — request:**

```http
POST /api/login.php
Content-Type: application/json

{ "login": "jperez", "password": "mi_secreto" }
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": 42, "login": "jperez", "nombres_completos": "Juan Pérez",
    "correo": "jperez@…", "id_rol": 3, "id_cargo": 12,
    "id_sede": "005", "id_area": 3,
    "cargo_nombre": "Auxiliar Contable", "sede_nombre": "Belalcázar 5",
    "area_nombre": "Contabilidad", "activo": 1
  },
  "token": "a3f9c…64hex…"
}
```

---

## 5 · Administración — usuarios, roles, áreas, cargos, sedes, proveedores

Todos siguen el patrón **CRUD "un archivo por operación"** (Patrón A del documento 03 §5.1).

### 4.1 Usuarios (`/api/usuarios/`)

| Método | Ruta | Auth | Body / Query |
|---|---|---|---|
| `POST` | `create_usuario.php` | Bearer + Permiso `/configuracion/usuarios` · `crear` | `{login, password, correo, nombres_completos, id_rol, id_cargo, id_sede, id_area, activo}` |
| `POST` | `get_usuarios.php` | Bearer + Permiso `/configuracion/usuarios` · `ver` | (sin body) — devuelve lista con joins |
| `POST` | `update_usuario.php` | Bearer + Permiso `/configuracion/usuarios` · `editar` | `{id, ...campos a actualizar}` — si viene `password` se re-hashea con `password_hash` |

⚠ **No hay endpoint `delete_usuario.php`.** El borrado se hace por soft delete (`activo=0`) vía `update_usuario.php`. Documentado como pendiente en README §3.2.

### 4.2 Roles (`/api/roles/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_roles.php` | Bearer | Lista de roles del catálogo (id, nombre, descripcion, activo) |
| `POST` | `get_acciones_usuario.php` | Bearer | Consulta las acciones rápidas y funcionalidades especiales del usuario en sesión — consumido por `useDynamicMenu` |

### 4.3 Áreas (`/api/areas/`)

| Método | Ruta | Auth | Body |
|---|---|---|---|
| `POST` | `create_area.php` | Bearer + Permiso `/configuracion/areas` · `crear` | `{nombre}` |
| `POST` | `get_areas.php` | Bearer + Permiso `/configuracion/areas` · `ver` | — |
| `POST` | `update_area.php` | Bearer + Permiso `/configuracion/areas` · `editar` | `{id, nombre}` |

### 4.4 Cargos (`/api/cargos/`)

Patrón idéntico a áreas, sobre la ruta `/configuracion/cargos`.

### 4.5 Sedes (`/api/sedes/`)

Patrón idéntico, sobre `/configuracion/sedes`. Campos: `{id_sede (varchar), nombre, ciudad}`.

### 4.6 Proveedores (`/api/proveedores/`)

CRUD sobre `cmproveedores` (mirror del ERP en MySQL). Sobre ruta `/configuracion/proveedores`.

---

## 6 · Menús (`/api/menu/`)

Núcleo del control de acceso frontend (ver [11 · Autorización](./11-autorizacion.md)).

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_menu_user.php` | Bearer | Devuelve el **árbol jerárquico** de menús para el usuario en sesión, con permisos granulares embebidos (`puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar`) — filtrado por rol × cargo × empresa (`abastecemos`/`tobar`) |
| `POST` | `get_menus.php` | Bearer + Permiso `/configuracion/menus` · `ver` | Listado plano de todos los menús (para administración) |
| `POST` | `create_menu.php` | Bearer + Permiso `/configuracion/menus` · `crear` | `{nombre, ruta, icono, id_menu_parent, orden, abastecemos, tobar}` |
| `POST` | `update_menu.php` | Bearer + Permiso `/configuracion/menus` · `editar` | `{id, ...campos, matriz_permisos: [...]}` — actualiza el menú y toda su matriz `rol_menu`/`cargo_menu` en una transacción |
| `POST` | `update_bulk_order.php` | Bearer + Permiso `/configuracion/menus` · `editar` | `{items: [{id, orden}]}` — actualización masiva del orden tras drag-and-drop |

### 5.1 Formato de respuesta de `get_menu_user.php`

Ver [11 · Autorización §8.1](./11-autorizacion.md). Estructura recursiva:

```json
[
  {
    "id": 3,
    "nombre": "Configuración",
    "ruta": "#",
    "icono": "cog",
    "orden": 1,
    "abastecemos": 1,
    "tobar": 1,
    "children": [
      {
        "id": 4,
        "nombre": "Menús",
        "ruta": "/configuracion/menus",
        "icono": "list",
        "orden": 1,
        "puede_ver": 1,
        "puede_crear": 1,
        "puede_editar": 1,
        "puede_eliminar": 0,
        "children": []
      }
    ]
  }
]
```

---

## 7 · Perfil del usuario (`/api/perfil/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_usuario.php` | Bearer | Datos del usuario en sesión (con joins) |
| `POST` | `update_user.php` | Bearer | Actualiza campos permitidos del propio usuario (nombres, correo, `contrasena` opcional) |

---

## 8 · Informes (`/api/informes/`)

Gestión de los "dashboards embebidos" (BI externos vía URL — ver [14 · BD §5](./14-base-de-datos.md)).

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_informes.php` | Bearer | Lista de informes visibles para el usuario según `informe_area` e `informe_cargo` |
| `POST` | `create_informe.php` | Bearer + Permiso `/configuracion/informes` · `crear` | `{titulo, descripcion, id_area, url, color, orden, areas: [id], cargos: [id]}` |
| `POST` | `update_informe.php` | Bearer + Permiso `/configuracion/informes` · `editar` | Idem con `id` |
| `POST` | `update_bulk_order.php` | Bearer + Permiso `/configuracion/informes` · `editar` | Reordenamiento masivo |

---

## 9 · Fruver (`/api/fruver/`)

### 8.1 Items (`/api/fruver/items/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_items.php` | Bearer + Permiso `/fruver/admin_items` · `ver` | Catálogo `items_fruver` con paginación |
| `POST` | `create_item.php` | Bearer + Permiso `crear` | `{item, descripcion, valor_venta, costo_promedio, costo_ultimo}` |
| `POST` | `update_item.php` | Bearer + Permiso `editar` | Idem con `item` como clave |

### 8.2 Pedidos (`/api/fruver/pedidos/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_pedidos.php` | Bearer + Permiso `/fruver/pedidos` · `ver` | Lista de pedidos filtrable por sede y fecha (⚠ estructura interna no confirmada — requiere análisis del módulo) |

---

## 10 · Carnes (`/api/carnes/pedidos/`)

Pedidos con patrón cabecera-detalle (`pedidos_carnes` + `detalles_pedido_carnes`).

| Método | Ruta | Auth | Propósito | Body |
|---|---|---|---|---|
| `POST` | `get_items.php` | Bearer + Permiso `/carnes/pedidos` · `ver` | Catálogo `items_pedidos_carnes` activos por categoría | `{categoria?}` |
| `POST` | `guardar_item.php` | Bearer + Permiso `crear` | Alta/edición de un item del catálogo | `{id_item, descripcion, unidad_medida, categoria, activo}` |
| `POST` | `guardar_pedido.php` | Bearer + Permiso `crear` | Persiste cabecera (`pedidos_carnes`) + detalles (`detalles_pedido_carnes`) en transacción | `{fecha, id_sede, detalles: [{id_item, cantidad, unidad_medida, categoria, descripcion}]}` |
| `POST` | `verificar_pedido_hoy.php` | Bearer | ¿Ya hay pedido de la sede + usuario para hoy? Bloquea duplicados desde la UI | `{id_sede, fecha}` |

---

## 11 · Compras (`/api/compras/`)

Es la carpeta con más endpoints (20). Se subdivide en cuatro sub-dominios.

### 10.1 Separatas (`/api/compras/separata/`)

Folletos de ofertas periódicos. Encabezado (`separatas`) + items (`items_separata`).

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `get_separatas.php` | Lista de separatas ordenada por fecha |
| `POST` | `check_separata.php` | Verifica si el usuario ya editó una separata dada |
| `POST` | `get_items_separata.php` | Ítems de una separata específica (paginado + filtro) |
| `POST` | `save_item_separata.php` | Crea un ítem nuevo |
| `POST` | `update_item_separata.php` | Actualiza ítem existente |
| `POST` | `delete_item_separata.php` | Elimina ítem |
| `POST` | `get_item_data.php` | Consulta datos del ítem desde el ERP (via `LanClient`) para autocompletar |
| `POST` | `get_item_history.php` | Historial de precios y participación del ítem en separatas anteriores |
| `POST` | `last_update.php` | Timestamp de la última modificación (para long-polling) |
| `POST` | `update_fecha_limite.php` | Extiende la fecha límite de edición |
| `POST` | `update_separata_title.php` | Renombra la separata |
| `POST` | `download_report_separata.php` | Genera archivo Excel (PhpSpreadsheet) — devuelve blob con `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

**Auth:** todos requieren `Bearer` + permiso `/compras/separata` con la acción correspondiente (`ver`/`crear`/`editar`/`eliminar`).

### 10.2 Actualización de costos (`/api/compras/actualizacion_costos/`)

Ciclo administrativo (aprobación) — complementa el frontend en `/api/formularios/actualizacion_costos/` (§12).

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `get_solicitudes.php` | Lista de solicitudes (`solicitudes_actualizacion_costos`) con filtros y paginación |
| `POST` | `get_detalle_solicitud.php` | Detalle completo con items (`_items`) y trazabilidad (`_trazabilidad`) |
| `POST` | `get_trazabilidad.php` | Solo la trazabilidad de una solicitud (auditoría de cambios de estado) |
| `POST` | `aprobar_solicitud.php` | Cambia estado a `aprobada` + inserta fila en trazabilidad |
| `POST` | `aplicar_cambio_precio.php` | Aplica los cambios en el ERP (via `LanClient`) — cambia estado a `aplicada` |
| `POST` | `finalizar_proceso.php` | Cierre administrativo — cambia estado y notifica por correo |

### 10.3 Codificación de productos (`/api/compras/codificacion_productos/`)

Un solo endpoint consolidado (Patrón B del documento 03 §5.2):

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `codificacionProductos.php` | Endpoint monolítico con sub-acciones internas por parámetro `accion` (get / update / etc.) |

### 10.4 Permisos de inventario (`/api/compras/inventarios/`)

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `permisos_inventario.php` | Endpoint consolidado que administra `proveedor_permisos_inventario` (ver 14 §9.4) |

---

## 12 · Contabilidad (`/api/contabilidad/`)

Todos los endpoints funcionales usan Patrón B (consolidado) y llaman al framework LAN. Sub-acción interna despachada por payload.

| Método | Ruta | Propósito | LanAction usada |
|---|---|---|---|
| `POST` | `dian/endpoint.php` | Auditoría DIAN (config + histórico + conciliación diaria) | `financiero/auditoria_dian`, `financiero/auditoria_dian_config`, `financiero/auditoria_dian_config_guardar` |
| `POST` | `libro_auxiliar/endpoint.php` | Consulta del libro auxiliar contable | `contabilidad/auxiliar_sedes`, `contabilidad/auxiliar_proveedores`, `contabilidad/auxiliar_datos` |
| `POST` | `recaudos/endpoint.php` | Reporte de recaudos por medio de pago y sede | `financiero/recaudos_datos` |
| `POST` | `planos/update_planos.php` | Actualización de planos contables (persistencia local MySQL) | — |

**Todos requieren:** Bearer + Permiso `/contabilidad/<módulo>` · `ver` o `editar`.

---

## 13 · Formularios (`/api/formularios/`)

Endpoints "cara al usuario" para las solicitudes. Complementan los administrativos de `/compras/`.

### 12.1 Actualización de costos (`/api/formularios/actualizacion_costos/`)

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `get_items_proveedor.php` | Ítems del proveedor (para llenar la solicitud) — consulta ERP vía LanClient |
| `POST` | `create_solicitud.php` | Crea una nueva solicitud + items en transacción |
| `POST` | `get_solicitudes.php` | Lista de las solicitudes del comprador en sesión |
| `POST` | `get_detalle_solicitud.php` | Detalle para revisar |
| `POST` | `get_trazabilidad.php` | Historial de estados de una solicitud |

### 12.2 Codificación de productos (`/api/formularios/codificacion_productos/`)

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `base.php` | Endpoint base con utilitarios compartidos por los demás archivos |
| `POST` | `create_solicitud.php` | Crea la solicitud + items en transacción |
| `POST` | `update_solicitud.php` | Edita solicitud + items en transacción |
| `POST` | `get_solicitud.php` | Detalle |
| `POST` | `get_solicitudes.php` | Lista |
| `POST` | `get_trazabilidad.php` | Auditoría |
| `POST` | `upload_file.php` | Upload de PDF con validación de MIME/tamaño |
| `POST` | `upload_image.php` | Upload de imagen (anverso/reverso) con compresión servida por el cliente |
| `POST` | `delete_upload.php` | Elimina un archivo previamente subido |

**Auth:** Bearer + Permiso `/compras/codificacion_productos` con la acción correspondiente.

---

## 14 · Inventario y subida de archivos

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/api/subida_archivos/actualiza_inventarios/update_inventario.php` | Upload masivo con validación línea por línea. Consumido por AdminPanel → Actualizar Inventario. ⚠ Requiere revisión de límites y validaciones de contenido. |

---

## 15 · Contabilidad DIAN — sub-acciones detalladas

El endpoint `/api/contabilidad/dian/endpoint.php` merece detalle porque expone múltiples operaciones.

### 14.1 Sub-acciones observables

El endpoint despacha internamente por un campo `accion` en el body:

| `accion` | LanAction destino | Propósito |
|---|---|---|
| `obtener_config` | `financiero/auditoria_dian_config` | Devuelve la configuración vigente de `cfg_auditoria_dian` |
| `guardar_config` | `financiero/auditoria_dian_config_guardar` | Actualiza `cfg_auditoria_dian` |
| `ejecutar_conciliacion` | `financiero/auditoria_dian` | Compara ERP vs DIAN y devuelve resultado (opcionalmente lo persiste en `historico_conciliacion_dian`) |
| `historico` | (consulta MySQL local) | Consulta el histórico de conciliaciones |

⚠ **Confirmación pendiente:** los nombres exactos de sub-acciones requieren lectura del endpoint. Se marca para análisis en 23-Contabilidad.

---

## 16 · Publicidad (`/api/publicidad/printer/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `endpoint.php` | Bearer + Permiso `/publicidad` · `ver` | Endpoint consolidado que gestiona plantillas (`plantillas_etiquetas`): listar, obtener por id, guardar, eliminar. El agente WebSocket local recibe la plantilla desde el frontend directamente — este endpoint solo la persiste. |

Sub-acciones observadas por parámetro `accion`:

| `accion` | Propósito |
|---|---|
| `listar` | Todas las plantillas |
| `obtener` | Una plantilla por `id` |
| `guardar` | Crear/actualizar plantilla (upsert por `id`) |
| `eliminar` | Borrar por `id` |

---

## 17 · Seguridad — visitantes (`/api/seguridad/visitantes/`)

Ciclo completo de visitantes.

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `get_visitantes.php` | Lista con filtros (nombre, cédula, ARL vigente, empresa) |
| `POST` | `get_visitante.php` | Detalle + historial de empresas (`visitantes_historial_empresas`) |
| `POST` | `create_visitante.php` | Alta con foto (subida como base64 en body) y ARL |
| `POST` | `update_visitante.php` | Edición |
| `POST` | `get_visitas.php` | Visitas activas o históricas |
| `POST` | `create_visita.php` | Ingreso — crea fila en `visitas_registro` estado `en_espera` + `visitas_movimientos` |
| `POST` | `update_visita.php` | Cambio de estado (`en_espera → en_operacion → terminado`) — inserta fila en `visitas_movimientos` |
| `POST` | `get_proveedores.php` | Catálogo de empresas contratistas para auto-asignar |

**Auth:** Bearer + Permiso `/seguridad/visitantes` con la acción correspondiente.

---

## 18 · Sistemas — CVM y logs

### 17.1 CVM (`/api/sistemas/cvm/`)

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `get_supervisores.php` | Catálogo de supervisores por sede (para autocomplete) |
| `POST` | `get_cajas.php` | Cajas registradas por sede |
| `POST` | `get_balanza.php` | Datos de un equipo balanza específico (por serial o NII) |
| `POST` | `get_registros.php` | Historial de verificaciones filtrable |
| `POST` | `save_registro.php` | Crea un registro CVM (verificación con problemas) |
| `POST` | `save_registro_ok.php` | Crea un registro CVM (verificación conforme) — variante simplificada |
| `POST` | `update_registro.php` | Edita un registro existente |
| `POST` | `upload_imagen.php` | Sube evidencia fotográfica (conforme / regularización / precintos) |
| `POST` | `delete_imagen.php` | Elimina evidencia |

⚠ **`save_registro.php` vs `save_registro_ok.php`** — dos endpoints con propósito similar. Revisar si el segundo debería ser una variante del primero (deuda documentada).

### 17.2 Logs (`/api/sistemas/logs/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_logs.php` | Bearer + Permiso `/sistemas/logs` · `ver` | Consulta paginada de `sys_logs` con filtros por tipo, aplicación, usuario, IP, rango de fechas |

### 17.3 Ingesta de logs (`/api/logs/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `ingest.php` | `X-API-KEY` (validación contra tabla `api_keys`) | Recibe logs de aplicaciones distribuidas (framework LAN + otros). No requiere sesión de usuario. |

---

## 19 · Lector de precios (`/api/lector_precios/`)

**Único bloque de endpoints sin Bearer** — se accede desde quioscos físicos sin sesión de usuario.

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `get_producto.php` | Password local + IP allow-list (⚠ requiere revisión) | Sede genérica (⚠ ambigua) |
| `POST` | `get_producto_b2.php` | Idem | Sede Belalcázar 2 (tabla `checker2`) |
| `POST` | `get_producto_b5.php` | Idem | Belalcázar 5 (`checker5`) |
| `POST` | `get_producto_b8.php` | Idem | Belalcázar 8 (`checker8`) |
| `POST` | `get_producto_b11.php` | Idem | Belalcázar 11 (`checker11`) |

⚠ **Deuda estructural** (documentada en 25/26): estos 5 endpoints deberían consolidarse en uno solo con `id_sede` como parámetro (mismo tratamiento sugerido para `checker1..11` en 14 §15.1).

**Body típico:** `{codigo: "7702001..."}`.

**Respuesta:**

```json
{ "success": true, "producto": { "descripcion": "...", "precio": 3500, "contenido": 500, "factor": "g" } }
```

---

## 20 · System (`/api/system/`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `status/endpoint.php` | Bearer | Health check consolidado. Consulta al framework LAN vía acción `system/database_status_check`. Devuelve semáforo `online/degraded/offline` con latencia medida. |

---

## 21 · Framework LAN — catálogo completo de acciones

Ver detalle en [05 · Framework Interno §11](./05-framework-interno.md). Reproducido aquí como referencia para consumidores.

### 20.1 Contrato general

- **Método:** `POST` exclusivamente.
- **URL:** `https://api-biable.supermercadobelalcazar.com/ngrok/index.php`
- **Auth:** `Authorization: Bearer <API_SECRET>` + IP allow-list + POST.
- **Body:** `{ "accion": "<clave>", ...<parámetros específicos> }`.
- **Header opcional:** `X-Usuario-Origen: <id> - <login>` (para trazabilidad).
- **Respuesta exitosa:** `{ "resultado": <lo que devolvió el método> }`.

### 20.2 Acciones registradas — módulo `general`

| Acción | Clase::método | Body esperado |
|---|---|---|
| `listar_motivos` | `MotivosRepo::listar` | — |
| `buscar_motivo_por_id` | `MotivosRepo::buscarPorId` | `{id}` |
| `listar_lineas` | `LineasRepo::listar` | — |
| `buscar_lineas` | `LineasRepo::buscar` | `{query}` |
| `listar_bodegas` | `BodegasRepo::listar` | `{empresa?}` |
| `buscar_bodegas` | `BodegasRepo::buscar` | `{query, empresa?}` |
| `general/listar_proveedores` **(v1.x)** | `ProveedoresRepo::listar` | `{empresa}` — consulta la vista `proveedores` de Biable |
| `general/buscar_proveedores_biable` **(v1.x)** | `ProveedoresRepo::buscar` | `{query, empresa}` — búsqueda por código/NIT o descripción |
| `general/buscar_proveedor_id` **(v1.x)** | `ProveedoresRepo::buscarPorId` | `{codigo, sucursal, empresa}` — llave compuesta |

Las tres nuevas acciones alimentan la superficie `api/v1/public/proveedores` (§3.1).

### 20.3 Módulo `comercial`

| Acción | Clase::método | Body |
|---|---|---|
| `obtener_datos_item` | `InventarioRepo::obtenerDatosItem` | `{id_item, empresa?}` |

### 20.4 Módulo `financiero`

| Acción | Clase::método | Body |
|---|---|---|
| `obtener_comprobantes_ce` | `ComprobantesRepo::obtenerComprobantesCe` | Filtros de rango + sede |
| `obtener_detalle_pdf_ce` | `ComprobantesRepo::obtenerDetallePdfCe` | `{id_comprobante}` |
| `obtener_notas` | `NotasRepo::obtenerNotas` | Filtros |
| `obtener_detalle_pdf_nota` | `NotasRepo::obtenerDetallePdfNota` | `{id_nota}` |
| `contabilidad/auxiliar_sedes` | `AuxiliarRepo::obtenerSedes` | — |
| `contabilidad/auxiliar_proveedores` | `AuxiliarRepo::buscarProveedores` | `{query}` |
| `contabilidad/auxiliar_datos` | `AuxiliarRepo::obtenerDatosAuxiliar` | `{filtros}` |
| `obtener_certificado_retencion` | `RetencionesRepo::obtenerCertificadoRetencion` | `{tercero, año, empresa}` |
| `obtener_certificado_reteica_yumbo` | `RetencionesRepo::obtenerCertificadoReteicaYumbo` | Idem |
| `obtener_certificado_reteica_palmira` | `RetencionesRepo::obtenerCertificadoReteicaPalmira` | Idem |
| `obtener_certificado_reteiva` | `RetencionesRepo::obtenerCertificadoReteiva` | Idem |
| `financiero/recaudos_datos` | `RecaudosRepo::obtenerRecaudos` | `{fecha_inicio, fecha_final, filtros, empresa}` |
| `financiero/auditoria_dian` | `AuditoriaRepo::obtenerAuditoriaDian` | `{fecha, empresa}` |
| `financiero/auditoria_dian_config` | `AuditoriaRepo::obtenerConfiguracionDian` | — |
| `financiero/auditoria_dian_config_guardar` | `AuditoriaRepo::guardarConfiguracionDian` | `{config: [...]}` |

### 20.5 Módulo `inventario`

| Acción | Clase::método | Body |
|---|---|---|
| `inventario/existencias_averias` | `AveriasRepo::obtenerExistenciasAverias` | `{filtros, empresa}` |
| `inventario/reporte_bodegas_alternas` | `BodegasAlternasRepo::obtenerReporteBodegasAlternas` | `{filtros, empresa}` |
| `inventario/reporte_existencias_costos` | `ExistenciasCostosRepo::obtenerReporteExistenciasCostos` | `{filtros, empresa}` |
| `inventario/buscar_proveedores` | `AveriasRepo::buscarProveedores` | `{query, empresa}` |
| `inventario/buscar_criterios1` | `AveriasRepo::buscarCriterio1` | `{query, empresa}` |
| `inventario/existencias_proveedor_saldos` | `SaldosRepo::obtenerSaldosInventarioProveedor` | `{nit_proveedor, sedes, empresa}` |

### 20.6 Módulo `system`

| Acción | Clase::método |
|---|---|
| `system/database_status_check` | `SystemStatusRepo::verificarEstadoBaseDatos` |

**Respuesta especial:** devuelve HTTP 200 incluso cuando la BD está caída, con `status: "offline"` en el cuerpo (ver 05 §9.4).

---

## 22 · Códigos de error específicos por dominio

Documentación consolidada de errores no genéricos que un consumidor debe manejar:

| Endpoint | Código | Cuerpo | Cuándo |
|---|---|---|---|
| `/api/login.php` | `404` | `{success:false, message:"El usuario no existe"}` | Login inexistente |
| `/api/login.php` | `401` | `{success:false, message:"Usuario o contrasena incorrectos"}` | `password_verify` falló |
| `/api/login.php` | `403` | `{success:false, message:"Usuario inactivo, contacte con el administrador"}` | `activo=0` |
| `/api/login_microsoft.php` | `403` | `{success:false, message:"correo no registrado"}` | Cuenta MS sin vinculación local |
| `/api/login_microsoft.php` | `498` | `{success:false, message:"conflicto de integridad"}` | Dos usuarios con el mismo correo |
| Cualquier endpoint protegido | `401` | `{success:false, message:"Token invalido o expirado"}` | Sesión inválida |
| Cualquier endpoint con `check_permission` | `403` | `{success:false, message:"No tiene permisos..."}` | AND rol × cargo falló |
| Endpoints con `check_role` legacy accedidos por navegador | `404` | HTML de LiteSpeed 404 (ver 11 §11) | Rol no autorizado (browser) |
| Endpoints que llaman a `LanClient` | `504` | `{success:false, message:"Servicio no disponible"}` | Timeout hacia el framework LAN |
| Endpoints de subida | `413` | `{success:false, message:"Archivo demasiado grande"}` | Superó `upload_max_filesize` |

---

## 23 · Patrones de consumo desde el frontend

Todo consumo pasa por `src/services/api.js` (ver [04 · Frontend §8](./04-arquitectura-frontend.md)). La biblioteca centralizada evita al desarrollador tocar directamente `fetch`.

### 22.1 Ejemplo canónico (lectura simple)

```javascript
import { apiService } from '@/services/api';

const usuarios = await apiService.getUsuarios();
```

### 22.2 Ejemplo con timeout largo (reporte pesado)

```javascript
import { apiService } from '@/services/api';

const recaudos = await apiService.obtenerRecaudos(filtros);
// runResultadoReport internamente aplica timeout 300s + unwrapResultado
```

### 22.3 Manejo de error con `ApiError`

```javascript
import { apiService, ApiError } from '@/services/api';

try {
  await apiService.crearUsuario(data);
} catch (err) {
  if (err instanceof ApiError && err.status === 403) {
    addNotification({ type:'warning', message:'Sin permiso para crear usuarios' });
  } else {
    addNotification({ type:'error', message: err.message });
  }
}
```

---

## 24 · Elementos pendientes de análisis profundo

Endpoints/acciones que requieren lectura del código para completar 100% de detalle:

1. **`/api/fruver/pedidos/get_pedidos.php`** — estructura exacta del payload de respuesta.
2. **`/api/compras/codificacion_productos/codificacionProductos.php`** — enumeración exacta de sub-acciones.
3. **`/api/compras/inventarios/permisos_inventario.php`** — sub-acciones y esquema.
4. **`/api/contabilidad/dian/endpoint.php`** — sub-acciones del dispatch interno.
5. **`/api/subida_archivos/actualiza_inventarios/update_inventario.php`** — límites y validaciones.
6. **`/api/sistemas/cvm/save_registro.php` vs `save_registro_ok.php`** — diferencia funcional exacta.

Estos ítems se resolverán al escribir los documentos por módulo (23).

---

## 25 · Referencias cruzadas

| Necesitas saber… | Documento |
|---|---|
| Cómo se autentica cada endpoint | [10 · Autenticación](./10-autenticacion.md) |
| Cómo se aplica autorización granular | [11 · Autorización](./11-autorizacion.md) |
| Diagrama de secuencia de una request completa | [06 · Flujo](./06-flujo-de-una-peticion.md) |
| Framework LAN — implementación del dispatcher | [05 · Framework Interno](./05-framework-interno.md) |
| Backend cPanel — estructura y patrones | [03 · Arquitectura Backend](./03-arquitectura-backend.md) |
| Consumo desde el frontend (`api.js`) | [04 · Arquitectura Frontend](./04-arquitectura-frontend.md) |
| Modelo de datos que soporta estos endpoints | [14 · Base de Datos](./14-base-de-datos.md) |
| Análisis de seguridad de los endpoints | [12 · Seguridad](./12-seguridad.md) |
| Documentación por módulo funcional | [23 · Módulos](./23-modulos/README.md) |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 09 — APIs · v1.0 · 14 de julio de 2026</sub>
</div>
