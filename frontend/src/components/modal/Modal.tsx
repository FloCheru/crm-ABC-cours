import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  DataCard,
  Container,
  PageHeader,
} from "../../components";
import { familyService } from "../../services/familyService";
import rdvService from "../../services/rdvService";
import { adminService, type Admin } from "../../services/adminService";
import { professorService } from "../../services/professorService";
import { usePrefillTest } from "../../hooks/usePrefillTest";
import { toast } from "sonner";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "student" | "rdv" | "teacher" | "family";
  data?: any;
  onSuccess?: () => void;
  mode?: "edit" | "view";
  // Props RDV
  onSubmit?: (data: any) => void;
  isEditing?: boolean;
  loading?: boolean;
  // Props Student
  onAddStudentTest?: (familyId: string) => Promise<void>;
  // Props Family
  onCreateTestProspect?: () => Promise<void>;
}

// Configuration des handlers par type d'entité
const ENTITY_HANDLERS = {
  student: {
    prepareData: (formData: any, data: any) => {
      // Récupérer sameAsFamily directement des données existantes
      const sameAsFamily = data?.courseLocation?.usesFamilyAddress || false;
      const preparedData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate,
        school: {
          name: formData.schoolName.trim(),
          grade: formData.grade,
        },
        contact: {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        },
        courseLocation: {
          type: formData.courseLocation as "domicile" | "professeur" | "autre",
          usesFamilyAddress: sameAsFamily,
          address: sameAsFamily
            ? undefined
            : {
                street: formData.studentStreet.trim(),
                city: formData.studentCity.trim(),
                postalCode: formData.studentPostalCode.trim(),
              },
        },
        availability: "",
        comments: formData.notes.trim() || "",
        notes: formData.notes.trim() || undefined,
        familyId: data.familyId,
      };

      return preparedData;
    },
    update: async (studentId: string, preparedData: any, familyId: string) => {
      return await familyService.updateStudent(
        familyId,
        studentId,
        preparedData
      );
    },
    create: async (familyId: string, preparedData: any) => {
      return await familyService.addStudent(familyId, preparedData);
    },
    logs: {
      entityName: "ÉLÈVE",
      updateStart: "🔄 DÉBUT MODIFICATION ÉLÈVE",
      createStart: "➕ AJOUT NOUVEL ÉLÈVE",
    },
  },
  rdv: {
    prepareData: (formData: any, data: any) => {
      // Déterminer le type de RDV et préparer les données en conséquence
      const baseData = {
        date: formData.date,
        time: formData.time,
        type: formData.type as "physique" | "virtuel",
        notes: formData.notes,
      };

      // Sécuriser l'accès à data (peut être undefined)
      const safeData = data || {};

      // Contexte famille (existant)
      // Vérifier que familyId existe ET n'est pas une chaîne vide
      if (safeData.familyId && safeData.familyId.trim() !== "") {
        return {
          ...baseData,
          familyId: safeData.familyId,
          assignedAdminId: formData.assignedAdminId,
          entityType: "admin-family" as const,
        };
      }

      // Contexte professeur (admin <-> professeur)
      if (safeData.professorId && formData.assignedAdminId) {
        return {
          ...baseData,
          professorId: safeData.professorId,
          assignedAdminId: formData.assignedAdminId,
          entityType: "admin-professor" as const,
        };
      }

      // Contexte professeur-élève
      if (safeData.professorId && formData.studentId) {
        return {
          ...baseData,
          professorId: safeData.professorId,
          studentId: formData.studentId,
          entityType: "professor-student" as const,
        };
      }

      // Fallback : valider qu'on a au moins un ID
      console.error("❌ [RDV prepareData] Aucun contexte valide détecté", {
        data: safeData,
        formData,
      });

      // Si on arrive ici, c'est qu'il manque des données critiques
      throw new Error(
        "Impossible de créer le RDV : informations de contexte manquantes (familyId, professorId ou studentId requis)"
      );
    },
    update: async (rdvId: string, preparedData: any, _familyId: string) => {
      return await rdvService.updateRdvById(rdvId, {
        ...preparedData,
        familyId: preparedData.familyId || _familyId,
      });
    },
    create: async (
      _familyId: string,
      preparedData: any,
      _adminsData?: any[]
    ) => {
      // S'assurer que familyId est présent si c'est un RDV admin-family
      if (preparedData.entityType === "admin-family" && !preparedData.familyId && _familyId) {
        preparedData.familyId = _familyId;
      }
      return await rdvService.createRdv(preparedData);
    },
    logs: {
      entityName: "RDV",
      updateStart: "🔄 DÉBUT MODIFICATION RDV",
      createStart: "➕ AJOUT NOUVEAU RDV",
    },
  },
  teacher: {
    prepareData: (formData: any, _data: any) => {
      console.log("[TEACHER PREPARE] 📝 Données du formulaire reçues:", formData);

      const prepared = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        postalCode: formData.postalCode.trim(),
        identifier: formData.identifier,
        notifyEmail: formData.notifyEmail?.trim() || "",
      };

      console.log("[TEACHER PREPARE] ✅ Données nettoyées et préparées:", prepared);
      return prepared;
    },
    update: async (professorId: string, preparedData: any) => {
      // TODO: Implémenter teacherService.updateTeacher quand le backend sera prêt
      console.log("Update teacher:", professorId, preparedData);
      return Promise.resolve(preparedData);
    },
    create: async (_: string, preparedData: any) => {
      console.log("[TEACHER CREATE] 📊 Données prêtes pour création:", preparedData);

      try {
        console.log("[TEACHER CREATE] 🚀 Appel API: professorService.createProfessor()");
        const result = await professorService.createProfessor(preparedData);
        console.log("[TEACHER CREATE] ✅ Professeur créé avec succès en DB:", result);
        return result;
      } catch (error) {
        console.error("[TEACHER CREATE] ❌ Erreur lors de la création:", error);
        throw error;
      }
    },
    logs: {
      entityName: "PROFESSEUR",
      updateStart: "🔄 DÉBUT MODIFICATION PROFESSEUR",
      createStart: "➕ AJOUT NOUVEAU PROFESSEUR",
    },
  },
  family: {
    prepareData: (formData: any, _data: any) => {
      // Parser les matières (texte → Array<{ id: string }>)
      let subjects: Array<{ id: string }> = [];
      if (formData.demandeSubjects && typeof formData.demandeSubjects === "string") {
        subjects = formData.demandeSubjects
          .split(",")
          .map((subject: string) => subject.trim())
          .filter((subject: string) => subject.length > 0)
          .map((subject: string) => ({ id: subject }));
      }

      const preparedData = {
        notes: formData.familyNotes?.trim() || "",
        primaryContact: {
          firstName: formData.primaryFirstName?.trim() || "",
          lastName: formData.primaryLastName?.trim() || "",
          primaryPhone: formData.primaryPhone?.trim() || "",
          secondaryPhone: formData.primarySecondaryPhone?.trim() || "",
          email: formData.primaryEmail?.trim() || "",
          birthDate: formData.primaryBirthDate || undefined,
          relation: formData.primaryRelation || "père",
        },
        address: {
          street: formData.addressStreet?.trim() || "",
          city: formData.addressCity?.trim() || "",
          postalCode: formData.addressPostalCode?.trim() || "",
        },
        ...(formData.secondaryFirstName || formData.secondaryLastName ? {
          secondaryContact: {
            firstName: formData.secondaryFirstName?.trim() || "",
            lastName: formData.secondaryLastName?.trim() || "",
            phone: formData.secondaryPhone?.trim() || "",
            email: formData.secondaryEmail?.trim() || "",
            relation: formData.secondaryRelation || "père",
            birthDate: formData.secondaryBirthDate || undefined,
          },
        } : {}),
        ...(!formData.sameAsPrimaryAddress ? {
          billingAddress: {
            street: formData.billingStreet?.trim() || "",
            city: formData.billingCity?.trim() || "",
            postalCode: formData.billingPostalCode?.trim() || "",
          },
        } : {}),
        demande: {
          beneficiaryType: formData.beneficiaryType as "adulte" | "eleves",
          grade: formData.beneficiaryGrade || "",
          subjects: subjects,
          notes: formData.demandeNotes?.trim() || "",
        },
        plannedTeacher: formData.plannedTeacher?.trim() || "",
        status: "prospect" as const,
      };

      return preparedData;
    },
    update: async (familyId: string, preparedData: any) => {
      // Les prospects ne sont pas modifiés via ce modal
      console.log("Update family (not implemented):", familyId, preparedData);
      return Promise.resolve(preparedData);
    },
    create: async (_familyId: string, preparedData: any) => {
      return await familyService.createFamily(preparedData);
    },
    logs: {
      entityName: "PROSPECT",
      updateStart: "🔄 DÉBUT MODIFICATION PROSPECT",
      createStart: "➕ AJOUT NOUVEAU PROSPECT",
    },
  },
};

