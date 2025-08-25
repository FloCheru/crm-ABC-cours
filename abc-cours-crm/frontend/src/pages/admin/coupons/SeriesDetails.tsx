import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  SummaryCard,
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
        <div className="flex justify-between items-center">
          <h1>Détails de la série : {seriesName}</h1>
          <Button
            variant="secondary"
            onClick={() => navigate("/admin/coupons")}
          >
            ← Retour à la liste
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Informations de la série */}
        <Container layout="grid" padding="none">
          <SummaryCard
            title="STATISTIQUES"
            metrics={[
              {
                value: `${totalAmount.toFixed(2)} €`,
                label: "Montant total",
                variant: "primary",
              },
              {
                value: `${totalCouponsReal}`,
                label: "Total coupons",
                variant: "success",
              },
            ]}
          />
          <SummaryCard
            title="UTILISATION"
            metrics={[
              {
                value: usedCoupons,
                label: "Utilisés",
                variant: "primary",
              },
              {
                value: availableCoupons,
                label: "Disponibles",
                variant: "success",
              },
            ]}
          />
        </Container>

        {/* Boutons d'action */}
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

        {/* Liste des coupons */}
        <Container layout="flex-col">
          <h3>Coupons de la série ({totalCouponsReal})</h3>

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
      </Container>
    </div>
  );
};
