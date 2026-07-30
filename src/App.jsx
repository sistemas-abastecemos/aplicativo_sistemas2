import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/Routing/PrivateRoute";
import { NotificationProvider } from "./contexts/NotificationContext";
import { MenuProvider } from "./contexts/MenuContext";
import LoadingScreen from "./components/UI/LoadingScreen";
import NotificationContainer from "./components/UI/NotificationContainer";
import Layout from "./components/Layout/Layout";
import { getReturnUrl } from "./components/Auth/utils/navigation";

// BASIC CONFIG//
import Menus from "./components/AdminPanel/Menus/Menus";
import Usuarios from "./components/AdminPanel/Usuarios/Usuarios";
import Proveedores from "./components/AdminPanel/Proveedores/Proveedores";
import Sedes from "./components/AdminPanel/Sedes/Sedes";
import Areas from "./components/AdminPanel/Areas/Areas";
import Cargos from "./components/AdminPanel/Cargos/Cargos";
import AdminInformes from "./components/AdminPanel/Informes/Informes";
import PerfilUsuario from "./components/Perfil/Perfil";

// NO PROTECT //
import Login from "./components/Auth/Login";
import Dashboard from "./components/DashBoard/Dashboard";

// FRUVER //
import AdministrarItemsFruver from "./components/Fruver/Items/AdministrarItems";
import PedidosFruver from "./components/Fruver/Pedidos/Pedidos";

// CARNES //
import PedidosCarnes from "./components/Carnes/Pedidos/FormularioPedidos";

// COMPRAS //
import ProgramacionSeparata from "./components/Compras/Separata/ProgramacionSeparata";
import ActualizacionCostos from "./components/Compras/Actualizacion Costos/ActualizacionCostos";
import CodificacionProductos from "./components/Compras/Codificacion Productos/CodificacionProductos";
import PermisosInventario from "./components/Compras/Inventarios/PermisosInventario";

// CONTABILIDAD //
import PlanosContables from "./components/Contabilidad/Planos/PlanosContables";
import LibroAuxiliar from "./components/Contabilidad/Libro Auxiliar/LibroAuxiliar";
import Recaudos from "./components/Contabilidad/Recaudos/Recaudos";
import PrefijosDian from "./components/Contabilidad/Prefijos Dian/PrefijosDian";

// SISTEMAS //
import ActualizarInventario from "./components/AdminPanel/Inventario/ActualizarInventario";
import VisualizaReportesCVM from "./components/Sistemas/CVM/Reportes/Reportes";
import CVM from "./components/Sistemas/CVM/Formulario/CVM";
import Logs from "./components/Sistemas/Logs/Logs";

// SEGURIDAD //
import GestionVisitantes from "./components/Seguridad/Gestion Visitantes/GestionVisitantes";

// PUBLICIDAD //
import PrintCanvas from "./components/Publicidad/PrintCanvas";

// INFORMES //
import Informes from "./components/Informes/Informes";

// TERMINAL VIEWER //
import Terminal from "./components/Terminal/Terminal";

// INVENTARIOS //
import ExistenciasAverias from "./components/Inventario/Reportes/Averias/ExistenciasAverias";
import ExistenciasBodegasAlternas from "./components/Inventario/Reportes/Bodegas Alternas/BodegasAlternas";
import ExistenciasCostos from "./components/Inventario/Reportes/Existencias Costos/ExistenciasCostos";

// LECTOR PRECIOS //
import LectorPrecios1 from "./components/LectorPrecios/B1/LectorPrecios";
import LectorPrecios2 from "./components/LectorPrecios/B2/LectorPrecios";
import LectorPrecios5 from "./components/LectorPrecios/B5/LectorPrecios";
import LectorPrecios8 from "./components/LectorPrecios/B8/LectorPrecios";
import LectorPrecios11 from "./components/LectorPrecios/B11/LectorPrecios";

