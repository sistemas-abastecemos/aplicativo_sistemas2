<div align="center">

<img src="../assets/images/logo.png" alt="Supermercados Belalcázar" width="200" />

# 07 · Diagramas UML

**Documentación técnica — Aplicativo SEAO**

</div>

---

|                      |                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Documento**        | 07 — UML                                                                                                                                     |
| **Versión**          | 1.0                                                                                                                                          |
| **Fecha**            | 14 de julio de 2026                                                                                                                          |
| **Depende de**       | 02 · Arquitectura · 03 · Backend · 04 · Frontend · 05 · Framework · 06 · Flujo · 10 · Autenticación · 11 · Autorización · 14 · Base de Datos |
| **Lo usan**          | 17 · Desarrollador · 23 · Módulos                                                                                                            |
| **Confidencialidad** | Uso interno                                                                                                                                  |

---

## 1 · Objetivo

Reunir la **vista UML del sistema** en un solo lugar: casos de uso, clases, componentes, paquetes, actividades, secuencia y despliegue. Los diagramas ya presentes en otros documentos se referencian aquí para completar el mapa. Todos los diagramas están en Mermaid.

---

## 2 · Casos de uso (Use Case Diagram)

Actores: **Usuario del aplicativo**, **Administrador**, **Comprador**, **Contador**, **Auxiliar de Sistemas**, **Portero de sede**, **Cliente en tienda** (lector precios), **Sistema (cronjobs)**.

```mermaid
flowchart LR
    U([Usuario])
    ADM([Administrador])
    COMP([Comprador])
    CTB([Contador])
    SIS([Aux Sistemas])
    POR([Portero])
    CLI([Cliente en tienda])
    CRO([Cronjobs])

    U --> UC1[Iniciar sesión local]
    U --> UC2[Iniciar sesión Microsoft]
    U --> UC3[Cerrar sesión]
    U --> UC4[Ver dashboard]
    U --> UC5[Consultar informes financieros]

    ADM --> UC10[Gestionar usuarios]
    ADM --> UC11[Gestionar menús y permisos]
    ADM --> UC12[Gestionar áreas y cargos]
    ADM --> UC13[Gestionar sedes]
    ADM --> UC14[Consultar bitácora sys_logs]

    COMP --> UC20[Crear solicitud actualización de costos]
    COMP --> UC21[Crear solicitud codificación de productos]
    COMP --> UC22[Editar separatas y POS]
    COMP --> UC23[Gestionar pedidos Fruver y Carnes]

    CTB --> UC30[Consultar recaudos]
    CTB --> UC31[Consultar libro auxiliar]
    CTB --> UC32[Auditoría DIAN]
    CTB --> UC33[Descargar certificados fiscales]

    SIS --> UC40[Registrar acta de entrega TI]
    SIS --> UC41[Registrar CVM balanzas]

    POR --> UC50[Registrar ingreso de visitante]
    POR --> UC51[Cambiar estado de visita]

    CLI --> UC60[Consultar precio por código de barras]

    CRO --> UC70[Sincronizar precios ERP → MySQL]
    CRO --> UC71[Alerta CVM incumplida]
```

---

## 3 · Diagrama de paquetes (Package Diagram)

Organización del código por dominio.

