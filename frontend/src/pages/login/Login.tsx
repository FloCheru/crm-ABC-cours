import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../hooks/useAuth";

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
      console.log("[LOGIN PAGE] 🔐 Tentative de connexion pour:", credentials.email);
      const result = await login(credentials.email, credentials.password);
      console.log("[LOGIN PAGE] ✅ Connexion réussie, résultat:", result);
      console.log("[LOGIN PAGE] 🔍 requirePasswordChange?", result.requirePasswordChange);

      // Si première connexion, rediriger vers changement de mot de passe
      if (result.requirePasswordChange) {
        console.log("[LOGIN PAGE] 🔄 Redirection vers /change-password");
        navigate("/change-password", { replace: true });
      } else {
        // Déterminer la page de destination selon le rôle
        const userRole = result.user?.role;
        let destination = from;

        // Si pas de "from" spécifique ou si c'est une route par défaut, rediriger selon le rôle
        if (!location.state?.from || from === "/admin/coupons") {
          destination = userRole === "professor" ? "/professeur/dashboard" : "/admin/coupons";
        }

        console.log("[LOGIN PAGE] 🔄 Redirection vers", destination, "(rôle:", userRole + ")");
        navigate(destination, { replace: true });
      }
    } catch (error) {
      console.error("[LOGIN PAGE] ❌ Erreur de connexion:", error);
      setError(error instanceof Error ? error.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickAdminLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await login("admin@abc-cours.fr", "123456");
      // Rediriger vers la page d'origine ou la page par défaut
      navigate(from, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickProfessorLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await login("prof@abc-cours.fr", "123456");
      // Rediriger vers le dashboard professeur
      navigate("/professeur/dashboard", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
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

        {/* Bouton connexion rapide admin */}
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={handleQuickAdminLogin}
          style={{
            width: "100%",
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            opacity: 0.8,
          }}
        >
          🚀 Connexion rapide Admin
        </Button>

        {/* Bouton connexion rapide professeur */}
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={handleQuickProfessorLogin}
          style={{
            width: "100%",
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            opacity: 0.8,
          }}
        >
          📚 Connexion rapide Professeur
        </Button>

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
          <p>Admin: admin@abc-cours.fr / 123456</p>
          <p>Professeur: prof@abc-cours.fr / 123456</p>
        </div>
      </div>
    </div>
  );
};
