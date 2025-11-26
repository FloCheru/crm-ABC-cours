import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PageHeader,
  Container,
  SummaryCard,
  Input,
  Button,
  Table,
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

  // Charger les matières au montage
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const data = await subjectService.getSubjects();
      setSubjects(data);
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

  // Filtrage
  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistiques
  const totalSubjects = subjects.length;
  const categoriesCount = new Set(subjects.map((s) => s.category)).size;
  const subjectsByCategory = subjects.reduce(
    (acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
      key: "description",
      label: "Description",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-text-secondary">{row.description || "-"}</div>
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
  const tableData: TableRowData[] = filteredSubjects.map((s) => ({
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

        {/* Cartes de statistiques */}
        <Container layout="grid" padding="none">
          <SummaryCard
            title="MATIÈRES"
            metrics={[
              {
                value: totalSubjects,
                label: "Total",
                variant: "primary",
              },
              {
                value: categoriesCount,
                label: "Catégories",
                variant: "success",
              },
            ]}
          />
          <SummaryCard
            title="RÉPARTITION"
            metrics={Object.entries(subjectsByCategory)
              .slice(0, 2)
              .map(([cat, count]) => ({
                value: count,
                label: cat,
                variant: "primary" as const,
              }))}
          />
        </Container>

        {/* Boutons d'action */}
        <Container layout="flex">
          <Button variant="primary" onClick={handleCreate}>
            Ajouter une matière
          </Button>
        </Container>

        {/* Barre de recherche */}
        <Container layout="flex">
          <Input
            placeholder="Rechercher par nom, description, catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline" onClick={() => setSearchTerm("")}>
            Réinitialiser
          </Button>
        </Container>

        {/* Tableau */}
        <Container layout="flex-col">
          <h3>Liste des matières</h3>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredSubjects.length === 0 ? (
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
