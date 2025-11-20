import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
  Select,
  Modal,
} from "../../components";
import { KeyRound, UserRound, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { professorService } from "../../services/professorService";

// Type pour les données du tableau avec l'id requis (adapté au modèle Professor)
interface ProfessorTableRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postalCode?: string;
  createdAt: string;
  status?: "active" | "inactive" | "pending" | "suspended";
}

export const Professeurs: React.FC = () => {
  const navigate = useNavigate();

  // State for data management
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<ProfessorTableRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [isCreateTeacherModalOpen, setIsCreateTeacherModalOpen] =
    useState(false);

  // Load teachers data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const professors = await professorService.getAllProfessors();

        // Mapper les Professor vers ProfessorTableRow (adapter la structure)
        const mappedTeachers: ProfessorTableRow[] = professors.map((prof: any) => ({
          _id: prof._id,
          firstName: prof.firstName,
          lastName: prof.lastName,
          email: prof.email,
          phone: prof.phone,
          postalCode: prof.postalCode,
          createdAt: prof.createdAt,
          status: prof.status,
        }));

        setTeachers(mappedTeachers);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        toast.error("Erreur lors du chargement des professeurs");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Extraire les valeurs uniques pour les filtres
  const departments = Array.from(
    new Set(teachers.map((t) => t.postalCode?.substring(0, 2) || "").filter(Boolean))
  ).sort();
  const cities: string[] = [];
  const subjects: string[] = [];
  const levels: string[] = [];

  const handleAddTeacher = () => {
    setIsCreateTeacherModalOpen(true);
  };

  const handleCreateTeacherSuccess = async () => {
    console.log("[PROFESSEURS PAGE] 🎉 Callback onSuccess appelé après création de professeur");

    // Fermer la modal
    setIsCreateTeacherModalOpen(false);
    console.log("[PROFESSEURS PAGE] 🚪 Modal fermée");

    // Recharger les données depuis la DB
    try {
      console.log("[PROFESSEURS PAGE] 🔄 Rechargement des données depuis la DB...");
      const professors = await professorService.getAllProfessors();

      // Mapper les Professor vers ProfessorTableRow (adapter la structure)
      const mappedTeachers: ProfessorTableRow[] = professors.map((prof: any) => ({
        _id: prof._id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        email: prof.email,
        phone: prof.phone,
        postalCode: prof.postalCode,
        createdAt: prof.createdAt,
        status: prof.status,
      }));

      setTeachers(mappedTeachers);
      console.log("[PROFESSEURS PAGE] ✅ Données rechargées avec succès:", mappedTeachers.length, "professeurs");
      toast.success("Professeur créé avec succès");
    } catch (error) {
      console.error("[PROFESSEURS PAGE] ❌ Erreur au rechargement des données:", error);
      toast.error("Erreur lors du rechargement des professeurs");
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
    setSortBy("createdAt");
    setSortOrder("desc");
    setFilterDepartment("");
    setFilterCity("");
    setFilterSubject("");
    setFilterLevel("");
  };

  // Handler pour cliquer sur une ligne du tableau
  const handleRowClick = (row: ProfessorTableRow) => {
    navigate(`/admin/professeur-details/${row._id}`);
  };

  // Gérer la suppression d'un professeur
  const handleDeleteTeacher = async (professorId: string) => {
    const teacher = teachers.find((t) => t._id === professorId);
    const fullName = teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "ce professeur";

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${fullName} ?\n\nCette action ne peut pas être annulée.`
      )
    ) {
      try {
        await professorService.deleteProfessor(professorId);

        // Update local state by removing the deleted teacher
        setTeachers((prevData) =>
          prevData.filter((t) => t._id !== professorId)
        );

        toast.success(`${fullName} supprimé avec succès`);
        console.log(`Professeur ${fullName} supprimé avec succès`);
      } catch (error) {
        console.error("Erreur lors de la suppression du professeur:", error);
        toast.error("Erreur lors de la suppression du professeur");
      }
    }
  };

  // Gérer le renvoi du mot de passe au professeur
  const handleResendPassword = async (professorId: string, email: string) => {
    const teacher = teachers.find((t) => t._id === professorId);
    const fullName = teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "ce professeur";

    if (
      window.confirm(
        `Renvoyer le mot de passe à ${fullName} ?\n\nUn email sera envoyé à : ${email}`
      )
    ) {
      try {
        // TODO: Appeler le service de renvoi de mot de passe
        // await teacherService.resendPassword(professorId);

        toast.success(`Mot de passe renvoyé à ${fullName}`, {
          description: `Un email a été envoyé à ${email}`,
        });

        console.log(`Mot de passe renvoyé à ${email}`);
      } catch (error) {
        console.error("Erreur lors du renvoi du mot de passe:", error);
        toast.error("Erreur lors du renvoi du mot de passe", {
          description: "Veuillez réessayer ultérieurement",
        });
      }
    }
  };

  // Gérer l'activation/désactivation d'un professeur
  const handleToggleActiveStatus = async (professorId: string) => {
    const teacher = teachers.find((t) => t._id === professorId);
    if (!teacher) return;

    const fullName = `${teacher.firstName} ${teacher.lastName}`;
    const newStatus = teacher.status === "inactive" ? "active" : "inactive";
    const action = newStatus === "active" ? "activer" : "désactiver";

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${action} ${fullName} ?\n\n${
          newStatus === "active"
            ? "Le professeur recevra à nouveau les mails de proposition de cours."
            : "Le professeur ne recevra plus les mails de propositions de cours."
        }`
      )
    ) {
      try {
        await professorService.updateStatus(professorId, newStatus);

        // Update local state
        setTeachers((prevData) =>
          prevData.map((t) =>
            t._id === professorId ? { ...t, status: newStatus } : t
          )
        );

        toast.success(`Professeur ${newStatus === "active" ? "activé" : "désactivé"}`, {
          description: `${fullName} a été ${
            newStatus === "active" ? "activé" : "désactivé"
          } avec succès`,
        });

        console.log(`Professeur ${fullName} ${action} avec succès`);
      } catch (error) {
        console.error(
          "Erreur lors du changement de statut du professeur:",
          error
        );
        toast.error("Erreur lors du changement de statut", {
          description: "Veuillez réessayer ultérieurement",
        });
      }
    }
  };

  // Filtrer et trier les données
  const filteredAndSortedData = teachers
    .filter((teacher) => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
      const phone = teacher.phone || "";
      const email = teacher.email.toLowerCase();
      const postalCode = teacher.postalCode || "";

      const matchesSearch =
        fullName.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        postalCode.includes(searchLower);

      const matchesDepartment =
        !filterDepartment || postalCode.substring(0, 2) === filterDepartment;

      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "createdAt":
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "lastName":
          comparison = a.lastName.localeCompare(b.lastName);
          break;
        case "department":
          const deptA = a.postalCode?.substring(0, 2) || "";
          const deptB = b.postalCode?.substring(0, 2) || "";
          comparison = deptA.localeCompare(deptB);
          break;
        default:
          comparison = 0;
      }

      // Appliquer l'ordre (asc/desc)
      return sortOrder === "asc" ? -comparison : comparison;
    });

  // Transformer les données pour le tableau
  const tableData: ProfessorTableRow[] = filteredAndSortedData.map((teacher) => ({
    ...teacher,
  }));

  // Configuration des colonnes du tableau
  const teachersColumns = [
    {
      key: "lastName",
      label: "Nom",
      render: (_: unknown, row: ProfessorTableRow) => (
        <div className={row.status === "inactive" ? "font-medium text-base uppercase text-gray-400" : "font-medium text-base uppercase"}>
          {row.lastName}
        </div>
      ),
    },
    {
      key: "firstName",
      label: "Prénom",
      render: (_: unknown, row: ProfessorTableRow) => (
        <div className={row.status === "inactive" ? "font-medium text-base capitalize text-gray-400" : "font-medium text-base capitalize"}>
          {row.firstName}
        </div>
      ),
    },
    {
      key: "postalCode",
      label: "Code Postal",
      render: (_: unknown, row: ProfessorTableRow) => (
        <div className={row.status === "inactive" ? "text-sm text-gray-400" : "text-sm"}>
          {row.postalCode}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: ProfessorTableRow) => (
        <div className={row.status === "inactive" ? "text-sm text-gray-400" : "text-sm"}>
          {row.phone}
        </div>
      ),
    },
    {
      key: "email",
      label: "Mail",
      render: (_: unknown, row: ProfessorTableRow) => (
        <div className={row.status === "inactive" ? "text-sm text-gray-400" : "text-sm"}>
          {row.email}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: ProfessorTableRow) => (
        <div className="flex gap-sm items-center">
          {/* Bouton renvoyer mot de passe */}
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleResendPassword(row._id, row.email);
            }}
            title="Renvoyer le mot de passe"
          >
            <KeyRound className="w-4 h-4" />
          </Button>

          {/* Bouton statut actif/inactif */}
          <Button
            size="sm"
            variant={row.status === "inactive" ? "primary" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActiveStatus(row._id);
            }}
            title={
              row.status === "active"
                ? "Professeur actif - Cliquer pour désactiver"
                : "Professeur désactivé - Cliquer pour activer"
            }
          >
            {row.status === "active" ? (
              <UserRound className="w-4 h-4" />
            ) : (
              <UserRoundX className="w-4 h-4" />
            )}
          </Button>

          {/* Bouton supprimer */}
          <Button
            size="sm"
            variant="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTeacher(row._id);
            }}
            title="Supprimer le professeur"
          >
            ✕
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Gestion des Professeurs" />
      <Container layout="flex-col">
        {/* Bouton Ajouter un Prof */}
        <Container layout="flex">
          <ButtonGroup
            variant="single"
            buttons={[
              {
                text: "Ajouter un professeur",
                variant: "primary",
                onClick: handleAddTeacher,
              },
            ]}
          />
        </Container>

        {/* Barre de recherche */}
        <Container layout="flex">
          <Input
            placeholder="Rechercher par nom, téléphone, email, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            button={
              <Button variant="primary" onClick={handleSearch}>
                Appliquer
              </Button>
            }
          />
        </Container>

        {/* Filtres et tri */}
        <Container layout="flex">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Trier par:</label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "createdAt", label: "Date de création" },
                  { value: "lastName", label: "Nom" },
                  { value: "city", label: "Ville" },
                  { value: "department", label: "Département" },
                  { value: "lastCouponDate", label: "Date dernier coupon" },
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                title={`Ordre ${
                  sortOrder === "asc" ? "croissant" : "décroissant"
                }`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Département:</label>
              <Select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                options={[
                  { value: "", label: "Tous" },
                  ...departments.map((dept) => ({ value: dept, label: dept })),
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Ville:</label>
              <Select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                options={[
                  { value: "", label: "Toutes" },
                  ...cities.map((city) => ({ value: city, label: city })),
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Matière:</label>
              <Select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                options={[
                  { value: "", label: "Toutes" },
                  ...subjects.map((subject) => ({
                    value: subject,
                    label: subject,
                  })),
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Niveau:</label>
              <Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                options={[
                  { value: "", label: "Tous" },
                  ...levels.map((level) => ({ value: level, label: level })),
                ]}
              />
            </div>
          </div>

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
          <h3>Liste des professeurs</h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement des professeurs...</div>
            </div>
          ) : filteredAndSortedData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm ||
                filterDepartment ||
                filterCity ||
                filterSubject ||
                filterLevel
                  ? "Aucun professeur trouvé pour ces critères"
                  : "Aucun professeur disponible"}
              </div>
            </div>
          ) : (
            <Table
              columns={teachersColumns}
              data={tableData}
              onRowClick={handleRowClick}
            />
          )}
        </Container>

        <Container layout="grid" padding="none">
          <SummaryCard
            title="PROFESSEURS"
            metrics={[
              {
                value: teachers.length,
                label: "Total professeurs",
                variant: "primary",
              },
              {
                value: teachers.length,
                label: "Professeurs actifs",
                variant: "success",
              },
            ]}
          />
        </Container>
      </Container>

      {/* Modal de création d'un professeur */}
      <Modal
        type="teacher"
        isOpen={isCreateTeacherModalOpen}
        onClose={() => setIsCreateTeacherModalOpen(false)}
        data={{}}
        onSuccess={handleCreateTeacherSuccess}
        mode="edit"
      />
    </div>
  );
};
