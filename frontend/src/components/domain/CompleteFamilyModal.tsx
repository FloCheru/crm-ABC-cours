import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { familyService } from "../../services/familyService";
import type { Family } from "../../types/family";

interface IncompleteFamilyData extends Family {
  missingFields: string[];
}

interface CompleteFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: IncompleteFamilyData | null;
  onSaveSuccess: (updatedFamily: Family) => void;
}

export const CompleteFamilyModal: React.FC<CompleteFamilyModalProps> = ({
  isOpen,
  onClose,
  family,
  onSaveSuccess,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    primaryPhone: "",
    email: "",
    street: "",
    city: "",
    postalCode: "",
  });

  // Initialiser formData quand la famille sélectionnée change
  useEffect(() => {
    if (family) {
      console.log("🔵 [MODAL] Famille sélectionnée:", {
        id: family._id,
        nom: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
        champsManquants: family.missingFields,
        adresse: family.primaryContact.address,
      });

      const initialFormData = {
        firstName: family.primaryContact.firstName || "",
        lastName: family.primaryContact.lastName || "",
        primaryPhone: family.primaryContact.primaryPhone || "",
        email: family.primaryContact.email || "",
        street: family.primaryContact.address?.street || "",
        city: family.primaryContact.address?.city || "",
        postalCode: family.primaryContact.address?.postalCode || "",
      };

      console.log("🔵 [MODAL] FormData initialisé:", initialFormData);
      setFormData(initialFormData);
      setIsEditing(false);
    }
  }, [family]);

  const handleSave = async () => {
    if (!family) return;

    console.log("🟢 [SAVE] Début sauvegarde pour famille:", family._id);
    console.log("🟢 [SAVE] Données à envoyer:", {
      firstName: formData.firstName,
      lastName: formData.lastName,
      primaryPhone: formData.primaryPhone,
      email: formData.email,
      relation: family.primaryContact.relation,
      address: {
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
      },
    });

    setIsSaving(true);

    try {
      const updatedFamily = await familyService.updatePrimaryContact(
        family._id,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          primaryPhone: formData.primaryPhone,
          email: formData.email,
          relation: family.primaryContact.relation,
          address: {
            street: formData.street,
            city: formData.city,
            postalCode: formData.postalCode,
          },
        }
      );

      console.log("🟢 [SAVE] Réponse API reçue:", updatedFamily);

      toast.success("Les informations ont été sauvegardées avec succès");

      // Fermer le modal et notifier le parent
      setIsEditing(false);
      onSaveSuccess(updatedFamily);

      console.log("✅ [SAVE] Sauvegarde terminée avec succès");
    } catch (error) {
      console.error("❌ [SAVE] Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde des informations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Réinitialiser le formulaire avec les valeurs originales
    if (family) {
      setFormData({
        firstName: family.primaryContact.firstName || "",
        lastName: family.primaryContact.lastName || "",
        primaryPhone: family.primaryContact.primaryPhone || "",
        email: family.primaryContact.email || "",
        street: family.primaryContact.address?.street || "",
        city: family.primaryContact.address?.city || "",
        postalCode: family.primaryContact.address?.postalCode || "",
      });
    }
  };

  if (!family) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Informations de la famille</DialogTitle>
          <DialogDescription>
            Détails de la famille incomplète - Cliquez sur "Compléter la fiche"
            pour ajouter les informations manquantes
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Prénom et Nom - 2 colonnes */}
          <div className="grid grid-cols-2 gap-4">
            {/* Prénom */}
            <div className="grid gap-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={
                  isEditing
                    ? formData.firstName
                    : family.primaryContact.firstName || "Non renseigné"
                }
                disabled={!isEditing}
                onChange={(e) => {
                  console.log("📝 [INPUT] firstName changé:", e.target.value);
                  setFormData({ ...formData, firstName: e.target.value });
                }}
              />
            </div>

            {/* Nom */}
            <div className="grid gap-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={
                  isEditing
                    ? formData.lastName
                    : family.primaryContact.lastName || "Non renseigné"
                }
                disabled={!isEditing}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="grid gap-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={
                isEditing
                  ? formData.primaryPhone
                  : family.primaryContact.primaryPhone || "Non renseigné"
              }
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, primaryPhone: e.target.value })
              }
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={
                isEditing
                  ? formData.email
                  : family.primaryContact.email || "Non renseigné"
              }
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* Adresse - 2 colonnes */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rue - prend toute la largeur */}
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="street">Rue</Label>
              <Input
                id="street"
                value={
                  isEditing
                    ? formData.street
                    : family.primaryContact.address?.street || "Non renseigné"
                }
                disabled={!isEditing}
                onChange={(e) => {
                  console.log("📝 [INPUT] street changé:", e.target.value);
                  setFormData({ ...formData, street: e.target.value });
                }}
              />
            </div>

            {/* Ville */}
            <div className="grid gap-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={
                  isEditing
                    ? formData.city
                    : family.primaryContact.address?.city || "Non renseigné"
                }
                disabled={!isEditing}
                onChange={(e) => {
                  console.log("📝 [INPUT] city changé:", e.target.value);
                  setFormData({ ...formData, city: e.target.value });
                }}
              />
            </div>

            {/* Code postal */}
            <div className="grid gap-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={
                  isEditing
                    ? formData.postalCode
                    : family.primaryContact.address?.postalCode ||
                      "Non renseigné"
                }
                disabled={!isEditing}
                onChange={(e) => {
                  console.log("📝 [INPUT] postalCode changé:", e.target.value);
                  setFormData({ ...formData, postalCode: e.target.value });
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 ml-auto">
            {!isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    console.log("🟣 [EDIT] Passage en mode édition");
                    console.log("🟣 [EDIT] FormData actuel:", formData);
                    setIsEditing(true);
                  }}
                >
                  Compléter la fiche
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
