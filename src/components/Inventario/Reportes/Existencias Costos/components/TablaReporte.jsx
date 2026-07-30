import React, { useMemo } from "react";
import styles from "../ExistenciasCostos.module.css";
import EmptyState from "../../../../UI/EmptyState";
import {
  faBuilding,
  faSort,
  faSortUp,
  faSortDown,
  faChevronLeft,
  faChevronRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TablaReporte = React.memo(({ model }) => {
  const {
    dataPaginada,
    dataProcesada,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    sortConfig,
    handleSort,
  } = model;

  // Deteccion automatica de reporte reducido (Multi-Lapso)
  const esReducido = useMemo(() => {
    if (model?.esMultiLapso) return true;
    if (!model?.reporteData || model.reporteData.length === 0) return false;
    const primerRegistro = model.reporteData[0];
    return (
      primerRegistro.precio_venta === undefined &&
      primerRegistro.costo_final === undefined
    );
  }, [model?.esMultiLapso, model?.reporteData]);

  if (!model.reporteData || model.reporteData.length === 0) {
    return (
      <EmptyState
        icon={faBuilding}
        title="Sin balances para mostrar"
        description="Fije un periodo contable valido para procesar el inventario."
      />
    );
  }

  if (dataProcesada.length === 0) {
    return (
      <EmptyState
        icon={faBuilding}
        title="Sin resultados en filtros"
        description="No se hallaron coincidencias para los criterios de busqueda aplicados."
      />
    );
  }

  const getAbcBadge = (abc) => {
    if (abc === "A") return styles.badgeA;
    if (abc === "B") return styles.badgeB;
    return styles.badgeC;
  };

  const formatFecha = (rawDate) => {
    if (!rawDate || String(rawDate).length !== 8) return rawDate;
    const str = String(rawDate);
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  };

  const totalPages = Math.ceil(dataProcesada.length / rowsPerPage);
  const inicioRegistro = (currentPage - 1) * rowsPerPage + 1;
  const finRegistro = Math.min(currentPage * rowsPerPage, dataProcesada.length);

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FontAwesomeIcon icon={faSort} className={styles.iconSortMuted} />;
    }
    return sortConfig.direction === "asc" ? (
      <FontAwesomeIcon icon={faSortUp} className={styles.iconSortActive} />
    ) : (
      <FontAwesomeIcon icon={faSortDown} className={styles.iconSortActive} />
    );
  };

  return (
    <div className={styles.contenedorTablaMaestra}>
      <div className={styles.tablaResponsivaWrapper}>
        <table className={styles.tablaConfig} style={{ fontSize: "0.78rem" }}>
          <thead>
            <tr
              style={{
                backgroundColor: "#f5f5f7",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <th
                onClick={() => handleSort("sede")}
                className={styles.thSortable}
              >
                Sede {renderSortIcon("sede")}
              </th>
              <th
                onClick={() => handleSort("local")}
                className={styles.thSortable}
              >
                Local {renderSortIcon("local")}
              </th>
              <th
                onClick={() => handleSort("grupo1")}
                className={styles.thSortable}
              >
                Grupo 1 {renderSortIcon("grupo1")}
              </th>
              <th
                onClick={() => handleSort("linea1")}
                className={styles.thSortable}
              >
                Linea 1 {renderSortIcon("linea1")}
              </th>
              <th
                onClick={() => handleSort("linea2")}
                className={styles.thSortable}
              >
                Linea 2 {renderSortIcon("linea2")}
              </th>
              <th
                onClick={() => handleSort("linea3")}
                className={styles.thSortable}
              >
                Linea 3 {renderSortIcon("linea3")}
              </th>
              <th
                onClick={() => handleSort("criterio")}
                className={styles.thSortable}
              >
                Criterio {renderSortIcon("criterio")}
              </th>
              <th
                onClick={() => handleSort("item")}
                className={styles.thSortable}
              >
                Item {renderSortIcon("item")}
              </th>
              <th
                onClick={() => handleSort("descripcion")}
                className={styles.thSortable}
              >
                Descripcion {renderSortIcon("descripcion")}
              </th>
              <th
                onClick={() => handleSort("proveedor")}
                className={styles.thSortable}
              >
                Proveedor {renderSortIcon("proveedor")}
              </th>

              {esReducido ? (
                /* Columnas Exclusivas para Reporte Multi-Lapso */
                <>
                  <th
                    onClick={() => handleSort("cantidad_vendida")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Cant. Vendida {renderSortIcon("cantidad_vendida")}
                  </th>
                  <th
                    onClick={() => handleSort("valor_ventas")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Valor Ventas {renderSortIcon("valor_ventas")}
                  </th>
                </>
              ) : (
                /* Columnas Completas de Reporte Mes Unico */
                <>
                  <th
                    onClick={() => handleSort("fecha_ultima_compra")}
                    className={styles.thSortable}
                  >
                    Ult. Compra {renderSortIcon("fecha_ultima_compra")}
                  </th>
                  <th
                    onClick={() => handleSort("precio_venta")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Precio Venta {renderSortIcon("precio_venta")}
                  </th>
                  <th
                    onClick={() => handleSort("existencia_final")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Exist. Final {renderSortIcon("existencia_final")}
                  </th>
                  <th
                    onClick={() => handleSort("costo_final")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Costo Final {renderSortIcon("costo_final")}
                  </th>
                  <th
                    onClick={() => handleSort("cantidad_vendida_ayer")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Cant. Ayer {renderSortIcon("cantidad_vendida_ayer")}
                  </th>
                  <th
                    onClick={() => handleSort("valor_ventas_ayer")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Vlr. Ayer {renderSortIcon("valor_ventas_ayer")}
                  </th>
                  <th
                    onClick={() => handleSort("cantidad_vendida")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Cant. Mes {renderSortIcon("cantidad_vendida")}
                  </th>
                  <th
                    onClick={() => handleSort("valor_ventas")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Vlr. Mes {renderSortIcon("valor_ventas")}
                  </th>
                  <th
                    onClick={() => handleSort("cantidad_vendida_mes_anterior")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Cant. Mes Ant.{" "}
                    {renderSortIcon("cantidad_vendida_mes_anterior")}
                  </th>
                  <th
                    onClick={() => handleSort("valor_ventas_mes_anterior")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Vlr. Mes Ant. {renderSortIcon("valor_ventas_mes_anterior")}
                  </th>
                  <th
                    onClick={() => handleSort("cantidad_promedio_4m")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Cant. Prom 4M {renderSortIcon("cantidad_promedio_4m")}
                  </th>
                  <th
                    onClick={() => handleSort("valor_promedio_4m")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Vlr. Prom 4M {renderSortIcon("valor_promedio_4m")}
                  </th>
                  <th
                    onClick={() => handleSort("consumo_promedio")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Consumo Prom. {renderSortIcon("consumo_promedio")}
                  </th>
                  <th
                    onClick={() => handleSort("dias_promedio")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Dias Inv. {renderSortIcon("dias_promedio")}
                  </th>
                  <th
                    onClick={() => handleSort("valor_exceso")}
                    className={`${styles.numeroAlineado} ${styles.thSortable}`}
                  >
                    Valor Exceso {renderSortIcon("valor_exceso")}
                  </th>
                  <th
                    onClick={() => handleSort("clasificacion_abc")}
                    className={styles.thSortable}
                    style={{ textAlign: "center" }}
                  >
                    ABC {renderSortIcon("clasificacion_abc")}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {dataPaginada.map((item, idx) => (
              <tr key={`${item.item}-${item.local}-${idx}`}>
                <td>{item.sede}</td>
                <td>{item.local}</td>
                <td style={{ whiteSpace: "nowrap" }}>{item.grupo1}</td>
                <td style={{ whiteSpace: "nowrap" }}>{item.linea1}</td>
                <td style={{ whiteSpace: "nowrap" }}>{item.linea2}</td>
                <td style={{ whiteSpace: "nowrap" }}>{item.linea3}</td>
                <td>{item.criterio}</td>
                <td style={{ fontWeight: "600" }}>{item.item}</td>
                <td style={{ minWidth: "220px" }}>{item.descripcion}</td>
                <td style={{ whiteSpace: "nowrap" }}>{item.proveedor}</td>

                {esReducido ? (
                  /* Celda Multi-Lapso: Solo Cantidad y Valor Ventas */
                  <>
                    <td className={styles.numeroAlineado}>
                      {Number(item.cantidad_vendida || 0).toLocaleString(
                        "es-CO",
                        {
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>
                    <td className={styles.numeroAlineado}>
                      $
                      {Number(item.valor_ventas || 0).toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </>
                ) : (
                  /* Celdas Completas Mes Unico */
                  <>
                    <td>{formatFecha(item.fecha_ultima_compra)}</td>
                    <td className={styles.numeroAlineado}>
                      $
                      {Number(item.precio_venta || 0).toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className={styles.numeroAlineado}>
                      {Number(item.existencia_final || 0).toLocaleString(
                        "es-CO",
                      )}
                    </td>
                    <td className={styles.numeroAlineado}>
                      $
                      {Number(item.costo_final || 0).toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className={styles.numeroAlineado}>
                      {Number(item.cantidad_vendida_ayer || 0).toLocaleString(
                        "es-CO",
                      )}
                    </td>
                    <td className={styles.numeroAlineado}>
                      $
                      {Number(item.valor_ventas_ayer || 0).toLocaleString(
                        "es-CO",
                        {
                          minimumFractionDigits: 2,
                        },
                      )}
                    </td>
                    <td className={styles.numeroAlineado}>
                      {Number(item.cantidad_vendida || 0).toLocaleString(
                        "es-CO",
                      )}
                    </td>
                    <td className={styles.numeroAlineado}>
                      $
                      {Number(item.valor_ventas || 0).toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className={styles.numeroAlineado}>
                      {Number(
                        item.cantidad_vendida_mes_anterior || 0,
                      ).toLocaleString("es-CO")}
                    </td>
                    <td className={styles.numeroAlineado}>
                      $
                      {Number(
                        item.valor_ventas_mes_anterior || 0,
                      ).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className={styles.numeroAlineado}>
                      {Number(item.cantidad_promedio_4m || 0).toLocaleString(
                        "es-CO",
                        {
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>
                    <td className={styles.numeroAlineado}>
                      $
                      {Number(item.valor_promedio_4m || 0).toLocaleString(
                        "es-CO",
                        {
                          minimumFractionDigits: 2,
                        },
                      )}
                    </td>
                    <td className={styles.numeroAlineado}>
                      {Number(item.consumo_promedio || 0).toLocaleString(
                        "es-CO",
                        {
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>
                    <td
                      className={styles.numeroAlineado}
                      style={{ fontWeight: "600" }}
                    >
                      {Math.round(Number(item.dias_promedio || 0))} d
                    </td>
                    <td
                      className={styles.numeroAlineado}
                      style={{
                        color:
                          Number(item.valor_exceso || 0) > 0
                            ? "#b91c1c"
                            : "inherit",
                      }}
                    >
                      $
                      {Number(item.valor_exceso || 0).toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={getAbcBadge(item.clasificacion_abc)}>
                        {item.clasificacion_abc}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Control de Paginacion */}
      <div className={styles.paginacionContainer}>
        <div className={styles.paginacionMeta}>
          Mostrando <strong>{inicioRegistro}</strong> al{" "}
          <strong>{finRegistro}</strong> de{" "}
          <strong>{dataProcesada.length}</strong> registros
          {dataProcesada.length !== model.reporteData.length &&
            ` (filtrados de ${model.reporteData.length})`}
        </div>

        <div className={styles.paginacionControles}>
          <div className={styles.rowsSelectorWrapper}>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value={25}>25 Filas</option>
              <option value={50}>50 Filas</option>
              <option value={100}>100 Filas</option>
              <option value={200}>200 Filas</option>
            </select>
          </div>

          <div className={styles.paginacionBotonera}>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            <span className={styles.paginacionLabel}>
              Pagina {currentPage} de {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <FontAwesomeIcon icon={faAngleDoubleRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

TablaReporte.displayName = "TablaReporte";
export default TablaReporte;
