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
  SettlementDeletionPreviewModal,
} from "../../../components";
import { settlementService } from "../../../services/settlementService";
import type { SettlementNote } from "../../../services/settlementService";

// Type pour les données du tableau avec l'id requis
type TableRowData = SettlementNote & {
  id: string;
  extractedDepartment?: string;
};

// Fonctions utilitaires pour extraire les valeurs des subjects
const getSubjectValue = (
  note: SettlementNote,
  field: "hourlyRate" | "quantity" | "professorSalary"
): number => {
  if (!note.subjects || note.subjects.length === 0) return 0;
  // Pour l'instant, on prend la première matière. Plus tard on pourra gérer plusieurs matières
  return note.subjects[0][field] || 0;
};

const getSubjectName = (note: SettlementNote): string => {
  if (!note.subjects || note.subjects.length === 0) return "N/A";
  const firstSubject = note.subjects[0];
  if (typeof firstSubject.subjectId === "object") {
    return firstSubject.subjectId.name;
  }
  return "Matière";
};

export const SettlementDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [settlementData, setSettlementData] = useState<SettlementNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // États pour la popup de suppression
  const [isDeletionPreviewModalOpen, setIsDeletionPreviewModalOpen] =
    useState(false);
  const [deletionPreviewData, setDeletionPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Charger les données des notes de règlement
  useEffect(() => {
    const loadSettlementNotes = async () => {
      try {
        setIsLoading(true);
        setError("");
        setIsRetrying(false);
        const response = await settlementService.getAllSettlementNotes(1, 100); // Récupérer toutes les notes
        setSettlementData(response.notes || []);

        // 🔍 DÉBOGAGE - Vérifier la structure des données reçues
        if (response.notes && response.notes.length > 0) {
          const firstNote = response.notes[0];
          console.log("🔍 Structure de la première note:", {
            id: firstNote._id.substring(firstNote._id.length - 8),
            subjects: firstNote.subjects,
            hasSubjects: !!firstNote.subjects,
            subjectsLength: firstNote.subjects?.length || 0,
            firstSubject: firstNote.subjects?.[0],
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur lors du chargement";

        // Handle rate limiting specifically
        if (errorMessage.includes("Rate limit exceeded")) {
          setError(
            "Trop de requêtes simultanées. Les données se chargent automatiquement..."
          );
          setIsRetrying(true);
        } else {
          setError(errorMessage);
        }

        console.error("Erreur lors du chargement des notes de règlement:", err);
        setSettlementData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettlementNotes();
  }, []);

  // Fonction pour extraire le département depuis le code postal
  const extractDepartmentFromPostalCode = (postalCode: string): string => {
    if (!postalCode || typeof postalCode !== "string") return "";

    // Nettoyer le code postal (enlever les espaces)
    const cleanPostalCode = postalCode.trim();

    // Vérifier la longueur minimale
    if (cleanPostalCode.length < 2) return "";

    // Si le code postal commence par 97 (DOM-TOM), prendre les 3 premiers chiffres
    if (cleanPostalCode.startsWith("97") && cleanPostalCode.length >= 3) {
      return cleanPostalCode.substring(0, 3);
    }

    // Sinon, prendre les 2 premiers chiffres (métropole)
    return cleanPostalCode.substring(0, 2);
  };

  // Fonction pour traduire les méthodes de paiement en français
  const getPaymentMethodLabel = (paymentMethod: string): string => {
    const translations: Record<string, string> = {
      card: "Carte bancaire",
      check: "Chèque",
      transfer: "Virement",
      cash: "Espèces",
      PRLV: "Prélèvement",
    };

    return translations[paymentMethod] || paymentMethod;
  };

  // Fonction pour déterminer A/S selon le département
  const getAsCode = (department: string): string => {
    if (!department) return "S";

    // Nettoyer le département (enlever les espaces, convertir en majuscules)
    const cleanDept = department.trim().toUpperCase();

    // Vérifier si c'est 06, 83 ou commence par 97
    if (
      cleanDept === "06" ||
      cleanDept === "83" ||
      cleanDept.startsWith("97")
    ) {
      return "A"; // Antilles/PACA
    }

    return "S"; // Standard
  };

  // Calculer le CA (Chiffre d'Affaires)
  const calculateCA = (hourlyRate: number, quantity: number): number => {
    return hourlyRate * quantity;
  };

  // Calculer la marge
  const calculateMarge = (
    hourlyRate: number,
    quantity: number,
    professorSalary: number,
    charges: number
  ): number => {
    const ca = calculateCA(hourlyRate, quantity);
    const totalSalary = professorSalary * quantity;
    return ca - totalSalary - charges;
  };

  // Calculer la marge en pourcentage
  const calculateMargePercentage = (
    hourlyRate: number,
    quantity: number,
    professorSalary: number,
    charges: number
  ): number => {
    const ca = calculateCA(hourlyRate, quantity);
    if (ca === 0) return 0;
    const marge = calculateMarge(hourlyRate, quantity, professorSalary, charges);
    return (marge / ca) * 100;
  };

  // Calculer la TVA selon le département
  const calculateTVA = (marge: number, department: string): number => {
    if (!department) return 0;
    
    // Nettoyer le département (enlever les espaces, convertir en majuscules)
    const cleanDept = department.trim().toUpperCase();
    
    // Si département d'outre-mer (commence par 97) : 2.1% de la marge
    if (cleanDept.startsWith("97")) {
      return marge * 0.021;
    }
    
    // Autres départements : 10% de la marge
    return marge * 0.1;
  };

  const handleSearch = () => {
    console.log("Recherche:", searchTerm);
  };

  const handleFilter = () => {
    console.log("Filtres appliqués");
  };

  const handleReset = () => {
    setSearchTerm("");
  };

  const handleCreateNote = () => {
    navigate("/admin/dashboard/create/wizard");
  };

  const handleViewNote = (noteId: string) => {
    navigate(`/admin/dashboard/${noteId}`);
  };

  const handleEditNote = (noteId: string) => {
    navigate(`/admin/dashboard/edit/${noteId}`);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setNoteToDelete(noteId);
      setIsLoadingPreview(true);
      setIsDeletionPreviewModalOpen(true);

      // Récupérer l'aperçu de suppression
      const previewData = await settlementService.getDeletionPreview(noteId);
      setDeletionPreviewData(previewData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'aperçu:", error);
      setDeletionPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Confirmer la suppression après aperçu
  const handleConfirmDeletion = async () => {
    if (!noteToDelete) return;

    try {
      const noteDetails = settlementData.find(
        (note) => note._id === noteToDelete
      );
      const noteNumber = noteToDelete
        .substring(noteToDelete.length - 8)
        .toUpperCase();
      const clientName = noteDetails?.clientName || "Inconnue";

      setIsLoading(true);
      await settlementService.deleteSettlementNote(noteToDelete);

      // Recharger les données après suppression
      const response = await settlementService.getAllSettlementNotes(1, 100);
      setSettlementData(response.notes || []);

      console.log(
        `✅ Note de règlement ${clientName} (${noteNumber}) supprimée avec succès`
      );

      // Fermer le modal et réinitialiser
      setIsDeletionPreviewModalOpen(false);
      setNoteToDelete(null);
      setDeletionPreviewData(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError(
        error instanceof Error
          ? `Erreur lors de la suppression: ${error.message}`
          : "Erreur lors de la suppression de la note"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Annuler la suppression
  const handleCancelDeletion = () => {
    setIsDeletionPreviewModalOpen(false);
    setNoteToDelete(null);
    setDeletionPreviewData(null);
    setIsLoadingPreview(false);
  };

  // Filtrer les données selon le terme de recherche
  const filteredData = settlementData.filter((note) => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = note.clientName?.toLowerCase() || "";
    const department = note.department?.toLowerCase() || "";
    const paymentMethod = note.paymentMethod?.toLowerCase() || "";
    const subject = getSubjectName(note).toLowerCase();

    return (
      note._id.toLowerCase().includes(searchLower) ||
      clientName.includes(searchLower) ||
      department.includes(searchLower) ||
      paymentMethod.includes(searchLower) ||
      subject.includes(searchLower)
    );
  });

  // Transformer les données pour le tableau
  const tableData: TableRowData[] = filteredData.map((note) => ({
    ...note,
    id: note._id,
  }));

  // Calculer les statistiques globales
  const totalNotes = settlementData.length;
  const totalCA = settlementData.reduce(
    (sum, note) =>
      sum +
      calculateCA(
        getSubjectValue(note, "hourlyRate"),
        getSubjectValue(note, "quantity")
      ),
    0
  );
  const totalMarge = settlementData.reduce(
    (sum, note) => {
      return sum +
        calculateMarge(
          getSubjectValue(note, "hourlyRate"),
          getSubjectValue(note, "quantity"),
          getSubjectValue(note, "professorSalary"),
          note.charges
        );
    },
    0
  );
  const totalSalaire = settlementData.reduce(
    (sum, note) =>
      sum +
      getSubjectValue(note, "professorSalary") *
        getSubjectValue(note, "quantity"),
    0
  );

  // Configuration des colonnes du tableau
  const settlementColumns = [
    {
      key: "ndr",
      label: "N°",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">
          {row._id.substring(row._id.length - 8).toUpperCase()}
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "client",
      label: "Client",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">{row.clientName}</div>
      ),
    },
    {
      key: "subjects",
      label: "Matières",
      render: (_: unknown, row: TableRowData) => {
        // Vérifier si subjects existe et est un array avec au moins un élément
        if (
          row.subjects &&
          Array.isArray(row.subjects) &&
          row.subjects.length > 0
        ) {
          // Extraire tous les noms de matières
          const subjectNames = row.subjects.map((subject) => {
            if (
              typeof subject.subjectId === "object" &&
              subject.subjectId.name
            ) {
              return subject.subjectId.name;
            }
            return "Matière";
          });

          // Joindre les noms avec des virgules
          return <div>{subjectNames.join(", ")}</div>;
        }

        return <div>Non défini</div>;
      },
    },
    {
      key: "department",
      label: "DPT",
      render: (_: unknown, row: TableRowData) => {
        // Utiliser d'abord le département extrait, puis le département existant, sinon extraire du code postal
        let displayDepartment = row.extractedDepartment || row.department;

        // Si aucun département n'est disponible, essayer d'extraire à partir des données de famille
        if (
          !displayDepartment &&
          typeof row.familyId === "object" &&
          row.familyId?.address?.postalCode
        ) {
          displayDepartment = extractDepartmentFromPostalCode(
            row.familyId.address.postalCode
          );
        }

        return (
          <div className="text-sm font-medium">
            {displayDepartment || "N/A"}
          </div>
        );
      },
    },
    {
      key: "paymentMethod",
      label: "Paiement",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {getPaymentMethodLabel(row.paymentMethod)}
          {(row as any).paymentType === "immediate_advance" && (
            <span className="text-red-600 font-bold ml-1">*</span>
          )}
        </div>
      ),
    },
    {
      key: "quantity",
      label: "QTé",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm text-center">
          {getSubjectValue(row, "quantity")}
        </div>
      ),
    },
    {
      key: "asCode",
      label: "A/S",
      render: (_: unknown, row: TableRowData) => {
        // Utiliser d'abord le département extrait, puis le département existant, sinon extraire du code postal
        let department = row.extractedDepartment || row.department;

        // Si aucun département n'est disponible, essayer d'extraire à partir des données de famille
        if (
          !department &&
          typeof row.familyId === "object" &&
          row.familyId?.address?.postalCode
        ) {
          department = extractDepartmentFromPostalCode(
            row.familyId.address.postalCode
          );
        }

        return <div className="font-bold text-sm">{getAsCode(department)}</div>;
      },
    },
    {
      key: "pu",
      label: "PU",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {getSubjectValue(row, "hourlyRate").toFixed(2)} €
        </div>
      ),
    },
    {
      key: "tva",
      label: "TVA",
      render: (_: unknown, row: TableRowData) => {
        // Utiliser d'abord le département extrait, puis le département existant, sinon extraire du code postal
        let department = row.extractedDepartment || row.department;
        
        // Si aucun département n'est disponible, essayer d'extraire à partir des données de famille
        if (
          !department &&
          typeof row.familyId === "object" &&
          row.familyId?.address?.postalCode
        ) {
          department = extractDepartmentFromPostalCode(
            row.familyId.address.postalCode
          );
        }

        const marge = calculateMarge(
          getSubjectValue(row, "hourlyRate"),
          getSubjectValue(row, "quantity"),
          getSubjectValue(row, "professorSalary"),
          row.charges
        );
        
        const tva = calculateTVA(marge, department || "");
        
        return (
          <div>
            {tva.toFixed(2)} €
          </div>
        );
      },
    },
    {
      key: "total",
      label: "Total",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">
          {calculateCA(
            getSubjectValue(row, "hourlyRate"),
            getSubjectValue(row, "quantity")
          ).toFixed(2)}{" "}
          €
        </div>
      ),
    },
    {
      key: "salary",
      label: "Salaire",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {(
            getSubjectValue(row, "professorSalary") *
            getSubjectValue(row, "quantity")
          ).toFixed(2)}{" "}
          €
        </div>
      ),
    },
    {
      key: "charges",
      label: "Charges",
      render: (_: unknown, row: TableRowData) => (
        <div>
          {row.charges.toFixed(2)} €
        </div>
      ),
    },
    {
      key: "encaissement",
      label: "Frais encaissement",
      render: () => <div className="text-sm text-gray-500 italic">-</div>,
    },
    {
      key: "ca",
      label: "CA",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm text-blue-600">
          {calculateCA(
            getSubjectValue(row, "hourlyRate"),
            getSubjectValue(row, "quantity")
          ).toFixed(2)}{" "}
          €
        </div>
      ),
    },
    {
      key: "marge",
      label: "Marge",
      render: (_: unknown, row: TableRowData) => {
        const charges = row.charges;
        const margePercentage = calculateMargePercentage(
          getSubjectValue(row, "hourlyRate"),
          getSubjectValue(row, "quantity"),
          getSubjectValue(row, "professorSalary"),
          charges
        );
        return (
          <div>
            {margePercentage.toFixed(1)}%
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <div className="table__actions">
          <Button
            size="sm"
            variant="error"
            onClick={() => handleDeleteNote(row._id)}
          >
            ✕
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Tableau de bord", href: "" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Tableau de bord</h1>

        {error && (
          <div
            className={`border px-4 py-3 rounded mb-4 ${
              isRetrying
                ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center">
              {isRetrying && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
              )}
              {error}
            </div>
          </div>
        )}

        {/* Statistiques globales */}
        <Container layout="grid" padding="none">
          <SummaryCard
            title="VOLUME"
            metrics={[
              {
                value: totalNotes,
                label: "Total notes",
                variant: "primary",
              },
              {
                value: `${totalCA.toFixed(0)} €`,
                label: "CA total",
                variant: "success",
              },
            ]}
          />
          <SummaryCard
            title="FINANCIER"
            metrics={[
              {
                value: `${totalSalaire.toFixed(0)} €`,
                label: "Total salaires",
                variant: "primary",
              },
              {
                value: `${totalMarge.toFixed(0)} €`,
                label: "Marge totale",
                variant: totalMarge >= 0 ? "success" : "error",
              },
            ]}
          />
        </Container>

        {/* Boutons d'action */}
        <Container layout="flex">
          <ButtonGroup
            variant="single"
            buttons={[
              {
                text: "Créer une note de règlement",
                variant: "primary",
                onClick: handleCreateNote,
              },
            ]}
          />
        </Container>

        {/* Recherche */}
        <Container layout="flex">
          <Input
            placeholder="Rechercher par N° NDR, client, département, mode de paiement..."
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

        {/* Tableau des notes de règlement */}
        <Container layout="flex-col">
          <h3>Notes de règlement ({filteredData.length})</h3>

          {isLoading ? (
            <span>Chargement des notes de règlement...</span>
          ) : filteredData.length === 0 ? (
            <span>
              {searchTerm
                ? "Aucune note trouvée pour cette recherche"
                : "Aucune note de règlement disponible"}
            </span>
          ) : (
            <Table columns={settlementColumns} data={tableData} onRowClick={(row) => handleViewNote(row._id)} />
          )}
        </Container>
      </Container>

      {/* Modal d'aperçu de suppression */}
      <SettlementDeletionPreviewModal
        isOpen={isDeletionPreviewModalOpen}
        onClose={handleCancelDeletion}
        onConfirm={handleConfirmDeletion}
        previewData={deletionPreviewData}
        isLoading={isLoadingPreview}
      />
    </div>
  );
};
