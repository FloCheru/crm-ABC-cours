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
} from "../../components";
import { ModalWrapper } from "../../components/ui/ModalWrapper/ModalWrapper";
import { EntityForm } from "../../components/forms/EntityForm";
import { familyService } from "../../services/familyService";
import { settlementService } from "../../services/settlementService";
import type { Family } from "../../types/family";
import type { FamilyStats } from "../../services/familyService";
import type { SettlementNote } from "../../services/settlementService";
import { useRefresh } from "../../hooks/useRefresh";
import "./Clients.css";

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };
type CreateFamilyData = Omit<Family, "_id" | "createdAt" | "updatedAt">;

// Fonctions utilitaires pour extraire les valeurs des subjects (copiées du tableau de bord)
const getSubjectValue = (note: SettlementNote, field: 'hourlyRate' | 'quantity' | 'professorSalary'): number => {
  if (!note.subjects || note.subjects.length === 0) return 0;
  // Pour l'instant, on prend la première matière. Plus tard on pourra gérer plusieurs matières
  return note.subjects[0][field] || 0;
};

const getTotalSubjectValue = (note: SettlementNote, field: 'hourlyRate' | 'quantity' | 'professorSalary'): number => {
  if (!note.subjects || note.subjects.length === 0) return 0;
  return note.subjects.reduce((sum, subject) => sum + (subject[field] || 0), 0);
};

const getSubjectName = (note: SettlementNote): string => {
  if (!note.subjects || note.subjects.length === 0) return "N/A";
  const firstSubject = note.subjects[0];
  if (typeof firstSubject.subjectId === 'object') {
    return firstSubject.subjectId.name;
  }
  return "Matière";
};

const getAllSubjectNames = (note: SettlementNote): string => {
  if (!note.subjects || note.subjects.length === 0) return "Aucune matière";
  return note.subjects.map(subject => {
    if (typeof subject.subjectId === 'object') {
      return subject.subjectId.name;
    }
    return subject.subjectName || subject.name || "Matière";
  }).join(", ");
};

const getStudentName = (note: SettlementNote, familyStudents?: Array<{_id: string, firstName: string, lastName: string}>): string => {
  // 🔍 DÉBOGAGE - Analyser les données d'entrée
  console.log("🔍 getStudentName - Analyse:", {
    noteId: note._id?.substring(note._id.length - 8),
    studentIds: note.studentIds,
    studentIdsLength: note.studentIds?.length || 0,
    familyStudents: familyStudents?.map(s => ({ 
      id: s._id?.substring(s._id.length - 8), 
      name: `${s.firstName} ${s.lastName}` 
    })) || null,
    familyStudentsLength: familyStudents?.length || 0
  });
  
  // Les NDR stockent les IDs des étudiants, pas les noms
  if (!note.studentIds || !note.studentIds.length) return "Non spécifié";
  
  // Si on n'a pas les données de famille, on ne peut pas résoudre les noms
  if (!familyStudents || !familyStudents.length) return "Non spécifié";
  
  // Cross-référencer les studentIds avec les étudiants de la famille
  const studentNames = note.studentIds
    .map(studentId => {
      const student = familyStudents.find(s => s._id === studentId);
      console.log("🔍 Match search:", { 
        searchingFor: studentId?.substring(studentId.length - 8), 
        found: student ? `${student.firstName} ${student.lastName}` : null 
      });
      return student ? `${student.firstName} ${student.lastName}` : null;
    })
    .filter(name => name !== null);
  
  const result = studentNames.length > 0 ? studentNames.join(", ") : "Non spécifié";
  console.log("🔍 getStudentName - Résultat final:", result);
  return result;
};

