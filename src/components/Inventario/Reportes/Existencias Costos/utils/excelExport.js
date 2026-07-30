import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { EXCEL_PALETTE } from "./constants";
import logoImage from "../../../../../assets/images/logo.png";

/**
 * Genera y descarga el reporte analitico en Excel soportando
 * tanto el modo de mes unico (26 cols) como multi-lapso consolidado (12 cols).
 */
export const exportarExistenciasCostosExcel = async (
  reporteData,
  etiquetaPeriodo,
  esMultiLapso = false,
) => {
  if (!reporteData || reporteData.length === 0) return false;

  // Deteccion defensiva de estructura reducida multi-lapso
  const esReducido =
    esMultiLapso ||
    (reporteData.length > 0 &&
      reporteData[0].precio_venta === undefined &&
      reporteData[0].costo_final === undefined);

  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Existencias y Costos");

  const totalColumnas = esReducido ? 12 : 26;
  const fechaActualStr = new Date().toLocaleDateString("es-CO");

  const columnasCompleta = [
    "Sede",
    "Local",
    "Grupo 1",
    "Linea 1",
    "Linea 2",
    "Linea 3",
    "Criterio",
    "Item",
    "Descripcion",
    "Proveedor",
    "Fecha Ultima Compra",
    "Precio Venta",
    "Existencia Final",
    "Costo Final",
    "Cantidad Vendida",
    "Valor Ventas",
    "Cantidad Venta Mes Anterior",
    "Valor Venta Mes Anterior",
    "Cantidad Vendida Ayer",
    "Valor Ventas Ayer",
    "Cantidad Promedio 4M",
    "Valor Promedio 4M",
    "Consumo Promedio",
    "Dias Promedio",
    "Valor Exceso",
    "Clasificacion ABC",
  ];

  const columnasReducida = [
    "Sede",
    "Local",
    "Grupo 1",
    "Linea 1",
    "Linea 2",
    "Linea 3",
    "Criterio",
    "Item",
    "Descripcion",
    "Proveedor",
    "Cantidad Vendida",
    "Valor Venta",
  ];

  const columnas = esReducido ? columnasReducida : columnasCompleta;

  // ---------- 1. ESCANER DINAMICO DE ANCHOS DE COLUMNA ----------
  const columnasConfiguradas = columnas.map((col, i) => {
    let longitudMaxima = col.length;

    reporteData.forEach((item) => {
      const valoresFila = esReducido
        ? [
            item.sede,
            item.local,
            item.grupo1,
            item.linea1,
            item.linea2,
            item.linea3,
            item.criterio,
            item.item,
            item.descripcion,
            item.proveedor,
            item.cantidad_vendida,
            item.valor_ventas,
          ]
        : [
            item.sede,
            item.local,
            item.grupo1,
            item.linea1,
            item.linea2,
            item.linea3,
            item.criterio,
            item.item,
            item.descripcion,
            item.proveedor,
            item.fecha_ultima_compra,
            item.precio_venta,
            item.existencia_final,
            item.costo_final,
            item.cantidad_vendida,
            item.valor_ventas,
            item.cantidad_vendida_mes_anterior,
            item.valor_ventas_mes_anterior,
            item.cantidad_vendida_ayer,
            item.valor_ventas_ayer,
            item.cantidad_promedio_4m,
            item.valor_promedio_4m,
            item.consumo_promedio,
            item.dias_promedio,
            item.valor_exceso,
            item.clasificacion_abc,
          ];

      const valorStr =
        valoresFila[i] !== undefined && valoresFila[i] !== null
          ? valoresFila[i].toString()
          : "";
      if (valorStr.length > longitudMaxima) {
        longitudMaxima = valorStr.length;
      }
    });

    return {
      width: Math.min(Math.max(longitudMaxima + 4, 12), 55),
    };
  });

  columnasConfiguradas.forEach((colCfg, index) => {
    hoja.getColumn(index + 1).width = colCfg.width;
  });

  // ---------- 2. ESTILOS DEL BANNER CORPORATIVO ----------
  hoja.getRow(1).height = 25;
  hoja.getRow(2).height = 20;
  hoja.getRow(3).height = 20;
  hoja.getRow(4).height = 20;
  hoja.getRow(5).height = 15;

  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= totalColumnas; c++) {
      const celdaFondo = hoja.getCell(r, c);
      celdaFondo.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F9F6" },
      };
      if (r === 4) {
        celdaFondo.border = {
          bottom: { style: "thick", color: { argb: "FF009B6D" } },
        };
      }
    }
  }

  // ---------- 3. LOGO INSTITUCIONAL ----------
  const factorEscala = 0.7;
  const anchoColumnaA = hoja.getColumn(1).width || 15;
  const anchoColumnaB = hoja.getColumn(2).width || 15;

  const altoFijoLogoPx = 110 * factorEscala;
  const relacionAspectoOriginal = 2.4;
  const anchoLogoDeseadoPx = altoFijoLogoPx * relacionAspectoOriginal;

  const anchoAPx = anchoColumnaA * 7.25 + 12;
  const anchoBPx = anchoColumnaB * 7.25 + 12;
  const paddingIzquierdoPx = 0.15 * anchoAPx;
  const pixelFinNecesario = paddingIzquierdoPx + anchoLogoDeseadoPx;

  let colFinFloating = 1.0;
  let rangoFinLogoCol = 1;

  if (pixelFinNecesario <= anchoAPx) {
    rangoFinLogoCol = 1;
    colFinFloating = pixelFinNecesario / anchoAPx;
  } else {
    rangoFinLogoCol = 2;
    for (let f = 1; f <= 4; f++) {
      hoja.mergeCells(f, 1, f, 2);
    }
    const pixelesRestantesEnB = pixelFinNecesario - anchoAPx;
    colFinFloating = 1.0 + pixelesRestantesEnB / anchoBPx;
  }

  try {
    const logoResponse = await fetch(logoImage);
    const arrayBuffer = await logoResponse.arrayBuffer();
    const logoId = libro.addImage({
      buffer: arrayBuffer,
      extension: "png",
    });
    hoja.addImage(logoId, {
      tl: { col: 0.15, row: 0.5 },
      br: { col: colFinFloating, row: 2.9 },
      editAs: "oneCell",
    });
  } catch (error) {
    console.error("No se logro cargar el logotipo institucional:", error);
  }

  // ---------- 4. ENCABEZADO METADATA ----------
  const colInicioTexto = rangoFinLogoCol + 1;
  for (let i = 1; i <= 4; i++) {
    if (colInicioTexto < totalColumnas) {
      hoja.mergeCells(i, colInicioTexto, i, totalColumnas);
    }
  }

  const cellTitulo = hoja.getCell(1, colInicioTexto);
  cellTitulo.value = "SUPERMERCADO BELALCAZAR - ABASTECEMOS DE OCCIDENTE S.A.S";
  cellTitulo.font = {
    name: "Arial",
    size: 15,
    bold: true,
    color: { argb: "FF009B6D" },
  };
  cellTitulo.alignment = { vertical: "middle", horizontal: "left" };

  const cellSubtitulo = hoja.getCell(2, colInicioTexto);
  cellSubtitulo.value = esReducido
    ? "REPORTE CONSOLIDADO MULTI-PERIODO DE VENTAS Y EXISTENCIAS"
    : "REPORTE GLOBAL DE EXISTENCIAS Y COSTOS";
  cellSubtitulo.font = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: "FF404040" },
  };
  cellSubtitulo.alignment = { vertical: "middle", horizontal: "left" };

  const cellDoc = hoja.getCell(3, colInicioTexto);
  cellDoc.value = `Documento: ${
    esReducido ? "Consolidado Multi-Lapso" : "Balance Analitico ABC"
  } | Periodos: ${etiquetaPeriodo}`;
  cellDoc.font = {
    name: "Arial",
    size: 10.5,
    bold: true,
    color: { argb: "FF202020" },
  };
  cellDoc.alignment = { vertical: "middle", horizontal: "left" };

  const cellFechas = hoja.getCell(4, colInicioTexto);
  cellFechas.value = `Corte: Consolidado Activo  |  Extraccion: ${fechaActualStr}`;
  cellFechas.font = {
    name: "Arial",
    size: 9.5,
    italic: true,
    color: { argb: "FF606060" },
  };
  cellFechas.alignment = { vertical: "middle", horizontal: "left" };

  // ---------- 5. ENCABEZADOS DE LA TABLA (FILA 6) ----------
  const filaEncabezados = hoja.getRow(6);
  filaEncabezados.values = columnas;
  filaEncabezados.height = 28;

  filaEncabezados.eachCell((celda) => {
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_PALETTE.GREEN_HEADER || "FF009B6D" },
    };
    celda.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 10,
      name: "Arial",
    };
    celda.border = {
      top: { style: "thin", color: { argb: "FFBFBFBF" } },
      left: { style: "thin", color: { argb: "FFBFBFBF" } },
      bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
      right: { style: "thin", color: { argb: "FFBFBFBF" } },
    };
    celda.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  // ---------- 6. CUERPO DE DATOS (FILA 7 EN ADELANTE) ----------
  const estiloCellCuerpo = {
    font: { name: "Arial", size: 9.5 },
    border: {
      top: { style: "thin", color: { argb: "FFE7E6E6" } },
      left: { style: "thin", color: { argb: "FFE7E6E6" } },
      bottom: { style: "thin", color: { argb: "FFE7E6E6" } },
      right: { style: "thin", color: { argb: "FFE7E6E6" } },
    },
    alignment: { vertical: "middle" },
  };

  reporteData.forEach((item) => {
    const valoresFila = esReducido
      ? [
          item.sede,
          item.local,
          item.grupo1,
          item.linea1,
          item.linea2,
          item.linea3,
          item.criterio,
          item.item,
          item.descripcion,
          item.proveedor,
          Number(item.cantidad_vendida || 0),
          Number(item.valor_ventas || 0),
        ]
      : [
          item.sede,
          item.local,
          item.grupo1,
          item.linea1,
          item.linea2,
          item.linea3,
          item.criterio,
          item.item,
          item.descripcion,
          item.proveedor,
          item.fecha_ultima_compra,
          Number(item.precio_venta || 0),
          Number(item.existencia_final || 0),
          Number(item.costo_final || 0),
          Number(item.cantidad_vendida || 0),
          Number(item.valor_ventas || 0),
          Number(item.cantidad_vendida_mes_anterior || 0),
          Number(item.valor_ventas_mes_anterior || 0),
          Number(item.cantidad_vendida_ayer || 0),
          Number(item.valor_ventas_ayer || 0),
          Number(item.cantidad_promedio_4m || 0),
          Number(item.valor_promedio_4m || 0),
          Number(item.consumo_promedio || 0),
          Number(item.dias_promedio || 0),
          Number(item.valor_exceso || 0),
          item.clasificacion_abc,
        ];

    const nuevaFila = hoja.addRow(valoresFila);
    nuevaFila.height = 20;

    nuevaFila.eachCell((celda) => {
      celda.font = estiloCellCuerpo.font;
      celda.border = estiloCellCuerpo.border;
      celda.alignment = estiloCellCuerpo.alignment;
    });

    if (esReducido) {
      [1, 2, 4, 5, 6, 7, 8].forEach((colIdx) => {
        nuevaFila.getCell(colIdx).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });

      const cellCant = nuevaFila.getCell(11);
      cellCant.numFmt = "#,##0.00";
      cellCant.alignment = { horizontal: "right", vertical: "middle" };

      const cellVlr = nuevaFila.getCell(12);
      cellVlr.numFmt = "$#,##0.00";
      cellVlr.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      [1, 2, 4, 5, 6, 7, 8, 11, 26].forEach((colIdx) => {
        nuevaFila.getCell(colIdx).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });

      const colsMoneda = [12, 14, 16, 18, 20, 22, 25];
      const colsEnteros = [13, 15, 17, 19, 21, 23, 24];

      colsMoneda.forEach((c) => {
        const cell = nuevaFila.getCell(c);
        cell.numFmt = "$#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      });

      colsEnteros.forEach((c) => {
        const cell = nuevaFila.getCell(c);
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      });

      if (Number(item.valor_exceso || 0) > 0) {
        nuevaFila.getCell(25).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXCEL_PALETTE.EXCESS_ALERT || "FFFDE2E2" },
        };
      }
    }
  });

  // ---------- 7. AUTO-FILTROS Y CONGELAMIENTO DE PANELES ----------
  if (!hoja.empty) {
    hoja.autoFilter = {
      from: { row: 6, column: 1 },
      to: { row: 6, column: totalColumnas },
    };
  }

  hoja.views = [
    {
      state: "frozen",
      xSplit: 2,
      ySplit: 6,
      topLeftCell: "C7",
      activePane: "bottomRight",
    },
  ];

  // ---------- 8. DESPACHO DE DESCARGA ----------
  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const nombreArchivo = esReducido
    ? `existencias_costos_multilapso_${fechaActualStr.replace(/\//g, "")}.xlsx`
    : `existencias_costos_${String(etiquetaPeriodo).replace("-", "")}.xlsx`;

  saveAs(blob, nombreArchivo);
  return true;
};
