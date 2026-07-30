<div align="center">

<img src="../../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 23 · Módulo Informes

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                     |
| -------------------- | ------------------- |
| **Documento**        | 23 — Informes       |
| **Versión**          | 1.0                 |
| **Fecha**            | 14 de julio de 2026 |
| **Depende de**       | 03, 04, 09, 11, 14  |
| **Confidencialidad** | Uso interno         |

---

## 1 · Objetivo

El módulo **Informes** presenta al usuario **dashboards embebidos externos** (Power BI / Metabase / Looker Studio / otros) mediante URLs. Cada informe es visible solo por los usuarios cuya combinación de **área** y **cargo** lo autoriza.

Es el módulo más simple del aplicativo — no consume framework LAN ni tiene lógica compleja. Su valor está en la **capa de autorización** que decide qué informes ve cada usuario.

---

## 2 · Actores

| Actor               | Rol       | Cargo típico                          |
| ------------------- | --------- | ------------------------------------- |
| Directivo           | `usuario` | Gerente, jefe de área                 |
| Contador            | `usuario` | Contador                              |
| Analista financiero | `usuario` | Analista                              |
| Administrador IT    | `admin`   | Configura los informes y sus permisos |

---

## 3 · Rutas del frontend

| Ruta                      | Componente                                                   |
| ------------------------- | ------------------------------------------------------------ |
| `/informes`               | `Informes` (galería de informes disponibles para el usuario) |
| `/configuracion/informes` | Administración desde AdminPanel                              |

**Vista de galería:** lista de tarjetas con `titulo`, `descripcion`, `color`, ícono. Al hacer clic, se abre el iframe con la URL externa.

---

## 4 · Componentes React

Fuente: `frontend/src/components/Informes/` y `frontend/src/components/AdminPanel/Informes/`.

**Vista de usuario** (galería en `/informes`):

```
Informes/
├── Informes.jsx                       ← orquestador — galería
├── hooks/
│   └── useInformes.js                 ← fetch informes accesibles al usuario
├── components/
│   ├── InformesGrid.jsx               ← grid responsivo de tarjetas
│   ├── InformeCard.jsx                ← tarjeta con título, descripción, color
│   └── InformeViewer.jsx              ← iframe modal o vista dedicada
└── utils/
    └── (helpers menores)
```

**Vista administrativa** (modal de creación/edición en `/configuracion/informes`) — **refactorizada en v1.x (2026-07-17)**:

```
AdminPanel/Informes/
├── InformeFormTab.jsx                 ← form del modal (crear/editar)
├── hooks/
│   └── useInformeForm.js              ← estado + validación + handleChange numérico para 'orden'
└── ...
```

⚠ Componentes exactos inferidos por convención — verificar en el filesystem.

### 4.1 Sobre el iframe

El iframe carga la URL configurada. **El aplicativo no controla la autenticación del sitio externo** — depende de cada proveedor (Power BI usa Azure AD que si coincide con el SSO del aplicativo puede aprovecharlo, Metabase requiere login separado, etc.).

### 4.2 · Campo `orden` con auto-cálculo (añadido en v1.x, 2026-07-17)

`InformeFormTab.jsx` incluye al final de la segunda columna un campo numérico "Orden de visualización" con un placeholder descriptivo:

> "Dejar vacío para asignar automáticamente el siguiente consecutivo"

**Comportamiento en `useInformeForm.js`:**

- El `handleChange` procesa el campo como numérico: si el usuario escribe `5`, el hook guarda `5`.
- Si el usuario **borra por completo** el contenido del campo, el hook guarda `null` (no `""` ni `0`).
- Al enviar el form, el payload al backend contiene `orden: null` cuando el usuario dejó el campo vacío — señal para que `create_informe.php` calcule `MAX(orden) + 1`.

Se **inicializa y propaga correctamente** en creación y edición — ver §5.1 y §5.2 para el comportamiento del backend.

---

## 5 · Endpoints backend

Fuente: `backend/backend/api/informes/`. Patrón A.

| Endpoint                | Auth                                                 | Propósito                                            |
| ----------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| `get_informes.php`      | Bearer                                               | Lista de informes visibles para el usuario en sesión |
| `create_informe.php`    | Bearer + Permiso `/configuracion/informes` · `crear` | Alta con permisos por área/cargo. **Auto-orden desde v1.x.** |
| `update_informe.php`    | Bearer + Permiso `editar`                            | Edición **defensiva** desde v1.x — respeta valores actuales para campos ausentes en el payload |
| `update_bulk_order.php` | Bearer + Permiso `editar`                            | Reordenamiento en drag-and-drop                      |

**Sin endpoint `delete`** — soft delete o eliminación de las filas de acceso.

### 5.1 `create_informe.php` — auto-cálculo de `orden` (v1.x)

Si el payload **no incluye** `orden` (o llega como `null`), el endpoint calcula dinámicamente el siguiente consecutivo **dentro de la misma transacción**:

