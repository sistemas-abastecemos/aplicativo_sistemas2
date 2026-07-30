import React from "react";
import styles from "../ExistenciasCostos.module.css";

const ExistenciasCostosHeader = React.memo(() => (
  <header className={styles.encabezadoSeccion}>
    <div className={styles.encabezadoSeccionContent}>
      <h1 className={styles.title}>
        Analisis de Existencias, Coberturas y Costos
      </h1>
      <p className={styles.subtitle}>
        Cuadro matricial corporativo con clasificacion ABC flexible y
        valorizacion de excesos.
      </p>
    </div>
  </header>
));

ExistenciasCostosHeader.displayName = "ExistenciasCostosHeader";
export default ExistenciasCostosHeader;
