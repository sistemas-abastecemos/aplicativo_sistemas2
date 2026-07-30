<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 17 · Manual del Desarrollador

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                          |
| -------------------- | ---------------------------------------- |
| **Documento**        | 17 — Manual del Desarrollador            |
| **Versión**          | 1.0                                      |
| **Fecha**            | 14 de julio de 2026                      |
| **Depende de**       | 02..16                                   |
| **Lo usan**          | 22 · Convenciones · 25 · Refactorización |
| **Confidencialidad** | Uso interno                              |

---

## 1 · Objetivo

Guía práctica para que un desarrollador nuevo pueda:

1. Levantar el proyecto en su equipo local.
2. Entender el flujo de trabajo día a día.
3. Añadir una funcionalidad nueva de extremo a extremo (frontend + backend + framework).
4. Aplicar las convenciones del proyecto sin romper nada.

---

## 2 · Setup local

### 2.1 Requisitos en el equipo

- **Node.js** ≥ 20 LTS + npm 10+.
- **PHP** 8.1+ (para poder correr el backend localmente).
- **MySQL** o Docker con imagen `mysql:8`.
- **Git**.
- **Editor:** VS Code recomendado (con extensiones ESLint, PHP Intelephense, Prettier).

### 2.2 Frontend local

```bash
git clone <repo-frontend>
cd frontend
cp .env.example .env         # ⚠ crear .env.example si no existe
# Editar .env con valores de desarrollo:
#   VITE_API_BASE_URL=http://localhost:8000/api
npm ci
npm run dev
# → http://localhost:3000
```

Al abrir `http://localhost:3000` la SPA carga y hace fetch a `VITE_API_BASE_URL`. Si el backend no está corriendo, verás errores de red esperables.

### 2.3 Backend local

**Opción A · PHP built-in server:**

```bash
cd backend/backend
php -S localhost:8000
# → sirve la carpeta actual en el puerto 8000
```

Ventaja: cero configuración de Apache. Suficiente para 90% del desarrollo.

**Opción B · XAMPP / Laragon / MAMP:**

Recomendable cuando se necesita comportamiento idéntico al de producción (`.htaccess`, `mod_rewrite`, etc.).

### 2.4 Base de datos local

```bash
mysql -u root -p
CREATE DATABASE supermer_AplicativoSistemas CHARACTER SET utf8mb4;
CREATE USER 'app_dev'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL ON supermer_AplicativoSistemas.* TO 'app_dev'@'localhost';
EXIT;

# Importar dump (limpiar antes datos sensibles!)
mysql -u app_dev -p supermer_AplicativoSistemas < mysqlphpmyadmin_sample.sql
```

Editar `backend/backend/api/config/database.php` con las credenciales locales:

```php
private $host = 'localhost';
private $db_name = 'supermer_AplicativoSistemas';
private $username = 'app_dev';
private $password = 'dev_password';
```

⚠ **Nunca hacer commit con credenciales locales.** Este archivo debe estar en `.gitignore` o mantener una versión "plantilla" (`database.php.dist`) que se copia manualmente.

### 2.5 Framework LAN local

No es necesario correrlo local en la mayoría de los casos — el desarrollo se hace con **mock del framework** o apuntando `LAN_API_URL` al ambiente de desarrollo del servidor LAN si existe.

Si se necesita local:

```bash
cd repo
cp .env.example .env
# Editar DB_* con credenciales de una BD PostgreSQL de desarrollo
php -S localhost:8080
```

### 2.6 Login con usuario de prueba

Crear un usuario admin en la BD local:

```sql
INSERT INTO usuarios (login, contrasena, correo, nombres_completos, id_rol, id_cargo, id_sede, id_area, activo)
VALUES (
  'admin_dev',
  '$2y$10$AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghij',  -- password_hash('123456')
  'dev@localhost',
  'Admin Dev',
  1, 1, '001', 1, 1
);
```

Login desde el frontend con `admin_dev` / `123456`.

---

## 3 · Flujo de trabajo diario

### 3.1 Convenciones de Git (recomendadas)

- **Ramas:** `main` (producción), `develop` (staging), `feature/<nombre>`, `bugfix/<nombre>`, `hotfix/<nombre>`.
- **Commits:** convenciones útiles pero no obligatorias — `feat: nueva pantalla de X`, `fix: recaudos no filtra por sede`, `refactor: extraer hook useX`.
- **Pull requests:** con descripción del qué y del por qué, screenshot si toca UI.

### 3.2 Checklist antes de commit

