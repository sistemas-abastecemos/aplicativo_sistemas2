import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Terminal.module.css";

import { useAuth } from "../../hooks/useAuth";
import { usePermisos } from "../../hooks/usePermission";
import { useNotification } from "../../contexts/NotificationContext";
import LoadingScreen from "../UI/LoadingScreen";

import ConnectionStatusBadge from "./components/ConnectionStatusBadge";
import ServidoresParametrizacion from "./components/ServidoresParametrizacion";

const GUACAMOLE_BASE_URL =
  "https://terminal.supermercadobelalcazar.com/guacamole";

// Servidor especial para la vista general de Guacamole
const GUACAMOLE_HOME_SERVER = {
  id: "guacamole-home",
  nombre: "Inicio Guacamole (Todas las Conexiones)",
  ip: "127.0.0.1",
  puerto: 8085,
  protocolo: "HTTP",
  descripcion:
    "Panel principal con el listado completo de conexiones registradas en Guacamole",
  clientPath: "#/",
  estado: "Activo",
};

const SERVIDORES_INICIALES = [
  GUACAMOLE_HOME_SERVER,
  {
    id: "biable-centos",
    nombre: "BIable - CentOS 7",
    ip: "127.0.0.1",
    puerto: 22,
    protocolo: "SSH",
    descripcion: "Servidor principal de infraestructura y BI",
    clientPath: "#/client/MQcAY2VudG9z",
    estado: "Activo",
  },
  {
    id: "siesa-db",
    nombre: "Base de Datos - Siesa",
    ip: "192.24.33.10",
    puerto: 22,
    protocolo: "SSH",
    descripcion: "Servidor de base de datos transaccional ERP",
    clientPath: "#/client/MgcAY2VudG9z",
    estado: "Activo",
  },
];