```php
$db->beginTransaction();

$orden = $input['orden'] ?? null;
if ($orden === null) {
    // Consulta dentro de la misma transacción para evitar race conditions
    $stmt = $db->query("SELECT COALESCE(MAX(orden), 0) + 1 AS next_orden FROM informes");
    $orden = $stmt->fetchColumn();
}

$stmt = $db->prepare("INSERT INTO informes (titulo, descripcion, id_area, url, color, orden, activo) VALUES (:titulo, :descripcion, :id_area, :url, :color, :orden, 1)");
$stmt->execute([...]);

// resto de la inserción (informe_area, informe_cargo)
$db->commit();
```

**Puntos técnicos:**

- El `COALESCE(MAX(orden), 0) + 1` **funciona incluso cuando la tabla está vacía** — devuelve `1`.
- La consulta y el INSERT ocurren **dentro de la misma transacción**, así que dos creaciones concurrentes no producen orden duplicado (el `SELECT ... FOR UPDATE` explícito sería aún más estricto, pero con el nivel de aislamiento por defecto de InnoDB — REPEATABLE READ — el escenario ya está protegido en la práctica).
- Si el frontend **sí envía** `orden` explícito (usuario lo especificó), se respeta ese valor sin recalcular.

### 5.2 `update_informe.php` — patch semantics defensivas (v1.x)

Antes de v1.x, el endpoint sobrescribía todos los campos con lo que llegara en el payload — un campo ausente se convertía en `NULL` o valor por defecto. Esto obligaba al frontend a enviar el objeto completo aunque solo cambiara un valor.

Desde v1.x, el endpoint **lee los valores actuales del registro dentro de la transacción**, y para cada propiedad opcional (`orden`, `color`, `descripcion`, `url_icono` cuando aplique) usa lo del payload solo si viene definido:

```php
$db->beginTransaction();

// 1. Leer valores actuales
$stmt = $db->prepare("SELECT * FROM informes WHERE id = :id FOR UPDATE");
$stmt->execute(['id' => $id]);
$actual = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$actual) { /* 404 */ }

// 2. Merge — payload gana solo cuando trae la propiedad
$orden = array_key_exists('orden', $input) ? $input['orden'] : $actual['orden'];
$color = array_key_exists('color', $input) ? $input['color'] : $actual['color'];
$titulo = $input['titulo'] ?? $actual['titulo'];       // titulo sí es obligatorio, pero se mantiene si viene igual
// ...

// 3. UPDATE con los valores mezclados
$stmt = $db->prepare("UPDATE informes SET titulo=:titulo, orden=:orden, color=:color, ... WHERE id=:id");
$stmt->execute([...]);
$db->commit();
```

**Comportamiento resultante:**

- Enviar `{ id: 5, titulo: "Nuevo título" }` → cambia solo el título. Los demás campos permanecen intactos.
- Enviar `{ id: 5, orden: null }` → **explícitamente** setea `orden` a null (distinto de omitir el campo).
- Enviar `{ id: 5, color: "#00ff00" }` → cambia solo el color.

Distinción crítica entre **omisión** (`array_key_exists` es false) y **valor null explícito** (`array_key_exists` es true, valor es null). El endpoint respeta esa semántica.

---

## 6 · Acciones del framework LAN

**Ninguna.** Módulo puramente local.

---

## 7 · Tablas MySQL

Ver [14 §5](../14-base-de-datos.md).

```mermaid
erDiagram
    INFORMES ||--o{ INFORME_AREA : "visible en áreas"
    INFORMES ||--o{ INFORME_CARGO : "visible por cargo"
    AREAS ||--o{ INFORME_AREA : ""
    CARGOS ||--o{ INFORME_CARGO : ""

    INFORMES {
        int id PK
        varchar titulo
        varchar descripcion
        int id_area FK "área dueña"
        text url "URL embebida"
        varchar color "#hex"
        int orden
        tinyint activo
    }
    INFORME_AREA {
        int id_informe FK
        int id_area FK
    }
    INFORME_CARGO {
        int id_informe FK
        int id_cargo FK
    }
```

### 7.1 Semántica

- `informes.id_area` es el **área dueña** del informe (para clasificación).
- `informe_area` es la lista de **áreas que pueden ver** el informe (N a N).
- `informe_cargo` es la lista de **cargos que pueden ver** el informe (N a N).

**Un usuario ve un informe si:**

- Su `id_area` está en `informe_area` para ese informe, **O**
- Su `id_cargo` está en `informe_cargo` para ese informe.

⚠ La regla exacta (**OR** entre área y cargo, o **AND**) debe verificarse en `get_informes.php`. La convención del módulo Menús es AND, pero para Informes tiene más sentido OR.

---

## 8 · Reglas de negocio

### 8.1 Visibilidad por combinación

Detallado en §7.1. Requiere verificación empírica del AND vs OR.

### 8.2 Reordenamiento por drag-and-drop

`orden` numérico permite ordenar visualmente. El endpoint `update_bulk_order.php` recibe una lista `[{id, orden}]` y actualiza en batch.

### 8.3 Color como identidad visual

Cada informe tiene `color` en formato `#hex` — se usa en el fondo o borde de la tarjeta. Permite identidad visual por informe (verde para financieros, azul para operaciones, etc.).