- [ ] `npm run lint` sin errores en frontend.
- [ ] La feature funciona en modo incógnito (sin caché ni localStorage).
- [ ] Se probó con al menos dos usuarios: uno admin y uno con permisos limitados.
- [ ] Los cambios de BD tienen migración documentada.
- [ ] No hay `console.log` ni `var_dump` remanentes.
- [ ] No se commiteó `.env` ni credenciales.

---

## 4 · Cómo añadir un módulo nuevo — end to end

Ejemplo: nuevo módulo **"Reporte de asistencia"** en el dominio Sistemas.

### 4.1 Paso 1 · Modelo de datos

1. Definir tablas en MySQL. Convención (14 §2):
   - `utf8mb4_unicode_ci` para tablas nuevas.
   - `id int PK auto_increment`.
   - `created_at timestamp DEFAULT CURRENT_TIMESTAMP`.
   - `updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` si aplica.
   - Índices en columnas usadas para filtrar (fechas, IDs de FK).
2. Escribir el script SQL, aplicarlo en local, verificar.

### 4.2 Paso 2 · Menú y permisos

En la administración del aplicativo (con usuario admin):

1. **Menús → Crear**:
   - Nombre: "Reporte de asistencia".
   - Ruta: `/sistemas/reporte_asistencia`.
   - `id_menu_parent`: el menú "Sistemas".
   - `abastecemos=1, tobar=0` (según aplique).
2. **Asignar permisos**:
   - `rol_menu` (rol=admin, `puede_ver=1, puede_crear=1, ...`).
   - `cargo_menu` (cargos que corresponden).

### 4.3 Paso 3 · Endpoint backend cPanel

Elegir patrón:

- **Patrón A** (un archivo por operación) — apropiado si la funcionalidad es un CRUD simple.
- **Patrón B** (endpoint consolidado) — apropiado si son muchas operaciones sobre el mismo dominio.

Ejemplo Patrón A — `backend/api/sistemas/reporte_asistencia/get_reporte.php`:

```php
<?php
include_once __DIR__ . '/../../middlewares/cors.php';
include_once __DIR__ . '/../../config/database.php';
include_once __DIR__ . '/../../middlewares/auth.php';
include_once __DIR__ . '/../../middlewares/check_permission.php';
include_once __DIR__ . '/../../utils/logger.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

requirePermiso('/sistemas/reporte_asistencia', 'ver');

try {
    $db = (new Database())->getConnection();
    $logger = new Logger($db, 'Cpanel', 'produccion');

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $fecha_desde = $input['fecha_desde'] ?? null;
    $fecha_hasta = $input['fecha_hasta'] ?? null;

    if (!$fecha_desde || !$fecha_hasta) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Fechas requeridas']);
        exit;
    }

    $stmt = $db->prepare("
        SELECT id, empleado, fecha, hora_entrada, hora_salida
        FROM asistencia
        WHERE fecha BETWEEN :d AND :h
        ORDER BY fecha, empleado
    ");
    $stmt->execute(['d' => $fecha_desde, 'h' => $fecha_hasta]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $rows]);
} catch (Throwable $e) {
    $logger->error("Error reporte_asistencia", $e->getMessage(), $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}
```

### 4.4 Paso 4 · Método en `api.js` del frontend

`frontend/src/services/api.js`:

```javascript
// dentro del apiService
async obtenerReporteAsistencia(filtros) {
  return request('/sistemas/reporte_asistencia/get_reporte.php', {
    method: 'POST',
    body: filtros,
  });
},
```

### 4.5 Paso 5 · Componente React (patrón thin orchestrator)

Estructura:

```
components/Sistemas/ReporteAsistencia/
├── ReporteAsistencia.jsx           ← orquestador delgado
├── hooks/
│   └── useReporteAsistencia.js     ← estado + fetch
├── components/
│   ├── FiltrosPanel.jsx
│   └── TablaReporte.jsx
└── utils/
    └── formatoAsistencia.js
```

`hooks/useReporteAsistencia.js`:

```javascript
import { useState, useCallback } from "react";
import { apiService } from "@/services/api";
import { useNotification } from "@/contexts/NotificationContext";

export function useReporteAsistencia() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const consultar = useCallback(
    async (filtros) => {
      setLoading(true);
      try {
        const res = await apiService.obtenerReporteAsistencia(filtros);
        setData(res.data ?? []);
      } catch (err) {
        addNotification({ type: "error", message: err.message });
      } finally {
        setLoading(false);
      }
    },
    [addNotification],
  );

  return { data, loading, consultar };
}
```

`ReporteAsistencia.jsx`:

