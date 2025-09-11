import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
  ReminderSubjectDropdown,
  DatePicker,
  DeletionPreviewModal,
  PageHeader,
  Modal,
} from "../../components";
import { ModalWrapper } from "../../components/ui/ModalWrapper/ModalWrapper";
import { EntityForm } from "../../components/forms/EntityForm";
import { familyService } from "../../services/familyService";
import type { Family } from "../../types/family";
// import type { FamilyStats } from "../../services/familyService";
// import { useRefresh } from "../../hooks/useRefresh"; // Géré par le cache
import { useFamiliesGlobal } from "../../hooks/useFamiliesGlobal";
import { usePrefillTest } from "../../hooks/usePrefillTest";
import { StatusDot, type ProspectStatus } from "../../components/StatusDot";
import "./Prospects.css";

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };
type CreateFamilyData = Omit<Family, "_id" | "createdAt" | "updatedAt">;

export const Prospects: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    isLoading,
    prospects,
    stats,
    clearCache,
    removeProspectOptimistic,
    updateProspectOptimistic,
  } = useFamiliesGlobal();
  const familyData = prospects;
  
  // Hook pour le préremplissage avec données de test
  const {} = usePrefillTest();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProspectModalOpen, setIsCreateProspectModalOpen] =
    useState(false);
  const [isDeletionPreviewModalOpen, setIsDeletionPreviewModalOpen] =
    useState(false);
  const [deletionPreviewData, setDeletionPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedFamilyForStudent, setSelectedFamilyForStudent] = useState<string | null>(null);
  const [prospectToDelete, setProspectToDelete] = useState<string | null>(null);



  const handleCreateProspect = () => {
    setIsCreateProspectModalOpen(true);
  };

  const handleCreateSettlementNote = (familyId: string) => {
    navigate(`/admin/dashboard/create/wizard?familyId=${familyId}`);
  };

  const handleAddStudent = (familyId: string) => {
    console.log("🎯 [PROSPECTS] Clic 'Ajouter un élève' - familyId:", familyId);
    
    setSelectedFamilyForStudent(familyId);
    setShowAddStudentModal(true);
  };

  // Gérer le changement de statut d'un prospect - avec mise à jour optimiste
  const handleStatusChange = async (
    prospectId: string,
    newStatus: ProspectStatus | null
  ) => {
    if (!familyData.length) return;

    try {
      // 1. MISE À JOUR OPTIMISTE - UX instantanée (0ms)
      updateProspectOptimistic(prospectId, { prospectStatus: newStatus });
      console.log(`✏️ Statut prospect ${prospectId} mis à jour de manière optimiste`);

      // 2. SYNCHRONISATION API avec ActionCache (gère automatiquement le cache)
      await familyService.updateProspectStatus(prospectId, newStatus);
      console.log(`✅ Statut prospect ${prospectId} synchronisé avec l'API et cache mis à jour automatiquement`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      // En cas d'erreur, forcer un rechargement avec les vraies données
      clearCache();
      throw error;
    }
  };

  // Gérer le changement d'objet de rappel - avec mise à jour optimiste
  const handleReminderSubjectUpdate = async (
    familyId: string,
    newSubject: string
  ) => {
    if (!familyData.length) return;

    try {
      // 1. MISE À JOUR OPTIMISTE - UX instantanée (0ms)
      updateProspectOptimistic(familyId, { nextActionReminderSubject: newSubject });
      console.log(`✏️ Objet rappel famille ${familyId} mis à jour de manière optimiste`);

      // 2. SYNCHRONISATION API - en arrière-plan
      await familyService.updateFamily(familyId, { nextActionReminderSubject: newSubject });
      console.log(`✅ Objet rappel famille ${familyId} synchronisé avec l'API`);

      // 3. INVALIDER CACHE - pour autres composants
      // Cache déjà mis à jour automatiquement par ActionCache
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'objet de rappel:", error);
      // En cas d'erreur, forcer un rechargement avec les vraies données
      clearCache();
    }
  };

  // Gérer le changement de date de rappel - avec mise à jour optimiste
  const handleNextActionDateUpdate = async (
    familyId: string,
    newDate: Date | null
  ) => {
    if (!familyData.length) return;

    try {
      // 1. MISE À JOUR OPTIMISTE - UX instantanée (0ms)
      updateProspectOptimistic(familyId, { nextActionDate: newDate });
      console.log(`✏️ Date rappel famille ${familyId} mise à jour de manière optimiste`);

      // 2. SYNCHRONISATION API - en arrière-plan
      await familyService.updateFamily(familyId, { nextActionDate: newDate });
      console.log(`✅ Date rappel famille ${familyId} synchronisée avec l'API`);

      // 3. INVALIDER CACHE - pour autres composants
      // Cache déjà mis à jour automatiquement par ActionCache
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la date de rappel:", error);
      // En cas d'erreur, forcer un rechargement avec les vraies données
      clearCache();
    }
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

    const prospect = familyData.find((f) => f._id === prospectToDelete);
    const fullName = prospect
      ? `${prospect.primaryContact.firstName} ${prospect.primaryContact.lastName}`
      : "le prospect";

    try {
      // 1. SUPPRESSION OPTIMISTE - UX instantanée (0ms)
      removeProspectOptimistic(prospectToDelete);
      
      // Fermer le modal immédiatement
      setIsDeletionPreviewModalOpen(false);
      setProspectToDelete(null);
      setDeletionPreviewData(null);
      
      console.log(`🗑️ Prospect ${fullName} supprimé de manière optimiste - UX instantanée`);

      // 2. SYNCHRONISATION API - en arrière-plan
      await familyService.deleteFamily(prospectToDelete);
      console.log(`✅ Prospect ${fullName} synchronisé avec l'API - suppression confirmée`);

      // 3. INVALIDER CACHE - pour autres composants
      // Cache déjà mis à jour automatiquement par ActionCache
      console.log("✅ Caches families et NDR invalidés après suppression");
      
      // Pas besoin de recharger - la suppression optimiste est définitive !
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
        // Priorité 1: Niveaux des élèves s'ils existent
        if (row.students && row.students.length > 0) {
          const studentLevels = row.students
            .map(student => student.school?.grade)
            .filter(level => level) // Filtrer les niveaux vides
            .filter((level, index, array) => array.indexOf(level) === index); // Niveaux uniques
          
          if (studentLevels.length > 0) {
            return <div className="text-sm">{studentLevels.join(", ")}</div>;
          }
        }
        
        // Priorité 2: Niveau de la demande (logique actuelle)
        const level = row.demande?.beneficiaryLevel;
        return <div className="text-sm">{level || "-"}</div>;
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
        
        // Afficher les élèves + bouton "Ajouter un élève" si beneficiaryType est "eleves"
        if (row.demande?.beneficiaryType === "eleves") {
          return (
            <div className="flex items-center gap-2">
              {studentNames.length > 0 && (
                <div className="text-sm">{studentNames.join(", ")}</div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation(); // Empêcher le clic sur la ligne
                  handleAddStudent(row._id);
                }}
              >
                Ajouter un élève
              </Button>
            </div>
          );
        }
        
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

      // Fermer le modal immédiatement
      setIsCreateProspectModalOpen(false);

      // ActionCache gère automatiquement l'optimistic update et la synchronisation API
      await familyService.createFamily(prospectData);
      console.log("✅ Prospect créé avec succès via ActionCache");
    } catch (err) {
      console.error("Erreur lors de la création du prospect:", err);
      throw err;
    }
  };

  return (
    <main>
      <Navbar activePath={location.pathname} />
      <Container layout="flex-col">
        <PageHeader title="Gestion des Prospects" />

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
            <>
              {console.log("🔍 [DEBUG] TableData IDs:", tableData.map(row => `${row.id} (${typeof row.id})`))}
              {console.log("🔍 [DEBUG] TableData _ids:", tableData.map(row => `${row._id} (${typeof row._id})`))}
              <Table 
                columns={prospectsColumns} 
                data={tableData}
                onRowClick={(row) => navigate(`/families/${row._id}`)}
              />
            </>
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

      {/* Modal d'ajout d'élève */}
      <Modal
        type="student"
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setSelectedFamilyForStudent(null);
        }}
        data={{ familyId: selectedFamilyForStudent }}
        onSuccess={() => {
          setShowAddStudentModal(false);
          setSelectedFamilyForStudent(null);
        }}
      />
    </main>
  );
};
