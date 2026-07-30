import React, { useState, useEffect } from "react";
import styles from "../Terminal.module.css";

const GUACAMOLE_BASE_URL =
  "https://terminal.supermercadobelalcazar.com/guacamole";

const ConnectionStatusBadge = ({ isConnected, token }) => {
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    if (!isConnected || !token) return;

    const measureNetworkLatency = async () => {
      const startTime = performance.now();
      try {
        const pingUrl = `${GUACAMOLE_BASE_URL}/?seao_token=${encodeURIComponent(token)}&ping=${Date.now()}`;

        // Peticion HEAD en modo no-cors para medicion directa de latencia de red
        await fetch(pingUrl, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        });

        const rtt = Math.round(performance.now() - startTime);
        setLatency(rtt);
      } catch (err) {
        setLatency(null);
      }
    };

    measureNetworkLatency();
    const interval = setInterval(measureNetworkLatency, 4000);

    return () => clearInterval(interval);
  }, [isConnected, token]);

  const getStatusColor = () => {
    if (latency === null) return styles.gray;
    if (latency < 100) return styles.green;
    if (latency < 250) return styles.yellow;
    return styles.red;
  };

  const getQualityText = () => {
    if (latency === null) return "Midiendo...";
    if (latency < 100) return "Excelente";
    if (latency < 250) return "Aceptable";
    return "Inestable";
  };

  return (
    <div className={styles.badgeContainer}>
      <span className={`${styles.statusDot} ${getStatusColor()}`} />
      <span className={styles.protocolText}>WS</span>
      <span className={styles.latencyText}>
        {latency !== null ? `${latency} ms` : "--"}
      </span>
      <span className={styles.qualityLabel}>({getQualityText()})</span>
    </div>
  );
};

export default ConnectionStatusBadge;
