import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PageHeader,
  Container,
  Input,
  Button,
  Table,
  Select,
} from "../../../components";
import { subjectService } from "../../../services/subjectService";
import { SubjectModal } from "./SubjectModal";
import type { Subject } from "../../../types/subject";

type TableRowData = Subject & { id: string };

export const Parametres: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [error, setError] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Charger les matières au montage
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const [subjectsData, categoriesData] = await Promise.all([
        subjectService.getSubjects(),
        subjectService.getCategories(),
      ]);
      setSubjects(subjectsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers CRUD
  const handleCreate = () => {
    setEditingSubject(null);
    setShowModal(true);
  };

  const handleEdit = (row: TableRowData) => {
    setEditingSubject(row);
    setShowModal(true);
  };

  const handleDelete = async (subject: Subject) => {
    try {
      // 1. Vérifier usage
      const usage = await subjectService.checkSubjectUsage(subject._id);

      if (usage.isUsed) {
        toast.error("Suppression impossible", {
          description: `Cette matière est utilisée dans ${usage.count} NDR(s)`,
        });
        return;
      }

      // 2. Confirmer suppression
      if (!window.confirm(`Supprimer la matière "${subject.name}" ?`)) {
        return;
      }

      // 3. Supprimer
      await subjectService.deleteSubject(subject._id);
      toast.success("Matière supprimée avec succès");
      loadSubjects();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSaveSuccess = () => {
    setShowModal(false);
    loadSubjects();
  };

  // Filtrage et tri
  const filteredAndSortedSubjects = subjects
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filterCategory || s.category === filterCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Colonnes du tableau
  const columns = [
    {
      key: "name",
      label: "Nom",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.name}</div>
      ),
    },
    {
      key: "category",
      label: "Catégorie",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium">{row.category}</div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <div className="table__actions">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            ✏️
          </Button>
          <Button
            size="sm"
            variant="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
          >
            ✕
          </Button>
        </div>
      ),
    },
  ];

  // Transformer les données pour le tableau
  const tableData: TableRowData[] = filteredAndSortedSubjects.map((s) => ({
    ...s,
    id: s._id,
  }));

  return (
    <div>
      <PageHeader
        title="Paramètres - Gestion des Matières"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Paramètres" },
        ]}
        backButton={{ label: "Retour admin", href: "/admin" }}
      />

      <Container layout="flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Boutons d'action */}
        <Container layout="flex">
          <Button variant="primary" onClick={handleCreate}>
            Ajouter une matière
          </Button>
        </Container>

        {/* Filtres et tri */}
        <Container layout="flex">
          <div className="flex gap-4 flex-wrap items-center">
            {/* Barre de recherche */}
            <Input
              placeholder="Rechercher par nom, catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[300px]"
            />

            {/* Filtre par catégorie */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Catégorie:</label>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[
                  { value: "", label: "Toutes" },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
              />
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Trier par:</label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "name", label: "Nom" },
                  { value: "category", label: "Catégorie" },
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
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setFilterCategory("");
              setSortBy("name");
              setSortOrder("asc");
            }}
          >
            Réinitialiser
          </Button>
        </Container>

        {/* Tableau */}
        <Container layout="flex-col">
          <h3>Liste des matières</h3>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredAndSortedSubjects.length === 0 ? (
            <div className="text-center py-8">Aucune matière trouvée</div>
          ) : (
            <Table
              columns={columns}
              data={tableData}
              onRowClick={handleEdit}
            />
          )}
        </Container>
      </Container>

      {/* Modal Ajout/Édition */}
      {showModal && (
        <SubjectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          subject={editingSubject}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};
