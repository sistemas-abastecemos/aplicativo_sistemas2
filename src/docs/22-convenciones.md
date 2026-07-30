<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 22 · Convenciones del Proyecto

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Documento**        | 22 — Convenciones                                                                       |
| **Versión**          | 1.0                                                                                     |
| **Fecha**            | 14 de julio de 2026                                                                     |
| **Depende de**       | 03 · Backend · 04 · Frontend · 05 · Framework · 14 · Base de Datos · 17 · Desarrollador |
| **Lo usan**          | Todos los desarrolladores actuales y futuros                                            |
| **Confidencialidad** | Uso interno                                                                             |

---

## 1 · Objetivo

Consolidar en un solo lugar las **convenciones observables** del proyecto: cómo se nombran las cosas, cómo se organizan los archivos, qué patrones de arquitectura se siguen, y cuándo se aplica cada uno. Este documento describe lo que **ya se hace en el código**; no impone reglas nuevas. Cualquier código futuro debe alinearse a lo aquí descrito para preservar la coherencia.

Las excepciones observables se documentan explícitamente para no ocultar la realidad del proyecto en migración.

---

## 2 · Principios rectores

Ocho principios recurrentes en las decisiones de diseño del código actual:

1. **Convención sobre configuración.** Los archivos se ubican y nombran de forma predecible; no hace falta un mapa central para encontrarlos.
2. **Explícito mejor que mágico.** Cada endpoint declara sus includes; no hay autoloading opaco.
3. **Deny by default.** Cualquier ausencia de configuración de permiso equivale a acceso denegado.
4. **Separación de identidad (cPanel) y datos ERP (LAN).** El backend jamás consulta PostgreSQL directamente.
5. **Un archivo = una responsabilidad.** Endpoints, modelos, hooks y componentes tienden a la unidad mínima cohesiva.
6. **Snapshot de datos históricos.** Los detalles de pedidos y solicitudes guardan copia de los valores al momento — no se dependen de foreign keys mutables.
7. **Trazabilidad por evento.** Cambios de estado se registran en tablas `_trazabilidad` o `_movimientos`, no en columnas.
8. **Migración gradual sin big-bang.** El proyecto está evolucionando a SRA (arquitectura modular); coexisten patrones nuevos y legacy.

---

## 3 · Naming — nombres en todo el proyecto

### 3.1 Idioma

- **Español** para nombres de dominio (tablas, columnas, endpoints, componentes, variables de negocio).
- **Inglés** para nombres técnicos genéricos (`request`, `response`, `parse`, `client`, `config`, `utils`).
- Sin mezclar dentro del mismo identificador: no `getSolicitudesData` (mezcla) ni `obtenerSolicitudesData` (mejor).

Ejemplos válidos del proyecto:

- `pedidos_carnes` (tabla) ✅
- `LanClient::post` (utilitario técnico) ✅
- `useRecaudosData` (hook — negocio en español, prefijo hook técnico en inglés) ✅
- `apiService.obtenerRecaudos` ✅

### 3.2 Sin tildes en identificadores

Todos los identificadores del código (nombres de archivos, tablas, columnas, variables) se escriben **sin tildes**:

- ✅ `contrasena`, `configuracion`, `informacion`, `codificacion_productos`
- ❌ `contraseña`, `configuración`

Las tildes se preservan en:

- **Cadenas visibles al usuario** (mensajes, labels, descripciones).
- **Datos** almacenados por usuarios (nombres de personas, direcciones).

### 3.3 Convenciones por tipo