```jsx
import { usePermisos } from "@/hooks/usePermission";
import { useReporteAsistencia } from "./hooks/useReporteAsistencia";
import FiltrosPanel from "./components/FiltrosPanel";
import TablaReporte from "./components/TablaReporte";
import LoadingScreen from "@/components/UI/LoadingScreen";

export default function ReporteAsistencia() {
  const { puedeVer } = usePermisos();
  const { data, loading, consultar } = useReporteAsistencia();

  if (!puedeVer) return <div>Sin permiso para ver este reporte.</div>;
  if (loading)
    return (
      <LoadingScreen
        isVisible
        title="Cargando reporte..."
        variant="fullscreen"
      />
    );

  return (
    <div className="page">
      <h1>Reporte de asistencia</h1>
      <FiltrosPanel onConsultar={consultar} />
      <TablaReporte data={data} />
    </div>
  );
}
```

### 4.6 Paso 6 · Ruta en `App.jsx`

```jsx
<Route
  path="/sistemas/reporte_asistencia"
  element={
    <PrivateRoute>
      <Layout>
        <ReporteAsistencia />
      </Layout>
    </PrivateRoute>
  }
/>
```

### 4.7 Paso 7 · Prueba

1. Login como admin.
2. Verificar que aparece "Reporte de asistencia" en el menú Sistemas.
3. Navegar a la ruta.
4. Aplicar filtros y verificar datos.
5. Cambiar de usuario a uno sin permiso — debe redirigir o mostrar "sin permiso".

### 4.8 Paso 8 · Documentar

- Añadir el endpoint al [documento 09](./09-api-endpoints.md).
- Añadir el módulo al [23 · Módulos](./23-modulos/README.md).
- Si tocaste esquema BD, añadir la tabla al [documento 14](./14-base-de-datos.md).

---

## 5 · Cómo añadir una acción al framework LAN

Ver [05 §12](./05-framework-interno.md). Resumen:

1. Elegir módulo (`general`/`comercial`/`financiero`/`inventario`/`system`).
2. Crear/editar la clase `{Xxx}Repo` con `public function nombreDelMetodo($input)`.
3. Registrar `require_once` en `index.php`.
4. Registrar la clave en el mapa `$rutas`.
5. Documentar en [documento 09](./09-api-endpoints.md).

---

## 6 · Convenciones de código

Ver detalle completo en [22 · Convenciones](./22-convenciones.md). Resumen crítico:

### 6.1 PHP

- **Un archivo = un endpoint** (Patrón A) o **un `endpoint.php` por dominio** (Patrón B — para dominios grandes).
- Incluir siempre en este orden: `cors.php` → `database.php` → `models/*.php` → `auth.php` → `check_permission.php`.
- `header('Content-Type: application/json')` explícito.
- **Validar método HTTP** al inicio (`405` si no es `POST`).
- **Validar payload** antes de tocar BD (400 si falta algo).
- **Prepared statements siempre**. Nunca `"SELECT ... WHERE x = '$x'"`.
- Respuestas: `{success: bool, message: string, data: any}` para operaciones; `{success:true, resultado: any}` cuando viene de LanClient.
- `try/catch` global con `Logger::error` en el catch.

### 6.2 JavaScript / React

- **Componentes funcionales + hooks.** Sin clases.
- **Nombres:**
  - Componentes: PascalCase (`ReporteAsistencia.jsx`).
  - Hooks: `useCamelCase`.
  - Archivos utilitarios: camelCase (`formatoAsistencia.js`).
- **Imports:** absolutos con `@/` (nunca `../../../..`).
- **Estilo:** CSS Modules (`Component.module.css`) o clases tailwind-like (según convención del módulo).
- **Estado:** `useState` para local, contextos para global (Auth, Empresa, Menu, Notification).
- **Efectos:** siempre con array de dependencias explícito.

### 6.3 SQL

- **Tabla nombres:** `snake_case`, plural (`usuarios`, `pedidos_carnes`).
- **Columnas:** `snake_case`.
- **PK:** `id int auto_increment` salvo entidades con clave natural (`sedes.id_sede varchar(3)`).
- **FK:** `id_<tabla_padre>` (ej. `id_pedido`, `id_sede`).
- **Charset y collation:** `utf8mb4_unicode_ci`.
- **Bandera activa/inactiva:** `activo tinyint(1) DEFAULT 1`.

---

## 7 · Debugging

### 7.1 Frontend

