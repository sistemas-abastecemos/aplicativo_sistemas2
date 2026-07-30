import React from "react";
import { motion } from "framer-motion";
import logo from "../../../assets/images/logo.png";
import styles from "../Login.module.css";

const LeftPanel = () => {
  return (
    <div className={styles.leftPanel}>
      <div className={styles.bgImage} />
      <motion.div
        className={styles.ambientLight1}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.ambientLight2}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className={styles.leftContent}>
        <motion.img
          src={logo}
          alt="Logo"
          className={styles.panelLogo}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
          style={{ willChange: "transform, opacity" }}
        />
        <motion.h2
          className={styles.panelTitle}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          Abastecemos de Occidente S.A.S
        </motion.h2>
        <motion.p
          className={styles.panelText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ willChange: "transform, opacity" }}
        >
          Bienvenid@ a nuestro aplicativo de Supermercado Belalcazar.
        </motion.p>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
