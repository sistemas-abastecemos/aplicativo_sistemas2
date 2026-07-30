import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSlidersH,
  faExternalLinkAlt,
  faTh,
} from "@fortawesome/free-solid-svg-icons";
import { useUtilidades } from "../hooks/useUtilidades";
import { useNotification } from "../../../contexts/NotificationContext";
import LoadingScreen from "../../UI/LoadingScreen";
import { UtilidadesConfigModal } from "./UtilidadesConfigModal";
import styles from "../Dashboard.module.css";

export const UtilidadesSection = ({ canEdit = false }) => {
  const { addNotification } = useNotification();
  const { utilidades, loading, handleSave, handleDelete } = useUtilidades(
    canEdit,
    addNotification,
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  if (loading) {
    return <LoadingScreen isVisible={true} title="Cargando utilidades..." />;
  }

  if (!loading && utilidades.length === 0 && !canEdit) {
    return null;
  }

  return (
    <section className={styles.utilidadesSection}>
      <div className={styles.utilidadesHeader}>
        <div className={styles.utilidadesTitle}>
          <div className={styles.titleIcon}>
            <FontAwesomeIcon icon={faTh} />
          </div>
          <h2>Utilidades y Accesos Directos</h2>
          <span className={styles.utilidadesCount}>{utilidades.length}</span>
        </div>
        {canEdit && (
          <button
            className={styles.configButton}
            onClick={() => setIsConfigOpen(true)}
            title="Gestionar accesos directos"
          >
            <FontAwesomeIcon icon={faSlidersH} /> Configurar
          </button>
        )}
      </div>

      <div className={styles.utilidadesGrid}>
        {utilidades.map((item) => (
          <a
            key={item.id}
            href={item.url_destino}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.utilidadCard}
          >
            <div className={styles.utilidadAvatar}>
              {item.url_icono ? (
                <img
                  src={item.url_icono}
                  alt={item.titulo}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.innerText = item.titulo
                      .charAt(0)
                      .toUpperCase();
                  }}
                />
              ) : (
                item.titulo.charAt(0).toUpperCase()
              )}
            </div>

            <div className={styles.utilidadDetails}>
              <div className={styles.utilidadTitleRow}>
                <h3 className={styles.utilidadName}>{item.titulo}</h3>
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                  className={styles.externalLinkIcon}
                />
              </div>
              {item.descripcion && (
                <p className={styles.utilidadDesc}>{item.descripcion}</p>
              )}
            </div>
          </a>
        ))}
      </div>

      {canEdit && (
        <UtilidadesConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          utilidades={utilidades}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
};

export default UtilidadesSection;