### 8.4 URL sin validación de dominio

`informes.url` acepta cualquier URL. El administrador es responsable de que el sitio destino sea seguro y confiable.

**Riesgo:** un admin malicioso podría añadir un informe apuntando a un phishing con estilo corporativo. Mitigable con validación de dominio permitido.

### 8.5 Sin borrado hard

El endpoint `delete` no existe. Ocultar un informe requiere `activo = 0` desde AdminPanel.

### 8.6 Auto-cálculo de `orden` en creación (v1.x)

Ver §5.1. Si el usuario deja el campo vacío al crear, el sistema asigna `MAX(orden) + 1`. Consecuencia práctica: crear un informe sin pensar en el orden lo pone **al final** de la galería — comportamiento intuitivo.

### 8.7 Actualización defensiva con patch semantics (v1.x)

Ver §5.2. `update_informe.php` respeta los valores actuales para propiedades opcionales ausentes en el payload. Consecuencia: el frontend puede enviar payloads parciales y no perder información — más seguro y menos verboso.

---

## 9 · Flujos principales

### 9.1 Consultar informes del usuario

```mermaid
sequenceDiagram
    participant U as Directivo
    participant SPA as Informes
    participant BE as Backend
    participant DB as MySQL

    U->>SPA: navega a /informes
    SPA->>BE: POST get_informes.php
    BE->>DB: SELECT informes JOIN informe_area/informe_cargo<br/>WHERE user.id_area OR user.id_cargo
    DB-->>BE: informes visibles
    BE-->>SPA: lista
    SPA-->>U: grid de tarjetas
    U->>SPA: clic en tarjeta
    SPA->>SPA: abre iframe con la URL
```

### 9.2 Administrar un informe

```mermaid
sequenceDiagram
    participant A as Admin
    participant SPA as AdminPanel/Informes
    participant BE
    participant DB

    A->>SPA: clic Nuevo Informe
    A->>SPA: llena título, descripción, URL, color
    A->>SPA: selecciona áreas y cargos con acceso
    SPA->>BE: POST create_informe.php
    BE->>DB: BEGIN
    BE->>DB: INSERT informes
    BE->>DB: INSERT informe_area x N
    BE->>DB: INSERT informe_cargo x N
    BE->>DB: COMMIT
    BE-->>SPA: OK

    Note over A: Reordenar visualmente
    A->>SPA: drag-and-drop
    SPA->>BE: POST update_bulk_order.php items=[...]
    BE->>DB: UPDATE informes SET orden=?
    BE-->>SPA: OK
```

---

## 10 · Permisos por acción

| Ruta                      | Cargo             |              ver              | crear | editar | eliminar  |
| ------------------------- | ----------------- | :---------------------------: | :---: | :----: | :-------: |
| `/informes`               | Cualquier usuario | ✅ (según informe_area/cargo) |  ❌   |   ❌   |    ❌     |
| `/configuracion/informes` | Admin IT          |              ✅               |  ✅   |   ✅   | ✅ (soft) |

---

## 11 · Notificaciones y cronjobs

**Ninguno.**

---

## 12 · Deuda técnica del módulo

### 12.1 URL sin validación de dominio permitido

Ver §8.4. Riesgo controlable con lista blanca de dominios en `create_informe.php`.

**Esfuerzo:** XS.

### 12.2 SSO cruzado no aprovechado

El aplicativo autentica con Microsoft. Si el informe externo también usa Azure AD (típico en Power BI), el usuario debería tener SSO cruzado automático. Actualmente hay que ingresar credenciales dos veces si el iframe no comparte sesión.

**Mitigación:** para Power BI, configurar la app registration con SSO delegado. Para Metabase, integrar con OIDC.

### 12.3 Sin auditoría de acceso a informes

No se registra qué usuario abrió qué informe cuándo. Para BI ejecutivo puede ser útil saber quién consulta qué.

**Recomendación:** endpoint que registre acceso al abrir el iframe.

### 12.4 Sin metricas de uso

No hay dashboard de "informes más consultados" o "informes sin uso". Ayudaría a decidir qué mantener vs deprecar.

---

## 13 · Puntos pendientes de análisis

- **Lógica exacta AND vs OR** en `get_informes.php` (área + cargo).
- **Integración SSO cruzada** con proveedor de BI (documentar si existe).
- **Tamaño real del iframe** — full-screen vs modal.
- **Multi-nivel de organización** — ¿los informes se agrupan por categorías?

---

## 14 · Referencias cruzadas

| Necesitas…                          | Documento                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Ver estructura de tablas            | [../14-base-de-datos.md#5-dominio-sistemas--plataforma](../14-base-de-datos.md) |
| Ver endpoints del módulo            | [../09-api-endpoints.md#7-informes-apiinformes](../09-api-endpoints.md)         |
| Ver AdminPanel donde se administran | [./admin-panel.md](./admin-panel.md)                                            |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 23 — Módulo Informes · v1.0 · 14 de julio de 2026</sub>
</div>