// Componente interno para gestionar la redirección inteligente si entra logueado a /login
const LoginRedirect = () => {
  const location = useLocation();
  const destinationRef = React.useRef(null);

  if (!destinationRef.current) {
    destinationRef.current = getReturnUrl(location);
    sessionStorage.removeItem("returnUrl");
  }

  return <Navigate to={destinationRef.current} replace />;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <MenuProvider>
      <NotificationContainer />
      <Routes>
        {/* Login */}
        <Route path="/login" element={user ? <LoginRedirect /> : <Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/inicio"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Layout>
                <PerfilUsuario />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/menus"
          element={
            <PrivateRoute>
              <Layout>
                <Menus />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/sedes"
          element={
            <PrivateRoute>
              <Layout>
                <Sedes />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/areas"
          element={
            <PrivateRoute>
              <Layout>
                <Areas />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/cargos"
          element={
            <PrivateRoute>
              <Layout>
                <Cargos />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/usuarios"
          element={
            <PrivateRoute>
              <Layout>
                <Usuarios />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/proveedores"
          element={
            <PrivateRoute>
              <Layout>
                <Proveedores />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/actualizar_inventario"
          element={
            <PrivateRoute>
              <Layout>
                <ActualizarInventario />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion/informes"
          element={
            <PrivateRoute>
              <Layout>
                <AdminInformes />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// FRUVER /////////// */}
        <Route
          path="/fruver/admin_items"
          element={
            <PrivateRoute>
              <Layout>
                <AdministrarItemsFruver />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/fruver/pedidos"
          element={
            <PrivateRoute>
              <Layout>
                <PedidosFruver />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// CONTABILIDAD /////////// */}
        <Route
          path="/contabilidad/planos_contables"
          element={
            <PrivateRoute>
              <Layout>
                <PlanosContables />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/contabilidad/libro_auxiliar"
          element={
            <PrivateRoute>
              <Layout>
                <LibroAuxiliar />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/contabilidad/recaudos"
          element={
            <PrivateRoute>
              <Layout>
                <Recaudos />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/contabilidad/prefijos_dian"
          element={
            <PrivateRoute>
              <Layout>
                <PrefijosDian />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// SISTEMAS /////////// */}
        <Route
          path="/sistemas/reportes_cvm"
          element={
            <PrivateRoute>
              <Layout>
                <VisualizaReportesCVM />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/CVM"
          element={
            <PrivateRoute>
              <Layout>
                <CVM />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/informes"
          element={
            <PrivateRoute>
              <Layout>
                <Informes />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/terminal"
          element={
            <PrivateRoute>
              <Layout>
                <Terminal />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <PrivateRoute>
              <Layout>
                <Logs />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// SEGURIDAD /////////// */}
        <Route
          path="/seguridad/visitantes"
          element={
            <PrivateRoute>
              <Layout>
                <GestionVisitantes />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// COMPRAS /////////// */}
        <Route
          path="/compras/separata"
          element={
            <PrivateRoute>
              <Layout>
                <ProgramacionSeparata />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/compras/actualizacion_costos"
          element={
            <PrivateRoute>
              <Layout>
                <ActualizacionCostos />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/compras/codificacion_productos"
          element={
            <PrivateRoute>
              <Layout>
                <CodificacionProductos />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/compras/permisos_inventario"
          element={
            <PrivateRoute>
              <Layout>
                <PermisosInventario />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// CARNES /////////// */}
        <Route
          path="/formulario_pedidos_carnes"
          element={
            <PrivateRoute>
              <Layout>
                <PedidosCarnes />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// PUBLICIDAD /////////// */}
        <Route
          path="/publicidad/print"
          element={
            <PrivateRoute>
              <Layout>
                <PrintCanvas />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// INVENTARIOS /////////// */}
        <Route
          path="/inventarios/reportes/averias"
          element={
            <PrivateRoute>
              <Layout>
                <ExistenciasAverias />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/inventarios/reportes/bodegas_alternas"
          element={
            <PrivateRoute>
              <Layout>
                <ExistenciasBodegasAlternas />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/inventarios/reportes/existencias_costos"
          element={
            <PrivateRoute>
              <Layout>
                <ExistenciasCostos />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* /////////// LECTORES /////////// */}
        <Route path="/LectorPrecios" element={<LectorPrecios1 />} />
        <Route path="/LectorPrecios2" element={<LectorPrecios2 />} />
        <Route path="/LectorPrecios5" element={<LectorPrecios5 />} />
        <Route path="/LectorPrecios8" element={<LectorPrecios8 />} />
        <Route path="/LectorPrecios11" element={<LectorPrecios11 />} />

        {/* Redirección por defecto */}
        <Route
          path="*"
          element={<Navigate to={user ? "/inicio" : "/login"} replace />}
        />
      </Routes>
    </MenuProvider>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
