import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useDynamicMenu } from "../../hooks/useDynamicMenu";
import LoadingScreen from "../UI/LoadingScreen";

function PrivateRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { menu, loading: menuLoading } = useDynamicMenu();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !menuLoading && user) {
      checkAccess();
    }
  }, [authLoading, menuLoading, user, location.pathname, menu]);

  const checkAccess = () => {
    // Rutas que siempre están permitidas (sin verificación de menú)
    const alwaysAllowedRoutes = ["/inicio", "/perfil"];

    if (alwaysAllowedRoutes.includes(location.pathname)) {
      setHasAccess(true);
      setAccessChecked(true);
      return;
    }

    // Verificar si la ruta actual está en el menú del usuario
    const hasAccessToRoute = checkRouteAccess(location.pathname, menu);
    setHasAccess(hasAccessToRoute);
    setAccessChecked(true);
  };

  const checkRouteAccess = (currentPath, userMenu) => {
    if (!userMenu || !Array.isArray(userMenu)) return false;

    // Función recursiva para buscar en menús y submenús
    const searchInMenu = (menuItems) => {
      for (const item of menuItems) {
        // Verificar si este item coincide con la ruta
        if (item.ruta === currentPath) {
          return true;
        }

        // Verificar en hijos recursivamente
        if (item.children && item.children.length > 0) {
          const foundInChildren = searchInMenu(item.children);
          if (foundInChildren) return true;
        }
      }
      return false;
    };

    return searchInMenu(userMenu);
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // Redirigir si no está autenticado
  if (!user) {
    // Guarda la URL exacta (incluyendo querystrings si los hay)
    const targetUrl = location.pathname + location.search;
    sessionStorage.setItem("returnUrl", targetUrl);

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Mostrar loading mientras verifica permisos del menú
  if (!accessChecked || menuLoading) {
    return <LoadingScreen message="Verificando permisos..." />;
  }

  // Redirigir si no tiene acceso a la ruta
  if (!hasAccess) {
    console.warn(
      `Acceso denegado a: ${location.pathname}. Redirigiendo a /inicio`,
    );
    return <Navigate to="/inicio" replace />;
  }

  return children;
}

export default PrivateRoute;
