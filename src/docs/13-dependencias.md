<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 13 · Dependencias

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                                                          |
| -------------------- | ------------------------------------------------------------------------ |
| **Documento**        | 13 — Dependencias                                                        |
| **Versión**          | 1.0                                                                      |
| **Fecha**            | 14 de julio de 2026                                                      |
| **Depende de**       | 03 · Backend · 04 · Frontend · 05 · Framework                            |
| **Lo usan**          | 12 · Seguridad · 16 · Deploy · 25 · Refactorización · 26 · Deuda Técnica |
| **Confidencialidad** | Uso interno                                                              |

---

## 1 · Objetivo

Inventariar **todas las librerías y dependencias externas** utilizadas por cada capa del sistema, con propósito, ubicación en el código y observaciones de mantenimiento (versiones, riesgos, alternativas). Incluye dependencias de frontend (npm), backend (PHP vendorizadas) y framework LAN (ninguna).

---

## 2 · Resumen por capa

| Capa                       | Gestor                     |                     Cantidad | Estrategia de distribución                   |
| -------------------------- | -------------------------- | ---------------------------: | -------------------------------------------- |
| Frontend                   | npm (`package.json`)       | **28 runtime + 11 dev = 39** | `node_modules/` — reconstruido en cada build |
| Backend cPanel             | Copia directa              | **7 librerías vendorizadas** | Copiadas en `backend/utils/`                 |
| Backend cPanel — `vendor/` | Composer (parcial)         |          4 paquetes visibles | `backend/utils/vendor/` con `autoload.php`   |
| Framework LAN              | **Ninguna**                |                            0 | Solo PHP estándar (PDO, cURL, json\_\*)      |
| Cronjobs                   | Comparten `backend/utils/` |                            — | Reutilizan las mismas librerías del backend  |

**Observación clave del framework LAN:** cero dependencias externas. Todo se resuelve con PHP built-ins. Es una fortaleza estructural (ver [05 §13](./05-framework-interno.md)) — sin CVEs de terceros ni `composer.json` que mantener.

---

## 3 · Frontend — dependencias runtime

Fuente: `frontend/package.json`. Total: **28 dependencias runtime** (era 27 hasta v1.x; se sumó `darkreader`).

### 3.1 Núcleo React + Vite

| Paquete            | Versión   | Propósito           | Dónde se usa                |
| ------------------ | --------- | ------------------- | --------------------------- |
| `react`            | `^19.2.1` | Framework UI        | Todo el proyecto            |
| `react-dom`        | `^19.2.1` | Renderer navegador  | `main.jsx`                  |
| `react-router-dom` | `^7.8.2`  | Ruteo declarativo   | `App.jsx` (~40 rutas)       |
| `core-js`          | `^3.47.0` | Polyfills ES2015+   | Compat navegadores antiguos |
| `whatwg-fetch`     | `^3.6.20` | Polyfill de `fetch` | Compat navegadores antiguos |

### 3.2 Iconografía — tres bibliotecas convivientes

⚠ **Deuda observada:** tres bibliotecas de íconos para el mismo propósito.

| Paquete                                                                | Versión             | Propósito                             | Recomendación                           |
| ---------------------------------------------------------------------- | ------------------- | ------------------------------------- | --------------------------------------- |
| `lucide-react`                                                         | `^0.544.0`          | Íconos SVG modernos (uso mayoritario) | **Mantener** — es la librería principal |
| `react-icons`                                                          | `^5.5.0`            | Colección alternativa (uso puntual)   | Migrar a lucide y eliminar              |
| `@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons` | `^3.0.2` / `^7.0.1` | FontAwesome (uso residual histórico)  | Migrar a lucide y eliminar              |

**Impacto:** ~150–300 KB extra en el bundle. Consolidar reduce peso y mantenimiento (documentado en 25).

### 3.3 Animaciones y transiciones

| Paquete                  | Versión     | Propósito                                                |
| ------------------------ | ----------- | -------------------------------------------------------- |
| `framer-motion`          | `^12.23.22` | Animaciones declarativas (mount/unmount, drag, gestos)   |
| `react-transition-group` | `^4.4.5`    | Transiciones CSS legacy — se usa en componentes antiguos |