```mermaid
flowchart TB
    subgraph FRT["Paquete: Frontend (React 19)"]
        FR_C[components/**]
        FR_CTX[contexts/**]
        FR_H[hooks/**]
        FR_S[services/api.js]
        FR_U[utils/http/**]
    end
    subgraph BE["Paquete: Backend (PHP cPanel)"]
        BE_MW[middlewares/**]
        BE_M[models/**]
        BE_S[services/LanClient.php]
        BE_U[utils/**]
        BE_C[config/**]
        BE_EP["api/&lt;dominio&gt;/**"]
        BE_LIB[utils/PhpSpreadsheet, TCPDF, PHPMailer, ...]
    end
    subgraph FW["Paquete: Framework LAN"]
        FW_CORE[core/*]
        FW_MODS[modules/general, comercial, financiero, inventario, system]
    end
    subgraph DB["Paquete: Datos"]
        DB_MY[(MySQL supermer_*)]
        DB_PG[(PostgreSQL biable0*)]
    end
    subgraph EXT["Paquetes externos"]
        MS[Microsoft 365 / Entra]
        CF[Cloudflare + Tunnel]
        WS[Agente WebSocket local]
    end

    FR_S --> FR_U
    FR_C --> FR_H
    FR_C --> FR_CTX
    FR_H --> FR_S
    FR_U --> BE_EP
    BE_EP --> BE_MW
    BE_EP --> BE_M
    BE_EP --> BE_S
    BE_S --> FW_CORE
    FW_CORE --> FW_MODS
    BE_M --> DB_MY
    FW_MODS --> DB_PG
    FR_C -.SSO.-> MS
    BE_EP --> MS
    BE_EP -.HTTPS.-> CF
    CF --> FW_CORE
    FR_C -.WebSocket.-> WS
```

---

## 4 · Diagrama de componentes (Component Diagram)

Cada componente expone interfaces (círculos vacíos) y consume interfaces (semicírculos).

```mermaid
flowchart LR
    SPA[Frontend SPA<br/>React 19]
    API[Backend API<br/>PHP cPanel]
    LAN[Framework LAN<br/>PHP]
    MYSQL[(MySQL)]
    PG[(PostgreSQL ERP)]
    MS[Microsoft 365]
    CF[Cloudflare Tunnel]
    LOG[API Central de Logs]
    WS[Agente WebSocket local]

    SPA -->|HTTPS REST| API
    SPA -->|OAuth Code| MS
    SPA -->|WebSocket| WS
    API -->|OAuth Token Exchange + Graph| MS
    API -->|PDO| MYSQL
    API -->|cURL HTTPS| CF
    CF -->|Túnel| LAN
    LAN -->|PDO| PG
    LAN -->|HTTPS| LOG
    API -->|HTTPS| LOG
```

**Interfaces expuestas por cada componente:**

| Componente            | Expone (`>`)                             | Consume (`<`)                                          |
| --------------------- | ---------------------------------------- | ------------------------------------------------------ |
| **SPA**               | UI HTTPS                                 | `IREST` de API, `IOAuth` de MS, `IWebSocket` de agente |
| **API cPanel**        | `IREST` (100+ endpoints), `ILogsIngest`  | `IPDO_MySQL`, `IREST_LAN`, `IOAuth`, `IGraph`          |
| **Framework LAN**     | `IREST_LAN` (30 acciones vía dispatcher) | `IPDO_PG`, `ILogsIngest`                               |
| **MySQL / PG**        | `IPDO`                                   | —                                                      |
| **Cloudflare Tunnel** | Proxy HTTPS                              | Servicio HTTP local del LAN                            |
| **Agente WebSocket**  | `IWebSocket` (impresión)                 | Impresora vía USB/red local                            |

---

## 5 · Diagrama de despliegue (Deployment Diagram)

Documentado con detalle en [08 · Infraestructura](./08-diagramas-infraestructura.md). Vista UML condensada:

```mermaid
flowchart TB
    subgraph NavigadorPC["🖥️ Nodo: PC del usuario"]
        N1[Navegador]
        N2[Agente WSF local]
    end
    subgraph EdgeCF["☁️ Nodo: Cloudflare Edge"]
        N3[DNS + WAF + TLS]
        N4[Tunnel proxy]
    end
    subgraph HostCP["🖥️ Nodo: Hosting cPanel"]
        N5[Apache + PHP 7/8]
        N6[MySQL 8]
        N7[Cronjobs PHP CLI]
    end
    subgraph SrvLAN["🖥️ Nodo: Servidor LAN"]
        N8[Apache/Nginx + PHP]
        N9[PostgreSQL]
        N10[cloudflared daemon]
    end
    subgraph POS["🖥️ Nodo: POS por sede"]
        N11[Terminal POS<br/>CentOS/Rocky]
    end

    N1 -.HTTPS.- N3
    N3 -.-> N5
    N5 -.HTTPS.- N4
    N4 -.-> N10
    N10 -.-> N8
    N8 -.-> N9
    N5 -.-> N6
    N7 -.-> N6
    N1 -.ws:8181.- N2
    N11 -.LAN.- N9
```

