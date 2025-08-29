// src/components/Loader.jsx
import React, { useEffect } from "react";

const Loader = () => {
  useEffect(() => {
    if (document.styleSheets.length > 0) {
      const sheet = document.styleSheets[0];
      try {
        sheet.insertRule(
          `@keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }`,
          sheet.cssRules.length
        );
      } catch (err) {
        console.warn("No se pudo insertar la regla CSS", err);
      }
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.loader}></div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: "20px",
  },
  loader: {
    border: "6px solid #f3f3f3",
    borderTop: "6px solid #3498db",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
};

export default Loader;
