import React, { useState, useEffect } from "react";
import styles from "../ExistenciasCostos.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faTrash,
  faEdit,
  faBoxes,
  faStoreAlt,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";

const TabParametrizacion = React.memo(({ model, puedeEditar }) => {
  const { subTabParam, setSubTabParam } = model;
  const [inputBusquedaLinea, setInputBusquedaLinea] = useState("");
  const [inputBusquedaLocal, setInputBusquedaLocal] = useState("");

  // --- ESTADOS LOCALES DE PAGINACION PARA LINEAS ---
  const [currentPageLineas, setCurrentPageLineas] = useState(1);
  const [rowsPerPageLineas, setRowsPerPageLineas] = useState(25);

  // --- ESTADOS LOCALES DE PAGINACION PARA LOCALES ---
  const [currentPageLocales, setCurrentPageLocales] = useState(1);
  const [rowsPerPageLocales, setRowsPerPageLocales] = useState(25);

  // Reiniciar indices de pagina al conmutar de vista analitica
  useEffect(() => {
    setCurrentPageLineas(1);
    setCurrentPageLocales(1);
  }, [subTabParam]);

  // Manejadores para capturar la tecla Enter de forma segura
  const handleKeyDownLinea = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      model.buscarLineasSiesaActivas(inputBusquedaLinea);
    }
  };

  const handleKeyDownLocal = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      model.buscarBodegasSiesaActivas(inputBusquedaLocal);
    }
  };

  // --- LOGICA DE PROCESAMIENTO: PARAMETROS DE LINEAS ---
  const totalPagesLineas = Math.ceil(
    (model.lineasConfig?.length || 0) / rowsPerPageLineas,
  );
  const inicioRegistroLineas = model.lineasConfig?.length
    ? (currentPageLineas - 1) * rowsPerPageLineas + 1
    : 0;
  const finRegistroLineas = Math.min(
    currentPageLineas * rowsPerPageLineas,
    model.lineasConfig?.length || 0,
  );
  const dataPaginadaLineas = React.useMemo(() => {
    const inicio = (currentPageLineas - 1) * rowsPerPageLineas;
    return (model.lineasConfig || []).slice(inicio, inicio + rowsPerPageLineas);
  }, [model.lineasConfig, currentPageLineas, rowsPerPageLineas]);

  // --- LOGICA DE PROCESAMIENTO: PARAMETROS DE LOCALES ---
  const totalPagesLocales = Math.ceil(
    (model.localesConfig?.length || 0) / rowsPerPageLocales,
  );
  const inicioRegistroLocales = model.localesConfig?.length
    ? (currentPageLocales - 1) * rowsPerPageLocales + 1
    : 0;
  const finRegistroLocales = Math.min(
    currentPageLocales * rowsPerPageLocales,
    model.localesConfig?.length || 0,
  );
  const dataPaginadaLocales = React.useMemo(() => {
    const inicio = (currentPageLocales - 1) * rowsPerPageLocales;
    return (model.localesConfig || []).slice(
      inicio,
      inicio + rowsPerPageLocales,
    );
  }, [model.localesConfig, currentPageLocales, rowsPerPageLocales]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Selector de Entidad Parametrizable */}
      <div
        className={styles.tabsContainer}
        style={{ maxWidth: "360px", marginBottom: "8px" }}
      >
        <button
          className={`${styles.tabButton} ${subTabParam === "LINEAS" ? styles.tabActive : ""}`}
          onClick={() => setSubTabParam("LINEAS")}
          type="button"
        >
          <FontAwesomeIcon icon={faBoxes} /> Dias de Cobertura
        </button>
        <button
          className={`${styles.tabButton} ${subTabParam === "LOCALES" ? styles.tabActive : ""}`}
          onClick={() => setSubTabParam("LOCALES")}
          type="button"
        >
          <FontAwesomeIcon icon={faStoreAlt} /> Bodegas / Locales
        </button>
      </div>

      {subTabParam === "LINEAS" ? (
        <div className={styles.paramLayoutGrid}>
          {/* Formulario Lineas */}
          <div
            className={styles.tarjetaFiltros}
            style={{ position: "relative" }}
          >
            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px" }}>
              Definir Regla de Cobertura
            </h4>

            <div
              className={styles.campoFlotante}
              style={{ marginBottom: "16px" }}
            >
              <input
                type="text"
                value={inputBusquedaLinea}
                onChange={(e) => {
                  setInputBusquedaLinea(e.target.value);
                  model.buscarLineasSiesaActivas(e.target.value);
                }}
                onKeyDown={handleKeyDownLinea}
                placeholder="Escriba codigo o descripcion de linea..."
                disabled={!puedeEditar}
              />
              <label
                className={inputBusquedaLinea ? styles.labelColapsado : ""}
              >
                Buscar Linea en Siesa
              </label>
              {model.loadingBusqueda && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "14px",
                    color: "#86868b",
                  }}
                />
              )}

              {model.siesaLineasResult.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #d2d2d7",
                    borderRadius: "8px",
                    zIndex: 100,
                    maxHeight: "200px",
                    overflowY: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {model.siesaLineasResult.map((linea, index) => (
                    <div
                      key={`${linea.id_linea}-${index}`}
                      onClick={() => {
                        model.setFormLinea({
                          ...model.formLinea,
                          codigo_linea: linea.id_linea,
                          descripcion: linea.descripcion,
                        });
                        setInputBusquedaLinea(
                          `${linea.id_linea} - ${linea.descripcion}`,
                        );
                        model.setSiesaLineasResult([]);
                      }}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f5f5f7",
                        fontSize: "0.85rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#f5f5f7")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "transparent")
                      }
                    >
                      <strong>{linea.id_linea}</strong> - {linea.descripcion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={model.guardarConfiguracion}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div className={styles.campoFlotante}>
                <input
                  type="text"
                  value={model.formLinea.codigo_linea}
                  readOnly
                  required
                  style={{ backgroundColor: "#f5f5f7", cursor: "not-allowed" }}
                />
                <label className={styles.labelColapsado}>
                  Codigo Seleccionado
                </label>
              </div>

              <div className={styles.campoFlotante}>
                <input
                  type="text"
                  value={model.formLinea.descripcion}
                  readOnly
                  required
                  style={{ backgroundColor: "#f5f5f7", cursor: "not-allowed" }}
                />
                <label className={styles.labelColapsado}>
                  Descripcion Linea
                </label>
              </div>

              <div className={styles.campoFlotante}>
                <input
                  type="number"
                  value={model.formLinea.dias_cobertura}
                  onChange={(e) =>
                    model.setFormLinea({
                      ...model.formLinea,
                      dias_cobertura: Number(e.target.value),
                    })
                  }
                  required
                  min={0}
                />
                <label
                  className={
                    model.formLinea.dias_cobertura ? styles.labelColapsado : ""
                  }
                >
                  Dias de Cobertura Meta
                </label>
              </div>

              <button
                type="submit"
                className={styles.btnBuscarDatos}
                style={{ width: "100%" }}
                disabled={!puedeEditar || !model.formLinea.codigo_linea}
              >
                <FontAwesomeIcon icon={faSave} /> Guardar Cobertura
              </button>
            </form>
          </div>

          {/* Tabla Lineas Configurada con Paginacion */}
          <div className={styles.contenedorTablaMaestra}>
            <div className={styles.tablaResponsivaWrapper}>
              <table className={styles.tablaConfig}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f7" }}>
                    <th>Codigo</th>
                    <th>Linea</th>
                    <th className={styles.numeroAlineado}>
                      Dias Cobertura Meta
                    </th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPaginadaLineas.map((linea) => (
                    <tr key={linea.id}>
                      <td style={{ fontWeight: "700" }}>
                        {linea.codigo_linea}
                      </td>
                      <td>{linea.descripcion}</td>
                      <td
                        className={styles.numeroAlineado}
                        style={{ fontWeight: "600", color: "#028059" }}
                      >
                        {linea.dias_cobertura} dias
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className={styles.btnDescargarExcel}
                          style={{ padding: "4px 8px", marginRight: "6px" }}
                          onClick={() => {
                            model.setFormLinea(linea);
                            setInputBusquedaLinea(
                              `${linea.codigo_linea} - ${linea.descripcion}`,
                            );
                          }}
                          disabled={!puedeEditar}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          type="button"
                          className={styles.btnDescargarExcel}
                          style={{ padding: "4px 8px", color: "#b91c1c" }}
                          onClick={() => model.eliminarConfiguracion(linea.id)}
                          disabled={!puedeEditar}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dataPaginadaLineas.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          textAlign: "center",
                          color: "#86868b",
                          padding: "20px",
                        }}
                      >
                        No hay reglas de cobertura parametrizadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Panel Control Paginacion Lineas */}
            <div className={styles.paginacionContainer}>
              <div className={styles.paginacionMeta}>
                Mostrando <strong>{inicioRegistroLineas}</strong> al{" "}
                <strong>{finRegistroLineas}</strong> de{" "}
                <strong>{model.lineasConfig?.length || 0}</strong> registros
              </div>
              <div className={styles.paginacionControles}>
                <div className={styles.rowsSelectorWrapper}>
                  <select
                    value={rowsPerPageLineas}
                    onChange={(e) => {
                      setRowsPerPageLineas(Number(e.target.value));
                      setCurrentPageLineas(1);
                    }}
                  >
                    <option value={10}>10 Filas</option>
                    <option value={25}>25 Filas</option>
                    <option value={50}>50 Filas</option>
                  </select>
                </div>
                <div className={styles.paginacionBotonera}>
                  <button
                    type="button"
                    onClick={() => setCurrentPageLineas(1)}
                    disabled={currentPageLineas === 1}
                  >
                    <FontAwesomeIcon icon={faAngleDoubleLeft} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPageLineas((p) => Math.max(p - 1, 1))
                    }
                    disabled={currentPageLineas === 1}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <span className={styles.paginacionLabel}>
                    Pagina {currentPageLineas} de {totalPagesLineas || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPageLineas((p) =>
                        Math.min(p + 1, totalPagesLineas),
                      )
                    }
                    disabled={
                      currentPageLineas === totalPagesLineas ||
                      totalPagesLineas === 0
                    }
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPageLineas(totalPagesLineas)}
                    disabled={
                      currentPageLineas === totalPagesLineas ||
                      totalPagesLineas === 0
                    }
                  >
                    <FontAwesomeIcon icon={faAngleDoubleRight} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.paramLayoutGrid}>
          {/* Formulario Locales */}
          <div
            className={styles.tarjetaFiltros}
            style={{ position: "relative" }}
          >
            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px" }}>
              Vincular Unidad Operativa
            </h4>

            <div
              className={styles.campoFlotante}
              style={{ marginBottom: "16px" }}
            >
              <input
                type="text"
                value={inputBusquedaLocal}
                onChange={(e) => {
                  setInputBusquedaLocal(e.target.value);
                  model.buscarBodegasSiesaActivas(e.target.value);
                }}
                onKeyDown={handleKeyDownLocal}
                placeholder="Escriba codigo o descripcion de bodega..."
                disabled={!puedeEditar}
              />
              <label
                className={inputBusquedaLocal ? styles.labelColapsado : ""}
              >
                Buscar Bodega en Siesa
              </label>
              {model.loadingBusqueda && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "14px",
                    color: "#86868b",
                  }}
                />
              )}

              {model.siesaBodegasResult.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #d2d2d7",
                    borderRadius: "8px",
                    zIndex: 100,
                    maxHeight: "200px",
                    overflowY: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {model.siesaBodegasResult.map((bodega, index) => (
                    <div
                      key={`${bodega.id_local}-${index}`}
                      onClick={() => {
                        model.setFormLocal({
                          ...model.formLocal,
                          codigo_local: bodega.id_local,
                          descripcion: bodega.descripcion,
                        });
                        setInputBusquedaLocal(
                          `${bodega.id_local} - ${bodega.descripcion}`,
                        );
                        model.setSiesaBodegasResult([]);
                      }}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f5f5f7",
                        fontSize: "0.85rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#f5f5f7")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "transparent")
                      }
                    >
                      <strong>{bodega.id_local}</strong> - {bodega.descripcion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={model.guardarLocalConfiguracion}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div className={styles.campoFlotante}>
                <input
                  type="text"
                  value={model.formLocal.codigo_local}
                  readOnly
                  required
                  style={{ backgroundColor: "#f5f5f7", cursor: "not-allowed" }}
                />
                <label className={styles.labelColapsado}>Codigo Local</label>
              </div>

              <div className={styles.campoFlotante}>
                <input
                  type="text"
                  value={model.formLocal.descripcion}
                  readOnly
                  required
                  style={{ backgroundColor: "#f5f5f7", cursor: "not-allowed" }}
                />
                <label className={styles.labelColapsado}>
                  Denominacion Bodega
                </label>
              </div>

              <button
                type="submit"
                className={styles.btnBuscarDatos}
                style={{ width: "100%" }}
                disabled={!puedeEditar || !model.formLocal.codigo_local}
              >
                <FontAwesomeIcon icon={faSave} /> Autorizar Bodega
              </button>
            </form>
          </div>

          {/* Tabla Locales Configurada con Paginacion */}
          <div className={styles.contenedorTablaMaestra}>
            <div className={styles.tablaResponsivaWrapper}>
              <table className={styles.tablaConfig}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f7" }}>
                    <th>Codigo Local</th>
                    <th>Denominacion / Supermercado</th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPaginadaLocales.map((loc) => (
                    <tr key={loc.id}>
                      <td style={{ fontWeight: "700", color: "#1d1d1f" }}>
                        {loc.codigo_local}
                      </td>
                      <td>{loc.descripcion}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className={styles.btnDescargarExcel}
                          style={{ padding: "4px 8px", marginRight: "6px" }}
                          onClick={() => {
                            model.setFormLocal(loc);
                            setInputBusquedaLocal(
                              `${loc.codigo_local} - ${loc.descripcion}`,
                            );
                          }}
                          disabled={!puedeEditar}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          type="button"
                          className={styles.btnDescargarExcel}
                          style={{ padding: "4px 8px", color: "#b91c1c" }}
                          onClick={() =>
                            model.eliminarLocalConfiguracion(loc.id)
                          }
                          disabled={!puedeEditar}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dataPaginadaLocales.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          textAlign: "center",
                          color: "#86868b",
                          padding: "20px",
                        }}
                      >
                        No hay bodegas operativas autorizadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Panel Control Paginacion Locales */}
            <div className={styles.paginacionContainer}>
              <div className={styles.paginacionMeta}>
                Mostrando <strong>{inicioRegistroLocales}</strong> al{" "}
                <strong>{finRegistroLocales}</strong> de{" "}
                <strong>{model.localesConfig?.length || 0}</strong> registros
              </div>
              <div className={styles.paginacionControles}>
                <div className={styles.rowsSelectorWrapper}>
                  <select
                    value={rowsPerPageLocales}
                    onChange={(e) => {
                      setRowsPerPageLocales(Number(e.target.value));
                      setCurrentPageLocales(1);
                    }}
                  >
                    <option value={10}>10 Filas</option>
                    <option value={25}>25 Filas</option>
                    <option value={50}>50 Filas</option>
                  </select>
                </div>
                <div className={styles.paginacionBotonera}>
                  <button
                    type="button"
                    onClick={() => setCurrentPageLocales(1)}
                    disabled={currentPageLocales === 1}
                  >
                    <FontAwesomeIcon icon={faAngleDoubleLeft} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPageLocales((p) => Math.max(p - 1, 1))
                    }
                    disabled={currentPageLocales === 1}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <span className={styles.paginacionLabel}>
                    Pagina {currentPageLocales} de {totalPagesLocales || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPageLocales((p) =>
                        Math.min(p + 1, totalPagesLocales),
                      )
                    }
                    disabled={
                      currentPageLocales === totalPagesLocales ||
                      totalPagesLocales === 0
                    }
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPageLocales(totalPagesLocales)}
                    disabled={
                      currentPageLocales === totalPagesLocales ||
                      totalPagesLocales === 0
                    }
                  >
                    <FontAwesomeIcon icon={faAngleDoubleRight} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TabParametrizacion.displayName = "TabParametrizacion";
export default TabParametrizacion;