⚠ Coexisten dos librerías de animación. Recomendación: migrar todo a `framer-motion`.

### 3.3bis Tematización — modo oscuro (añadido en v1.x, 2026-07-17)

| Paquete      | Versión         | Propósito                                                                          |
| ------------ | --------------- | ---------------------------------------------------------------------------------- |
| `darkreader` | `^4.9.x` (verificar) | Aplicar modo oscuro **dinámicamente** al DOM sin escribir CSS por componente |

`DarkReader` inspecciona el DOM y genera reglas CSS invertidas al vuelo. Ventajas frente a hacer el modo oscuro con variables CSS o clases:

- **Cero cambios** en el CSS existente de cada módulo — funciona sobre el sistema visual actual (`#03996b`, `#f5f5f7`, `-apple-system`) sin refactor.
- **Consistencia** — el algoritmo aplica la misma lógica a todos los componentes.
- **Reversible** — un toggle activa/desactiva sin recargar la app.

**Trade-off:** el algoritmo no es infalible en imágenes, íconos y componentes con muchos gradientes; hay componentes que pueden requerir ajustes específicos (ver §3.3bis.2).

#### 3.3bis.1 Integración

- Hook **TypeScript** `useDarkMode.ts` que persiste la preferencia en `localStorage` y aplica/quita el modo con `enable()` / `disable()` de DarkReader.
- Toggle en la **topbar** que dispara el hook.
- Al arrancar la app, el hook lee la preferencia guardada y la aplica antes del primer render.

#### 3.3bis.2 Riesgos y ajustes conocidos

- **Logo corporativo** e íconos SVG con colores fijos pueden verse mal invertidos — DarkReader tiene una lista de exclusión (`ignoreImageAnalysis`) para forzar mantener colores originales en ciertos selectores.
- **Módulo Publicidad** (`TemplateCanvas`) trabaja con SVG que representan la etiqueta impresa — **debe excluirse** del modo oscuro porque la impresión será siempre en fondo blanco. Se sugiere excluir todo `.publicidad-canvas *`.
- **Iframes de informes externos** (Power BI, Metabase) — el modo oscuro **no atraviesa iframes cross-origin**. Cada proveedor tiene su propio tema. Actualmente es una limitación aceptada.

### 3.4 Documentos y exportación

| Paquete           | Versión   | Propósito                       | Duplicidad                               |
| ----------------- | --------- | ------------------------------- | ---------------------------------------- |
| `exceljs`         | `^4.4.0`  | Generar `.xlsx` con estilos     | —                                        |
| `xlsx`            | `^0.18.5` | Alternativa `.xlsx` (SheetJS)   | ⚠ Duplicidad con exceljs                 |
| `jspdf`           | `^3.0.4`  | Generar PDF client-side         | —                                        |
| `jspdf-autotable` | `^5.0.2`  | Tablas para jsPDF               | Complementa jspdf                        |
| `html2canvas`     | `^1.4.1`  | Snapshot DOM → canvas para PDF  | Complementa jspdf                        |
| `react-to-print`  | `^3.2.0`  | Impresión directa del navegador | —                                        |
| `file-saver`      | `^2.0.5`  | Descarga de blobs               | Casos donde el navegador no lo hace solo |

⚠ **Duplicidad exceljs vs xlsx** — determinar cuál se usa realmente en cada módulo y consolidar en uno solo.

### 3.5 Captura de imagen y multimedia

| Paquete                     | Versión  | Propósito                             |
| --------------------------- | -------- | ------------------------------------- |
| `react-webcam`              | `^7.2.0` | Captura de webcam (Visitantes, CVM)   |
| `browser-image-compression` | `^2.0.2` | Compresión client-side antes de subir |

### 3.6 Escaneo de códigos — cuatro bibliotecas

⚠ **La duplicidad más marcada del proyecto.** Cuatro librerías para leer códigos de barras/QR:

