import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Navbar,
  PageHeader,
  Container,
  SummaryCard,
  Input,
  Button,
  Table,
  StatusBadge,
} from "../../../components";
import type { Coupon } from "../../../types/coupon";
import { ndrService } from "../../../services/ndrService";
import type { NDR } from "../../../services/ndrService";

// Type pour les données du tableau avec l'id requis
type TableRowData = Coupon & { id: string };

export const CouponsList: React.FC = () => {
  const location = useLocation();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState({ available: 0, used: 0, expired: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Charger les NDRs et extraire les coupons
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setIsLoading(true);
        const data = await ndrService.getAllNdrs();
        const ndrs: NDR[] = data.ndrs || [];

        // Extraire tous les coupons de toutes les NDRs
        const allCoupons: Coupon[] = ndrs.flatMap((ndr) =>
          (ndr.coupons || []).map((coupon) => ({
            _id: coupon.id,
            couponSeriesId: ndr._id,
            code: coupon.code,
            status: coupon.status,
            updatedAt: coupon.updatedAt,
          }))
        );

        setCoupons(allCoupons);

        // Calculer les statistiques
        const newStats = {
          available: allCoupons.filter(c => c.status === "available").length,
          used: allCoupons.filter(c => c.status === "used").length,
          expired: 0,
          cancelled: allCoupons.filter(c => c.status === "deleted").length,
        };
        setStats(newStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const handleSearch = () => {
    // La recherche sera implémentée via les filtres
    console.log("Recherche:", searchTerm, "Statut:", statusFilter);
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    // Recharger les données originales
    window.location.reload();
  };

  // Filtrer les données selon le terme de recherche et le statut
  const filteredData = coupons.filter((coupon) => {
    const couponCode = coupon.code || "";

    const matchesSearch =
      searchTerm === "" ||
      couponCode.includes(searchTerm);

    const matchesStatus = statusFilter === "" || coupon.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Transformer les données pour le tableau (ajouter l'id requis)
  const tableData: TableRowData[] = filteredData.map((coupon) => ({
    ...coupon,
    id: coupon._id, // Ajouter l'id requis par le composant Table
  }));

  // Utiliser les statistiques du store
  const totalCoupons =
    stats.available + stats.used + stats.expired + stats.cancelled;
  const availableCoupons = stats.available;
  const usedCoupons = stats.used;
  const expiredCoupons = stats.expired;

  const couponsColumns = [
    {
      key: "code",
      label: "Code",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.code}</div>
      ),
    },
    {
      key: "seriesId",
      label: "ID Série",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.couponSeriesId || "-"}</div>
      ),
    },
    {
      key: "status",
      label: "État",
      render: (_: unknown, row: TableRowData) => (
        <StatusBadge
          variant={
            row.status === "available"
              ? "disponible"
              : row.status === "used"
              ? "active"
              : "terminee"
          }
        >
          {row.status === "available"
            ? "Disponible"
            : row.status === "used"
            ? "Utilisé"
            : row.status === "deleted"
            ? "Supprimé"
            : row.status}
        </StatusBadge>
      ),
    },
    {
      key: "updatedDate",
      label: "Dernière mise à jour",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.updatedAt
            ? new Date(row.updatedAt).toLocaleDateString("fr-FR")
            : "-"}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <PageHeader
        title="Gestion des coupons individuels"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Liste des coupons" },
        ]}
        backButton={{ label: "Retour aux séries", href: "/admin/coupons" }}
      />
      <Container layout="flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Container layout="grid" padding="none">
          <SummaryCard
            title="STATISTIQUES"
            metrics={[
              {
                value: totalCoupons,
                label: "Total coupons",
                variant: "primary",
              },
              {
                value: availableCoupons,
                label: "Disponibles",
                variant: "success",
              },
            ]}
          />
          <SummaryCard
            title="UTILISATION"
            metrics={[
              { value: usedCoupons, label: "Utilisés", variant: "primary" },
              { value: expiredCoupons, label: "Expirés", variant: "error" },
            ]}
          />
        </Container>

        <Container layout="flex">
          <Input
            placeholder="Rechercher par code, famille, élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            button={
              <Button variant="primary" onClick={handleSearch}>
                Rechercher
              </Button>
            }
          />
          <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="status-filter"
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  color: "#666",
                }}
              >
                Filtrer par statut
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  minWidth: "150px",
                }}
              >
                <option value="">Tous les statuts</option>
                <option value="available">Disponible</option>
                <option value="used">Utilisé</option>
                <option value="deleted">Supprimé</option>
              </select>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Réinitialiser
            </Button>
          </div>
        </Container>

        <Container layout="flex-col">
          <h3>Liste des coupons individuels</h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement des coupons...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm || statusFilter
                  ? "Aucun coupon trouvé pour cette recherche"
                  : "Aucun coupon disponible"}
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
