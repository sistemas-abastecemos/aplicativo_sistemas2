import { useState, useMemo } from "react";

/**
 * Hook para gestionar la autorizacion de accesos a terminales
 * y la seleccion de servidores remotos segun el perfil del usuario.
 */
export const useTerminalAccess = (user) => {
  const [selectedServerId, setSelectedServerId] = useState("biable-centos");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Catalogo de servidores gestionados por Guacamole
  const availableServers = useMemo(
    () => [
      {
        id: "biable-centos",
        name: "BIable - CentOS 7",
        ip: "127.0.0.1",
        protocol: "SSH",
        permission: "TERMINAL_BIABLE_ACCESS",
        // Path o identificador de conexion directa en Guacamole
        clientPath: "/#/client/MQcAY2VudG9z",
      },
      {
        id: "siesa-db",
        name: "BD Siesa - Linux",
        ip: "192.24.33.10",
        protocol: "SSH",
        permission: "TERMINAL_SIESA_ACCESS",
        clientPath: "/#/client/MgcAY2VudG9z",
      },
    ],
    [],
  );

  // Filtrado de servidores a los que el usuario tiene acceso explícito
  const authorizedServers = useMemo(() => {
    if (!user || !user.permisos) return [];

    // Si es administrador global tiene acceso total
    if (user.rol === "ADMIN" || user.permisos.includes("ALL_PRIVILEGES")) {
      return availableServers;
    }

    return availableServers.filter(
      (server) =>
        user.permisos.includes(server.permission) ||
        user.permisos.includes("TERMINAL_FULL_ACCESS"),
    );
  }, [user, availableServers]);

  const hasAccess = authorizedServers.length > 0;

  const currentServer = useMemo(() => {
    return (
      authorizedServers.find((s) => s.id === selectedServerId) ||
      authorizedServers[0] ||
      null
    );
  }, [authorizedServers, selectedServerId]);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);
  const refreshTerminal = () => setReloadKey((prev) => prev + 1);

  return {
    hasAccess,
    authorizedServers,
    currentServer,
    setSelectedServerId,
    isFullscreen,
    toggleFullscreen,
    reloadKey,
    refreshTerminal,
  };
};
