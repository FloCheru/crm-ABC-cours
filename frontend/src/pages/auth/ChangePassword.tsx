import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PasswordChangeModal } from "../../components/professor/PasswordChangeModal";

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleClose = async () => {
    // Déconnexion automatique après changement de MDP
    await logout();

    // Redirection vers login
    navigate("/login", { replace: true });
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
      <PasswordChangeModal
        isOpen={true}
        onClose={handleClose}
        mode="self"
      />
    </div>
  );
};