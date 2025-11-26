import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { subjectService } from "../../../services/subjectService";
import type { Subject } from "../../../types/subject";

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null; // null = création, Subject = édition
  onSaveSuccess: () => void;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  subject,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    newCategory: "",
  });

  // Charger les catégories existantes
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const cats = await subjectService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Erreur chargement catégories:", error);
    }
  };

  // Pré-remplir si édition
  useEffect(() => {
    if (isOpen && subject) {
      setFormData({
        name: subject.name,
        description: subject.description || "",
        category: subject.category,
        newCategory: "",
      });
      setShowNewCategory(false);
    } else if (isOpen) {
      // Reset pour création
      setFormData({
        name: "",
        description: "",
        category: "",
        newCategory: "",
      });
      setShowNewCategory(false);
    }
  }, [isOpen, subject]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Le nom de la matière est requis");
      return;
    }

    const finalCategory = showNewCategory
      ? formData.newCategory.trim()
      : formData.category;

    if (!finalCategory) {
      toast.error("La catégorie est requise");
      return;
    }

    setIsSaving(true);

    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: finalCategory,
      };

      if (subject) {
        // Édition
        await subjectService.updateSubject(subject._id, data);
        toast.success("Matière modifiée avec succès");
      } else {
        // Création
        await subjectService.createSubject(data);
        toast.success("Matière créée avec succès");
      }

      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast.error(
        subject ? "Erreur lors de la modification" : "Erreur lors de la création"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", category: "", newCategory: "" });
    setShowNewCategory(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {subject ? "Modifier la matière" : "Ajouter une matière"}
          </DialogTitle>
          <DialogDescription>
            {subject
              ? "Modifiez les informations de la matière"
              : "Créez une nouvelle matière"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nom */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Nom de la matière <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Mathématiques"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description optionnelle..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={3}
            />
          </div>

          {/* Catégorie */}
          <div className="grid gap-2">
            <Label htmlFor="category">
              Catégorie <span className="text-red-500">*</span>
            </Label>
            {!showNewCategory ? (
              <>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    if (value === "__new__") {
                      setShowNewCategory(true);
                      setFormData({ ...formData, category: "" });
                    } else {
                      setFormData({ ...formData, category: value });
                    }
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      + Créer une nouvelle catégorie
                    </SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={formData.newCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, newCategory: e.target.value })
                  }
                  placeholder="Nouvelle catégorie"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewCategory(false);
                    setFormData({ ...formData, newCategory: "" });
                  }}
                >
                  Annuler
                </Button>
              </div>
            )}
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
            <Button
              type="button"
              variant="default"
              onClick={handleSave}
              disabled={
                isSaving ||
                !formData.name.trim() ||
                (!showNewCategory && !formData.category) ||
                (showNewCategory && !formData.newCategory.trim())
              }
            >
              {isSaving
                ? "Enregistrement..."
                : subject
                ? "Modifier"
                : "Ajouter"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};