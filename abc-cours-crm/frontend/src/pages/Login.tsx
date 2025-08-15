import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input, Button } from "../components";
import { useAuth } from "../hooks/useAuth";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Récupérer la page d'origine depuis l'état de navigation
  const from = location.state?.from?.pathname || "/admin/coupons";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(credentials.email, credentials.password);
      // Rediriger vers la page d'origine ou la page par défaut
      navigate(from, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
          Connexion ABC Cours
        </h1>

        {error && (
          <div
            style={{
              color: "red",
              backgroundColor: "#fee",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={credentials.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
            placeholder="admin@abc-cours.fr"
          />

          <Input
            label="Mot de passe"
            type="password"
            value={credentials.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            style={{ width: "100%", marginTop: "1rem" }}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#666",
          }}
        >
          <p>
            <strong>Comptes de test :</strong>
          </p>
          <p>Admin: admin@abc-cours.fr / admin123</p>
          {/* <p>Professeur: prof@abc-cours.com / prof123</p>
          <p>Famille: famille@abc-cours.com / famille123</p> */}
        </div>
      </div>
    </div>
  );
};