---

## 6 · Diagrama de clases — capa de dominio del backend cPanel

Se muestran las clases principales que forman la "columna vertebral" del backend.

```mermaid
classDiagram
    class Database {
        -host: string
        -db_name: string
        -username: string
        -password: string
        +getConnection() PDO
    }
    class User {
        +id: int
        +login: string
        +correo: string
        +id_rol: int
        +id_cargo: int
        +id_sede: string
        +activo: int
        -db: PDO
        +__construct(PDO)
        +login(login, password) array
        +getById(id) array
        +updateProfile(data) bool
    }
    class Session {
        +id_usuario: int
        +token: string
        +fecha_expira: datetime
        -db: PDO
        +__construct(PDO)
        +create(id_usuario) string
        +validate(token) User
        +delete(token) bool
        +cleanExpired() int
    }
    class Menu {
        -db: PDO
        +__construct(PDO)
        +getUserMenu(id_usuario, empresa) array
        +getAll() array
        +create(data) int
        +update(id, data) bool
    }
    class Rol {
        -db: PDO
        +getAll() array
        +getAccionesUsuario(id_usuario) array
    }
    class LanClient {
        +LAN_API_URL: string
        +LAN_API_TOKEN: string
        +LAN_API_TIMEOUT: int
        +post(accion, params, timeout) array
    }
    class Logger {
        -db: PDO
        -aplicacion: string
        -entorno: string
        +info(mensaje, contexto) void
        +warning(mensaje, contexto) void
        +error(mensaje, contexto) void
        +debug(mensaje, contexto) void
        +write(mensaje, tipo, contexto) bool
    }

    User --> Database : usa
    Session --> Database : usa
    Session --> User : referencia
    Menu --> Database : usa
    Rol --> Database : usa
    Logger --> Database : usa
    LanClient ..> User : lee X-Usuario-Origen
```

---

## 7 · Diagrama de clases — framework LAN

```mermaid
classDiagram
    class Env {
        +load(path) void
        +get(key, default) string
    }
    class Database {
        -instances: array
        -pdo: PDO
        +getInstance(dbname) Database
        +getPDO() PDO
        +setQueryTimeout(seconds, dbname) void
    }
    class AuthMiddleware {
        +validate() void
        -checkMethod() void
        -checkIp() void
        -checkToken() void
    }
    class Response {
        +json(httpCode, payload) void
        +error(httpCode, mensaje) void
    }
    class Logger {
        +write(mensaje, tipo, stackTrace) void
        -sendRemote(payload) bool
        -writeLocal(payload) void
        -identifyUser() string
    }
    class MotivosRepo {
        -db: PDO
        +listar() array
        +buscarPorId(id) array
    }
    class RecaudosRepo {
        -db: PDO
        +inicializarConexion(input) void
        +obtenerRecaudos(filtros) array
    }
    class SystemStatusRepo {
        +verificarEstadoBaseDatos() array
    }
    class AuditoriaRepo {
        -db: PDO
        +obtenerAuditoriaDian(filtros) array
        +obtenerConfiguracionDian() array
        +guardarConfiguracionDian(config) bool
    }

    AuthMiddleware --> Env : lee ALLOWED_IP, API_SECRET
    Database --> Env : lee DB_*
    MotivosRepo --> Database : PDO
    RecaudosRepo --> Database : PDO
    SystemStatusRepo --> Database : PDO
    AuditoriaRepo --> Database : PDO
    Logger --> Env : lee LOG_API_*
```

**Convención observada:** todo repositorio termina en `Repo` y expone métodos públicos que reciben `$input` (array asociativo con el payload).

---

## 8 · Diagrama de clases — capa HTTP del frontend

