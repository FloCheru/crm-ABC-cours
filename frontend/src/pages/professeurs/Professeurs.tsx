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
  },
];

export const Professeurs: React.FC = () => {
  const navigate = useNavigate();

  // State for data management
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
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
    setFilterDepartment("");
    setFilterCity("");
    setFilterSubject("");
    setFilterLevel("");
  };

  // Handler pour cliquer sur une ligne du tableau
  const handleRowClick = (row: TableRowData) => {
    localStorage.setItem("teacherId", row._id);
    navigate("/admin/professeur-details");
  };

  // Gérer la suppression d'un professeur
  const handleDeleteTeacher = async (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId);
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
        // await teacherService.deleteTeacher(teacherId);

        // Update local state by removing the deleted teacher
        setTeachers((prevData) => prevData.filter((t) => t._id !== teacherId));

        console.log(`Professeur ${fullName} supprimé avec succès`);
      } catch (error) {
        console.error("Erreur lors de la suppression du professeur:", error);
        alert("Erreur lors de la suppression du professeur");
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
      switch (sortBy) {
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "lastName":
          return a.lastName.localeCompare(b.lastName);
        case "city":
          return a.address.city.localeCompare(b.address.city);
        case "department":
          return a.address.department.localeCompare(b.address.department);
        default:
          return 0;
      }
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
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <Button
          size="sm"
          variant="error"
          onClick={() => handleDeleteTeacher(row._id)}
          title="Supprimer le professeur"
        >
          ✕
        </Button>
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
                ]}
              />
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
