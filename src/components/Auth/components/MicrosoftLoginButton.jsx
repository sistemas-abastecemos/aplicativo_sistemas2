import React from "react";
import styles from "../Login.module.css";

const MicrosoftLoginButton = ({ onClick, disabled }) => {
  return (
    <div className={styles.microsoftContainer}>
      <div className={styles.dividerOr}>
        <span>O continuar con</span>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={styles.loginButtonMicrosoft}
        disabled={disabled}
      >
        <svg
          className={styles.msIcon}
          width="16"
          height="16"
          viewBox="0 0 23 23"
        >
          <path fill="#f35325" d="M0 0h11v11H0z" />
          <path fill="#81bc06" d="M12 0h11v11H12z" />
          <path fill="#05a6f0" d="M0 12h11v11H0z" />
          <path fill="#ffba08" d="M12 12h11v11H12z" />
        </svg>
        Cuenta Corporativa Microsoft
      </button>
    </div>
  );
};

export default React.memo(MicrosoftLoginButton);