| Paquete                             | Versión              | Uso observable                                               |
| ----------------------------------- | -------------------- | ------------------------------------------------------------ |
| `@zxing/browser` + `@zxing/library` | `^0.1.5` / `^0.21.3` | Barcode moderno (recomendada) — Lector Precios, Codificación |
| `html5-qrcode`                      | `^2.3.8`             | QR con UI incorporada                                        |
| `jsqr`                              | `^1.4.0`             | QR ligero, canvas puro                                       |
| `quagga`                            | `^0.12.1`            | Barcode legacy (JS puro, primera generación)                 |

**Impacto en bundle:** ~500–800 KB combinados. Consolidar en `@zxing/*` reduciría el bundle significativamente (documentado en 25).

---

## 4 · Frontend — dependencias de desarrollo (11)

Fuente: `frontend/package.json` → `devDependencies`.

| Paquete                       | Versión    | Propósito                                                                                                 |
| ----------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `vite`                        | `^7.1.2`   | Bundler + dev server                                                                                      |
| `@vitejs/plugin-react`        | `^5.0.0`   | Fast Refresh + JSX transform                                                                              |
| `vite-plugin-imagemin`        | `^0.6.1`   | Optimización de imágenes en build (gifsicle, optipng, mozjpeg, pngquant, svgo)                            |
| `vite-plugin-css-modules`     | `^0.0.1`   | Soporte extra para CSS Modules (aunque Vite ya trae CSS Modules nativo — evaluar si sigue haciendo falta) |
| `eslint`                      | `^9.33.0`  | Linting                                                                                                   |
| `@eslint/js`                  | `^9.33.0`  | Config JS estándar                                                                                        |
| `eslint-plugin-react-hooks`   | `^5.2.0`   | Reglas de hooks                                                                                           |
| `eslint-plugin-react-refresh` | `^0.4.20`  | Regla Fast Refresh                                                                                        |
| `globals`                     | `^16.3.0`  | Variables globales para ESLint                                                                            |
| `@types/react`                | `^19.1.10` | Tipos para autocomplete (no hay TS activo — es solo para el editor)                                       |
| `@types/react-dom`            | `^19.1.7`  | Idem                                                                                                      |

⚠ **`vite-plugin-css-modules@0.0.1`** — versión pre-release, plugin de terceros con muy poca adopción. Vite ya soporta CSS Modules nativo. Recomendación: evaluar si sigue siendo necesario y removerlo si no.

---

## 5 · Backend cPanel — librerías vendorizadas (`backend/utils/`)

**Distribución por copia directa** (no vía Composer, salvo `vendor/` § 6). Cada librería está en su carpeta con la estructura del repo original de GitHub.

| Carpeta                  | Librería                   | Propósito en el aplicativo                                    | Módulos que la usan                                                                                          |
| ------------------------ | -------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `PhpSpreadsheet-master/` | PhpSpreadsheet (PHPOffice) | Exportar reportes contables/comerciales a `.xlsx` con formato | Separatas (`download_report_separata.php`), Recaudos, Auditoría DIAN, Libro auxiliar                         |
| `TCPDF-main/`            | TCPDF                      | Generación de PDF (certificados fiscales, comprobantes)       | Retenciones, Comprobantes CE, Actas                                                                          |
| `tc-lib-pdf-main/`       | tc-lib-pdf                 | Motor PDF alternativo, mejor para documentos complejos        | Actas de entrega (con firma digital)                                                                         |
| `fpdf/`                  | FPDF                       | PDF ligero (uso legacy — reemplazable por TCPDF)              | Formatos antiguos                                                                                            |
| `ZipStream-PHP-main/`    | ZipStream-PHP              | Descarga de ZIPs sin materializar en memoria                  | Descargas voluminosas de reportes con adjuntos                                                               |
| `phpmailer/`             | PHPMailer                  | Cliente SMTP saliente hacia `mail.…:465`                      | Notificaciones CVM (`verificar_registros_cvm.php`), Actas (envío de firma), Solicitudes (aprobación/rechazo) |

### 5.1 Riesgos y recomendaciones