| Elemento                | Convención                                       | Ejemplo                                                  |
| ----------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Tabla MySQL/PostgreSQL  | `snake_case`, plural                             | `pedidos_carnes`, `solicitudes_actualizacion_costos`     |
| Columna                 | `snake_case`, singular                           | `fecha_creacion`, `id_sede`, `puede_ver`                 |
| PK                      | `id` int (con auto-increment)                    | Salvo `sedes.id_sede varchar(3)` (clave natural)         |
| FK                      | `id_<tabla_padre>`                               | `id_pedido`, `id_usuario`, `id_menu`                     |
| Booleana                | `tinyint(1)` con prefijo semántico               | `activo`, `puede_ver`, `abastecemos`, `tobar`            |
| Timestamp de creación   | `fecha_creacion` o `created_at`                  | Ambos conviven — nuevos módulos usan `created_at`        |
| Timestamp de update     | `fecha_actualizacion` o `updated_at`             | Idem                                                     |
| Endpoint PHP (Patrón A) | `verbo_recurso.php`                              | `create_usuario.php`, `get_menu_user.php`                |
| Endpoint PHP (Patrón B) | `endpoint.php` dentro de carpeta por dominio     | `contabilidad/dian/endpoint.php`                         |
| Middleware              | Función `snake_case` + include                   | `include './middlewares/auth.php'`                       |
| Modelo PHP              | `PascalCase` en archivo `snake_case.php`         | `User` en `models/user.php`                              |
| Servicio PHP            | `PascalCase` clase                               | `LanClient`                                              |
| Método PHP              | `camelCase`                                      | `obtenerRecaudos`, `verificarEstadoBaseDatos`            |
| Constante PHP           | `SCREAMING_SNAKE_CASE`                           | `LAN_API_URL`, `API_SECRET`                              |
| Variable de entorno     | `SCREAMING_SNAKE_CASE` con prefijo por capa      | `VITE_*` (frontend), `DB_*` (LAN), `LAN_API_*` (backend) |
| Componente React        | `PascalCase.jsx`                                 | `RecaudosPanel.jsx`, `TemplateCanvas.jsx`                |
| Hook React              | `useCamelCase.js`                                | `useAuth`, `useRecaudosData`, `usePermisos`              |
| Context React           | `NombreContext.jsx`                              | `AuthContext`, `EmpresaContext`, `MenuContext`           |
| Utilitario JS           | `camelCase.js`                                   | `formatoRecaudos.js`, `buildUrl.js`                      |
| Módulo JS agrupado      | Carpeta con `index.js` barrel                    | `utils/http/index.js`                                    |
| CSS Module              | `Component.module.css`                           | `RecaudosPanel.module.css`                               |
| Clase CSS Module        | `camelCase` (aunque el archivo use `kebab-case`) | `styles.miClase` (mapea a `.mi-clase`)                   |

### 3.4 Prefijos y sufijos convencionales

Observables en múltiples archivos:

| Prefijo/Sufijo               | Uso                             | Ejemplo                                                      |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `id_*`                       | Foreign key int                 | `id_pedido`, `id_sede`                                       |
| `fecha_*`                    | Fecha o timestamp               | `fecha_creacion`, `fecha_expira`                             |
| `total_*`                    | Agregación numérica             | `total_general`, `total_res_und`                             |
| `puede_*`                    | Booleana de permiso             | `puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar` |
| `cfg_*` (tabla)              | Tabla de configuración editable | `cfg_auditoria_dian`, `cfg_bodegas_reporte`                  |
| `checker*` (tabla)           | Réplica por sede del ERP        | `checker1`, `checker2`, `checker5`, `checker8`, `checker11`  |
| `sys_*` (tabla)              | Del sistema/plataforma          | `sys_logs`                                                   |
| `use*`                       | Hook React                      | `useAuth`, `usePermisos`                                     |
| `*Repo` (clase PHP)          | Repositorio del framework LAN   | `RecaudosRepo`, `AveriasRepo`, `SystemStatusRepo`            |
| `*Context` (React)           | Contexto global                 | `AuthContext`                                                |
| `*Screen` / `*Panel` (React) | Página o panel grande           | `LoadingScreen`, `FiltrosPanel`                              |
| `_items` (tabla)             | Detalle de una entidad cabecera | `solicitudes_actualizacion_costos_items`                     |
| `_trazabilidad` (tabla)      | Auditoría de estados            | `solicitudes_actualizacion_costos_trazabilidad`              |
| `_movimientos` (tabla)       | Auditoría de estados (variante) | `visitas_movimientos`                                        |

### 3.5 Excepciones observables

Se documentan porque **ya existen en el código** y no deben "corregirse" en refactor si eso rompe compatibilidad:

- `models/user.php` está en inglés (`User`) — legado.
- `models/provider.php` coexiste con `models/proveedor.php` — deuda.
- `contrasena` (sin ñ) — coherente en toda la codebase.
- `ngrok` en la ruta `/ngrok/index.php` del framework LAN — nombre histórico, no relacionado con el servicio ngrok.

---

## 4 · Organización de carpetas

### 4.1 Frontend (`frontend/`)