export const Clients: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshTrigger } = useRefresh();
  const [familyData, setFamilyData] = useState<Family[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [firstNDRDates, setFirstNDRDates] = useState<{
    [familyId: string]: string;
  }>({});
  const [isNDRModalOpen, setIsNDRModalOpen] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [selectedFamilyNDRs, setSelectedFamilyNDRs] = useState<
    SettlementNote[]
  >([]);
  const [isLoadingNDRs, setIsLoadingNDRs] = useState(false);

  // Fonction pour charger les données des clients uniquement
  const loadClientData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [data, statsData] = await Promise.all([
        familyService.getFamilies(),
        familyService.getFamilyStats(),
      ]);
      const families = Array.isArray(data) ? data : [];

      // Filtrer pour ne garder que les clients
      const clients = families.filter((family) => family.status === "client");
      setFamilyData(clients);
      setStats(statsData);

      // Charger les dates de première NDR pour chaque client
      const ndrDates: { [familyId: string]: string } = {};
      await Promise.all(
        clients.map(async (client) => {
          try {
            const ndrList = await settlementService.getSettlementNotesByFamily(
              client._id
            );
            if (ndrList.length > 0) {
              // Trier par date de création et prendre la première
              const sortedNDRs = ndrList.sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );
              ndrDates[client._id] = new Date(
                sortedNDRs[0].createdAt
              ).toLocaleDateString("fr-FR");
            }
          } catch (err) {
            console.error(
              `Erreur lors du chargement des NDR pour ${client._id}:`,
              err
            );
            // En cas d'erreur, utiliser la date de création de la famille
            ndrDates[client._id] = new Date(
              client.createdAt
            ).toLocaleDateString("fr-FR");
          }
        })
      );
      setFirstNDRDates(ndrDates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
      console.error("Erreur lors du chargement des clients:", err);
      setFamilyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [refreshTrigger]);

  const handleCreateClient = () => {
    setIsCreateClientModalOpen(true);
  };

  const handleViewSettlementNotes = async (familyId: string) => {
    try {
      setIsLoadingNDRs(true);
      setSelectedFamilyId(familyId);

      // Charger les NDR de la famille sélectionnée
      const ndrList = await settlementService.getSettlementNotesByFamily(
        familyId
      );
      setSelectedFamilyNDRs(ndrList);
      
      // S'assurer que la famille sélectionnée a ses étudiants peuplés
      // Si ce n'est pas le cas, recharger les données de toutes les familles
      const selectedFamily = familyData.find(f => f._id === familyId);
      console.log("🔍 Famille sélectionnée:", {
        familyId: familyId.substring(familyId.length - 8),
        students: selectedFamily?.students,
        studentsLength: selectedFamily?.students?.length || 0,
        firstStudent: selectedFamily?.students?.[0]
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
    loadClientData();
  };

  // Gérer la suppression d'un client
  const handleDeleteClient = async (clientId: string) => {
    const client = familyData.find(f => f._id === clientId);
    const fullName = client ? `${client.primaryContact.firstName} ${client.primaryContact.lastName}` : "ce client";
    
    if (window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${fullName} ?\n\n` +
      `Cette action supprimera également tous les élèves associés et ne peut pas être annulée.`
    )) {
      try {
        await familyService.deleteFamily(clientId);
        
        // Mise à jour locale pour retirer le client supprimé
        setFamilyData(prevData => prevData.filter(family => family._id !== clientId));
        
        // Mettre à jour les statistiques
        setStats(prevStats => prevStats ? {
          ...prevStats,
          clients: prevStats.clients - 1
        } : null);
        
        console.log(`Client ${fullName} supprimé avec succès`);
      } catch (error) {
        console.error("Erreur lors de la suppression du client:", error);
        alert("Erreur lors de la suppression du client");
      }
    }
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
    const noteToDelete = selectedFamilyNDRs.find(note => note._id === noteId);
    const noteNumber = noteId.substring(noteId.length - 8).toUpperCase();
    const clientName = noteToDelete?.clientName || "Inconnue";
    
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
        await settlementService.deleteSettlementNote(noteId);
        
        // Recharger les NDR de la famille après suppression
        const ndrList = await settlementService.getSettlementNotesByFamily(
          selectedFamilyId
        );
        setSelectedFamilyNDRs(ndrList);
        
        // Message de succès (optionnel)
        console.log(`Note de règlement ${noteNumber} supprimée avec succès`);
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
  const filteredData = familyData.filter((family) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName =
      `${family.primaryContact.firstName} ${family.primaryContact.lastName}`.toLowerCase();
    const email = family.primaryContact.email?.toLowerCase() || "";
    const phone = family.primaryContact.primaryPhone || "";
    const address =
      `${family.address.street} ${family.address.city}`.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
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
      render: (
        _: unknown,
        row: SettlementNote & { id: string },
        index?: number
      ) => (
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
      render: (_: unknown, row: SettlementNote & { id: string }) => (
        <div className="text-sm">
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "clientName",
      label: "Client",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
        <div className="text-sm font-medium">{row.clientName}</div>
      ),
    },
    {
      key: "studentName",
      label: "Élève",
      render: (_: unknown, row: SettlementNote & { id: string }) => {
        // Récupérer les étudiants de la famille sélectionnée
        const selectedFamily = familyData.find(f => f._id === selectedFamilyId);
        const familyStudents = selectedFamily?.students || [];
        return (
          <div className="text-sm">
            {getStudentName(row, familyStudents)}
          </div>
        );
      },
    },
    {
      key: "department",
      label: "Dpt",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
        <div className="text-sm">{row.department}</div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Paiement",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
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
      ),
    },
    {
      key: "subjects",
      label: "Matières",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
        <div className="text-sm">
          {getAllSubjectNames(row)}
        </div>
      ),
    },
    {
      key: "quantity",
      label: "QTé",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
        <div className="text-sm text-center">{getSubjectValue(row, 'quantity')}</div>
      ),
    },
    {
      key: "pu",
      label: "PU",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
        <div className="text-sm">{getSubjectValue(row, 'hourlyRate').toFixed(2)} €</div>
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (_: unknown, row: SettlementNote & { id: string }) => {
        const total = getSubjectValue(row, 'hourlyRate') * getSubjectValue(row, 'quantity');
        return <div className="text-sm font-medium">{total.toFixed(2)} €</div>;
      },
    },
    {
      key: "margin",
      label: "Marge",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
        <div className="text-sm">
          <div className="font-medium">
            {row.marginAmount?.toFixed(2) || "0.00"} €
          </div>
          <div className="text-xs text-gray-500">
            ({row.marginPercentage?.toFixed(1) || "0.0"}%)
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, row: SettlementNote & { id: string }) => {
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
              statusColors[row.status]
            }`}
          >
            {statusLabels[row.status]}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: SettlementNote & { id: string }) => (
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

  // Fonction pour obtenir la couleur selon le statut du prospect (conservé pour compatibilité)
  const getProspectStatusColor = (status?: string) => {
    switch (status) {
      case "en_reflexion":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "interesse_prof_a_trouver":
        return "bg-red-100 text-red-800 border-red-200";
      case "injoignable":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ndr_editee":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "premier_cours_effectue":
        return "bg-green-100 text-green-800 border-green-200";
      case "rdv_prospect":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "ne_va_pas_convertir":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-green-100 text-green-800 border-green-200"; // Vert pour les clients
    }
  };

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
      key: "email",
      label: "Email",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.primaryContact.email}</div>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.primaryContact.primaryPhone}</div>
      ),
    },
    {
      key: "street",
      label: "Rue",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.address.street}</div>
      ),
    },
    {
      key: "postalCode",
      label: "Code postal",
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
      key: "students",
      label: "Élèves",
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
          {firstNDRDates[row._id] ||
            new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => {
        const ndrCount = row.settlementNotes ? row.settlementNotes.length : 0;
        return (
          <div className="table__actions">
            <Button
              size="sm"
              variant="success"
              onClick={() => navigate(`/admin/dashboard/create?familyId=${row._id}`)}
              title="Créer une nouvelle note de règlement"
            >
              Créer NDR
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleViewSettlementNotes(row._id)}
            >
              Voir les NDR ({ndrCount})
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

  const handleCreateClientSubmit = async (data: CreateFamilyData) => {
    try {
      // Ajouter le statut client aux données
      const clientData = {
        ...data,
        status: "client" as const,
      };

      await familyService.createFamily(clientData);
      setIsCreateClientModalOpen(false);
      loadClientData(); // Recharger les données
    } catch (err) {
      console.error("Erreur lors de la création du client:", err);
      throw err;
    }
  };

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb items={[{ label: "Clients", href: "/clients" }]} />
      <Container layout="flex-col">
        <h1>Gestion des Clients</h1>

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
                value: stats?.clients || 0,
                label: "Total clients",
                variant: "primary",
              },
              {
                value: familyData.length,
                label: "Clients actifs",
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
                text: "Créer un client",
                variant: "primary",
                onClick: handleCreateClient,
              },
            ]}
          />
        </Container>

        <Container layout="flex">
          <Input
            placeholder="Rechercher par nom, email, téléphone, adresse..."
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
            <Table columns={clientsColumns} data={tableData} />
          )}
        </Container>
      </Container>

      {/* Modal de création d'un client */}
      {isCreateClientModalOpen && (
        <ModalWrapper
          isOpen={isCreateClientModalOpen}
          onClose={() => setIsCreateClientModalOpen(false)}
          title="Créer un nouveau client"
        >
          <EntityForm
            entityType="family"
            onSubmit={handleCreateClientSubmit}
            onCancel={() => setIsCreateClientModalOpen(false)}
          />
        </ModalWrapper>
      )}

      {/* Modal des NDR */}
      {isNDRModalOpen && (
        <ModalWrapper
          isOpen={isNDRModalOpen}
          onClose={() => setIsNDRModalOpen(false)}
          size="xl"
        >
          <div className="ndr-modal-content">
            <div className="ndr-modal-header">
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-semibold)' }}>
                Notes de règlement - {
                  familyData.find((f) => f._id === selectedFamilyId)?.primaryContact.firstName
                } {
                  familyData.find((f) => f._id === selectedFamilyId)?.primaryContact.lastName
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
                    <p style={{ margin: 0, fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)' }}>
                      {selectedFamilyNDRs.length} note{selectedFamilyNDRs.length > 1 ? "s" : ""} de règlement trouvée{selectedFamilyNDRs.length > 1 ? "s" : ""}
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
    </div>
  );
};