- **Actualización manual:** cada CVE en cualquiera de estas librerías obliga a descargar el nuevo tarball, comparar diffs y reemplazar la carpeta. **Sin trazabilidad de versiones exactas.**
- **Sin `composer.json` maestro** que declare estas dependencias como `require`.
- **Recomendación (25):** migrar todas a Composer. La transición no es urgente al volumen actual pero simplificaría drasticamente el mantenimiento.

---

## 6 · Backend cPanel — Composer parcial (`backend/utils/vendor/`)

Coexiste con el patrón "copia directa" — evidencia de una migración parcial a Composer que quedó incompleta.

Estructura observada:

```
backend/utils/vendor/
├── autoload.php
├── composer/
├── maennchen/       ← posiblemente ZipStream-PHP (repo maennchen/ZipStream-PHP)
├── markbaker/       ← dependencias de PhpSpreadsheet (complex, matrix, ...)
├── phpoffice/       ← PhpSpreadsheet gestionado por Composer
└── psr/             ← PSR (probablemente psr/log, psr/simple-cache)
```

**Interpretación:** existe **doble instalación** de al menos PhpSpreadsheet — copia directa en `PhpSpreadsheet-master/` y vía Composer en `vendor/phpoffice/`. Es deuda técnica clara.

**Acción para 25:**

1. Determinar cuál se usa realmente en cada endpoint (revisando `require`/`include` en el código).
2. Consolidar en la versión de Composer.
3. Eliminar la carpeta obsoleta.

---

## 7 · Framework LAN — cero dependencias

`repo/` **no tiene `composer.json`**, **no tiene `vendor/`**, **no tiene librerías externas**. Todo se resuelve con:

- **PHP built-ins:** `PDO`, `curl_*`, `json_encode/json_decode`, `date`, `error_reporting`.
- **Código propio:** 5 clases en `core/` (~250 líneas) — Logger, Response, Env, Database, AuthMiddleware.

### 7.1 Consecuencias

- ✅ **Sin CVEs de terceros.** El framework LAN nunca hereda vulnerabilidades de librerías externas.
- ✅ **Cero curva de aprendizaje** para nuevos desarrolladores — todo lo que hay que entender está en el propio código.
- ✅ **Actualización trivial de PHP** — no hay compatibilidades de librerías que verificar.
- ⚠ **Reinventar la rueda:** si el equipo necesita alguna funcionalidad no trivial (autoload PSR-4, ORM, migraciones, tests), tendría que escribirla.

### 7.2 Requerimientos del entorno

- **PHP:** ≥ 7.4 (por `random_bytes`, `password_hash`, sintaxis moderna). Compatible con PHP 8.x sin cambios.
- **Extensiones PHP:** `pdo_pgsql`, `curl`, `json`, `openssl` (para HTTPS).

---

## 8 · Runtime PHP — versiones y extensiones

### 8.1 Hosting cPanel

- **PHP:** 7 y 8 (activadas ambas — visible en `.htaccess` con directivas para `mod_php7` y `mod_php8`).
- **Extensiones requeridas** (inferidas de código):
  - `pdo_mysql` — todas las queries de MySQL
  - `curl` — `LanClient` y `remote_logger`
  - `mbstring` — PhpSpreadsheet, TCPDF
  - `openssl` — SMTP TLS
  - `gd` o `imagick` — TCPDF con imágenes, redimensionamiento
  - `zip` — ZipStream-PHP
  - `json` — todo
  - `fileinfo` — validación MIME en uploads
  - `session` — sesiones nativas (aunque el aplicativo no las usa, sí las usa PHPMailer internamente)

### 8.2 Servidor LAN

- **PHP:** ≥ 7.4 (inferido del uso de `random_bytes(32)` sin fallback y sintaxis moderna).
- **Extensiones:** `pdo_pgsql`, `curl`, `json`, `openssl`.

---

## 9 · Herramientas de línea de comandos (cronjobs)

Los cronjobs (`backend/backend/cron/*.php`) usan PHP CLI. Sin librerías externas propias — reutilizan PHPMailer del `backend/utils/`.

Requerimientos: PHP CLI 7.4+ con las extensiones de §8.1.

---

## 10 · MCP / integraciones externas

### 10.1 Microsoft 365 / Entra ID

