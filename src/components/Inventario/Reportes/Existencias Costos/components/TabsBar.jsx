import React from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faTable, faCogs } from "@fortawesome/free-solid-svg-icons";
import { TABS_EXISTENCIAS } from "../utils/constants";
import styles from "../ExistenciasCostos.module.css";

const TabsBar = ({ activeTab, onChangeTab, tieneAccesoParametros }) => {
  return (
    <div className={styles.tabsContainer}>
      <button
        className={`${styles.tabButton} ${activeTab === TABS_EXISTENCIAS.ANALITICA ? styles.tabActive : ""}`}
        onClick={() => onChangeTab(TABS_EXISTENCIAS.ANALITICA)}
        type="button"
      >
        <FA icon={faTable} /> Visor Analitico
      </button>

      <button
        className={`${styles.tabButton} ${activeTab === TABS_EXISTENCIAS.PARAMETROS ? styles.tabActive : ""}`}
        onClick={() =>
          tieneAccesoParametros && onChangeTab(TABS_EXISTENCIAS.PARAMETROS)
        }
        type="button"
        disabled={!tieneAccesoParametros}
        style={{
          opacity: tieneAccesoParametros ? 1 : 0.4,
          cursor: tieneAccesoParametros ? "pointer" : "not-allowed",
        }}
      >
        <FA icon={faCogs} /> Dias Cobertura
      </button>
    </div>
  );
};

export default TabsBar;
