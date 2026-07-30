<div align="center">

<img src="./src/assets/images/logo.png" alt="Supermercados Belalcázar" width="240" />

# Documentación Técnica del Sistema

**Abastecemos de Occidente S.A.S. — Supermercados Belalcázar**
**Aplicativo SEAO — `aplicativo.supermercadobelalcazar.com`**

<sub>Versión 1.0 · Documento maestro </sub>

</div>

---

## Aviso de documento

|                               |                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente interno**           | Abastecemos de Occidente S.A.S. (Supermercados Belalcázar)                                                                                                                   |
| **Autor de la documentación** | Área de Sistemas / TI                                                                                                                                                        |
| **Alcance del documento**     | Sistema completo: Frontend React, Backend PHP (cPanel), Framework de repositorios (servidor LAN), Base de datos MySQL / PostgreSQL, Infraestructura Cloudflare + Cloudflared |
| **Fecha de análisis**         | 14 de julio de 2026                                                                                                                                                          |
| **Fuente del análisis**       | `frontend.zip`, `backend.zip`, `repo.zip`, `mysqlphpmyadmin.sql`, `logo.png`                                                                                                 |
| **Confidencialidad**          | Uso interno — no distribuir fuera de la organización                                                                                                                         |

---

## 1 · Resumen del análisis técnico

Se analizaron **todos los archivos entregados** como un único sistema, sin modificar código. Todas las afirmaciones de esta documentación provienen del código fuente. Cuando algo no puede deducirse con certeza, se marca como **Hipótesis** e indica qué evidencia hace falta para confirmarlo.

### 1.1 Arquitectura observada

El sistema es un **aplicativo web interno de tres capas físicas** que atraviesa dos redes distintas:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR DEL USUARIO (SPA)                           │
│                    React 19 + Vite 7 + React Router 7                        │
│         https://aplicativo.supermercadobelalcazar.com  (Cloudflare)          │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │  fetch  →  Bearer token de sesión (MySQL)
                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│           BACKEND PHP EN cPanel  (Apache + PHP 7/8, MySQL 8.0)               │
