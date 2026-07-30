import React from "react";
import { FaUserCircle, FaArrowLeft } from "react-icons/fa";
import styles from "../Login.module.css";

const ForgotPasswordForm = ({
  credentials,
  onChange,
  onSubmit,
  disabled,
  error,
  onBack,
}) => {
  return (
    <>
      <h1 className={styles.loginTitle}>Recuperar Contrasena</h1>
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

        {error && <div className={styles.loginError}>{error}</div>}

        <button
          type="submit"
          className={styles.loginButton}
          disabled={disabled}
        >
          Enviar enlace
        </button>
      </form>

      <div className={styles.extraLinks}>
        <button type="button" onClick={onBack} className={styles.backButton}>
          <FaArrowLeft /> Volver al Login
        </button>
      </div>
    </>
  );
};

export default React.memo(ForgotPasswordForm);
