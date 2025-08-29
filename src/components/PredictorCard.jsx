// src/components/PredictorCard.jsx
import React from "react";

const PredictorCard = ({ title, description, result }) => {
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.description}>{description}</p>
      {result && <div style={styles.result}>{result}</div>}
    </div>
  );
};

const styles = {
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    maxWidth: "300px",
    margin: "10px auto",
    textAlign: "center",
  },
  title: {
    fontSize: "20px",
    marginBottom: "8px",
    color: "#2c3e50",
  },
  description: {
    fontSize: "14px",
    color: "#555",
  },
  result: {
    marginTop: "12px",
    padding: "8px",
    background: "#3498db",
    color: "#fff",
    borderRadius: "8px",
    fontWeight: "bold",
  },
};

export default PredictorCard;
