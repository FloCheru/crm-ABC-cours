import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { PageHeader, SummaryCard } from "../../components";
import { CouponInputModal } from "../../components/domain/CouponInputModal";
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
import { professorService } from "../../services/professorService";
import { couponService } from "../../services/couponService";
import type { Coupon } from "../../types/coupon";
import type { UseCouponData } from "../../services/couponService";

export const SaisieCoupons: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "rib";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // États pour RIB
  const [ribData, setRibData] = useState({
    bankName: "",
    iban: "",
    bic: "",
  });
  const [isEditingRib, setIsEditingRib] = useState(false);
  const [isSavingRib, setIsSavingRib] = useState(false);

  // États pour Saisie de coupons
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

  // État pour la modal de saisie
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchroniser l'onglet actif avec l'URL
  useEffect(() => {
    const tab = searchParams.get("tab") || "rib";
    setActiveTab(tab);
  }, [searchParams]);

  // Charger les données au montage
  useEffect(() => {
    loadRibData();
    checkRib();
    loadAvailableCoupons();
    loadUsedCoupons();
  }, []);

  // Charger les données RIB
  const loadRibData = async () => {
    try {
      // TODO: Appeler l'API pour récupérer les données RIB
      // const data = await professorService.getMyRib();

      // Données mockées pour le moment
      const mockRibData = {
        bankName: "Banque Postale",
        iban: "FR76 1234 5678 9012 3456 7890 123",
        bic: "PSSTFRPPXXX",
      };
      setRibData(mockRibData);
    } catch (err) {
      console.error("Erreur lors du chargement du RIB:", err);
    }
  };

  const handleSaveRib = async () => {
    try {
      setIsSavingRib(true);
      // TODO: Appeler l'API pour sauvegarder le RIB
      // await professorService.updateMyRib(ribData);

      await new Promise((resolve) => setTimeout(resolve, 500)); // Simuler API call
      setIsEditingRib(false);
      await checkRib(); // Revérifier le RIB après sauvegarde
      alert("RIB enregistré avec succès !");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du RIB:", err);
      alert("Erreur lors de la sauvegarde du RIB");
    } finally {
      setIsSavingRib(false);
    }
  };

  const handleCancelRib = () => {
    setIsEditingRib(false);
    loadRibData(); // Recharger les données originales
  };

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

      // Filtrer pour afficher uniquement les coupons saisis aujourd'hui
      const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
      const todayCoupons = coupons.filter((coupon) => {
        if (!coupon.usedAt) return false;
        const usedDate = new Date(coupon.usedAt).toISOString().split("T")[0];
        return usedDate === today;
      });

      setUsedCoupons(todayCoupons);
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
      alert(
        "Veuillez sélectionner un coupon et renseigner la date de la séance"
      );
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

      // Fermer la modal
      setIsModalOpen(false);

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
      alert(
        "Erreur lors de l'annulation. Ce coupon ne peut peut-être plus être annulé."
      );
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
      <PageHeader title="Saisie des coupons" />

      <div className="container mx-auto px-4 max-w-6xl py-8">
        <Tabs
          value={activeTab}
          onValueChange={(tab: string) => {
            setActiveTab(tab);
            navigate(`?tab=${tab}`, { replace: true });
          }}
          className="w-full"
        >
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
            <TabsTrigger
              value="rib"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              RIB
            </TabsTrigger>
            <TabsTrigger
              value="saisie"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Saisie
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: RIB */}
          <TabsContent value="rib" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mon RIB
                  </h3>
                  <p className="text-sm text-gray-500">
                    Vos coordonnées bancaires pour le paiement de vos cours
                  </p>
                </div>
                {!isEditingRib && (
                  <button
                    onClick={() => setIsEditingRib(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Modifier ✏️
                  </button>
                )}
              </div>

              {isEditingRib ? (
                <>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="bankName">Nom de la banque</Label>
                      <Input
                        id="bankName"
                        type="text"
                        value={ribData.bankName}
                        onChange={(e) =>
                          setRibData({ ...ribData, bankName: e.target.value })
                        }
                        placeholder="Ex: Banque Postale"
                      />
                    </div>

                    <div>
                      <Label htmlFor="iban">IBAN *</Label>
                      <Input
                        id="iban"
                        type="text"
                        value={ribData.iban}
                        onChange={(e) =>
                          setRibData({ ...ribData, iban: e.target.value })
                        }
                        placeholder="FR76 1234 5678 9012 3456 7890 123"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: 27 caractères (FR suivi de 25 chiffres/lettres)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="bic">BIC / SWIFT *</Label>
                      <Input
                        id="bic"
                        type="text"
                        value={ribData.bic}
                        onChange={(e) =>
                          setRibData({ ...ribData, bic: e.target.value })
                        }
                        placeholder="PSSTFRPPXXX"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: 8 ou 11 caractères
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleSaveRib}
                      disabled={isSavingRib || !ribData.iban || !ribData.bic}
                    >
                      {isSavingRib ? "Enregistrement..." : "Sauvegarder"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelRib}>
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Nom de la banque
                    </div>
                    <div className="text-base text-gray-900">
                      {ribData.bankName || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">IBAN</div>
                    <div className="text-base text-gray-900 font-mono">
                      {ribData.iban || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      BIC / SWIFT
                    </div>
                    <div className="text-base text-gray-900 font-mono">
                      {ribData.bic || "-"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Saisie */}
          <TabsContent value="saisie" className="mt-6 space-y-8">
            {/* ⚠️ ALERTE RIB MANQUANT */}
            {isLoadingRib ? (
              <div>Vérification du RIB...</div>
            ) : !hasValidRib ? (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>⚠️ RIB manquant</strong> : Vous devez renseigner votre
                  RIB avant de pouvoir saisir des coupons.{" "}
                  <button
                    onClick={() => setActiveTab("rib")}
                    className="underline font-semibold"
                  >
                    → Ajouter mon RIB
                  </button>
                </AlertDescription>
              </Alert>
            ) : null}

            {/* 📊 STATISTIQUES */}
            <SummaryCard
              title="SUIVI"
              metrics={[
                {
                  value: stats.usedThisMonth,
                  label: "Coupons saisis",
                  variant: "success",
                },
                {
                  value: `${stats.totalAmountThisMonth.toFixed(2)} €`,
                  label: "Montant à venir",
                  variant: "primary",
                },
              ]}
            />

            {/* 🎟️ BOUTON SAISIE */}
            <div className="space-y-4">
              {/* Case à cocher temporaire pour les tests */}
              <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="force-rib-valid"
                  checked={hasValidRib}
                  onChange={(e) => setHasValidRib(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label
                  htmlFor="force-rib-valid"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  ⚠️ TEST : Rendre le RIB valide pour test
                </Label>
              </div>

              <Button
                onClick={() => setIsModalOpen(true)}
                disabled={!hasValidRib || isLoadingAvailable}
                className="w-full md:w-auto"
              >
                Saisir un coupon
              </Button>
            </div>

            {/* 📋 SECTION HISTORIQUE */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Coupons saisis aujourd'hui</h2>
              </CardHeader>
              <CardContent>
                {/* Tableau */}
                {isLoadingHistory ? (
                  <div>Chargement de l'historique...</div>
                ) : usedCoupons.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    Aucun coupon saisi aujourd'hui.
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
                          <tr
                            key={coupon._id}
                            className="border-b hover:bg-gray-50"
                          >
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
                                : coupon.sessionData?.sessionLocation ===
                                  "professor"
                                ? "Mon domicile"
                                : coupon.sessionData?.sessionLocation ===
                                  "online"
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de saisie de coupon */}
      <CouponInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hasValidRib={hasValidRib}
        availableCoupons={availableCoupons}
        isLoadingAvailable={isLoadingAvailable}
        selectedCouponId={selectedCouponId}
        setSelectedCouponId={setSelectedCouponId}
        sessionData={sessionData}
        setSessionData={setSessionData}
        isSubmitting={isSubmitting}
        onSubmit={handleUseCoupon}
        sevenDaysAgo={sevenDaysAgo}
        today={today}
        groupedCoupons={groupedCoupons}
      />
    </>
  );
};
