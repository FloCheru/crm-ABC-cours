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
} from "../../../components";
import { couponSeriesService } from "../../../services/couponSeriesService";
import type { CouponSeries } from "../../../types/coupon";

// Type pour les données du tableau avec l'id requis
type TableRowData = CouponSeries & { id: string };

export const Admin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [couponsData, setCouponsData] = useState<CouponSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les données des séries de coupons
  useEffect(() => {
    const loadCouponSeries = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await couponSeriesService.getCouponSeries();
        // S'assurer que data est un tableau
        setCouponsData(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
        console.error("Erreur lors du chargement des séries de coupons:", err);
        setCouponsData([]); // Initialiser avec un tableau vide en cas d'erreur
      } finally {
        setIsLoading(false);
      }
    };

    loadCouponSeries();
  }, []);

  const handleCreateSeries = () => {
    navigate("/admin/coupons/create");
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
        // Recharger les données après suppression
        const updatedData = await couponSeriesService.getCouponSeries();
        setCouponsData(updatedData);
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
    (series) =>
      (series.family?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (series.student?.firstName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (series.student?.lastName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (series.subject?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Transformer les données pour le tableau (ajouter l'id requis)
  const tableData: TableRowData[] = filteredData.map((series) => ({
    ...series,
    id: series._id, // Ajouter l'id requis par le composant Table
  }));

  // Calculer les statistiques
  const activeSeries = couponsData.filter((s) => s.status === "active").length;
  const totalCoupons = couponsData.reduce(
    (sum, series) => sum + series.totalCoupons,
    0
  );
  const usedCoupons = couponsData.reduce(
    (sum, series) => sum + series.usedCoupons,
    0
  );
  const totalAmount = couponsData.reduce(
    (sum, series) => sum + series.totalAmount,
    0
  );

  const couponsColumns = [
    {
      key: "name",
      label: "Nom de la série",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">{row.name}</div>
        </div>
      ),
    },
    {
      key: "subject",
      label: "Matière",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">{row.subject?.name}</div>
        </div>
      ),
    },
    {
      key: "professor",
      label: "Professeur",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">
            {row.professor?.user?.firstName} {row.professor?.user?.lastName}
          </div>
          <div className="text-sm text-gray-500">
            {row.professor?.user?.email}
          </div>
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
      render: (_: unknown, row: TableRowData) => row.remainingCoupons,
    },
    {
      key: "montantTotal",
      label: "Montant total",
      render: (_: unknown, row: TableRowData) =>
        `${row.totalAmount.toFixed(2)} €`,
    },
    {
      key: "statut",
      label: "Statut",
      render: (_: unknown, row: TableRowData) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "active"
              ? "bg-green-100 text-green-800"
              : row.status === "expired"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status === "active"
            ? "Actif"
            : row.status === "expired"
            ? "Expiré"
            : row.status === "inactive"
            ? "Inactif"
            : row.status}
        </span>
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
            onClick={() => handleEditSeries(row._id)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="error"
            onClick={() => handleDeleteSeries(row._id)}
          >
            Supprimer
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
          { label: "Coupons", href: "/admin/coupons" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Gestion des coupons</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Container layout="grid" padding="none">
          <SummaryCard
            title="SYNTHESE GLOBALE"
            metrics={[
              {
                value: `${totalAmount.toFixed(2)} €`,
                label: "Montant total",
                variant: "primary",
              },
              {
                value: activeSeries,
                label: "Total Coupons",
                variant: "success",
              },
            ]}
          />
          <SummaryCard
            title="UTILISATION"
            metrics={[
              { value: usedCoupons, label: "Utilisés", variant: "primary" },
              { value: totalCoupons, label: "Restants", variant: "success" },
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
            placeholder="Rechercher par nom de série, famille, date..."
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