│  /api/*  — 100+ endpoints REST‑like  ·  gestión de identidad y permisos     │
│  BD:  supermer_AplicativoSistemas  (MySQL)  →  usuarios, roles, menús,      │
│         permisos, pedidos, formularios, logs, actas, visitantes, etc.       │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │  cURL POST  →  Bearer + X-Usuario-Origen
                                │  api-biable.supermercadobelalcazar.com
                                ▼    (Cloudflare Tunnel — cloudflared)
┌──────────────────────────────────────────────────────────────────────────────┐
│         FRAMEWORK / ROUTER PHP  (servidor LAN interno, red 192.24.x.x)       │
│                /ngrok/index.php  ·  ruteo por campo `accion`                 │
│  Módulos:  general · comercial · financiero · inventario · system            │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │  PDO
                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│           BASES DE DATOS ERP  (PostgreSQL — `biable01`, `biable02`)          │
│   Datos maestros del ERP Siesa Biable: cmmedios_recaudo, cmproveedores,      │
│   inventarios, comprobantes, retenciones, DIAN, saldos, etc.                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Componentes principales identificados

| Capa                          | Tecnología                              | Ubicación                                      | Rol                                                                                                                                                                                                                                                |
| ----------------------------- | --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend SPA**              | React 19.2, Vite 7.1, React Router 7.8  | Servido desde cPanel (build `dist/`)           | Interfaz de usuario, gestión de sesión en `localStorage`, ruteo protegido, ~19 dominios funcionales                                                                                                                                                |
| **Backend de aplicación**     | PHP 7/8, PDO, MySQL 8.0.37              | Hosting cPanel — `supermer_AplicativoSistemas` | 30+ subcarpetas API, autenticación por token de sesión (tabla `sesiones`), permisos por menú+acción, subida de archivos, envío de correos (PHPMailer), generación de PDF (TCPDF / FPDF), Excel (PhpSpreadsheet), integración con Microsoft 365 SSO |
| **Framework / repositorios**  | PHP + PDO PostgreSQL                    | Servidor LAN interno detrás de Cloudflared     | Router monolítico `index.php` con tabla de acciones → clase::método; 5 módulos temáticos; 18 acciones expuestas actualmente                                                                                                                        |
| **BD del aplicativo**         | MySQL 8 (`supermer_AplicativoSistemas`) | cPanel                                         | 63 tablas + 1 vista: usuarios, roles, permisos, menús, actas, pedidos, separatas, solicitudes, sesiones, logs, CVM, visitantes, etc.                                                                                                               |
| **BD del ERP**                | PostgreSQL (`biable01`, `biable02`)     | Servidor LAN                                   | Datos del ERP Siesa Biable (dos empresas: Abastecemos y Tobar)                                                                                                                                                                                     |
| **DNS / seguridad de borde**  | Cloudflare                              | `supermercadobelalcazar.com`                   | DNS, WAF, TLS                                                                                                                                                                                                                                      |
| **Túnel LAN**                 | Cloudflared                             | LAN → Cloudflare                               | Publica el framework interno vía `api-biable.supermercadobelalcazar.com` sin abrir puertos                                                                                                                                                         |
| **Agente de impresora local** | WebSocket `ws://127.0.0.1:8181`         | PC del usuario                                 | Impresión de etiquetas (Monarch 9830/9906 · TSC ME240/MB240T/MB241T) desde el frontend                                                                                                                                                             |

### 1.3 Dominios funcionales del aplicativo (evidencia: `App.jsx` + `repo/index.php`)

- **AdminPanel** — Menús, Usuarios, Proveedores, Sedes, Áreas, Cargos, Informes, Inventario, Perfil.
- **Fruver** — Ítems y Pedidos.
- **Carnes** — Formulario de Pedidos.
- **Compras** — Programación Separata, Actualización de Costos, Codificación de Productos, Permisos de Inventario.
- **Contabilidad** — Planos, Libro Auxiliar, Recaudos, Prefijos DIAN.
- **Sistemas** — Bitácora/Logs, CVM (formulario y reportes).
- **Seguridad** — Gestión de Visitantes.
- **Publicidad** — Diseñador y agente de impresión de etiquetas (canvas → impresora local).
- **Informes** — Financieros generales.
- **Inventario** — Reportes de Averías, Bodegas Alternas, Existencias/Costos.
- **Lector de Precios** — Cinco variantes por sede (B1, B2, B5, B8, B11).

### 1.4 Patrones y observaciones arquitectónicas clave

1. **Doble modelo de autenticación.** El navegador se autentica ante el backend con un token de sesión propio (bcrypt + tabla `sesiones`, expiración 24 h). El backend a su vez habla con el framework LAN con un **shared secret M2M** (`API_SECRET`) + allow-list de IP. Login opcional vía Microsoft 365 (tenant + client id en `.env` de Vite).
2. **Router dispatch por payload.** El framework LAN implementa un único punto de entrada (`repo/index.php`) que enruta por el campo JSON `accion` a un mapa `['clase','metodo']`. Simple, sin regex, sin framework de terceros.
3. **Backend cPanel modularizado por dominio.** `api/` contiene una subcarpeta por dominio (`fruver/`, `carnes/`, `compras/`, `contabilidad/`, `sistemas/`, `seguridad/`, `publicidad/`, `informes/`, `usuarios/`, `roles/`, `menu/`, etc.). Cada carpeta contiene endpoints `.php` planos con inclusión de middlewares (`cors.php` + `auth.php`).
4. **Frontend con capa HTTP centralizada.** `src/utils/http/` expone `request()`, `fetchWithTimeout()`, `runResultadoReport()` como primitivas. `src/services/api.js` (~1580 líneas) es una fachada única para todo consumo de red — refactor reciente para eliminar duplicación de headers/token/parseo.
5. **Migración gradual a SRA (arquitectura modular).** Convive código antiguo con código nuevo:
   - En backend: endpoints planos por archivo (`create_x.php`, `get_x.php`, `update_x.php`) coexisten con módulos consolidados que usan un único `endpoint.php` (`contabilidad/dian/`, `system/status/`, `publicidad/printer/`).
   - En frontend: patrón "thin orchestrator + `hooks/` + `components/` + `utils/`" ya aplicado a varios módulos; otros aún son componentes grandes.
6. **Logs centralizados.** Tanto backend cPanel como framework LAN envían sus eventos a `POST /api/logs/ingest.php` con API-key. Fallback local a archivo si el servicio central falla.
7. **Persistencia dual.** MySQL para todo lo del aplicativo, PostgreSQL para lectura del ERP. Los cronjobs del backend (`cron/subir_checker_mysql*.php`) parecen sincronizar precios/inventario del ERP a MySQL local por sede.
8. **Seguridad de red por capas.** CORS con allow-list explícito, `.htaccess` protegiendo `.env`, IP allow-list en el framework LAN (Cloudflare + hosting + IP de oficina), Bearer tokens, expiración de sesiones.

### 1.5 Riesgos / observaciones detectadas durante el análisis

_Se enumeran para respaldar el capítulo 25 (Refactorización) y 26 (Deuda Técnica). No son críticas — son evidencia para el documento de recomendaciones._

- **Credenciales en texto plano en el repositorio** (`backend/api/config/database.php`, `backend/api/config/lan_api.php`, `repo/.env`). Deberían pasar a variables de entorno del hosting.
- **Múltiples variantes de `subir_checker_mysql*.php`** — señal de duplicación por sede (2, 5, 8, 11) que se beneficiaría de parametrización.
- **`lector_precios` duplicado en cinco archivos** (`get_producto_b*.php`) — mismo patrón.
- **`api.js.back` y `logger.php.bak`** conviven con las versiones vigentes; conviene depurarlos.
- **`repo/index.php` incluye 18 `require_once`** en la cabecera; a mediano plazo un autoloader PSR-4 sería ganancia neta.
- **Middleware `auth.php` actúa por _side-effect_** (setea `$GLOBALS` al final del archivo). Funciona, pero acopla y complica pruebas.

---

## 2 · Índice maestro de documentación

Toda la documentación se entrega como archivos Markdown dentro de `docs/`. Cada documento incluye: objetivo, descripción, diagramas Mermaid, tablas, ejemplos, referencias cruzadas y trazabilidad de evidencia al código.

**Estructura de carpetas propuesta:**

```
docs/
├── README.md                          ← este documento (índice maestro + estado)
├── assets/
│   └── logo.png                       ← logo corporativo para membretes
│
├── 01-resumen-ejecutivo.md
├── 02-arquitectura-general.md
├── 03-arquitectura-backend.md
├── 04-arquitectura-frontend.md
├── 05-framework-interno.md
├── 06-flujo-de-una-peticion.md
├── 07-diagramas-uml.md
├── 08-diagramas-infraestructura.md
├── 09-api-endpoints.md
├── 10-autenticacion.md
├── 11-autorizacion.md
├── 12-seguridad.md
├── 13-dependencias.md
├── 14-base-de-datos.md
├── 15-configuracion.md
├── 16-deploy.md
├── 17-manual-desarrollador.md
├── 18-manual-soporte.md
├── 19-manual-operacion.md
├── 20-flujo-de-datos.md
├── 21-flujo-de-negocio.md
├── 22-convenciones.md
├── 23-modulos/
│   ├── README.md                      ← índice de módulos
│   ├── admin-panel.md
│   ├── fruver.md
│   ├── carnes.md
│   ├── compras.md
│   ├── contabilidad.md
│   ├── inventario.md
│   ├── sistemas.md
│   ├── seguridad.md
│   ├── publicidad.md
│   ├── informes.md
│   └── lector-precios.md
├── 24-codigo-explicado.md
├── 25-refactorizacion.md
├── 26-deuda-tecnica.md
├── 27-riesgos.md
└── 28-roadmap.md
```

### 2.1 Tabla índice — 28 documentos + índice de módulos

| #   | Documento                          | Objetivo                                                                             | Fuentes principales                                                         |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 01  | **Resumen Ejecutivo**              | Visión de negocio + alcance + características                                        | `App.jsx`, `repo/index.php`, `README.md` frontend                           |
| 02  | **Arquitectura General**           | Diagrama global + responsabilidades por capa                                         | Todos los ZIP                                                               |
| 03  | **Arquitectura Backend**           | Estructura de `backend/api/`, patrones, servicios comunes                            | `backend/api/**`                                                            |
| 04  | **Arquitectura Frontend**          | Componentes, hooks, contexts, servicios, ruteo, ciclo de render                      | `frontend/src/**`                                                           |
| 05  | **Framework Interno**              | Router LAN: cómo procesa `accion`, cómo despacha, cómo responde                      | `repo/index.php`, `repo/core/*`, `repo/modules/**`                          |
| 06  | **Flujo Completo de una Petición** | Diagrama de secuencia end-to-end (usuario → BD → respuesta)                          | Todos                                                                       |
| 07  | **Diagramas UML**                  | Casos de uso, clases, componentes, paquetes, secuencia, despliegue, actividades      | Todos                                                                       |
| 08  | **Diagramas de Infraestructura**   | Cloudflare, DNS, Cloudflared, cPanel, LAN, BDs                                       | `.env`, `LanClient.php`, `authmiddleware.php`                               |
| 09  | **APIs**                           | Catálogo completo de endpoints (método, params, respuesta, errores, ejemplos, auth)  | `backend/api/**`, `repo/index.php` (mapa de acciones)                       |
| 10  | **Autenticación**                  | Login local + Microsoft 365 + sesiones + M2M                                         | `login.php`, `login_microsoft.php`, `AuthContext.jsx`, `authmiddleware.php` |
| 11  | **Autorización**                   | Roles, permisos por menú y por acción (ver/crear/editar/eliminar)                    | `roles/`, `menu/`, `middlewares/check_permission.php`                       |
| 12  | **Seguridad**                      | CORS, IP allow-list, cifrado de contraseñas, tokens, cabeceras, riesgos              | Middlewares, `.htaccess`, `logger.php`                                      |
| 13  | **Dependencias**                   | Librerías npm y PHP con propósito y uso concreto                                     | `package.json`, `backend/utils/`                                            |
| 14  | **Base de Datos**                  | Modelo MySQL (63 tablas) + esquema PostgreSQL usado, entidades, relaciones, ERD      | `mysqlphpmyadmin.sql`, queries en repos                                     |
| 15  | **Configuración**                  | Variables de entorno, `.htaccess`, `vite.config.js`, `.env` de cada componente       | `.env` × 3, `.htaccess` × 2, `vite.config.js`                               |
| 16  | **Deploy**                         | Requisitos, pasos para desplegar cada capa, Cloudflare + cloudflared                 | `.htaccess`, `vite.config.js`, `LanClient.php`                              |
| 17  | **Manual del Desarrollador**       | Cómo iniciar el proyecto local, cómo añadir un módulo end-to-end, convenciones       | `README.md` frontend, `App.jsx`, patrones detectados                        |
| 18  | **Manual de Soporte**              | Diagnóstico de errores comunes, dónde ver logs, problemas frecuentes                 | `logger.php`, `sys_logs`, `logs/ingest.php`                                 |
| 19  | **Manual de Operación**            | Backups, actualizaciones, monitoreo, cronjobs                                        | `cron/**`, `.env`, hosting                                                  |
| 20  | **Flujo de Datos**                 | Cómo viaja la información entre capas y bases                                        | Todos                                                                       |
| 21  | **Flujo de Negocio**               | Cada dominio funcional visto desde el usuario final                                  | `App.jsx`, componentes                                                      |
| 22  | **Convenciones**                   | Naming, organización de carpetas, patrones de módulo, estilo                         | Toda la evidencia observada                                                 |
| 23  | **Módulos (por dominio)**          | Un documento por dominio (~11 sub-docs) con endpoints, componentes, flujos, permisos | Componentes React + endpoints PHP + acciones LAN                            |
| 24  | **Código Explicado**               | Explicación técnica de partes no obvias (LanClient, request(), dispatch del router)  | Piezas concretas                                                            |
| 25  | **Refactorización (propuesta)**    | Mejoras priorizadas — sin modificar código                                           | Observaciones §1.5 + hallazgos por capa                                     |
| 26  | **Deuda Técnica**                  | Inventario clasificado por severidad e impacto                                       | Hallazgos consolidados                                                      |
| 27  | **Riesgos**                        | Arquitectónicos, de infraestructura, seguridad, escalabilidad                        | Todos                                                                       |
| 28  | **Roadmap**                        | Propuesta técnica de evolución a mediano/largo plazo                                 | Consolidación final                                                         |

---

## 3 · Registro de progreso

_Este bloque se actualiza en cada iteración. Es la fuente de verdad para saber qué hemos entregado y qué falta._

### 3.1 Estado por documento

| #   | Documento                    | Estado                  | Notas                                                                                                                                        |
| --- | ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| —   | `README.md` (índice maestro) | ✅ **Entregado**        | Este archivo                                                                                                                                 |
| 01  | Resumen Ejecutivo            | ✅ **Entregado**        | Visión, dominios, stack, números clave, características diferenciales, roadmap resumido, cómo leer por rol                                   |
| 02  | Arquitectura General         | ✅ **Entregado**        | Vista macro + capas + protocolos + diagramas Mermaid                                                                                         |
| 03  | Arquitectura Backend         | ✅ **Entregado**        | ~110 endpoints, 2 patrones, middlewares, modelos, LanClient, ciclo de vida                                                                   |
| 04  | Arquitectura Frontend        | ✅ **Entregado**        | Stack, providers, contextos, hooks, capa HTTP, ruteo, ciclos de render                                                                       |
| 05  | Framework Interno            | ✅ **Entregado**        | Router LAN, auth M2M, ciclo de request, 30 acciones catalogadas                                                                              |
| 06  | Flujo de una Petición        | ✅ **Entregado**        | 5 escenarios end-to-end, diagramas, timing, casos límite, guía de trace                                                                      |
| 07  | Diagramas UML                | ✅ **Entregado**        | Casos de uso, clases, componentes, paquetes, actividades, estados, secuencia                                                                 |
| 08  | Diagramas de Infraestructura | ✅ **Entregado**        | DNS, túnel, cPanel, LAN, sedes, POS, cronjobs, puertos, sistema adyacente                                                                    |
| 09  | APIs                         | ✅ **Entregado**        | Catálogo por dominio: 100+ endpoints cPanel + 30 acciones LAN, códigos de error, patrones de consumo                                         |
| 10  | Autenticación                | ✅ **Entregado**        | 3 flujos: local + Microsoft SSO + M2M, ciclo de sesión, matriz HTTP                                                                          |
| 11  | Autorización                 | ✅ **Entregado**        | 2 generaciones, lógica AND rol × cargo, ERD, revocación en vivo, sin bypass                                                                  |
| 12  | Seguridad                    | ✅ **Entregado**        | Modelo de amenazas, análisis STRIDE, 18 hallazgos priorizados, hoja de ruta                                                                  |
| 13  | Dependencias                 | ✅ **Entregado**        | Frontend npm (27+11), backend vendorizado (7), framework 0, duplicidades priorizadas                                                         |
| 14  | Base de Datos                | ✅ **Entregado**        | 63 tablas + 1 vista MySQL agrupadas en 11 dominios; ERD por bloque; PostgreSQL inferido                                                      |
| 15  | Configuración                | ✅ **Entregado**        | 12 archivos catalogados: .env × 2, .htaccess × 2, config PHP, vite.config; 10 recomendaciones                                                |
| 16  | Deploy                       | ✅ **Entregado**        | Deploy inicial e incremental por capa, checklist de 20+ items, OAuth Microsoft, cronjobs                                                     |
| 17  | Manual del Desarrollador     | ✅ **Entregado**        | Setup local, workflow, agregar módulo end-to-end, convenciones, debugging, antipatrones                                                      |
| 18  | Manual de Soporte            | ✅ **Entregado**        | 12 incidentes frecuentes con paso a paso, diccionario de errores, trace de peticiones                                                        |
| 19  | Manual de Operación          | ✅ **Entregado**        | Backups, rotación de secretos, cronjobs, monitoreo, ciclo diario/semanal/mensual/anual, respuesta a incidentes                               |
| 20  | Flujo de Datos               | ✅ **Entregado**        | 5 categorías de datos, ciclos de vida, PII y retención, volúmenes esperados                                                                  |
| 21  | Flujo de Negocio             | ✅ **Entregado**        | 8 procesos principales, actores, calendario operativo, 10 reglas de negocio                                                                  |
| 22  | Convenciones                 | ✅ **Entregado**        | 8 principios, naming, organización, patrones A/B, thin orchestrator, guías de decisión                                                       |
| 23  | Módulos (11 sub-docs)        | ✅ **12/12 entregados** | README + admin-panel + fruver + carnes + compras + contabilidad + inventario + sistemas + seguridad + publicidad + informes + lector-precios |
| 24  | Código Explicado             | ✅ **Entregado**        | 14 piezas de código no obvias explicadas con extractos y motivación                                                                          |
| 25  | Refactorización              | ✅ **Entregado**        | 8 paquetes de trabajo, 49 items priorizados, gantt 12 meses, métricas de éxito                                                               |
| 26  | Deuda Técnica                | ✅ **Entregado**        | 49 items catalogados, 3 severidades, top 20 priorizados por costo/beneficio                                                                  |
| 27  | Riesgos                      | ✅ **Entregado**        | 33 riesgos en 5 categorías, matriz probabilidad × impacto, 5 críticos, mapa de calor                                                         |
| 28  | Roadmap                      | ✅ **Entregado**        | 4 horizontes a 36 meses, iniciativas por horizonte, métricas, dependencias, presupuesto                                                      |

### 3.2 Áreas del código que aún requieren análisis más profundo

Al momento de emitir este índice, quedan zonas del código que solo se han inspeccionado en superficie y necesitarán profundización para producir el documento correspondiente:

1. **Cronjobs** (`backend/cron/subir_checker_mysql*.php`, `verificar_registros_cvm.php`) — Solo se conoce el nombre; falta leer la lógica interna para documentar operación y monitoreo.
2. **Módulo Publicidad / impresión de etiquetas** — Lado backend (`api/publicidad/printer/endpoint.php`) y frontend (`TemplateCanvas`) requieren lectura completa para documentar el protocolo con el agente WebSocket local, plantillas MPCL/TSPL, y `plantillas_etiquetas` (tabla MySQL).
3. **Módulo CVM** (`api/sistemas/cvm/*`) — Formulario + reportes con imágenes; requiere revisión de `registros_cvm`, `equipos`, `supervisores`, `ventas_registradas_pavas`.
4. **Módulo Actas de Entrega** (`actas_entrega` en MySQL, con firma digital y token) — Aún no se ha encontrado el endpoint que lo alimenta; requiere búsqueda dirigida.
5. **`login_microsoft.php`** — Solo se conoce el archivo; falta leer el flujo OAuth completo para documentar autenticación federada.
6. **Modelos** (`backend/api/models/*.php`) — Falta inspeccionar la lógica de `User`, `Session`, `Menu`, `Rol`, `Proveedor` para tabla de clases del UML.
7. **Módulo `financiero/dian/`** en el repo LAN — Auditoría DIAN y configuración persistida; falta revisar `auditoria_repo.php`.
8. **Aplicativo de proveedores** — Aparece en CORS (`proveedor.supermercadobelalcazar.com`) y en `database_proveedor.php` / `api_keys` (`aplicativo proveedor`). No está en los ZIPs entregados; se marcará como sistema adyacente en el diagrama de infraestructura.
9. **Vista `v_dias_conciliados`** — Cuerpo SQL de la vista pendiente de extraer del dump.
10. **Datos reales del ERP** (`biable01`, `biable02` en PostgreSQL) — No hay dump PostgreSQL; los esquemas se documentarán a partir de las queries encontradas en los repositorios (`cmmedios_recaudo`, `cmproveedores`, etc.). Se marcarán las columnas como **inferidas del código** en la sección BD.

---

## 4 · Convenciones de esta documentación

Para consistencia visual y editorial en todos los documentos:

- **Idioma:** español (Colombia).
- **Formato:** Markdown, compatible con GitHub / GitLab / VS Code.
- **Diagramas:** Mermaid siempre que sea posible (`flowchart`, `sequenceDiagram`, `classDiagram`, `erDiagram`, `stateDiagram`).
- **Membretado corporativo:** cada documento inicia con el logo (`assets/logo.png`), título, subtítulo y metadatos en tabla.
- **Color corporativo:** `#03996b` (verde Belalcázar). Se usa como acento cuando el renderizador lo permite (HTML embebido en Mermaid, tablas con estilos).
- **Tipografía:** el estilo Apple se logra en el render final; en Markdown se refleja con jerarquías limpias, poco negreado y prosa breve.
- **Trazabilidad:** cada afirmación técnica cita el archivo del que proviene (p. ej. `repo/core/authmiddleware.php:24-38`).
- **Hipótesis marcadas:** cuando no se puede probar desde el código, se indica con **⚠ Hipótesis** y se lista qué evidencia falta.
- **Sin invenciones:** si algo no aparece en los ZIP ni en el dump SQL, se declara como "no observable con la evidencia entregada".

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documentación técnica interna · Generada el 14 de julio de 2026</sub>
</div>
