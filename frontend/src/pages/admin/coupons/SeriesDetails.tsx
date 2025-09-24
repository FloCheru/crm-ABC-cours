import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  PageHeader,
  Container,
  Button,
  Table,
  StatusBadge,
  Input,
  ButtonGroup,
  DataCard,
} from "../../../components";
// import { couponSeriesService } from "../../../services/couponSeriesService";
import {
  getFamilyDisplayName,
  generateCouponSeriesName,
  getBeneficiariesDisplay,
} from "../../../utils/familyNameUtils";
import type { CouponSeries, Coupon } from "../../../types/coupon";
import { useCouponSeriesGlobal } from "../../../hooks/useCouponSeriesGlobal";

// Type pour les données du tableau avec l'id requis
type TableRowData = Coupon & { id: string };

export const SeriesDetails: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Utilisation du nouveau store global pour les séries
  const { loadSeriesDetails, getSeriesDetails } = useCouponSeriesGlobal();

  const [series, setSeries] = useState<CouponSeries | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadDetails = async () => {
      if (!seriesId) return;

      try {
        setIsLoading(true);
        setError("");

        // Vérifier d'abord le cache
        const cachedDetails = getSeriesDetails(seriesId);
        if (cachedDetails) {
          console.log("🚀 [SERIES-DETAILS] Using cached data");
          setSeries(cachedDetails.series);
          setCoupons(cachedDetails.coupons);
          setIsLoading(false);
          return;
        }

        // Charger depuis l'API via le store
        console.log("🚀 [SERIES-DETAILS] Loading from API...");
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

  const handleSearch = () => {
    console.log("Recherche:", searchTerm);
  };

  const handleReset = () => {
    setSearchTerm("");
  };

  // Filtrer les coupons selon le terme de recherche
  const filteredCoupons = coupons.filter((coupon) => {
    // Utiliser les données de la série pour la famille et les bénéficiaires
    const familyName =
      series?.familyId &&
      typeof series.familyId === "object" &&
      series.familyId.primaryContact
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
  const seriesName = generateCouponSeriesName(
    series.familyId,
    series.createdAt
  );

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
      <PageHeader
        title={`Détails de la série : ${seriesName}`}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Liste des séries de coupons", href: "/admin/coupons" },
          {
            label: `Série n°${seriesId?.substring(seriesId.length - 8) || ""}`,
          },
        ]}
        description={
          series
            ? `Créé le ${new Date(series.createdAt).toLocaleDateString(
                "fr-FR"
              )} • Modifié le ${new Date(
                series.updatedAt || series.createdAt
              ).toLocaleDateString("fr-FR")}`
            : undefined
        }
        backButton={{ label: "Retour aux séries", href: "/admin/coupons" }}
      />
      <Container layout="flex-col">
        <div>
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
                  value: series?.hourlyRate?.toFixed(2) + " €",
                  type: "number",
                  placeholder: "Tarif par heure",
                },
                {
                  key: "totalCoupons",
                  label: "Nombre de coupons",
                  value: series?.totalCoupons,
                  type: "number",
                  placeholder: "Nombre de coupons",
                },
                {
                  key: "status",
                  label: "Statut",
                  value:
                    series?.status === "active"
                      ? "Actif"
                      : series?.status === "completed"
                      ? "Terminé"
                      : series?.status === "expired"
                      ? "Expiré"
                      : series?.status,
                  type: "select",
                  options: [
                    { value: "active", label: "Actif" },
                    { value: "completed", label: "Terminé" },
                    { value: "expired", label: "Expiré" },
                  ],
                },
                {
                  key: "totalAmount",
                  label: "Montant total",
                  value: totalAmount.toFixed(2) + " €",
                  type: "text",
                },
                {
                  key: "subject",
                  label: "Matière",
                  value: series?.subject?.name || "Non renseignée",
                  type: "text",
                },
              ]}
            />

            {/* Statistiques financières */}
            <DataCard
              title="Statistiques financières"
              fields={[
                {
                  key: "usedCoupons",
                  label: "Coupons utilisés",
                  value: usedCoupons,
                  type: "text",
                },
                {
                  key: "availableCoupons",
                  label: "Coupons disponibles",
                  value: availableCoupons,
                  type: "text",
                },
                {
                  key: "totalRealCoupons",
                  label: "Total coupons réels",
                  value: totalCouponsReal,
                  type: "text",
                },
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
