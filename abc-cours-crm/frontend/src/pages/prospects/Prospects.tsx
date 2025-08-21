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
  ReminderSubjectDropdown,
  DatePicker,
} from "../../components";
import { ModalWrapper } from "../../components/ui/ModalWrapper/ModalWrapper";
import { EntityForm } from "../../components/forms/EntityForm";
import { familyService } from "../../services/familyService";
import type { Family } from "../../types/family";
import type { FamilyStats } from "../../services/familyService";
import { useRefresh } from "../../hooks/useRefresh";
import { StatusDot, type ProspectStatus } from "../../components/StatusDot";
import "./Prospects.css";

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


  const handleCreateSettlementNote = (familyId: string) => {
    navigate(`/admin/dashboard/create?familyId=${familyId}`);
  };

  // Gérer le changement de statut d'un prospect - optimisé pour éviter le rechargement complet
  const handleStatusChange = async (prospectId: string, newStatus: ProspectStatus | null) => {
    try {
      await familyService.updateProspectStatus(prospectId, newStatus);
      
      // Mise à jour locale optimisée au lieu du rechargement complet
      setFamilyData(prevData => 
        prevData.map(family => 
          family._id === prospectId 
            ? { ...family, prospectStatus: newStatus } as Family
            : family
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error; // Relancer l'erreur pour que le StatusDot puisse gérer l'affichage
    }
  };

  // Gérer le changement d'objet de rappel - optimisé pour éviter le rechargement complet
  const handleReminderSubjectUpdate = (familyId: string, newSubject: string) => {
    setFamilyData(prevData => 
      prevData.map(family => 
        family._id === familyId 
          ? { ...family, nextActionReminderSubject: newSubject }
          : family
      )
    );
  };

  // Gérer le changement de date de rappel - optimisé pour éviter le rechargement complet
  const handleNextActionDateUpdate = (familyId: string, newDate: Date | null) => {
    setFamilyData(prevData => 
      prevData.map(family => 
        family._id === familyId 
          ? { ...family, nextActionDate: newDate } as Family
          : family
      )
    );
  };

  // Gérer la suppression d'un prospect
  const handleDeleteProspect = async (prospectId: string) => {
    const prospect = familyData.find(f => f._id === prospectId);
    const fullName = prospect ? `${prospect.primaryContact.firstName} ${prospect.primaryContact.lastName}` : "ce prospect";
    
    if (window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${fullName} ?\n\n` +
      `Cette action supprimera également tous les élèves associés et ne peut pas être annulée.`
    )) {
      try {
        await familyService.deleteFamily(prospectId);
        
        // Mise à jour locale pour retirer le prospect supprimé
        setFamilyData(prevData => prevData.filter(family => family._id !== prospectId));
        
        // Mettre à jour les statistiques
        setStats(prevStats => prevStats ? {
          ...prevStats,
          prospects: prevStats.prospects - 1
        } : null);
        
        console.log(`Prospect ${fullName} supprimé avec succès`);
      } catch (error) {
        console.error("Erreur lors de la suppression du prospect:", error);
        alert("Erreur lors de la suppression du prospect");
      }
    }
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
    const phone = family.primaryContact.primaryPhone || "";
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
        <ReminderSubjectDropdown
          value={row.nextActionReminderSubject || "Actions à définir"}
          familyId={row._id}
          onUpdate={handleReminderSubjectUpdate}
        />
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, row: TableRowData) => (
        <StatusDot
          status={row.prospectStatus as ProspectStatus}
          prospectId={row._id}
          onStatusChange={handleStatusChange}
        />
      ),
    },
    {
      key: "nextActionDate",
      label: "RRR",
      render: (_: unknown, row: TableRowData) => (
        <DatePicker
          value={row.nextActionDate || null}
          familyId={row._id}
          onUpdate={handleNextActionDateUpdate}
        />
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
            onClick={() => handleCreateSettlementNote(row._id)}
          >
            Créer NDR
          </Button>
          <Button
            size="sm"
            variant="error"
            onClick={() => handleDeleteProspect(row._id)}
            title="Supprimer le prospect"
          >
            ✕
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
        >
          <div>
            <h2 className="text-xl font-bold mb-4">Créer un nouveau prospect</h2>
            <EntityForm
              entityType="family"
              onSubmit={async (data) => await handleCreateProspectSubmit(data as CreateFamilyData)}
              onCancel={() => setIsCreateProspectModalOpen(false)}
            />
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};