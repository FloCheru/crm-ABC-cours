import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  Button,
  ButtonGroup,
  DataCard,
  PageHeader,
  Container,
} from "../../components";
import type { Teacher } from "../../types/teacher";

export const ProfesseurDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer l'ID depuis localStorage
  const teacherId = localStorage.getItem("teacherId");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string>("");

  // Charger les données du professeur au montage du composant
  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
    } else {
      setError("ID de professeur manquant");
      setIsLoading(false);
    }
  }, [teacherId]);

  // Charger les données du professeur
  const loadTeacherData = async () => {
    try {
      setIsLoading(true);
      // TODO: Remplacer par un appel API réel quand le backend sera prêt
      // const teacherData = await teacherService.getTeacher(teacherId!);

      // Données mockées pour le moment
      const mockTeacher: Teacher = {
        _id: teacherId!,
        // Section Identité
        gender: "Mme",
        firstName: "Marie",
        lastName: "Dupont",
        birthName: "",
        birthDate: "1990-05-15",
        socialSecurityNumber: "",
        birthCountry: "France",
        // Section Coordonnées
        email: "marie.dupont@email.com",
        phone: "0123456789",
        secondaryPhone: "",
        address: "",
        addressComplement: "",
        postalCode: "75001",
        city: "Paris",
        inseeCity: "",
        distributionOffice: "",
        transportMode: "voiture",
        courseLocation: "domicile",
        secondaryAddress: "",
        // Section CV
        experience: "",
        certifications: "",
        miscellaneous: "",
        disabilityKnowledge: [],
        additionalNotes: "",
        // Section Situation actuelle
        currentSituation: [],
        // Champs système
        identifier: "MarieDupont",
        notifyEmail: "marie.dupont.notif@email.com",
        createdAt: new Date("2024-01-15").toISOString(),
        updatedAt: new Date("2024-03-10").toISOString(),
      };

      setTeacher(mockTeacher);
    } catch (err) {
      console.error("Erreur lors du chargement du professeur:", err);
      setError("Impossible de charger les détails du professeur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/professeurs");
  };

  // Redirection si pas d'ID de professeur dans localStorage
  React.useEffect(() => {
    if (!teacherId) {
      navigate("/professeurs", { replace: true });
    }
  }, [teacherId, navigate]);

  // Affichage de chargement
  if (isLoading) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <PageHeader
          title="Chargement..."
          breadcrumb={[
            { label: "Professeurs", href: "/professeurs" },
            { label: "Chargement..." },
          ]}
        />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-gray-500">
              Chargement des détails du professeur...
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Redirection si pas de professeur après chargement
  if (!teacherId || !teacher) {
    return null; // Le useEffect va gérer la redirection
  }

  return (
    <main>
      <Navbar activePath="/professeurs" />
      <PageHeader
        title="Détails du Professeur"
        breadcrumb={[
          { label: "Professeurs", href: "/professeurs" },
          { label: "Détails" },
        ]}
        description={
          teacher
            ? `Créé le ${new Date(teacher.createdAt).toLocaleDateString(
                "fr-FR"
              )}${
                teacher.updatedAt
                  ? ` • Modifié le ${new Date(teacher.updatedAt).toLocaleDateString(
                      "fr-FR"
                    )}`
                  : ""
              }`
            : undefined
        }
        backButton={{
          label: "Retour au tableau des professeurs",
          href: "/professeurs",
        }}
      />

      <main className="space-y-8">
        {/* Section Identité */}
        <DataCard
          title="Identité"
          fields={[
            {
              key: "gender",
              label: "Genre",
              value: teacher.gender,
              type: "select",
              required: true,
              options: [
                { value: "M.", label: "M." },
                { value: "Mme", label: "Mme" },
              ],
            },
            {
              key: "firstName",
              label: "Prénom",
              value: teacher.firstName,
              type: "text",
              required: true,
              placeholder: "Prénom",
            },
            {
              key: "lastName",
              label: "Nom",
              value: teacher.lastName,
              type: "text",
              required: true,
              placeholder: "Nom",
            },
            {
              key: "birthName",
              label: "Nom de naissance (si différent du nom)",
              value: teacher.birthName || "",
              type: "text",
              required: false,
              placeholder: "Nom de naissance",
            },
            {
              key: "birthDate",
              label: "Date de naissance",
              value: teacher.birthDate,
              type: "date",
              required: true,
            },
            {
              key: "socialSecurityNumber",
              label: "N° de sécurité sociale",
              value: teacher.socialSecurityNumber || "",
              type: "text",
              required: false,
              placeholder: "1 90 05 75 001 234 56",
            },
            {
              key: "birthCountry",
              label: "Pays de naissance",
              value: teacher.birthCountry || "",
              type: "text",
              required: false,
              placeholder: "France",
            },
          ]}
          onSave={async (data) => {
            console.log("Données à sauvegarder:", data);
            setTeacher((prev) => (prev ? { ...prev, ...data } : prev));
          }}
          className="mb-8"
        />

        {/* Section Coordonnées */}
        <DataCard
          title="Coordonnées"
          fields={[
            {
              key: "email",
              label: "Email",
              value: teacher.email,
              type: "email",
              required: true,
              placeholder: "email@exemple.com",
            },
            {
              key: "phone",
              label: "Tél principal",
              value: teacher.phone,
              type: "tel",
              required: true,
              placeholder: "06 12 34 56 78",
            },
            {
              key: "secondaryPhone",
              label: "Tél secondaire",
              value: teacher.secondaryPhone || "",
              type: "tel",
              required: false,
              placeholder: "06 12 34 56 78",
            },
            {
              key: "address",
              label: "Adresse",
              value: teacher.address || "",
              type: "text",
              required: false,
              placeholder: "12 rue de la République",
            },
            {
              key: "addressComplement",
              label: "Complément d'adresse",
              value: teacher.addressComplement || "",
              type: "text",
              required: false,
              placeholder: "Bâtiment A, Appartement 12",
            },
            {
              key: "postalCode",
              label: "Code postal",
              value: teacher.postalCode,
              type: "text",
              required: true,
              placeholder: "75001",
            },
            {
              key: "city",
              label: "Commune",
              value: teacher.city || "",
              type: "text",
              required: false,
              placeholder: "Paris",
            },
            {
              key: "inseeCity",
              label: "Commune INSEE",
              value: teacher.inseeCity || "",
              type: "text",
              required: false,
              placeholder: "75101",
            },
            {
              key: "distributionOffice",
              label: "Bureau distributeur (si différent de la commune)",
              value: teacher.distributionOffice || "",
              type: "text",
              required: false,
              placeholder: "Paris Cedex",
            },
            {
              key: "transportMode",
              label: "Déplacement",
              value: teacher.transportMode || "",
              type: "select",
              required: false,
              options: [
                { value: "", label: "Sélectionner..." },
                { value: "voiture", label: "Voiture" },
                { value: "vélo", label: "Vélo" },
                { value: "transports", label: "Transports en commun" },
                { value: "moto", label: "Moto" },
              ],
            },
            {
              key: "courseLocation",
              label: "Cours",
              value: teacher.courseLocation || "",
              type: "select",
              required: false,
              options: [
                { value: "", label: "Sélectionner..." },
                { value: "domicile", label: "À domicile" },
                { value: "visio", label: "En visio" },
              ],
            },
            {
              key: "secondaryAddress",
              label: "Adresse secondaire",
              value: teacher.secondaryAddress || "",
              type: "text",
              required: false,
              placeholder: "Adresse secondaire complète",
            },
          ]}
          onSave={async (data) => {
            console.log("Données à sauvegarder:", data);
            setTeacher((prev) => (prev ? { ...prev, ...data } : prev));
          }}
          className="mb-8"
        />

        {/* Section CV */}
        <DataCard
          title="CV"
          fields={[
            {
              key: "experience",
              label: "Expérience",
              value: teacher.experience || "",
              type: "textarea",
              required: false,
              placeholder: "Décrivez votre expérience professionnelle...",
            },
            {
              key: "certifications",
              label: "Formation / Certifications",
              value: teacher.certifications || "",
              type: "textarea",
              required: false,
              placeholder: "Diplômes, certifications, formations...",
            },
            {
              key: "miscellaneous",
              label: "Divers",
              value: teacher.miscellaneous || "",
              type: "textarea",
              required: false,
              placeholder: "Informations complémentaires...",
            },
            {
              key: "disabilityKnowledge",
              label: "Connaissance du public en situation de handicap",
              value: teacher.disabilityKnowledge?.join(", ") || "",
              type: "text",
              required: false,
              placeholder: "Ex: dys, autisme (séparés par des virgules)",
            },
            {
              key: "additionalNotes",
              label: "Ce que je juge bon de signaler",
              value: teacher.additionalNotes || "",
              type: "textarea",
              required: false,
              placeholder: "Informations que vous souhaitez signaler...",
            },
          ]}
          onSave={async (data) => {
            // Traiter disabilityKnowledge comme un tableau
            if (data.disabilityKnowledge && typeof data.disabilityKnowledge === "string") {
              data.disabilityKnowledge = data.disabilityKnowledge
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
            }
            console.log("Données à sauvegarder:", data);
            setTeacher((prev) => (prev ? { ...prev, ...data } : prev));
          }}
          className="mb-8"
        />

        {/* Section Situation actuelle */}
        <DataCard
          title="Situation actuelle"
          fields={[
            {
              key: "currentSituation",
              label: "Merci de cocher les cases correspondant à votre situation actuelle",
              value: teacher.currentSituation?.join(", ") || "",
              type: "text",
              required: false,
              placeholder: "Ex: enseignant_education_nationale, etudiant (séparés par des virgules)",
            },
          ]}
          onSave={async (data) => {
            // Traiter currentSituation comme un tableau
            if (data.currentSituation && typeof data.currentSituation === "string") {
              data.currentSituation = data.currentSituation
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
            }
            console.log("Données à sauvegarder:", data);
            setTeacher((prev) => (prev ? { ...prev, ...data } : prev));
          }}
          className="mb-8"
        />
      </main>

      {/* Actions */}
      <div className="mt-8">
        <ButtonGroup
          variant="single"
          buttons={[
            {
              text: "Retour à la liste",
              variant: "outline",
              onClick: handleBack,
            },
          ]}
        />
      </div>
    </main>
  );
};
