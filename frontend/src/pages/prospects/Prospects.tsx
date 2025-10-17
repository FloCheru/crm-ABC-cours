import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
  ReminderSubjectDropdown,
  DatePicker,
  PageHeader,
  Modal,
} from "../../components";
import { ModalWrapper } from "../../components/ui/ModalWrapper/ModalWrapper";
import { EntityForm } from "../../components/forms/EntityForm";
import { familyService } from "../../services/familyService";
import { subjectService } from "../../services/subjectService";
import { userService } from "../../services/userService";
import type {
  Family,
  CreateFamilyData as CreateFamilyDataType,
} from "../../types/family";
import { StatusDot, type ProspectStatus } from "../../components/StatusDot";
import {
  updateProspectStatus,
  updateNextAction,
  updateNextActionDate,
} from "../../utils/prospectUpdates";
import { useStudentModal, createTestStudent } from "../../utils/studentUtils";
import "./Prospects.css";

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };

export const Prospects: React.FC = () => {
  const navigate = useNavigate();

  // États locaux simples
  const [prospects, setProspects] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setStats] = useState({ prospects: 0 });

  // Récupération des données au chargement
  useEffect(() => {
    // // Nettoyage des données de session NDR
    // localStorage.removeItem("selectedFamily");
    // localStorage.removeItem("from");
    // localStorage.removeItem("ndrData");

    const fetchProspects = async () => {
      try {
        setIsLoading(true);
        const families = await familyService.getFamilies();
        console.log("Familles Voiiir:", families);
        setProspects(
          families.filter((family) => !family.ndr || family.ndr.length === 0)
        );
        setStats({ prospects: families.length });
      } catch (error) {
        console.error("Erreur lors de la récupération des prospects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspects();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProspectModalOpen, setIsCreateProspectModalOpen] =
    useState(false);

  // Utilisation du hook factorisé pour la gestion des élèves
  const {
    showAddStudentModal,
    selectedFamilyForStudent,
    handleAddStudent,
    handleStudentSuccess,
  } = useStudentModal();

  const handleCreateProspect = () => {
    setIsCreateProspectModalOpen(true);
  };

  const handleCreateNDR = (familyId: string) => {
    // Trouver la famille dans la liste des prospects
    const selectedFamily = prospects.find((family) => family._id === familyId);
    if (selectedFamily) {
      // Stocker la famille complète et l'origine
      localStorage.setItem("selectedFamily", JSON.stringify(selectedFamily));
      localStorage.setItem("from", "prospects");
      navigate(`/admin/beneficiaries-subjects`);
    }
  };

  // handleAddStudent maintenant fourni par le hook useStudentModal

  // Handlers avec mise à jour optimiste locale
  const handleStatusChange = async (
    familyId: string,
    newStatus: ProspectStatus | null
  ) => {
    // Mise à jour optimiste locale
    setProspects((prev) =>
      prev.map((prospect) =>
        prospect._id === familyId
          ? { ...prospect, prospectStatus: newStatus }
          : prospect
      )
    );

    try {
      await updateProspectStatus(familyId, newStatus);
      console.log(`✅ Statut de la famille ${familyId} mis à jour`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      // En cas d'erreur, recharger les données
      const families = await familyService.getFamilies();
      setProspects(
        families.filter((family) => !family.ndr || family.ndr.length === 0)
      );
    }
  };

  const handleNextActionUpdate = async (
    familyId: string,
    newAction: string
  ) => {
    // Mise à jour optimiste locale
    setProspects((prev) =>
      prev.map((prospect) =>
        prospect._id === familyId
          ? { ...prospect, nextAction: newAction }
          : prospect
      )
    );

    try {
      await updateNextAction(familyId, newAction);
      console.log(`✅ Prochaine action de la famille ${familyId} mise à jour`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'action:", error);
      // En cas d'erreur, recharger les données
      const families = await familyService.getFamilies();
      setProspects(
        families.filter((family) => !family.ndr || family.ndr.length === 0)
      );
    }
  };

  const handleNextActionDateUpdate = async (
    familyId: string,
    newDate: Date | null
  ) => {
    // Mise à jour optimiste locale
    setProspects((prev) =>
      prev.map((prospect) =>
        prospect._id === familyId
          ? { ...prospect, nextActionDate: newDate }
          : prospect
      )
    );

    try {
      await updateNextActionDate(familyId, newDate);
      console.log(
        `✅ Date de la prochaine action de la famille ${familyId} mise à jour`
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la date:", error);
      // En cas d'erreur, recharger les données
      const families = await familyService.getFamilies();
      setProspects(
        families.filter((family) => !family.ndr || family.ndr.length === 0)
      );
    }
  };

  // Gérer la suppression d'un prospect avec confirmation simple
  const handleDeleteProspect = async (prospectId: string) => {
    const prospectToDelete = prospects.find((p) => p._id === prospectId);
    if (!prospectToDelete) return;

    const fullName = `${prospectToDelete.primaryContact?.firstName} ${prospectToDelete.primaryContact?.lastName}`;

    // Demander confirmation
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le prospect "${fullName}" ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      // Mise à jour optimiste de l'UI
      setProspects((prev) => prev.filter((p) => p._id !== prospectId));
      setStats((prev) => ({ prospects: prev.prospects - 1 }));

      // Suppression via l'API
      await familyService.deleteFamily(prospectId);
      console.log(`✅ Prospect ${fullName} supprimé avec succès`);
    } catch (error) {
      console.error("Erreur lors de la suppression du prospect:", error);

      // En cas d'erreur, recharger les données
      const families = await familyService.getFamilies();
      setProspects(
        families.filter((family) => !family.ndr || family.ndr.length === 0)
      );
      setStats({ prospects: families.length });

      alert("Erreur lors de la suppression du prospect. Veuillez réessayer.");
    }
  };

  const handleFilter = () => {};

  const handleReset = () => {
    setSearchTerm("");
    // Les données seront automatiquement rafraîchies par le système de cache
  };

  // Filtrer les données selon le terme de recherche
  const filteredData = prospects.filter((family) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName =
      `${family.primaryContact?.firstName} ${family.primaryContact?.lastName}`.toLowerCase();
    const phone = family.primaryContact?.primaryPhone || "";
    const email = (family.primaryContact?.email || "").toLowerCase();
    const address = `${family.address?.street || ""} ${
      family.address?.city || ""
    } ${family.address?.postalCode || ""}`.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      phone.includes(searchLower) ||
      email.includes(searchLower) ||
      address.includes(searchLower)
    );
  });

  // Configuration des colonnes du tableau
  const prospectsColumns = [
    {
      key: "lastName",
      label: "Nom",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">
          {row.primaryContact?.lastName}
        </div>
      ),
    },
    {
      key: "firstName",
      label: "Prénom",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">
          {row.primaryContact?.firstName}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: TableRowData) => {
        const primary = row.primaryContact?.primaryPhone;
        const secondary = row.secondaryContact?.phone;

        if (!primary && !secondary) {
          return <div className="text-sm text-gray-400">non renseigné</div>;
        }

        return (
          <div className="text-sm">
            {primary && `${primary}${
              row.primaryContact?.relation
                ? ` (${row.primaryContact?.relation})`
                : ""
            }`}
            {secondary && ` ${secondary}${
              row.secondaryContact?.relation
                ? ` (${row.secondaryContact?.relation})`
                : ""
            }`}
          </div>
        );
      },
    },
    {
      key: "postalCode",
      label: "Code postal",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.address?.postalCode || "-"}</div>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.address?.city || "-"}</div>
      ),
    },
    {
      key: "reminderSubject",
      label: "Objet du rappel",
      render: (_: unknown, row: TableRowData) => (
        <ReminderSubjectDropdown
          value={row.nextAction || "Actions à définir"}
          familyId={row._id}
          onUpdate={handleNextActionUpdate}
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
            .map((student) => student.school?.grade)
            .filter((level) => level) // Filtrer les niveaux vides
            .filter((level, index, array) => array.indexOf(level) === index); // Niveaux uniques

          if (studentLevels.length > 0) {
            return <div className="text-sm">{studentLevels.join(", ")}</div>;
          }
        }

        // Priorité 2: Niveau de la demande (logique actuelle)
        const level = (row.demande as any)?.level || row.demande?.grade;
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

        const studentNames =
          row.students?.map((s) => `${s.firstName} ${s.lastName}`) || [];

        return (
          <div className="flex items-center gap-2">
            <div className="text-sm">
              {studentNames.join(", ") || "Aucun élève"}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleAddStudent(row._id);
              }}
            >
              Ajouter un élève
            </Button>
          </div>
        );
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
        const subjectNames = subjects.map((subject) => subject.name).join(", ");
        return <div className="text-sm">{subjectNames || "-"}</div>;
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
            onClick={() => handleCreateNDR(row._id)}
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

  const handleCreateProspectSubmit = async (data: CreateFamilyDataType) => {
    try {
      // Ajouter le statut prospect aux données
      const prospectData = {
        ...data,
        status: "prospect" as const,
      };

      // Fermer le modal immédiatement
      setIsCreateProspectModalOpen(false);

      // Créer le prospect via l'API
      const newProspect = await familyService.createFamily(prospectData);

      // Ajouter à la liste locale
      setProspects((prev) => [...prev, newProspect]);
      setStats((prev) => ({ prospects: prev.prospects + 1 }));

      console.log("✅ Prospect créé avec succès");
    } catch (err) {
      console.error("Erreur lors de la création du prospect:", err);
      throw err;
    }
  };

  // Créer un prospect de test avec données fixes
  const handleCreateTestProspect = async () => {
    try {
      // Récupérer les données nécessaires
      const [subjects, adminUsers] = await Promise.all([
        subjectService.getSubjects(),
        userService.getAdminUsers(),
      ]);

      // Prendre les 2 premières matières
      const subjectIds = [{ id: subjects[0]._id }, { id: subjects[1]._id }];

      // Prendre le premier admin
      const adminId = adminUsers[0]._id;

      const testProspectData = {
        primaryContact: {
          firstName: "Jean",
          lastName: "Dupont",
          primaryPhone: "0123456789",
          email: "jean.dupont@email.com",
          relation: "père" as const,
          relationship: "père",
        },
        address: {
          street: "123 Rue de la Paix",
          city: "Paris",
          postalCode: "75001",
        },
        demande: {
          beneficiaryType: "eleves" as const,
          grade: "5ème",
          subjects: subjectIds, // Already in correct format: Array<{ id: string }>
          notes: "Prospect créé automatiquement pour les tests",
        },
        billingAddress: {
          street: "123 Rue de la Paix",
          city: "Paris",
          postalCode: "75001",
        },
        ndr: [], // Tableau vide (prospect sans NDR)
        status: "prospect" as const,
        prospectStatus: "en_reflexion" as const,
        notes: "⚡ Prospect de test généré automatiquement",
        createdBy: adminId, // ID du premier admin trouvé
      };
      console.log(testProspectData);

      // Fermer le modal immédiatement
      setIsCreateProspectModalOpen(false);

      // Créer le prospect via l'API
      const newProspect = await familyService.createFamily(testProspectData);

      // Ajouter à la liste locale
      setProspects((prev) => [...prev, newProspect]);

      console.log("🚀 Prospect de test créé avec succès avec vraies données:", {
        subjects: subjects.length,
        admins: adminUsers.length,
        adminUsed: adminId,
      });
    } catch (err) {
      console.error("Erreur lors de la création du prospect de test:", err);
      // Réouvrir la modal en cas d'erreur
      setIsCreateProspectModalOpen(true);
    }
  };

  // Créer un élève de test avec données fixes
  const handleAddStudentTest = async (familyId: string) => {
    const refreshData = async () => {
      const updatedFamilies = await familyService.getFamilies();
      setProspects(
        updatedFamilies.filter(
          (family) => !family.ndr || family.ndr.length === 0
        )
      );
    };

    await createTestStudent(
      familyId,
      handleStudentSuccess,
      handleAddStudent,
      refreshData
    );
  };

  return (
    <main>
      <Container layout="flex-col">
        <PageHeader title="Gestion des Prospects" />
        <Container layout="grid" padding="none">
          <SummaryCard
            title="PROSPECTS"
            metrics={[
              {
                value: prospects.length || 0,
                label: "Total prospects",
                variant: "primary",
              },
              {
                value: prospects.length,
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
              data={filteredData.map((family) => ({
                ...family,
                id: family._id,
              }))}
              onRowClick={(row) => {
                localStorage.setItem("prospectId", row._id);
                navigate("/admin/prospect-details");
              }}
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
          <EntityForm<"family">
            entityType="family"
            familyMode="prospect"
            onSubmit={async (data) => await handleCreateProspectSubmit(data)}
            onCancel={() => setIsCreateProspectModalOpen(false)}
            onCreateTestProspect={handleCreateTestProspect}
          />
        </ModalWrapper>
      )}

      {/* Modal d'ajout d'élève */}
      <Modal
        type="student"
        isOpen={showAddStudentModal}
        onClose={() => {
          handleStudentSuccess();
        }}
        data={{ familyId: selectedFamilyForStudent }}
        onSuccess={() => {
          handleStudentSuccess();
        }}
        onAddStudentTest={handleAddStudentTest}
      />
    </main>
  );
};
