import React from "react";
import styles from "../Terminal.module.css";

export const AccessDenied = ({ error }) => {
  return (
    <div className={styles.deniedContainer}>
      <div className={styles.deniedCard}>
        <div className={styles.warningIcon}>!</div>
        <h2>Acceso Restringido</h2>
        <p>
          {error ||
            "No tienes permisos configurados en el menu para acceder a este modulo de terminal."}
        </p>
        <span className={styles.contactInfo}>
          Consulta con el administrador del sistema para habilitar la opcion en
          tu perfil de usuario.
        </span>
      </div>
    </div>
  );
};
