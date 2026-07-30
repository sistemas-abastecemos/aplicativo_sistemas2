import React from "react";
import styles from "../Informes.module.css";

const InformeFormTab = ({ formData, onChange, areas }) => (
  <div className={styles.formColumns}>
    <div className={styles.formColumn}>
      <div className={`${styles.formGroup} ${styles.floating}`}>
        <input
          type="text"
          name="titulo"
          value={formData.titulo}
          placeholder="Ejemplo: Informe de Ventas"
          onChange={onChange}
          className={`${styles.formInput} ${!formData.titulo ? styles.inputError : ""}`}
        />
        <label>Título *</label>
      </div>

      <div className={`${styles.formGroup} ${styles.floating}`}>
        <select
          name="id_area"
          value={formData.id_area}
          onChange={onChange}
          className={styles.formSelect}
        >
          <option value="">Seleccione...</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <label>Área Responsable *</label>
      </div>

      <div className={`${styles.formGroup} ${styles.floating}`}>
        <input
          type="text"
          name="url"
          value={formData.url}
          placeholder="Ejemplo: https://powerbi.microsoft.com/en-us/"
          onChange={onChange}
          className={`${styles.formInput} ${!formData.url ? styles.inputError : ""}`}
        />
        <label>URL de Inserción Power BI *</label>
      </div>
    </div>

    <div className={styles.formColumn}>
      <div className={`${styles.formGroup} ${styles.floating}`}>
        <input
          type="text"
          name="descripcion"
          value={formData.descripcion}
          placeholder="Ejemplo: Informe de ventas por mes"
          onChange={onChange}
          className={styles.formInput}
        />
        <label>Descripción de la métrica</label>
      </div>

      <div className={`${styles.formGroup} ${styles.floating}`}>
        <input
          type="color"
          name="color"
          value={formData.color || "#3b82f6"}
          onChange={onChange}
          className={styles.formInput}
          style={{ padding: "2px", height: "38px", cursor: "pointer" }}
        />
        <label>Color Corporativo</label>
      </div>

      <div className={`${styles.formGroup} ${styles.floating}`}>
        <select
          name="activo"
          value={formData.activo}
          onChange={onChange}
          className={styles.formSelect}
        >
          <option value={1}>Operativo</option>
          <option value={0}>Suspendido</option>
        </select>
        <label>Estado del Módulo</label>
      </div>

      {/* Campo Orden de Visualización añadido */}
      <div className={`${styles.formGroup} ${styles.floating}`}>
        <input
          type="number"
          name="orden"
          value={
            formData.orden !== null && formData.orden !== undefined
              ? formData.orden
              : ""
          }
          placeholder="Vacío para autocalcular (Siguiente +1)"
          onChange={onChange}
          min="1"
          className={styles.formInput}
        />
        <label>Orden de Visualización</label>
      </div>
    </div>
  </div>
);

export default InformeFormTab;
