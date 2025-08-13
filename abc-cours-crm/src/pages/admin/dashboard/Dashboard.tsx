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
import { familyService } from "../../../services/familyService";
import { settlementService } from "../../../services/settlementService";
import type { Family, FamilyStats } from "../../../services/familyService";

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [familyData, setFamilyData] = useState<Family[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [settlementCounts, setSettlementCounts] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les données des familles
  useEffect(() => {
    const loadFamilyData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [data, statsData] = await Promise.all([
          familyService.getFamilies(),
          familyService.getFamilyStats(),
        ]);
        const families = Array.isArray(data) ? data : [];
        setFamilyData(families);
        setStats(statsData);

        // Charger le nombre de notes de règlement pour chaque famille
        const counts: Record<string, number> = {};
        for (const family of families) {
          try {
            const count =
              await settlementService.getSettlementNotesCountByFamily(
                family._id
              );
            counts[family._id] = count;
          } catch (err) {
            console.error(
              `Erreur lors du comptage pour la famille ${family._id}:`,
              err
            );
            counts[family._id] = 0;
          }
        }
        setSettlementCounts(counts);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
        console.error("Erreur lors du chargement des familles:", err);
        setFamilyData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFamilyData();
  }, []);

  const handleCreateFamily = () => {
    navigate("/admin/families/create");
  };

  // const handleEditFamily = (familyId: string) => {
  //   navigate(`/admin/families/edit/${familyId}`);
  // };

  // const handleDeleteFamily = async (familyId: string) => {
  //   if (window.confirm("Êtes-vous sûr de vouloir supprimer cette famille ?")) {
  //     try {
  //       await familyService.deleteFamily(familyId);
  //       // Recharger les données après suppression
  //       const [updatedData, updatedStats] = await Promise.all([
  //         familyService.getFamilies(),
  //         familyService.getFamilyStats(),
  //       ]);
  //       setFamilyData(updatedData);
  //       setStats(updatedStats);
  //     } catch (err) {
  //       setError(
  //         err instanceof Error ? err.message : "Erreur lors de la suppression"
  //       );
  //     }
  //   }
  // };

  const handleUpdateStatus = async (
    familyId: string,
    newStatus: "prospect" | "client"
  ) => {
    try {
      await familyService.updateStatus(familyId, newStatus);
      // Recharger les données après mise à jour
      const [updatedData, updatedStats] = await Promise.all([
        familyService.getFamilies(),
        familyService.getFamilyStats(),
      ]);
      setFamilyData(updatedData);
      setStats(updatedStats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du statut"
      );
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
  const filteredData = familyData.filter(
    (family) =>
      family.primaryContact?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      family.primaryContact?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      family.primaryContact?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      family.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Transformer les données pour le tableau (ajouter l'id requis)
  const tableData: TableRowData[] = filteredData.map((family) => ({
    ...family,
    id: family._id,
  }));

  const familyColumns = [
    {
      key: "name",
      label: "Prospect",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">
            {row.primaryContact?.firstName} {row.primaryContact?.lastName}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">{row.primaryContact?.email}</div>
          <div className="text-sm text-gray-500">
            {row.primaryContact?.primaryPhone}
          </div>
        </div>
      ),
    },
    {
      key: "address",
      label: "Adresse",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="text-sm">
            {row.address?.street}, {row.address?.postalCode} {row.address?.city}
          </div>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Mode de paiement",
      render: (_: unknown, row: TableRowData) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.financialInfo?.paymentMethod === "card"
              ? "bg-blue-100 text-blue-800"
              : row.financialInfo?.paymentMethod === "check"
              ? "bg-green-100 text-green-800"
              : row.financialInfo?.paymentMethod === "transfer"
              ? "bg-purple-100 text-purple-800"
              : row.financialInfo?.paymentMethod === "cash"
              ? "bg-orange-100 text-orange-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.financialInfo?.paymentMethod === "card"
            ? "Carte"
            : row.financialInfo?.paymentMethod === "check"
            ? "Chèque"
            : row.financialInfo?.paymentMethod === "transfer"
            ? "Virement"
            : row.financialInfo?.paymentMethod === "cash"
            ? "Espèces"
            : "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, row: TableRowData) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "client"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status === "client" ? "Client" : "Prospect"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date d'ajout",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm text-gray-500">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString("fr-FR")
            : "N/A"}
        </div>
      ),
    },
    {
      key: "settlementNotes",
      label: "Notes de règlement",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {settlementCounts[row._id] || 0}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <div className="table__actions">
          {row.status === "prospect" ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleUpdateStatus(row._id, "client")}
            >
              Créer une note de règlement
            </Button>
          ) : (
            <>
              {settlementCounts[row._id] === 0 ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    navigate(`/admin/dashboard/create?familyId=${row._id}`)
                  }
                >
                  Créer une note de règlement
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    navigate(`/admin/settlements?familyId=${row._id}`)
                  }
                >
                  Voir les notes de règlement ({settlementCounts[row._id]})
                </Button>
              )}
            </>
          )}
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
          { label: "Tableau de bord", href: "/admin/dashboard" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Tableau de bord - Prospects et Clients</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {stats && (
          <Container layout="grid" padding="none">
            <SummaryCard
              title="SYNTHESE GLOBALE"
              metrics={[
                {
                  value: stats.total,
                  label: "Total familles",
                  variant: "primary",
                },
                {
                  value: stats.clients,
                  label: "  Clients",
                  variant: "success",
                },
              ]}
            />
            <SummaryCard
              title="STATUTS"
              metrics={[
                { value: stats.clients, label: "Clients", variant: "success" },
                {
                  value: stats.prospects,
                  label: "Prospects",
                  variant: "warning",
                },
              ]}
            />
          </Container>
        )}

        <Container layout="flex">
          <ButtonGroup
            variant="triple"
            buttons={[
              {
                text: "Créer une famille",
                variant: "primary",
                onClick: handleCreateFamily,
              },
              {
                text: "Créer une NDR",
                variant: "secondary",
                onClick: () => navigate("/admin/dashboard/create"),
              },
              { text: "Exporter", variant: "secondary" },
            ]}
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

        <Container layout="flex">
          <Input
            placeholder="Rechercher par nom, email, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            button={
              <Button variant="primary" onClick={handleSearch}>
                Appliquer
              </Button>
            }
          />
        </Container>

        <Container layout="flex-col">
          <h3>Liste des prospects</h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement des prospects...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm
                  ? "Aucune famille trouvée pour cette recherche"
                  : "Aucune famille disponible"}
              </div>
            </div>
          ) : (
            <Table columns={familyColumns} data={tableData} />
          )}
        </Container>
      </Container>
    </div>
  );
};
