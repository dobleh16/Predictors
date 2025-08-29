import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

const Login = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);

  // Redirigir si ya está logueado - dentro de useEffect para evitar advertencias
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setError("");
    try {
      await signInWithPopup(auth, provider);
      // También podría redirigir aquí, aunque el useEffect lo hará también
      navigate("/dashboard");
    } catch (err) {
      setError("Error al iniciar sesión con Google");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Iniciar sesión con Google</h2>
        {error && <p style={styles.error}>{error}</p>}

        <button onClick={handleGoogleLogin} style={styles.googleButton}>
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
  },
  card: {
    padding: "30px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "300px",
  },
  googleButton: {
    padding: "10px",
    backgroundColor: "#db4437",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  error: {
    color: "red",
    fontSize: "14px",
    marginTop: "10px",
  },
};

export default Login;
