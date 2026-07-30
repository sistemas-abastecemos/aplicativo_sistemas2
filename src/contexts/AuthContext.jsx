import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRef = useRef(null);

  const logout = useCallback(
    (message = "", redirect = true) => {
      const activeToken = token || localStorage.getItem("authToken");

      if (activeToken) {
        apiService
          .logout(activeToken)
          .catch((err) =>
            console.error("Error al cerrar sesion en el servidor:", err),
          );
      }

      // Registra el cierre de sesion voluntario para prevenir auto-login
      sessionStorage.setItem("user_logged_out", "true");
      sessionStorage.setItem("ms_silent_login_attempted", "true");

      setUser(null);
      setToken(null);
      userRef.current = null;
      sessionStorage.removeItem("hasRedirectedThisSession");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");

      if (message) {
        const safeMessage =
          typeof message === "string"
            ? message
            : message?.message || "Sesion cerrada";
        setError(safeMessage);
      }

      if (redirect) {
        navigate("/login?logout=true", { replace: true });
      }
    },
    [navigate, token],
  );

  const verifyToken = useCallback(async () => {
    const activeToken = localStorage.getItem("authToken");

    if (!activeToken) {
      if (userRef.current !== null) {
        setUser(null);
        setToken(null);
        userRef.current = null;
      }
      setLoading(false);
      return;
    }

    try {
      const result = await apiService.verifyToken(activeToken);

      if (result.success && result.user) {
        const userChanged =
          JSON.stringify(userRef.current) !== JSON.stringify(result.user);

        if (userChanged) {
          setUser(result.user);
          setToken(activeToken);
          userRef.current = result.user;
          localStorage.setItem("authToken", activeToken);
          localStorage.setItem("userRole", result.user.rol);
        }
      } else {
        if (userRef.current !== null) {
          logout(result.message || "Sesion expirada o usuario inactivo");
        }
      }
    } catch (err) {
      if (userRef.current !== null) {
        logout(err.message || "Error de conexion al verificar la sesion");
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = async (credentials) => {
    try {
      setError("");
      const response = await apiService.login(credentials);

      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        userRef.current = response.user;
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("userRole", response.user.rol);
        return { success: true };
      } else {
        setError(response.message || "Error en el login");
        return { success: false, message: response.message };
      }
    } catch (error) {
      setError(error.message || "Error de conexion");
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithMicrosoft = async (code, redirectUri) => {
    try {
      setError("");
      const response = await apiService.loginMicrosoft(code, redirectUri);

      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        userRef.current = response.user;
        localStorage.setItem("authToken", response.token);
        localStorage.setItem(
          "userRole",
          response.user.rol || response.user.id_rol,
        );
        return { success: true };
      } else {
        setError(response.message || "Error en el login corporativo");
        return { success: false, message: response.message };
      }
    } catch (error) {
      setError(error.message || "Error de conexion con el servidor");
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();

    const interval = setInterval(() => {
      verifyToken();
    }, 30000);

    return () => clearInterval(interval);
  }, [verifyToken]);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    loginWithMicrosoft,
    logout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
