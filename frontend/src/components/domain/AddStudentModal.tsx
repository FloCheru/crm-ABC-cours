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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { familyService } from "../../services/familyService";
import { getAllGrades } from "../../constants/schoolLevels";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  onSaveSuccess: () => void;
  onPrefillTest?: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  familyId,
  onSaveSuccess,
  onPrefillTest,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    schoolName: "",
    grade: "",
    email: "",
    phone: "",
    courseLocation: "domicile" as "domicile" | "professeur" | "autre",
    notes: "",
  });

  const grades = getAllGrades();

  // Réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        birthDate: "",
        schoolName: "",
        grade: "",
        email: "",
        phone: "",
        courseLocation: "domicile",
        notes: "",
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (!familyId || familyId === "undefined") {
      toast.error("Impossible d'ajouter un élève : famille non sélectionnée");
      return;
    }

    setIsSaving(true);

    try {
      const studentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate || "",
        school: {
          name: formData.schoolName.trim(),
          grade: formData.grade,
        },
        contact: {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        },
        courseLocation: {
          type: formData.courseLocation,
          usesFamilyAddress: true, // Par défaut, utilise l'adresse de la famille
        },
        notes: formData.notes.trim() || undefined,
        familyId,
      };

      await familyService.addStudent(familyId, studentData);

      toast.success("Élève ajouté avec succès");
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de l'élève:", error);
      toast.error("Erreur lors de l'ajout de l'élève");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      birthDate: "",
      schoolName: "",
      grade: "",
      email: "",
      phone: "",
      courseLocation: "domicile",
      notes: "",
    });
    onClose();
  };

  const handlePrefill = () => {
    setFormData({
      firstName: "Test",
      lastName: "Élève",
      birthDate: "2010-05-15",
      schoolName: "Collège Victor Hugo",
      grade: "5ème",
      email: "test.eleve@example.com",
      phone: "06 12 34 56 78",
      courseLocation: "domicile",
      notes: "Élève de test - créé automatiquement",
    });
    if (onPrefillTest) {
      onPrefillTest();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un élève</DialogTitle>
          <DialogDescription>
            Ajoutez un nouvel élève à la famille
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Prénom et Nom - 2 colonnes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Prénom de l'élève"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Nom de l'élève"
              />
            </div>
          </div>

          {/* Date de naissance */}
          <div className="grid gap-2">
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
            />
          </div>

          {/* École et Classe - 2 colonnes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="schoolName">École</Label>
              <Input
                id="schoolName"
                value={formData.schoolName}
                onChange={(e) =>
                  setFormData({ ...formData, schoolName: e.target.value })
                }
                placeholder="Nom de l'école"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grade">Classe</Label>
              <Select
                value={formData.grade}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact - 2 colonnes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          {/* Lieu des cours */}
          <div className="grid gap-2">
            <Label htmlFor="courseLocation">Lieu des cours</Label>
            <Select
              value={formData.courseLocation}
              onValueChange={(value: "domicile" | "professeur" | "autre") =>
                setFormData({ ...formData, courseLocation: value })
              }
            >
              <SelectTrigger id="courseLocation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="domicile">Domicile</SelectItem>
                <SelectItem value="professeur">Chez le professeur</SelectItem>
                <SelectItem value="autre">Lieu neutre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Informations complémentaires..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Annuler
            </Button>
            {onPrefillTest && (
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrefill}
                disabled={isSaving}
              >
                ✨ Préremplir
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              onClick={handleSave}
              disabled={isSaving || !formData.firstName || !formData.lastName}
            >
              {isSaving ? "Enregistrement..." : "Ajouter"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