```
frontend/
├── public/                       ← estáticos servidos tal cual
├── src/
│   ├── main.jsx                  ← bootstrap de providers
│   ├── App.jsx                   ← declaración de rutas
│   ├── App.css · index.css       ← estilos globales
│   ├── assets/                   ← imágenes importadas en código
│   ├── contexts/                 ← contextos globales
│   ├── hooks/                    ← hooks reutilizables
│   ├── services/                 ← api.js + servicios especializados
│   ├── utils/                    ← utilitarios puros
│   │   └── http/                 ← capa HTTP centralizada
│   └── components/
│       └── <Dominio>/            ← una carpeta por dominio funcional
│           ├── <Modulo>.jsx      ← orquestador delgado
│           ├── hooks/            ← lógica + fetch específica del módulo
│           ├── components/       ← subcomponentes del módulo
│           └── utils/            ← helpers puros del módulo
├── package.json
├── vite.config.js
└── .env
```

**Regla:** los componentes se organizan **por dominio funcional** (Fruver, Carnes, Compras, Contabilidad…), no por tipo (`buttons/`, `forms/`, `pages/`). Esto facilita ubicar cambios cuando un dominio evoluciona.

### 4.2 Backend cPanel (`backend/backend/`)

```
backend/backend/
├── .htaccess
├── index.html                    ← SPA compilado
├── files/                        ← storage de uploads
├── images/                       ← imágenes servidas
├── cron/                         ← cronjobs PHP CLI
├── utils/                        ← librerías vendorizadas + vendor/ Composer parcial
└── api/
    ├── config/                   ← BD, LAN, correo
    ├── middlewares/              ← auth, cors, permisos, rate-limit
    ├── models/                   ← una clase por entidad
    ├── services/                 ← LanClient, logger
    ├── utils/                    ← env_loader, remote_logger, proxy_image
    ├── logs/ingest.php           ← receptor de logs central
    ├── login*.php · logout · verify_token
    └── <dominio>/                ← una carpeta por dominio
        ├── <accion>.php          ← Patrón A
        └── <subdominio>/
            └── endpoint.php      ← Patrón B
```

**Regla:** cada dominio tiene su carpeta; dentro puede haber archivos planos (Patrón A) o subcarpetas con `endpoint.php` (Patrón B).

### 4.3 Framework LAN (`repo/`)

```
repo/
├── .env
├── .htaccess
├── index.php                     ← router monolítico
├── core/                         ← 5 clases fundamentales
├── logs/
└── modules/
    └── <categoria>/              ← general, comercial, financiero, inventario, system
        └── <recurso>.php         ← una clase Repo por archivo
```

**Regla:** una clase por archivo, nombre del archivo en `snake_case`, clase con sufijo `Repo`.

---

## 5 · Patrones de módulo del backend cPanel

### 5.1 Patrón A · "un archivo por operación"

Aplica a la mayoría de dominios (Usuarios, Áreas, Cargos, Sedes, Fruver, Carnes, etc.).

```
api/<dominio>/
├── create_<recurso>.php
├── get_<recurso>s.php            (plural)
├── update_<recurso>.php
└── (delete_<recurso>.php)        ← opcional; soft delete es más común
```

**Estructura interna canónica** (ver [17 §4.3](./17-manual-desarrollador.md) para el ejemplo completo):

```php
<?php
include_once '../middlewares/cors.php';
include_once '../config/database.php';
include_once '../middlewares/auth.php';
include_once '../middlewares/check_permission.php';
include_once '../utils/logger.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

requirePermiso('/dominio/recurso', 'crear');

try {
    $db = (new Database())->getConnection();
    $logger = new Logger($db, 'Cpanel', 'produccion');

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    // validar $input
    // ejecutar SQL con prepared statement
    // responder JSON
} catch (Throwable $e) {
    $logger->error('Descripción', $e->getMessage(), $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}
```

**Cuándo usar Patrón A:** CRUDs simples, operaciones puntuales de un dominio, endpoints de baja complejidad.

### 5.2 Patrón B · "endpoint consolidado por dominio"

Aplica a dominios grandes: Contabilidad DIAN, Recaudos, Libro Auxiliar, System Status, Publicidad Printer, Codificación de Productos.

```
api/<dominio>/<subdominio>/
└── endpoint.php                  ← despacha por parámetro accion en el body
```

**Estructura interna:**

```php
<?php
// mismos includes que Patrón A

$input = json_decode(file_get_contents('php://input'), true);
$accion = $input['accion'] ?? null;

switch ($accion) {
    case 'listar':
        requirePermiso('/dominio/subdominio', 'ver');
        // ...
        break;
    case 'guardar':
        requirePermiso('/dominio/subdominio', 'editar');
        // ...
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Acción no reconocida']);
}
```

