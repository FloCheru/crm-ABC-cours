import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components";
import { Input } from "../../components/ui/input";
import { authService } from "../../services/authService";
import { professorService } from "../../services/professorService";

// Schema Zod pour la validation du formulaire
const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Minimum 6 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "self" | "admin";
  professor?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  mode,
  professor,
}) => {
  // React Hook Form avec validation Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // États pour mode "admin"
  const [adminMode, setAdminMode] = useState<"options" | "generated">("options");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // États communs
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Réinitialiser les états quand la modal se ferme
  React.useEffect(() => {
    if (!isOpen) {
      reset();
      setAdminMode("options");
      setGeneratedPassword(null);
      setIsCopied(false);
      setServerError("");
    }
  }, [isOpen, reset]);

  // ============ HANDLERS MODE "SELF" ============

  const onSubmitPassword = async (data: PasswordFormData) => {
    setServerError("");
    setIsLoading(true);

    try {
      await authService.changePassword(data.newPassword);
      toast.success("Mot de passe changé avec succès");
      onClose(); // Le parent gère la déconnexion et la redirection
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  // ============ HANDLERS MODE "ADMIN" ============

  const handleSendEmail = async () => {
    if (!professor) return;

    const confirmed = window.confirm(
      `Envoyer un nouveau mot de passe temporaire à ${professor.email} ?\n\nLe professeur recevra un email avec ses identifiants.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    setServerError("");

    try {
      await professorService.sendPasswordEmail(professor._id);
      toast.success(`Mot de passe envoyé à ${professor.email}`, {
        description: "Le professeur recevra un email avec ses identifiants de connexion.",
      });
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur lors de l'envoi du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = async () => {
    if (!professor) return;

    const confirmed = window.confirm(
      `Générer un nouveau mot de passe temporaire pour ${professor.firstName} ${professor.lastName} ?\n\nLe mot de passe actuel sera remplacé.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    setServerError("");

    try {
      const { temporaryPassword } = await professorService.resetPassword(professor._id);
      setGeneratedPassword(temporaryPassword);
      setAdminMode("generated");
      toast.success("Mot de passe généré avec succès");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur lors de la génération du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;

    navigator.clipboard.writeText(generatedPassword);
    setIsCopied(true);
    toast.success("Mot de passe copié dans le presse-papier");

    // Réinitialiser l'icône après 2 secondes
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Ne pas afficher la modal si elle n'est pas ouverte
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={mode === "admin" ? onClose : undefined} // Clic en dehors ferme la modal en mode admin seulement
    >
      <div
        className={`bg-white rounded-lg shadow-lg ${
          mode === "self" ? "max-w-md" : "max-w-lg"
        } w-full mx-4`}
        onClick={(e) => e.stopPropagation()} // Empêcher la fermeture au clic sur le contenu
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "self"
              ? "Changement de mot de passe obligatoire"
              : `Gestion du mot de passe de ${professor?.firstName} ${professor?.lastName}`}
          </h2>
          {mode === "self" && (
            <p className="mt-2 text-sm text-gray-600">
              Veuillez définir un nouveau mot de passe pour votre première connexion.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Message d'erreur serveur */}
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {serverError}
            </div>
          )}

          {mode === "self" ? (
            // ========== MODE SELF : Formulaire de changement de MDP ==========
            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  {...register("newPassword")}
                  placeholder="Min. 6 caractères"
                  disabled={isLoading}
                  aria-invalid={errors.newPassword ? "true" : "false"}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Retapez votre mot de passe"
                  disabled={isLoading}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" variant="primary" disabled={isLoading} style={{ width: "100%", marginTop: "1.5rem" }}>
                {isLoading ? "Changement en cours..." : "Définir le nouveau mot de passe"}
              </Button>
            </form>
          ) : (
            // ========== MODE ADMIN : Options ou mot de passe généré ==========
            <div>
              {adminMode === "options" ? (
                // Affichage des 2 options
                <div className="space-y-6">
                  {/* Option 1 : Envoyer par email */}
                  <div>
                    <Button
                      variant="primary"
                      onClick={handleSendEmail}
                      disabled={isLoading}
                      style={{ width: "100%" }}
                    >
                      <Mail className="w-4 h-4" style={{ marginRight: "8px" }} />
                      Envoyer un mot de passe par email
                    </Button>
                    <p className="mt-2 text-sm text-gray-600">
                      Un nouveau mot de passe temporaire sera généré et envoyé à{" "}
                      <span className="font-medium">{professor?.email}</span>
                    </p>
                  </div>

                  {/* Séparateur */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OU</span>
                    </div>
                  </div>

                  {/* Option 2 : Générer un mot de passe */}
                  <div>
                    <Button
                      variant="secondary"
                      onClick={handleGeneratePassword}
                      disabled={isLoading}
                      style={{ width: "100%" }}
                    >
                      <RefreshCw className="w-4 h-4" style={{ marginRight: "8px" }} />
                      Générer un nouveau mot de passe
                    </Button>
                    <p className="mt-2 text-sm text-gray-600">
                      Générer un mot de passe temporaire et le copier dans le presse-papier
                    </p>
                  </div>
                </div>
              ) : (
                // Affichage du mot de passe généré
                <div className="space-y-4">
                  {/* Alert info */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
                    ℹ️ Ce mot de passe est temporaire. Le professeur devra le changer à sa première connexion.
                  </div>

                  {/* Mot de passe en grand */}
                  <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2 text-center">
                      Mot de passe temporaire :
                    </p>
                    <p className="text-3xl font-mono font-bold text-primary text-center select-all tracking-wider">
                      {generatedPassword}
                    </p>
                  </div>

                  {/* Bouton copier */}
                  <Button
                    variant="primary"
                    onClick={handleCopyPassword}
                    style={{ width: "100%" }}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" style={{ marginRight: "8px" }} />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" style={{ marginRight: "8px" }} />
                        Copier le mot de passe
                      </>
                    )}
                  </Button>

                  {/* Bouton fermer */}
                  <Button variant="outline" onClick={onClose} style={{ width: "100%" }}>
                    Fermer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};