// Mapping des titres selon type, data et mode
const TITLE_MAP = {
  student: {
    create: "Nouvel élève", // !data → edit mode
    view: "Détails élève", // data + view mode
    edit: "Modifier élève", // data + edit mode
  },
  rdv: {
    create: "Nouveau rendez-vous", // !data → edit mode
    view: "Détails RDV", // data + view mode
    edit: "Modifier RDV", // data + edit mode
  },
  teacher: {
    create: "Nouveau professeur",
    view: "Détails professeur",
    edit: "Modifier professeur",
  },
  family: {
    create: "Nouveau prospect",
    view: "Détails prospect",
    edit: "Modifier prospect",
  },
} as const;

// Fonction de génération du titre
const getModalTitle = (
  type: "student" | "rdv" | "teacher" | "family",
  data?: any,
  currentMode?: "view" | "edit"
): string => {
  // Cas 1 : Pas d'entityId = création (forcément edit)
  const entityId = data?.studentId || data?.rdvId || data?.professorId;
  if (!entityId) {
    return TITLE_MAP[type].create;
  }

  // Cas 2 & 3 : EntityId présent = détails ou modification
  const mode = currentMode || "view"; // view par défaut
  return TITLE_MAP[type][mode];
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  onSuccess,
  mode = "edit",
  onAddStudentTest,
  onCreateTestProspect,
}) => {
  // Hook pour les données de test de préremplissage
  const { studentTestData, rdvTestData, professorTestData } = usePrefillTest();

  // Nouvelle logique de détection création vs modification
  const entityId = data?.studentId || data?.rdvId || data?.professorId;
  const familyId = data?.familyId;
  // Configuration des champs par type
  const MODAL_CONFIG = {
    student: {
      sections: [
        {
          title: "Identité de l'élève",
          fields: [
            {
              key: "firstName",
              label: "Prénom",
              type: "text",
              required: true,
            },
            {
              key: "lastName",
              label: "Nom",
              type: "text",
              required: true,
            },
            { key: "birthDate", label: "Date de naissance", type: "date" },
          ],
        },
        {
          title: "Adresse de l'élève",
          fields: [
            {
              key: "sameAsFamily",
              label: "Utiliser l'adresse de la famille",
              type: "checkbox",
            },
            {
              key: "studentStreet",
              label: "Rue",
              type: "text",
              placeholder: "Rue de l'élève",
              conditional: "sameAsFamily",
              conditionValue: true,
            },
            {
              key: "studentPostalCode",
              label: "Code postal",
              type: "text",
              placeholder: "Code postal",
              conditional: "sameAsFamily",
              conditionValue: true,
            },
            {
              key: "studentCity",
              label: "Ville",
              type: "text",
              placeholder: "Ville",
              conditional: "sameAsFamily",
              conditionValue: true,
            },
          ],
        },
        {
          title: "École",
          fields: [
            {
              key: "grade",
              label: "Classe",
              type: "text",
            },
            {
              key: "schoolName",
              label: "Nom de l'école",
              type: "text",
            },
            {
              key: "schoolAddress",
              label: "Adresse de l'école",
              type: "text",
            },
            {
              key: "courseLocation",
              label: "Lieu des cours",
              type: "select",
              options: [
                { value: "domicile", label: "Domicile" },
                { value: "professeur", label: "Chez le professeur" },
                { value: "autre", label: "Lieu neutre" },
              ],
            },
          ],
        },
        {
          title: "Contact personnel de l'élève",
          fields: [
            {
              key: "email",
              label: "Email de l'élève",
              type: "email",
              placeholder: "email.eleve@example.com",
            },
            {
              key: "phone",
              label: "Téléphone de l'élève",
              type: "tel",
              placeholder: "06 12 34 56 78",
            },
          ],
        },
        {
          title: "Notes et observations",
          fields: [
            {
              key: "notes",
              label: "Notes",
              type: "textarea",
              placeholder:
                "Informations complémentaires, besoins particuliers, observations...",
              rows: 3,
            },
          ],
        },
      ],
    },
    rdv: {
      sections: [
        {
          title: "Informations du rendez-vous",
          fields: [
            { key: "date", label: "Date", type: "date", required: true },
            { key: "time", label: "Heure", type: "time", required: true },
            {
              key: "type",
              label: "Type",
              type: "select",
              required: true,
              options: [
                { value: "physique", label: "Physique" },
                { value: "visio", label: "Visio" },
              ],
            },
          ],
        },
        {
          title: "Détails",
          fields: [
            {
              key: "assignedAdminId",
              label: "Administrateur assigné",
              type: "select",
              options: [],
            },
            {
              key: "notes",
              label: "Notes",
              type: "textarea",
              placeholder: "Notes sur le rendez-vous...",
              rows: 3,
            },
          ],
        },
      ],
    },
    teacher: {
      sections: [
        {
          title: "Informations personnelles",
          fields: [
            { key: "firstName", label: "Prénom", type: "text", required: true },
            { key: "lastName", label: "Nom", type: "text", required: true },
            { key: "birthDate", label: "Date de naissance", type: "date", required: true },
            { key: "phone", label: "Téléphone", type: "tel", required: true },
            { key: "email", label: "Email", type: "email", required: true },
            { key: "postalCode", label: "Code postal", type: "text", required: true },
            { key: "identifier", label: "Identifiant", type: "text" },
          ],
        },
        {
          title: "Notification",
          fields: [
            { key: "notifyEmail", label: "Notifier à", type: "email" },
          ],
        },
      ],
    },
    family: {
      sections: [
        {
          title: "Notes générales",
          fields: [
            {
              key: "familyNotes",
              label: "Notes",
              type: "textarea",
              placeholder: "Notes générales sur la famille...",
              rows: 3,
            },
          ],
        },
        {
          title: "Contact principal",
          fields: [
            { key: "primaryFirstName", label: "Prénom", type: "text", required: true },
            { key: "primaryLastName", label: "Nom", type: "text", required: true },
            { key: "primaryPhone", label: "Téléphone principal", type: "tel", required: true },
            { key: "primarySecondaryPhone", label: "Téléphone secondaire", type: "tel" },
            { key: "primaryEmail", label: "Email", type: "email", required: true },
            { key: "primaryBirthDate", label: "Date de naissance", type: "date" },
            {
              key: "primaryRelation",
              label: "Relation",
              type: "select",
              required: true,
              options: [
                { value: "père", label: "Père" },
                { value: "mère", label: "Mère" },
                { value: "tuteur", label: "Tuteur légal" },
              ],
            },
          ],
        },
        {
          title: "Adresse principale",
          fields: [
            { key: "addressStreet", label: "Rue", type: "text", required: true },
            { key: "addressPostalCode", label: "Code postal", type: "text", required: true },
            { key: "addressCity", label: "Ville", type: "text", required: true },
          ],
        },
        {
          title: "Contact secondaire (optionnel)",
          fields: [
            { key: "secondaryFirstName", label: "Prénom", type: "text" },
            { key: "secondaryLastName", label: "Nom", type: "text" },
            { key: "secondaryPhone", label: "Téléphone", type: "tel" },
            { key: "secondaryEmail", label: "Email", type: "email" },
            {
              key: "secondaryRelation",
              label: "Relation",
              type: "select",
              options: [
                { value: "", label: "Aucune" },
                { value: "père", label: "Père" },
                { value: "mère", label: "Mère" },
                { value: "tuteur", label: "Tuteur légal" },
              ],
            },
          ],
        },
        {
          title: "Adresse de facturation",
          fields: [
            {
              key: "sameAsPrimaryAddress",
              label: "Même adresse que principale",
              type: "checkbox",
            },
            {
              key: "billingStreet",
              label: "Rue",
              type: "text",
              conditional: "sameAsPrimaryAddress",
              conditionValue: true,
            },
            {
              key: "billingPostalCode",
              label: "Code postal",
              type: "text",
              conditional: "sameAsPrimaryAddress",
              conditionValue: true,
            },
            {
              key: "billingCity",
              label: "Ville",
              type: "text",
              conditional: "sameAsPrimaryAddress",
              conditionValue: true,
            },
          ],
        },
        {
          title: "Demande de cours",
          fields: [
            {
              key: "beneficiaryType",
              label: "Type de bénéficiaire",
              type: "select",
              required: true,
              options: [
                { value: "eleves", label: "Élèves" },
                { value: "adulte", label: "Adulte" },
              ],
            },
            {
              key: "beneficiaryGrade",
              label: "Niveau",
              type: "select",
              options: [
                { value: "", label: "Sélectionner un niveau" },
                { value: "CP", label: "CP" },
                { value: "CE1", label: "CE1" },
                { value: "CE2", label: "CE2" },
                { value: "CM1", label: "CM1" },
                { value: "CM2", label: "CM2" },
                { value: "6ème", label: "6ème" },
                { value: "5ème", label: "5ème" },
                { value: "4ème", label: "4ème" },
                { value: "3ème", label: "3ème" },
                { value: "Seconde", label: "Seconde" },
                { value: "Première", label: "Première" },
                { value: "Terminale", label: "Terminale" },
              ],
            },
            {
              key: "demandeSubjects",
              label: "Matières souhaitées",
              type: "textarea",
              placeholder: "Ex: Mathématiques, Français (séparées par des virgules)",
              rows: 2,
            },
            {
              key: "demandeNotes",
              label: "Notes sur la demande",
              type: "textarea",
              placeholder: "Précisions sur la demande de cours...",
              rows: 3,
            },
          ],
        },
        {
          title: "Professeur prévu",
          fields: [
            {
              key: "plannedTeacher",
              label: "Nom du professeur",
              type: "text",
              placeholder: "Nom du professeur prévu (optionnel)",
            },
          ],
        },
      ],
    },
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameAsFamily, setSameAsFamily] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // État interne pour gérer le mode (peut changer dans la modal)
  const [internalMode, setInternalMode] = useState(mode);

  // Génération automatique du titre selon type, data et mode actuel
  const modalTitle = getModalTitle(type, data, internalMode);

  // Reset le mode quand la modal s'ouvre/ferme
  useEffect(() => {
    // Mode changé
    setInternalMode(mode);
  }, [isOpen, mode]);

  // Load admins when modal opens for RDV type
  useEffect(() => {
    if (isOpen && type === "rdv") {
      const loadAdmins = async () => {
        setIsLoadingAdmins(true);
        try {
          const adminsList = await adminService.getAdmins();
          if (adminsList && adminsList.length > 0) {
            setAdmins(adminsList);
          }
        } catch (error) {
          console.error("Failed to load admins:", error);
        } finally {
          setIsLoadingAdmins(false);
        }
      };
      loadAdmins();
    }
  }, [isOpen, type]);

  // États du formulaire (support élève + RDV + teacher + family)
  const [formData, setFormData] = useState({
    // Champs élève
    firstName: "",
    lastName: "",
    level: "",
    birthDate: "",
    street: "",
    postalCode: "",
    city: "",
    studentStreet: "",
    studentPostalCode: "",
    studentCity: "",
    schoolName: "",
    schoolAddress: "",
    email: "",
    phone: "",
    courseLocation: "domicile",
    notes: "",
    // Champs RDV
    date: "",
    time: "",
    type: "physique",
    assignedAdminId: "",
    studentId: "",
    // Champs teacher
    identifier: "",
    notifyEmail: "",
    // Champs family
    familyNotes: "",
    primaryFirstName: "",
    primaryLastName: "",
    primaryPhone: "",
    primarySecondaryPhone: "",
    primaryEmail: "",
    primaryBirthDate: "",
    primaryRelation: "père",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    secondaryFirstName: "",
    secondaryLastName: "",
    secondaryPhone: "",
    secondaryEmail: "",
    secondaryRelation: "",
    secondaryBirthDate: "",
    sameAsPrimaryAddress: true,
    billingStreet: "",
    billingPostalCode: "",
    billingCity: "",
    beneficiaryType: "eleves",
    beneficiaryGrade: "",
    demandeSubjects: "",
    demandeNotes: "",
    plannedTeacher: "",
  });

  // Effect pour pré-remplir les données quand data change
  useEffect(() => {
    // Data changée, réinitialisation des données
    if (type === "student" && data) {
      setFormData((prev) => ({
        ...prev,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        grade: data.school?.grade || "",
        birthDate: data.birthDate
          ? new Date(data.birthDate).toISOString().split("T")[0]
          : "",
        studentStreet: data.courseLocation?.address?.street || "",
        studentPostalCode: data.courseLocation?.address?.postalCode || "",
        studentCity: data.courseLocation?.address?.city || "",
        schoolName: data.school?.name || "",
        schoolAddress: "",
        email: data.contact?.email || "",
        phone: data.contact?.phone || "",
        courseLocation: data.courseLocation?.type || "domicile",
        notes: data.notes || data.comments || "",
      }));
      setSameAsFamily(data.courseLocation?.usesFamilyAddress || false);
    } else if (type === "rdv" && data) {
      const formattedDate = data.date
        ? new Date(data.date).toISOString().split("T")[0]
        : "";
      const adminId = data.assignedAdminId
        ? typeof data.assignedAdminId === "object"
          ? data.assignedAdminId.id
          : data.assignedAdminId
        : "";

      setFormData((prev) => ({
        ...prev,
        date: formattedDate,
        time: data.time || "",
        type: data.type || "physique",
        assignedAdminId: adminId,
        studentId: data.studentId || "",
        notes: data.notes || "",
      }));
    }
  }, [type, data]);

  const handleFieldChange = (field: string, value: string) => {
    // Calcul automatique de l'identifiant pour les professeurs
    if (type === "teacher" && (field === "firstName" || field === "lastName")) {
      setFormData((prev) => {
        const firstName = field === "firstName" ? value : prev.firstName || "";
        const lastName = field === "lastName" ? value : prev.lastName || "";
        const identifier = firstName && lastName ? `${firstName}${lastName}`.replace(/\s+/g, "") : "";

        return {
          ...prev,
          [field]: value,
          identifier: identifier,
        };
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (type === "student") {
      return (
        formData.firstName.trim() !== "" && formData.lastName.trim() !== ""
      );
    } else if (type === "rdv") {
      return (
        formData.date.trim() !== "" &&
        formData.time.trim() !== "" &&
        formData.type.trim() !== ""
      );
    } else if (type === "teacher") {
      return (
        formData.firstName.trim() !== "" &&
        formData.lastName.trim() !== "" &&
        formData.birthDate.trim() !== "" &&
        formData.phone.trim() !== "" &&
        formData.email.trim() !== "" &&
        formData.postalCode.trim() !== ""
      );
    } else if (type === "family") {
      return (
        formData.primaryFirstName.trim() !== "" &&
        formData.primaryLastName.trim() !== "" &&
        formData.primaryPhone.trim() !== "" &&
        formData.primaryEmail.trim() !== "" &&
        formData.addressStreet.trim() !== "" &&
        formData.addressPostalCode.trim() !== "" &&
        formData.addressCity.trim() !== "" &&
        formData.beneficiaryType.trim() !== ""
      );
    }
    return false;
  };

  const handleToggleMode = () => {
    setInternalMode(internalMode === "view" ? "edit" : "view");
  };

  const handleSave = async () => {
    if (!validateForm()) {
      console.log("[HANDLESAVE] ❌ Validation échouée pour type:", type);
      return;
    }

    // Vérifier si déjà en cours de chargement pour éviter double soumission
    if (isLoading) {
      console.log("[HANDLESAVE] ⏳ Déjà en cours de chargement, ignoré");
      return;
    }

    console.log("[HANDLESAVE] 🚀 Début de la sauvegarde pour type:", type);
    console.log("[HANDLESAVE] Mode:", entityId ? "UPDATE" : "CREATE");

    setIsLoading(true);
    setError(null);

    try {
      const handler = ENTITY_HANDLERS[type];

      // 1. Préparation des données
      console.log("[HANDLESAVE] 1️⃣ Préparation des données...");
      const preparedData = handler.prepareData(formData, data);

      // 2. Sauvegarde
      if (entityId) {
        // Mode UPDATE
        console.log("[HANDLESAVE] 2️⃣ Mode UPDATE - ID:", entityId);
        await handler.update(entityId, preparedData, familyId);
      } else {
        // Mode CREATE
        console.log("[HANDLESAVE] 2️⃣ Mode CREATE - Aucun ID");
        const additionalData = type === "rdv" ? admins : undefined;
        const result = await handler.create(familyId, preparedData, additionalData);
        console.log("[HANDLESAVE] ✅ Résultat CREATE:", result);
      }

      // 3. Gestion du mode selon le contexte (création vs édition)
      if (entityId) {
        // Mode UPDATE : basculer en mode view
        setInternalMode("view");
        // Callback après changement de mode
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Mode CREATE : fermer directement la modal
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("❌ [HANDLESAVE] Erreur lors de la sauvegarde:", error);

      if (error instanceof Error) {
        // Gestion spécifique pour RDV en double (erreur 409)
        console.log("🔍 [TOAST DEBUG] Error message:", error.message);
        if (
          error.message.includes("rendez-vous existe déjà") ||
          error.message.includes("déjà un rendez-vous prévu à cette date et heure") ||
          error.message.includes("Cet administrateur a déjà un rendez-vous")
        ) {
          console.log("🎯 [TOAST DEBUG] Condition matched! Calling toast.warning()...");
          toast.warning("Créneau déjà pris", {
            description: "Un rendez-vous existe déjà pour cet administrateur à cette date et heure. Veuillez choisir un autre créneau.",
            duration: 5000,
          });
          console.log("✅ [TOAST DEBUG] toast.warning() called");
          return; // Ne pas fermer la modal
        }

        // Autres erreurs - gestion classique
        let errorMessage = "Erreur lors de la sauvegarde. Veuillez réessayer.";

        if (
          error.message.includes("ValidationError") ||
          error.message.includes("Données invalides")
        ) {
          errorMessage =
            "Données invalides. Veuillez vérifier les informations saisies.";
        } else if (error.message.includes("HTTP error! status:")) {
          // Fallback pour les erreurs HTTP génériques qui n'ont pas été parsées
          errorMessage = "Erreur lors de la sauvegarde. Veuillez réessayer.";
        } else {
          // Utiliser le message détaillé directement s'il est compréhensible
          errorMessage = error.message;
        }

        // Afficher l'erreur dans la modal
        setError(errorMessage);
      }

      // NE PAS fermer la modal ou changer de mode en cas d'erreur
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefillFromProspect = async () => {
    if (type === "student") {
      if (onAddStudentTest && familyId) {
        await onAddStudentTest(familyId);
      } else {
        setFormData((prev) => ({
          ...prev,
          ...studentTestData,
        }));
        setSameAsFamily(studentTestData.sameAsFamily);
      }
    } else if (type === "rdv") {
      // Utiliser l'ID du premier admin disponible si possible
      let adminId = rdvTestData.assignedAdminId;
      if (admins.length > 0) {
        adminId = admins[0].id;
      }

      setFormData((prev) => ({
        ...prev,
        ...rdvTestData,
        assignedAdminId: adminId,
      }));
    } else if (type === "teacher") {
      setFormData((prev) => ({
        ...prev,
        ...professorTestData,
      }));
    } else if (type === "family" && onCreateTestProspect) {
      await onCreateTestProspect();
    }
  };

  // Fonction de rendu dynamique des champs
  const renderField = (field: any) => {
    const {
      key,
      label,
      type,
      required,
      placeholder,
      options,
      conditional,
      conditionValue,
      rows,
    } = field;
    const value = formData[key as keyof typeof formData] || "";
    const isDisabled = internalMode === "view";

    // Gestion des champs conditionnels
    if (conditional === "sameAsFamily" && sameAsFamily === conditionValue) {
      return null;
    }

    // Gestion des champs conditionnels pour "sameAsPrimaryAddress"
    if (conditional === "sameAsPrimaryAddress" && formData.sameAsPrimaryAddress === conditionValue) {
      return null;
    }

    if (type === "checkbox") {
      return (
        <div key={key} className="data-card__field data-card__field--full">
          <label
            className="data-card__label"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <input
              type="checkbox"
              checked={key === "sameAsFamily" ? sameAsFamily : Boolean(value)}
              onChange={(e) => {
                if (key === "sameAsFamily") {
                  setSameAsFamily(e.target.checked);
                  if (e.target.checked) {
                    handleFieldChange("studentStreet", "");
                    handleFieldChange("studentPostalCode", "");
                    handleFieldChange("studentCity", "");
                  }
                } else if (key === "sameAsPrimaryAddress") {
                  handleFieldChange(key, e.target.checked.toString());
                  if (e.target.checked) {
                    handleFieldChange("billingStreet", "");
                    handleFieldChange("billingPostalCode", "");
                    handleFieldChange("billingCity", "");
                  }
                } else {
                  handleFieldChange(key, e.target.checked.toString());
                }
              }}
              disabled={isDisabled}
              data-testid={`checkbox-${key}`}
            />
            {label}
          </label>
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div key={key} className="data-card__field data-card__field--full">
          <label className="data-card__label">
            {label}
            {required && <span className="data-card__required">*</span>}
          </label>
          <textarea
            value={value?.toString() || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className="data-card__textarea"
            rows={rows || 3}
            disabled={isDisabled}
            data-testid={`textarea-${key}`}
          />
        </div>
      );
    }

    if (type === "select") {
      // Handle dynamic admin options for assignedAdminId field
      let selectOptions = options || [];
      if (key === "assignedAdminId") {
        if (isLoadingAdmins) {
          selectOptions = [{ value: "", label: "Chargement des admins..." }];
        } else if (admins.length > 0) {
          selectOptions = admins.map((admin: Admin) => ({
            value: admin.id,
            label: `${admin.firstName} ${admin.lastName}`,
          }));
        } else {
          selectOptions = [{ value: "", label: "Aucun admin disponible" }];
        }
      }

      // En mode view, afficher un Input disabled avec le texte
      if (internalMode === "view") {
        const selectedOption = selectOptions.find(
          (option: any) => option.value === value
        );
        const displayText = selectedOption
          ? selectedOption.label
          : value || "Non renseigné";

        return (
          <div key={key} className="data-card__field">
            <Input
              type="text"
              label={label}
              value={displayText}
              disabled={true}
              required={required}
            />
          </div>
        );
      }

      // En mode edit, utiliser le composant Select
      return (
        <div key={key} className="data-card__field">
          <Select
            label={label}
            value={value?.toString() || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            options={selectOptions}
            required={required}
            disabled={isDisabled}
            data-testid={`select-${key}`}
          />
        </div>
      );
    }

    // Champ identifiant en lecture seule pour teacher
    const isReadOnly = key === "identifier" && type === "teacher";

    return (
      <div key={key} className="data-card__field">
        <label className="data-card__label">
          {label}
          {required && <span className="data-card__required">*</span>}
        </label>
        <Input
          type={type as any}
          value={value?.toString() || ""}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={isDisabled || isReadOnly}
          data-testid={`input-${key}`}
        />
      </div>
    );
  };

  const handleCancel = () => {
    setError(null);
    setFormData({
      // Champs élève
      firstName: "",
      lastName: "",
      level: "",
      birthDate: "",
      street: "",
      postalCode: "",
      city: "",
      studentStreet: "",
      studentPostalCode: "",
      studentCity: "",
      schoolName: "",
      schoolAddress: "",
      email: "",
      phone: "",
      courseLocation: "domicile",
      notes: "",
      // Champs RDV
      date: "",
      time: "",
      type: "physique",
      assignedAdminId: "",
      studentId: "",
      // Champs teacher
      identifier: "",
      notifyEmail: "",
      // Champs family
      familyNotes: "",
      primaryFirstName: "",
      primaryLastName: "",
      primaryPhone: "",
      primarySecondaryPhone: "",
      primaryEmail: "",
      primaryBirthDate: "",
      primaryRelation: "père",
      addressStreet: "",
      addressPostalCode: "",
      addressCity: "",
      secondaryFirstName: "",
      secondaryLastName: "",
      secondaryPhone: "",
      secondaryEmail: "",
      secondaryRelation: "",
      secondaryBirthDate: "",
      sameAsPrimaryAddress: true,
      billingStreet: "",
      billingPostalCode: "",
      billingCity: "",
      beneficiaryType: "eleves",
      beneficiaryGrade: "",
      demandeSubjects: "",
      demandeNotes: "",
      plannedTeacher: "",
    });
    setSameAsFamily(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <PageHeader
          title={modalTitle}
          actions={
            <>
              {internalMode === "view" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    data-testid="close-button-header"
                  >
                    Fermer
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleToggleMode}
                    title="Modifier"
                    data-testid="edit-button-header"
                  >
                    ✏️ Modifier
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleMode}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  {(!data || !data.firstName) && (type === "student" || type === "rdv" || type === "teacher" || (type === "family" && onCreateTestProspect)) && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handlePrefillFromProspect}
                      title="Préremplir avec des données d'exemple"
                    >
                      ✨ Préremplir
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={!validateForm() || isLoading}
                    data-testid="save-button-header"
                  >
                    💾{" "}
                    {isLoading
                      ? "En cours..."
                      : data
                      ? "Enregistrer"
                      : type === "student"
                      ? "Créer l'élève"
                      : type === "teacher"
                      ? "Créer le professeur"
                      : "Créer RDV"}
                  </Button>
                </>
              )}
            </>
          }
        />
        {/* Content */}
        <div className="modal-content">
          {/* Afficher l'erreur en haut pour tous les types */}
          {error && (
            <div className="modal-error" style={{ marginBottom: "16px" }}>
              <strong>⚠️ Erreur :</strong> {error}
            </div>
          )}
          <Container size="full" padding="md" layout="flex-col">
            {MODAL_CONFIG[type].sections.map((section, sectionIndex) => (
              <DataCard
                key={sectionIndex}
                title={section.title}
                fields={[]} // Pas de fields car on utilise children
              >
                <div className="data-card__grid">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </DataCard>
            ))}

            {type === "student" && (
              <div className="modal-note">
                <strong>Note :</strong> L'élève sera automatiquement ajouté à
                cette famille et sera visible immédiatement dans les listes.
              </div>
            )}
          </Container>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Container layout="flex" justify="end" align="center" padding="md">
            {internalMode === "view" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="close-button-footer"
                >
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleToggleMode}
                  data-testid="edit-button-footer"
                >
                  ✏️ Modifier
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleMode}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  disabled={!validateForm() || isLoading}
                  data-testid="save-button-footer"
                >
                  💾{" "}
                  {isLoading
                    ? "En cours..."
                    : data
                    ? "Enregistrer"
                    : type === "student"
                    ? "Créer l'élève"
                    : type === "teacher"
                    ? "Créer le professeur"
                    : "Créer RDV"}
                </Button>
              </>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};
