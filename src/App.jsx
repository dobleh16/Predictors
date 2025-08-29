// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useTranslation } from "react-i18next";
import Loader from "./components/Loader";
import PredictorCard from "./components/PredictorCard";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import MLBPredictor from "./pages/MLBPredictor";
import SoccerPredictor from "./pages/Soccer";
import NFLPredictor from "./pages/NFLPredictor"; // <-- Importamos el componente de la NFL

function App() {
  const { t } = useTranslation();

  return (
    <>
      <Navbar />
      <div style={{ padding: 20 }}>
        <Routes>
          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <h1>{t("welcome")}</h1>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mlb"
            element={
              <ProtectedRoute>
                <MLBPredictor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nba"
            element={
              <ProtectedRoute>
                <h2>NBA Predictor — próximamente</h2>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nfl"
            element={
              <ProtectedRoute>
                <NFLPredictor /> {/* <-- Ahora se renderiza el componente NFLPredictor */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/football"
            element={
              <ProtectedRoute>
                <h2>Football Predictor — próximamente</h2>
              </ProtectedRoute>
            }
          />
          <Route
            path="/soccer"
            element={
              <ProtectedRoute>
                <SoccerPredictor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />

          {/* Ejemplo de Loader y PredictorCard */}
          <Route
            path="/test"
            element={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <Loader />
                <PredictorCard
                  title="MLB Game"
                  description="Yankees vs Red Sox - 7 PM"
                  result="Ganador: Yankees"
                />
              </div>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
