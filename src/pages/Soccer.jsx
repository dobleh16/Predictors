// src/pages/SoccerPredictor.jsx
import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useTranslation } from "react-i18next";

export default function SoccerPredictor() {
  const [formData, setFormData] = useState({
    equipol: "",
    numpartidos: "",
    ganadosl: "",
    empatadosl: "",
    perdidosl: "",
    golesl: "",
    equipov: "",
    ganadosv: "",
    empatadosv: "",
    perdidosv: "",
    golesv: "",
  });

  const [resultado, setResultado] = useState("");
  const [user] = useAuthState(auth);
  const { t, i18n } = useTranslation();
  const [showHelp, setShowHelp] = useState(false); // Nuevo estado para el modal de ayuda

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const savePredictionToDashboard = async (prediccion, equipoLocal, equipoVisitante) => {
    if (!user) {
      console.error("Usuario no autenticado, no se puede guardar la predicción.");
      return;
    }

    const userId = user.uid;
    const docRef = doc(db, "predictions", userId);

    const newPrediction = {
      timestamp: new Date().toISOString(),
      deporte: "Soccer",
      match: `${equipoLocal} vs ${equipoVisitante}`,
      winner: prediccion,
      date: new Date().toISOString(),
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

  const calcularGanador = async () => {
    const {
      equipol,
      equipov,
      numpartidos,
      ganadosl,
      empatadosl,
      perdidosl,
      golesl,
      ganadosv,
      empatadosv,
      perdidosv,
      golesv,
    } = formData;

    const partidosJugados = Number(numpartidos);
    const ganadosLocal = Number(ganadosl);
    const empatadosLocal = Number(empatadosl);
    const perdidosLocal = Number(perdidosl);
    const golesLocal = Number(golesl);
    const ganadosVisitante = Number(ganadosv);
    const empatadosVisitante = Number(empatadosv);
    const perdidosVisitante = Number(perdidosv);
    const golesVisitante = Number(golesv);

    let scoreLocal = 0;
    let scoreVisitante = 0;

    if (ganadosLocal > ganadosVisitante) {
      scoreLocal += 2;
    } else if (ganadosVisitante > ganadosLocal) {
      scoreVisitante += 2;
    }

    if (empatadosLocal > empatadosVisitante) {
      scoreLocal -= 1;
    } else if (empatadosVisitante > empatadosLocal) {
      scoreVisitante -= 1;
    }

    if (perdidosLocal > perdidosVisitante) {
      scoreLocal -= 2;
    } else if (perdidosVisitante > perdidosLocal) {
      scoreVisitante -= 2;
    }

    if (golesLocal > golesVisitante) {
      scoreLocal += 2;
    } else if (golesVisitante > golesLocal) {
      scoreVisitante += 2;
    }

    const promedioGoles = partidosJugados
      ? (golesLocal + golesVisitante) / partidosJugados
      : 0;

    let mensaje = "";
    let equipoGanador = "";
    
    // Esta es la parte corregida para manejar correctamente las traducciones
    if (scoreLocal > scoreVisitante) {
      mensaje = t("soccer_result_local", {
        team: equipol,
        avgGoals: promedioGoles.toFixed(2),
      });
      equipoGanador = t("soccer_winner_draw_format", {
        team: equipol,
        avgGoals: promedioGoles.toFixed(2),
      });
    } else if (scoreVisitante > scoreLocal) {
      mensaje = t("soccer_result_visitor", {
        team: equipov,
        avgGoals: promedioGoles.toFixed(2),
      });
      equipoGanador = t("soccer_winner_draw_format", {
        team: equipov,
        avgGoals: promedioGoles.toFixed(2),
      });
    } else {
      mensaje = t("soccer_result_draw", {
        avgGoals: promedioGoles.toFixed(2),
      });
      equipoGanador = t("soccer_draw_only_format", {
        avgGoals: promedioGoles.toFixed(2),
      });
    }

    setResultado(mensaje);
    await savePredictionToDashboard(equipoGanador, equipol, equipov);
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
      marginTop: 10,
      padding: 15,
      backgroundColor: "#e6f7ff",
      borderRadius: 5,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
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
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>{t("soccer_predictor_title")}</h2>
        <span style={styles.helpIcon} onClick={() => setShowHelp(true)}>
          ❓
        </span>
      </div>
      
      <h3>{t("soccer_predictor_subtitle")}</h3>

      <div style={{ marginBottom: 20 }}>
        <p>
          ⚽️{" "}
          <a
            href="https://www.sofascore.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("soccer_stats_link")}
          </a>
        </p>
      </div>

      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_home_team_name")}
          type="text"
          name="equipol"
          value={formData.equipol}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_matches_played")}
          type="number"
          name="numpartidos"
          value={formData.numpartidos}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_home_wins")}
          type="number"
          name="ganadosl"
          value={formData.ganadosl}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_home_draws")}
          type="number"
          name="empatadosl"
          value={formData.empatadosl}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_home_losses")}
          type="number"
          name="perdidosl"
          value={formData.perdidosl}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_home_goals")}
          type="number"
          name="golesl"
          value={formData.golesl}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_away_team_name")}
          type="text"
          name="equipov"
          value={formData.equipov}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_away_wins")}
          type="number"
          name="ganadosv"
          value={formData.ganadosv}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_away_draws")}
          type="number"
          name="empatadosv"
          value={formData.empatadosv}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_away_losses")}
          type="number"
          name="perdidosv"
          value={formData.perdidosv}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <input
          placeholder={t("soccer_away_goals")}
          type="number"
          name="golesv"
          value={formData.golesv}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <button onClick={calcularGanador} style={styles.button}>
        {t("soccer_calculate_winner")}
      </button>
      {resultado && <pre style={styles.result}>{resultado}</pre>}

      {/* Modal de ayuda */}
      {showHelp && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <span style={styles.closeButton} onClick={() => setShowHelp(false)}>
              &times;
            </span>
            <h3>{t("soccer_help_title")}</h3>
            <p>{t("soccer_help_intro")}</p>
            <ul style={styles.helpList}>
              <li>
                <strong>{t("soccer_home_team_name")} / {t("soccer_away_team_name")}:</strong> {t("soccer_team_help_text")}
              </li>
              <li>
                <strong>{t("soccer_matches_played")}:</strong> {t("soccer_matches_played_help_text")}
              </li>
              <li>
                <strong>{t("soccer_home_wins")} / {t("soccer_away_wins")}:</strong> {t("soccer_wins_help_text")}
              </li>
              <li>
                <strong>{t("soccer_home_draws")} / {t("soccer_away_draws")}:</strong> {t("soccer_draws_help_text")}
              </li>
              <li>
                <strong>{t("soccer_home_losses")} / {t("soccer_away_losses")}:</strong> {t("soccer_losses_help_text")}
              </li>
              <li>
                <strong>{t("soccer_home_goals")} / {t("soccer_away_goals")}:</strong> {t("soccer_goals_help_text")}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

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
    marginTop: 10,
    padding: 15,
    backgroundColor: "#e6f7ff",
    borderRadius: 5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
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
};