import React from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
} from "react-icons/fa";
import styles from "../Login.module.css";

const LoginFooter = () => {
  return (
    <footer className={styles.loginFooter}>
      <ul className={styles.firmaList}>
        <li>
          <FaPhoneAlt className={styles.icono} /> 669 5778 | Ext 132 - 109
        </li>
        <li>
          <FaEnvelope className={styles.icono} />
          <a
            href="mailto:sistemas@supermercadobelalcazar.com.co"
            className={styles.enlace}
          >
            sistemas@supermercadobelalcazar.com.co
          </a>
        </li>
        <li>
          <FaGlobe className={styles.icono} />
          <a
            href="https://supermercadobelalcazar.com.co"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.enlace}
          >
            supermercado.com.co
          </a>
        </li>
        <li>
          <FaMapMarkerAlt className={styles.icono} /> Oficina Principal, Yumbo -
          Valle
        </li>
      </ul>
    </footer>
  );
};

export default React.memo(LoginFooter);