**Cuándo usar Patrón B:** dominios con muchas operaciones que comparten configuración/setup, o dominios que llaman al framework LAN con varias sub-acciones.

### 5.3 Patrón C · Superficies API v1 — añadido en 2026-07-17

**Emergente y recomendado para código nuevo con requisitos formales** — APIs de consumo externo, integraciones B2B, o cualquier endpoint donde importe trazabilidad estricta (correlation IDs), rate limiting, ocultamiento de errores y envelope consistente.

Ver arquitectura completa en [03 §5.3](./03-arquitectura-backend.md). Convenciones específicas del patrón:

**Estructura de carpetas:**

```
api/v1/
├── core/                          ← núcleo compartido — no tocar sin justificación
│   ├── bootstrap.php              ← define APP_ROOT, carga LanClient, Response, Controller
│   ├── Response.php               ← Response::ok / Response::error
│   └── Controller.php             ← clase base
├── public/
│   ├── .htaccess                  ← ver 15 §8bis.1
│   ├── index.php                  ← router (tabla enriquecida)
│   ├── auth/apikey.php
│   └── controllers/
│       └── <Recurso>Controller.php
└── private/
    ├── .htaccess                  ← ver 15 §8bis.2
    ├── index.php
    └── controllers/
        └── <Recurso>Controller.php
```

**Reglas obligatorias del patrón C:**

1. **Rutas absolutas siempre.** Usar `APP_ROOT` (definida en `bootstrap.php`) — nunca `../../../` contados a mano. Este era un bug frecuente que el patrón elimina por diseño.
2. **Controlador hereda de `Controller`** (clase base).
3. **Respuestas solo a través de `Response::ok()` o `Response::error()`** — nunca `echo json_encode(...)` directo. Garantiza envelope + `X-Request-ID`.
4. **Router es una tabla enriquecida** con al menos: `[Controlador, método, módulo, métodos_http, scope|permiso]`.
5. **Validación de parámetros contra whitelist** antes de propagar al framework LAN (ver `empresa` en `ProveedoresController`).
6. **`display_errors = Off` + `log_errors = On`** en el `bootstrap.php` — los detalles nunca llegan al cliente.

**Cuándo usar C sobre A o B:**

| Situación | Patrón sugerido |
|---|---|
| CRUD interno simple del SPA | A o B (según cohesión) |
| Endpoint interno usado por > 3 componentes React | B |
| API para consumo externo | **C — pública** |
| Refactor de un dominio interno complejo | **C — privada** |
| Bug fix en endpoint legacy | Mantener el patrón existente |

**Cuándo NO usar C:**

- Bugfixes triviales en endpoints legacy — no reescribir por gusto.
- Módulos que van a deprecarse pronto.
- Endpoints que no valen la ceremonia (script one-off).

---

## 6 · Patrón de módulo del frontend (thin orchestrator)

Documentado ampliamente en [04 §11](./04-arquitectura-frontend.md) y [17 §4.5](./17-manual-desarrollador.md). Regla resumida:

```
components/<Dominio>/<Modulo>/
├── <Modulo>.jsx                  ← orquestador delgado (< 100 líneas idealmente)
├── hooks/                        ← lógica y fetch
│   └── use<Xxx>.js               ← una responsabilidad por hook
├── components/                   ← subcomponentes UI
│   └── <Xxx>.jsx
└── utils/                        ← helpers puros
    └── <xxx>.js
```

**Cuándo aplicar:**

- Cualquier módulo con > 50 líneas de JSX en el orquestador.
- Cualquier módulo que hace fetch a más de un endpoint.
- Cualquier módulo con estado complejo (filtros, paginación, drag-and-drop).

**Cuándo NO aplicar:**

- Componentes muy simples (< 30 líneas) sin lógica de red — un solo `.jsx` es suficiente.

### 6.1 · Introducción incremental de TypeScript (política v1.x, 2026-07-17)

**Coexistencia por diseño.** El proyecto es JSX/JS desde su inicio. Desde v1.x, TypeScript se introduce **selectivamente** — no hay migración masiva planeada. Reglas:

**Usar `.ts` / `.tsx` cuando:**

