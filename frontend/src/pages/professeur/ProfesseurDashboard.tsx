import React from "react";
import { useAuthStore } from "../../stores";

export const ProfesseurDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard Professeur</h1>

      <div style={{
        marginTop: "2rem",
        padding: "1.5rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px"
      }}>
        <h2>Bienvenue, {user?.firstName} {user?.lastName} !</h2>
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Vous êtes connecté en tant que professeur.
        </p>
      </div>

      <div style={{
        marginTop: "2rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem"
      }}>
        <div style={{
          padding: "1.5rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3>Mes cours</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#4CAF50" }}>0</p>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>À venir</p>
        </div>

        <div style={{
          padding: "1.5rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3>Mes élèves</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2196F3" }}>0</p>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Élèves actifs</p>
        </div>

        <div style={{
          padding: "1.5rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3>Mon planning</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#FF9800" }}>0</p>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Heures cette semaine</p>
        </div>
      </div>

      <div style={{
        marginTop: "2rem",
        padding: "1.5rem",
        backgroundColor: "#fff3cd",
        borderRadius: "8px",
        border: "1px solid #ffc107"
      }}>
        <p style={{ margin: 0 }}>
          📝 <strong>Cette page est en cours de développement.</strong> Les fonctionnalités complètes seront bientôt disponibles.
        </p>
      </div>
    </div>
  );
};
