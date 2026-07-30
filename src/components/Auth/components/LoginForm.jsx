import React from "react";
import { FaUserCircle, FaKey } from "react-icons/fa";
import styles from "../Login.module.css";

const LoginForm = ({ credentials, onChange, onSubmit, disabled, error }) => {
  return (
    <>
      <h1 className={styles.loginTitle}>Iniciar Sesion</h1>
      <p className={styles.loginSubtitle}>
        Ingresa tus credenciales para acceder al aplicativo.
      </p>
      <form onSubmit={onSubmit} noValidate>
        <div className={styles.loginInputGroup}>
          <div className={styles.inputIconWrapper}>
            <FaUserCircle className={styles.inputIcon} />
            <input
              type="text"
              name="login"
              placeholder="Usuario"
              value={credentials.login}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div className={styles.loginInputGroup}>
          <div className={styles.inputIconWrapper}>
            <FaKey className={styles.inputIcon} />
            <input
              type="password"
              name="password"
              placeholder="Contrasena"
              value={credentials.password}
              onChange={onChange}
              required
            />
          </div>
        </div>

        {error && <div className={styles.loginError}>{error}</div>}

        <button
          type="submit"
          className={styles.loginButton}
          disabled={disabled}
        >
          Ingresar
        </button>
      </form>
    </>
  );
};

export default React.memo(LoginForm);
