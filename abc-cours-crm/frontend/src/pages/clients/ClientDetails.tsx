import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  Button,
} from "../../components";
import { familyService } from "../../services/familyService";
import type { Family } from "../../types/family";
import "./ClientDetails.css";

export const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [client, setClient] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Charger les détails du client
  useEffect(() => {
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
        
        console.log(`✅ Client chargé: ${clientData.primaryContact.firstName} ${clientData.primaryContact.lastName}`);
        
      } catch (err) {
        console.error("Erreur lors du chargement des détails client:", err);
        setError("Impossible de charger les détails du client");
      } finally {
        setIsLoading(false);
      }
    };

    loadClientDetails();
  }, [clientId]);


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
            <div className="text-gray-500">Chargement des détails du client...</div>
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
          <h1>Détails du client</h1>
          <div className="client-details-actions">
            <Button
              variant="outline"
              onClick={() => navigate("/clients")}
            >
              ← Retour à la liste
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
          <Container layout="flex-col" className="client-details__section client-details__section--primary-contact">
            <h2>Contact principal</h2>
            <div className="client-details__grid">
              <div className="client-details__field">
                <label>Civilité</label>
                <p>{client.primaryContact.gender || "Non renseignée"}</p>
              </div>
              <div className="client-details__field">
                <label>Nom complet</label>
                <p>{clientName}</p>
              </div>
              <div className="client-details__field">
                <label>Email</label>
                <p>{client.primaryContact.email || "Non renseigné"}</p>
              </div>
              <div className="client-details__field">
                <label>Téléphone principal</label>
                <p>{client.primaryContact.primaryPhone || "Non renseigné"}</p>
              </div>
              <div className="client-details__field">
                <label>Téléphone secondaire</label>
                <p>{client.primaryContact.secondaryPhone || "Non renseigné"}</p>
              </div>
              <div className="client-details__field">
                <label>Date de naissance</label>
                <p>{client.primaryContact.dateOfBirth ? new Date(client.primaryContact.dateOfBirth).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
              </div>
              <div className="client-details__field">
                <label>Relation</label>
                <p>{client.primaryContact.relationship || "Contact principal"}</p>
              </div>
            </div>
          </Container>

          {/* Contact secondaire */}
          {client.secondaryContact && (client.secondaryContact.firstName || client.secondaryContact.lastName) ? (
            <Container layout="flex-col" className="client-details__section client-details__section--secondary-contact">
              <h2>Contact secondaire</h2>
              <div className="client-details__grid">
                <div className="client-details__field">
                  <label>Nom complet</label>
                  <p>{`${client.secondaryContact.firstName || ""} ${client.secondaryContact.lastName || ""}`.trim() || "Non renseigné"}</p>
                </div>
                <div className="client-details__field">
                  <label>Email</label>
                  <p>{client.secondaryContact.email || "Non renseigné"}</p>
                </div>
                <div className="client-details__field">
                  <label>Téléphone</label>
                  <p>{client.secondaryContact.phone || "Non renseigné"}</p>
                </div>
                <div className="client-details__field">
                  <label>Relation</label>
                  <p>{client.secondaryContact.relationship || "Contact secondaire"}</p>
                </div>
                <div className="client-details__field">
                  <label>Date de naissance</label>
                  <p>{client.secondaryContact.dateOfBirth ? new Date(client.secondaryContact.dateOfBirth).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
                </div>
              </div>
            </Container>
          ) : null}

          {/* Adresse principale */}
          <Container layout="flex-col" className="client-details__section client-details__section--address">
            <h2>Adresse principale</h2>
            <div className="client-details__grid">
              <div className="client-details__field">
                <label>Rue</label>
                <p>{client.address.street || "Non renseignée"}</p>
              </div>
              <div className="client-details__field">
                <label>Ville</label>
                <p>{client.address.city || "Non renseignée"}</p>
              </div>
              <div className="client-details__field">
                <label>Code postal</label>
                <p>{client.address.postalCode || "Non renseigné"}</p>
              </div>
              <div className="client-details__field">
                <label>Adresse complète</label>
                <p>{client.address.street && client.address.city && client.address.postalCode ? `${client.address.street}, ${client.address.postalCode} ${client.address.city}` : "Non renseignée"}</p>
              </div>
            </div>
          </Container>

          {/* Adresse de facturation */}
          {client.billingAddress && (client.billingAddress.street || client.billingAddress.city || client.billingAddress.postalCode) ? (
            <Container layout="flex-col" className="client-details__section client-details__section--billing-address">
              <h2>Adresse de facturation</h2>
              <div className="client-details__grid">
                <div className="client-details__field">
                  <label>Rue</label>
                  <p>{client.billingAddress.street || "Non renseignée"}</p>
                </div>
                <div className="client-details__field">
                  <label>Ville</label>
                  <p>{client.billingAddress.city || "Non renseignée"}</p>
                </div>
                <div className="client-details__field">
                  <label>Code postal</label>
                  <p>{client.billingAddress.postalCode || "Non renseigné"}</p>
                </div>
                <div className="client-details__field">
                  <label>Adresse complète</label>
                  <p>{client.billingAddress.street && client.billingAddress.city && client.billingAddress.postalCode ? `${client.billingAddress.street}, ${client.billingAddress.postalCode} ${client.billingAddress.city}` : "Non renseignée"}</p>
                </div>
              </div>
            </Container>
          ) : null}

          {/* Informations commerciales */}
          <Container layout="flex-col" className="client-details__section client-details__section--commercial">
            <h2>Informations commerciales</h2>
            <div className="client-details__grid">
              <div className="client-details__field">
                <label>Statut</label>
                <p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    client.status === "client" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {client.status === "client" ? "Client" : "Prospect"}
                  </span>
                </p>
              </div>
              <div className="client-details__field">
                <label>Source d'acquisition</label>
                <p>{client.source || "Non renseignée"}</p>
              </div>
              <div className="client-details__field">
                <label>Professeur planifié</label>
                <p>{client.plannedTeacher || "Non assigné"}</p>
              </div>
              <div className="client-details__field">
                <label>Date de création</label>
                <p>{client.createdAt ? new Date(client.createdAt).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
              </div>
              <div className="client-details__field">
                <label>Dernière modification</label>
                <p>{client.updatedAt ? new Date(client.updatedAt).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
              </div>
            </div>
            {client.notes && (
              <div className="client-details__field mt-3">
                <label>Notes générales</label>
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </Container>

          {/* Demande de cours */}
          {client.demande && (
            <Container layout="flex-col" className="client-details__section client-details__section--course-request">
              <h2>Demande de cours</h2>
              <div className="client-details__grid">
                <div className="client-details__field">
                  <label>Type de bénéficiaire</label>
                  <p>{client.demande.beneficiaryType === "adulte" ? "Adulte" : client.demande.beneficiaryType === "eleves" ? "Élèves" : "Non précisé"}</p>
                </div>
                <div className="client-details__field">
                  <label>Matières demandées</label>
                  <p>{client.demande.subjects && client.demande.subjects.length > 0 ? client.demande.subjects.join(", ") : "Non précisées"}</p>
                </div>
              </div>
              {client.demande.notes && (
                <div className="client-details__field mt-3">
                  <label>Notes sur la demande</label>
                  <p className="text-sm">{client.demande.notes}</p>
                </div>
              )}
            </Container>
          )}

          {/* Informations entreprise */}
          {client.companyInfo && (client.companyInfo.urssafNumber || client.companyInfo.siretNumber || client.companyInfo.ceNumber) ? (
            <Container layout="flex-col" className="client-details__section client-details__section--company">
              <h2>Informations entreprise</h2>
              <div className="client-details__grid">
                <div className="client-details__field">
                  <label>Numéro URSSAF</label>
                  <p>{client.companyInfo.urssafNumber || "Non renseigné"}</p>
                </div>
                <div className="client-details__field">
                  <label>Numéro SIRET</label>
                  <p>{client.companyInfo.siretNumber || "Non renseigné"}</p>
                </div>
                <div className="client-details__field">
                  <label>Numéro CE</label>
                  <p>{client.companyInfo.ceNumber || "Non renseigné"}</p>
                </div>
              </div>
            </Container>
          ) : null}

          {/* Élèves - Section complète repositionnée plus bas */}
          <Container layout="flex-col" className="client-details__section client-details__section--students">
            <h2>Élèves ({client.students?.length || 0})</h2>
            {client.students && client.students.length > 0 ? (
              <div className="client-details__students">
                {client.students.map((student, index) => {
                  if (typeof student === "string") {
                    return (
                      <div key={index} className="client-details__student">
                        <h3>{student}</h3>
                        <p className="text-gray-500">Informations détaillées non disponibles</p>
                      </div>
                    );
                  }
                  
                  // Calculer l'âge si date de naissance disponible
                  const getAge = (dateOfBirth: string | Date | undefined) => {
                    if (!dateOfBirth) return null;
                    const today = new Date();
                    const birthDate = new Date(dateOfBirth);
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    return age;
                  };
                  
                  const age = getAge(student.dateOfBirth);
                  
                  return (
                    <div key={index} className="client-details__student">
                      <h3>{student.firstName} {student.lastName}</h3>
                      <div className="client-details__student-info">
                        <div className="client-details__grid">
                          <div className="client-details__field">
                            <label>Âge</label>
                            <p>{age ? `${age} ans` : "Non renseigné"}</p>
                          </div>
                          <div className="client-details__field">
                            <label>Date de naissance</label>
                            <p>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
                          </div>
                          <div className="client-details__field">
                            <label>Établissement</label>
                            <p>{student.school?.name || "Non renseigné"}</p>
                          </div>
                          <div className="client-details__field">
                            <label>Niveau scolaire</label>
                            <p>{student.school ? `${student.school.level || ""} - ${student.school.grade || ""}`.trim().replace(/^- /, '') || "Non renseigné" : "Non renseigné"}</p>
                          </div>
                          <div className="client-details__field">
                            <label>Lieu des cours</label>
                            <p>
                              {student.courseLocation?.type === "domicile" ? "À domicile" : 
                               student.courseLocation?.type === "professeur" ? "Chez le professeur" :
                               student.courseLocation?.type === "autre" ? `Autre: ${student.courseLocation.otherDetails || "Détails non précisés"}` :
                               "Non renseigné"}
                            </p>
                          </div>
                          <div className="client-details__field">
                            <label>Contact direct</label>
                            <p>
                              {student.contact?.phone || student.contact?.email ? 
                                `${student.contact.phone || ""} ${student.contact.email ? `(${student.contact.email})` : ""}`.trim() :
                                "Non renseigné"}
                            </p>
                          </div>
                          <div className="client-details__field">
                            <label>Disponibilités</label>
                            <p>{student.availability || "Non renseignées"}</p>
                          </div>
                          <div className="client-details__field">
                            <label>Statut</label>
                            <p>
                              <span className={`px-2 py-1 rounded text-xs ${
                                student.status === "active" ? "bg-green-100 text-green-800" :
                                student.status === "inactive" ? "bg-red-100 text-red-800" :
                                student.status === "graduated" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {student.status === "active" ? "Actif" :
                                 student.status === "inactive" ? "Inactif" :
                                 student.status === "graduated" ? "Diplômé" :
                                 student.status || "Non défini"}
                              </span>
                            </p>
                          </div>
                        </div>
                        {student.comments && (
                          <div className="client-details__field mt-3">
                            <label>Commentaires</label>
                            <p className="text-sm">{student.comments}</p>
                          </div>
                        )}
                        {student.notes && (
                          <div className="client-details__field mt-3">
                            <label>Notes</label>
                            <p className="text-sm">{student.notes}</p>
                          </div>
                        )}
                        {(student.medicalInfo?.allergies?.length || 
                          student.medicalInfo?.conditions?.length || 
                          student.medicalInfo?.medications?.length || 
                          student.medicalInfo?.emergencyContact?.name) && (
                          <div className="client-details__field mt-3">
                            <label>Informations médicales</label>
                            <div className="text-sm space-y-1">
                              {student.medicalInfo.allergies?.length > 0 && (
                                <p><strong>Allergies:</strong> {student.medicalInfo.allergies.join(", ")}</p>
                              )}
                              {student.medicalInfo.conditions?.length > 0 && (
                                <p><strong>Conditions:</strong> {student.medicalInfo.conditions.join(", ")}</p>
                              )}
                              {student.medicalInfo.medications?.length > 0 && (
                                <p><strong>Médicaments:</strong> {student.medicalInfo.medications.join(", ")}</p>
                              )}
                              {student.medicalInfo.emergencyContact?.name && (
                                <p><strong>Contact d'urgence:</strong> {student.medicalInfo.emergencyContact.name} 
                                   {student.medicalInfo.emergencyContact.phone && `(${student.medicalInfo.emergencyContact.phone})`}
                                   {student.medicalInfo.emergencyContact.relationship && ` - ${student.medicalInfo.emergencyContact.relationship}`}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Aucun élève enregistré</p>
              </div>
            )}
          </Container>
        </div>

      </Container>
    </div>
  );
};