import React from "react";
import styles from "../Terminal.module.css";

const ServidoresParametrizacion = ({
  servidores,
  puedeCrear,
  puedeEditar,
  puedeEliminar,
}) => {
  return (
    <div className={styles.parametrizacionContainer}>
      <div className={styles.toolbarParametrizacion}>
        <div>
          <h3 className={styles.paramTitle}>Servidores Configurados</h3>
          <p className={styles.paramSub}>
            Gestiona las conexiones remotas registradas en el servidor Guacamole
          </p>
        </div>

        {puedeCrear && (
          <button type="button" className={styles.btnNuevoServidor}>
            + Nuevo Servidor
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.paramTable}>
          <thead>
            <tr>
              <th>Nombre Servidor</th>
              <th>Host / IP</th>
              <th>Protocolo</th>
              <th>Puerto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servidores.map((srv) => (
              <tr key={srv.id}>
                <td className={styles.fontMedium}>{srv.nombre}</td>
                <td>
                  <code>{srv.ip}</code>
                </td>
                <td>
                  <span className={styles.badgeProtocol}>{srv.protocolo}</span>
                </td>
                <td>{srv.puerto}</td>
                <td>
                  <span className={styles.badgeStatusActive}>{srv.estado}</span>
                </td>
                <td>
                  <div className={styles.actionRow}>
                    {puedeEditar && (
                      <button
                        type="button"
                        className={styles.btnIconEdit}
                        title="Editar Servidor"
                      >
                        Editar
                      </button>
                    )}
                    {puedeEliminar && (
                      <button
                        type="button"
                        className={styles.btnIconDelete}
                        title="Eliminar Servidor"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServidoresParametrizacion;
