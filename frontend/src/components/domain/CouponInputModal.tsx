import React, { useEffect } from "react";
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
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import type { Coupon } from "../../types/coupon";

interface CouponInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasValidRib: boolean;
  availableCoupons: Coupon[];
  isLoadingAvailable: boolean;
  selectedCouponId: string;
  setSelectedCouponId: (id: string) => void;
  sessionData: {
    sessionDate: string;
    sessionLocation: "home" | "professor" | "online";
    notes: string;
  };
  setSessionData: (data: {
    sessionDate: string;
    sessionLocation: "home" | "professor" | "online";
    notes: string;
  }) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  sevenDaysAgo: string;
  today: string;
  groupedCoupons: Record<string, Coupon[]>;
}

export const CouponInputModal: React.FC<CouponInputModalProps> = ({
  isOpen,
  onClose,
  hasValidRib,
  availableCoupons,
  isLoadingAvailable,
  selectedCouponId,
  setSelectedCouponId,
  sessionData,
  setSessionData,
  isSubmitting,
  onSubmit,
  sevenDaysAgo,
  today,
  groupedCoupons,
}) => {
  // Réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedCouponId("");
      setSessionData({
        sessionDate: "",
        sessionLocation: "home",
        notes: "",
      });
    }
  }, [isOpen, setSelectedCouponId, setSessionData]);

  const handleCancel = () => {
    setSelectedCouponId("");
    setSessionData({
      sessionDate: "",
      sessionLocation: "home",
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saisir un coupon</DialogTitle>
          <DialogDescription>
            Enregistrez l'utilisation d'un coupon pour une séance de cours
          </DialogDescription>
        </DialogHeader>

        {isLoadingAvailable ? (
          <div className="py-8 text-center text-gray-500">
            Chargement des coupons disponibles...
          </div>
        ) : availableCoupons.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Aucun coupon disponible pour le moment.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Sélection du coupon */}
            <div className="grid gap-2">
              <Label htmlFor="coupon-select">
                Sélectionner un coupon
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedCouponId}
                onValueChange={setSelectedCouponId}
                disabled={!hasValidRib || isSubmitting}
              >
                <SelectTrigger id="coupon-select">
                  <SelectValue placeholder="Choisir un coupon..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedCoupons).map(([label, coupons]) => (
                    <React.Fragment key={label}>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100">
                        {label} ({coupons.length} coupon
                        {coupons.length > 1 ? "s" : ""})
                      </div>
                      {coupons.map((coupon) => (
                        <SelectItem key={coupon._id} value={coupon._id}>
                          {coupon.code}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Date de la séance */}
            <div className="grid gap-2">
              <Label htmlFor="session-date">
                Date de la séance<span className="text-red-500">*</span>
              </Label>
              <Input
                id="session-date"
                type="date"
                value={sessionData.sessionDate}
                onChange={(e) =>
                  setSessionData({
                    ...sessionData,
                    sessionDate: e.target.value,
                  })
                }
                min={sevenDaysAgo}
                max={today}
                required
                disabled={!hasValidRib || isSubmitting}
              />
              <p className="text-xs text-gray-500">Maximum 7 jours en arrière</p>
            </div>

            {/* Lieu de la séance */}
            <div className="grid gap-2">
              <Label htmlFor="session-location">
                Lieu de la séance<span className="text-red-500">*</span>
              </Label>
              <Select
                value={sessionData.sessionLocation}
                onValueChange={(value: "home" | "professor" | "online") =>
                  setSessionData({
                    ...sessionData,
                    sessionLocation: value,
                  })
                }
                disabled={!hasValidRib || isSubmitting}
              >
                <SelectTrigger id="session-location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Domicile de l'élève</SelectItem>
                  <SelectItem value="professor">Mon domicile</SelectItem>
                  <SelectItem value="online">En ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes optionnelles */}
            <div className="grid gap-2">
              <Label htmlFor="session-notes">Notes (optionnel)</Label>
              <Textarea
                id="session-notes"
                value={sessionData.notes}
                onChange={(e) =>
                  setSessionData({
                    ...sessionData,
                    notes: e.target.value,
                  })
                }
                placeholder="Commentaires sur la séance..."
                rows={3}
                disabled={!hasValidRib || isSubmitting}
              />
            </div>

            <DialogFooter>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !hasValidRib ||
                    !selectedCouponId ||
                    !sessionData.sessionDate ||
                    isSubmitting
                  }
                  className="flex-1 sm:flex-none"
                >
                  {isSubmitting ? "Enregistrement..." : "Valider la saisie"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};