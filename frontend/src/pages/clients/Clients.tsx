import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {

  PageHeader,
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
} from "../../components";
import { ModalWrapper } from "../../components/ui/ModalWrapper/ModalWrapper";
import { CompleteFamilyModal } from "../../components/domain/CompleteFamilyModal";
import { familyService } from "../../services/familyService";
import { ndrService } from "../../services/ndrService";
import type { Family } from "../../types/family";
import type { FamilyStats } from "../../services/familyService";
import type { NDR } from "../../services/ndrService";
import "./Clients.css";

// Type pour étudiant avec garantie de structure
interface StudentData {
  _id: string;
  firstName: string;
  lastName: string;
}

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };
// type CreateFamilyData = Omit<Family, "_id" | "createdAt" | "updatedAt">; // Non utilisé - clients créés via NDR

// Type pour famille incomplète
interface IncompleteFamilyData extends Family {
  missingFields: string[];
}

// Fonctions utilitaires pour extraire les valeurs (adaptées pour NDR)
const getSubjectValue = (
  note: NDR,
  field: "hourlyRate" | "quantity"
): number => {
  if (field === "hourlyRate") return note.hourlyRate || 0;
  if (field === "quantity") return note.quantity || 0;
  return 0;
};

const getAllSubjectNames = (note: NDR): string => {
  if (!note.subjects || note.subjects.length === 0) return "Aucune matière";
  return note.subjects
    .map((subject) =>
      typeof subject.id === "object" ? subject.id.name : "Matière"
    )
    .join(", ");
};

const getStudentName = (
  note: NDR,
  familyStudents?: Array<{ _id: string; firstName: string; lastName: string }>
): string => {
  // Les NDR stockent les bénéficiaires
  if (!note.beneficiaries?.students || !note.beneficiaries.students.length) {
    return note.beneficiaries?.adult ? "Adulte" : "Non spécifié";
  }

  // Si on n'a pas les données de famille, on ne peut pas résoudre les noms
  if (!familyStudents || !familyStudents.length) return "Non spécifié";

  // Cross-référencer les student IDs avec les étudiants de la famille
  const studentNames = note.beneficiaries.students
    .map((beneficiary) => {
      const student = familyStudents.find((s) => s._id === beneficiary.id);
      return student ? `${student.firstName} ${student.lastName}` : null;
    })
    .filter((name) => name !== null);

  const result =
    studentNames.length > 0 ? studentNames.join(", ") : "Non spécifié";
  return result;
};

