import React from "react";
import styles from "./ExistenciasCostos.module.css";
import LoadingScreen from "../../../UI/LoadingScreen";
import { useNotification } from "../../../../contexts/NotificationContext";
import { useExistenciasCostos } from "./hooks/useExistenciasCostos";
import { TABS_EXISTENCIAS } from "./utils/constants";
import { usePermisos } from "../../../../hooks/usePermission";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";

import ExistenciasCostosHeader from "./components/ExistenciasCostosHeader";
import TabsBar from "./components/TabsBar";
import ExistenciasCostosToolbar from "./components/ExistenciasCostosToolbar";
import TablaReporte from "./components/TablaReporte";
import TabParametrizacion from "./components/TabParametrizacion";

const ExistenciasCostos = () => {
  const { addNotification } = useNotification();
  const model = useExistenciasCostos(addNotification);
  const {
    puedeCrear,
    puedeEditar,
    permisos,
    loading: pLoading,
  } = usePermisos();

  const tieneAccesoParametros = !!(
    puedeCrear ||
    puedeEditar ||
    permisos?.editar
  );

  if (pLoading) {
    return (
      <LoadingScreen
        isVisible
        title="Cargando modulo"
        subtitle="Validando credenciales..."
        variant="fullscreen"
      />
    );
  }

  return (
    <div className={styles.moduloContainer}>
      {model.loading && (
        <LoadingScreen
          isVisible
          title="Procesando Matrices"
          subtitle="Calculando coberturas ABC y excesos..."
          variant="fullscreen"
        />
      )}

      <ExistenciasCostosHeader />

      <div className={styles.content}>
        <TabsBar
          activeTab={model.activeTab}
          onChangeTab={model.setActiveTab}
          tieneAccesoParametros={tieneAccesoParametros}
        />

        {model.activeTab === TABS_EXISTENCIAS.ANALITICA ? (
          <>
            <ExistenciasCostosToolbar
              model={model}
              lapsoCalendario={model.lapsoCalendario}
              setLapsoCalendario={model.setLapsoCalendario}
              localSeleccionado={model.localSeleccionado}
              setLocalSeleccionado={model.setLocalSeleccionado}
              onConsultar={model.consultarReporte}
              searchTerm={model.searchTerm}
              setSearchTerm={model.setSearchTerm}
              abcFilter={model.abcFilter}
              setAbcFilter={model.setAbcFilter}
              hayDatos={model.reporteData.length > 0}
              localesConfig={model.localesConfig}
              esMultiLapso={model.esMultiLapso}
              setEsMultiLapso={model.setEsMultiLapso}
              lapsosSeleccionados={model.lapsosSeleccionados}
              setLapsosSeleccionados={model.setLapsosSeleccionados}
            />

            {model.dataProcesada.length > 0 && (
              <div className={styles.contenedorAcciones}>
                <button
                  className={styles.btnDescargarExcel}
                  onClick={model.ejecutarExportacion}
                  type="button"
                >
                  <FontAwesomeIcon icon={faFileExcel} /> Exportar Excel
                </button>
              </div>
            )}

            <TablaReporte model={model} />
          </>
        ) : (
          <TabParametrizacion
            model={model}
            puedeEditar={puedeEditar || !!permisos?.editar}
          />
        )}
      </div>
    </div>
  );
};

export default ExistenciasCostos;
