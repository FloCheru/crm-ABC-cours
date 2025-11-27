import React, { useState } from "react";
import { Button } from "../components";
import { Copy, Check, X } from "lucide-react";

interface TemporaryPasswordModalProps {
  isOpen: boolean;
  temporaryPassword: string;
  professorName: string;
  professorEmail: string;
  onClose: () => void;
}

export const TemporaryPasswordModal: React.FC<TemporaryPasswordModalProps> = ({
  isOpen,
  temporaryPassword,
  professorName,
  professorEmail,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          maxWidth: "500px",
          width: "90%",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>Mot de passe temporaire généré</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} color="#666" />
          </button>
        </div>
        {/* Message de succès */}
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "1rem",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          ✅ Le professeur <strong>{professorName}</strong> a été créé avec succès !
        </div>

        {/* Informations */}
        <div>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "14px", color: "#666" }}>
            <strong>Email :</strong> {professorEmail}
          </p>
        </div>

        {/* Mot de passe temporaire */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "14px" }}>
            Mot de passe temporaire :
          </label>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              backgroundColor: "#f9fafb",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
            }}
          >
            <code
              style={{
                flex: 1,
                fontFamily: "monospace",
                fontSize: "16px",
                fontWeight: "600",
                color: "#111827",
                letterSpacing: "0.05em",
                wordBreak: "break-all",
              }}
            >
              {temporaryPassword}
            </code>
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: copied ? "#059669" : "#2354a2",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                whiteSpace: "nowrap",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1e40af";
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2354a2";
                }
              }}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copié !
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copier
                </>
              )}
            </button>
          </div>
        </div>

        {/* Avertissement */}
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fcd34d",
            color: "#92400e",
            padding: "1rem",
            borderRadius: "8px",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          <strong>⚠️ Important :</strong> Ce mot de passe ne sera affichée qu'une seule fois.
          Assurez-vous de le copier et de le communiquer au professeur pour sa première connexion.
          Il devra le changer lors de sa première connexion.
        </div>

        {/* Bouton fermer */}
        <Button
          onClick={onClose}
          style={{ width: "100%", marginTop: "1rem" }}
        >
          Fermer
        </Button>
      </div>
    </div>
  );
};