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

// Type pour un professeur
interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    postalCode: string;
    city: string;
    department: string;
  };
  subjects: string[];
  levels: string[];
  createdAt: string;
  lastCouponDate?: string; // Date de saisie du dernier coupon (ISO)
  isActive?: boolean; // Statut actif/inactif du professeur
}

// Type pour les données du tableau avec l'id requis
type TableRowData = Teacher & { id: string };

// Données mockées pour les tests
const MOCK_TEACHERS: Teacher[] = [
  {
    _id: "1",
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@email.com",
    phone: "0123456789",
    address: {
      postalCode: "75001",
      city: "Paris",
      department: "75",
    },
    subjects: ["Mathématiques", "Physique"],
    levels: ["Lycée", "Terminale"],
    createdAt: new Date("2024-01-15").toISOString(),
    lastCouponDate: new Date("2024-03-20").toISOString(),
    isActive: true,
  },
  {
    _id: "2",
    firstName: "Pierre",
    lastName: "Martin",
    email: "pierre.martin@email.com",
    phone: "0234567890",
    address: {
      postalCode: "69001",
      city: "Lyon",
      department: "69",
    },
    subjects: ["Français", "Littérature"],
    levels: ["Collège", "Lycée"],
    createdAt: new Date("2024-02-20").toISOString(),
    lastCouponDate: undefined, // Professeur sans coupon
    isActive: false,
  },
  {
    _id: "3",
    firstName: "Sophie",
    lastName: "Bernard",
    email: "sophie.bernard@email.com",
    phone: "0345678901",
    address: {
      postalCode: "33000",
      city: "Bordeaux",
      department: "33",
    },
    subjects: ["Anglais", "Espagnol"],
    levels: ["Collège", "Lycée", "Supérieur"],
    createdAt: new Date("2024-03-10").toISOString(),
    lastCouponDate: new Date("2024-03-25").toISOString(),
    isActive: true,
  },
  {
    _id: "4",
    firstName: "Thomas",
    lastName: "Petit",
    email: "thomas.petit@email.com",
    phone: "0456789012",
    address: {
      postalCode: "75015",
      city: "Paris",
      department: "75",
    },
    subjects: ["Histoire", "Géographie"],
    levels: ["Collège"],
    createdAt: new Date("2024-01-25").toISOString(),
    lastCouponDate: new Date("2024-03-15").toISOString(),
    isActive: false,
  },
  {
    _id: "5",
    firstName: "Julie",
    lastName: "D'Arèle",
    email: "julie.dubois@email.com",
    phone: "0567890123",
    address: {
      postalCode: "13001",
      city: "Marseille",
      department: "13",
    },
    subjects: ["Biologie", "Chimie"],
    levels: ["Lycée", "Terminale"],
    createdAt: new Date("2024-02-05").toISOString(),
    lastCouponDate: new Date("2024-03-28").toISOString(),
    isActive: true,
  },
];

