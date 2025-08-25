import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
  StatusBadge,
} from "../../../components";
import { couponSeriesService } from "../../../services/couponSeriesService";
import { useCouponSeriesCache } from "../../../hooks/useCouponSeriesCache";
import type { CouponSeries } from "../../../types/coupon";

// Type pour les données du tableau avec l'id requis
type TableRowData = CouponSeries & { id: string };

export const Admin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { couponSeriesData, isFromCache, isLoading } = useCouponSeriesCache();
  const [error, setError] = useState<string>("");
  
  // Données extraites du cache
  const couponsData = couponSeriesData?.couponSeries || [];
  const [searchTerm, setSearchTerm] = useState("");

  // Log pour indiquer si les données proviennent du cache
  useEffect(() => {
    if (couponSeriesData) {
      console.log(`📊 Séries de coupons: Données ${isFromCache ? 'récupérées depuis le cache' : 'chargées depuis l\'API'}`);
      console.log("🔍 Données reçues:", couponSeriesData);
      if (couponSeriesData.couponSeries.length > 0) {
        console.log("🔍 Premier élément:", couponSeriesData.couponSeries[0]);
        console.log("🔍 familyId du premier élément:", couponSeriesData.couponSeries[0].familyId);
      }
    }
  }, [couponSeriesData, isFromCache]);

  const handleCreateSeries = () => {
    navigate("/admin/coupons/create");
  };

  const handleViewCoupons = (seriesId: string) => {
    navigate(`/admin/coupons/${seriesId}/coupons`);
  };

  const handleEditSeries = (seriesId: string) => {
    navigate(`/admin/coupons/edit/${seriesId}`);
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
  const filteredData = couponsData.filter(
    (series) => {
      const familyName = series.familyId?.primaryContact 
        ? `${series.familyId.primaryContact.firstName} ${series.familyId.primaryContact.lastName}`
        : "";
      const subjectName = series.subject?.name || "";
      const creatorName = series.createdBy?.firstName + " " + series.createdBy?.lastName || "";
      
      return familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  // Transformer les données pour le tableau (ajouter l'id requis)
  const tableData: TableRowData[] = filteredData.map((series) => ({
    ...series,
    id: series._id, // Ajouter l'id requis par le composant Table
  }));

  // Calculer les statistiques des séries
  const totalSeries = couponsData.length;
  const activeSeries = couponsData.filter(series => series.status === 'active').length;
  const completedSeries = couponsData.filter(series => series.status === 'completed').length;
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
        // Construire le nom : Nomdefamille_mois_année
        const familyName = (row.familyId && typeof row.familyId === 'object' && row.familyId.primaryContact)
          ? `${row.familyId.primaryContact.firstName} ${row.familyId.primaryContact.lastName}`
          : "Famille inconnue";
        const createdAt = new Date(row.createdAt);
        const month = (createdAt.getMonth() + 1).toString().padStart(2, "0");
        const year = createdAt.getFullYear();
        const seriesName = `${familyName}_${month}_${year}`;

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
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">
            {(row.familyId && typeof row.familyId === 'object' && row.familyId.primaryContact)
              ? `${row.familyId.primaryContact.firstName} ${row.familyId.primaryContact.lastName}`
              : "Famille inconnue"}
          </div>
        </div>
      ),
    },
    {
      key: "student",
      label: "Élève",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">
            {row.studentId?.firstName} {row.studentId?.lastName}
          </div>
          <div className="text-sm text-gray-500">{row.studentId?.level}</div>
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
            variant="secondary"
            onClick={() => handleViewCoupons(row._id)}
          >
            👁️
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleEditSeries(row._id)}
          >
            ✏️
          </Button>
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
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Séries", href: "/admin/coupons" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Gestion des séries de coupons</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
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
                variant: "primary" 
              },
              { 
                value: remainingCoupons, 
                label: "Coupons restants", 
                variant: "success" 
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
                {searchTerm
                  ? "Aucune série trouvée pour cette recherche"
                  : "Aucune série de coupons disponible"}
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
