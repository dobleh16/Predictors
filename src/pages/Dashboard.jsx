// src/components/Dashboard.jsx

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSport, setFilterSport] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  // Nuevo estado para las sugerencias de búsqueda
  const [suggestions, setSuggestions] = useState([]);

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

  // useEffect para manejar las sugerencias
  useEffect(() => {
    if (searchTerm.length > 1) {
      const uniqueMatches = [...new Set(
        predictions
          .filter(p => p.match.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(p => p.match)
      )];
      setSuggestions(uniqueMatches);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, predictions]);

  const handleResultChange = async (timestamp, result) => {
    if (!user) return;
    try {
      const updatedPredictions = predictions.map((p) =>
        p.timestamp === timestamp ? { ...p, result } : p
      );
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
  
  const getSportIcon = (sport) => {
    if (!sport) return "⚾️"; 
    switch (sport.toLowerCase()) {
      case "mlb":
        return "⚾️";
      case "soccer":
        return "⚽️";
      case "nfl":
        return "🏈";
      default:
        return "🏟️";
    }
  };

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch = p.match.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = filterSport === "all" || (p.deporte && p.deporte.toLowerCase() === filterSport);
    const matchesResult = filterResult === "all" || p.result === filterResult;
    
    const predictionDate = p.date ? new Date(p.date).toISOString().split('T')[0] : '';
    const matchesDate = filterDate === "" || predictionDate === filterDate;
    
    return matchesSearch && matchesSport && matchesResult && matchesDate;
  });

  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });

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
          
          <div style={styles.filterContainer}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder={t("search_predictions")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              {suggestions.length > 0 && (
                <ul style={styles.suggestionsList}>
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSearchTerm(suggestion);
                        setSuggestions([]); // Limpia las sugerencias al seleccionar una
                      }}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">{t("all_sports")}</option>
              <option value="mlb">{t("mlb")}</option>
              <option value="nfl">{t("nfl")}</option>
              <option value="soccer">{t("soccer")}</option>
            </select>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">{t("all_results")}</option>
              <option value="pending">{t("pending")}</option>
              <option value="win">{t("win")}</option>
              <option value="loss">{t("loss")}</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={styles.selectInput}
            />
          </div>
          
          {sortedPredictions.length === 0 ? (
            <p>{t("no_matching_predictions")}</p>
          ) : (
            <ul style={styles.list}>
              {sortedPredictions.map((p) => (
                <li key={p.timestamp} style={styles.listItem}>
                  <p>
                    <strong>{getSportIcon(p.deporte)} {p.deporte || 'MLB'}</strong> — <strong>{p.match}</strong>
                  </p>
                  <p>
                    {t("winner")}:{" "}
                    <strong>{p.winner}</strong>
                  </p>
                  {p.recommendation && (
                    <p style={{ fontStyle: "italic", fontSize: "14px" }}>
                      {p.recommendation}
                    </p>
                  )}
                  {p.date && (
                    <small>📅 {new Date(p.date).toLocaleString()}</small>
                  )}
                  <br />
                  <label>
                    <input
                      type="radio"
                      name={`result-${p.timestamp}`}
                      checked={p.result === "win"}
                      onChange={() => handleResultChange(p.timestamp, "win")}
                    />{" "}
                    {t("win")}
                  </label>
                  <label style={{ marginLeft: "10px" }}>
                    <input
                      type="radio"
                      name={`result-${p.timestamp}`}
                      checked={p.result === "loss"}
                      onChange={() => handleResultChange(p.timestamp, "loss")}
                    />{" "}
                    {t("loss")}
                  </label>
                  <label style={{ marginLeft: "10px" }}>
                    <input
                      type="radio"
                      name={`result-${p.timestamp}`}
                      checked={p.result === "pending"}
                      onChange={() => handleResultChange(p.timestamp, "pending")}
                    />{" "}
                    {t("pending")}
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
  filterContainer: {
    marginBottom: 15,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  searchInput: {
    padding: "8px 12px",
    border: "1px solid #d9d9d9",
    borderRadius: 5,
    flexGrow: 1
  },
  selectInput: {
    padding: "8px 12px",
    border: "1px solid #d9d9d9",
    borderRadius: 5,
  },
  searchContainer: {
    position: 'relative',
    flexGrow: 1,
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #d9d9d9',
    borderRadius: 5,
    listStyle: 'none',
    padding: 0,
    margin: '4px 0 0 0',
    zIndex: 100
  },
  suggestionsItem: {
    padding: '8px 12px',
    cursor: 'pointer',
  }
};

export default Dashboard;