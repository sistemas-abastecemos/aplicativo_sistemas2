import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEmpresa } from "../../contexts/EmpresaContext";
import logo from "../../assets/images/logo.png";
import { useDarkMode } from "../../hooks/useDarkMode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt,
  faUserCircle,
  faTimes,
  faAnglesLeft,
  faAnglesRight,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./TopBar.module.css";

const TopBar = ({ onLogout, onToggleSidebar, collapsed }) => {
  const { user } = useAuth();
  const { empresa } = useEmpresa();
  const { isDark, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const userProfileRef = useRef(null);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        userProfileRef.current &&
        !userProfileRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      if (isMobile) {
        document.body.style.overflow = "hidden";
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showUserMenu, isMobile]);

  const empresaNombre =
    empresa === "abastecemos"
      ? "Abastecemos de Occidente S.A.S"
      : "Tobar Sanchez Vallejo S.A";

  const saludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate("/perfil");
  };

  return (
    <>
      <header className={styles.topBar}>
        {/* Sección Izquierda */}
        <div className={styles.leftSection}>
          <button
            className={styles.collapseBtn}
            onClick={onToggleSidebar}
            aria-label="Expandir/colapsar menú"
          >
            <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} />
          </button>

          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <img
                src={logo}
                alt="Identidad Corporativa"
                className={styles.logoImg}
              />
            </div>
            <div className={styles.companyInfo}>
              <h1 className={styles.companyName}>{empresaNombre}</h1>
              <p className={styles.greeting}>
                {saludo()},{" "}
                <span className={styles.userName}>
                  {user?.nombres_completos || "Usuario"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Sección Derecha */}
        <div className={styles.rightSection}>
          {/* Botón de Modo Oscuro */}
          <button
            className={styles.themeToggleBtn}
            onClick={toggleDarkMode}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            aria-label="Alternar modo oscuro"
          >
            <FontAwesomeIcon
              icon={isDark ? faSun : faMoon}
              className={isDark ? styles.sunIcon : styles.moonIcon}
            />
          </button>

          <div
            className={`${styles.toggleContainer} ${styles.disabled}`}
            title="Control mutable deshabilitado"
          >
            <div
              className={`${styles.toggleSwitch} ${empresa === "tobar" ? styles.toggleActive : ""}`}
            >
              <span className={styles.toggleText}>
                {empresa === "abastecemos" ? "A" : "T"}
              </span>
            </div>
            <span className={styles.toggleLabel}>Empresa</span>
          </div>

          <div
            ref={userProfileRef}
            className={styles.userProfile}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className={styles.avatar}>
              <FontAwesomeIcon
                icon={faUserCircle}
                className={styles.avatarIcon}
              />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userProfileName}>
                {user?.nombres_completos || user?.login || "Usuario"}
              </span>
              <span className={styles.userRole}>
                @{user?.rol_descripcion || user?.login || "Usuario"}
              </span>
            </div>
          </div>

          {isMobile && (
            <button
              className={styles.logoutButton}
              onClick={onLogout}
              aria-label="Cerrar sesión"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          )}
        </div>
      </header>

      {/* Vista Desplegable Móvil (Malla de Fondo Translúcida) */}
      {showUserMenu && isMobile && (
        <div className={styles.mobileMenuOverlay}>
          <div ref={userMenuRef} className={styles.mobileMenuContent}>
            <div className={styles.mobileMenuHeader}>
              <div className={styles.menuHeader}>
                <div className={styles.menuAvatar}>
                  <FontAwesomeIcon icon={faUserCircle} />
                </div>
                <div className={styles.menuUserInfo}>
                  <span className={styles.menuUserName}>
                    {user?.nombres_completos || "Usuario"}
                  </span>
                  <span className={styles.menuUserEmail}>
                    {user?.correo || "usuario@empresa.com"}
                  </span>
                </div>
              </div>
              <button
                className={styles.closeMenuButton}
                onClick={() => setShowUserMenu(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className={styles.menuDivider}></div>
            <button className={styles.menuItem} onClick={toggleDarkMode}>
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
              {isDark ? "Modo Claro" : "Modo Oscuro"}
            </button>
            <button className={styles.menuItem} onClick={handleProfileClick}>
              <FontAwesomeIcon icon={faUserCircle} /> Mi Perfil
            </button>
            <div className={styles.menuDivider}></div>
            <button
              className={`${styles.menuItem} ${styles.logoutItem}`}
              onClick={onLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Vista Desplegable Escritorio (Menú Flotante Translúcido) */}
      {showUserMenu && !isMobile && (
        <div
          ref={userMenuRef}
          className={styles.userMenu}
          onMouseLeave={() => setShowUserMenu(false)}
        >
          <div className={styles.menuHeader}>
            <div className={styles.menuAvatar}>
              <FontAwesomeIcon icon={faUserCircle} />
            </div>
            <div className={styles.menuUserInfo}>
              <span className={styles.menuUserName}>
                {user?.nombres_completos || "Usuario"}
              </span>
              <span className={styles.menuUserEmail}>
                {user?.correo || "usuario@empresa.com"}
              </span>
            </div>
          </div>
          <div className={styles.menuDivider}></div>
          <button className={styles.menuItem} onClick={handleProfileClick}>
            <FontAwesomeIcon icon={faUserCircle} /> Mi Perfil
          </button>
          <div className={styles.menuDivider}></div>
          <button
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={onLogout}
          >
            <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
          </button>
        </div>
      )}
    </>
  );
};

export default TopBar;