export const Professeurs: React.FC = () => {
  const navigate = useNavigate();

  // State for data management
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
        // TODO: Remplacer par un appel API quand le backend sera prêt
        // const data = await teacherService.getTeachers();
        setTeachers(MOCK_TEACHERS);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Extraire les valeurs uniques pour les filtres
  const departments = Array.from(
    new Set(teachers.map((t) => t.address.department))
  ).sort();
  const cities = Array.from(
    new Set(teachers.map((t) => t.address.city))
  ).sort();
  const subjects = Array.from(
    new Set(teachers.flatMap((t) => t.subjects))
  ).sort();
  const levels = Array.from(new Set(teachers.flatMap((t) => t.levels))).sort();

  const handleAddTeacher = () => {
    setIsCreateTeacherModalOpen(true);
  };

  const handleCreateTeacherSuccess = () => {
    // Fermer la modal
    setIsCreateTeacherModalOpen(false);

    // Recharger les données
    // TODO: Remplacer par un vrai appel API
    // const updatedTeachers = await teacherService.getTeachers();
    // setTeachers(updatedTeachers);

    console.log("✅ Professeur créé avec succès");
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
  const handleRowClick = (row: TableRowData) => {
    localStorage.setItem("professorId", row._id);
    navigate("/admin/professeur-details");
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
        // TODO: Appeler le service de suppression
        // await teacherService.deleteTeacher(professorId);

        // Update local state by removing the deleted teacher
        setTeachers((prevData) => prevData.filter((t) => t._id !== professorId));

        console.log(`Professeur ${fullName} supprimé avec succès`);
      } catch (error) {
        console.error("Erreur lors de la suppression du professeur:", error);
        alert("Erreur lors de la suppression du professeur");
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
    const newStatus = !teacher.isActive;
    const action = newStatus ? "activer" : "désactiver";

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${action} ${fullName} ?\n\n${
          newStatus
            ? "Le professeur recevra à nouveau les mails de proposition de cours."
            : "Le professeur ne recevra plus les mails de propositions de cours."
        }`
      )
    ) {
      try {
        // TODO: Appeler le service pour changer le statut
        // await teacherService.updateActiveStatus(professorId, newStatus);

        // Update local state
        setTeachers((prevData) =>
          prevData.map((t) =>
            t._id === professorId ? { ...t, isActive: newStatus } : t
          )
        );

        toast.success(`Professeur ${newStatus ? "activé" : "désactivé"}`, {
          description: `${fullName} a été ${
            newStatus ? "activé" : "désactivé"
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
      const city = teacher.address.city.toLowerCase();

      const matchesSearch =
        fullName.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        city.includes(searchLower);

      const matchesDepartment =
        !filterDepartment || teacher.address.department === filterDepartment;
      const matchesCity = !filterCity || teacher.address.city === filterCity;
      const matchesSubject =
        !filterSubject || teacher.subjects.includes(filterSubject);
      const matchesLevel = !filterLevel || teacher.levels.includes(filterLevel);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesCity &&
        matchesSubject &&
        matchesLevel
      );
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
        case "city":
          comparison = a.address.city.localeCompare(b.address.city);
          break;
        case "department":
          comparison = a.address.department.localeCompare(b.address.department);
          break;
        case "lastCouponDate":
          // Professeurs sans coupon vont à la fin
          if (!a.lastCouponDate && !b.lastCouponDate) return 0;
          if (!a.lastCouponDate) return 1; // a va à la fin
          if (!b.lastCouponDate) return -1; // b va à la fin

          comparison =
            new Date(b.lastCouponDate).getTime() -
            new Date(a.lastCouponDate).getTime();
          break;
        default:
          comparison = 0;
      }

      // Appliquer l'ordre (asc/desc)
      return sortOrder === "asc" ? -comparison : comparison;
    });

  // Transformer les données pour le tableau
  const tableData: TableRowData[] = filteredAndSortedData.map((teacher) => ({
    ...teacher,
    id: teacher._id,
  }));

  // Configuration des colonnes du tableau
  const teachersColumns = [
    {
      key: "lastName",
      label: "Nom",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">{row.lastName}</div>
      ),
    },
    {
      key: "firstName",
      label: "Prénom",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">{row.firstName}</div>
      ),
    },
    {
      key: "postalCode",
      label: "Code Postal",
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
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.phone}</div>
      ),
    },
    {
      key: "email",
      label: "Mail",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.email}</div>
      ),
    },
    {
      key: "subjects",
      label: "Matières",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.subjects.join(", ")}</div>
      ),
    },
    {
      key: "levels",
      label: "Niveaux",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.levels.join(", ")}</div>
      ),
    },
    {
      key: "lastCouponDate",
      label: "Dernier coupon",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.lastCouponDate
            ? new Date(row.lastCouponDate).toLocaleDateString("fr-FR")
            : "—"}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
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
            variant={row.isActive ? "primary" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActiveStatus(row._id);
            }}
            title={
              row.isActive
                ? "Professeur actif - Cliquer pour désactiver"
                : "Professeur désactivé - Cliquer pour activer"
            }
          >
            {row.isActive ? (
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

        {/* Bouton Ajouter un Prof */}
        <Container layout="flex">
          <ButtonGroup
            variant="single"
            buttons={[
              {
                text: "Ajouter un Prof",
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
