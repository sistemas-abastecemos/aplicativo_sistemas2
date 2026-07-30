import {
  request as originalRequest,
  buildHeaders as originalBuildHeaders,
  buildUrl,
  getToken,
  readTextAsJson,
  unwrapResultado,
  fetchWithTimeout,
  runResultadoReport,
} from "../utils/http/index.js";

/**
 * Wrapper local de buildHeaders para api.js.
 * Sobreescribe cualquier configuracion previa y fuerza auth: "required"
 * de manera estricta en todas las peticiones del modulo.
 */
const buildHeaders = (options = {}) => {
  return originalBuildHeaders({
    ...options,
    auth: "required",
  });
};

/**
 * Wrapper local de request para api.js.
 * Asegura que todas las peticiones procesadas por este metodo
 * lleven de forma obligatoria el parametro auth: "required".
 */
const request = (url, options = {}) => {
  return originalRequest(url, {
    ...options,
    auth: "required",
  });
};

export const apiService = {
  /////////////////////////////
  /////// AUTENTICACION ///////
  /////////////////////////////

  async login(credentials) {
    const response = await fetch(buildUrl("/login.php"), {
      method: "POST",
      headers: buildHeaders({ auth: "none", accept: true }),
      body: JSON.stringify({
        login: credentials.login,
        password: credentials.password,
      }),
    });

    const data = await readTextAsJson(response);

    if (response.status === 401) {
      return {
        success: false,
        message: data.message || "Usuario o contrasena incorrectos",
      };
    }
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    return data;
  },

  async loginMicrosoft(code, redirectUri) {
    const response = await fetch(buildUrl("/login_microsoft.php"), {
      method: "POST",
      headers: buildHeaders({ auth: "none", accept: true }),
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    const data = await readTextAsJson(response, {
      invalidMessage: `El servidor no devolvio un JSON valido. Codigo: ${response.status}`,
    });

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Error en la autenticacion corporativa",
      };
    }
    return data;
  },

  async forgotPassword({ usuario }) {
    const response = await fetch(buildUrl("/forgot_password.php"), {
      method: "POST",
      headers: buildHeaders({ auth: "none", accept: true }),
      body: JSON.stringify({ usuario }),
    });

    const data = await readTextAsJson(response, {
      emptyMessage: "El servidor no devolvio respuesta",
    });

    if (!response.ok) {
      throw new Error(data.message || "Error al enviar recuperacion");
    }
    return data;
  },

  async logout(token) {
    const response = await fetch(buildUrl("/logout.php"), {
      method: "POST",
      headers: buildHeaders({ auth: "arg", tokenArg: token }),
      body: JSON.stringify({ token }), // Enviar el token en el body por si falla el header
    });

    const data = await readTextAsJson(response);
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    return data;
  },

  async verifyToken(token) {
    const response = await fetch(buildUrl("/verify_token.php"), {
      method: "POST",
      headers: buildHeaders({ auth: "arg", tokenArg: token }),
    });

    const data = await readTextAsJson(response);
    if (!response.ok) {
      throw new Error(data.message || "Token invalido");
    }
    return data;
  },

  async validateAccess(data) {
    return request("/middlewares/validate_access.php", {
      method: "POST",
      body: data,
      okBeforeParse: true,
      okErrorMessage: (status) => `Error HTTP: ${status}`,
      check: "none",
    });
  },

  async getLogs(page = 1, por_pagina = 20, filters = {}) {
    return request("/sistemas/logs/get_logs.php", {
      method: "GET",
      params: { pagina: page, por_pagina, ...filters },
      auth: "optional",
      check: "ok+success",
      errorMessage: "Error obteniendo registros del sistema",
    });
  },

  //////////////
  // SEDES /////
  //////////////

  async getSedes(onlyActive = true) {
    return request(`/sedes/get_sedes.php?onlyActive=${onlyActive}`, {
      auth: "required",
      contentTypeJson: false,
      errorMessage: "Error obteniendo sedes",
      unwrap: "data",
    });
  },

  async updateSede(id, payload) {
    return request("/sedes/update_sede.php", {
      method: "PUT",
      body: { ...payload, id },
      errorMessage: "Error actualizando la sede",
      unwrap: "data",
    });
  },

  async createSede(payload) {
    return request("/sedes/create_sede.php", {
      method: "POST",
      body: payload,
      errorMessage: "Error creando la sede",
      unwrap: "data",
    });
  },

  ///////////////////
  ////// AREAS //////
  ///////////////////

  async getAreas(onlyActive = true) {
    return request(`/areas/get_areas.php?onlyActive=${onlyActive}`, {
      auth: "none",
      contentTypeJson: false,
      unwrap: "data",
    });
  },

  async createArea(data) {
    return request("/areas/create_area.php", {
      method: "POST",
      body: data,
    });
  },

  async updateArea(id, data) {
    return request("/areas/update_area.php", {
      method: "PUT",
      body: { id, ...data },
      errorMessage: "Error actualizando la sede",
    });
  },

  ///////////////////////
  /////// CARGOS ////////
  ///////////////////////

  async getCargos(onlyActive = true) {
    return request(`/cargos/get_cargos.php?onlyActive=${onlyActive}`, {
      auth: "none",
      contentTypeJson: false,
      errorMessage: "Error obteniendo cargos",
      unwrap: "data",
    });
  },

  async createCargo(data) {
    return request("/cargos/create_cargo.php", {
      method: "POST",
      body: data,
      errorMessage: "Error creando cargo",
    });
  },

  async updateCargo(id, data) {
    return request("/cargos/update_cargo.php", {
      method: "POST",
      body: { id, ...data },
      errorMessage: "Error actualizando cargo",
    });
  },

  ///////////////////////
  //////// ROLES ////////
  ///////////////////////

  async getRoles() {
    return request("/roles/get_roles.php", {
      auth: "none",
      contentTypeJson: false,
      errorMessage: "Error obteniendo roles",
      unwrap: "data",
    });
  },

  ///////////////////////
  //////// MENUS ////////
  ///////////////////////

  async getMenus() {
    return request("/menu/get_menus.php", {
      requireToken: true,
      contentTypeJson: false,
      statusMessages: { 403: "No tiene permisos para realizar esta accion" },
      errorMessage: "Error obteniendo menus",
    });
  },

  async createMenu(payload) {
    return request("/menu/create_menu.php", {
      method: "POST",
      body: payload,
      requireToken: true,
      statusMessages: { 403: "No tiene permisos para realizar esta accion" },
      errorMessage: "Error creando menu",
    }); // { success: true, id: <nuevo_id> }
  },

  // Actualizar menu (payload igual que create, id pasado por query string)
  async updateMenu(id, payload) {
    if (!id) throw new Error("ID de menu requerido para actualizar");
    return request(`/menu/update_menu.php?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
      requireToken: true,
      statusMessages: { 403: "No tiene permisos para realizar esta accion" },
      errorMessage: "Error actualizando menu",
    });
  },

  async updateMenuBulkOrder(payload) {
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error("El payload debe ser un array valido");
    }
    return request("/menu/update_bulk_order.php", {
      method: "PUT",
      body: payload,
      requireToken: true,
      statusMessages: {
        403: "Privilegios insuficientes para realizar esta operacion",
      },
      errorMessage: "Fallo en el servidor al actualizar ordenamiento",
    });
  },

  ////////////////////////
  /////// USUARIOS ///////
  ////////////////////////

  async getUsuarios(pagina = 1, porPagina = 12, search = "") {
    const params = { pagina, por_pagina: porPagina };
    if (search.trim() !== "") params.search = search.trim();

    return request("/usuarios/get_usuarios.php", {
      params,
      requireToken: true,
      contentTypeJson: false,
      statusMessages: { 403: "No tiene permisos para realizar esta accion" },
      errorMessage: "Error obteniendo usuarios",
      unwrap: "data",
    });
  },

  async updateUsuario(id, data) {
    return request("/usuarios/update_usuario.php", {
      method: "PUT",
      body: { id, ...data },
      errorMessage: "Error actualizando usuario",
    });
  },

  async createUsuario(data) {
    return request("/usuarios/create_usuario.php", {
      method: "POST",
      body: data,
      errorMessage: "Error creando usuario",
    });
  },

  /////////////////////
  // PERFIL USUARIO //
  ////////////////////

  async getPerfilUsuario() {
    return request("/perfil/get_usuario.php", {
      method: "POST",
      errorMessage: "Error obteniendo usuario",
      unwrap: "data",
    });
  },

  async updatePerfilUsuario(payload) {
    return request("/perfil/update_user.php", {
      method: "PUT",
      body: payload,
      errorMessage: "Error en la transaccion",
    });
  },

  ///////////////////////
  ////// UTILIDADES /////
  ///////////////////////

  async getUtilidades(manageMode = false) {
    return request("/v1/private/index.php?action=listar_utilidades", {
      method: "POST",
      body: { manage_mode: manageMode },
      requireToken: true,
      errorMessage: "Error al obtener la lista de utilidades",
    });
  },

  async saveUtilidad(payload) {
    return request("/v1/private/index.php?action=guardar_utilidad", {
      method: "POST",
      body: payload,
      requireToken: true,
      statusMessages: {
        403: "No tiene permisos para gestionar las utilidades del dashboard",
      },
      errorMessage: "Error al guardar la utilidad",
    });
  },

  async deleteUtilidad(id) {
    return request("/v1/private/index.php?action=eliminar_utilidad", {
      method: "POST",
      body: { id },
      requireToken: true,
      statusMessages: {
        403: "No tiene permisos para eliminar accesos directos",
      },
      errorMessage: "Error al eliminar la utilidad",
    });
  },

  //////////////////////////
  /////// PROVEEDORES //////
  //////////////////////////

  async getProveedores(pagina = 1, porPagina = 12, search = "") {
    const params = { pagina, por_pagina: porPagina };
    if (search.trim() !== "") params.search = search.trim();

    return request("/proveedores/get_proveedores.php", {
      params,
      requireToken: true,
      contentTypeJson: false,
      statusMessages: { 403: "No tiene permisos para realizar esta accion" },
      errorMessage: "Error obteniendo proveedores",
      unwrap: "data",
    });
  },

  async getProveedores2() {
    return request("/seguridad/visitantes/get_proveedores.php", {
      errorMessage: "Error obteniendo Proveedores",
      unwrap: "data",
    });
  },

  async updateProveedor(id, data) {
    return request("/proveedores/update_proveedor.php", {
      method: "PUT",
      body: { id, ...data },
      errorMessage: "Error actualizando proveedor",
    });
  },

  async createProveedor(data) {
    return request("/proveedores/create_proveedor.php", {
      method: "POST",
      body: data,
      errorMessage: "Error creando proveedir",
    });
  },

  /////////////////////////
  ////// GENERALES /////////
  /////////////////////////

  async buscarLineasSiesa(termino, empresa = "abastecemos") {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=buscar_lineas_siesa",
      {
        method: "POST",
        body: { termino, empresa },
        check: "ok", // Valida el estado HTTP de la respuesta en lugar de json.success en la raiz
        unwrap: "resultado", // Desempaqueta automaticamente el nodo principal 'resultado'
        errorMessage: "Error consultando lineas de Siesa.",
      },
    );
  },

  async buscarBodegasSiesa(termino, empresa = "abastecemos") {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=buscar_bodegas_siesa",
      {
        method: "POST",
        body: { termino, empresa },
        check: "ok", // Valida el estado HTTP de la respuesta en lugar de json.success en la raiz
        unwrap: "resultado", // Desempaqueta automaticamente el nodo principal 'resultado'
        errorMessage: "Error consultando bodegas de Siesa.",
      },
    );
  },

  /////////////////////////
  ////// INFORMES /////////
  /////////////////////////

  async getInformes() {
    return request("/informes/get_informes.php", {
      requireToken: true,
      contentTypeJson: false,
      statusMessages: { 403: "No tiene permisos" },
      errorMessage: "Error obteniendo informes",
    });
  },

  async createInforme(payload) {
    return request("/informes/create_informe.php", {
      method: "POST",
      body: payload,
      requireToken: true,
      statusMessages: { 403: "No tiene permisos" },
      errorMessage: "Error creando informe",
    });
  },

  async updateInforme(id, payload) {
    if (!id) throw new Error("ID requerido");
    return request(
      `/informes/update_informe.php?id=${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: payload,
        requireToken: true,
        statusMessages: { 403: "No tiene permisos" },
        errorMessage: "Error actualizando informe",
      },
    );
  },

  async updateInformeBulkOrder(payload) {
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error("El payload debe ser un array valido");
    }
    return request("/informes/update_bulk_order.php", {
      method: "PUT",
      body: payload,
      requireToken: true,
      statusMessages: {
        403: "Privilegios insuficientes para realizar esta operacion",
      },
      errorMessage: "Fallo en el servidor al actualizar ordenamiento",
    });
  },

  /////////////////////////////////////////
  // FORMULARIO ACTUALIZACION DE COSTOS //
  /////////////////////////////////////////

  async getSolicitudesActualizacionCostos(idLogin, usuario) {
    return request("/compras/actualizacion_costos/get_solicitudes.php", {
      method: "POST",
      body: { idLogin, usuario },
      errorMessage: "Error obteniendo las solicitudes",
    });
  },

  async getDetalleSolicitudesActualizacionCostos(id_solicitud) {
    return request("/compras/actualizacion_costos/get_detalle_solicitud.php", {
      method: "POST",
      body: { id_solicitud },
      errorMessage: "Error obteniendo los detalles de la solicitud",
    });
  },

  async getTrazabilidadSolicitudesActualizacionCostos(id_solicitud) {
    return request("/compras/actualizacion_costos/get_trazabilidad.php", {
      method: "POST",
      body: { id_solicitud },
      errorMessage: "Error obteniendo la trazabilidad de la solicitud",
    });
  },

  async procesarSolicitud(id_solicitud, login, accion, observaciones) {
    return request("/compras/actualizacion_costos/aprobar_solicitud.php", {
      method: "POST",
      body: {
        id_solicitud,
        login,
        accion,
        observaciones: observaciones.trim(),
      },
      messageKeys: ["error", "message"],
      errorMessage: "Error desconocido al procesar la solicitud",
    });
  },

  async aplicarCambioPrecio(id_solicitud, login, idLogin) {
    return request("/compras/actualizacion_costos/aplicar_cambio_precio.php", {
      method: "POST",
      body: { id_solicitud, login, idLogin },
      messageKeys: ["error", "message"],
      errorMessage: "Error al aplicar el cambio de precio",
    });
  },

  async finalizarProcesoActualizacion(payload) {
    return request("/compras/actualizacion_costos/finalizar_proceso.php", {
      method: "POST",
      body: payload,
      messageKeys: ["error", "message"],
      errorMessage: "Error desconocido al finalizar el proceso",
    });
  },

  /////////////////////////////////////////
  ///// ACTUALIZACION DE INVENTARIO ///////
  /////////////////////////////////////////

  async updateInventario(tipoInventario, formData) {
    return request(
      "/subida_archivos/actualiza_inventarios/update_inventario.php",
      {
        method: "POST",
        body: formData, // FormData: cabecera fijada por el navegador
        requireToken: true,
        okBeforeParse: true,
        okErrorMessage: (status) => `Error HTTP: ${status}`,
        messageKeys: ["error"],
        errorMessage: "Error actualizando inventario",
      },
    );
  },

  ///////////////////////////////////
  //// CODIFICACION DE PRODUCTOS ////
  ///////////////////////////////////

  async getSolicitudesCodificacionProductos(search, estado, page, usuario) {
    return request("/formularios/codificacion_productos/get_solicitudes.php", {
      method: "POST",
      body: { search, estado, page, usuario },
      errorMessage: "Error obteniendo las solicitudes",
    });
  },

  async getSolicitudCodificacionProductos(id, usuario) {
    return request("/formularios/codificacion_productos/get_solicitud.php", {
      method: "POST",
      body: { id, usuario },
      errorMessage: "Error obteniendo los detalles de la solicitud",
    });
  },

  async getTrazabilidadCodificacionProducto(id) {
    return request("/formularios/codificacion_productos/get_trazabilidad.php", {
      method: "POST",
      body: { id },
      errorMessage: "Error obteniendo trazabilidad",
      unwrap: (json) => json.trazabilidad,
    });
  },

  ///////////////////////////////////
  //////// ADMIN ITEMS FRUVER ///////
  ///////////////////////////////////

  async getItemsFruver(page = 1, por_pagina = 20, search = "") {
    return request("/fruver/items/get_items.php", {
      params: { pagina: page, por_pagina, search },
      auth: "none",
      contentTypeJson: false,
      errorMessage: "Error obteniendo los items",
    });
  },

  async createItemFruver(data) {
    return request("/fruver/items/create_item.php", {
      method: "POST",
      body: data,
      errorMessage: "Error creando el item",
    });
  },

  async updateItemFruver(id, data) {
    return request("/fruver/items/update_item.php", {
      method: "POST",
      body: { id, ...data },
      errorMessage: "Error actualizando el item",
    });
  },

  ///////////////////////////////
  //////// PEDIDOS FRUVER ///////
  ///////////////////////////////

  async getPedidosFruver(fecha) {
    // NOTA: la versión anterior pasaba las cabeceras como propiedades sueltas
    // del init de fetch (fuera de `headers`), por lo que NUNCA se enviaban.
    // Se conserva ese comportamiento efectivo (GET sin cabeceras) para no
    // alterar la respuesta del backend. Si el endpoint debiera requerir token,
    // cambiar `auth: "none"` -> "required" y `contentTypeJson: false` -> true.
    const params = {};
    if (fecha) params.fecha = fecha;
    return request("/fruver/pedidos/get_pedidos.php", {
      params,
      auth: "none",
      contentTypeJson: false,
      check: "none",
    });
  },

  ///////////////////////////////////
  //// CARGA PLANOS CONTABILIDAD ////
  ///////////////////////////////////

  async updatePlanosContabilidad({
    file,
    empresa,
    tipo,
    uploadId,
    onProgress,
  }) {
    if (!getToken()) throw new Error("No hay token de autenticacion");

    const chunkSize = 10 * 1024 * 1024; // 10MB
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const blob = file.slice(start, end);

      const formData = new FormData();
      formData.append("empresa", empresa);
      formData.append("tipo", tipo);
      formData.append("fileName", file.name);
      formData.append("uploadId", uploadId);
      formData.append("chunkIndex", i);
      formData.append("totalChunks", totalChunks);
      formData.append("file", blob);

      await request("/contabilidad/planos/update_planos.php", {
        method: "POST",
        body: formData,
        okBeforeParse: true,
        okErrorMessage: (status) => `Error HTTP: ${status}`,
        messageKeys: ["error"],
        errorMessage: "Error subiendo archivo plano",
      });

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
    }
  },

  async getConfigPlanos() {
    return request("/contabilidad/planos/config_planos.php", {
      method: "GET",
      requireToken: true,
      contentTypeJson: false,
      check: "ok+success",
      messageKeys: ["error"],
      errorMessage: "Error obteniendo configuracion",
      unwrap: "data",
    });
  },

  async updateConfigPlanos(configuracion) {
    return request("/contabilidad/planos/config_planos.php", {
      method: "POST",
      body: { configuracion },
      requireToken: true,
      check: "ok+success",
      messageKeys: ["error"],
      errorMessage: "Error actualizando configuracion",
      unwrap: "data",
    });
  },

  /////////////
  //// CVM ////
  /////////////

  // Obtener reportes cvm
  async getReportesCVM(estado, sede, search = "") {
    return request("/sistemas/cvm/get_registros.php", {
      method: "GET",
      params: { estado, sede, search },
      errorMessage: "Error obteniendo registros CVM",
    });
  },

  // Actualizar reporte cvm
  async updateReporteCVM(data) {
    return request("/sistemas/cvm/update_registro.php", {
      method: "POST",
      body: data,
      errorMessage: "Error actualizando registro CVM",
    });
  },

  // Obtener cajas
  async getCajas(id_sede) {
    return request("/sistemas/cvm/get_cajas.php", {
      method: "GET",
      params: { id_sede },
      contentTypeJson: false,
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error obteniendo las cajas",
    });
  },

  // Obtener Supervisores
  async getSupervisores(id_sede) {
    return request("/sistemas/cvm/get_supervisores.php", {
      method: "GET",
      params: { id_sede },
      contentTypeJson: false,
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error obteniendo los supervisores",
    });
  },

  // Obtener datos balanza
  async getBalanza(id_sede, id_caja) {
    return request("/sistemas/cvm/get_balanza.php", {
      method: "GET",
      params: { id_sede, id_caja },
      contentTypeJson: false,
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error obteniendo los datos de la balanza",
    });
  },

  // Subir imagen CVM
  async uploadImagenCvm(formData) {
    return request("/sistemas/cvm/upload_imagen.php", {
      method: "POST",
      body: formData,
      auth: "none",
      messageKeys: ["error"],
      errorMessage: "Error guardando el registro",
    });
  },

  // Eliminar imagenes de cvm
  async eliminarImagenes(data) {
    return request("/sistemas/cvm/delete_imagen.php", {
      method: "POST",
      body: data,
      auth: "none",
      check: "none",
    });
  },

  // Guardar reporte todas
  async saveRegistroTodasOK(data) {
    return request("/sistemas/cvm/save_registro_ok.php", {
      method: "POST",
      body: data,
      auth: "none",
      messageKeys: ["error"],
      errorMessage: "Error guardando el registro",
    });
  },

  // Guardar registro
  async saveRegistroCVM(data) {
    return request("/sistemas/cvm/save_registro.php", {
      method: "POST",
      body: data,
      auth: "none",
      messageKeys: ["error"],
      errorMessage: "Error guardando el registro",
    });
  },

  /////////////////////////////////////////////
  /////////// PROGRAMACION SEPARATA ///////////
  /////////////////////////////////////////////

  // Obtener separatas
  async getSeparatas() {
    return request("/compras/separata/get_separatas.php", {
      method: "GET",
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error obteniendo separatas",
    });
  },

  // Checkear Separata
  async checkSeparata(fechaInicio, fechaFinal) {
    return request("/compras/separata/check_separata.php", {
      method: "GET",
      params: { fecha_inicio: fechaInicio, fecha_final: fechaFinal },
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error verificando separata",
    });
  },

  // Items de separata
  async getSeparataItems(separataId) {
    return request("/compras/separata/get_items_separata.php", {
      method: "GET",
      params: { separata_id: separataId },
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error obteniendo items",
    });
  },

  // Guardar Item en una separata
  async saveSeparataItem(data) {
    return request("/compras/separata/save_item_separata.php", {
      method: "POST",
      body: data,
      errorMessage: "Error al guardar item",
    });
  },

  // Actualizar el item en una separata
  async updateSeparataItem(data) {
    return request("/compras/separata/update_item_separata.php", {
      method: "PUT",
      body: data,
      errorMessage: "Error al actualizar el item",
    });
  },

  // Borrar el item de una separata
  async deleteSeparataItem(id, usuario) {
    return request("/compras/separata/delete_item_separata.php", {
      method: "DELETE",
      body: { id, usuario },
      errorMessage: "Error al retirar el item",
    });
  },

  // Obtener datos de item
  async getItemData(item) {
    return request("/compras/separata/get_item_data.php", {
      method: "GET",
      params: { item },
      check: "error-field",
    });
  },

  // Actualizar fecha límite de una separata
  async updateFechaLimite(separataId, fechaLimite) {
    return request("/compras/separata/update_fecha_limite.php", {
      method: "PUT",
      body: { separata_id: separataId, fecha_limite: fechaLimite },
      errorMessage: "Error actualizando fecha limite",
    });
  },

  // Actualizar el título de separata
  async updateSeparataTitle(separataId, titulo, usuario) {
    return request("/compras/separata/update_separata_title.php", {
      method: "PUT",
      body: { separata_id: separataId, titulo, usuario },
      errorMessage: "Error actualizando el título",
    });
  },

  // Descargar reporte de ventas
  async downloadReporteVentas(separataId) {
    const response = await fetch(
      buildUrl(
        `/compras/separata/download_report_separata.php?separata_id=${separataId}`,
      ),
      {
        method: "GET",
        headers: buildHeaders({ contentTypeJson: false }),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("El reporte aun no esta disponible");
      }
      throw new Error("Error al descargar el reporte");
    }

    return await response.blob();
  },

  // Obtener la ultima actualizacion
  async getLastUpdate() {
    return request("/compras/separata/last_update.php", {
      method: "GET",
      check: "ok",
      messageKeys: [],
      errorMessage: "Error obteniendo ultima actualizacion",
    });
  },

  // Buscar sugerencias de historial
  async searchItemHistorySuggestions(query) {
    return request("/compras/separata/get_item_history.php", {
      method: "GET",
      params: { query },
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error buscando sugerencias",
    });
  },

  // Obtener historial exacto
  async getItemHistoryExact(item) {
    return request("/compras/separata/get_item_history.php", {
      method: "GET",
      params: { item },
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error obtuvo historial",
    });
  },

  //////////////////////////////////////
  /////////// PEDIDOS CARNES ///////////
  //////////////////////////////////////

  // Verificar pedido existente
  async verificarPedidoHoyCarnes(sede) {
    return request(`/carnes/pedidos/verificar_pedido_hoy.php?id_sede=${sede}`, {
      auth: "none",
      contentTypeJson: false,
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error verificando pedido",
    });
  },

  // Obtener items de carnes
  async getItemsCarnes() {
    return request("/carnes/pedidos/get_items.php", {
      auth: "none",
      contentTypeJson: false,
      check: "ok",
      messageKeys: ["error"],
      errorMessage: "Error obteniendo separatas",
    });
  },

  // Guardar o modificar un ítem del catálogo de carnes
  async saveItemCarnes(data) {
    return request("/carnes/pedidos/guardar_item.php", {
      method: "POST",
      body: data,
      auth: "required",
      errorMessage: "Error al guardar el ítem de carnes",
    });
  },

  async savePedidoCarnes(data) {
    return request("/carnes/pedidos/guardar_pedido.php", {
      method: "POST",
      body: data,
      auth: "none",
      errorMessage: "Error al guardar item",
    });
  },

  ///////////////////////////
  //// LECTOR DE PRECIOS ////
  ///////////////////////////

  // Obtener datos de item
  async getProductoBarras(codigoBarras, sede) {
    if (!sede) {
      throw new Error("Identificador de sede no especificado.");
    }

    const params = new URLSearchParams({
      codigo_barras: codigoBarras,
      sede: sede,
    });

    // Aislamiento total: se omite intencionalmente cualquier token.
    const response = await fetch(
      buildUrl(`/lector_precios/get_producto.php?${params.toString()}`),
      {
        method: "GET",
        headers: buildHeaders({ auth: "none" }),
      },
    );

    let json = null;
    try {
      json = await response.json();
    } catch (parseError) {
      // Evitamos la caida si el backend devuelve HTML de error o texto plano.
    }

    if (!response.ok) {
      const error = new Error(
        json && json.message ? json.message : `Error HTTP: ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }

    return json;
  },

  /////////////////////////////////////
  //// LIBRO AUXILIAR CONTABILIDAD ////
  /////////////////////////////////////

  async searchSedes() {
    return request(
      "/contabilidad/libro_auxiliar/endpoint.php?action=get_sedes",
      {
        method: "GET",
        auth: "optional",
        check: "none",
        unwrap: "resultado",
      },
    );
  },

  async obtenerReporteRecaudos(filtros) {
    return runResultadoReport(
      "/contabilidad/recaudos/endpoint.php?action=generar_reporte",
      filtros,
      {
        timeout: 600000, // 10 minutos maximo
        statusMessage: (status) =>
          `Fallo de conexion en el servidor intermediario (Codigo ${status}).`,
        successFallback: "Error al extraer datos de recaudo",
        abortMessage:
          "La red interrumpio la consulta por exceso de tiempo. Reduzca el rango de fechas.",
      },
    );
  },

  async searchProveedores(termino) {
    return request(
      `/contabilidad/libro_auxiliar/endpoint.php?action=search_proveedores&termino=${encodeURIComponent(termino)}`,
      {
        method: "GET",
        auth: "optional",
        check: "none",
        unwrap: "resultado",
      },
    );
  },

  async obtenerDatosAuxiliar(filtros) {
    return runResultadoReport(
      "/contabilidad/libro_auxiliar/endpoint.php?action=generar_excel",
      filtros,
      {
        timeout: 1200000,
        statusMessage: (status) =>
          `Fallo de conexion o timeout en el servidor publico (Codigo ${status}). El volumen del ano completo excede la ventana de tiempo HTTP. Intente por trimestres.`,
        successFallback: "Error al extraer datos contables",
        abortMessage:
          "La red interrumpe la consulta por exceso de tiempo. Segmente la busqueda por meses o provea un tercero.",
      },
    );
  },

  ///////////////////////
  //// PREFIJOS DIAN ////
  ///////////////////////

  // Accion 1: Obtener Auditoria Cruzada Siesa vs DIAN
  async obtenerAuditoriaDian(empresa, fechaInicio, fechaFin) {
    return request(
      "/contabilidad/dian/endpoint.php?action=obtener_auditoria_dian",
      {
        method: "POST",
        body: { empresa, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        check: "ok",
        errorMessage: "Error en la peticion de auditoria.",
      },
    );
  },

  // Accion 2: Obtener todo el historico de configuraciones de phpMyAdmin
  async obtenerConfiguracionDian() {
    return request(
      "/contabilidad/dian/endpoint.php?action=obtener_configuracion_dian",
      {
        method: "POST",
        body: {},
        check: "ok",
        errorMessage: "Error al recuperar configuraciones.",
      },
    );
  },

  // Accion 3: Guardar y sobreescribir la matriz de relaciones en phpMyAdmin
  async guardarConfiguracionDian(configuraciones) {
    return request(
      "/contabilidad/dian/endpoint.php?action=guardar_configuracion_dian",
      {
        method: "POST",
        body: { configuraciones },
        check: "ok",
        errorMessage: "Error al almacenar la configuracion.",
      },
    );
  },

  // Accion 4: Guardar el resultado de conciliación por día
  async guardarConciliacionDian(empresa, usuario, dias) {
    return request(
      "/contabilidad/dian/endpoint.php?action=guardar_conciliacion_dian",
      {
        method: "POST",
        body: { empresa, usuario, dias },
        check: "ok",
        errorMessage: "Error al guardar la conciliacion.",
      },
    );
  },

  // Accion 5: Obtener días ya conciliados para un rango de fechas
  async obtenerDiasConciliados(empresa, fechaInicio, fechaFin) {
    return request(
      "/contabilidad/dian/endpoint.php?action=obtener_dias_conciliados",
      {
        method: "POST",
        body: { empresa, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        check: "ok",
        errorMessage: "Error al obtener dias conciliados.",
      },
    );
  },

  ////////////////////////////////////////
  //// CONTROL DE EXISTENCIAS AVERIAS ////
  ////////////////////////////////////////

  async obtenerExistenciasAverias(sedes, lapsos) {
    return request(
      "/inventario/reportes/averias/endpoint.php?action=obtener_existencias_averias",
      {
        method: "POST",
        body: { sedes, lapsos },
        check: "ok",
        errorMessage: "Error en la peticion.",
        unwrap: "resultado",
      },
    );
  },

  async buscarProveedoresMaestro(termino) {
    return request(
      "/inventario/reportes/averias/endpoint.php?action=search_proveedores",
      {
        method: "POST",
        body: { termino },
        check: "none",
        unwrap: "resultado",
      },
    );
  },

  async listarProveedoresConfig() {
    return request(
      "/inventario/reportes/averias/endpoint.php?action=listar_proveedores_config",
      {
        method: "GET",
        contentTypeJson: false,
        check: "none",
      },
    );
  },

  async guardarProveedorConfig(payload) {
    return request(
      "/inventario/reportes/averias/endpoint.php?action=guardar_proveedor_config",
      {
        method: "POST",
        body: payload,
        check: "none",
      },
    );
  },

  async eliminarProveedorConfig(id) {
    return request(
      "/inventario/reportes/averias/endpoint.php?action=eliminar_proveedor_config",
      {
        method: "POST",
        body: { id },
        check: "none",
      },
    );
  },

  ///////////////////////////////////////////////////
  //// CONTROL DE EXISTENCIAS BODEGAS ALTERNAS ////
  ///////////////////////////////////////////////////

  async obtenerReporteBodegasAlternas(lapso) {
    return request(
      "/inventario/reportes/bodegas_alternas/endpoint.php?action=obtener_reporte_bodegas",
      {
        method: "POST",
        body: { lapso },
        check: "ok",
        errorMessage: "Error consultando matrices.",
        unwrap: "resultado",
      },
    );
  },

  async listarBodegasConfig() {
    return request(
      "/inventario/reportes/bodegas_alternas/endpoint.php?action=listar_bodegas_config",
      {
        method: "GET",
        contentTypeJson: false,
        check: "none",
      },
    );
  },

  async guardarBodegaConfig(payload) {
    return request(
      "/inventario/reportes/bodegas_alternas/endpoint.php?action=guardar_bodega_config",
      {
        method: "POST",
        body: payload,
        check: "none",
      },
    );
  },

  async eliminarBodegaConfig(id) {
    return request(
      "/inventario/reportes/bodegas_alternas/endpoint.php?action=eliminar_bodega_config",
      {
        method: "POST",
        body: { id },
        check: "none",
      },
    );
  },

  ////////////////////////////////
  //// CONTROL DE PRECIOS ////
  ////////////////////////////////

  async obtenerPlantillas() {
    return request(
      "/publicidad/printer/endpoint.php?action=obtener_plantillas",
      {
        method: "POST",
        // Se duplica en el body por seguridad contra middlewares
        body: { action: "obtener_plantillas" },
        check: "none",
      },
    );
  },

  async guardarPlantilla(plantilla) {
    return request(
      "/publicidad/printer/endpoint.php?action=guardar_plantilla",
      {
        method: "POST",
        body: { ...plantilla, action: "guardar_plantilla" },
        check: "none",
      },
    );
  },

  async eliminarPlantilla(id) {
    return request(
      `/publicidad/printer/endpoint.php?action=eliminar_plantilla&id=${id}`,
      {
        method: "POST",
        body: { action: "eliminar_plantilla", id: id },
        check: "none",
      },
    );
  },

  ///////////////////////////////////////////
  //// CONTROL INVENTARIOS PROVEEDORES ////
  ///////////////////////////////////////////

  async getPermisosInventario(search = "", page = 1) {
    return request(
      "/compras/inventarios/permisos_inventario.php?action=listar_permisos",
      {
        method: "POST",
        body: { search, page },
        check: "ok+success",
        errorMessage: "Error al recuperar reglas",
        unwrap: "data",
      },
    );
  },

  async buscarProveedoresSiesa(termino) {
    const response = await fetch(
      buildUrl(
        "/compras/inventarios/permisos_inventario.php?action=search_proveedores_siesa",
      ),
      {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ termino }),
      },
    );
    if (!response.ok) {
      throw new Error("Error en comunicacion con servidor Siesa");
    }
    const json = await response.json();
    if (json?.resultado?.success && Array.isArray(json.resultado.data)) {
      return json.resultado.data.map((prov) => ({
        nit: String(prov.codigo).trim(),
        razon_social: String(prov.descripcion).trim(),
      }));
    }
    return [];
  },

  async buscarCriterios1(termino) {
    const response = await fetch(
      buildUrl(
        "/compras/inventarios/permisos_inventario.php?action=search_criterios1",
      ),
      {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ termino }),
      },
    );
    if (!response.ok) {
      throw new Error("Error consultando criterios en el servidor central");
    }
    const json = await response.json();
    if (json?.resultado?.success && Array.isArray(json.resultado.data)) {
      return json.resultado.data.map((crit) => ({
        codigo: String(crit.codigo).trim(),
        descripcion: String(crit.descripcion).trim(),
      }));
    }
    return [];
  },

  async guardarPermisoInventario(payload) {
    return request(
      "/compras/inventarios/permisos_inventario.php?action=guardar_proveedor_permiso",
      {
        method: "POST",
        body: payload,
        check: "ok+success",
        errorMessage: "Error procesando operacion",
      },
    );
  },

  async eliminarPermisoInventario(id) {
    return request(
      "/compras/inventarios/permisos_inventario.php?action=eliminar_proveedor_permiso",
      {
        method: "POST",
        body: { id },
        check: "ok+success",
        errorMessage: "Error al remover la regla",
      },
    );
  },

  ////////////////////////////////
  //// CONTROL DE PROVEEDORES ////
  ////////////////////////////////

  async getVisitantes(page = 1, por_pagina = 20, search = "", filters = {}) {
    return request("/seguridad/visitantes/get_visitantes.php", {
      params: { pagina: page, por_pagina, search, ...filters },
      auth: "none",
      contentTypeJson: false,
      errorMessage: "Error obteniendo visitantes",
    });
  },

  async getVisitante(cedula) {
    return request(`/seguridad/visitantes/get_visitante.php?cedula=${cedula}`, {
      auth: "none",
      contentTypeJson: false,
      errorMessage: "Error obteniendo visitante",
    });
  },

  async createVisitante(data) {
    return request("/seguridad/visitantes/create_visitante.php", {
      method: "POST",
      body: data,
      errorMessage: "Error creando visitante",
    });
  },

  async updateVisitante(id, data) {
    return request("/seguridad/visitantes/update_visitante.php", {
      method: "POST",
      body: { id, ...data },
      errorMessage: "Error actualizando visitante",
    });
  },

  // Visitas
  async getVisitas(page = 1, por_pagina = 20, filters = {}) {
    return request("/seguridad/visitantes/get_visitas.php", {
      params: { pagina: page, por_pagina, ...filters },
      auth: "none",
      contentTypeJson: false,
      errorMessage: "Error obteniendo visitas",
    });
  },

  async createVisita(data) {
    return request("/seguridad/visitantes/create_visita.php", {
      method: "POST",
      body: data,
      errorMessage: "Error creando visita",
    });
  },

  async updateVisita(id, data) {
    return request("/seguridad/visitantes/update_visita.php", {
      method: "POST",
      body: { id, ...data },
      errorMessage: "Error actualizando visita",
    });
  },

  ////////////////////////////////////////////////////////
  //////// ESTADO DE INFRAESTRUCTURA CENTOS //////
  ////////////////////////////////////////////////////////
  async verificarEstadoBaseDatos({ signal } = {}) {
    // Timeout local corto (10s) encadenado con el AbortSignal externo del hook.
    try {
      const response = await fetchWithTimeout(
        buildUrl("/system/status/endpoint.php?action=check"),
        {
          method: "GET",
          headers: buildHeaders({ auth: "optional" }),
        },
        { timeout: 10000, externalSignal: signal },
      );

      if (!response.ok) {
        throw new Error(
          `Fallo de conexion al verificar el estado (Codigo ${response.status}).`,
        );
      }

      const data = unwrapResultado(await response.json());
      if (!data.success) {
        throw new Error(data.message || "Servicio no disponible");
      }
      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        // Distinguimos aborto por cancelacion externa vs. timeout local
        if (signal && signal.aborted) throw error;
        throw new Error("El servicio de base de datos no respondio a tiempo.");
      }
      throw error;
    }
  },

  ///////////////////////////////////////
  //// EXISTENCIAS Y COSTOS REPORT //////
  ///////////////////////////////////////

  async obtenerReporteExistenciasCostos(lapso, local = "") {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=obtener_reporte_existencias",
      {
        method: "POST",
        body: { lapso, local },
        errorMessage: "Fallo al compilar balances de existencias y costos.",
      },
    );
  },

  async obtenerReporteExistenciasCostosMultiLapso(lapsos = [], local = "") {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=obtener_reporte_existencias_multilapso",
      {
        method: "POST",
        body: { lapsos, local },
        errorMessage:
          "Fallo al consolidar reporte multi-periodo de existencias y costos.",
      },
    );
  },

  async listarLineasConfig() {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=listar_lineas_config",
      {
        method: "GET",
        contentTypeJson: false,
        errorMessage: "Error recuperando parametros de cobertura.",
      },
    );
  },

  async guardarLineaConfig(payload) {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=guardar_linea_config",
      {
        method: "POST",
        body: payload,
        errorMessage: "No se logro almacenar la parametrizacion de la linea.",
      },
    );
  },

  async eliminarLineaConfig(id) {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=eliminar_linea_config",
      {
        method: "POST",
        body: { id },
        errorMessage: "Error al remover la regla de la linea.",
      },
    );
  },

  async listarLocalesConfig() {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=listar_locales_config",
      {
        method: "GET",
        contentTypeJson: false,
        errorMessage:
          "Error recuperando locales parametricos de la base de datos.",
      },
    );
  },

  async guardarLocalConfig(payload) {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=guardar_local_config",
      {
        method: "POST",
        body: payload,
        errorMessage: "No se logro almacenar la parametrizacion del local.",
      },
    );
  },

  async eliminarLocalConfig(id) {
    return request(
      "/inventario/reportes/existencias_costos/endpoint.php?action=eliminar_local_config",
      {
        method: "POST",
        body: { id },
        errorMessage: "Error al remover el local del mapa analitico.",
      },
    );
  },
};
