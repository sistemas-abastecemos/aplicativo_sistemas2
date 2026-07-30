import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useLoginForm } from "./hooks/useLoginForm";
import { useMicrosoftAuth } from "./hooks/useMicrosoftAuth";

import LeftPanel from "./components/LeftPanel";
import LoginForm from "./components/LoginForm";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import MicrosoftLoginButton from "./components/MicrosoftLoginButton";
import LoginFooter from "./components/LoginFooter";
import LoadingScreen from "../UI/LoadingScreen";

import logo from "../../assets/images/logo.png";
import styles from "./Login.module.css";

const Login = () => {
  const { setError } = useAuth();

  const {
    credentials,
    mode,
    submitting,
    error,
    handleChange,
    handleSubmit,
    changeMode,
  } = useLoginForm();

  const { cargandoMS, handleManualMicrosoftLogin } = useMicrosoftAuth(setError);

  const cargando = submitting || cargandoMS;

  // Si esta validando silenciosamente, mostramos unicamente el Loader en el primer renderizado
  if (cargandoMS && !submitting) {
    return (
      <LoadingScreen
        isVisible={true}
        title="Verificando sesión corporativa"
        subtitle="Comprobando credenciales de Microsoft Office 365..."
        variant="fullscreen"
      />
    );
  }

  return (
    <div className={styles.loginWrapper}>
      {cargando && (
        <LoadingScreen
          isVisible={true}
          title="Autenticando"
          subtitle="Por favor espera un momento..."
          variant="fullscreen"
        />
      )}

      <LeftPanel />

      <div className={styles.rightPanel}>
        <div className={styles.cardWrap}>
          <div className={styles.decorCard} />

          <div className={styles.loginCard}>
            <img src={logo} alt="Logo Mobile" className={styles.logoMobile} />

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <LoginForm
                    credentials={credentials}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    disabled={cargando}
                    error={error}
                  />

                  <MicrosoftLoginButton
                    onClick={handleManualMicrosoftLogin}
                    disabled={cargando}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="forgot-form"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <ForgotPasswordForm
                    credentials={credentials}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    disabled={cargando}
                    error={error}
                    onBack={() => changeMode("login")}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <LoginFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
