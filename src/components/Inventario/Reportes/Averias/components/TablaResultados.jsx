import React, { useRef, useState } from "react";
import styles from "../ExistenciasAverias.module.css";
import { COLUMNAS_TABLA } from "../utils/constants";

import BarraFiltrosDropdowns from "./BarraFiltrosDropdowns";
import EncabezadoTabla from "./EncabezadoTabla";
import FilaTabla from "./FilaTabla";
import Paginacion from "./Paginacion";

import { useFiltrosTabla } from "../hooks/useFiltrosTabla";
import { useSortPaginacion } from "../hooks/useSortPaginacion";

// Importaciones del EmptyState global e iconos
import EmptyState from "../../../../UI/EmptyState";
import { faBuilding, faSearch } from "@fortawesome/free-solid-svg-icons";

const TablaResultados = ({ datos }) => {
  const containerRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const filtrosTabla = useFiltrosTabla({ datos, containerRef });

  const { fragmentoDatos, pagina, totalPaginas, cambiarPagina } =
    useSortPaginacion({
      datos,
      filtros: filtrosTabla.filtros,
      sortConfig,
    });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      // Se quitaron las barras invertidas de escape en "asc" y "desc"
      const direction =
        prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction };
    });
  };

  // 1. Estado vacío inicial (cuando entras a la pantalla y datos viene null o vacío)
  if (!datos || datos.length === 0) {
    return (
      <EmptyState
        icon={faBuilding}
        title="Aún no hay reportes generados"
        description="No se registran datos para mostrar. Modifique las variables de entrada e inicie la consulta."
      />
    );
  }

  return (
    <div className={styles.contenedorTablaMaestra} ref={containerRef}>
      <BarraFiltrosDropdowns
        {...filtrosTabla}
        onBusquedaChange={filtrosTabla.handleBusquedaChange}
      />

      <div className={styles.tablaResponsivaWrapper}>
        <table>
          <EncabezadoTabla sortConfig={sortConfig} onSort={handleSort} />
          <tbody>
            {fragmentoDatos.length > 0 ? (
              fragmentoDatos.map((item, index) => (
                <FilaTabla key={`${item.item}-${index}`} item={item} />
              ))
            ) : (
              /* 2. Estado vacío interno (cuando se filtra la tabla con la barra de texto y no hay coincidencias) */
              <tr>
                <td colSpan={COLUMNAS_TABLA.length} style={{ padding: "0px" }}>
                  <EmptyState
                    icon={faSearch}
                    title="Sin coincidencias"
                    description={`No se encontraron registros que coincidan con la búsqueda "${filtrosTabla.filtros.busqueda}". Intente con otros filtros.`}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion
        pagina={pagina}
        totalPaginas={totalPaginas}
        onCambioPagina={cambiarPagina}
      />
    </div>
  );
};

export default TablaResultados;
