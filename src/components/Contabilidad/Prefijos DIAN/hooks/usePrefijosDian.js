import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../../../services/api";
import { useDianExcelProcessor } from "./useDianExcelProcessor";
import { useDianAnalytics } from "./useDianAnalytics";

export const usePrefijosDian = (loginUsuario, addNotification) => {
  const [activeTab, setActiveTab] = useState("auditoria");
  const [empresa, setEmpresa] = useState("abastecemos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [columnas, setColumnas] = useState([]);
  const [reporte, setReporte] = useState([]);
  const [error, setError] = useState(null);

  const [configList, setConfigList] = useState([]);
  const [configListEdit, setConfigListEdit] = useState([]);

  const [maestroDianActivo, setMaestroDianActivo] = useState([]);
  const [alertasSiesaHuerfanos, setAlertasSiesaHuerfanos] = useState([]);
  const [ultimoIndexCreado, setUltimoIndexCreado] = useState(null);

  const [diasConciliados, setDiasConciliados] = useState({});
  const [guardandoConciliacion, setGuardandoConciliacion] = useState(false);

  // Instanciacion del Sub-Hook de procesamiento binario Excel
  const {
    datosDian,
    setDatosDian,
    documentosFaltantesDian,
    setDocumentosFaltantesDian,
    procesarExcelDian,
  } = useDianExcelProcessor(maestroDianActivo, addNotification, setLoading);

  // Instanciacion del Sub-Hook del Motor de Analiticas Derivadas
  const {
    sedesAgrupadas,
    alertasHuerfanasConsolidadas,
    diasNuevosParaGuardar,
  } = useDianAnalytics(
    configList,
    configListEdit,
    reporte,
    alertasSiesaHuerfanos,
    datosDian,
    columnas,
    diasConciliados,
  );

  // Inicializacion automatica del calendario mensual original
  useEffect(() => {
    const ahora = new Date();
    const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ayer = new Date();
    ayer.setDate(ahora.getDate() - 1);

    const formatFecha = (d) => {
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const dia = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${mes}-${dia}`;
    };

    setFechaInicio(formatFecha(primerDia));
    setFechaFin(formatFecha(ayer));
    cargarConfiguracionMaestra();
  }, []);

  useEffect(() => {
    if (activeTab === "configuracion") {
      setConfigListEdit(JSON.parse(JSON.stringify(configList)));
    }
  }, [activeTab, configList]);

  const cargarConfiguracionMaestra = async () => {
    try {
      const res = await apiService.obtenerConfiguracionDian();
      const dataRaiz = res.resultado ? res.resultado : res;

      if (res && (res.success || dataRaiz.success)) {
        const listadoLimpio = Array.isArray(dataRaiz)
          ? dataRaiz
          : dataRaiz.resultado || [];
        const datosConIndice = listadoLimpio.map((item, idx) => ({
          ...item,
          indexOriginal: idx,
          activo: item.activo !== undefined ? Number(item.activo) : 1,
        }));
        setConfigList(datosConIndice);
        setConfigListEdit(JSON.parse(JSON.stringify(datosConIndice)));
        setMaestroDianActivo(listadoLimpio);
      }
    } catch (err) {
      console.error("Error cargando configuracion maestro DIAN:", err);
    }
  };

  const cargarDiasConciliados = async (inicio, fin) => {
    try {
      const res = await apiService.obtenerDiasConciliados(
        empresa.trim(),
        inicio.trim(),
        fin.trim(),
      );
      if (res && res.success) {
        setDiasConciliados(res.dias_cerrados || {});
      }
    } catch (err) {
      console.error("Error cargando dias conciliados:", err);
    }
  };

  const consultarAuditoria = async (e) => {
    if (e) e.preventDefault();
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      setError("La fecha inicial no puede ser mayor a la fecha final.");
      return;
    }
    setLoading(true);
    setError(null);
    setDatosDian(null);
    setDocumentosFaltantesDian([]);
    setDiasConciliados({});

    try {
      const response = await apiService.obtenerAuditoriaDian(
        empresa.trim(),
        fechaInicio.trim(),
        fechaFin.trim(),
      );
      const dataInner =
        response && response.resultado ? response.resultado : response;

      if (dataInner && dataInner.success) {
        setColumnas(dataInner.columnas || []);
        setReporte(dataInner.reporte || []);
        setMaestroDianActivo(dataInner.maestro_config || []);
        if (dataInner.huerfanos_siesa) {
          setAlertasSiesaHuerfanos(dataInner.huerfanos_siesa);
        }
        await cargarDiasConciliados(fechaInicio, fechaFin);
        addNotification({
          type: "success",
          message: "Auditoria matricial cargada con exito.",
        });
      } else {
        setError(
          dataInner?.message ||
            "No se encontraron registros en el periodo de tiempo evaluado.",
        );
      }
    } catch (err) {
      setError(
        err.message || "Fallo la conexion con el servidor interno de Siesa.",
      );
    } finally {
      setLoading(false);
    }
  };

  const ejecutarGuardadoConciliacion = async () => {
    if (!datosDian || Object.keys(datosDian).length === 0) {
      addNotification({
        type: "error",
        message: "No hay informacion cargada de la DIAN para guardar.",
      });
      return;
    }
    setGuardandoConciliacion(true);
    try {
      const diasAPescar = [];
      columnas.forEach((col) => {
        const fk = col.replace(/-/g, "");
        if (diasConciliados[col]) return;

        const dianDia = datosDian[fk];
        if (!dianDia || dianDia.total_general === 0) return;

        const totalSiesaPdv = reporte
          .filter((r) => r.bloque === "PDV")
          .reduce((sum, r) => sum + (r.dias[fk]?.total || 0), 0);
        const totalSiesaEst = reporte
          .filter((r) => r.bloque === "ESTANDAR")
          .reduce((sum, r) => sum + (r.dias[fk]?.total || 0), 0);
        const totalSiesaGen = totalSiesaPdv + totalSiesaEst;

        const detalleFilas = reporte.map((item) => {
          const diaData = item.dias[fk] || { total: 0 };
          const centroOad = item.co_siesa
            ? String(item.co_siesa).padStart(3, "0")
            : "";
          let totalDianFila = 0;

          const reglasAsoc = maestroDianActivo.filter(
            (r) =>
              String(r.co_siesa).padStart(3, "0") === centroOad &&
              String(r.tipo_siesa).trim().toUpperCase() ===
                String(item.tipo).trim().toUpperCase(),
          );

          reglasAsoc.forEach((reg) => {
            const prefijos = String(reg.prefijos_dian || "")
              .split(",")
              .map((x) => x.trim().toUpperCase())
              .filter(Boolean);
            prefijos.forEach((pref) => {
              const llave = `${centroOad}_${String(item.tipo).trim().toUpperCase()}_${pref}`;
              if (dianDia.totales_compuestos?.[llave])
                totalDianFila += dianDia.totales_compuestos[llave];
            });
          });

          return {
            co_siesa: item.co_siesa,
            tipo: item.tipo,
            total_siesa: diaData.total || 0,
            total_dian: totalDianFila,
            diferencia: (diaData.total || 0) - totalDianFila,
          };
        });

        diasAPescar.push({
          fecha: col,
          total_siesa_pdv: totalSiesaPdv,
          total_siesa_est: totalSiesaEst,
          total_siesa_general: totalSiesaGen,
          total_dian_pdv: dianDia.total_pdv,
          total_dian_est: dianDia.total_estandar,
          total_dian_general: dianDia.total_general,
          detalle_filas: detalleFilas,
        });
      });

      if (diasAPescar.length === 0) {
        addNotification({
          type: "info",
          message: "No hay dias nuevos pendientes por guardar.",
        });
        return;
      }

      const res = await apiService.guardarConciliacionDian(
        empresa.trim(),
        loginUsuario.trim(),
        diasAPescar,
      );
      if (res && res.success) {
        addNotification({
          type: "success",
          message: res.message || "Conciliacion guardada.",
        });
        await cargarDiasConciliados(fechaInicio, fechaFin);
      }
    } catch (err) {
      addNotification({
        type: "error",
        message: err.message || "Error al guardar conciliacion.",
      });
    } finally {
      setGuardandoConciliacion(false);
    }
  };

  const handleConfigChange = useCallback((indexReal, campo, valor) => {
    setConfigListEdit((prev) =>
      prev.map((row) =>
        row.indexOriginal === indexReal ? { ...row, [campo]: valor } : row,
      ),
    );
  }, []);

  const toggleEstadoActivo = useCallback((indexReal) => {
    setConfigListEdit((prev) =>
      prev.map((row) =>
        row.indexOriginal === indexReal
          ? { ...row, activo: row.activo === 1 ? 0 : 1 }
          : row,
      ),
    );
  }, []);

  const handleRemoveConfigRow = useCallback((indexReal) => {
    setConfigListEdit((prev) =>
      prev.filter((row) => row.indexOriginal !== indexReal),
    );
  }, []);

  const handleAddConfigRow = () => {
    const nuevoIdx =
      configListEdit.length > 0
        ? Math.max(...configListEdit.map((r) => r.indexOriginal)) + 1
        : 0;
    const nuevoFila = {
      indexOriginal: nuevoIdx,
      categoria: "PDV",
      tipo_documento: "FACTURA",
      sub_bloque: "NORMAL",
      grupo_sede: "",
      tipo_siesa: "",
      co_siesa: "",
      descripcion: "",
      prefijos_dian: "",
      fecha_desde: fechaInicio || "2026-01-01",
      fecha_hasta: "2030-12-31",
      activo: 1,
    };
    setUltimoIndexCreado(nuevoIdx);
    setConfigListEdit((prev) => [...prev, nuevoFila]);
  };

  const ejecutarGuardadoConfig = async () => {
    for (let i = 0; i < configListEdit.length; i++) {
      const r = configListEdit[i];
      if (
        !String(r.tipo_siesa).trim() ||
        !String(r.co_siesa).trim() ||
        !String(r.grupo_sede).trim()
      ) {
        addNotification({
          type: "error",
          message: `Fila ${i + 1}: Hay campos obligatorios vacios.`,
        });
        return;
      }
    }
    setLoading(true);
    try {
      const res = await apiService.guardarConfiguracionDian(configListEdit);
      if (res && res.success) {
        addNotification({
          type: "success",
          message: "Parametrizacion fiscal actualizada con exito",
        });
        setConfigList(JSON.parse(JSON.stringify(configListEdit)));
        // setActiveTab("auditoria");
      }
    } catch (err) {
      addNotification({
        type: "error",
        message: "Fallo el almacenamiento de la configuracion.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    empresa,
    setEmpresa,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    loading,
    columnas,
    reporte,
    error,
    datosDian,
    configListEdit,
    maestroDianActivo,
    documentosFaltantesDian,
    ultimoIndexCreado,
    setUltimoIndexCreado,
    diasConciliados,
    guardandoConciliacion,
    sedesAgrupadas,
    alertasHuerfanasConsolidadas,
    diasNuevosParaGuardar,
    consultarAuditoria,
    procesarExcelDian,
    ejecutarGuardadoConciliacion,
    handleConfigChange,
    toggleEstadoActivo,
    handleRemoveConfigRow,
    handleAddConfigRow,
    ejecutarGuardadoConfig,
  };
};
