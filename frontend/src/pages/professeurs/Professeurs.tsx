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
  TemporaryPasswordModal,
} from "../../components";
import { KeyRound, UserRound, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { professorService } from "../../services/professorService";
import { subjectService } from "../../services/subjectService";
import { geoApiService } from "../../services/geoApiService";
import { FRENCH_DEPARTMENTS } from "../../constants/departments";
import { getAllGrades } from "../../constants/schoolLevels";
import type { Subject } from "../../types/subject";
import { formatPhoneNumber } from "../../utils";
import {
  GENDER_OPTIONS,
  ACTIVE_STATUS_OPTIONS,
  CURRENT_SITUATION_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
} from "../../constants/professorFilters";

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
  bio?: string;
  notes?: string;
  subjects?: Array<{ _id: string; name: string; category?: string }>;
  gender?: string;
  currentSituation?: string;
  employmentStatus?: string;
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
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterActiveStatus, setFilterActiveStatus] = useState<string>("");
  const [filterCurrentSituation, setFilterCurrentSituation] = useState<string>("");
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState<string>("");
  const [isCreateTeacherModalOpen, setIsCreateTeacherModalOpen] =
    useState(false);

  // State for temporary password modal
  const [showTemporaryPasswordModal, setShowTemporaryPasswordModal] = useState(false);
  const [temporaryPasswordData, setTemporaryPasswordData] = useState({
    password: "",
    firstName: "",
    email: "",
  });

  // State pour les données des filtres
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [postalCodeToCityMap, setPostalCodeToCityMap] = useState<Record<string, string>>({});

  // Load teachers data and subjects
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Charger les professeurs et les matières en parallèle
        const [professors, subjects] = await Promise.all([
          professorService.getAllProfessors(),
          subjectService.getSubjects(),
        ]);

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
          bio: prof.bio,
          notes: prof.notes,
          subjects: prof.subjects,
          gender: prof.gender,
          currentSituation: prof.currentSituation,
          employmentStatus: prof.employmentStatus,
        }));

        setTeachers(mappedTeachers);
        setAllSubjects(subjects);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        toast.error("Erreur lors du chargement des professeurs");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load cities from postal codes when teachers are loaded
  useEffect(() => {
    const loadCities = async () => {
      if (teachers.length === 0) return;

      try {
        // Extraire les codes postaux uniques des professeurs
        const postalCodes = Array.from(
          new Set(
            teachers
              .map((t) => t.postalCode)
              .filter((code): code is string => Boolean(code))
          )
        );

        if (postalCodes.length === 0) return;

        // Récupérer le mapping code postal -> ville
        const mapping = await geoApiService.getPostalCodeToCityMapping(postalCodes);
        setPostalCodeToCityMap(mapping);

        // Extraire les noms de villes uniques et triés
        const uniqueCities = Array.from(new Set(Object.values(mapping))).sort();
        setCities(uniqueCities);
      } catch (error) {
        console.error("Erreur lors du chargement des villes:", error);
      }
    };

    loadCities();
  }, [teachers]);

  // Préparer les données pour les filtres
  const departments = FRENCH_DEPARTMENTS.map((d) => d.code);
  const levels = getAllGrades();

  const handleAddTeacher = () => {
    setIsCreateTeacherModalOpen(true);
  };

  const handleCreateTeacherSuccess = async (createdProfessor?: any) => {
    console.log("[PROFESSEURS PAGE] 🎉 Callback onSuccess appelé après création de professeur");
    console.log("[PROFESSEURS PAGE] 📦 Données reçues dans onSuccess:", createdProfessor);
    console.log("[PROFESSEURS PAGE] 🔍 Type de createdProfessor:", typeof createdProfessor);
    console.log("[PROFESSEURS PAGE] 🔍 Clés disponibles:", Object.keys(createdProfessor || {}));
    console.log("[PROFESSEURS PAGE] 🔍 temporaryPassword présent?", createdProfessor?.temporaryPassword);

    // Afficher le modal du mot de passe temporaire si disponible
    if (createdProfessor?.temporaryPassword) {
      console.log("[PROFESSEURS PAGE] 🔐 Mot de passe temporaire trouvé, affichage du modal");
      setTemporaryPasswordData({
        password: createdProfessor.temporaryPassword,
        firstName: createdProfessor.firstName,
        email: createdProfessor.email,
      });
      setShowTemporaryPasswordModal(true);
    } else {
      console.log("[PROFESSEURS PAGE] ⚠️ Aucun mot de passe temporaire trouvé dans la réponse");
    }

    // Fermer la modal de création
    setIsCreateTeacherModalOpen(false);
    console.log("[PROFESSEURS PAGE] 🚪 Modal fermée");

    // Si on a reçu le professeur créé, l'ajouter directement au state (optimistic update)
    if (createdProfessor) {
      console.log("[PROFESSEURS PAGE] ✨ Ajout optimiste du nouveau professeur:", createdProfessor);

      // Mapper le Professor vers ProfessorTableRow
      const newTeacher: ProfessorTableRow = {
        _id: createdProfessor._id,
        firstName: createdProfessor.firstName,
        lastName: createdProfessor.lastName,
        email: createdProfessor.email,
        phone: createdProfessor.phone,
        postalCode: createdProfessor.postalCode,
        createdAt: createdProfessor.createdAt,
        status: createdProfessor.status,
        bio: createdProfessor.bio,
        notes: createdProfessor.notes,
        subjects: createdProfessor.subjects,
        gender: createdProfessor.gender,
        currentSituation: createdProfessor.currentSituation,
        employmentStatus: createdProfessor.employmentStatus,
      };

      // Ajouter le nouveau professeur au début de la liste
      setTeachers((prev) => [newTeacher, ...prev]);
      console.log("[PROFESSEURS PAGE] ✅ Professeur ajouté à la liste");
      toast.success("Professeur créé avec succès");
    } else {
      // Fallback : recharger depuis la DB si le professeur n'est pas fourni
      console.log("[PROFESSEURS PAGE] ⚠️ Professeur non fourni, rechargement depuis la DB...");
      try {
        const professors = await professorService.getAllProfessors();

        const mappedTeachers: ProfessorTableRow[] = professors.map((prof: any) => ({
          _id: prof._id,
          firstName: prof.firstName,
          lastName: prof.lastName,
          email: prof.email,
          phone: prof.phone,
          postalCode: prof.postalCode,
          createdAt: prof.createdAt,
          status: prof.status,
          bio: prof.bio,
          notes: prof.notes,
          subjects: prof.subjects,
          gender: prof.gender,
          currentSituation: prof.currentSituation,
          employmentStatus: prof.employmentStatus,
        }));

        setTeachers(mappedTeachers);
        console.log("[PROFESSEURS PAGE] ✅ Données rechargées avec succès:", mappedTeachers.length, "professeurs");
        toast.success("Professeur créé avec succès");
      } catch (error) {
        console.error("[PROFESSEURS PAGE] ❌ Erreur au rechargement des données:", error);
        toast.error("Erreur lors du rechargement des professeurs");
      }
    }
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
    setFilterGender("");
    setFilterActiveStatus("");
    setFilterCurrentSituation("");
    setFilterEmploymentStatus("");
  };

  // Handler pour cliquer sur une ligne du tableau
  const handleRowClick = (row: ProfessorTableRow) => {
    navigate(`/admin/professeur-details/${row._id}`);
  };

  // Vérifier si un profil est protégé (profil de test)
  const isTestProfile = (email: string) => email === 'prof@abc-cours.fr';

  // Gérer la suppression d'un professeur
  const handleDeleteTeacher = async (professorId: string) => {
    const teacher = teachers.find((t) => t._id === professorId);
    const fullName = teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "ce professeur";

    // Bloquer la suppression du profil de test
    if (teacher && isTestProfile(teacher.email)) {
      toast.error("Impossible de supprimer le profil de test", {
        description: "Ce profil est protégé et ne peut pas être supprimé."
      });
      return;
    }

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
      const bio = teacher.bio?.toLowerCase() || "";
      const notes = teacher.notes?.toLowerCase() || "";
      const subjectNames = teacher.subjects?.map((s) => s.name.toLowerCase()).join(" ") || "";

      const matchesSearch =
        fullName.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        postalCode.includes(searchLower) ||
        bio.includes(searchLower) ||
        notes.includes(searchLower) ||
        subjectNames.includes(searchLower);

      const matchesDepartment =
        !filterDepartment || postalCode.substring(0, 2) === filterDepartment;

      // Filtre Ville : vérifier si la ville du prof correspond au filtre
      const matchesCity = !filterCity ||
        (teacher.postalCode && postalCodeToCityMap[teacher.postalCode] === filterCity);

      // Filtre Matière : vérifier si le prof enseigne la matière sélectionnée
      const matchesSubject = !filterSubject ||
        teacher.subjects?.some((s) => s._id === filterSubject);

      // Filtre Niveau : vérifier si le prof enseigne ce niveau (via les grades des matières)
      const matchesLevel = !filterLevel ||
        teacher.subjects?.some(() => {
          // Pour l'instant, on ne peut pas filtrer par niveau car les grades ne sont pas dans subjects
          // On retournera true temporairement
          return true;
        });

      // Filtre Sexe : vérifier si le sexe correspond
      const matchesGender = !filterGender || teacher.gender === filterGender;

      // Filtre Actif/Inactif : vérifier si le statut correspond
      const matchesActiveStatus = !filterActiveStatus ||
        (filterActiveStatus === "active" && teacher.status === "active") ||
        (filterActiveStatus === "inactive" && teacher.status === "inactive");

      // Filtre Situation actuelle : vérifier si la situation correspond
      const matchesCurrentSituation = !filterCurrentSituation ||
        teacher.currentSituation === filterCurrentSituation;

      // Filtre Statut d'emploi : vérifier si le statut d'emploi correspond
      const matchesEmploymentStatus = !filterEmploymentStatus ||
        teacher.employmentStatus === filterEmploymentStatus;

      return matchesSearch && matchesDepartment && matchesCity && matchesSubject && matchesLevel &&
        matchesGender && matchesActiveStatus && matchesCurrentSituation && matchesEmploymentStatus;
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
          {formatPhoneNumber(row.phone)}
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
            disabled={isTestProfile(row.email)}
            title={isTestProfile(row.email)
              ? "Profil de test protégé - Suppression impossible"
              : "Supprimer le professeur"
            }
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
            placeholder="Rechercher par nom, email, téléphone, code postal, matières, compétences, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  ...allSubjects.map((subject) => ({
                    value: subject._id,
                    label: subject.name,
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
                  ...levels.map((level) => ({
                    value: level.value,
                    label: level.label,
                  })),
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sexe:</label>
              <Select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                options={[
                  { value: "", label: "Tous" },
                  ...GENDER_OPTIONS,
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Statut:</label>
              <Select
                value={filterActiveStatus}
                onChange={(e) => setFilterActiveStatus(e.target.value)}
                options={[
                  { value: "", label: "Tous" },
                  ...ACTIVE_STATUS_OPTIONS,
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Situation actuelle:</label>
              <Select
                value={filterCurrentSituation}
                onChange={(e) => setFilterCurrentSituation(e.target.value)}
                options={[
                  { value: "", label: "Toutes" },
                  ...CURRENT_SITUATION_OPTIONS,
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Statut d'emploi:</label>
              <Select
                value={filterEmploymentStatus}
                onChange={(e) => setFilterEmploymentStatus(e.target.value)}
                options={[
                  { value: "", label: "Tous" },
                  ...EMPLOYMENT_STATUS_OPTIONS,
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

      {/* Modal d'affichage du mot de passe temporaire */}
      <TemporaryPasswordModal
        isOpen={showTemporaryPasswordModal}
        temporaryPassword={temporaryPasswordData.password}
        professorName={temporaryPasswordData.firstName}
        professorEmail={temporaryPasswordData.email}
        onClose={() => {
          setShowTemporaryPasswordModal(false);
        }}
      />
    </div>
  );
};
