// src/pages/NFLPredictor.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export default function NFLPredictor() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);

  const [formData, setFormData] = useState({
    teamHome: "",
    recordHome: "",
    seasonRecordHome: "",
    moneylineHome: "",
    spreadPublicHome: "",
    spreadValueHome: "",
    atsPastHome: "",
    atsCurrentHome: "",

    teamAway: "",
    recordAway: "",
    seasonRecordAway: "",
    moneylineAway: "",
    spreadPublicAway: "",
    spreadValueAway: "",
    atsPastAway: "",
    atsCurrentAway: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false); // Nuevo estado para el modal de ayuda

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const savePrediction = async (predictionData) => {
    if (!user) {
      console.error("Usuario no autenticado, no se puede guardar la predicción.");
      return;
    }

    const userId = user.uid;
    const docRef = doc(db, "predictions", userId);

    const newPrediction = {
      timestamp: new Date().toISOString(),
      deporte: "NFL",
      match: `${formData.teamHome.toUpperCase()} vs ${formData.teamAway.toUpperCase()}`,
      winner: predictionData.winner,
      recommendation: predictionData.recommendation,
      date: new Date().toISOString(),
      result: "pending", // ¡Este es el campo que faltaba!
    };

    try {
      await setDoc(
        docRef,
        { predictions: arrayUnion(newPrediction) },
        { merge: true }
      );
    } catch (e) {
      console.error("Error al guardar la predicción: ", e);
    }
  };

  const calculateWinner = async () => {
    setError("");

    const {
      teamHome,
      recordHome,
      seasonRecordHome,
      moneylineHome,
      spreadPublicHome,
      spreadValueHome,
      atsPastHome,
      atsCurrentHome,
      teamAway,
      recordAway,
      seasonRecordAway,
      moneylineAway,
      spreadPublicAway,
      spreadValueAway,
      atsPastAway,
      atsCurrentAway,
    } = formData;

    if (
      !teamHome || !recordHome || !seasonRecordHome || !moneylineHome || !spreadPublicHome ||
      !spreadValueHome || !atsPastHome || !atsCurrentHome ||
      !teamAway || !recordAway || !seasonRecordAway || !moneylineAway || !spreadPublicAway ||
      !spreadValueAway || !atsPastAway || !atsCurrentAway
    ) {
      setError(t("please_fill_all_fields"));
      return;
    }

    const parseRecord = (record) => {
      const [wins, losses] = record.split("-").map(Number);
      return { wins, losses };
    };

    const recordHomeParsed = parseRecord(recordHome);
    const recordAwayParsed = parseRecord(recordAway);
    const seasonHomeParsed = parseRecord(seasonRecordHome);
    const seasonAwayParsed = parseRecord(seasonRecordAway);

    const moneylineHomeParsed = parseFloat(moneylineHome);
    const moneylineAwayParsed = parseFloat(moneylineAway);
    const spreadPublicHomeParsed = parseFloat(spreadPublicHome);
    const spreadPublicAwayParsed = parseFloat(spreadPublicAway);
    const atsPastHomeParsed = parseFloat(atsPastHome);
    const atsPastAwayParsed = parseFloat(atsPastAway);
    const atsCurrentHomeParsed = parseFloat(atsCurrentHome);
    const atsCurrentAwayParsed = parseFloat(atsCurrentAway);

    if (
      isNaN(recordHomeParsed.wins) || isNaN(recordAwayParsed.wins) ||
      isNaN(seasonHomeParsed.wins) || isNaN(seasonAwayParsed.wins) ||
      isNaN(moneylineHomeParsed) || isNaN(moneylineAwayParsed) ||
      isNaN(spreadPublicHomeParsed) || isNaN(spreadPublicAwayParsed) ||
      isNaN(atsPastHomeParsed) || isNaN(atsPastAwayParsed) ||
      isNaN(atsCurrentHomeParsed) || isNaN(atsCurrentAwayParsed)
    ) {
      setError(t("invalid_input_format"));
      return;
    }

    let scoreHome = 0;
    let scoreAway = 0;

    const winRateHome5 = recordHomeParsed.wins / (recordHomeParsed.wins + recordHomeParsed.losses);
    const winRateAway5 = recordAwayParsed.wins / (recordAwayParsed.wins + recordAwayParsed.losses);
    if (winRateHome5 > winRateAway5) scoreHome += 2;
    else if (winRateAway5 > winRateHome5) scoreAway += 2;

    const winRateHomeSeason = seasonHomeParsed.wins / (seasonHomeParsed.wins + seasonHomeParsed.losses);
    const winRateAwaySeason = seasonAwayParsed.wins / (seasonAwayParsed.wins + seasonAwayParsed.losses);
    if (winRateHomeSeason > winRateAwaySeason) scoreHome += 2;
    else if (winRateAwaySeason > winRateHomeSeason) scoreAway += 2;

    if (moneylineHomeParsed > 75) scoreHome -= 2;
    if (moneylineAwayParsed > 75) scoreAway -= 2;

    if (spreadPublicHomeParsed > 70) scoreHome -= 2;
    if (spreadPublicAwayParsed > 70) scoreAway -= 2;

    if (atsPastHomeParsed > atsPastAwayParsed) scoreHome += 1;
    else if (atsPastAwayParsed > atsPastHomeParsed) scoreAway += 1;

    if (atsCurrentHomeParsed > atsCurrentAwayParsed) scoreHome += 2;
    else if (atsCurrentAwayParsed > atsCurrentHomeParsed) scoreAway += 2;

    let winner = "";
    let recommendation = "";

    if (scoreHome > scoreAway) {
      winner = formData.teamHome.toUpperCase();
      recommendation = `${t("recommendation")}: ${formData.teamHome.toUpperCase()} ${formData.spreadValueHome}`;
    } else if (scoreAway > scoreHome) {
      winner = formData.teamAway.toUpperCase();
      recommendation = `${t("recommendation")}: ${formData.teamAway.toUpperCase()} ${formData.spreadValueAway}`;
    } else {
      if (atsCurrentHomeParsed > atsCurrentAwayParsed) {
        winner = formData.teamHome.toUpperCase();
        recommendation = `${t("recommendation")}: ${formData.teamHome.toUpperCase()} ${formData.spreadValueHome}`;
      } else if (atsCurrentAwayParsed > atsCurrentHomeParsed) {
        winner = formData.teamAway.toUpperCase();
        recommendation = `${t("recommendation")}: ${formData.teamAway.toUpperCase()} ${formData.spreadValueAway}`;
      } else {
        winner = t("tie");
        recommendation = t("no_recommendation");
      }
    }

    setResult({ winner, recommendation });
    await savePrediction({ winner, recommendation });
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
    inputGroup: {
      marginBottom: 5,
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: 5,
      boxSizing: "border-box",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#1890ff",
      color: "#fff",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      marginTop: 10,
      width: "100%",
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>{t("nfl_predictor_title")}</h2>
        <span style={styles.helpIcon} onClick={() => setShowHelp(true)}>
          ❓
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p>
          🏈{" "}
          <a
            href="https://www.espn.com/nfl/standings/_/seasontype/2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("nfl_stats_link")}
          </a>
        </p>
        <p>
          📊{" "}
          <a
            href="https://www.teamrankings.com/nfl/trends/ats_trends/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("nfl_ats_link")}
          </a>
        </p>
        <p>
          💰{" "}
          <a
            href="https://www.actionnetwork.com/nfl/public-betting"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("nfl_public_betting_link")}
          </a>
        </p>
      </div>

      <h4>{t("home_team")}</h4>
      <input
        placeholder={t("home_team_name")}
        type="text"
        name="teamHome"
        value={formData.teamHome}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("last_5_games_record")}
        type="text"
        name="recordHome"
        value={formData.recordHome}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("season_record")}
        type="text"
        name="seasonRecordHome"
        value={formData.seasonRecordHome}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("moneyline_public_betting")}
        type="number"
        name="moneylineHome"
        value={formData.moneylineHome}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("spread_public_betting")}
        type="number"
        name="spreadPublicHome"
        value={formData.spreadPublicHome}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("spread_value")}
        type="text"
        name="spreadValueHome"
        value={formData.spreadValueHome}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("ats_past_season")}
        type="number"
        name="atsPastHome"
        value={formData.atsPastHome}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("ats_current_season")}
        type="number"
        name="atsCurrentHome"
        value={formData.atsCurrentHome}
        onChange={handleChange}
        style={styles.input}
      />

      <h4>{t("away_team")}</h4>
      <input
        placeholder={t("away_team_name")}
        type="text"
        name="teamAway"
        value={formData.teamAway}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("last_5_games_record")}
        type="text"
        name="recordAway"
        value={formData.recordAway}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("season_record")}
        type="text"
        name="seasonRecordAway"
        value={formData.seasonRecordAway}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("moneyline_public_betting")}
        type="number"
        name="moneylineAway"
        value={formData.moneylineAway}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("spread_public_betting")}
        type="number"
        name="spreadPublicAway"
        value={formData.spreadPublicAway}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("spread_value")}
        type="text"
        name="spreadValueAway"
        value={formData.spreadAway}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("ats_past_season")}
        type="number"
        name="atsPastAway"
        value={formData.atsPastAway}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        placeholder={t("ats_current_season")}
        type="number"
        name="atsCurrentAway"
        value={formData.atsCurrentAway}
        onChange={handleChange}
        style={styles.input}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <button onClick={calculateWinner} style={styles.button}>
        {t("predict_winner")}
      </button>

      {result && (
        <div style={styles.result}>
          <h3>{t("prediction_result")}</h3>
          <p>
            {t("winner")}: <strong>{result.winner}</strong>
          </p>
          <p>
            {result.recommendation}
          </p>
        </div>
      )}

      {/* Modal de ayuda */}
      {showHelp && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <span style={styles.closeButton} onClick={() => setShowHelp(false)}>
              &times;
            </span>
            <h3>{t("nfl_help_title")}</h3>
            <p>{t("nfl_help_intro")}</p>
            <ul style={styles.helpList}>
              <li>
                <strong>{t("home_team")} / {t("away_team")}:</strong> {t("nfl_team_help_text")}
              </li>
              <li>
                <strong>{t("last_5_games_record")}:</strong> {t("nfl_last_5_help_text")}
              </li>
              <li>
                <strong>{t("season_record")}:</strong> {t("nfl_season_help_text")}
              </li>
              <li>
                <strong>{t("moneyline_public_betting")}:</strong> {t("nfl_moneyline_help_text")}
              </li>
              <li>
                <strong>{t("spread_public_betting")}:</strong> {t("nfl_spread_public_help_text")}
              </li>
              <li>
                <strong>{t("spread_value")}:</strong> {t("nfl_spread_value_help_text")}
              </li>
              <li>
                <strong>{t("ats_past_season")}:</strong> {t("nfl_ats_past_help_text")}
              </li>
              <li>
                <strong>{t("ats_current_season")}:</strong> {t("nfl_ats_current_help_text")}
              </li>
            </ul>
            <p style={styles.helpLinks}>
              <a href="https://www.espn.com/nfl/standings/_/seasontype/2" target="_blank" rel="noopener noreferrer">
                {t("nfl_stats_link")}
              </a>
              {" / "}
              <a href="https://www.teamrankings.com/nfl/trends/ats_trends/" target="_blank" rel="noopener noreferrer">
                {t("nfl_ats_link")}
              </a>
              {" / "}
              <a href="https://www.actionnetwork.com/nfl/public-betting" target="_blank" rel="noopener noreferrer">
                {t("nfl_public_betting_link")}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}