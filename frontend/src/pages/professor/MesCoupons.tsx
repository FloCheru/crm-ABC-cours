import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Textarea } from "../../components/ui/textarea";
import { professorService } from "../../services/professorService";
import { couponService } from "../../services/couponService";
import type { Coupon } from "../../types/coupon";
import type { UseCouponData } from "../../services/couponService";

export const MesCoupons: React.FC = () => {
  // États principaux
  const [hasValidRib, setHasValidRib] = useState<boolean>(false);
  const [isLoadingRib, setIsLoadingRib] = useState(true);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<Coupon[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // États formulaire de saisie
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [sessionData, setSessionData] = useState<{
    sessionDate: string;
    sessionLocation: "home" | "professor" | "online";
    notes: string;
  }>({
    sessionDate: "",
    sessionLocation: "home",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États filtres historique
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    studentId: "",
    status: "all" as "all" | "used" | "deleted",
  });

  // Charger les données au montage
  useEffect(() => {
    checkRib();
    loadAvailableCoupons();
    loadUsedCoupons();
  }, []);

  // Vérifier si le RIB est valide
  const checkRib = async () => {
    try {
      setIsLoadingRib(true);
      const isValid = await professorService.hasValidRib();
      setHasValidRib(isValid);
    } catch (err) {
      console.error("Erreur lors de la vérification du RIB:", err);
      setHasValidRib(false);
    } finally {
      setIsLoadingRib(false);
    }
  };

  // Charger les coupons disponibles
  const loadAvailableCoupons = async () => {
    try {
      setIsLoadingAvailable(true);
      const coupons = await couponService.getMyAvailableCoupons();
      setAvailableCoupons(coupons);
    } catch (err) {
      console.error("Erreur lors du chargement des coupons disponibles:", err);
      setAvailableCoupons([]);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  // Charger l'historique des coupons saisis
  const loadUsedCoupons = async () => {
    try {
      setIsLoadingHistory(true);
      const filterParams: any = {};
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;
      if (filters.studentId) filterParams.studentId = filters.studentId;
      if (filters.status !== "all") filterParams.status = filters.status;

      const coupons = await couponService.getMyCouponsHistory(filterParams);
      setUsedCoupons(coupons);
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
      setUsedCoupons([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Appliquer les filtres
  useEffect(() => {
    loadUsedCoupons();
  }, [filters]);

  // Gérer la saisie d'un coupon
  const handleUseCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCouponId || !sessionData.sessionDate) {
      alert("Veuillez sélectionner un coupon et renseigner la date de la séance");
      return;
    }

    try {
      setIsSubmitting(true);

      const useCouponData: UseCouponData = {
        sessionDate: sessionData.sessionDate,
        sessionDuration: 1, // 1 coupon = 1 heure
        sessionLocation: sessionData.sessionLocation,
        notes: sessionData.notes || undefined,
      };

      await couponService.useMyCoupon(selectedCouponId, useCouponData);

      // Réinitialiser le formulaire
      setSelectedCouponId("");
      setSessionData({
        sessionDate: "",
        sessionLocation: "home",
        notes: "",
      });

      // Recharger les données
      await Promise.all([loadAvailableCoupons(), loadUsedCoupons()]);

      alert("Coupon saisi avec succès !");
    } catch (err) {
      console.error("Erreur lors de la saisie du coupon:", err);
      alert("Erreur lors de la saisie du coupon. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Annuler la saisie d'un coupon
  const handleCancelCoupon = async (couponId: string) => {
    const reason = prompt("Raison de l'annulation (obligatoire) :");
    if (!reason || reason.trim() === "") {
      alert("La raison est obligatoire pour annuler un coupon.");
      return;
    }

    try {
      await couponService.cancelMyCouponUsage(couponId, reason);
      alert("Saisie annulée avec succès.");
      await Promise.all([loadAvailableCoupons(), loadUsedCoupons()]);
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err);
      alert("Erreur lors de l'annulation. Ce coupon ne peut peut-être plus être annulé.");
    }
  };

  // Calculer les statistiques
  const stats = {
    availableCount: availableCoupons.length,
    usedThisMonth: usedCoupons.filter((c) => {
      if (!c.usedAt) return false;
      const usedDate = new Date(c.usedAt);
      const now = new Date();
      return (
        usedDate.getMonth() === now.getMonth() &&
        usedDate.getFullYear() === now.getFullYear() &&
        c.status === "used"
      );
    }).length,
    totalAmountThisMonth: usedCoupons
      .filter((c) => {
        if (!c.usedAt) return false;
        const usedDate = new Date(c.usedAt);
        const now = new Date();
        return (
          usedDate.getMonth() === now.getMonth() &&
          usedDate.getFullYear() === now.getFullYear() &&
          c.status === "used"
        );
      })
      .reduce((sum, c) => sum + (c.professorSalary || 0), 0),
  };

  // Regrouper les coupons disponibles par série (NDR/Élève)
  const groupedCoupons = availableCoupons.reduce((acc, coupon) => {
    const key = `${coupon.familyName || "Famille inconnue"} - ${
      coupon.studentName || "Élève inconnu"
    } - ${coupon.subjectName || "Matière inconnue"}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(coupon);
    return acc;
  }, {} as Record<string, Coupon[]>);

  // Obtenir la date min/max pour la saisie (7 jours avant / aujourd'hui)
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <>
      <PageHeader title="Mes coupons" />

      <div className="px-4 py-8 w-full space-y-8">

        {/* ⚠️ ALERTE RIB MANQUANT */}
        {isLoadingRib ? (
          <div>Vérification du RIB...</div>
        ) : !hasValidRib ? (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>⚠️ RIB manquant</strong> : Vous devez renseigner votre RIB
              avant de pouvoir saisir des coupons.{" "}
              <Link
                to="/professor/profil?tab=rib"
                className="underline font-semibold"
              >
                → Ajouter mon RIB
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* 📊 STATISTIQUES */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Statistiques</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.availableCount}
                </div>
                <div className="text-sm text-gray-600">Coupons disponibles</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {stats.usedThisMonth}
                </div>
                <div className="text-sm text-gray-600">Saisis ce mois</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.totalAmountThisMonth.toFixed(2)} €
                </div>
                <div className="text-sm text-gray-600">
                  À facturer ce mois
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🎟️ SECTION SAISIE */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Saisir un coupon</h2>
          </CardHeader>
          <CardContent>
            {isLoadingAvailable ? (
              <div>Chargement des coupons disponibles...</div>
            ) : availableCoupons.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                Aucun coupon disponible pour le moment.
              </div>
            ) : (
              <form onSubmit={handleUseCoupon} className="space-y-4">
                {/* Sélection du coupon */}
                <div>
                  <Label htmlFor="coupon-select">
                    Sélectionner un coupon<span className="text-red-500">*</span>
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
                            {label} ({coupons.length} coupon{coupons.length > 1 ? "s" : ""})
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
                <div>
                  <Label htmlFor="session-date">
                    Date de la séance<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={sessionData.sessionDate}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, sessionDate: e.target.value })
                    }
                    min={sevenDaysAgo}
                    max={today}
                    required
                    disabled={!hasValidRib || isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 7 jours en arrière
                  </p>
                </div>

                {/* Lieu de la séance */}
                <div>
                  <Label htmlFor="session-location">
                    Lieu de la séance<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={sessionData.sessionLocation}
                    onValueChange={(value: "home" | "professor" | "online") =>
                      setSessionData({ ...sessionData, sessionLocation: value })
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
                <div>
                  <Label htmlFor="session-notes">Notes (optionnel)</Label>
                  <Textarea
                    id="session-notes"
                    value={sessionData.notes}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, notes: e.target.value })
                    }
                    placeholder="Commentaires sur la séance..."
                    rows={3}
                    disabled={!hasValidRib || isSubmitting}
                  />
                </div>

                {/* Bouton de validation */}
                <Button
                  type="submit"
                  disabled={
                    !hasValidRib ||
                    !selectedCouponId ||
                    !sessionData.sessionDate ||
                    isSubmitting
                  }
                  className="w-full"
                >
                  {isSubmitting ? "Enregistrement..." : "Valider la saisie"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 📋 SECTION HISTORIQUE */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Mes coupons saisis</h2>
          </CardHeader>
          <CardContent>
            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="filter-start-date">Date de début</Label>
                <Input
                  id="filter-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="filter-end-date">Date de fin</Label>
                <Input
                  id="filter-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="filter-status">Statut</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value: "all" | "used" | "deleted") =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger id="filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="used">Utilisés</SelectItem>
                    <SelectItem value="deleted">Annulés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      startDate: "",
                      endDate: "",
                      studentId: "",
                      status: "all",
                    });
                  }}
                  className="w-full"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>

            {/* Tableau */}
            {isLoadingHistory ? (
              <div>Chargement de l'historique...</div>
            ) : usedCoupons.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Aucun coupon saisi pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3">Code</th>
                      <th className="text-left p-3">Élève</th>
                      <th className="text-left p-3">Matière</th>
                      <th className="text-left p-3">Date séance</th>
                      <th className="text-left p-3">Lieu</th>
                      <th className="text-right p-3">Montant</th>
                      <th className="text-center p-3">Statut</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usedCoupons.map((coupon) => (
                      <tr key={coupon._id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono">{coupon.code}</td>
                        <td className="p-3">{coupon.studentName || "-"}</td>
                        <td className="p-3">{coupon.subjectName || "-"}</td>
                        <td className="p-3">
                          {coupon.sessionData?.sessionDate
                            ? new Date(
                                coupon.sessionData.sessionDate
                              ).toLocaleDateString("fr-FR")
                            : "-"}
                        </td>
                        <td className="p-3">
                          {coupon.sessionData?.sessionLocation === "home"
                            ? "Domicile élève"
                            : coupon.sessionData?.sessionLocation === "professor"
                            ? "Mon domicile"
                            : coupon.sessionData?.sessionLocation === "online"
                            ? "En ligne"
                            : "-"}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {coupon.professorSalary
                            ? `${coupon.professorSalary.toFixed(2)} €`
                            : "-"}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              coupon.status === "used"
                                ? "default"
                                : coupon.status === "deleted"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {coupon.status === "used"
                              ? "Utilisé"
                              : coupon.status === "deleted"
                              ? "Annulé"
                              : coupon.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {coupon.status === "used" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelCoupon(coupon._id)}
                            >
                              Annuler
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};