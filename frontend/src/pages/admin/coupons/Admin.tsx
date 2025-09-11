import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  PageHeader,
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
  StatusBadge,
} from "../../../components";
import { couponSeriesService } from "../../../services/couponSeriesService";
import { useCouponSeriesGlobal } from "../../../hooks/useCouponSeriesGlobal";
import {
  getFamilyDisplayName,
  generateCouponSeriesName,
  getBeneficiariesDisplay,
} from "../../../utils/familyNameUtils";
import type { CouponSeries } from "../../../types/coupon";

// Type pour les données du tableau avec l'id requis
type TableRowData = CouponSeries & { id: string };

export const Admin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Utilisation du nouveau store global pour les séries
  const { series, isLoading, error: storeError } = useCouponSeriesGlobal();

  const [error, setError] = useState<string>("");
  const couponsData = series;
  const [searchTerm, setSearchTerm] = useState("");

  // Les données sont maintenant gérées par le store global

  const handleCreateSeries = () => {
    navigate("/admin/coupons/create");
  };

  const handleRowClick = (row: TableRowData) => {
    navigate(`/admin/coupons/${row._id}/coupons`);
  };

  const handleDeleteSeries = async (seriesId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette série de coupons ?"
      )
    ) {
      try {
        await couponSeriesService.deleteCouponSeries(seriesId);
        // Les données seront automatiquement rafraîchies par le système de cache
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de la suppression"
        );
      }
    }
  };

  const handleSearch = () => {
    // Implémenter la recherche si nécessaire
    console.log("Recherche:", searchTerm);
  };

  const handleFilter = () => {
    // Implémenter les filtres si nécessaire
    console.log("Filtres appliqués");
  };

  const handleReset = () => {
    setSearchTerm("");
    // Recharger les données originales
    window.location.reload();
  };

  // Filtrer les données selon le terme de recherche
  const filteredData = couponsData.filter((series) => {
    const familyName = getFamilyDisplayName(series.familyId, "");
    const subjectName = series.subject?.name || "";
    const creatorName =
      series.createdBy?.firstName + " " + series.createdBy?.lastName || "";

    return (
      familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creatorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Transformer les données pour le tableau (ajouter l'id requis)
  const tableData: TableRowData[] = filteredData.map((series) => ({
    ...series,
    id: series._id, // Ajouter l'id requis par le composant Table
  }));

  // Calculer les statistiques des séries
  const totalSeries = couponsData.length;
  const activeSeries = couponsData.filter(
    (series) => series.status === "active"
  ).length;
  const completedSeries = couponsData.filter(
    (series) => series.status === "completed"
  ).length;
  const totalCoupons = couponsData.reduce(
    (sum, series) => sum + series.totalCoupons,
    0
  );
  const usedCoupons = couponsData.reduce(
    (sum, series) => sum + series.usedCoupons,
    0
  );
  const remainingCoupons = totalCoupons - usedCoupons;

  const couponsColumns = [
    {
      key: "name",
      label: "Nom de la série",
      render: (_: unknown, row: TableRowData) => {
        // Utiliser l'utilitaire pour générer le nom de série
        const seriesName = generateCouponSeriesName(
          row.familyId,
          row.createdAt
        );

        return (
          <div>
            <div className="font-medium">{seriesName}</div>
          </div>
        );
      },
    },
    {
      key: "family",
      label: "Famille",
      render: (_: unknown, row: TableRowData) => {
        const familyName = getFamilyDisplayName(row.familyId);
        const isGenerated =
          !row.familyId ||
          typeof row.familyId === "string" ||
          !row.familyId.primaryContact ||
          !row.familyId.primaryContact.firstName?.trim() ||
          !row.familyId.primaryContact.lastName?.trim();

        return (
          <div>
            <div className="font-medium">
              {familyName}
              {isGenerated && familyName !== "Famille inconnue" && (
                <span className="text-xs text-gray-500 ml-1">(auto)</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "beneficiaries",
      label: "Bénéficiaires",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">{getBeneficiariesDisplay(row)}</div>
        </div>
      ),
    },
    {
      key: "subject",
      label: "Matière",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">
          {row.subject?.name || "Matière inconnue"}
        </div>
      ),
    },
    {
      key: "totalCoupons",
      label: "Total coupons",
      render: (_: unknown, row: TableRowData) => row.totalCoupons,
    },
    {
      key: "utilises",
      label: "Utilisés",
      render: (_: unknown, row: TableRowData) => row.usedCoupons,
    },
    {
      key: "restants",
      label: "Restants",
      render: (_: unknown, row: TableRowData) =>
        row.totalCoupons - row.usedCoupons,
    },
    {
      key: "montantTotal",
      label: "Montant total",
      render: (_: unknown, row: TableRowData) =>
        `${(row.hourlyRate * row.totalCoupons).toFixed(2)} €`,
    },

    {
      key: "statut",
      label: "Statut",
      render: (_: unknown, row: TableRowData) => (
        <StatusBadge
          variant={
            row.status === "active"
              ? "active"
              : row.status === "completed"
              ? "terminee"
              : row.status === "expired"
              ? "bloquee"
              : "disponible"
          }
        >
          {row.status === "active"
            ? "Actif"
            : row.status === "completed"
            ? "Terminé"
            : row.status === "expired"
            ? "Expiré"
            : row.status}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <div className="table__actions">
          <Button
            size="sm"
            variant="error"
            onClick={() => handleDeleteSeries(row._id)}
          >
            ✕
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <PageHeader
        title="Gestion des séries de coupons"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Liste des séries de coupons" },
        ]}
        backButton={{ label: "Retour admin", href: "/admin" }}
      />
      <Container layout="flex-col">
        {(error || storeError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="font-medium">
              Erreur de chargement des séries de coupons:
            </div>
            <div className="text-sm mt-1">{storeError || error}</div>
          </div>
        )}

        <Container layout="grid" padding="none">
          <SummaryCard
            title="SÉRIES"
            metrics={[
              {
                value: totalSeries,
                label: "Nombre total de séries",
                variant: "primary",
              },
              {
                value: activeSeries,
                label: "Séries en cours",
                variant: "success",
              },
            ]}
          />
          <SummaryCard
            title="STATUT SÉRIES"
            metrics={[
              {
                value: completedSeries,
                label: "Séries clôturées",
                variant: "primary",
              },
              {
                value: remainingCoupons,
                label: "Coupons restants",
                variant: "success",
              },
            ]}
          />
        </Container>

        <Container layout="flex">
          <ButtonGroup
            variant="triple"
            buttons={[
              {
                text: "Créer une nouvelle série",
                variant: "primary",
                onClick: handleCreateSeries,
              },
              { text: "Modifier les coupons", variant: "secondary" },
              { text: "Saisir un coupon", variant: "secondary" },
            ]}
          />
          <ButtonGroup
            variant="double"
            buttons={[
              { text: "Bloquer un coupon", variant: "error" },
              { text: "Exporter", variant: "secondary" },
            ]}
          />
        </Container>

        <Container layout="flex">
          <Input
            placeholder="Rechercher par famille, matière, créateur..."
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
              { text: "Filtrer", variant: "outline", onClick: handleFilter },
              {
                text: "Réinitialiser",
                variant: "outline",
                onClick: handleReset,
              },
            ]}
          />
        </Container>

        <Container layout="flex-col">
          <h3>Liste des séries de coupons</h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                Chargement des séries de coupons...
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {storeError ? (
                  <div>
                    <div className="text-red-600 font-medium">
                      Erreur de chargement
                    </div>
                    <div className="text-sm mt-1">
                      Consultez les détails ci-dessus
                    </div>
                  </div>
                ) : searchTerm ? (
                  "Aucune série trouvée pour cette recherche"
                ) : (
                  <div>
                    <div>Aucune série de coupons disponible</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Table
              columns={couponsColumns}
              data={tableData}
              onRowClick={handleRowClick}
            />
          )}
        </Container>
      </Container>
    </div>
  );
};
