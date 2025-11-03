import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
  isDeleting?: boolean;
}

export const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  isDeleting = false,
}) => {
  console.log("🗑️ [MODAL] DeleteStudentModal render:", { isOpen, studentName, isDeleting });

  const handleConfirm = () => {
    console.log("✅ [MODAL] Bouton Supprimer cliqué");
    onConfirm();
  };

  const handleClose = () => {
    console.log("❌ [MODAL] Modal fermée");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Supprimer l'élève</DialogTitle>
          </div>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'élève{" "}
            <span className="font-semibold text-foreground">{studentName}</span>{" "}
            ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
