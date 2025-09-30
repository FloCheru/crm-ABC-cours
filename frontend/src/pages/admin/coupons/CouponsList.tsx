import React, { useState } from "react";
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

// Type pour les données du tableau avec l'id requis
type TableRowData = Coupon & { id: string };

export const CouponsList: React.FC = () => {
  const location = useLocation();
  // const { coupons, stats, isLoading, error } = [];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

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
    const familyName = coupon.couponSeriesId?.familyId?.primaryContact
      ? `${coupon.couponSeriesId.familyId.primaryContact.firstName} ${coupon.couponSeriesId.familyId.primaryContact.lastName}`
      : "";
    const studentName = coupon.couponSeriesId?.studentId
      ? `${coupon.couponSeriesId.studentId.firstName} ${coupon.couponSeriesId.studentId.lastName}`
      : "";
    const couponCode = coupon.code || "";

    const matchesSearch =
      searchTerm === "" ||
      familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      key: "series",
      label: "Série",
      render: (_: unknown, row: TableRowData) => {
        if (!row.couponSeriesId?.familyId?.primaryContact)
          return "Série inconnue";

        const familyName = `${row.couponSeriesId.familyId.primaryContact.firstName} ${row.couponSeriesId.familyId.primaryContact.lastName}`;
        const createdAt = new Date(row.createdAt);
        const month = (createdAt.getMonth() + 1).toString().padStart(2, "0");
        const year = createdAt.getFullYear();
        const seriesName = `${familyName}_${month}_${year}`;

        return <div className="font-medium">{seriesName}</div>;
      },
    },
    {
      key: "family",
      label: "Famille",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">
            {row.couponSeriesId?.familyId &&
            typeof row.couponSeriesId.familyId === "object" &&
            row.couponSeriesId.familyId.primaryContact
              ? `${row.couponSeriesId.familyId.primaryContact.firstName} ${row.couponSeriesId.familyId.primaryContact.lastName}`
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
            {row.couponSeriesId?.studentId
              ? `${row.couponSeriesId.studentId.firstName} ${row.couponSeriesId.studentId.lastName}`
              : "Élève inconnu"}
          </div>
          <div className="text-sm text-gray-500">
            {row.couponSeriesId?.studentId?.level || ""}
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      label: "Matière",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.couponSeriesId?.subject?.name || "Matière inconnue"}
        </div>
      ),
    },
    {
      key: "professor",
      label: "Professeur",
      render: () => <div className="text-sm text-gray-500">À implémenter</div>,
    },
    {
      key: "unitPrice",
      label: "PU (€)",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">
          {row.couponSeriesId?.hourlyRate?.toFixed(2) || "0.00"} €
        </div>
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
              : row.status === "expired"
              ? "bloquee"
              : "terminee"
          }
        >
          {row.status === "available"
            ? "Disponible"
            : row.status === "used"
            ? "Utilisé"
            : row.status === "expired"
            ? "Expiré"
            : row.status === "cancelled"
            ? "Annulé"
            : row.status}
        </StatusBadge>
      ),
    },
    {
      key: "usedDate",
      label: "Date d'utilisation",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.usedDate
            ? new Date(row.usedDate).toLocaleDateString("fr-FR")
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
                <option value="expired">Expiré</option>
                <option value="cancelled">Annulé</option>
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