const Terminal = () => {
  const { token, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const {
    puedeVer,
    puedeCrear,
    puedeEditar,
    puedeEliminar,
    loading: permisosLoading,
  } = usePermisos();

  const [tabActiva, setTabActiva] = useState("consola");
  const [servidores, setServidores] = useState(SERVIDORES_INICIALES);
  const [servidorSeleccionadoId, setServidorSeleccionadoId] = useState(null);

  // Clave unica de forzado de renderizado
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const puedeParametrizar = puedeCrear || puedeEditar || puedeEliminar;

  useEffect(() => {
    if (!permisosLoading && !puedeVer) {
      addNotification({
        message: "Se revocaron tus permisos para este modulo.",
        type: "error",
      });
      navigate("/inicio", { replace: true });
    }
  }, [permisosLoading, puedeVer, navigate, addNotification]);

  if (permisosLoading || authLoading) {
    return <LoadingScreen message="Cargando modulo de terminal..." />;
  }

  if (!puedeVer || !token) {
    return (
      <div className={styles.container}>
        <div className={styles.errorPermisosCard}>
          <h2>Acceso Restringido</h2>
          <p>No tienes autorizacion o tu sesion ha expirado.</p>
        </div>
      </div>
    );
  }

  // Al seleccionar cualquier servidor, forzamos un incremento en reloadKey
  const handleSelectServer = (serverId) => {
    setReloadKey((prev) => prev + 1);
    setServidorSeleccionadoId(serverId);
  };

  const handleGoToHomeGuacamole = () => {
    setReloadKey((prev) => prev + 1);
    setServidorSeleccionadoId(GUACAMOLE_HOME_SERVER.id);
  };

  const handleCloseConnection = () => {
    setServidorSeleccionadoId(null);
  };

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  const servidorActual = servidores.find(
    (s) => s.id === servidorSeleccionadoId,
  );

  let iframeTargetUrl = "";
  if (servidorActual) {
    const rawPath = servidorActual.clientPath.startsWith("/")
      ? servidorActual.clientPath.substring(1)
      : servidorActual.clientPath;
    const cleanHash = rawPath.startsWith("#") ? rawPath : `#${rawPath}`;

    // URL limpia sin parametros no reconocidos por Guacamole
    iframeTargetUrl = `${GUACAMOLE_BASE_URL}/?seao_token=${encodeURIComponent(token)}${cleanHash}`;
  }

  return (
    <div className={styles.container}>
      <div
        className={`${styles.macWindow} ${isFullscreen ? styles.fullscreen : ""}`}
      >
        {/* macOS Window Bar */}
        <div className={styles.macOSHeader}>
          <div className={styles.windowControls}>
            <button
              className={`${styles.macBtn} ${styles.btnClose}`}
              onClick={handleCloseConnection}
              title="Cerrar conexion activa"
            />
            <button className={`${styles.macBtn} ${styles.btnMin}`} />
            <button
              className={`${styles.macBtn} ${styles.btnMax}`}
              onClick={() => setIsFullscreen((prev) => !prev)}
            />
          </div>

          <div className={styles.headerCenter}>
            <div className={styles.segmentedControl}>
              <button
                className={`${styles.segmentBtn} ${
                  tabActiva === "consola" ? styles.segmentBtnActive : ""
                }`}
                onClick={() => setTabActiva("consola")}
              >
                Consola Terminal
              </button>
              {puedeParametrizar && (
                <button
                  className={`${styles.segmentBtn} ${
                    tabActiva === "parametrizacion"
                      ? styles.segmentBtnActive
                      : ""
                  }`}
                  onClick={() => setTabActiva("parametrizacion")}
                >
                  Parametrizacion
                </button>
              )}
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.actionGroup}>
              {tabActiva === "consola" && (
                <>
                  {servidorActual ? (
                    <>
                      <ConnectionStatusBadge
                        isConnected={!!servidorActual}
                        token={token}
                      />
                      <button
                        className={styles.macActionButton}
                        onClick={handleGoToHomeGuacamole}
                        title="Ir al listado nativo de Guacamole"
                      >
                        Inicio Guacamole
                      </button>
                      <button
                        className={styles.macActionButton}
                        onClick={handleCloseConnection}
                      >
                        ← Servidores
                      </button>
                      <button
                        className={styles.macActionButton}
                        onClick={handleRefresh}
                      >
                        Reiniciar
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.macActionButton}
                      onClick={handleGoToHomeGuacamole}
                    >
                      Ver Inicio Guacamole
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cuerpos de Vista */}
        <div className={styles.windowBody}>
          {tabActiva === "consola" ? (
            servidorActual ? (
              <iframe
                key={`guac-frame-${servidorActual.id}-${reloadKey}`}
                src={iframeTargetUrl}
                title="SEAO Remote Terminal"
                className={styles.terminalIframe}
                allow="clipboard-read; clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={(e) => {
                  try {
                    e.target.contentWindow?.focus();
                  } catch (err) {
                    // Ignorar excepciones de foco cross-origin
                  }
                }}
              />
            ) : (
              <div className={styles.serverCatalog}>
                <div className={styles.catalogHeader}>
                  <h3>Servidores Remotos Registrados</h3>
                  <p>
                    Seleccione una maquina para iniciar sesion SSH o acceda al
                    panel general.
                  </p>
                </div>
                <div className={styles.serverGrid}>
                  {servidores.map((srv) => (
                    <div
                      key={srv.id}
                      className={styles.serverCard}
                      onClick={() => handleSelectServer(srv.id)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.serverTitle}>{srv.nombre}</span>
                        <span className={styles.badgeProtocol}>
                          {srv.protocolo}
                        </span>
                      </div>
                      <p className={styles.serverDesc}>{srv.descripcion}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.serverIp}>
                          {srv.ip}:{srv.puerto}
                        </span>
                        <span className={styles.btnConnect}>Conectar →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <ServidoresParametrizacion
              servidores={servidores}
              setServidores={setServidores}
              puedeCrear={puedeCrear}
              puedeEditar={puedeEditar}
              puedeEliminar={puedeEliminar}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;
