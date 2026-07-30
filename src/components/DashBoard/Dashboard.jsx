import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../contexts/AuthContext";
import { useEmpresa } from "../../contexts/EmpresaContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useDynamicMenu } from "../../hooks/useDynamicMenu";
import LoadingScreen from "../UI/LoadingScreen";

import styles from "./Dashboard.module.css";

import { useDashboardRedirect } from "./hooks/useDashboardRedirect";
import { useCurrentTime } from "./hooks/useCurrentTime";
import { useFuncionesNavegables } from "./hooks/useFuncionesNavegables";
import { useDatabaseStatus } from "./hooks/useDatabaseStatus";

import { obtenerSaludo, obtenerNombreEmpresa } from "./utils/formatters";

import DashboardHeader from "./components/DashboardHeader";
import WelcomeCard from "./components/WelcomeCard";
import StatsGrid from "./components/StatsGrid";
import ModulosDisponibles from "./components/ModulosDisponibles";
import DatabaseStatusCard from "./components/DatabaseStatusCard";
import SoporteSistemas from "./components/SoporteSistemas";
import SystemNotice from "./components/SystemNotice";
import UtilidadesSection from "./components/UtilidadesSection";

const Dashboard = () => {
  const { user: currentUser } = useAuth();
  const { empresa } = useEmpresa();
  const { menu, userInfo, loading: menuLoading, error } = useDynamicMenu();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  useDashboardRedirect(currentUser, addNotification);
  const currentTime = useCurrentTime();
  const { searchTerm, setSearchTerm, funcionesAMostrar, stats } =
    useFuncionesNavegables(menu);
  const dbStatus = useDatabaseStatus({ intervalMs: 30000 });

  const empresaNombre = useMemo(() => obtenerNombreEmpresa(empresa), [empresa]);
  const usuarioCompleto = useMemo(
    () => ({ ...currentUser, ...userInfo }),
    [currentUser, userInfo],
  );
  const saludo = useMemo(() => obtenerSaludo(), []);

  // Evaluacion de permisos para gestionar utilidades
  const canEditUtilidades = useMemo(() => {
    const findInicioNode = (items) => {
      if (!Array.isArray(items)) return null;
      for (const item of items) {
        if (item.ruta === "/inicio" || item.modulo === "/inicio") {
          return item;
        }
        if (item.children) {
          const found = findInicioNode(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const inicioNode = findInicioNode(menu);
    if (inicioNode?.permisos) {
      const { crear, editar, eliminar } = inicioNode.permisos;
      return Boolean(crear || editar || eliminar);
    }

    return false;
  }, [menu]);

  const handleNavigateTo = (ruta) => {
    if (ruta && ruta !== "#") navigate(ruta);
  };

  if (!currentUser) {
    return <LoadingScreen isVisible={true} title="Cargando información..." />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className={styles.errorIcon}
          />
          <h2>Error cargando el dashboard</h2>
          <p>{error}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DashboardHeader
        empresaNombre={empresaNombre}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <main className={styles.content}>
        <WelcomeCard
          saludo={saludo}
          usuarioCompleto={usuarioCompleto}
          ultimoAcceso={stats.ultimoAcceso}
        />

        <StatsGrid stats={stats} currentTime={currentTime} />

        {/* SECCION DE UTILIDADES Y ACCESOS DIRECTOS */}
        <UtilidadesSection canEdit={canEditUtilidades} />

        <div className={styles.mainGrid}>
          <ModulosDisponibles
            funcionesAMostrar={funcionesAMostrar}
            menuLoading={menuLoading}
            searchTerm={searchTerm}
            onNavigate={handleNavigateTo}
          />

          <div className={styles.sidebarGrid}>
            <DatabaseStatusCard
              status={dbStatus.status}
              latencyMs={dbStatus.latencyMs}
              lastCheck={dbStatus.lastCheck}
              error={dbStatus.error}
              onRefresh={dbStatus.refresh}
            />
            <SoporteSistemas />
            <SystemNotice />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
