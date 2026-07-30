import React, { useState, useRef, useEffect } from "react";
import styles from "../ExistenciasCostos.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faSearch,
  faStore,
  faFilter,
  faFont,
  faChevronDown,
  faLayerGroup,
  faPlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const ExistenciasCostosToolbar = React.memo(
  ({
    lapsoCalendario,
    setLapsoCalendario,
    localSeleccionado,
    setLocalSeleccionado,
    onConsultar,
    searchTerm,
    setSearchTerm,
    abcFilter,
    setAbcFilter,
    hayDatos,
    localesConfig = [],
    esMultiLapso = false,
    setEsMultiLapso = () => {},
    lapsosSeleccionados = [],
    setLapsosSeleccionados = () => {},
    model = null,
  }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mesInput, setMesInput] = useState("");
    const dropdownRef = useRef(null);

    // Resolucion de valores prioritarios desde model o props directas
    const effEsMultiLapso = model?.esMultiLapso ?? esMultiLapso;
    const effSetEsMultiLapso = model?.setEsMultiLapso ?? setEsMultiLapso;
    const effLapsosSeleccionados =
      model?.lapsosSeleccionados ?? lapsosSeleccionados;
    const effSetLapsosSeleccionados =
      model?.setLapsosSeleccionados ?? setLapsosSeleccionados;
    const effLapsoCalendario = model?.lapsoCalendario ?? lapsoCalendario;
    const effSetLapsoCalendario =
      model?.setLapsoCalendario ?? setLapsoCalendario;
    const effLocalSeleccionado = model?.localSeleccionado ?? localSeleccionado;
    const effSetLocalSeleccionado =
      model?.setLocalSeleccionado ?? setLocalSeleccionado;
    const effLocalesConfig = model?.localesConfig ?? localesConfig;
    const effSearchTerm = model?.searchTerm ?? searchTerm;
    const effSetSearchTerm = model?.setSearchTerm ?? setSearchTerm;
    const effAbcFilter = model?.abcFilter ?? abcFilter;
    const effSetAbcFilter = model?.setAbcFilter ?? setAbcFilter;
    const effHayDatos = model?.reporteData
      ? model.reporteData.length > 0
      : hayDatos;

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCheckboxChange = (codigoLocal) => {
      if (effLocalSeleccionado.includes(codigoLocal)) {
        effSetLocalSeleccionado(
          effLocalSeleccionado.filter((id) => id !== codigoLocal),
        );
      } else {
        effSetLocalSeleccionado([...effLocalSeleccionado, codigoLocal]);
      }
    };

    const handleAgregarLapso = (e) => {
      const valor = e.target.value;
      if (!valor) return;
      if (!effLapsosSeleccionados.includes(valor)) {
        effSetLapsosSeleccionados([...effLapsosSeleccionados, valor]);
      }
      setMesInput("");
    };

    const handleRemoverLapso = (lapsoABorrar) => {
      effSetLapsosSeleccionados(
        effLapsosSeleccionados.filter((lapso) => lapso !== lapsoABorrar),
      );
    };

    const getDropdownLabel = () => {
      if (effLocalSeleccionado.length === 0) {
        return "TODAS LAS BODEGAS PARAMETRIZADAS";
      }
      if (effLocalSeleccionado.length === effLocalesConfig.length) {
        return "TODAS LAS BODEGAS SELECCIONADAS";
      }
      return `${effLocalSeleccionado.length} BODEGAS SELECCIONADAS`;
    };

    return (
      <div className={styles.tarjetaFiltros}>
        {/* Conmutador de Modalidad de Consulta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid #e5e5ea",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: "700",
              color: "#1d1d1f",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Modo de Consulta:
          </span>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: !effEsMultiLapso ? "#009b6d" : "#515154",
            }}
          >
            <input
              type="radio"
              name="modoConsulta"
              checked={!effEsMultiLapso}
              onChange={() => effSetEsMultiLapso(false)}
              style={{ accentColor: "#009b6d", cursor: "pointer" }}
            />
            Un Solo Mes
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: effEsMultiLapso ? "#009b6d" : "#515154",
            }}
          >
            <input
              type="radio"
              name="modoConsulta"
              checked={effEsMultiLapso}
              onChange={() => effSetEsMultiLapso(true)}
              style={{ accentColor: "#009b6d", cursor: "pointer" }}
            />
            Varios Meses (Consolidado)
          </label>
        </div>

        <form
          onSubmit={onConsultar}
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Selector Unico de Mes */}
          {!effEsMultiLapso ? (
            <div className={styles.controlFormulario}>
              <div className={styles.campoFlotante}>
                <input
                  type="month"
                  value={effLapsoCalendario}
                  onChange={(e) => effSetLapsoCalendario(e.target.value)}
                  required
                />
                <label
                  className={effLapsoCalendario ? styles.labelColapsado : ""}
                >
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    style={{ marginRight: "6px" }}
                  />
                  Periodo de Analisis
                </label>
              </div>
            </div>
          ) : (
            /* Selector Multiple / Intermitente de Meses */
            <div
              className={styles.controlFormulario}
              style={{ minWidth: "300px" }}
            >
              <div className={styles.campoFlotante}>
                <input
                  type="month"
                  value={mesInput}
                  onChange={handleAgregarLapso}
                />
                <label className={styles.labelColapsado}>
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    style={{ marginRight: "6px" }}
                  />
                  Seleccionar Meses para Consolidar
                </label>
              </div>
            </div>
          )}

          {/* Selector Multiple de Bodegas / Locales */}
          <div
            className={styles.controlFormulario}
            ref={dropdownRef}
            style={{ position: "relative" }}
          >
            <div className={styles.campoFlotante}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "12px 35px 4px 12px",
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  border: "1px solid #d2d2d7",
                  backgroundColor: "#ffffff",
                  color: "#1d1d1f",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "left",
                  }}
                >
                  {getDropdownLabel()}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{
                    fontSize: "0.75rem",
                    color: "#86868b",
                    marginLeft: "8px",
                  }}
                />
              </div>
              <label className={styles.labelColapsado}>
                <FontAwesomeIcon
                  icon={faStore}
                  style={{ marginRight: "6px" }}
                />
                Sede / Local
              </label>
            </div>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  top: "50px",
                  background: "#ffffff",
                  border: "1px solid #d2d2d7",
                  borderRadius: "8px",
                  zIndex: 110,
                  maxHeight: "260px",
                  overflowY: "auto",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                  padding: "6px 0",
                }}
              >
                <div
                  onClick={() => effSetLocalSeleccionado([])}
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#009b6d",
                    borderBottom: "1px solid #f5f5f7",
                    backgroundColor:
                      effLocalSeleccionado.length === 0
                        ? "#f5f5f7"
                        : "transparent",
                  }}
                >
                  -- LIMPIAR SELECCION (TODAS) --
                </div>
                {effLocalesConfig.map((loc) => {
                  const estaSeleccionado = effLocalSeleccionado.includes(
                    loc.codigo_local,
                  );
                  return (
                    <label
                      key={loc.codigo_local}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        margin: 0,
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        backgroundColor: estaSeleccionado
                          ? "#f2f9f6"
                          : "transparent",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f5f5f7")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = estaSeleccionado
                          ? "#f2f9f6"
                          : "transparent")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={estaSeleccionado}
                        onChange={() => handleCheckboxChange(loc.codigo_local)}
                        style={{
                          accentColor: "#009b6d",
                          width: "14px",
                          height: "14px",
                          cursor: "pointer",
                        }}
                      />
                      <span
                        style={{
                          color: estaSeleccionado ? "#1d1d1f" : "#515154",
                          userSelect: "none",
                        }}
                      >
                        {loc.descripcion} <strong>({loc.codigo_local})</strong>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button type="submit" className={styles.btnBuscarDatos}>
            <FontAwesomeIcon icon={faSearch} /> Consultar
          </button>
        </form>

        {/* Visor de chips de periodos seleccionados en multi-lapso */}
        {effEsMultiLapso && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px dashed #e5e5ea",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: "600",
                color: "#6e6e73",
              }}
            >
              Meses en consulta ({effLapsosSeleccionados.length}):
            </span>
            {effLapsosSeleccionados.length === 0 ? (
              <span
                style={{ fontSize: "0.78rem", color: "#86868b", italic: true }}
              >
                Seleccione uno o mas meses en el control de arriba
              </span>
            ) : (
              effLapsosSeleccionados.map((lap) => (
                <span
                  key={lap}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#e8f5e9",
                    color: "#009b6d",
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    border: "1px solid #c8e6c9",
                  }}
                >
                  {lap}
                  <FontAwesomeIcon
                    icon={faTimes}
                    onClick={() => handleRemoverLapso(lap)}
                    style={{
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      color: "#2e7d32",
                    }}
                  />
                </span>
              ))
            )}
            {effLapsosSeleccionados.length > 0 && (
              <button
                type="button"
                onClick={() => effSetLapsosSeleccionados([])}
                style={{
                  background: "none",
                  border: "none",
                  color: "#d32f2f",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginLeft: "auto",
                }}
              >
                Limpiar todo
              </button>
            )}
          </div>
        )}

        {/* Subpanel de busqueda y filtrado dinámico */}
        {effHayDatos && (
          <div className={styles.subPanelFiltros}>
            <div className={styles.controlFormulario}>
              <div className={styles.campoFlotante}>
                <input
                  type="text"
                  value={effSearchTerm}
                  onChange={(e) => effSetSearchTerm(e.target.value)}
                  placeholder="Buscar por item, descripcion, proveedor..."
                />
                <label className={effSearchTerm ? styles.labelColapsado : ""}>
                  <FontAwesomeIcon
                    icon={faFont}
                    style={{ marginRight: "6px" }}
                  />
                  Busqueda Global
                </label>
              </div>
            </div>

            {!effEsMultiLapso && (
              <div
                className={styles.controlFormulario}
                style={{ maxWidth: "220px" }}
              >
                <div className={styles.campoFlotante}>
                  <select
                    value={effAbcFilter}
                    onChange={(e) => effSetAbcFilter(e.target.value)}
                  >
                    <option value="">Todos los cuadrantes</option>
                    <option value="A">Clasificacion A (80% Rotacion)</option>
                    <option value="B">Clasificacion B (15% Rotacion)</option>
                    <option value="C">Clasificacion C (5% Rotacion)</option>
                  </select>
                  <label className={styles.labelColapsado}>
                    <FontAwesomeIcon
                      icon={faFilter}
                      style={{ marginRight: "6px" }}
                    />
                    Filtrar ABC
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

ExistenciasCostosToolbar.displayName = "ExistenciasCostosToolbar";
export default ExistenciasCostosToolbar;