- El código consume una API externa que **publica sus propios tipos** (ej. `darkreader`, futuras integraciones tipadas).
- El código maneja **datos con forma estricta y crítica** (ej. contratos con backends v1 que tienen envelope conocido).
- El código es un **utilitario reutilizable** que se usará en muchos lugares (ej. `buildMicrosoftAuthUrl`).

**Mantener en `.js` / `.jsx`:**

- Componentes existentes que ya funcionan bien.
- Módulos con formas de datos volátiles o inferidas.
- Hooks internos de un solo módulo (sin exposición amplia).

**Reglas al escribir TypeScript nuevo:**

- **No usar `any`.** Preferir `unknown` + type guards, o tipos explícitos.
- **Export types desde el archivo.** Los tipos de dominio son parte del API público del módulo.
- **Evitar `!` (non-null assertion).** Es una promesa al compilador que se puede romper.
- **`tsconfig.json` con `strict: true`** — la app usa esta configuración desde el primer `.ts`.

**Interoperabilidad:**

- Un `.jsx` puede importar de un `.ts` sin declaraciones adicionales — Vite lo maneja transparentemente.
- Un `.ts` puede importar de un `.jsx` — los tipos son `any` implícitos, pero el código funciona.
- **No es necesario renombrar** archivos existentes para usar tipos de un nuevo `.ts`.

**Ejemplo canónico actual:** `hooks/useDarkMode.ts` — hook para el modo oscuro que consume la API tipada de DarkReader. Ver [04 §12.1](./04-arquitectura-frontend.md).

---

## 7 · Convenciones de datos

### 7.1 Cabecera-detalle

Se usa para entidades tipo "pedido", "solicitud", "factura":

- **Cabecera:** `pedidos_carnes` (una fila por pedido).
- **Detalle:** `detalles_pedido_carnes` (varias filas por pedido).
- **Snapshot:** el detalle guarda `descripcion`, `unidad_medida`, `categoria` copiados al momento — no depende del catálogo futuro.

### 7.2 Trazabilidad de estados

Cuando una entidad cambia de estado (`pendiente → aprobada → aplicada`):

- Tabla `_trazabilidad` con `estado_anterior`, `estado_nuevo`, `usuario`, `fecha`, `observacion`.
- Cada cambio inserta una fila nueva; no se actualiza fila existente.

Ejemplo: `solicitudes_actualizacion_costos_trazabilidad`.

### 7.3 Configuraciones editables

Cuando un dato es configuración de negocio editable (no catálogo maestro):

- Tabla `cfg_*`.
- Columnas típicas: `codigo`, `descripcion`, `activo`, `creado_por`, `modificado_por`, `created_at`, `updated_at`.

Ejemplo: `cfg_bodegas_reporte`, `cfg_existencias_lineas`, `cfg_auditoria_dian`.

### 7.4 Enum de estados

Se prefiere `ENUM('valor1', 'valor2', ...)` sobre `varchar` para columnas de estado:

- Beneficio: valida a nivel BD.
- Ejemplo: `solicitudes_actualizacion_costos.estado ENUM('pendiente','en_revision','aprobada','rechazada','aplicada')`.

### 7.5 Columnas generadas

Cuando un valor se calcula de otros:

- Usar `GENERATED ALWAYS AS (...) STORED`.
- Ejemplo: `solicitudes_actualizacion_costos_items.porcentaje_variacion`.
- Ventaja: no puede desincronizarse, no requiere trigger.

### 7.6 Timestamps automáticos

- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.

Ambas se detectan en múltiples tablas nuevas; las tablas legacy usan `fecha_creacion`.

---

## 8 · Convenciones de API

### 8.1 HTTP method

- **`POST` siempre**, incluso para lecturas.
- Motivo: consistencia con el framework LAN que solo acepta POST, y algunos endpoints requieren body JSON.
- Excepciones observables: assets estáticos y `verify_token` (que también es POST).

### 8.2 Content-Type

- Requests: `application/json` casi siempre.
- `multipart/form-data` solo para uploads.

### 8.3 Autenticación

- Header estándar: `Authorization: Bearer <token>`.
- Endpoints de login no requieren Bearer.

### 8.4 Formato de respuesta

**Éxito** (Patrón general del backend cPanel):

```json
{ "success": true, "message": "...", "data": {...} }
```

**Éxito** (Framework LAN — sale de `Response::json`):

```json
{ "resultado": <lo que devolvió el método> }
```

**Fallo:**

```json
{ "success": false, "message": "..." }
```

