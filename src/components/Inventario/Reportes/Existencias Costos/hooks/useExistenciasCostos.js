import { useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "../../../../../services/api";
import { TABS_EXISTENCIAS } from "../utils/constants";
import { exportarExistenciasCostosExcel } from "../utils/excelExport";

export const useExistenciasCostos = (addNotification) => {
  const [activeTab, setActiveTab] = useState(TABS_EXISTENCIAS.ANALITICA);
  const [subTabParam, setSubTabParam] = useState("LINEAS");
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState([]);
  const [lineasConfig, setLineasConfig] = useState([]);
  const [localesConfig, setLocalesConfig] = useState([]);
  const [localSeleccionado, setLocalSeleccionado] = useState([]);
  const [siesaLineasResult, setSiesaLineasResult] = useState([]);
  const [siesaBodegasResult, setSiesaBodegasResult] = useState([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);

  // Estados para modalidad de consulta multi-lapso
  const [esMultiLapso, setEsMultiLapso] = useState(false);
  const f = new Date();
  const [lapsoCalendario, setLapsoCalendario] = useState(
    `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`,
  );
  const [lapsosSeleccionados, setLapsosSeleccionados] = useState([]);

  // Formularios desacoplados por entidad
  const [formLinea, setFormLinea] = useState({
    id: null,
    codigo_linea: "",
    descripcion: "",
    dias_cobertura: 18,
    activo: 1,
  });
  const [formLocal, setFormLocal] = useState({
    id: null,
    codigo_local: "",
    descripcion: "",
    activo: 1,
  });

  // Controles de filtrado, busqueda y paginacion
  const [searchTerm, setSearchTerm] = useState("");
  const [abcFilter, setAbcFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const cargarLocalesConfig = useCallback(async () => {
    try {
      const res = await apiService.listarLocalesConfig();
      if (res?.success) setLocalesConfig(res.data || []);
    } catch (err) {
      addNotification({
        type: "error",
        message:
          err.message || "Error cargando maestros parametricos de bodegas.",
      });
    }
  }, [addNotification]);

  useEffect(() => {
    cargarLocalesConfig();
  }, [cargarLocalesConfig]);

  const consultarReporte = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setLoading(true);
      setCurrentPage(1);
      try {
        let res;
        if (esMultiLapso) {
          if (lapsosSeleccionados.length === 0) {
            throw new Error("Debe seleccionar al menos un periodo.");
          }
          const lapsosFormat = lapsosSeleccionados.map((l) =>
            l.replace("-", ""),
          );
          res = await apiService.obtenerReporteExistenciasCostosMultiLapso(
            lapsosFormat,
            localSeleccionado,
          );
        } else {
          res = await apiService.obtenerReporteExistenciasCostos(
            lapsoCalendario.replace("-", ""),
            localSeleccionado,
          );
        }

        const data = res?.resultado ? res.resultado : res;
        if (data?.success || Array.isArray(data)) {
          const registros = Array.isArray(data) ? data : data.data || [];
          setReporteData(registros);
          addNotification({
            type: "success",
            message: `${registros.length} registros cargados.`,
          });
        }
      } catch (err) {
        addNotification({ type: "error", message: err.message });
        setReporteData([]);
      } finally {
        setLoading(false);
      }
    },
    [
      esMultiLapso,
      lapsosSeleccionados,
      lapsoCalendario,
      localSeleccionado,
      addNotification,
    ],
  );

  const dataProcesada = useMemo(() => {
    let dataset = [...reporteData];
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      dataset = dataset.filter(
        (item) =>
          String(item.item).toLowerCase().includes(term) ||
          String(item.descripcion).toLowerCase().includes(term) ||
          String(item.proveedor).toLowerCase().includes(term) ||
          String(item.linea3).toLowerCase().includes(term),
      );
    }
    if (abcFilter !== "") {
      dataset = dataset.filter((item) => item.clasificacion_abc === abcFilter);
    }
    if (sortConfig.key) {
      dataset.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        valA = String(valA ?? "").toLowerCase();
        valB = String(valB ?? "").toLowerCase();
        return sortConfig.direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
    }
    return dataset;
  }, [reporteData, searchTerm, abcFilter, sortConfig]);

  const dataPaginada = useMemo(() => {
    const inicio = (currentPage - 1) * rowsPerPage;
    return dataProcesada.slice(inicio, inicio + rowsPerPage);
  }, [dataProcesada, currentPage, rowsPerPage]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, abcFilter, rowsPerPage]);

  const ejecutarExportacion = useCallback(async () => {
    setLoading(true);
    try {
      const etiquetaPeriodo = esMultiLapso
        ? lapsosSeleccionados.join("_") || "multi_periodo"
        : lapsoCalendario;
      await exportarExistenciasCostosExcel(
        reporteData,
        etiquetaPeriodo,
        esMultiLapso,
      );
    } catch (err) {
      addNotification({
        type: "error",
        message: err.message || "Error construyendo el archivo.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    reporteData,
    lapsoCalendario,
    esMultiLapso,
    lapsosSeleccionados,
    addNotification,
  ]);

  const cargarLineasConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.listarLineasConfig();
      if (res?.success) setLineasConfig(res.data || []);
    } catch (err) {
      addNotification({
        type: "error",
        message: err.message || "Error cargando maestros de lineas.",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (activeTab === TABS_EXISTENCIAS.PARAMETROS) {
      cargarLineasConfig();
      cargarLocalesConfig();
    }
  }, [activeTab, cargarLineasConfig, cargarLocalesConfig]);

  const guardarConfiguracion = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setLoading(true);
      try {
        const res = await apiService.guardarLineaConfig(formLinea);
        if (res?.success) {
          addNotification({
            type: "success",
            message: "Regla de cobertura guardada.",
          });
          setFormLinea({
            id: null,
            codigo_linea: "",
            descripcion: "",
            dias_cobertura: 18,
            activo: 1,
          });
          cargarLineasConfig();
        }
      } catch (err) {
        addNotification({
          type: "error",
          message: err.message || "Fallo al guardar la regla.",
        });
      } finally {
        setLoading(false);
      }
    },
    [formLinea, cargarLineasConfig, addNotification],
  );

  const eliminarConfiguracion = useCallback(
    async (id) => {
      if (
        !window.confirm("¿Seguro que desea eliminar esta regla de cobertura?")
      )
        return;
      setLoading(true);
      try {
        const res = await apiService.eliminarLineaConfig(id);
        if (res?.success) {
          addNotification({ type: "success", message: "Regla removida." });
          cargarLineasConfig();
        }
      } catch (err) {
        addNotification({
          type: "error",
          message: err.message || "No se pudo eliminar.",
        });
      } finally {
        setLoading(false);
      }
    },
    [cargarLineasConfig, addNotification],
  );

  const guardarLocalConfiguracion = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setLoading(true);
      try {
        const res = await apiService.guardarLocalConfig(formLocal);
        if (res?.success) {
          addNotification({
            type: "success",
            message: "Local parametrizado con exito.",
          });
          setFormLocal({
            id: null,
            codigo_local: "",
            descripcion: "",
            activo: 1,
          });
          cargarLocalesConfig();
        }
      } catch (err) {
        addNotification({
          type: "error",
          message: err.message || "Fallo al guardar la bodega.",
        });
      } finally {
        setLoading(false);
      }
    },
    [formLocal, cargarLocalesConfig, addNotification],
  );

  const eliminarLocalConfiguracion = useCallback(
    async (id) => {
      if (
        !window.confirm(
          "¿Desea desvincular este local del procesamiento matricial?",
        )
      )
        return;
      setLoading(true);
      try {
        const res = await apiService.eliminarLocalConfig(id);
        if (res?.success) {
          addNotification({
            type: "success",
            message: "Local removido con exito.",
          });
          cargarLocalesConfig();
        }
      } catch (err) {
        addNotification({
          type: "error",
          message: err.message || "No se logro remover el local.",
        });
      } finally {
        setLoading(false);
      }
    },
    [cargarLocalesConfig, addNotification],
  );

  const buscarLineasSiesaActivas = useCallback(async (termino) => {
    if (!termino || termino.trim().length < 2) {
      setSiesaLineasResult([]);
      return;
    }
    setLoadingBusqueda(true);
    try {
      const res = await apiService.buscarLineasSiesa(termino);
      let datos = [];
      if (res?.resultado?.data && Array.isArray(res.resultado.data)) {
        datos = res.resultado.data;
      } else if (res?.data && Array.isArray(res.data)) {
        datos = res.data;
      } else if (res?.resultado && Array.isArray(res.resultado)) {
        datos = res.resultado;
      } else if (Array.isArray(res)) {
        datos = res;
      }
      setSiesaLineasResult(datos);
    } catch (e) {
      setSiesaLineasResult([]);
    } finally {
      setLoadingBusqueda(false);
    }
  }, []);

  const buscarBodegasSiesaActivas = useCallback(async (termino) => {
    if (!termino || termino.trim().length < 2) {
      setSiesaBodegasResult([]);
      return;
    }
    setLoadingBusqueda(true);
    try {
      const res = await apiService.buscarBodegasSiesa(termino);
      let datos = [];
      if (res?.resultado?.data && Array.isArray(res.resultado.data)) {
        datos = res.resultado.data;
      } else if (res?.data && Array.isArray(res.data)) {
        datos = res.data;
      } else if (res?.resultado && Array.isArray(res.resultado)) {
        datos = res.resultado;
      } else if (Array.isArray(res)) {
        datos = res;
      }
      setSiesaBodegasResult(datos);
    } catch (e) {
      setSiesaBodegasResult([]);
    } finally {
      setLoadingBusqueda(false);
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    subTabParam,
    setSubTabParam,
    loading,
    reporteData,
    esMultiLapso,
    setEsMultiLapso,
    lapsoCalendario,
    setLapsoCalendario,
    lapsosSeleccionados,
    setLapsosSeleccionados,
    localSeleccionado,
    setLocalSeleccionado,
    consultarReporte,
    ejecutarExportacion,
    lineasConfig,
    localesConfig,

    formLinea,
    setFormLinea,
    guardarConfiguracion,
    eliminarConfiguracion,

    formLocal,
    setFormLocal,
    guardarLocalConfiguracion,
    eliminarLocalConfiguracion,

    searchTerm,
    setSearchTerm,
    abcFilter,
    setAbcFilter,
    sortConfig,
    handleSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    dataProcesada,
    dataPaginada,
    siesaLineasResult,
    setSiesaLineasResult,
    siesaBodegasResult,
    setSiesaBodegasResult,
    loadingBusqueda,
    buscarLineasSiesaActivas,
    buscarBodegasSiesaActivas,
  };
};
