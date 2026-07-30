import React from "react";
import styles from "../BodegasAlternas.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarehouse, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";

const BodegasAlternasHeader = React.memo(() => {
  const hoy = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className={styles.encabezadoSeccion}>
      <div className={styles.encabezadoSeccionContent}>
        <h1 className={styles.title}>Existencias Bodegas Alternas</h1>
        <p className={styles.subtitle}>
          Análisis en tiempo real de saldos en bodegas alternas.
        </p>
      </div>
    </header>
  );
});

BodegasAlternasHeader.displayName = "BodegasAlternasHeader";
export default BodegasAlternasHeader;