export const Clients: React.FC = () => {
  const navigate = useNavigate();

  // State for data management
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Family[]>([]);
  const [, setStats] = useState<FamilyStats | null>(null);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNDRModalOpen, setIsNDRModalOpen] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [selectedFamilyNDRs, setSelectedFamilyNDRs] = useState<NDR[]>([]);
  const [isLoadingNDRs, setIsLoadingNDRs] = useState(false);

  // États pour la modal de complétion de famille
  const [isCompleteFamilyModalOpen, setIsCompleteFamilyModalOpen] = useState(false);
  const [selectedIncompleteFamily, setSelectedIncompleteFamily] = useState<IncompleteFamilyData | null>(null);

  // Load families and stats data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Load families (clients only - those with NDRs)
        const families = await familyService.getFamilies();
        const clientsWithNDR = families.filter(
          (family) => family.ndr && family.ndr.length > 0
        );
        setClients(clientsWithNDR);

        // Load stats
        const familyStats = await familyService.getFamilyStats();
        setStats(familyStats);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Impossible de charger les données des clients");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Function to get first NDR date for a family
  const getFirstNDRDate = (familyId: string): string => {
    const family = clients.find((f) => f._id === familyId);
    if (!family?.ndr || family.ndr.length === 0) {
      return "";
    }

    // La famille contient seulement les IDs des NDRs, pas les dates
    // Il faudrait charger les NDRs pour avoir les dates
    return "N/A";
  };

  const handleViewSettlementNotes = async (familyId: string) => {
    try {
      setIsLoadingNDRs(true);
      setSelectedFamilyId(familyId);

      // Charger les NDR de la famille sélectionnée
      const ndrList = await ndrService.getNdrsByFamily(familyId);
      setSelectedFamilyNDRs(ndrList);

      // S'assurer que la famille sélectionnée a ses étudiants peuplés
      // Si ce n'est pas le cas, recharger les données de toutes les familles
      const selectedFamily = clients.find((f) => f._id === familyId);
      console.log("🔍 Famille sélectionnée:", {
        familyId: familyId.substring(familyId.length - 8),
        students: selectedFamily?.students,
        studentsLength: selectedFamily?.students?.length || 0,
        firstStudent: selectedFamily?.students?.[0],
      });

      setIsNDRModalOpen(true);
    } catch (err) {
      console.error("Erreur lors du chargement des NDR:", err);
      setError("Impossible de charger les notes de règlement");
    } finally {
      setIsLoadingNDRs(false);
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
    // Les données seront automatiquement rafraîchies par le système de cache
  };

  // Handler pour cliquer sur une ligne du tableau (navigation vers détails)
  const handleRowClick = (row: TableRowData) => {
    console.log(
      `🔍 Navigation vers détails client: ${row.primaryContact.firstName} ${row.primaryContact.lastName}`
    );
    localStorage.setItem("clientId", row._id);
    navigate("/admin/client-details");
  };

  // Gérer la suppression d'un client
  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find((f) => f._id === clientId);
    const fullName = client
      ? `${client.primaryContact.firstName} ${client.primaryContact.lastName}`
      : "ce client";

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${fullName} ?\n\n` +
          `Cette action supprimera également tous les élèves associés et ne peut pas être annulée.`
      )
    ) {
      try {
        await familyService.deleteFamily(clientId);

        // Update local state by removing the deleted client
        setClients((prevData) => prevData.filter((f) => f._id !== clientId));

        console.log(`Client ${fullName} supprimé avec succès`);
      } catch (error) {
        console.error("Erreur lors de la suppression du client:", error);
        alert("Erreur lors de la suppression du client");
      }
    }
  };

  const handleCreateNDR = (familyId: string) => {
    // Trouver la famille dans la liste des clients
    const selectedFamily = clients.find((family) => family._id === familyId);
    if (!selectedFamily) return;

    // Vérifier si la famille est complète
    const validation = familyService.validateFamilyCompleteness(selectedFamily);

    if (!validation.isComplete) {
      // Famille incomplète → afficher toast + modal
      toast.error("Veuillez compléter les informations de la famille");
      setSelectedIncompleteFamily({
        ...selectedFamily,
        missingFields: validation.missingFields,
      });
      setIsCompleteFamilyModalOpen(true);
      return;
    }

    // Famille complète → naviguer directement
    localStorage.setItem("selectedFamily", JSON.stringify(selectedFamily));
    navigate(`/admin/beneficiaries-subjects`);
  };

  // Handler pour la sauvegarde réussie de la modal
  const handleCompleteFamilySaveSuccess = (updatedFamily: Family) => {
    // Fermer la modal
    setIsCompleteFamilyModalOpen(false);

    // Stocker la famille mise à jour et naviguer
    localStorage.setItem("selectedFamily", JSON.stringify(updatedFamily));
    navigate(`/admin/beneficiaries-subjects`);
  };

  // Handlers pour les actions NDR (copiés du tableau de bord)
  const handleViewNote = (noteId: string) => {
    navigate(`/admin/dashboard/${noteId}`);
  };

  const handleEditNote = (noteId: string) => {
    navigate(`/admin/dashboard/edit/${noteId}`);
  };

  const handleDeleteNote = async (noteId: string) => {
    // Trouver la note pour afficher des détails dans la confirmation
    const noteToDelete = selectedFamilyNDRs.find((note) => note._id === noteId);
    const noteNumber = noteId.substring(noteId.length - 8).toUpperCase();
    const clientName = (noteToDelete as any)?.clientName || "Inconnue";

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer cette note de règlement ?\n\n` +
          `N° NDR: ${noteNumber}\n` +
          `Client: ${clientName}\n\n` +
          `Cette action supprimera également tous les coupons associés et ne peut pas être annulée.`
      )
    ) {
      try {
        setIsLoadingNDRs(true);

        // Mettre à jour la liste locale pour la modal
        const updatedNDRs = selectedFamilyNDRs.filter(
          (note) => note._id !== noteId
        );
        setSelectedFamilyNDRs(updatedNDRs);

        // Si plus de NDR, reclasser la famille en prospect
        if (updatedNDRs.length === 0) {
          try {
            await familyService.updateFamily(selectedFamilyId, {
              prospectStatus: "prospect",
            });
            console.log(`✅ Client reclassifié en prospect (0 NDR restantes)`);
          } catch (error) {
            console.error("Erreur lors du reclassement:", error);
          }
        }

        console.log(
          `✅ Note ${noteNumber} supprimée - ${updatedNDRs.length} NDR restantes`
        );
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setError(
          error instanceof Error
            ? `Erreur lors de la suppression: ${error.message}`
            : "Erreur lors de la suppression de la note"
        );
      } finally {
        setIsLoadingNDRs(false);
      }
    }
  };

  // Filtrer les données selon le terme de recherche
  const filteredData = clients.filter((family) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName =
      `${family.primaryContact.firstName} ${family.primaryContact.lastName}`.toLowerCase();
    const phone = family.primaryContact.primaryPhone || "";
    const email = (family.primaryContact?.email || "").toLowerCase();
    const address = family.primaryContact.address
      ? `${family.primaryContact.address.street} ${family.primaryContact.address.city}`.toLowerCase()
      : "";

    return (
      fullName.includes(searchLower) ||
      phone.includes(searchLower) ||
      email.includes(searchLower) ||
      address.includes(searchLower)
    );
  });

  // Transformer les données pour le tableau
  const tableData: TableRowData[] = filteredData.map((family) => ({
    ...family,
    id: family._id,
  }));

  // Colonnes du tableau NDR pour la modal
  const ndrColumns = [
    {
      key: "id",
      label: "N°",
      render: (_: unknown, row: NDR & { id: string }, index?: number) => (
        <div className="text-sm font-medium">
          #
          {typeof index === "number"
            ? index + 1
            : ndrTableData.findIndex((ndr) => ndr.id === row.id) + 1}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="text-sm">
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "clientName",
      label: "Client",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="text-sm font-medium">{(row as any).clientName}</div>
      ),
    },
    {
      key: "studentName",
      label: "Bénéficiaires",
      render: (_: unknown, row: NDR & { id: string }) => {
        // Récupérer les étudiants de la famille sélectionnée
        const selectedFamily = clients.find((f) => f._id === selectedFamilyId);
        const familyStudents = selectedFamily?.students || [];
        // Convertir en format attendu par getStudentName
        const typedStudents: {
          _id: string;
          firstName: string;
          lastName: string;
        }[] = [];
        if (Array.isArray(familyStudents)) {
          for (const student of familyStudents) {
            if (
              typeof student === "object" &&
              student !== null &&
              "_id" in student
            ) {
              const studentData = student as StudentData;
              typedStudents.push({
                _id: studentData._id,
                firstName: studentData.firstName,
                lastName: studentData.lastName,
              });
            }
          }
        }
        return (
          <div className="text-sm">{getStudentName(row, typedStudents)}</div>
        );
      },
    },
    {
      key: "department",
      label: "Dpt",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="text-sm">{(row as any).department}</div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Paiement",
      render: (_: unknown, row: NDR & { id: string }) => {
        return (
          <div className="text-sm">
            {row.paymentMethod === "card"
              ? "CB"
              : row.paymentMethod === "check"
              ? "Chèque"
              : row.paymentMethod === "transfer"
              ? "Virement"
              : row.paymentMethod === "cash"
              ? "Espèces"
              : row.paymentMethod}
          </div>
        );
      },
    },
    {
      key: "subjects",
      label: "Matières",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="text-sm">{getAllSubjectNames(row)}</div>
      ),
    },
    {
      key: "quantity",
      label: "QTé",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="text-sm text-center">
          {getSubjectValue(row, "quantity")}
        </div>
      ),
    },
    {
      key: "pu",
      label: "PU",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="text-sm">
          {getSubjectValue(row, "hourlyRate").toFixed(2)} €
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (_: unknown, row: NDR & { id: string }) => {
        const total =
          getSubjectValue(row, "hourlyRate") * getSubjectValue(row, "quantity");
        return <div className="text-sm font-medium">{total.toFixed(2)} €</div>;
      },
    },
    {
      key: "margin",
      label: "Marge",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="text-sm">
          <div className="font-medium">
            {(row as any).marginAmount?.toFixed(2) || "0.00"} €
          </div>
          <div className="text-xs text-gray-500">
            ({(row as any).marginPercentage?.toFixed(1) || "0.0"}%)
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, row: NDR & { id: string }) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
          paid: "bg-green-100 text-green-800 border-green-200",
          overdue: "bg-red-100 text-red-800 border-red-200",
        };
        const statusLabels = {
          pending: "En attente",
          paid: "Payé",
          overdue: "En retard",
        };
        return (
          <div
            className={`px-2 py-1 rounded border text-xs ${
              statusColors[row.status as keyof typeof statusColors]
            }`}
          >
            {statusLabels[row.status as keyof typeof statusLabels]}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: NDR & { id: string }) => (
        <div className="table__actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleViewNote(row._id)}
          >
            👁️
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleEditNote(row._id)}
          >
            ✏️
          </Button>
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

  // Données du tableau NDR pour la modal
  const ndrTableData = selectedFamilyNDRs.map((ndr) => ({
    ...ndr,
    id: ndr._id,
  }));

  // Note: getProspectStatusColor removed as it was unused

  // Configuration des colonnes du tableau
  const clientsColumns = [
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
      key: "clientNumber",
      label: "N° client",
      render: (_: unknown) => <div className="text-sm text-gray-500">-</div>,
    },
    {
      key: "source",
      label: "Source",
      render: (_: unknown) => (
        <div className="text-sm">
          <input
            type="text"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Source..."
            defaultValue=""
          />
        </div>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {`${row.primaryContact.primaryPhone}${
            row.primaryContact.relation
              ? ` (${row.primaryContact.relation})`
              : ""
          }${
            row.secondaryContact?.phone
              ? ` ${row.secondaryContact.phone}${
                  row.secondaryContact.relation
                    ? ` (${row.secondaryContact.relation})`
                    : ""
                }`
              : ""
          }`}
        </div>
      ),
    },
    {
      key: "postalCode",
      label: "Code postal",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.primaryContact.address?.postalCode || "N/A"}</div>
      ),
    },
    {
      key: "students",
      label: "Bénéficiaires",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {row.students && row.students.length > 0
            ? row.students
                .map((s) =>
                  typeof s === "string" ? s : `${s.firstName} ${s.lastName}`
                )
                .join(", ")
            : "Aucun élève"}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Date création",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">
          {getFirstNDRDate(row._id) ||
            new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => {
        return (
          <div className="table__actions">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleCreateNDR(row._id)}
              title="Créer une nouvelle note de règlement"
            >
              Créer NDR
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleViewSettlementNotes(row._id)}
            >
              Voir les NDR ({row.ndr?.length || 0})
            </Button>
            <Button
              size="sm"
              variant="error"
              onClick={() => handleDeleteClient(row._id)}
              title="Supprimer le client"
            >
              ✕
            </Button>
          </div>
        );
      },
    },
  ];

  // handleCreateClientSubmit supprimé - les clients sont créés via NDR depuis prospects

  return (
    <div>
      <PageHeader title="Gestion des Clients" />
      <Container layout="flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Container layout="grid" padding="none">
          <SummaryCard
            title="CLIENTS"
            metrics={[
              {
                value: clients.length,
                label: "Total clients",
                variant: "primary",
              },
              {
                value: clients.length,
                label: "Clients actifs",
                variant: "success",
              },
            ]}
          />
        </Container>

        {/* Bouton "Ajouter un client" supprimé - Les clients sont créés via NDR depuis prospects */}

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
          <h3>Liste des clients</h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement des clients...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm
                  ? "Aucun client trouvé pour cette recherche"
                  : "Aucun client disponible"}
              </div>
            </div>
          ) : (
            <Table
              columns={clientsColumns}
              data={tableData}
              onRowClick={handleRowClick}
            />
          )}
        </Container>
      </Container>

      {/* Modal création client supprimée - les clients sont créés via NDR depuis prospects */}

      {/* Modal des NDR */}
      {isNDRModalOpen && (
        <ModalWrapper
          isOpen={isNDRModalOpen}
          onClose={() => setIsNDRModalOpen(false)}
          size="xl"
        >
          <div className="ndr-modal-content">
            <div className="ndr-modal-header">
              <h2
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-h2)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                Notes de règlement -{" "}
                {
                  clients.find((f) => f._id === selectedFamilyId)
                    ?.primaryContact.firstName
                }{" "}
                {
                  clients.find((f) => f._id === selectedFamilyId)
                    ?.primaryContact.lastName
                }
              </h2>
            </div>

            <div className="ndr-modal-body">
              {isLoadingNDRs ? (
                <div className="ndr-loading-state">
                  Chargement des notes de règlement...
                </div>
              ) : selectedFamilyNDRs.length === 0 ? (
                <div className="ndr-empty-state">
                  Aucune note de règlement trouvée
                </div>
              ) : (
                <>
                  <div className="ndr-modal-stats">
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--font-size-small)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {selectedFamilyNDRs.length} note
                      {selectedFamilyNDRs.length > 1 ? "s" : ""} de règlement
                      trouvée{selectedFamilyNDRs.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="ndr-table-container">
                    <Table columns={ndrColumns} data={ndrTableData} />
                  </div>
                </>
              )}
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Modal de complétion de famille */}
      <CompleteFamilyModal
        isOpen={isCompleteFamilyModalOpen}
        onClose={() => setIsCompleteFamilyModalOpen(false)}
        family={selectedIncompleteFamily}
        onSaveSuccess={handleCompleteFamilySaveSuccess}
      />
    </div>
  );
};
