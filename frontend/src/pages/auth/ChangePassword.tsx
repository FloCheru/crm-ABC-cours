import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (passwords.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword(passwords.newPassword);

      // Déconnexion automatique
      logout();

      // Redirection vers login
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
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
        <h1 style={{ textAlign: "center", marginBottom: "1rem", fontSize: "24px" }}>
          Changement de mot de passe obligatoire
        </h1>

        <p style={{ textAlign: "center", color: "#666", marginBottom: "1.5rem" }}>
          Veuillez définir un nouveau mot de passe pour votre première connexion.
        </p>

        {error && (
          <div
            style={{
              color: "#dc2626",
              backgroundColor: "#fee",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="newPassword" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Nouveau mot de passe
            </label>
            <Input
              id="newPassword"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              placeholder="Min. 6 caractères"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Confirmer le mot de passe
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Retapez votre mot de passe"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={isLoading}
          >
            {isLoading ? "Changement en cours..." : "Définir le nouveau mot de passe"}
          </Button>
        </form>
      </div>
    </div>
  );
};