import React, { useState, useEffect } from "react";
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
import { ndrService } from "../../../services/ndrService";
import type { NDR } from "../../../services/ndrService";

// Type pour les données du tableau avec l'id requis
type TableRowData = NDR & { id: string };

export const Admin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [error, setError] = useState<string>("");
  const [ndrs, setNdrs] = useState<NDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les NDRs au montage du composant
  useEffect(() => {
    const loadNdrs = async () => {
      try {
        setIsLoading(true);
        const data = await ndrService.getAllNdrs();
        console.log("📦 NDRs reçues:", data.ndrs);
        console.log("📦 Première NDR familyId:", data.ndrs?.[0]?.familyId);
        setNdrs(data.ndrs || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadNdrs();
  }, []);

  // Les données sont maintenant gérées par le store global

  const handleCreateSeries = () => {
    navigate("/admin/coupons/create");
  };

  const handleRowClick = (row: TableRowData) => {
    localStorage.setItem("currentNdr", JSON.stringify(row));
    navigate(`/admin/coupons/${row._id}/coupons`);
  };

  const handleDeleteSeries = async (ndrId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette NDR ?")) {
      try {
        await ndrService.deleteNdr(ndrId);
        // Recharger les données
        const data = await ndrService.getAllNdrs();
        setNdrs(data.ndrs || []);
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
  const filteredData = ndrs.filter((ndr) => {
    const familyName =
      ndr.familyId &&
      typeof ndr.familyId === "object" &&
      ndr.familyId.primaryContact
        ? `${ndr.familyId.primaryContact.firstName} ${ndr.familyId.primaryContact.lastName}`
        : "";
    const subjectName = ndr.subjects?.[0]?.name || "";
    const creatorName =
      typeof ndr.createdBy?.userId === "object"
        ? `${ndr.createdBy.userId.firstName} ${ndr.createdBy.userId.lastName}`
        : "";

    return (
      familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creatorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Transformer les données pour le tableau (ajouter l'id requis)
  const tableData: TableRowData[] = filteredData.map((ndr) => ({
    ...ndr,
    id: ndr._id, // Ajouter l'id requis par le composant Table
  }));

  // Calculer les statistiques des NDRs
  const totalSeries = ndrs.length;
  const activeSeries = ndrs.filter((ndr) => ndr.status === "pending").length;
  const completedSeries = ndrs.filter((ndr) => ndr.status === "paid").length;
  const totalCoupons = ndrs.reduce((sum, ndr) => sum + ndr.quantity, 0);
  const usedCoupons = ndrs.reduce(
    (sum, ndr) =>
      sum + (ndr.coupons?.filter((c) => c.status === "used").length || 0),
    0
  );
  const remainingCoupons = totalCoupons - usedCoupons;

  const couponsColumns = [
    {
      key: "name",
      label: "Nom de la série",
      render: (_: unknown, row: TableRowData) => {
        const familyData = row.familyId as any;
        const familyName =
          familyData &&
          typeof familyData === "object" &&
          familyData.primaryContact
            ? `${familyData.primaryContact.firstName}${familyData.primaryContact.lastName}`
            : "FamilleInconnue";
        const date = new Date(row.createdAt);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
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
      render: (_: unknown, row: TableRowData) => {
        const familyName =
          row.familyId &&
          typeof row.familyId === "object" &&
          row.familyId.primaryContact
            ? `${row.familyId.primaryContact.firstName} ${row.familyId.primaryContact.lastName}`
            : "Famille inconnue";

        return (
          <div>
            <div className="font-medium">{familyName}</div>
          </div>
        );
      },
    },
    {
      key: "beneficiaries",
      label: "Bénéficiaires",
      render: (_: unknown, row: TableRowData) => {
        const beneficiaries = row.beneficiaries?.adult
          ? row.familyId &&
            typeof row.familyId === "object" &&
            row.familyId.primaryContact
            ? `${row.familyId.primaryContact.firstName} ${row.familyId.primaryContact.lastName}`
            : "Adulte"
          : row.beneficiaries?.students
              ?.map((s) => `${s.firstName} ${s.lastName}`)
              .join(", ") || "Bénéficiaire inconnu";

        return (
          <div>
            <div className="font-medium">{beneficiaries}</div>
          </div>
        );
      },
    },
    {
      key: "subject",
      label: "Matière",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">
          {row.subjects?.[0]?.name || "Matière inconnue"}
        </div>
      ),
    },
    {
      key: "totalCoupons",
      label: "Total coupons",
      render: (_: unknown, row: TableRowData) => row.quantity,
    },
    {
      key: "utilises",
      label: "Utilisés",
      render: (_: unknown, row: TableRowData) =>
        row.coupons?.filter((c) => c.status === "used").length || 0,
    },
    {
      key: "restants",
      label: "Restants",
      render: (_: unknown, row: TableRowData) =>
        row.quantity -
        (row.coupons?.filter((c) => c.status === "used").length || 0),
    },
    {
      key: "montantTotal",
      label: "Montant total",
      render: (_: unknown, row: TableRowData) =>
        `${(row.hourlyRate * row.quantity).toFixed(2)} €`,
    },

    {
      key: "statut",
      label: "Statut",
      render: (_: unknown, row: TableRowData) => (
        <StatusBadge
          variant={
            row.status === "pending"
              ? "active"
              : row.status === "paid"
              ? "terminee"
              : row.status === "overdue"
              ? "bloquee"
              : "disponible"
          }
        >
          {row.status === "pending"
            ? "En attente"
            : row.status === "paid"
            ? "Payé"
            : row.status === "overdue"
            ? "En retard"
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
      {/* <Navbar activePath={location.pathname} /> */}
      <PageHeader
        title="Gestion des séries de coupons"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Liste des séries de coupons" },
        ]}
        backButton={{ label: "Retour admin", href: "/admin" }}
      />
      <Container layout="flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="font-medium">Erreur de chargement des NDRs:</div>
            <div className="text-sm mt-1">{error}</div>
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
              <div className="text-gray-500">Chargement des NDRs...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {error ? (
                  <div>
                    <div className="text-red-600 font-medium">
                      Erreur de chargement
                    </div>
                    <div className="text-sm mt-1">
                      Consultez les détails ci-dessus
                    </div>
                  </div>
                ) : searchTerm ? (
                  "Aucune NDR trouvée pour cette recherche"
                ) : (
                  <div>
                    <div>Aucune NDR disponible</div>
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