- **No hay SDK oficial de PHP incluido.** El backend hace llamadas HTTP directas a `login.microsoftonline.com/{tenant}/oauth2/v2.0/token` y `graph.microsoft.com/v1.0/me` con `curl` nativo (ver [10 §4](./10-autenticacion.md)).
- Ventaja: cero dependencias frágiles a SDK.
- Desventaja: si Microsoft cambia el flujo, hay que reescribir a mano.

### 10.2 Cloudflare / Cloudflare Tunnel

- **Binario externo (`cloudflared`)** corriendo en el servidor LAN.
- No es una dependencia del código PHP — es infraestructura (ver [08 §4](./08-diagramas-infraestructura.md)).

### 10.3 Agente WebSocket local (Publicidad)

- **Aplicación C# WPF** independiente instalada en las máquinas de usuarios (ver [04 §16](./04-arquitectura-frontend.md)).
- No es dependencia del código PHP ni JS — es un binario nativo.
- Comunicación por WebSocket sin librerías extra (usa `WebSocket` nativo del navegador).

---

## 11 · Matriz consolidada de duplicidades

Ver también [26 · Deuda Técnica](./26-deuda-tecnica.md).

| #   | Duplicidad     | Bibliotecas involucradas                                        | Recomendación                        |
| --- | -------------- | --------------------------------------------------------------- | ------------------------------------ |
| 1   | Íconos         | `lucide-react`, `react-icons`, `@fortawesome/*`                 | Consolidar en `lucide-react`         |
| 2   | Excel          | `exceljs`, `xlsx`                                               | Consolidar (evaluar cuál se usa más) |
| 3   | Barcode        | `@zxing/*`, `html5-qrcode`, `jsqr`, `quagga`                    | Consolidar en `@zxing/browser`       |
| 4   | Animaciones    | `framer-motion`, `react-transition-group`                       | Migrar todo a `framer-motion`        |
| 5   | PhpSpreadsheet | `utils/PhpSpreadsheet-master/`, `utils/vendor/phpoffice/`       | Consolidar en Composer               |
| 6   | PDF            | `TCPDF`, `tc-lib-pdf`, `fpdf`                                   | Consolidar en TCPDF                  |
| 7   | Logger         | `services/logger.php`, `utils/logger.php` (propio del proyecto) | Consolidar en uno                    |

---

## 12 · Política de actualización recomendada (para 19 · Operación)

1. **Frontend (npm):**
   - `npm audit` mensual en el entorno de desarrollo.
   - Actualización de dependencias menor (patch) automática con Renovate/Dependabot si el proyecto se sube a Git.
   - Actualización de dependencias mayor (major) trimestral con pruebas manuales.

2. **Backend — vendorizadas:**
   - Suscripción a listas de CVE de las 7 librerías.
   - Actualización manual al detectar CVE crítico.
   - Idealmente: **migrar a Composer** (25) para automatizar este flujo.

3. **PHP runtime:**
   - Alinear las versiones de PHP en cPanel y LAN.
   - Monitor de fin-de-vida (EOL) por versión mayor: PHP 8.1 EOL diciembre 2025, PHP 8.2 EOL diciembre 2026.

4. **Runtime JS (Node) en el ambiente de build:**
   - Alinear con LTS activa (Node 20 o 22).

---

## 13 · Referencias cruzadas

| Necesitas saber…                          | Documento                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Cómo se instala/despliega cada componente | [16 · Deploy](./16-deploy.md)                                                                 |
| Configuración y variables de entorno      | [15 · Configuración](./15-configuracion.md)                                                   |
| Uso concreto de cada librería (ejemplos)  | [04 · Frontend](./04-arquitectura-frontend.md) · [03 · Backend](./03-arquitectura-backend.md) |
| Análisis de seguridad de dependencias     | [12 · Seguridad](./12-seguridad.md)                                                           |
| Deuda técnica priorizada                  | [25 · Refactorización](./25-refactorizacion.md) · [26 · Deuda Técnica](./26-deuda-tecnica.md) |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 13 — Dependencias · v1.0 · 14 de julio de 2026</sub>
</div>
