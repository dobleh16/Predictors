// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import { useTranslation } from "react-i18next";
import { auth } from "../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav
      style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* <img src={logo} alt="Predictors" style={{ height: 32 }} /> */}
        <Link
          to="/dashboard"
          style={{
            fontWeight: 700,
            fontSize: 18,
            textDecoration: "none",
            color: "#111827",
          }}
        >
          Predictors
        </Link>
        <div style={{ display: "flex", gap: 12, marginLeft: 16 }}>
          <Link to="/mlb" style={{ textDecoration: "none", color: "#374151" }}>
            {t("mlb")}
          </Link>
          <Link to="/nba" style={{ textDecoration: "none", color: "#374151" }}>
            {t("nba")}
          </Link>
          <Link to="/nfl" style={{ textDecoration: "none", color: "#374151" }}>
            {t("nfl")}
          </Link>
          <Link
            to="/soccer"
            style={{ textDecoration: "none", color: "#374151" }}
          >
            {t("soccer")}
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LanguageToggle />
        {!user ? (
          <Link
            to="/login"
            style={{ textDecoration: "none", color: "#2563eb" }}
          >
            {t("login")}
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {t("logout")}
          </button>
        )}
      </div>
    </nav>
  );
}
