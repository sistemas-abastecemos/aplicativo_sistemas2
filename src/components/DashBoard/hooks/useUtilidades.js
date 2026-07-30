import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../../services/api";

export const useUtilidades = (isManageMode = false, addNotification = null) => {
  const [utilidades, setUtilidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUtilidades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getUtilidades(isManageMode);
      if (res && res.success) {
        setUtilidades(res.data || []);
      } else {
        const msg = res?.message || "No se pudieron recuperar las utilidades";
        setError(msg);
        if (addNotification) {
          addNotification({ type: "error", message: msg });
        }
      }
    } catch (err) {
      const msg = err.message || "Error de conexion con el servidor";
      setError(msg);
      if (addNotification) {
        addNotification({ type: "error", message: msg });
      }
    } finally {
      setLoading(false);
    }
  }, [isManageMode, addNotification]);

  useEffect(() => {
    fetchUtilidades();
  }, [fetchUtilidades]);

  const handleSave = async (payload) => {
    try {
      const res = await apiService.saveUtilidad(payload);
      if (res && res.success) {
        if (addNotification) {
          addNotification({
            type: "success",
            message: payload.id
              ? "Utilidad actualizada correctamente"
              : "Utilidad creada correctamente",
          });
        }
        await fetchUtilidades();
      } else {
        if (addNotification) {
          addNotification({
            type: "error",
            message: res?.message || "Error al guardar la utilidad",
          });
        }
      }
      return res;
    } catch (err) {
      if (addNotification) {
        addNotification({
          type: "error",
          message: err.message || "Error al procesar la solicitud",
        });
      }
      return { success: false, message: err.message };
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiService.deleteUtilidad(id);
      if (res && res.success) {
        if (addNotification) {
          addNotification({
            type: "success",
            message: "Utilidad eliminada correctamente",
          });
        }
        await fetchUtilidades();
      } else {
        if (addNotification) {
          addNotification({
            type: "error",
            message: res?.message || "Error al eliminar la utilidad",
          });
        }
      }
      return res;
    } catch (err) {
      if (addNotification) {
        addNotification({
          type: "error",
          message: err.message || "Error al eliminar la utilidad",
        });
      }
      return { success: false, message: err.message };
    }
  };

  return {
    utilidades,
    loading,
    error,
    refetch: fetchUtilidades,
    handleSave,
    handleDelete,
  };
};
