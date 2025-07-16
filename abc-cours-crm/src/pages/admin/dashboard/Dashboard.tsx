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
import { settlementService } from "../../../services/settlementService";
import type {
  SettlementNote,
  SettlementNoteStats,
} from "../../../types/settlement";

// Type pour les données du tableau avec l'id requis
type TableRowData = SettlementNote & { id: string };

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [settlementData, setSettlementData] = useState<SettlementNote[]>([]);
  const [stats, setStats] = useState<SettlementNoteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les données des notes de règlement
  useEffect(() => {
    const loadSettlementData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [data, statsData] = await Promise.all([
          settlementService.getSettlementNotes(),
          settlementService.getSettlementStats(),
        ]);
        setSettlementData(Array.isArray(data) ? data : []);
        setStats(statsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
        console.error("Erreur lors du chargement des notes de règlement:", err);
        setSettlementData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettlementData();
  }, []);

  const handleCreateSettlement = () => {
    navigate("/admin/dashboard/create");
  };

  const handleEditSettlement = (settlementId: string) => {
    navigate(`/admin/dashboard/edit/${settlementId}`);
  };

  const handleDeleteSettlement = async (settlementId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette note de règlement ?"
      )
    ) {
      try {
        await settlementService.deleteSettlementNote(settlementId);
        // Recharger les données après suppression
        const [updatedData, updatedStats] = await Promise.all([
          settlementService.getSettlementNotes(),
          settlementService.getSettlementStats(),
        ]);
        setSettlementData(updatedData);
        setStats(updatedStats);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de la suppression"
        );
      }
    }
  };

  const handleMarkAsPaid = async (settlementId: string) => {
    try {
      await settlementService.markAsPaid(settlementId);
      // Recharger les données après mise à jour
      const [updatedData, updatedStats] = await Promise.all([
        settlementService.getSettlementNotes(),
        settlementService.getSettlementStats(),
      ]);
      setSettlementData(updatedData);
      setStats(updatedStats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du marquage comme payé"
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
  const filteredData = settlementData.filter(
    (settlement) =>
      settlement.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Transformer les données pour le tableau (ajouter l'id requis)
  const tableData: TableRowData[] = filteredData.map((settlement) => ({
    ...settlement,
    id: settlement._id,
  }));

  const settlementColumns = [
    {
      key: "clientName",
      label: "Client",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">{row.clientName}</div>
          <div className="text-sm text-gray-500">{row.department}</div>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Mode de règlement",
      render: (_: unknown, row: TableRowData) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.paymentMethod === "card"
              ? "bg-blue-100 text-blue-800"
              : row.paymentMethod === "check"
              ? "bg-green-100 text-green-800"
              : row.paymentMethod === "transfer"
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.paymentMethod === "card"
            ? "Carte"
            : row.paymentMethod === "check"
            ? "Chèque"
            : row.paymentMethod === "transfer"
            ? "Virement"
            : "Espèces"}
        </span>
      ),
    },
    {
      key: "subject",
      label: "Matière",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.subject.name}</div>
      ),
    },
    {
      key: "hourlyRate",
      label: "Tarif horaire",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.hourlyRate.toFixed(2)} €</div>
      ),
    },
    {
      key: "quantity",
      label: "Quantité",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.quantity}</div>
      ),
    },
    {
      key: "professorSalary",
      label: "Salaire prof",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.professorSalary.toFixed(2)} €</div>
      ),
    },
    {
      key: "salaryToPay",
      label: "Salaire à verser",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.salaryToPay.toFixed(2)} €</div>
      ),
    },
    {
      key: "charges",
      label: "Charges",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.charges.toFixed(2)} €</div>
      ),
    },
    {
      key: "chargesToPay",
      label: "Charges à verser",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.chargesToPay.toFixed(2)} €</div>
      ),
    },
    {
      key: "marginAmount",
      label: "Marge",
      render: (_: unknown, row: TableRowData) => (
        <div>
          <div className="font-medium">{row.marginAmount.toFixed(2)} €</div>
          <div className="text-sm text-gray-500">
            {row.marginPercentage.toFixed(1)}%
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, row: TableRowData) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "paid"
              ? "bg-green-100 text-green-800"
              : row.status === "overdue"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status === "paid"
            ? "Payé"
            : row.status === "overdue"
            ? "En retard"
            : "En attente"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <div className="table__actions">
          {row.status !== "paid" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleMarkAsPaid(row._id)}
            >
              Marquer payé
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEditSettlement(row._id)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="error"
            onClick={() => handleDeleteSettlement(row._id)}
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
          { label: "Tableau de bord", href: "/admin/dashboard" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Tableau de bord - Notes de règlement</h1>

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
                  value: `${stats.totalAmount.toFixed(2)} €`,
                  label: "Montant total",
                  variant: "primary",
                },
                {
                  value: stats.total,
                  label: "Total NDR",
                  variant: "success",
                },
              ]}
            />
            <SummaryCard
              title="STATUTS"
              metrics={[
                { value: stats.paid, label: "Payées", variant: "success" },
                {
                  value: stats.pending,
                  label: "En attente",
                  variant: "warning",
                },
                { value: stats.overdue, label: "En retard", variant: "error" },
              ]}
            />
          </Container>
        )}

        <Container layout="flex">
          <ButtonGroup
            variant="triple"
            buttons={[
              {
                text: "Créer une NDR",
                variant: "primary",
                onClick: handleCreateSettlement,
              },
              { text: "Exporter", variant: "secondary" },
              { text: "Importer", variant: "secondary" },
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
            placeholder="Rechercher par client, département, matière..."
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
          <h3>Liste des notes de règlement</h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                Chargement des notes de règlement...
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm
                  ? "Aucune note trouvée pour cette recherche"
                  : "Aucune note de règlement disponible"}
              </div>
            </div>
          ) : (
            <Table columns={settlementColumns} data={tableData} />
          )}
        </Container>
      </Container>
    </div>
  );
};
