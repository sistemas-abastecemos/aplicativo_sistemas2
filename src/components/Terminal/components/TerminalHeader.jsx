import React from "react";
import styles from "../Terminal.module.css";

const TerminalHeader = ({
  tabActiva,
  onSelectTab,
  puedeParametrizar,
  servidores,
  servidorActual,
  onSelectServer,
  isFullscreen,
  onToggleFullscreen,
  onRefresh,
}) => {
  return (
    <div className={styles.macOSHeader}>
      {/* Botones de control estilo macOS */}
      <div className={styles.windowControls}>
        <span
          className={`${styles.macBtn} ${styles.btnClose}`}
          title="Cerrar"
        />
        <span
          className={`${styles.macBtn} ${styles.btnMin}`}
          title="Minimizar"
        />
        <button
          type="button"
          className={`${styles.macBtn} ${styles.btnMax}`}
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Restaurar" : "Pantalla Completa"}
        />
      </div>

      {/* Segmented Control Central estilo iOS / macOS */}
      <div className={styles.headerCenter}>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentBtn} ${tabActiva === "consola" ? styles.segmentBtnActive : ""}`}
            onClick={() => onSelectTab("consola")}
          >
            Consola Terminal
          </button>

          {puedeParametrizar && (
            <button
              type="button"
              className={`${styles.segmentBtn} ${tabActiva === "parametrizacion" ? styles.segmentBtnActive : ""}`}
              onClick={() => onSelectTab("parametrizacion")}
            >
              Parametrizacion
            </button>
          )}
        </div>
      </div>

      {/* Acciones de la derecha segun la tab activa */}
      <div className={styles.headerRight}>
        {tabActiva === "consola" && (
          <div className={styles.actionGroup}>
            {servidores.length > 1 && (
              <select
                className={styles.serverSelect}
                value={servidorActual?.id || ""}
                onChange={(e) => onSelectServer(e.target.value)}
              >
                {servidores.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.nombre}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className={styles.macActionButton}
              title="Recargar sesion"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 0.57-8.38l5.67-5.67" />
              </svg>
              <span>Reiniciar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalHeader;
