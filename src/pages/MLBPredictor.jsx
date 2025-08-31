// src/components/MLBPredictor.jsx

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, addDoc, doc, updateDoc, setDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

function convertRecord(record) {
  // Convierte "6-4" a array de 6 unos y 4 ceros
  const parts = record.split("-");
  if (parts.length !== 2) return null;
  const wins = parseInt(parts[0], 10);
  const losses = parseInt(parts[1], 10);
  if (isNaN(wins) || isNaN(losses)) return null;
  return Array(wins).fill(1).concat(Array(losses).fill(0));
}

function calculatePitcherScore(record) {
  const parts = record.split("-");
  if (parts.length !== 2) return null;
  const wins = parseInt(parts[0], 10);
  const losses = parseInt(parts[1], 10);
  if (isNaN(wins) || isNaN(losses)) return null;
  return wins - losses;
}

function getTotalWins(record) {
  const parts = record.split("-");
  if (parts.length !== 2) return null;
  const wins = parseInt(parts[0], 10);
  if (isNaN(wins)) return null;
  return wins;
}

const MLBPredictor = () => {
  const { t, i18n } = useTranslation();

  const [inputs, setInputs] = useState({
    teamHome: "",
    teamAway: "",
    recordHome: "",
    recordAway: "",
    pitcherRecordHome: "",
    pitcherRecordAway: "",
    seasonRecordHome: "",
    seasonRecordAway: "",
    eraHome: "",
    eraAway: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [showHelp, setShowHelp] = useState(false); // Nuevo estado para el modal de ayuda

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const predictWinner = async () => {
    setError("");

    const {
      teamHome,
      teamAway,
      recordHome,
      recordAway,
      pitcherRecordHome,
      pitcherRecordAway,
      seasonRecordHome,
      seasonRecordAway,
      eraHome,
      eraAway,
    } = inputs;

    if (
      !teamHome ||
      !teamAway ||
      !recordHome ||
      !recordAway ||
      !pitcherRecordHome ||
      !pitcherRecordAway ||
      !seasonRecordHome ||
      !seasonRecordAway ||
      !eraHome ||
      !eraAway
    ) {
      setError(t("please_fill_all_fields"));
      return;
    }

    const recHomeArr = convertRecord(recordHome);
    const recAwayArr = convertRecord(recordAway);
    const pitcherScoreHome = calculatePitcherScore(pitcherRecordHome);
    const pitcherScoreAway = calculatePitcherScore(pitcherRecordAway);
    const seasonWinsHome = getTotalWins(seasonRecordHome);
    const seasonWinsAway = getTotalWins(seasonRecordAway);

    const eraH = parseFloat(eraHome);
    const eraA = parseFloat(eraAway);

    if (
      !recHomeArr ||
      !recAwayArr ||
      pitcherScoreHome === null ||
      pitcherScoreAway === null ||
      seasonWinsHome === null ||
      seasonWinsAway === null ||
      isNaN(eraH) ||
      isNaN(eraA)
    ) {
      setError(t("invalid_input_format"));
      return;
    }

    let scoreHome = recHomeArr.reduce((a, b) => a + b, 0) + pitcherScoreHome + seasonWinsHome;
    let scoreAway = recAwayArr.reduce((a, b) => a + b, 0) + pitcherScoreAway + seasonWinsAway;

    if (eraH > eraA) {
      scoreAway += 2;
    } else if (eraA > eraH) {
      scoreHome += 2;
    }

    const winner = scoreHome > scoreAway ? teamHome.toUpperCase() : teamAway.toUpperCase();

    const prediction = {
      timestamp: new Date().toISOString(),
      deporte: "MLB",
      match: `${teamHome.toUpperCase()} vs ${teamAway.toUpperCase()}`,
      winner,
      date: new Date().toISOString(),
      inputs,
    };

    setResult({
      match: prediction.match,
      winner,
    });

    if (!auth.currentUser) {
      setError("User not authenticated");
      return;
    }

    const userId = auth.currentUser.uid;
    const docRef = doc(db, "predictions", userId);

    try {
      await updateDoc(docRef, {
        predictions: arrayUnion(prediction),
      });
    } catch (e) {
      await setDoc(docRef, { predictions: [prediction] });
    }

    setInputs({
      teamHome: "",
      teamAway: "",
      recordHome: "",
      recordAway: "",
      pitcherRecordHome: "",
      pitcherRecordAway: "",
      seasonRecordHome: "",
      seasonRecordAway: "",
      eraHome: "",
      eraAway: "",
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>{t("mlb_predictor_title")}</h2>
        <span style={styles.helpIcon} onClick={() => setShowHelp(true)}>
          ❓
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p>
          📊{" "}
          <a
            href={
              i18n.language === "es"
                ? "https://www.mlb.com/es/standings"
                : "https://www.mlb.com/standings"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("team_stats_link")}
          </a>
        </p>
        <p>
          ⚾{" "}
          <a
            href={
              i18n.language === "es"
                ? "https://www.mlb.com/es/probable-pitchers"
                : "https://www.mlb.com/probable-pitchers"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("pitcher_stats_link")}
          </a>
        </p>
      </div>

      <label>{t("home_team_name")}:</label>
      <input
        type="text"
        name="teamHome"
        value={inputs.teamHome}
        onChange={handleChange}
        placeholder={t("example", { example: "Yankees" })}
      />

      <label>{t("away_team_name")}:</label>
      <input
        type="text"
        name="teamAway"
        value={inputs.teamAway}
        onChange={handleChange}
        placeholder={t("example", { example: "Red Sox" })}
      />

      <label>{t("last_10_games_record_home")}:</label>
      <input
        type="text"
        name="recordHome"
        value={inputs.recordHome}
        onChange={handleChange}
        placeholder="6-4"
      />

      <label>{t("last_10_games_record_away")}:</label>
      <input
        type="text"
        name="recordAway"
        value={inputs.recordAway}
        onChange={handleChange}
        placeholder="6-4"
      />

      <label>{t("pitcher_record_home")}:</label>
      <input
        type="text"
        name="pitcherRecordHome"
        value={inputs.pitcherRecordHome}
        onChange={handleChange}
        placeholder="5-2"
      />

      <label>{t("pitcher_record_away")}:</label>
      <input
        type="text"
        name="pitcherRecordAway"
        value={inputs.pitcherRecordAway}
        onChange={handleChange}
        placeholder="5-2"
      />

      <label>{t("season_record_home")}:</label>
      <input
        type="text"
        name="seasonRecordHome"
        value={inputs.seasonRecordHome}
        onChange={handleChange}
        placeholder="60-40"
      />

      <label>{t("season_record_away")}:</label>
      <input
        type="text"
        name="seasonRecordAway"
        value={inputs.seasonRecordAway}
        onChange={handleChange}
        placeholder="58-42"
      />

      <label>{t("era_pitcher_home")}:</label>
      <input
        type="number"
        step="0.01"
        name="eraHome"
        value={inputs.eraHome}
        onChange={handleChange}
        placeholder="3.50"
      />

      <label>{t("era_pitcher_away")}:</label>
      <input
        type="number"
        step="0.01"
        name="eraAway"
        value={inputs.eraAway}
        onChange={handleChange}
        placeholder="3.70"
      />

      {error && <p style={styles.error}>{error}</p>}

      <button onClick={predictWinner} style={styles.button}>
        {t("predict_winner")}
      </button>

      {result && (
        <div style={styles.result}>
          <h3>{t("prediction_result")}</h3>
          <p>
            {t("match")}: <strong>{result.match}</strong>
          </p>
          <p>
            {t("winner")}: <strong>{result.winner}</strong>
          </p>
        </div>
      )}

      {predictions.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Predictions so far:</h3>
          <ul>
            {predictions.map((pred, idx) => (
              <li key={idx}>
                <strong>{pred.match}</strong> - Winner: {pred.winner}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de ayuda */}
      {showHelp && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <span style={styles.closeButton} onClick={() => setShowHelp(false)}>
              &times;
            </span>
            <h3>{t("mlb_help_title")}</h3>
            <p>{t("mlb_help_intro")}</p>
            <ul style={styles.helpList}>
              <li>
                <strong>{t("home_team_name")} / {t("away_team_name")}:</strong> {t("mlb_team_name_help_text")}
              </li>
              <li>
                <strong>{t("last_10_games_record_home")} / {t("last_10_games_record_away")}:</strong> {t("mlb_last_10_help_text")}
              </li>
              <li>
                <strong>{t("pitcher_record_home")} / {t("pitcher_record_away")}:</strong> {t("mlb_pitcher_record_help_text")}
              </li>
              <li>
                <strong>{t("season_record_home")} / {t("season_record_away")}:</strong> {t("mlb_season_record_help_text")}
              </li>
              <li>
                <strong>{t("era_pitcher_home")} / {t("era_pitcher_away")}:</strong> {t("mlb_era_help_text")}
              </li>
            </ul>
            <p style={styles.helpLinks}>
              <a href="https://www.mlb.com/standings" target="_blank" rel="noopener noreferrer">
                {t("team_stats_link")}
              </a>
              {" / "}
              <a href="https://www.mlb.com/probable-pitchers" target="_blank" rel="noopener noreferrer">
                {t("pitcher_stats_link")}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 450,
    margin: "auto",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helpIcon: {
    fontSize: "1.5rem",
    cursor: "pointer",
    marginRight: '10px'
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#1890ff",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginTop: 10,
  },
  error: {
    color: "red",
    fontWeight: "bold",
  },
  result: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#e6f7ff",
    borderRadius: 5,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "400px",
    position: "relative",
    textAlign: "left",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "15px",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
  helpList: {
    paddingLeft: "20px",
  },
  helpLinks: {
    textAlign: "center",
    marginTop: "20px",
  },
};

export default MLBPredictor;