```mermaid
classDiagram
    class ApiError {
        +message: string
        +status: int
        +payload: any
        +constructor(message, status, payload)
    }
    class HttpClient {
        <<module>>
        +request(path, options) Promise~any~
        +fetchWithTimeout(url, options, timeoutMs) Promise~Response~
        +runResultadoReport(path, body, options) Promise~any~
    }
    class Headers {
        <<module>>
        +buildHeaders(options) HeadersInit
        +getToken() string
    }
    class Url {
        <<module>>
        +buildUrl(path, params) string
    }
    class Parse {
        <<module>>
        +pickMessage(payload, keys) string
        +unwrapResultado(payload) any
        +unwrapReturn(payload) any
    }
    class Config {
        <<module>>
        +API_BASE_URL: string
    }
    class ApiService {
        <<facade>>
        +login(creds) Promise
        +getUsuarios() Promise
        +obtenerRecaudos(filtros) Promise
        +...100+ métodos
    }

    HttpClient --> Headers : usa
    HttpClient --> Url : usa
    HttpClient --> Parse : usa
    HttpClient --> Config : usa
    HttpClient --> ApiError : lanza
    ApiService --> HttpClient : usa request()
```

---

## 9 · Diagrama de secuencia — login local

Ver diagrama completo en [10 §3.1](./10-autenticacion.md) y [06 §3.1](./06-flujo-de-una-peticion.md). Referencia aquí.

## 10 · Diagrama de secuencia — consulta al ERP

Ver [06 §4.1](./06-flujo-de-una-peticion.md).

## 11 · Diagrama de secuencia — autorización granular

Ver [11 §12](./11-autorizacion.md).

## 12 · Diagrama de secuencia — SSO Microsoft

Ver [10 §4.1](./10-autenticacion.md).

---

## 13 · Diagrama de actividades — flujo de codificación de productos

Muestra el flujo de negocio completo del módulo Compras / Codificación (uno de los más elaborados).

```mermaid
flowchart TB
    START([Inicio])
    A[Comprador crea solicitud]
    B[Agrega items con fotos anverso/reverso]
    C[Sube archivos adjuntos]
    D[Guarda como Generado]
    E{Codificador revisa}
    F[Estado: En revisión]
    G{¿Requiere correcciones?}
    H[Estado: Corregir]
    I[Comprador corrige]
    J[Codificador aprueba]
    K[Estado: Aprobado]
    L[Codificador asigna item código]
    M[Estado: Codificado]
    N[Notificación por correo al comprador]
    R[Estado: Rechazado]
    END([Fin])

    START --> A --> B --> C --> D --> E
    E --> F --> G
    G -- Sí --> H --> I --> E
    G -- No --> J --> K --> L --> M --> N --> END
    E -- Inaceptable --> R --> N
```

---

## 14 · Diagrama de actividades — auditoría DIAN

```mermaid
flowchart TB
    START([Inicio diario])
    A[Cargar configuración de cfg_auditoria_dian]
    B[Consultar ERP - totales Siesa PDV/EST]
    C[Consultar DIAN - totales por prefijo]
    D[Calcular diferencia]
    E{¿Diferencia = 0?}
    F[Estado: OK]
    G[Estado: DESCUADRADO]
    H[Guardar en historico_conciliacion_dian con detalle JSON]
    I[Notificar responsable si DESCUADRADO]
    END([Fin])

    START --> A --> B --> C --> D --> E
    E -- Sí --> F --> H --> END
    E -- No --> G --> H --> I --> END
```

---

## 15 · Diagrama de actividades — control de visitantes

```mermaid
flowchart TB
    START([Visitante llega a portería])
    A{¿Está registrado como visitante?}
    B[Crear registro en visitantes]
    C[Verificar ARL vigente y foto]
    D[Crear visitas_registro estado en_espera]
    E[Asignar carnet]
    F[Visitante inicia operación]
    G[Estado: en_operacion]
    H[Insertar visitas_movimientos]
    I[Visitante termina]
    J[Estado: terminado]
    K[Actualizar visitas_movimientos]
    END([Fin])

    START --> A
    A -- No --> B --> C --> D
    A -- Sí --> D
    D --> E --> F --> G --> H --> I --> J --> K --> END
```