- **DevTools → Network** — inspeccionar cada request/response al backend.
- **React DevTools** — para inspeccionar contextos y estado de componentes.
- **`console.log` con etiqueta** — `console.log('[useRecaudosData]', data)`. Fácil de filtrar.
- **`localStorage.setItem('debug', 'true')`** convención opcional — algunos hooks pueden loggear más si detectan esta llave.

### 7.2 Backend cPanel

- **`sys_logs`** — todo lo importante queda ahí:
  ```sql
  SELECT * FROM sys_logs
  WHERE usuario = 'jperez' AND timestamp > NOW() - INTERVAL 1 HOUR
  ORDER BY timestamp DESC;
  ```
- **`error_log` del hosting** — errores de nivel PHP: `/home/<user>/logs/error_log`.
- **Habilitar temporalmente `display_errors=1`** en un endpoint específico (solo en local, nunca en producción).

### 7.3 Framework LAN

- **`repo/logs/fallback_error.log`** — cuando la API central de logs falla, se escribe aquí.
- **API central** — consultar en la UI del módulo Sistemas → Logs con filtro `aplicacion=API_Biable_CentOS`.
- **PostgreSQL** — habilitar `log_statement=all` temporalmente si se sospecha de una query pesada.

---

## 8 · Patrones a seguir

| Patrón                                    | Cuándo                               | Cómo                                                                          |
| ----------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| **Thin orchestrator**                     | Cualquier página de más de 50 líneas | Extraer lógica a `hooks/`, subcomponentes a `components/`, helpers a `utils/` |
| **`request()` con opciones declarativas** | Cualquier llamada al backend         | Ver [04 §9.2](./04-arquitectura-frontend.md)                                  |
| **`usePermisos` para condicional visual** | Botones y guards                     | `const { puedeCrear } = usePermisos()`                                        |
| **Cabecera-detalle**                      | Entidades con lista de items         | Ver `pedidos_carnes` en [14 §7.2](./14-base-de-datos.md)                      |
| **Trazabilidad por evento**               | Solicitudes con cambios de estado    | Ver `_trazabilidad` en [14 §7.4](./14-base-de-datos.md)                       |
| **`LanClient::post`**                     | Cualquier consulta al ERP            | Nunca conectar directamente a PostgreSQL desde cPanel                         |

---

## 9 · Antipatrones a evitar

| Antipatrón                                            | Por qué evitar               | Solución                                            |
| ----------------------------------------------------- | ---------------------------- | --------------------------------------------------- |
| `SELECT ... WHERE x = '$_POST[x]'`                    | Inyección SQL                | Prepared statement                                  |
| Query directa a PostgreSQL desde el backend           | Rompe el aislamiento del ERP | Usar `LanClient::post`                              |
| `document.getElementById` en un componente React      | Rompe la abstracción         | `useRef`                                            |
| Verificar permisos solo en el frontend                | Bypass trivial               | Verificar también en backend con `check_permission` |
| Guardar el token en `sessionStorage` sin invalidar    | Deja tokens huérfanos        | `logout()` explícito o dejar expirar                |
| `dangerouslySetInnerHTML` con contenido no sanitizado | XSS                          | Renderizar como texto o sanitizar                   |
| `console.log` con datos sensibles                     | Fuga en producción           | Eliminar antes de commit                            |
| Editar directamente en producción vía File Manager    | Sin rollback                 | Deploy formal con backup                            |

---

## 10 · Recursos internos

| Archivo o carpeta                   | Contenido                                    |
| ----------------------------------- | -------------------------------------------- |
| `docs/`                             | Toda esta documentación                      |
| `docs/README.md`                    | Índice maestro con estado                    |
| Slack / Teams #dev                  | Canal de dudas (⚠ crear si no existe)        |
| Panel administrativo del aplicativo | Fuente de verdad para menús, roles, permisos |

---

## 11 · Referencias cruzadas

| Necesitas saber…                           | Documento                                                |
| ------------------------------------------ | -------------------------------------------------------- |
| Arquitectura general y capas               | [02](./02-arquitectura-general.md)                       |
| Cómo se autentica y autoriza               | [10](./10-autenticacion.md) · [11](./11-autorizacion.md) |
| Cómo se despliega                          | [16](./16-deploy.md)                                     |
| Cómo se diagnostican errores en producción | [18](./18-manual-soporte.md)                             |
| Todas las convenciones detalladas          | [22](./22-convenciones.md)                               |
| Cómo agregar tests, CI/CD                  | [28 · Roadmap](./28-roadmap.md)                          |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 17 — Manual del Desarrollador · v1.0 · 14 de julio de 2026</sub>
</div>
