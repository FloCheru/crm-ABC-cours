import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  PageHeader,
  Container,
  Button,
  DataCard,
  Table,
  Modal,
} from "../../components";
import { familyService } from "../../services/familyService";
import { ndrService } from "../../services/ndrService";
import type { Family } from "../../types/family";
import type { NDR } from "../../services/ndrService";

export const ClientDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer l'ID depuis localStorage
  const clientId = localStorage.getItem("clientId");

  const [client, setClient] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // États pour les NDRs
  const [settlementNotes, setSettlementNotes] = useState<NDR[]>([]);
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
        const notes = await ndrService.getNdrsByFamily(clientId);
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

  // Fonctions utilitaires pour les NDRs
  const getStatusBadge = (status: NDR["status"]) => {
    const statusConfig = {
      pending: {
        label: "En attente",
        className:
          "inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full",
      },
      paid: {
        label: "Payée",
        className:
          "inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full",
      },
      overdue: {
        label: "En retard",
        className:
          "inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={config.className}>{config.label}</span>;
  };

  const calculateTotalAmount = (note: NDR): number => {
    return note.hourlyRate * note.quantity;
  };

  const formatSubjectsDisplay = (subjects: NDR["subjects"]): string => {
    return subjects
      .map((subject) => {
        const subjectName =
          typeof subject.id === "string"
            ? subject.id
            : subject.id.name || "Matière inconnue";
        return subjectName;
      })
      .join(", ");
  };

  const getDisplayValue = (client: Family, path: string) => {
    const keys = path.split(".");
    let value: any = client;

    // Naviguer dans l'objet selon le chemin (supporte n niveaux)
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) {
        value = "";
        break;
      }
    }

    // Gestion spéciale pour les tableaux (comme subjects)
    if (path === "demande.subjects" && Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "";
    }

    // Gestion spéciale pour plannedTeacher
    if (path === "plannedTeacher") {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (
        typeof value === "object" &&
        "firstName" in value &&
        "lastName" in value
      ) {
        return `${(value as any).firstName} ${(value as any).lastName}`;
      }
      return "";
    }

    // Gestion des dates - retourner format ISO pour input type="date"
    if (
      (path === "primaryContact.birthDate" ||
        path === "secondaryContact.birthDate") &&
      value
    ) {
      return value.split("T")[0]; // Format yyyy-MM-dd pour input date
    }

    return value || "";
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Chargement..."
          breadcrumb={[
            { label: "Clients", href: "/admin/clients" },
            { label: "Chargement..." },
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
        <PageHeader
          title="Erreur"
          breadcrumb={[
            { label: "Clients", href: "/admin/clients" },
            { label: "Erreur" },
          ]}
        />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-red-500">{error || "Client non trouvé"}</div>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/clients")}
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
        key: "email",
        label: "Email",
        field: "primaryContact.email",
        type: "email",
        placeholder: "email@exemple.com",
        required: true,
      },
      {
        key: "relation",
        label: "Civilité",
        field: "primaryContact.relation",
        type: "select",
        options: [
          { value: "père", label: "Père" },
          { value: "mère", label: "Mère" },
          { value: "tuteur", label: "Tuteur" },
        ],
        required: true,
      },
      {
        key: "street",
        label: "Rue",
        field: "primaryContact.address.street",
        type: "text",
        placeholder: "Adresse",
        required: true,
      },
      {
        key: "city",
        label: "Ville",
        field: "primaryContact.address.city",
        type: "text",
        placeholder: "Ville",
        required: true,
      },
      {
        key: "postalCode",
        label: "Code postal",
        field: "primaryContact.address.postalCode",
        type: "text",
        placeholder: "Code postal",
        required: true,
      },

      {
        key: "birthDate",
        label: "Date de naissance",
        field: "primaryContact.birthDate",
        type: "date",
        required: false,
      },
      {
        key: "relationship",
        label: "Relation",
        field: "primaryContact.relation",
        type: "text",
        placeholder: "Père, Mère, etc.",
        required: false,
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
        key: "relation",
        label: "Lien de parenté",
        field: "secondaryContact.relation",
        type: "select",
        required: false,
        options: [
          { value: "père", label: "Père" },
          { value: "mère", label: "Mère" },
          { value: "tuteur", label: "Tuteur légal" },
        ],
      },
      {
        key: "birthDate",
        label: "Date de naissance",
        field: "secondaryContact.birthDate",
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
    ],
  };

  return (
    <div>
      <PageHeader
        title={`Détails du client ${clientName}`}
        breadcrumb={[
          { label: "Clients", href: "/admin/clients" },
          { label: "Détails" },
        ]}
        description={`Créé le ${new Date(client.createdAt).toLocaleDateString(
          "fr-FR"
        )} • Dernière modification le ${new Date(
          client.updatedAt
        ).toLocaleDateString("fr-FR")}`}
        backButton={{ label: "Retour aux clients", href: "/admin/clients" }}
      />
      <Container layout="flex-col">
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
              // Séparer les données de contact et d'adresse
              const contactData = {
                firstName: data.firstName as string,
                lastName: data.lastName as string,
                primaryPhone: data.primaryPhone as string,
                email: data.email as string,
                relation: data.relation as string,
                secondaryPhone: (data.secondaryPhone as string) || null,
                address: {
                  street: data.street as string,
                  city: data.city as string,
                  postalCode: data.postalCode as string,
                },
              };

              // Un seul appel maintenant que l'adresse est dans primaryContact
              await familyService.updatePrimaryContact(clientId!, contactData);

              // Recharger les données depuis la base
              const updated = await familyService.getFamily(clientId!);
              setClient(updated);
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
              console.log("📝 data reçu depuis DataCard:", data);

              // Structure explicite pour secondaryContact
              const contactData = {
                firstName: data.firstName as string,
                lastName: data.lastName as string,
                phone: data.phone as string,
                email: data.email as string,
                relation: data.relation as string,
                birthDate: data.birthDate
                  ? new Date(data.birthDate as string)
                  : null,
              };

              console.log("📝 contactData construit:", contactData);

              // Appel à updateSecondaryContact
              await familyService.updateSecondaryContact(
                clientId!,
                contactData
              );

              // Recharger les données depuis la base
              const updated = await familyService.getFamily(clientId!);
              setClient(updated);
            }}
            className="client-details__section client-details__section--secondary-contact"
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
                billingAddress: {},
              };

              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.billingAddress.find(
                  (f) => f.key === key
                );
                if (field) {
                  const fieldParts = field.field.split(".");
                  if (fieldParts.length === 2) {
                    const [parent, child] = fieldParts;
                    updateData[parent][child] = value;
                  }
                }
              });

              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);

              // Recharger les données depuis la base
              const updated = await familyService.getFamily(clientId!);
              setClient(updated);
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
                  : "",
                type: "text" as const,
                required: false,
              },
              {
                key: "updatedAt",
                label: "Dernière modification",
                value: client.updatedAt
                  ? new Date(client.updatedAt).toLocaleDateString("fr-FR")
                  : "",
                type: "text" as const,
                required: false,
              },
            ]}
            onSave={async (data) => {
              // Construire l'objet de données pour l'API
              const updateData: any = {};

              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.commercial.find((f) => f.key === key);
                if (field && field.key !== "status") {
                  // Exclure les champs read-only
                  updateData[field.field] = value;
                }
              });

              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);

              // Recharger les données depuis la base
              const updated = await familyService.getFamily(clientId!);
              setClient(updated);
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
                companyInfo: {},
              };

              // Mapper les données du formulaire vers les champs de l'API
              Object.entries(data).forEach(([key, value]) => {
                const field = fieldConfig.companyInfo.find(
                  (f) => f.key === key
                );
                if (field) {
                  const fieldParts = field.field.split(".");
                  if (fieldParts.length === 2) {
                    const [parent, child] = fieldParts;
                    updateData[parent][child] = value;
                  }
                }
              });

              // Mettre à jour via l'API
              await familyService.updateFamily(clientId!, updateData);

              // Recharger les données depuis la base
              const updated = await familyService.getFamily(clientId!);
              setClient(updated);
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
                      render: (value, row: any) =>
                        typeof row === "string" ? row : value,
                    },
                    {
                      key: "lastName",
                      label: "Nom",
                      render: (value, row: any) =>
                        typeof row === "string" ? "" : value,
                    },
                    {
                      key: "birthDate",
                      label: "Né(e) le",
                      render: (value, row: any) => {
                        if (typeof row === "string") return "-";
                        return value
                          ? new Date(value).toLocaleDateString("fr-FR")
                          : "-";
                      },
                    },
                    {
                      key: "courseLocation",
                      label: "Lieu des cours",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        if (!row.courseLocation?.type) return "-";
                        return row.courseLocation.type === "domicile"
                          ? "À domicile"
                          : row.courseLocation.type === "professeur"
                          ? "Chez le professeur"
                          : "Autre";
                      },
                    },
                    {
                      key: "postalCode",
                      label: "Code postal",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        return row.courseLocation?.address?.postalCode || "-";
                      },
                    },
                    {
                      key: "city",
                      label: "Ville",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        return row.courseLocation?.address?.city || "-";
                      },
                    },
                    {
                      key: "phone",
                      label: "Tél",
                      render: (_, row: any) => {
                        if (typeof row === "string") return "-";
                        return row.contact?.phone || "-";
                      },
                    },
                    {
                      key: "availability",
                      label: "Disponibilités",
                      render: (value, row: any) => {
                        if (typeof row === "string") return "-";
                        return value || "-";
                      },
                    },
                    {
                      key: "comments",
                      label: "Com.",
                      render: (value, row: any) => {
                        if (typeof row === "string") return "-";
                        const comment = value || row.notes || "";
                        return comment.length > 30
                          ? `${comment.substring(0, 30)}...`
                          : comment || "-";
                      },
                    },
                    {
                      key: "settlementNoteIds",
                      label: "NDR",
                      render: (_, row: any) => (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                          {row.settlementNoteIds?.length || 0}
                        </span>
                      ),
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
                              const studentName =
                                typeof row === "string"
                                  ? row
                                  : `${row.firstName} ${row.lastName}`;
                              if (
                                window.confirm(
                                  `Êtes-vous sûr de vouloir supprimer l'élève ${studentName} ?`
                                )
                              ) {
                                // TODO: Implémenter suppression élève
                                console.log("Suppression élève:", row);
                              }
                            }}
                            title="Supprimer l'élève"
                          >
                            ✕
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  data={client.students.map((student, index) => ({
                    ...(typeof student === "string"
                      ? {
                          firstName: student,
                          lastName: "",
                          id: `string-${index}`,
                        }
                      : {
                          ...student,
                          id: student.id || `student-${index}`,
                        }),
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
                  <div className="text-gray-500">
                    Chargement des notes de règlement...
                  </div>
                </div>
              ) : settlementNotes && settlementNotes.length > 0 ? (
                <Table
                  columns={[
                    {
                      key: "createdAt",
                      label: "Date création",
                      render: (value) =>
                        new Date(value).toLocaleDateString("fr-FR"),
                    },
                    {
                      key: "status",
                      label: "Statut",
                      render: (value) => getStatusBadge(value),
                    },
                    {
                      key: "totalAmount",
                      label: "Montant total",
                      render: (_, row: NDR) =>
                        `${calculateTotalAmount(row).toFixed(2)} €`,
                    },
                    {
                      key: "subjects",
                      label: "Matières",
                      render: (value) => {
                        const display = formatSubjectsDisplay(value);
                        return display.length > 50
                          ? `${display.substring(0, 50)}...`
                          : display;
                      },
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (_, row: NDR) => (
                        <div className="table__actions">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              navigate(`/admin/settlement-details/${row._id}`)
                            }
                            title="Voir les détails"
                          >
                            👁️
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/admin/settlement-details/${row._id}?mode=edit`
                              )
                            }
                            title="Modifier"
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Êtes-vous sûr de vouloir supprimer cette note de règlement ?`
                                )
                              ) {
                                // TODO: Implémenter suppression NDR avec refetch
                                console.log("Suppression NDR:", row._id);
                              }
                            }}
                            title="Supprimer"
                          >
                            ✕
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  data={settlementNotes.map((note) => ({
                    ...note,
                    id: note._id,
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
                  onClick={() =>
                    navigate(`/admin/create-settlement?familyId=${client?._id}`)
                  }
                >
                  Nouvelle note de règlement
                </Button>
              </div>
            </div>
          </DataCard>
        </div>
      </Container>

      {/* Modal ajout d'élève */}
      <Modal
        type="student"
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        data={{ familyId: client?._id || "" }}
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