### 8.5 Códigos HTTP

Ver [09 §2.4](./09-api-endpoints.md). Regla mnemotécnica:

- 2xx éxito.
- 400 payload mal formado.
- 401 no autenticado.
- 403 autenticado pero sin permiso.
- 404 recurso o endpoint no existe.
- 405 método inválido.
- 5xx error del servidor (con log).

---

## 9 · Convenciones de framework LAN

### 9.1 Acciones

- Nombre en `snake_case`.
- Opcionalmente con namespace `<modulo>/<accion>` (`financiero/recaudos_datos`, `inventario/existencias_averias`, `system/database_status_check`).
- Verbo primero cuando aplica (`obtener_*`, `listar_*`, `buscar_*`, `guardar_*`).

### 9.2 Método del Repo

- Firma: `public function nombreDelMetodo($input)`.
- `$input` es el array asociativo del payload JSON entrante.
- Retorna array asociativo o array de arrays (nunca un objeto).

### 9.3 Selección de empresa

Los módulos que soportan Abastecemos y Tobar aceptan `empresa` en el input:

```php
private function inicializarConexion($input) {
    $empresa = $input['empresa'] ?? 'abastecemos';
    $dbName = ($empresa === 'tobar') ? 'biable02' : 'biable01';
    $this->db = Database::getInstance($dbName);
}
```

Convención: **`abastecemos` es default**; solo `tobar` es explícito.

### 9.4 Reportes pesados

Los métodos que pueden tomar minutos:

```php
public function obtener{Reporte}($parametros) {
    ini_set('memory_limit', '2048M');
    ini_set('max_execution_time', 600);
    set_time_limit(600);
    // ...
    Database::setQueryTimeout(600, $dbName);
    // ...
}
```

No se aplica global — solo los que lo necesitan.

---

## 10 · Convenciones frontend

### 10.1 Consumo de la API

**Regla:** todo consumo debe pasar por `apiService` (`src/services/api.js`). Los componentes **no** hacen `fetch()` directo.

Excepciones justificadas:

- Agente WebSocket local (por ser otro protocolo).
- Descargas de blobs con manejo especial.

### 10.2 Manejo de errores

`try/catch` en el hook que llama al servicio:

```javascript
try {
  const data = await apiService.obtenerRecaudos(filtros);
  setData(data);
} catch (err) {
  addNotification({ type: "error", message: err.message });
}
```

El componente orquestador **no** hace catch — delega en el hook.

### 10.3 Estado

- **Local** al componente: `useState`.
- **Global**: contextos (`AuthContext`, `EmpresaContext`, `MenuContext`, `NotificationContext`).
- **Persistente**: `localStorage` (con moderación — solo lo esencial).
- **De formulario simple**: `useState`.
- **De formulario complejo**: hook custom `useForm{Xxx}`.

No usar Redux, Zustand, Jotai. Si algún día se justifica: decisión de proyecto.

### 10.4 Efectos

- Siempre con array de dependencias explícito.
- Cleanup si el efecto crea suscripciones o timers.
- Evitar efectos que causan cascadas — mejor `useMemo`/`useCallback`.

### 10.5 CSS

**Dos convenciones conviven** (deuda menor):

- **CSS Modules** (`Component.module.css`) — nueva convención, preferida.
- **CSS global con clases** — legacy en algunos módulos.

Regla: código nuevo usa CSS Modules.

### 10.6 Íconos

- **`lucide-react`** para íconos nuevos.
- Usar de las otras librerías (`react-icons`, `@fortawesome/*`) solo si ya está en el módulo — no introducir nuevas dependencias por módulo.

---

## 11 · Convenciones de commit y branches (recomendadas)

⚠ Recomendación — no observable como ya-aplicada; se sugiere adoptar.

### 11.1 Ramas

- `main` → producción.
- `develop` → staging (si existe).
- `feature/<slug>` → nuevas features.
- `bugfix/<slug>` → correcciones.
- `hotfix/<slug>` → parches urgentes a producción.

### 11.2 Commits

Convenciones útiles pero no obligatorias:

- `feat: nueva pantalla de reporte asistencia`
- `fix: recaudos no filtra por sede`
- `refactor: extraer hook useX`
- `docs: actualizar 09-api-endpoints con nuevo endpoint`
- `chore: bump lucide-react`

### 11.3 Pull requests

