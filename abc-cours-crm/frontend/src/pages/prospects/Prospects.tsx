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
} from "../../components";
import { ModalWrapper } from "../../components/ui/ModalWrapper/ModalWrapper";
import { EntityForm } from "../../components/forms/EntityForm";
import { familyService } from "../../services/familyService";
import type { Family } from "../../types/family";
import type { FamilyStats } from "../../services/familyService";
import { useRefresh } from "../../hooks/useRefresh";

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };
type CreateFamilyData = Omit<Family, "_id" | "createdAt" | "updatedAt">;

export const Prospects: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshTrigger } = useRefresh();
  const [familyData, setFamilyData] = useState<Family[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProspectModalOpen, setIsCreateProspectModalOpen] = useState(false);

  // Fonction pour charger les données des prospects uniquement
  const loadProspectData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [data, statsData] = await Promise.all([
        familyService.getFamilies(),
        familyService.getFamilyStats(),
      ]);
      const families = Array.isArray(data) ? data : [];
      
      // Filtrer pour ne garder que les prospects
      const prospects = families.filter(family => family.status === "prospect");
      setFamilyData(prospects);
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
      console.error("Erreur lors du chargement des prospects:", err);
      setFamilyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProspectData();
  }, [refreshTrigger]);

  const handleCreateProspect = () => {
    setIsCreateProspectModalOpen(true);
  };

  const handleConvertToClient = async (prospectId: string) => {
    try {
      // TODO: Implémenter la conversion prospect -> client
      console.log("Convertir prospect en client:", prospectId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la conversion"
      );
    }
  };

  const handleCreateSettlementNote = (familyId: string) => {
    navigate(`/admin/dashboard/create?familyId=${familyId}`);
  };

  const handleSearch = () => {
    console.log("Recherche:", searchTerm);
  };

  const handleFilter = () => {
    console.log("Filtres appliqués");
  };

  const handleReset = () => {
    setSearchTerm("");
    loadProspectData();
  };

  // Filtrer les données selon le terme de recherche
  const filteredData = familyData.filter((family) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${family.primaryContact.firstName} ${family.primaryContact.lastName}`.toLowerCase();
    const email = family.primaryContact.email?.toLowerCase() || "";
    const phone = family.primaryContact.phone || "";
    const address = `${family.address.street} ${family.address.city}`.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
      address.includes(searchLower)
    );
  });

  // Transformer les données pour le tableau
  const tableData: TableRowData[] = filteredData.map((family) => ({
    ...family,
    id: family._id,
  }));

  // Fonction pour obtenir la couleur selon le statut du prospect
  const getProspectStatusColor = (status?: string) => {
    switch (status) {
      case 'en_reflexion': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'interesse_prof_a_trouver': return 'bg-red-100 text-red-800 border-red-200';
      case 'injoignable': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ndr_editee': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'premier_cours_effectue': return 'bg-green-100 text-green-800 border-green-200';
      case 'rdv_prospect': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'ne_va_pas_convertir': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Configuration des colonnes du tableau
  const prospectsColumns = [
    {
      key: "lastName",
      label: "Nom",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">
          {row.primaryContact.lastName}
        </div>
      ),
    },
    {
      key: "firstName",
      label: "Prénom",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">
          {row.primaryContact.firstName}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.primaryContact.email}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.primaryContact.primaryPhone}
        </div>
      ),
    },
    {
      key: "street",
      label: "Rue",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.address.street}
        </div>
      ),
    },
    {
      key: "postalCode",
      label: "Code postal",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.address.postalCode}
        </div>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.address.city}
        </div>
      ),
    },
    {
      key: "reminderSubject",
      label: "Objet du rappel",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.nextActionReminderSubject || "-"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, row: TableRowData) => (
        <div className={`px-2 py-1 rounded border text-xs ${getProspectStatusColor(row.prospectStatus)}`}>
          {row.prospectStatus === 'en_reflexion' && 'En réflexion'}
          {row.prospectStatus === 'interesse_prof_a_trouver' && 'Intéressé, prof à trouver'}
          {row.prospectStatus === 'injoignable' && 'Injoignable'}
          {row.prospectStatus === 'ndr_editee' && 'NDR éditée'}
          {row.prospectStatus === 'premier_cours_effectue' && 'Premier cours effectué'}
          {row.prospectStatus === 'rdv_prospect' && 'RDV prospect'}
          {row.prospectStatus === 'ne_va_pas_convertir' && 'Ne va pas convertir'}
          {!row.prospectStatus && 'Non défini'}
        </div>
      ),
    },
    {
      key: "nextActionDate",
      label: "RRR",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.nextActionDate 
            ? new Date(row.nextActionDate).toLocaleDateString("fr-FR")
            : "-"
          }
        </div>
      ),
    },
    {
      key: "children",
      label: "Enfants",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.students && row.students.length > 0
            ? row.students.map(s => typeof s === 'string' ? s : `${s.firstName} ${s.lastName}`).join(", ")
            : "Aucun"}
        </div>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.source || "Non spécifié"}</div>
      ),
    },
    {
      key: "createdAt",
      label: "Date création",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <div className="table__actions">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleConvertToClient(row._id)}
          >
            Convertir en client
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCreateSettlementNote(row._id)}
          >
            Créer NDR
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateProspectSubmit = async (data: CreateFamilyData) => {
    try {
      // Ajouter le statut prospect aux données
      const prospectData = {
        ...data,
        status: "prospect" as const,
      };
      
      await familyService.createFamily(prospectData);
      setIsCreateProspectModalOpen(false);
      loadProspectData(); // Recharger les données
    } catch (err) {
      console.error("Erreur lors de la création du prospect:", err);
      throw err;
    }
  };

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Prospects", href: "/prospects" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Gestion des Prospects</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Container layout="grid" padding="none">
          <SummaryCard
            title="PROSPECTS"
            metrics={[
              {
                value: stats?.prospects || 0,
                label: "Total prospects",
                variant: "primary",
              },
              {
                value: familyData.length,
                label: "Prospects actifs",
                variant: "success",
              },
            ]}
          />
        </Container>

        <Container layout="flex">
          <ButtonGroup
            variant="single"
            buttons={[
              {
                text: "Créer un prospect",
                variant: "primary",
                onClick: handleCreateProspect,
              },
            ]}
          />
        </Container>

        <Container layout="flex">
          <Input
            placeholder="Rechercher par nom, email, téléphone, adresse..."
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
          <h3>Liste des prospects</h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement des prospects...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm
                  ? "Aucun prospect trouvé pour cette recherche"
                  : "Aucun prospect disponible"}
              </div>
            </div>
          ) : (
            <Table columns={prospectsColumns} data={tableData} />
          )}
        </Container>
      </Container>

      {/* Modal de création d'un prospect */}
      {isCreateProspectModalOpen && (
        <ModalWrapper
          isOpen={isCreateProspectModalOpen}
          onClose={() => setIsCreateProspectModalOpen(false)}
          title="Créer un nouveau prospect"
        >
          <EntityForm
            entityType="family"
            onSubmit={handleCreateProspectSubmit}
            onCancel={() => setIsCreateProspectModalOpen(false)}
          />
        </ModalWrapper>
      )}
    </div>
  );
};