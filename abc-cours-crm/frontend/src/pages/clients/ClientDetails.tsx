import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  Button,
  DataCard,
  Table,
  AddStudentModal,
} from "../../components";
import { familyService } from "../../services/familyService";
import { settlementService } from "../../services/settlementService";
import type { Family } from "../../types/family";
import type { SettlementNote } from "../../services/settlementService";

export const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [client, setClient] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  // États pour les NDRs
  const [settlementNotes, setSettlementNotes] = useState<SettlementNote[]>([]);
  const [isLoadingNDRs, setIsLoadingNDRs] = useState(false);


  // État pour la modal d'ajout d'élève
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Fonction pour charger les détails du client
  const loadClientDetails = async () => {
    if (!clientId) {
      setError("ID client manquant");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`🔍 Chargement détails client ${clientId}`);

      // Charger les données du client
      console.log(`📡 Appel API: familyService.getFamily(${clientId})`);
      const clientData = await familyService.getFamily(clientId);
      console.log(`✅ Client reçu:`, clientData);
      setClient(clientData);

      // Charger les NDRs de cette famille
      console.log(`📡 Chargement des NDRs pour la famille: ${clientId}`);
      setIsLoadingNDRs(true);
      try {
        const notes = await settlementService.getSettlementNotesByFamily(clientId);
        console.log(`✅ NDRs reçues:`, notes);
        setSettlementNotes(notes);
      } catch (ndrError) {
        console.error("Erreur lors du chargement des NDRs:", ndrError);
        // Ne pas bloquer l'affichage du client si les NDRs échouent
      } finally {
        setIsLoadingNDRs(false);
      }

      console.log(
        `✅ Client chargé: ${clientData.primaryContact.firstName} ${clientData.primaryContact.lastName}`
      );
    } catch (err) {
      console.error("Erreur lors du chargement des détails client:", err);
      setError("Impossible de charger les détails du client");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);

  // Fonction pour recharger les données du client (pour les DataCard autonomes)
  const refetchClient = async () => {
    await loadClientDetails();
  };






  // Fonctions utilitaires pour les NDRs
  const getStatusBadge = (status: SettlementNote['status']) => {
    const statusConfig = {
      pending: { label: "En attente", className: "inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full" },
      paid: { label: "Payée", className: "inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full" },
      overdue: { label: "En retard", className: "inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full" }
    };
    
    const config = statusConfig[status];
    return (
      <span className={config.className}>
        {config.label}
      </span>
    );
  };

  const calculateTotalAmount = (note: SettlementNote): number => {
    // Utiliser d'abord le montant calculé s'il existe, sinon calculer depuis les matières
    if (note.totalHourlyRate && note.totalQuantity) {
      return note.totalHourlyRate * note.totalQuantity;
    }
    return note.subjects.reduce((total, subject) => total + (subject.hourlyRate * subject.quantity), 0);
  };

  const formatSubjectsDisplay = (subjects: SettlementNote['subjects']): string => {
    return subjects.map(subject => {
      const subjectName = typeof subject.subjectId === 'string' ? subject.subjectId : subject.subjectId.name;
      return `${subjectName} (${subject.quantity}h)`;
    }).join(', ');
  };

  const getDisplayValue = (client: Family, path: string) => {
    const keys = path.split(".");
    let value: any =
      keys.length === 1
        ? client[path as keyof Family]
        : (client as any)[keys[0]]?.[keys[1]];

    // Gestion spéciale pour les tableaux (comme subjects)
    if (path === "demande.subjects" && Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "Non renseignées";
    }

    // Gestion spéciale pour plannedTeacher
    if (path === "plannedTeacher") {
      if (!value) return "Non assigné";
      if (typeof value === "string") return value;
      if (
        typeof value === "object" &&
        "firstName" in value &&
        "lastName" in value
      ) {
        return `${(value as any).firstName} ${(value as any).lastName}`;
      }
      return "Non assigné";
    }

    // Gestion des dates
    if (
      (path === "primaryContact.dateOfBirth" ||
        path === "secondaryContact.dateOfBirth") &&
      value
    ) {
      return new Date(value).toLocaleDateString("fr-FR");
    }

    return value || "Non renseigné";
  };

  if (isLoading) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <Breadcrumb
          items={[
            { label: "Clients", href: "/clients" },
            { label: "Chargement...", href: "#" },
          ]}
        />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-gray-500">
              Chargement des détails du client...
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <Breadcrumb
          items={[
            { label: "Clients", href: "/clients" },
            { label: "Erreur", href: "#" },
          ]}
        />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-red-500">{error || "Client non trouvé"}</div>
            <Button
              variant="primary"
              onClick={() => navigate("/clients")}
              className="mt-4"
            >
              Retour à la liste des clients
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const clientName = `${client.primaryContact.firstName} ${client.primaryContact.lastName}`;

  // Configuration des champs pour le mapping
  const fieldConfig = {
    personal: [
      {
        key: "firstName",
        label: "Prénom",
        field: "primaryContact.firstName",
        type: "text",
        placeholder: "Prénom",
        required: true,
      },
      {
        key: "lastName",
        label: "Nom",
        field: "primaryContact.lastName",
        type: "text",
        placeholder: "Nom",
        required: true,
      },
      {
        key: "email",
        label: "Email",
        field: "primaryContact.email",
        type: "email",
        placeholder: "email@exemple.com",
        required: true,
      },
      {
        key: "primaryPhone",
        label: "Téléphone principal",
        field: "primaryContact.primaryPhone",
        type: "tel",
        placeholder: "06 12 34 56 78",
        required: true,
      },
      {
        key: "secondaryPhone",
        label: "Téléphone secondaire",
        field: "primaryContact.secondaryPhone",
        type: "tel",
        placeholder: "06 12 34 56 78",
        required: false,
      },
      {
        key: "gender",
        label: "Civilité",
        field: "primaryContact.gender",
        type: "select",
        options: [
          { value: "M.", label: "Monsieur" },
          { value: "Mme", label: "Madame" },
        ],
        required: true,
      },
      {
        key: "dateOfBirth",
        label: "Date de naissance",
        field: "primaryContact.dateOfBirth",
        type: "date",
        required: false,
      },
      {
        key: "relationship",
        label: "Relation",
        field: "primaryContact.relationship",
        type: "text",
        placeholder: "Père, Mère, etc.",
        required: false,
      },
    ],
    address: [
      {
        key: "street",
        label: "Rue",
        field: "address.street",
        type: "text",
        placeholder: "Adresse",
        required: true,
      },
      {
        key: "city",
        label: "Ville",
        field: "address.city",
        type: "text",
        placeholder: "Ville",
        required: true,
      },
      {
        key: "postalCode",
        label: "Code postal",
        field: "address.postalCode",
        type: "text",
        placeholder: "Code postal",
        required: true,
      },
    ],
    commercial: [
      {
        key: "source",
        label: "Source d'acquisition",
        field: "source",
        type: "text",
        placeholder: "Source",
        required: false,
      },
      {
        key: "notes",
        label: "Notes générales",
        field: "notes",
        type: "textarea",
        placeholder: "Notes",
        required: false,
      },
    ],
    demande: [
      {
        key: "beneficiaryType",
        label: "Type de bénéficiaire",
        field: "demande.beneficiaryType",
        type: "select",
        options: [
          { value: "adulte", label: "Adulte" },
          { value: "eleves", label: "Élèves" },
        ],
        required: false,
      },
      {
        key: "subjects",
        label: "Matières demandées",
        field: "demande.subjects",
        type: "text",
        placeholder: "Mathématiques, Français, etc.",
        required: false,
      },
      {
        key: "notes",
        label: "Notes sur la demande",
        field: "demande.notes",
        type: "textarea",
        placeholder: "Notes sur la demande",
        required: false,
      },
    ],
    secondaryContact: [
      {
        key: "firstName",
        label: "Prénom",
        field: "secondaryContact.firstName",
        type: "text",
        placeholder: "Prénom",
        required: false,
      },
      {
        key: "lastName",
        label: "Nom",
        field: "secondaryContact.lastName",
        type: "text",
        placeholder: "Nom",
        required: false,
      },
      {
        key: "email",
        label: "Email",
        field: "secondaryContact.email",
        type: "email",
        placeholder: "email@exemple.com",
        required: false,
      },
      {
        key: "phone",
        label: "Téléphone",
        field: "secondaryContact.phone",
        type: "tel",
        placeholder: "06 12 34 56 78",
        required: false,
      },
      {
        key: "relationship",
        label: "Relation",
        field: "secondaryContact.relationship",
        type: "text",
        placeholder: "Père, Mère, etc.",
        required: false,
      },
      {
        key: "dateOfBirth",
        label: "Date de naissance",
        field: "secondaryContact.dateOfBirth",
        type: "date",
        required: false,
      },
    ],
    billingAddress: [
      {
        key: "street",
        label: "Rue",
        field: "billingAddress.street",
        type: "text",
        placeholder: "Adresse de facturation",
        required: false,
      },
      {
        key: "city",
        label: "Ville",
        field: "billingAddress.city",
        type: "text",
        placeholder: "Ville",
        required: false,
      },
      {
        key: "postalCode",
        label: "Code postal",
        field: "billingAddress.postalCode",
        type: "text",
        placeholder: "Code postal",
        required: false,
      },
    ],
    companyInfo: [
      {
        key: "urssafNumber",
        label: "Numéro URSSAF",
        field: "companyInfo.urssafNumber",
        type: "text",
        placeholder: "Numéro URSSAF",
        required: false,
      },
      {
        key: "siretNumber",
        label: "Numéro SIRET",
        field: "companyInfo.siretNumber",
        type: "text",
        placeholder: "Numéro SIRET",
        required: false,
      },
      {
        key: "ceNumber",
        label: "Numéro CE",
        field: "companyInfo.ceNumber",
        type: "text",
        placeholder: "Numéro CE",
        required: false,
      },
    ],
  };

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Clients", href: "/clients" },
          { label: clientName, href: "#" },
        ]}
      />
      <Container layout="flex-col">
        <div className="client-details-header">
          <h1>
            Détails du client {client.primaryContact.firstName}{" "}
            {client.primaryContact.lastName}
          </h1>
          <p>
            Créé le {new Date(client.createdAt).toLocaleDateString("fr-FR")}.
            Dernière modification le{" "}
            {new Date(client.updatedAt).toLocaleDateString("fr-FR")}.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/clients")}>
              Retour
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Informations client avec grille responsive étendue */}
        <div className="client-details__content">
          {/* Contact principal */}
          <DataCard
            title="Contact principal"
            fields={fieldConfig.personal.map((field) => ({
              key: field.key,
              label: field.label,
              value: getDisplayValue(client, field.field),
              type: field.type as
                | "text"
                | "email"
                | "tel"
                | "number"
                | "date"
                | "textarea"
                | "select",
              required: field.required || false,
              placeholder: field.placeholder,
              options: (field as any).options,
            }))}
            onSave={async (data) => {
              // Construire l'objet de données pour l'API
              const updateData: any = {
                primaryContact: {}
              };
              
              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.personal.find(f => f.key === key);
                if (field) {
                  const fieldParts = field.field.split('.');
                  if (fieldParts.length === 2) {
                    const [parent, child] = fieldParts;
                    updateData[parent][child] = value;
                  }
                }
              });
              
              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);
              await refetchClient();
            }}
            className="client-details__section client-details__section--primary-contact"
          />

          {/* Contact secondaire */}
          <DataCard
            title="Contact secondaire"
            fields={fieldConfig.secondaryContact.map((field) => ({
              key: field.key,
              label: field.label,
              value: getDisplayValue(client, field.field),
              type: field.type as
                | "text"
                | "email"
                | "tel"
                | "number"
                | "date"
                | "textarea"
                | "select",
              required: field.required || false,
              placeholder: field.placeholder,
              options: (field as any).options,
            }))}
            onSave={async (data) => {
              // Construire l'objet de données pour l'API
              const updateData: any = {
                secondaryContact: {}
              };
              
              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.secondaryContact.find(f => f.key === key);
                if (field) {
                  const fieldParts = field.field.split('.');
                  if (fieldParts.length === 2) {
                    const [parent, child] = fieldParts;
                    updateData[parent][child] = value;
                  }
                }
              });
              
              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);
              await refetchClient();
            }}
            className="client-details__section client-details__section--secondary-contact"
          />

          {/* Adresse principale */}
          <DataCard
            title="Adresse principale"
            fields={fieldConfig.address.map((field) => ({
              key: field.key,
              label: field.label,
              value: getDisplayValue(client, field.field),
              type: field.type as
                | "text"
                | "email"
                | "tel"
                | "number"
                | "date"
                | "textarea"
                | "select",
              required: field.required || false,
              placeholder: field.placeholder,
            }))}
            onSave={async (data) => {
              // Construire l'objet de données pour l'API
              const updateData: any = {
                address: {}
              };
              
              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.address.find(f => f.key === key);
                if (field) {
                  const fieldParts = field.field.split('.');
                  if (fieldParts.length === 2) {
                    const [parent, child] = fieldParts;
                    updateData[parent][child] = value;
                  }
                }
              });
              
              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);
              await refetchClient();
            }}
            className="client-details__section client-details__section--address"
          />

          {/* Adresse de facturation */}
          <DataCard
            title="Adresse de facturation"
            fields={fieldConfig.billingAddress.map((field) => ({
              key: field.key,
              label: field.label,
              value: getDisplayValue(client, field.field),
              type: field.type as
                | "text"
                | "email"
                | "tel"
                | "number"
                | "date"
                | "textarea"
                | "select",
              required: field.required || false,
              placeholder: field.placeholder,
            }))}
            onSave={async (data) => {
              // Construire l'objet de données pour l'API
              const updateData: any = {
                billingAddress: {}
              };
              
              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.billingAddress.find(f => f.key === key);
                if (field) {
                  const fieldParts = field.field.split('.');
                  if (fieldParts.length === 2) {
                    const [parent, child] = fieldParts;
                    updateData[parent][child] = value;
                  }
                }
              });
              
              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);
              await refetchClient();
            }}
            className="client-details__section client-details__section--billing-address"
          />

          {/* Informations commerciales */}
          <DataCard
            title="Informations commerciales"
            fields={[
              ...fieldConfig.commercial.map((field) => ({
                key: field.key,
                label: field.label,
                value: getDisplayValue(client, field.field),
                type: field.type as
                  | "text"
                  | "email"
                  | "tel"
                  | "number"
                  | "date"
                  | "textarea"
                  | "select",
                required: field.required || false,
                placeholder: field.placeholder,
              })),
              {
                key: "createdAt",
                label: "Date de création",
                value: client.createdAt
                  ? new Date(client.createdAt).toLocaleDateString("fr-FR")
                  : "Non renseignée",
                type: "text" as const,
                required: false,
              },
              {
                key: "updatedAt",
                label: "Dernière modification",
                value: client.updatedAt
                  ? new Date(client.updatedAt).toLocaleDateString("fr-FR")
                  : "Non renseignée",
                type: "text" as const,
                required: false,
              },
            ]}
            onSave={async (data) => {
              // Construire l'objet de données pour l'API
              const updateData: any = {};
              
              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.commercial.find(f => f.key === key);
                if (field && field.key !== 'status') {  // Exclure les champs read-only
                  updateData[field.field] = value;
                }
              });
              
              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);
              await refetchClient();
            }}
            className="client-details__section client-details__section--commercial"
          />

          {/* Informations entreprise */}
          <DataCard
            title="Informations entreprise"
            fields={fieldConfig.companyInfo.map((field) => ({
              key: field.key,
              label: field.label,
              value: getDisplayValue(client, field.field),
              type: field.type as
                | "text"
                | "email"
                | "tel"
                | "number"
                | "date"
                | "textarea"
                | "select",
              required: field.required || false,
              placeholder: field.placeholder,
            }))}
            onSave={async (data) => {
              // Construire l'objet de données pour l'API
              const updateData: any = {
                companyInfo: {}
              };
              
              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.companyInfo.find(f => f.key === key);
                if (field) {
                  const fieldParts = field.field.split('.');
                  if (fieldParts.length === 2) {
                    const [parent, child] = fieldParts;
                    updateData[parent][child] = value;
                  }
                }
              });
              
              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);
              await refetchClient();
            }}
            className="client-details__section client-details__section--company"
          />

          {/* Élèves */}
          <DataCard
            title={`Élèves (${client.students?.length || 0})`}
            fields={[]}
          >
            <div>
              {client.students && client.students.length > 0 ? (
                <Table
                  columns={[
                    {
                      key: "firstName",
                      label: "Prénom",
                      render: (value, row: any) => typeof row === "string" ? row : value
                    },
                    {
                      key: "lastName",
                      label: "Nom",
                      render: (value, row: any) => typeof row === "string" ? "" : value
                    },
                    {
                      key: "dateOfBirth",
                      label: "Né(e) le",
                      render: (value, row: any) => {
                        if (typeof row === "string") return "-";
                        return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
                      }
                    },
                    {
                      key: "courseLocation",
                      label: "Lieu des cours",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        if (!row.courseLocation?.type) return "-";
                        return row.courseLocation.type === "domicile" ? "À domicile" : 
                               row.courseLocation.type === "professeur" ? "Chez le professeur" : "Autre";
                      }
                    },
                    {
                      key: "postalCode",
                      label: "Code postal",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        return row.courseLocation?.address?.postalCode || "-";
                      }
                    },
                    {
                      key: "city",
                      label: "Ville",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        return row.courseLocation?.address?.city || "-";
                      }
                    },
                    {
                      key: "phone",
                      label: "Tél",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        return row.contact?.phone || "-";
                      }
                    },
                    {
                      key: "availability",
                      label: "Disponibilités",
                      render: (value, row: any) => {
                        if (typeof row === "string") return "-";
                        return value || "-";
                      }
                    },
                    {
                      key: "comments",
                      label: "Com.",
                      render: (value, row: any) => {
                        if (typeof row === "string") return "-";
                        const comment = value || row.notes || "";
                        return comment.length > 30 ? `${comment.substring(0, 30)}...` : comment || "-";
                      }
                    },
                    {
                      key: "settlementNoteIds",
                      label: "NDR",
                      render: (_, row: any) => (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                          {row.settlementNoteIds?.length || 0}
                        </span>
                      )
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (_, row: any) => (
                        <div className="table__actions">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              // TODO: Implémenter modification élève
                              console.log("Modification élève:", row);
                            }}
                            title="Modifier l'élève"
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => {
                              const studentName = typeof row === "string" ? row : `${row.firstName} ${row.lastName}`;
                              if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'élève ${studentName} ?`)) {
                                // TODO: Implémenter suppression élève
                                console.log("Suppression élève:", row);
                              }
                            }}
                            title="Supprimer l'élève"
                          >
                            ✕
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  data={client.students.map((student, index) => ({
                    ...(typeof student === "string" ? { 
                      firstName: student, 
                      lastName: "", 
                      id: `string-${index}` 
                    } : { 
                      ...student, 
                      id: student._id || `student-${index}` 
                    })
                  }))}
                  itemsPerPage={10}
                />
              ) : (
                <div>
                  <p>Aucun élève enregistré</p>
                </div>
              )}

              <div>
                <Button
                  variant="primary"
                  onClick={() => setShowAddStudentModal(true)}
                >
                  Ajouter un élève
                </Button>
              </div>
            </div>
          </DataCard>

          {/* Notes de règlement */}
          <DataCard
            title={`Notes de règlement (${settlementNotes.length})`}
            fields={[]}
          >
            <div>
              {isLoadingNDRs ? (
                <div className="text-center py-4">
                  <div className="text-gray-500">Chargement des notes de règlement...</div>
                </div>
              ) : settlementNotes && settlementNotes.length > 0 ? (
                <Table
                  columns={[
                    {
                      key: "createdAt",
                      label: "Date création",
                      render: (value) => new Date(value).toLocaleDateString("fr-FR")
                    },
                    {
                      key: "status",
                      label: "Statut",
                      render: (value) => getStatusBadge(value)
                    },
                    {
                      key: "totalAmount",
                      label: "Montant total",
                      render: (_, row: SettlementNote) => `${calculateTotalAmount(row).toFixed(2)} €`
                    },
                    {
                      key: "subjects",
                      label: "Matières",
                      render: (value) => {
                        const display = formatSubjectsDisplay(value);
                        return display.length > 50 ? `${display.substring(0, 50)}...` : display;
                      }
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (_, row: SettlementNote) => (
                        <div className="table__actions">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => navigate(`/admin/settlement-details/${row._id}`)}
                            title="Voir les détails"
                          >
                            👁️
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/settlement-details/${row._id}?mode=edit`)}
                            title="Modifier"
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => {
                              if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette note de règlement ?`)) {
                                // TODO: Implémenter suppression NDR avec refetch
                                console.log("Suppression NDR:", row._id);
                              }
                            }}
                            title="Supprimer"
                          >
                            ✕
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  data={settlementNotes.map((note) => ({
                    ...note,
                    id: note._id
                  }))}
                  itemsPerPage={10}
                />
              ) : (
                <div>
                  <p>Aucune note de règlement enregistrée</p>
                </div>
              )}

              <div>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/admin/create-settlement?familyId=${client?._id}`)}
                >
                  Nouvelle note de règlement
                </Button>
              </div>
            </div>
          </DataCard>
        </div>
      </Container>

      {/* Modal ajout d'élève */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        familyId={client?._id || ""}
        onSuccess={() => {
          // Recharger les données du client pour afficher le nouvel élève
          if (clientId) {
            loadClientDetails();
          }
        }}
      />
    </div>
  );
};
