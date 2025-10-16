import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  PageHeader,
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
  SettlementDeletionPreviewModal,
} from "../../../components";
import { ndrService, type NDR } from "../../../services/ndrService";

// Type pour les données du tableau avec l'id requis
type TableRowData = NDR & {
  id: string;
  extractedDepartment?: string;
};

// Fonctions utilitaires pour extraire les valeurs des NDR
// Fonctions utilitaires pour extraire les valeurs des subjects
const getSubjectValue = (
  note: NDR,
  field: "hourlyRate" | "quantity" | "professorSalary"
): number => {
  // Ces champs sont directement à la racine de l'objet NDR, pas dans subjects
  return (note as any)[field] || 0;
};

const getSubjectName = (note: NDR): string => {
  if (!note.subjects || note.subjects.length === 0) return "N/A";
  const firstSubject = note.subjects[0];
  if (typeof firstSubject.id === "object") {
    return firstSubject.id.name;
  }
  return "Matière";
};

export const Ndrs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Nettoyage des données de session NDR au chargement
  // Nettoyage des données de session NDR au chargement
  useEffect(() => {
    localStorage.removeItem('selectedFamily');
    localStorage.removeItem('from');
    localStorage.removeItem('ndrData');
  }, []);

  // Chargement des NDRs au montage du composant
  useEffect(() => {
    const loadNdrs = async () => {
      try {
        setIsLoading(true);
        setError("");
        console.log("🔄 [NDR-PAGE] Chargement des NDRs...");
        const response = await ndrService.getAllNdrs();
        console.log("✅ [NDR-PAGE] Réponse API reçue:", response);
        console.log("📊 [NDR-PAGE] Nombre de NDRs:", response.ndrs?.length || 0);
        console.log("📋 [NDR-PAGE] Détails des NDRs:", response.ndrs);
        setNdrs(response.ndrs || []);
      } catch (err) {
        console.error("❌ [NDR-PAGE] Erreur lors du chargement des NDRs:", err);
        setError("Erreur lors du chargement des notes de règlement");
      } finally {
        setIsLoading(false);
      }
    };

    loadNdrs();
  }, []);

  // État pour stocker les NDRs
  const [ndrs, setNdrs] = useState<NDR[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [localError, setLocalError] = useState<string>("");

  // États pour la popup de suppression
  const [isDeletionPreviewModalOpen, setIsDeletionPreviewModalOpen] =
    useState(false);
  const [deletionPreviewData, setDeletionPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Les données sont maintenant gérées par le store global

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
    const marge = calculateMarge(
      hourlyRate,
      quantity,
      professorSalary,
      charges
    );
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
    navigate("/admin/family-selection");
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setNoteToDelete(noteId);
      setIsLoadingPreview(true);
      setIsDeletionPreviewModalOpen(true);

      // Récupérer l'aperçu de suppression
      const previewData = await ndrService.getDeletionPreview(noteId);
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
    if (!noteToDelete || !deletionPreviewData) return;

    try {
      const noteDetails = ndrs.find((note) => note._id === noteToDelete);
      const noteNumber = noteToDelete
        .substring(noteToDelete.length - 8)
        .toUpperCase();
      const clientName = (noteDetails as any)?.clientName || "Inconnue";

      // Extraire familyId de la preview data
      const familyId =
        deletionPreviewData.settlementNote?.familyId?._id ||
        deletionPreviewData.settlementNote?.familyId ||
        "";

      console.log(
        `🔍 [DASHBOARD] Extracted familyId from preview data:`,
        familyId
      );

      await ndrService.deleteNdr(noteToDelete, familyId);

      // TODO: Recharger les données après suppression
      // clearCache();
      // await loadSettlements();

      console.log(
        `✅ Note de règlement ${clientName} (${noteNumber}) supprimée avec succès`
      );

      // Fermer le modal et réinitialiser
      setIsDeletionPreviewModalOpen(false);
      setNoteToDelete(null);
      setDeletionPreviewData(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setLocalError(
        error instanceof Error
          ? `Erreur lors de la suppression: ${error.message}`
          : "Erreur lors de la suppression de la note"
      );
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
  const filteredData = ndrs.filter((note) => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = (note as any).clientName?.toLowerCase() || "";
    const department = (note as any).department?.toLowerCase() || "";
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

  console.log("🔍 [NDR-PAGE] NDRs totales:", ndrs.length);
  console.log("🔍 [NDR-PAGE] NDRs filtrées:", filteredData.length);

  // Transformer les données pour le tableau
  const tableData: TableRowData[] = filteredData.map((note) => ({
    ...note,
    id: note._id,
  }));

  // Logs de diagnostic pour les données finales du tableau
  console.log(`🔍 [NDR-DASHBOARD] TableData final - ${tableData.length} items pour affichage`);

  // Calculer les statistiques globales
  const totalNotes = ndrs.length;
  const totalCA = ndrs.reduce(
    (sum, note) =>
      sum +
      calculateCA(
        getSubjectValue(note, "hourlyRate"),
        getSubjectValue(note, "quantity")
      ),
    0
  );
  const totalMarge = ndrs.reduce((sum, note) => {
    return (
      sum +
      calculateMarge(
        getSubjectValue(note, "hourlyRate"),
        getSubjectValue(note, "quantity"),
        getSubjectValue(note, "professorSalary"),
        note.charges
      )
    );
  }, 0);
  const totalSalaire = ndrs.reduce(
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
        <div className="font-medium text-sm">{(row as any).clientName}</div>
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
          const subjectNames = row.subjects.map((subject: any) => {
            if (
              typeof subject.id === "object" &&
              subject.id.name
            ) {
              return subject.id.name;
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
        let displayDepartment = row.extractedDepartment || (row as any).department;

        // Si aucun département n'est disponible, essayer d'extraire à partir des données de famille
        if (
          !displayDepartment &&
          typeof row.familyId === "object" &&
          (row.familyId as any)?.address?.postalCode
        ) {
          displayDepartment = extractDepartmentFromPostalCode(
            (row.familyId as any).address.postalCode
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
        let department = row.extractedDepartment || (row as any).department;

        // Si aucun département n'est disponible, essayer d'extraire à partir des données de famille
        if (
          !department &&
          typeof row.familyId === "object" &&
          (row.familyId as any)?.address?.postalCode
        ) {
          department = extractDepartmentFromPostalCode(
            (row.familyId as any).address.postalCode
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
        let department = row.extractedDepartment || (row as any).department;

        // Si aucun département n'est disponible, essayer d'extraire à partir des données de famille
        if (
          !department &&
          typeof row.familyId === "object" &&
          (row.familyId as any)?.address?.postalCode
        ) {
          department = extractDepartmentFromPostalCode(
            (row.familyId as any).address.postalCode
          );
        }

        const marge = calculateMarge(
          getSubjectValue(row, "hourlyRate"),
          getSubjectValue(row, "quantity"),
          getSubjectValue(row, "professorSalary"),
          row.charges
        );

        const tva = calculateTVA(marge, department || "");

        return <div>{tva.toFixed(2)} €</div>;
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
        <div>{row.charges.toFixed(2)} €</div>
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
        return <div>{margePercentage.toFixed(1)}%</div>;
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
      <PageHeader title="Tableau de bord" />
      <Container layout="flex-col">
        {(error || localError) && (
          <div className="border px-4 py-3 rounded mb-4 bg-red-100 border-red-400 text-red-700">
            <div className="flex items-center">{error || localError}</div>
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
            <Table
              columns={settlementColumns}
              data={tableData}
              onRowClick={(row) => {
                localStorage.setItem("ndrId", row._id);
                navigate("/admin/ndr-details");
              }}
            />
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
