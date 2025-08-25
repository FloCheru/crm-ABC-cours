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
  DeletionPreviewModal,
} from "../../components";
import { ModalWrapper } from "../../components/ui/ModalWrapper/ModalWrapper";
import { EntityForm } from "../../components/forms/EntityForm";
import { familyService } from "../../services/familyService";
import type { Family } from "../../types/family";
// import type { FamilyStats } from "../../services/familyService";
// import { useRefresh } from "../../hooks/useRefresh"; // Géré par le cache
import { useFamiliesCache } from "../../hooks/useFamiliesCache";
import { useCacheInvalidation } from "../../hooks/useCacheInvalidation";
import { StatusDot, type ProspectStatus } from "../../components/StatusDot";
import "./Prospects.css";

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };
type CreateFamilyData = Omit<Family, "_id" | "createdAt" | "updatedAt">;

export const Prospects: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const { refreshTrigger } = useRefresh(); // Géré par le cache
  const [refreshKey, setRefreshKey] = useState(0); // Pour forcer le rechargement
  
  const {
    familiesData,
    isFromCache,
    isLoading,
    setCacheData,
    getProspects,
    getStats,
  } = useFamiliesCache({
    dependencies: [refreshKey] // Déclenche un rechargement quand refreshKey change
  });
  const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();
  const [error, setError] = useState<string>("");
  console.log("Error state available:", !!setError); // Utilisation technique

  // Données extraites du cache unifié
  const familyData = getProspects();
  const stats = getStats();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProspectModalOpen, setIsCreateProspectModalOpen] =
    useState(false);
  const [isDeletionPreviewModalOpen, setIsDeletionPreviewModalOpen] =
    useState(false);
  const [deletionPreviewData, setDeletionPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<string | null>(null);

  // Log pour indiquer si les données proviennent du cache unifié
  useEffect(() => {
    if (familiesData) {
      console.log(
        `📊 Prospects: Données ${
          isFromCache ? "récupérées depuis le cache unifié" : "chargées depuis l'API"
        } - ${familyData.length} prospects filtrés`
      );
    }
  }, [familiesData, isFromCache, familyData.length]);

  const handleCreateProspect = () => {
    setIsCreateProspectModalOpen(true);
  };

  const handleCreateSettlementNote = (familyId: string) => {
    navigate(`/admin/dashboard/create/wizard?familyId=${familyId}`);
  };

  // Gérer le changement de statut d'un prospect - avec mise à jour optimiste
  const handleStatusChange = async (
    prospectId: string,
    newStatus: ProspectStatus | null
  ) => {
    if (!familiesData) return;

    // Mise à jour optimiste du cache unifié
    const updatedFamilies = familiesData.families.map((family) =>
      family._id === prospectId
        ? { ...family, prospectStatus: newStatus }
        : family
    );

    // Recalculer les filtres après modification
    const prospects = updatedFamilies.filter(f => f.status === 'prospect');
    const clients = updatedFamilies.filter(f => f.status === 'client');

    const optimisticData = {
      ...familiesData,
      families: updatedFamilies,
      prospects,
      clients,
    };

    // Mettre à jour le cache immédiatement pour l'affichage
    setCacheData(optimisticData);

    try {
      // Puis synchroniser avec l'API
      await familyService.updateProspectStatus(prospectId, newStatus);
      console.log(
        `✅ Statut mis à jour pour le prospect ${prospectId} - Optimiste + API`
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      // En cas d'erreur, invalider tous les caches pour recharger les vraies données
      invalidateAllFamilyRelatedCaches();
      throw error;
    }
  };

  // Gérer le changement d'objet de rappel - avec mise à jour optimiste
  const handleReminderSubjectUpdate = (
    familyId: string,
    newSubject: string
  ) => {
    if (!familiesData) return;

    // Mise à jour optimiste du cache unifié
    const updatedFamilies = familiesData.families.map((family) =>
      family._id === familyId
        ? { ...family, nextActionReminderSubject: newSubject }
        : family
    );

    // Recalculer les filtres après modification
    const prospects = updatedFamilies.filter(f => f.status === 'prospect');
    const clients = updatedFamilies.filter(f => f.status === 'client');

    const optimisticData = {
      ...familiesData,
      families: updatedFamilies,
      prospects,
      clients,
    };

    // Mettre à jour le cache immédiatement
    setCacheData(optimisticData);
    console.log(
      `✅ Objet de rappel mis à jour pour la famille ${familyId} - Optimiste`
    );
  };

  // Gérer le changement de date de rappel - avec mise à jour optimiste
  const handleNextActionDateUpdate = (
    familyId: string,
    newDate: Date | null
  ) => {
    if (!familiesData) return;

    // Mise à jour optimiste du cache unifié
    const updatedFamilies = familiesData.families.map((family) =>
      family._id === familyId
        ? { ...family, nextActionDate: newDate }
        : family
    );

    // Recalculer les filtres après modification
    const prospects = updatedFamilies.filter(f => f.status === 'prospect');
    const clients = updatedFamilies.filter(f => f.status === 'client');

    const optimisticData = {
      ...familiesData,
      families: updatedFamilies,
      prospects,
      clients,
    };

    // Mettre à jour le cache immédiatement
    setCacheData(optimisticData);
    console.log(
      `✅ Date de rappel mise à jour pour la famille ${familyId} - Optimiste`
    );
  };

  // Gérer la suppression d'un prospect avec aperçu détaillé
  const handleDeleteProspect = async (prospectId: string) => {
    try {
      setProspectToDelete(prospectId);
      setIsLoadingPreview(true);
      setIsDeletionPreviewModalOpen(true);

      // Récupérer l'aperçu de suppression
      const previewData = await familyService.getDeletionPreview(prospectId);
      setDeletionPreviewData(previewData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'aperçu:", error);
      setDeletionPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Confirmer la suppression après l'aperçu
  const handleConfirmDeletion = async () => {
    if (!prospectToDelete) return;

    try {
      await familyService.deleteFamily(prospectToDelete);

      // Invalider tous les caches liés aux familles pour rafraîchir automatiquement
      invalidateAllFamilyRelatedCaches();
      
      const prospect = familyData.find((f) => f._id === prospectToDelete);
      const fullName = prospect
        ? `${prospect.primaryContact.firstName} ${prospect.primaryContact.lastName}`
        : "le prospect";
      
      console.log(
        `✅ Prospect ${fullName} supprimé avec succès - Caches invalidés`
      );

      // Fermer le modal et réinitialiser
      setIsDeletionPreviewModalOpen(false);
      setProspectToDelete(null);
      setDeletionPreviewData(null);

      // Forcer le rechargement en changeant la clé de refresh
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        console.log("🔄 Rechargement forcé des données prospects déclenché après suppression");
      }, 200);
    } catch (error) {
      console.error("Erreur lors de la suppression du prospect:", error);
      alert("Erreur lors de la suppression du prospect");
    }
  };

  // Annuler la suppression
  const handleCancelDeletion = () => {
    setIsDeletionPreviewModalOpen(false);
    setProspectToDelete(null);
    setDeletionPreviewData(null);
    setIsLoadingPreview(false);
  };

  const handleSearch = () => {
    console.log("Recherche:", searchTerm);
  };

  const handleFilter = () => {
    console.log("Filtres appliqués");
  };

  const handleReset = () => {
    setSearchTerm("");
    // Les données seront automatiquement rafraîchies par le système de cache
  };

  // Filtrer les données selon le terme de recherche
  const filteredData = familyData.filter((family) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName =
      `${family.primaryContact.firstName} ${family.primaryContact.lastName}`.toLowerCase();
    const phone = family.primaryContact.primaryPhone || "";
    const address =
      `${family.address.street} ${family.address.city}`.toLowerCase();

    return (
      fullName.includes(searchLower) ||
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
        <div className="font-medium text-sm">{row.primaryContact.lastName}</div>
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
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.primaryContact.primaryPhone}</div>
      ),
    },
    {
      key: "postalCode",
      label: "Code postal",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.address.postalCode}</div>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.address.city}</div>
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
      key: "createdAt",
      label: "Date création",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "niveau",
      label: "Niveau",
      render: (_: unknown, row: TableRowData) => {
        const grades = row.students?.map(s => s.school?.grade).filter(Boolean) || [];
        return <div className="text-sm">{grades.join(", ") || "-"}</div>;
      },
    },
    {
      key: "beneficiaire",
      label: "Bénéficiaire", 
      render: (_: unknown, row: TableRowData) => {
        if (row.demande?.beneficiaryType === "adulte") {
          return <div className="text-sm">Adulte</div>;
        }
        const studentNames = row.students?.map(s => `${s.firstName} ${s.lastName}`) || [];
        return <div className="text-sm">{studentNames.join(", ") || "Élèves à créer"}</div>;
      },
    },
    {
      key: "professeurPrevu",
      label: "Professeur prévu",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.plannedTeacher || "-"}</div>
      ),
    },
    {
      key: "matiere", 
      label: "Matière",
      render: (_: unknown, row: TableRowData) => {
        const subjects = row.demande?.subjects || [];
        return <div className="text-sm">{subjects.join(", ") || "-"}</div>;
      },
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

      // Invalider tous les caches liés aux familles pour rafraîchir automatiquement
      invalidateAllFamilyRelatedCaches();
      console.log("✅ Caches families et NDR invalidés après création de prospect");
      
      // Forcer le rechargement en changeant la clé de refresh
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        console.log("🔄 Rechargement forcé des données prospects déclenché");
      }, 200);
    } catch (err) {
      console.error("Erreur lors de la création du prospect:", err);
      throw err;
    }
  };

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb items={[{ label: "Prospects", href: "/prospects" }]} />
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
                text: "Ajouter un prospect",
                variant: "primary",
                onClick: handleCreateProspect,
              },
            ]}
          />
        </Container>

        <Container layout="flex">
          <Input
            placeholder="Rechercher par nom, téléphone, adresse..."
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
            <Table 
              columns={prospectsColumns} 
              data={tableData}
              onRowClick={(row) => navigate(`/families/${row._id}`)}
            />
          )}
        </Container>
      </Container>

      {/* Modal de création d'un prospect */}
      {isCreateProspectModalOpen && (
        <ModalWrapper
          isOpen={isCreateProspectModalOpen}
          onClose={() => setIsCreateProspectModalOpen(false)}
        >
          <EntityForm
            entityType="family"
            familyMode="prospect"
            onSubmit={async (data) =>
              await handleCreateProspectSubmit(data as CreateFamilyData)
            }
            onCancel={() => setIsCreateProspectModalOpen(false)}
          />
        </ModalWrapper>
      )}

      {/* Modal d'aperçu de suppression */}
      <DeletionPreviewModal
        isOpen={isDeletionPreviewModalOpen}
        onClose={handleCancelDeletion}
        onConfirm={handleConfirmDeletion}
        previewData={deletionPreviewData}
        isLoading={isLoadingPreview}
      />
    </div>
  );
};
