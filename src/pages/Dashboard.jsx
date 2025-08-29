// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [predictions, setPredictions] = useState([]);
  const [winCount, setWinCount] = useState(0);
  const [lossCount, setLossCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "predictions", user.uid);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const preds = data.predictions || [];
        setPredictions(preds);

        const wins = preds.filter((p) => p.result === "win").length;
        const losses = preds.filter((p) => p.result === "loss").length;
        setWinCount(wins);
        setLossCount(losses);
      } else {
        setPredictions([]);
        setWinCount(0);
        setLossCount(0);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleResultChange = async (index, result) => {
    if (!user) return;
    try {
      const updatedPredictions = [...predictions];
      updatedPredictions[index] = { ...updatedPredictions[index], result };
      await updateDoc(doc(db, "predictions", user.uid), {
        predictions: updatedPredictions,
      });
    } catch (error) {
      console.error(t("update_error"), error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error(t("logout_error"), error);
    }
  };

  const totalPredictions = winCount + lossCount;
  const accuracy =
    totalPredictions > 0 ? ((winCount / totalPredictions) * 100).toFixed(2) : 0;
  
  // Helper function to get the correct icon based on the sport
  const getSportIcon = (sport) => {
    // Si la predicción no tiene un deporte definido, inferimos que es de MLB.
    // Esta es una solución temporal hasta que el predictor de MLB se actualice.
    if (!sport) return "⚾️"; 
    switch (sport.toLowerCase()) {
      case "mlb":
        return "⚾️";
      case "soccer":
        return "⚽️";
      default:
        return "🏟️";
    }
  };

  return (
    <div style={styles.container}>
      <h1>{t("dashboard_welcome")}</h1>
      {user && (
        <>
          <p>
            <strong>{t("dashboard_user")}:</strong>{" "}
            {user.displayName || t("no_name")}
          </p>
          <p>
            <strong>{t("dashboard_email")}:</strong> {user.email}
          </p>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={t("profile_picture")}
              style={styles.avatar}
            />
          )}

          <div style={styles.stats}>
            <p>✅ {t("wins")}: {winCount}</p>
            <p>❌ {t("losses")}: {lossCount}</p>
            <p>📊 {t("accuracy")}: {accuracy}%</p>
          </div>

          <h2>{t("your_predictions")}</h2>
          {predictions.length === 0 ? (
            <p>{t("no_predictions_saved")}</p>
          ) : (
            <ul style={styles.list}>
              {predictions.map((p, index) => (
                <li key={index} style={styles.listItem}>
                  {/* 🏟 Deporte y partido */}
                  <p>
                    <strong>{getSportIcon(p.deporte)} {p.deporte || 'MLB'}</strong> — <strong>{p.match}</strong>
                  </p>

                  {/* 🔮 Ganador - MODIFIED TO HANDLE MULTIPLE LINES */}
                  <p>
                    {t("winner")}:{" "}
                    {p.winner && p.winner.split("\n").map((line, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "block",
                          margin: "0 0 5px 0",
                          fontStyle: "italic",
                        }}
                      >
                        {line}
                      </span>
                    ))}
                  </p>

                  {/* 📅 Fecha */}
                  {p.date && (
                    <small>📅 {new Date(p.date).toLocaleString()}</small>
                  )}
                  <br />

                  {/* ✅ / ❌ Resultado real */}
                  <label>
                    <input
                      type="radio"
                      name={`result-${index}`}
                      checked={p.result === "win"}
                      onChange={() => handleResultChange(index, "win")}
                    />{" "}
                    {t("win")}
                  </label>
                  <label style={{ marginLeft: "10px" }}>
                    <input
                      type="radio"
                      name={`result-${index}`}
                      checked={p.result === "loss"}
                      onChange={() => handleResultChange(index, "loss")}
                    />{" "}
                    {t("loss")}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <button onClick={handleLogout} style={styles.button}>
        {t("logout")}
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "500px",
    margin: "50px auto",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    marginTop: "10px",
  },
  stats: {
    margin: "15px 0",
    fontWeight: "bold",
    fontSize: "16px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  list: {
    listStyleType: "none",
    padding: 0,
    marginTop: 10,
    textAlign: "left",
  },
  listItem: {
    marginBottom: 12,
    padding: "8px 10px",
    backgroundColor: "#f0f0f0",
    borderRadius: "4px",
  },
};

export default Dashboard;