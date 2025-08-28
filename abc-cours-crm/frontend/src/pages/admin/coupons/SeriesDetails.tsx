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
} from "../../../components";
import { couponSeriesService } from "../../../services/couponSeriesService";
import { couponService } from "../../../services/couponService";
import { getFamilyDisplayName, generateCouponSeriesName } from "../../../utils/familyNameUtils";
import type { CouponSeries, Coupon } from "../../../types/coupon";
import "./SeriesDetails.css";

// Type pour les données du tableau avec l'id requis
type TableRowData = Coupon & { id: string };

export const SeriesDetails: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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
    const loadSeriesDetails = async () => {
      if (!seriesId) return;

      try {
        setIsLoading(true);
        setError("");

        // Charger les détails de la série
        const seriesData = await couponSeriesService.getCouponSeriesById(
          seriesId
        );
        console.log("🔍 SeriesDetails - Données série:", seriesData);
        console.log("🔍 SeriesDetails - familyId:", seriesData?.familyId);
        console.log("🔍 SeriesDetails - studentId:", seriesData?.studentId);
        console.log(
          "🔍 SeriesDetails - totalCoupons:",
          seriesData?.totalCoupons
        );
        setSeries(seriesData);

        // Charger les coupons de cette série
        const couponsData = await couponService.getCoupons({
          series: seriesId,
        });
        console.log("🔍 SeriesDetails - Coupons:", couponsData);
        setCoupons(couponsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
        console.error("Erreur lors du chargement des détails:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSeriesDetails();
  }, [seriesId]);

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
    // Utiliser les données de la série pour la famille et l'élève
    const familyName = (series?.familyId && typeof series.familyId === 'object' && series.familyId.primaryContact)
      ? `${series.familyId.primaryContact.firstName} ${series.familyId.primaryContact.lastName}`
      : "";
    const studentName = series?.studentId
      ? `${series.studentId.firstName} ${series.studentId.lastName}`
      : "";

    return (
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase())
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
      key: "student",
      label: "Élève",
      render: (_: unknown, _row: TableRowData) => {
        if (!series?.studentId) return "Élève inconnu";
        return `${series.studentId.firstName} ${series.studentId.lastName}`;
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
        <div className={`series-details ${isEditing ? 'series-details--editing' : ''}`}>
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

          <div className="series-details__content">
            {/* Informations de la série */}
            <Container layout="flex-col" className="series-details__section series-details__section--series-info">
              <h2>Informations de la série</h2>
              <div className="series-details__grid">
                <div className="series-details__field">
                  <label>Tarif horaire</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedData.hourlyRate || ""}
                      onChange={(e) => handleInputChange("hourlyRate", parseFloat(e.target.value) || 0)}
                      error={validationErrors.hourlyRate}
                      placeholder="Tarif par heure"
                    />
                  ) : (
                    <p>{series?.hourlyRate?.toFixed(2)} €</p>
                  )}
                </div>
                <div className="series-details__field">
                  <label>Nombre de coupons</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      value={editedData.totalCoupons || ""}
                      onChange={(e) => handleInputChange("totalCoupons", parseInt(e.target.value) || 0)}
                      error={validationErrors.totalCoupons}
                      placeholder="Nombre de coupons"
                    />
                  ) : (
                    <p>{series?.totalCoupons}</p>
                  )}
                </div>
                <div className="series-details__field">
                  <label>Statut</label>
                  {isEditing ? (
                    <select
                      className="series-details__select"
                      value={editedData.status || ""}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                    >
                      <option value="active">Actif</option>
                      <option value="completed">Terminé</option>
                      <option value="expired">Expiré</option>
                    </select>
                  ) : (
                    <p className={`series-details__status series-details__status--${series?.status || 'unknown'}`}>
                      {series?.status === "active"
                        ? "Actif"
                        : series?.status === "completed"
                        ? "Terminé"
                        : series?.status === "expired"
                        ? "Expiré"
                        : series?.status}
                    </p>
                  )}
                </div>
                <div className="series-details__field">
                  <label>Montant total</label>
                  <p>{totalAmount.toFixed(2)} €</p>
                </div>
              </div>
            </Container>

            {/* Informations étudiant */}
            <Container layout="flex-col" className="series-details__section series-details__section--student">
              <h2>Informations étudiant</h2>
              <div className="series-details__grid">
                <div className="series-details__field">
                  <label>Nom complet</label>
                  <p>{series?.studentId ? `${series.studentId.firstName} ${series.studentId.lastName}` : "Non renseigné"}</p>
                </div>
                <div className="series-details__field">
                  <label>Niveau</label>
                  <p>{series?.studentId?.level || "Non renseigné"}</p>
                </div>
                <div className="series-details__field">
                  <label>Matière</label>
                  <p>{series?.subject?.name || "Non renseignée"}</p>
                </div>
              </div>
            </Container>

            {/* Informations famille */}
            <Container layout="flex-col" className="series-details__section series-details__section--family">
              <h2>Informations famille</h2>
              <div className="series-details__grid">
                <div className="series-details__field">
                  <label>Nom de famille</label>
                  <p>{getFamilyDisplayName(series?.familyId)}</p>
                </div>
              </div>
            </Container>

            {/* Statistiques financières */}
            <Container layout="flex-col" className="series-details__section series-details__section--financial">
              <h2>Statistiques financières</h2>
              <div className="series-details__grid">
                <div className="series-details__field">
                  <label>Coupons utilisés</label>
                  <p>{usedCoupons}</p>
                </div>
                <div className="series-details__field">
                  <label>Coupons disponibles</label>
                  <p>{availableCoupons}</p>
                </div>
                <div className="series-details__field">
                  <label>Total coupons réels</label>
                  <p>{totalCouponsReal}</p>
                </div>
              </div>
            </Container>


            {/* Liste des coupons */}
            <Container layout="flex-col" className="series-details__section series-details__section--coupons">
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
                  placeholder="Rechercher par code, famille, élève..."
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