---

## 16 · Diagrama de estados — sesión de usuario

Ver [10 §8](./10-autenticacion.md). Reproducido para completitud.

```mermaid
stateDiagram-v2
    [*] --> Anónimo
    Anónimo --> Autenticando : login.php OR login_microsoft.php
    Autenticando --> Anónimo : credenciales inválidas
    Autenticando --> Activa : token generado + sesiones INSERT
    Activa --> Activa : requests con Bearer válido
    Activa --> Expirada : fecha_expira alcanzada
    Activa --> Anónimo : logout.php DELETE
    Activa --> DesplazadaPorLoginNuevo : mismo user hace login en otro dispositivo
    DesplazadaPorLoginNuevo --> Activa : desde el nuevo dispositivo
    Expirada --> Anónimo : cualquier request devuelve 401
    Activa --> Anónimo : usuario marcado activo=0
```

---

## 17 · Diagrama de estados — solicitud de codificación

```mermaid
stateDiagram-v2
    [*] --> Generado
    Generado --> En_revisión : codificador toma la solicitud
    En_revisión --> Corregir : falta info
    Corregir --> En_revisión : comprador ajusta
    En_revisión --> Aprobado : cumple criterios
    En_revisión --> Rechazado : no cumple
    Aprobado --> Codificado : asignan item código
    Rechazado --> [*]
    Codificado --> [*]
```

---

## 18 · Diagrama de estados — solicitud de actualización de costos

```mermaid
stateDiagram-v2
    [*] --> pendiente
    pendiente --> en_revision : responsable la toma
    en_revision --> aprobada : cumple política
    en_revision --> rechazada : no cumple
    aprobada --> aplicada : LanClient::post cambio_precio al ERP
    rechazada --> [*]
    aplicada --> [*]
```

---

## 19 · Diagrama de estados — visita

```mermaid
stateDiagram-v2
    [*] --> en_espera
    en_espera --> en_operacion : autorizada, con carnet
    en_espera --> cancelado : no autorizada
    en_operacion --> terminado : sale de la sede
    terminado --> [*]
    cancelado --> [*]
```

---

## 20 · Diagrama de estados — CVM (registro de balanza)

Inferido de columnas `estado_inicial` y `estado_final` en `registros_cvm`.

```mermaid
stateDiagram-v2
    [*] --> Registro_iniciado : verificador ingresa balanza
    Registro_iniciado --> Conforme : cumple
    Registro_iniciado --> Con_precintos_rotos : sellos comprometidos
    Registro_iniciado --> Fuera_de_certificacion : fecha vencida
    Con_precintos_rotos --> Regularizado : se regulariza
    Fuera_de_certificacion --> Regularizado : se renueva
    Conforme --> [*]
    Regularizado --> [*]
```

---

## 21 · Diagrama entidad-relación consolidado

El ERD completo dividido por dominios está en [14 · Base de Datos §4-§10](./14-base-de-datos.md).

---

## 22 · Referencias cruzadas

| Necesitas saber…                   | Documento                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Arquitectura general               | [02 · Arquitectura General](./02-arquitectura-general.md)                                                  |
| Detalle interno de cada componente | [03](./03-arquitectura-backend.md) · [04](./04-arquitectura-frontend.md) · [05](./05-framework-interno.md) |
| Diagramas de flujo end-to-end      | [06 · Flujo](./06-flujo-de-una-peticion.md)                                                                |
| Detalles de despliegue             | [08 · Infraestructura](./08-diagramas-infraestructura.md) · [16 · Deploy](./16-deploy.md)                  |
| ERDs completos                     | [14 · Base de Datos](./14-base-de-datos.md)                                                                |

---

<div align="center">
<sub><b>Supermercados Belalcázar</b> · Documento 07 — UML · v1.0 · 14 de julio de 2026</sub>
</div>