- Descripción con **qué** y **por qué**.
- Screenshot o screencast si toca UI.
- Referencia a issue/ticket si existe.
- Autoreview antes de pedir review a otro.

---

## 12 · Documentación

### 12.1 Formato

- **Markdown** con Mermaid para diagramas.
- Membretado consistente con logo, título, tabla de metadatos, secciones numeradas, y referencias cruzadas al final.

### 12.2 Trazabilidad al código

Cada afirmación técnica debe indicar de dónde viene:

- Referencia al archivo: `backend/api/config/database.php`.
- Referencia al documento: `[10 §4.1](./10-autenticacion.md)`.
- Marcado como **hipótesis** cuando no se puede probar desde el código: ⚠.

### 12.3 Cuándo actualizar

- **Al hacer merge de una feature** — actualizar los documentos afectados.
- **Al descubrir una discrepancia** — corregir la documentación, no el código, si el código es la fuente de verdad.
- **Trimestralmente** — revisión completa del `README.md` maestro.

---

## 13 · Anti-convenciones (a evitar)

| Antipatrón                                                | Por qué evitar                                    |
| --------------------------------------------------------- | ------------------------------------------------- |
| Inglés + español mezclados en el mismo identificador      | Confuso; inconsistente con el resto del código    |
| Tildes en identificadores                                 | Ya se estableció convención sin tildes            |
| Nombres genéricos (`temp.php`, `test.js`, `nuevo/`)       | Deuda instantánea; renombrar antes de commit      |
| Componentes React con > 300 líneas                        | Refactor a thin orchestrator                      |
| Endpoints con SQL concatenado                             | Riesgo de inyección; siempre prepared statements  |
| Consultar PostgreSQL directamente desde el backend cPanel | Rompe la separación L2/L3; usar `LanClient::post` |
| Verificar permisos solo en frontend                       | Bypass trivial; verificar también en backend      |
| `console.log` en producción                               | Log en `sys_logs`, no en consola                  |
| Guardar secretos en `VITE_*`                              | Quedan en el bundle público                       |
| Editar directamente en cPanel                             | Sin trazabilidad; deploy formal siempre           |

---

## 14 · Guía de decisión — patrones a aplicar

### 14.1 "Tengo que crear un endpoint nuevo — ¿Patrón A o B?"

- **A** si es una única operación CRUD con < 30 líneas de lógica.
- **B** si hay > 3 sub-operaciones sobre la misma entidad.
- **Coherencia con el dominio circundante** prima sobre la regla.

### 14.2 "Tengo que crear una tabla nueva — ¿qué columnas obligatorias?"

- `id INT PK AUTO_INCREMENT` (o clave natural documentada).
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` si aplica.
- `activo TINYINT(1) DEFAULT 1` si soft delete tiene sentido.
- FK como `id_<tabla_padre>`.
- Charset `utf8mb4`, collation `utf8mb4_unicode_ci`.

### 14.3 "Tengo que persistir cambios de estado — ¿cómo?"

- Tabla `_trazabilidad` o `_movimientos` con `estado_anterior`, `estado_nuevo`, `usuario`, `fecha`, `observacion`.
- Un INSERT por cambio; nunca UPDATE.

### 14.4 "El backend necesita datos del ERP — ¿cómo los consulto?"

- Siempre vía `LanClient::post('accion', $filtros)`.
- Nunca conectar directamente a PostgreSQL desde el backend cPanel.

### 14.5 "Tengo que agregar autorización a un endpoint — ¿cómo?"

- Include `middlewares/auth.php` + `middlewares/check_permission.php`.
- Al inicio del endpoint: `requirePermiso('/ruta/menu', 'accion')`.
- Configurar `rol_menu` y `cargo_menu` desde AdminPanel.

---

## 15 · Referencias cruzadas

| Necesitas saber…                                          | Documento                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| Cómo implementar cada patrón con código                   | [17 · Manual del Desarrollador](./17-manual-desarrollador.md) |
| Detalle del backend                                       | [03](./03-arquitectura-backend.md)                            |
| Detalle del frontend                                      | [04](./04-arquitectura-frontend.md)                           |
| Detalle del framework LAN                                 | [05](./05-framework-interno.md)                               |
| Modelo de datos completo                                  | [14](./14-base-de-datos.md)                                   |
| Deuda técnica que genera discrepancias entre convenciones | [26](./26-deuda-tecnica.md)                                   |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 22 — Convenciones · v1.0 · 14 de julio de 2026</sub>
</div>
