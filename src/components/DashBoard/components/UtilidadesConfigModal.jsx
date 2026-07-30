import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faTrash,
  faCheck,
  faGlobe,
  faTag,
  faLink,
  faImage,
  faCheckSquare,
  faSquare,
} from "@fortawesome/free-solid-svg-icons";
import { apiService } from "../../../services/api";
import styles from "../Dashboard.module.css";

const initialForm = {
  id: null,
  titulo: "",
  descripcion: "",
  url_destino: "",
  url_icono: "",
  areas_permitidas: [],
  estado: true,
  orden: 0,
};

export const UtilidadesConfigModal = ({
  isOpen,
  onClose,
  utilidades,
  onSave,
  onDelete,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [areasList, setAreasList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiService
        .getAreas(true)
        .then((res) => {
          if (Array.isArray(res)) setAreasList(res);
          else if (res?.data && Array.isArray(res.data)) setAreasList(res.data);
        })
        .catch(() => setAreasList([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedItem) {
      setFormData({
        id: selectedItem.id,
        titulo: selectedItem.titulo || "",
        descripcion: selectedItem.descripcion || "",
        url_destino: selectedItem.url_destino || "",
        url_icono: selectedItem.url_icono || "",
        areas_permitidas: selectedItem.areas_permitidas || [],
        estado: selectedItem.estado ?? true,
        orden: selectedItem.orden || 0,
      });
    } else {
      setFormData(initialForm);
    }
  }, [selectedItem]);

  // Obtener todas las llaves de áreas disponibles
  const allAreaKeys = useMemo(() => {
    return areasList.map((area) => area.id || area.codigo || area.nombre);
  }, [areasList]);

  // Evaluar si todas las áreas están seleccionadas
  const isAllSelected = useMemo(() => {
    if (allAreaKeys.length === 0) return false;
    return allAreaKeys.every((key) => formData.areas_permitidas.includes(key));
  }, [allAreaKeys, formData.areas_permitidas]);

  // Alternar entre seleccionar todas y desmarcar todas
  const handleToggleAllAreas = () => {
    setFormData((prev) => ({
      ...prev,
      areas_permitidas: isAllSelected ? [] : [...allAreaKeys],
    }));
  };

  const toggleArea = (areaKey) => {
    setFormData((prev) => {
      const exists = prev.areas_permitidas.includes(areaKey);
      const nextAreas = exists
        ? prev.areas_permitidas.filter((a) => a !== areaKey)
        : [...prev.areas_permitidas, areaKey];
      return { ...prev, areas_permitidas: nextAreas };
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await onSave(formData);
      if (res && res.success) {
        setSelectedItem(null);
        setFormData(initialForm);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentSheet}>
        <div className={styles.modalHeaderApple}>
          <h2>Gestión de Accesos Directos</h2>
          <button className={styles.modalCloseBtnApple} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.modalBodyApple}>
          <div className={styles.modalSidebarApple}>
            <button
              type="button"
              className={styles.createAppleBtn}
              onClick={() => setSelectedItem(null)}
            >
              <FontAwesomeIcon icon={faPlus} /> Nueva Utilidad
            </button>
            <div className={styles.utilidadesAppleList}>
              {utilidades.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.utilidadAppleItem} ${
                    selectedItem?.id === item.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <span className={styles.itemTitleText}>{item.titulo}</span>
                  <span
                    className={
                      item.estado
                        ? styles.badgeActiveApple
                        : styles.badgeInactiveApple
                    }
                  >
                    {item.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form className={styles.modalFormApple} onSubmit={handleSubmit}>
            <div className={styles.formGroupApple}>
              <input
                type="text"
                required
                className={styles.formInputApple}
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder=" "
              />
              <label className={styles.floatingLabelNotch}>
                <FontAwesomeIcon icon={faTag} /> Título *
              </label>
            </div>

            <div className={styles.formGroupApple}>
              <input
                type="text"
                className={styles.formInputApple}
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder=" "
              />
              <label className={styles.floatingLabelNotch}>
                Descripción breve
              </label>
            </div>

            <div className={styles.formGroupApple}>
              <input
                type="url"
                required
                className={styles.formInputApple}
                value={formData.url_destino}
                onChange={(e) =>
                  setFormData({ ...formData, url_destino: e.target.value })
                }
                placeholder=" "
              />
              <label className={styles.floatingLabelNotch}>
                <FontAwesomeIcon icon={faLink} /> URL Destino *
              </label>
            </div>

            <div className={styles.formGroupApple}>
              <input
                type="url"
                className={styles.formInputApple}
                value={formData.url_icono}
                onChange={(e) =>
                  setFormData({ ...formData, url_icono: e.target.value })
                }
                placeholder=" "
              />
              <label className={styles.floatingLabelNotch}>
                <FontAwesomeIcon icon={faImage} /> URL Icono / PNG
              </label>
            </div>

            <div className={styles.formGroupApple}>
              {/* Label flotante superior izquierdo */}
              <label className={styles.floatingLabelNotch}>
                <FontAwesomeIcon icon={faGlobe} /> Áreas Permitidas
                <span className={styles.labelSubtext}>
                  {" "}
                  (Sin selección = Visible para todos)
                </span>
              </label>

              {/* Botón flotante de acción superior derecho */}
              {areasList.length > 0 && (
                <button
                  type="button"
                  className={styles.floatingActionNotch}
                  onClick={handleToggleAllAreas}
                >
                  <FontAwesomeIcon
                    icon={isAllSelected ? faCheckSquare : faSquare}
                  />{" "}
                  {isAllSelected ? "Desmarcar todos" : "Marcar todos"}
                </button>
              )}

              {/* Grilla de checkboxes */}
              <div className={styles.areasPillsGrid}>
                {areasList.map((area) => {
                  const areaKey = area.id || area.codigo || area.nombre;
                  const isChecked = formData.areas_permitidas.includes(areaKey);
                  return (
                    <label key={areaKey} className={styles.areaPillLabel}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArea(areaKey)}
                      />
                      {area.nombre || area.descripcion || areaKey}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.formInlineRow}>
              <div className={styles.formInlineGroup}>
                <label>Orden de visualización:</label>
                <input
                  type="number"
                  className={styles.numberInputApple}
                  value={formData.orden}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orden: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className={styles.formInlineGroup}>
                <label className={styles.areaPillLabel}>
                  <input
                    type="checkbox"
                    checked={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.checked })
                    }
                  />
                  Activo en Dashboard
                </label>
              </div>
            </div>

            <div className={styles.modalActionsApple}>
              {formData.id && (
                <button
                  type="button"
                  className={styles.deleteAppleBtn}
                  onClick={() => onDelete(formData.id)}
                >
                  <FontAwesomeIcon icon={faTrash} /> Eliminar
                </button>
              )}
              <button
                type="button"
                className={styles.cancelAppleBtn}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveAppleBtn}
                disabled={saving}
              >
                <FontAwesomeIcon icon={faCheck} />{" "}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UtilidadesConfigModal;
