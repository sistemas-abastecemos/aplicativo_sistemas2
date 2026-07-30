import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxes } from "@fortawesome/free-solid-svg-icons";
import styles from "../ExistenciasAverias.module.css";

const EncabezadoSeccion = () => (
  <div className={styles.encabezadoSeccion}>
    <div className={styles.encabezadoSeccionContent}>
      <h1 className={styles.title}>Existencias de Averías</h1>
      <p className={styles.subtitle}>
        Análisis en tiempo real de saldos en Bodegas 03 y cruce de gobernanza de
        proveedores
      </p>
    </div>
  </div>
);

export default EncabezadoSeccion;
