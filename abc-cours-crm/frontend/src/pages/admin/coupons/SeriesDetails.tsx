import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  Button,
  Table,
  StatusBadge,
  Input,
  ButtonGroup,
  DataCard,
} from "../../../components";
import { couponSeriesService } from "../../../services/couponSeriesService";
import { getFamilyDisplayName, generateCouponSeriesName, getBeneficiariesDisplay } from "../../../utils/familyNameUtils";
import type { CouponSeries, Coupon } from "../../../types/coupon";
import { useCouponSeriesGlobal } from "../../../hooks/useCouponSeriesGlobal";

// Type pour les données du tableau avec l'id requis
type TableRowData = Coupon & { id: string };

export const SeriesDetails: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Utilisation du nouveau store global pour les séries
  const {
    loadSeriesDetails,
    getSeriesDetails,
  } = useCouponSeriesGlobal();

  const [series, setSeries] = useState<CouponSeries | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // States pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<CouponSeries>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDetails = async () => {
      if (!seriesId) return;

      try {
        setIsLoading(true);
        setError("");

        // Vérifier d'abord le cache
        const cachedDetails = getSeriesDetails(seriesId);
        if (cachedDetails) {
          console.log('🚀 [SERIES-DETAILS] Using cached data');
          setSeries(cachedDetails.series);
          setCoupons(cachedDetails.coupons);
          setIsLoading(false);
          return;
        }

        // Charger depuis l'API via le store
        console.log('🚀 [SERIES-DETAILS] Loading from API...');
        const details = await loadSeriesDetails(seriesId);
        setSeries(details.series);
        setCoupons(details.coupons);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
        console.error("Erreur lors du chargement des détails:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [seriesId, loadSeriesDetails, getSeriesDetails]);

  const handleResendCoupons = () => {
    // TODO: Implémenter l'envoi des coupons
    console.log("Renvoyer les coupons pour la série:", seriesId);
    alert("Fonction à implémenter : Renvoyer les coupons");
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Annuler les modifications
      setEditedData({});
      setValidationErrors({});
      setIsEditing(false);
    } else {
      // Entrer en mode édition
      if (series) {
        setEditedData({
          hourlyRate: series.hourlyRate,
          totalCoupons: series.totalCoupons,
          status: series.status,
          studentId: series.studentId,
          familyId: series.familyId,
          subject: series.subject,
        });
      }
      setIsEditing(true);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validation des champs obligatoires
    if (!editedData.hourlyRate || editedData.hourlyRate <= 0) {
      errors.hourlyRate = "Le tarif horaire est requis et doit être positif";
    }
    if (!editedData.totalCoupons || editedData.totalCoupons <= 0) {
      errors.totalCoupons = "Le nombre de coupons est requis et doit être positif";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !seriesId) {
      return;
    }

    try {
      setIsSaving(true);
      const updateData = {
        ...editedData,
        familyId: typeof editedData.familyId === 'object' ? editedData.familyId._id : editedData.familyId,
        studentId: typeof editedData.studentId === 'object' ? editedData.studentId._id : editedData.studentId,
        subject: typeof editedData.subject === 'object' ? editedData.subject._id : editedData.subject
      };
      const updatedSeries = await couponSeriesService.updateCouponSeries(seriesId, updateData);
      setSeries(updatedSeries);
      setEditedData({});
      setIsEditing(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      setError("Impossible de sauvegarder les modifications");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    console.log("Recherche:", searchTerm);
  };

  const handleReset = () => {
    setSearchTerm("");
  };

  // Filtrer les coupons selon le terme de recherche
  const filteredCoupons = coupons.filter((coupon) => {
    // Utiliser les données de la série pour la famille et les bénéficiaires
    const familyName = (series?.familyId && typeof series.familyId === 'object' && series.familyId.primaryContact)
      ? `${series.familyId.primaryContact.firstName} ${series.familyId.primaryContact.lastName}`
      : "";
    const beneficiariesName = getBeneficiariesDisplay(series);

    return (
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiariesName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Transformer les données pour le tableau
  const tableData: TableRowData[] = filteredCoupons.map((coupon) => ({
    ...coupon,
    id: coupon._id,
  }));

  // Définition des colonnes du tableau des coupons
  const couponsColumns = [
    {
      key: "code",
      label: "N°",
      render: (_: unknown, _row: TableRowData) => (
        <div className="font-medium">{_row.code}</div>
      ),
    },
    {
      key: "series",
      label: "Série",
      render: (_: unknown, _row: TableRowData) => {
        if (!series) return "Chargement...";
        return generateCouponSeriesName(series.familyId, series.createdAt);
      },
    },
    {
      key: "family",
      label: "Famille",
      render: (_: unknown, _row: TableRowData) => {
        if (!series) return "Chargement...";
        return getFamilyDisplayName(series.familyId);
      },
    },
    {
      key: "beneficiaries",
      label: "Bénéficiaires",
      render: (_: unknown, _row: TableRowData) => {
        return getBeneficiariesDisplay(series);
      },
    },
    {
      key: "professor",
      label: "Professeur",
      render: (_: unknown, _row: TableRowData) => (
        <div className="text-gray-500 italic">À implémenter</div>
      ),
    },
    {
      key: "unitPrice",
      label: "PU",
      render: (_: unknown, _row: TableRowData) => {
        if (!series || !series.hourlyRate) return "...";
        return `${series.hourlyRate.toFixed(2)} €`;
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, _row: TableRowData) => (
        <StatusBadge
          variant={
            _row.status === "available"
              ? "disponible"
              : _row.status === "used"
              ? "active"
              : _row.status === "expired"
              ? "bloquee"
              : _row.status === "cancelled"
              ? "terminee"
              : "disponible"
          }
        >
          {_row.status === "available"
            ? "Disponible"
            : _row.status === "used"
            ? "Utilisé"
            : _row.status === "expired"
            ? "Expiré"
            : _row.status === "cancelled"
            ? "Annulé"
            : _row.status}
        </StatusBadge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-gray-500">Chargement des détails...</div>
          </div>
        </Container>
      </div>
    );
  }

  if (!series) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-red-500">Série de coupons non trouvée</div>
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/coupons")}
              className="mt-4"
            >
              Retour à la liste
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Calculer le nom de la série
  const seriesName = generateCouponSeriesName(series.familyId, series.createdAt);

  // Calculer les statistiques basées sur les coupons réels
  const availableCoupons = coupons.filter(
    (c) => c.status === "available"
  ).length;
  const usedCoupons = coupons.filter((c) => c.status === "used").length;
  const totalCouponsReal = coupons.length; // Nombre réel de coupons
  const totalAmount = (series.hourlyRate || 0) * totalCouponsReal;

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Coupons", href: "/admin/coupons" },
          { label: "Détails série", href: "" },
        ]}
      />
      <Container layout="flex-col">
        <div>
          <div className="series-details__header">
            <h1>Détails de la série : {seriesName}</h1>
            <div className="series-details__header-actions">
              {isEditing ? (
                <ButtonGroup
                  variant="double"
                  buttons={[
                    {
                      text: "Annuler",
                      variant: "outline",
                      onClick: handleEditToggle,
                      disabled: isSaving,
                    },
                    {
                      text: isSaving ? "Sauvegarde..." : "Enregistrer",
                      variant: "primary",
                      onClick: handleSave,
                      disabled: isSaving,
                    },
                  ]}
                />
              ) : (
                <ButtonGroup
                  variant="double"
                  buttons={[
                    {
                      text: "Retour",
                      variant: "outline",
                      onClick: () => navigate("/admin/coupons"),
                    },
                    {
                      text: "Modifier",
                      variant: "secondary",
                      onClick: handleEditToggle,
                    },
                  ]}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div>
            {/* Informations de la série */}
            <DataCard
              title="Informations de la série"
              fields={[
                {
                  key: "hourlyRate",
                  label: "Tarif horaire",
                  value: isEditing ? editedData.hourlyRate : series?.hourlyRate?.toFixed(2) + " €",
                  type: "number",
                  placeholder: "Tarif par heure"
                },
                {
                  key: "totalCoupons",
                  label: "Nombre de coupons", 
                  value: isEditing ? editedData.totalCoupons : series?.totalCoupons,
                  type: "number",
                  placeholder: "Nombre de coupons"
                },
                {
                  key: "status",
                  label: "Statut",
                  value: isEditing ? editedData.status : series?.status === "active" ? "Actif" : series?.status === "completed" ? "Terminé" : series?.status === "expired" ? "Expiré" : series?.status,
                  type: "select",
                  options: [
                    { value: "active", label: "Actif" },
                    { value: "completed", label: "Terminé" },
                    { value: "expired", label: "Expiré" }
                  ]
                },
                {
                  key: "totalAmount",
                  label: "Montant total",
                  value: totalAmount.toFixed(2) + " €",
                  type: "text"
                }
              ]}
              isEditing={isEditing}
              onChange={handleInputChange}
              errors={validationErrors}
            />

            {/* Informations bénéficiaires */}
            <DataCard
              title="Informations bénéficiaires"
              fields={[
                {
                  key: "beneficiaries",
                  label: "Bénéficiaires",
                  value: getBeneficiariesDisplay(series),
                  type: "text"
                },
                {
                  key: "type",
                  label: "Type",
                  value: (() => {
                    const { beneficiaryType, studentId, studentIds, familyId } = series;
                    
                    // Cas explicite
                    if (beneficiaryType === "adult") return "Adulte";
                    if (beneficiaryType === "mixed") return "Adulte + Élève";
                    if (beneficiaryType === "student") return "Élève";
                    
                    // Détection automatique pour données existantes
                    const hasStudents = (studentIds && studentIds.length > 0) || (studentId && typeof studentId === 'object');
                    
                    if (!hasStudents && familyId?.demande?.beneficiaryType === "adulte") {
                      return "Adulte";
                    }
                    
                    if (!hasStudents) {
                      return "Adulte"; // Par défaut si pas d'élèves
                    }
                    
                    return "Élève"; // Par défaut si élèves présents
                  })(),
                  type: "text"
                },
                {
                  key: "subject",
                  label: "Matière",
                  value: series?.subject?.name || "Non renseignée",
                  type: "text"
                }
              ]}
              isEditing={false}
            />

            {/* Informations famille */}
            <DataCard
              title="Informations famille"
              fields={[
                {
                  key: "familyName",
                  label: "Nom de famille",
                  value: getFamilyDisplayName(series?.familyId),
                  type: "text"
                }
              ]}
              isEditing={false}
            />

            {/* Statistiques financières */}
            <DataCard
              title="Statistiques financières"
              fields={[
                {
                  key: "usedCoupons",
                  label: "Coupons utilisés",
                  value: usedCoupons,
                  type: "text"
                },
                {
                  key: "availableCoupons",
                  label: "Coupons disponibles",
                  value: availableCoupons,
                  type: "text"
                },
                {
                  key: "totalRealCoupons",
                  label: "Total coupons réels",
                  value: totalCouponsReal,
                  type: "text"
                }
              ]}
              isEditing={false}
            />


            {/* Liste des coupons */}
            <Container layout="flex-col">
              <h3>Coupons de la série ({totalCouponsReal})</h3>
              
              {/* Boutons d'action pour les coupons */}
              {availableCoupons > 0 && (
                <Container layout="flex">
                  <Button variant="primary" onClick={handleResendCoupons}>
                    📧 Renvoyer les coupons
                  </Button>
                </Container>
              )}

              {/* Recherche */}
              <Container layout="flex">
                <Input
                  placeholder="Rechercher par code, famille, bénéficiaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  button={
                    <Button variant="primary" onClick={handleSearch}>
                      Appliquer
                    </Button>
                  }
                />
                <ButtonGroup
                  variant="double"
                  buttons={[
                    { text: "Filtrer", variant: "outline" },
                    {
                      text: "Réinitialiser",
                      variant: "outline",
                      onClick: handleReset,
                    },
                  ]}
                />
              </Container>

              {filteredCoupons.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    {searchTerm
                      ? "Aucun coupon trouvé pour cette recherche"
                      : "Aucun coupon dans cette série"}
                  </div>
                </div>
              ) : (
                <Table columns={couponsColumns} data={tableData} />
              )}
            </Container>
          </div>
        </div>
      </Container>
    </div>
  );
};
