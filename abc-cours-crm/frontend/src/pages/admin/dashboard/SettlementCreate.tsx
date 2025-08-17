import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  Button,
  Input,
} from "../../../components";
// Nouveaux imports
import { EntityForm } from "../../../components/forms/EntityForm/EntityForm";
import { ModalWrapper } from "../../../components/ui/ModalWrapper/ModalWrapper";

import { settlementService } from "../../../services/settlementService";
import { familyService } from "../../../services/familyService";
import { subjectService } from "../../../services/subjectService";
import type { CreateSettlementNoteData } from "../../../types/settlement";
import type { Subject } from "../../../types/subject";
import type { Family } from "../../../types/family";
import { useRefresh } from "../../../hooks/useRefresh";
import { logger } from "../../../utils/logger";

// Import des types partagés
import type {
  FamilyFormData,
  StudentFormData,
} from "../../../types/entityForm";

export const SettlementCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get("familyId");
  const { triggerRefresh } = useRefresh();

  const [families, setFamilies] = useState<Family[]>([]);
  const [students, setStudents] = useState<
    Array<{ _id: string; firstName: string; lastName: string; level?: string }>
  >([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // États pour les popups de création
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSubjectSelectionModal, setShowSubjectSelectionModal] =
    useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [showStudentSelect, setShowStudentSelect] = useState(false);

  const [formData, setFormData] = useState<
    CreateSettlementNoteData & { hasPaymentSchedule: boolean }
  >({
    familyId: familyId || "",
    studentIds: [],
    clientName: "",
    department: "",
    paymentMethod: "card",
    subjects: [],
    charges: 0,
    // Échéancier
    hasPaymentSchedule: false,
    paymentSchedule: {
      paymentMethod: "PRLV" as const,
      numberOfInstallments: 1,
      dayOfMonth: 1,
    },
    notes: "",
    // Champs calculés automatiquement
    marginPercentage: 0,
    marginAmount: 0,
    chargesToPay: 0,
    salaryToPay: 0,
  });

  // États séparés pour les tarifs communs
  const [commonRates, setCommonRates] = useState({
    hourlyRate: "",
    quantity: "",
    professorSalary: "",
  });

  // Charger les données des matières et des familles
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger toutes les familles
        logger.debug("🔍 Chargement des familles...");
        const familiesData = await familyService.getFamilies();
        logger.debug("🔍 Familles reçues:", familiesData);
        setFamilies(familiesData);

        // Charger toutes les matières
        logger.debug("🔍 Chargement des matières...");
        let subjectsData: Subject[] = [];
        try {
          // Test direct de l'API
          logger.debug("🔍 Test direct de l'API /api/subjects...");
          const testResponse = await fetch(
            "http://localhost:3000/api/subjects",
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          logger.debug("🔍 Test API - Status:", testResponse.status);
          logger.debug("🔍 Test API - OK:", testResponse.ok);

          if (testResponse.ok) {
            const testData = await testResponse.json();
            logger.debug("🔍 Test API - Données brutes:", testData);
          } else {
            logger.debug("Test API - Erreur:", testResponse.statusText);
          }

          subjectsData = await subjectService.getSubjects();
          logger.debug("🔍 Matières reçues via service:", subjectsData);
          logger.debug("🔍 Nombre de matières:", subjectsData.length);
          logger.debug("🔍 Type des matières:", typeof subjectsData);
          logger.debug("🔍 Est-ce un tableau?", Array.isArray(subjectsData));
          setSubjects(subjectsData);
        } catch (error) {
          logger.error("Erreur lors du chargement des matières:", error);
          setSubjects([]);
        }

        // Si un familyId est fourni, charger les informations de la famille et ses élèves
        if (familyId) {
          try {
            const family = await familyService.getFamily(familyId);
            setFormData((prev) => ({
              ...prev,
              familyId: familyId,
              clientName: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
              department: family.address.city || "",
            }));

            // Charger les élèves de la famille
            if (
              family.students &&
              Array.isArray(family.students) &&
              family.students.length > 0
            ) {
              const studentsArray = family.students as Array<{
                _id: string;
                firstName: string;
                lastName: string;
                level: string;
              }>;
              setStudents(studentsArray);
              setShowStudentSelect(true);
              // Sélectionner automatiquement le premier élève
              setFormData((prev) => ({
                ...prev,
                studentId: studentsArray[0]._id,
              }));
            } else {
              // Aucun élève trouvé, initialiser avec un tableau vide
              setStudents([]);
              setShowStudentSelect(false);
            }
          } catch (err) {
            logger.error("Erreur lors du chargement de la famille:", err);
          }
        }

        // Note: Plus besoin de sélectionner automatiquement une matière 
        // car maintenant on utilise la sélection multiple
      } catch (err) {
        logger.error("Erreur lors du chargement des données:", err);
        setError("Impossible de charger les données. Veuillez réessayer.");
      }
    };

    loadData();
  }, [familyId]);

  // Calculer automatiquement les valeurs dérivées basées sur les tarifs communs et les matières
  useEffect(() => {
    const numberOfSubjects = formData.subjects.length;
    const hourlyRate = parseFloat(commonRates.hourlyRate) || 0;
    const quantity = parseInt(commonRates.quantity) || 0;
    const professorSalary = parseFloat(commonRates.professorSalary) || 0;

    // Calculs globaux pour toutes les matières
    const totalHourlyRate = hourlyRate * numberOfSubjects;
    const totalQuantity = quantity * numberOfSubjects;
    const salaryToPay = professorSalary * quantity * numberOfSubjects;
    const chargesToPay = formData.charges * totalQuantity;
    const totalAmount = hourlyRate * quantity * numberOfSubjects;
    const marginAmount = totalAmount - salaryToPay - chargesToPay;
    const marginPercentage =
      totalAmount > 0 ? (marginAmount / totalAmount) * 100 : 0;

    // 🔍 LOGS DE DÉBOGAGE - Calcul des valeurs dérivées
    logger.debug("🔍 === CALCUL VALEURS DÉRIVÉES (TARIFS COMMUNS) ===");
    logger.debug("🔍 Inputs:", {
      numberOfSubjects,
      commonRates,
      charges: formData.charges,
    });
    logger.debug("🔍 Calculs:", {
      totalHourlyRate,
      totalQuantity,
      salaryToPay,
      chargesToPay,
      totalAmount,
      marginAmount,
      marginPercentage,
    });
    logger.debug("🔍 === FIN CALCUL ===");

    setFormData((prev) => ({
      ...prev,
      salaryToPay,
      chargesToPay,
      marginAmount,
      marginPercentage,
    }));
  }, [formData.subjects, formData.charges, commonRates]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // 🔍 LOG DE DÉBOGAGE - Changement de valeur
    logger.debug(
      `🔍 Changement de valeur: ${name} = ${value} (type: ${typeof value})`
    );

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer le changement de famille
  const handleFamilyChange = async (familyId: string) => {
    if (!familyId) return;

    try {
      const family = await familyService.getFamily(familyId);
      setFormData((prev) => ({
        ...prev,
        familyId: familyId,
        clientName: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
        department: family.address.city || "",
        studentIds: [], // Réinitialiser les élèves sélectionnés
      }));

      // Charger les élèves de la nouvelle famille
      if (
        family.students &&
        Array.isArray(family.students) &&
        family.students.length > 0
      ) {
        const studentsArray = family.students as Array<{
          _id: string;
          firstName: string;
          lastName: string;
          level: string;
        }>;
        setStudents(studentsArray);
        setShowStudentSelect(true);
        // Sélectionner automatiquement le premier élève
        setFormData((prev) => ({
          ...prev,
          studentIds: [studentsArray[0]._id],
        }));
      } else {
        setStudents([]);
        setShowStudentSelect(false);
      }
    } catch (err) {
      logger.error("Erreur lors du chargement de la famille:", err);
    }
  };

  // Gérer la sélection multiple d'élèves
  const handleStudentSelection = (studentId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: checked
        ? [...prev.studentIds, studentId]
        : prev.studentIds.filter((id) => id !== studentId),
    }));
  };

  // Ouvrir la modal de sélection des matières
  const openSubjectSelectionModal = () => {
    // Initialiser avec les matières déjà sélectionnées
    setSelectedSubjectIds(formData.subjects.map((s) => s.subjectId));
    setShowSubjectSelectionModal(true);
  };

  // Gérer la sélection d'une matière dans la modal
  const handleSubjectSelection = (subjectId: string, checked: boolean) => {
    setSelectedSubjectIds((prev) =>
      checked ? [...prev, subjectId] : prev.filter((id) => id !== subjectId)
    );
  };

  // Confirmer la sélection des matières
  const confirmSubjectSelection = () => {
    // Appliquer les tarifs communs à toutes les matières sélectionnées
    const newSubjects = selectedSubjectIds.map((subjectId) => ({
      subjectId,
      hourlyRate: commonRates.hourlyRate || "",
      quantity: commonRates.quantity || "",
      professorSalary: commonRates.professorSalary || "",
    }));

    setFormData((prev) => ({
      ...prev,
      subjects: newSubjects,
    }));

    setShowSubjectSelectionModal(false);
  };

  // Gérer les changements des tarifs communs
  const handleCommonRateChange = (
    field: keyof typeof commonRates,
    value: string
  ) => {
    setCommonRates((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Mettre à jour toutes les matières existantes avec la nouvelle valeur
    if (formData.subjects.length > 0) {
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((subject) => ({
          ...subject,
          [field]: value,
        })),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 🔍 LOGS DE DÉBOGAGE - Vérification des données avant envoi
    logger.debug("🔍 === DÉBOGAGE FORMULAIRE ===");
    logger.debug("🔍 formData complet:", formData);
    logger.debug("🔍 Vérification des champs requis:");
    logger.debug(
      "  - familyId:",
      formData.familyId,
      "✅" + (formData.familyId ? "" : "MANQUANT")
    );
    logger.debug(
      "  - studentIds:",
      formData.studentIds,
      "✅" + (formData.studentIds.length > 0 ? "" : "MANQUANT")
    );
    logger.debug(
      "  - clientName:",
      formData.clientName,
      "✅" + (formData.clientName ? "" : "MANQUANT")
    );
    logger.debug(
      "  - department:",
      formData.department,
      "✅" + (formData.department ? "" : "MANQUANT")
    );
    logger.debug(
      "  - subjects:",
      formData.subjects,
      "✅" + (formData.subjects.length > 0 ? "" : "MANQUANT")
    );
    logger.debug(
      "  - charges:",
      formData.charges,
      "✅" + (formData.charges > 0 ? "" : "DOIT ÊTRE > 0")
    );
    logger.debug("  - hasPaymentSchedule:", formData.hasPaymentSchedule, "✅");
    logger.debug("  - paymentMethod:", formData.paymentMethod, "✅");
    logger.debug("🔍 === FIN DÉBOGAGE ===");

    try {
      // Vérifier que les champs requis sont présents
      if (formData.studentIds.length === 0) {
        throw new Error("Au moins un élève doit être sélectionné");
      }
      if (formData.subjects.length === 0) {
        throw new Error("Au moins une matière doit être ajoutée");
      }

      // Vérifier que les tarifs communs sont remplis
      const hourlyRate = parseFloat(commonRates.hourlyRate);
      const quantity = parseInt(commonRates.quantity);
      const professorSalary = parseFloat(commonRates.professorSalary);

      if (
        !commonRates.hourlyRate ||
        !commonRates.quantity ||
        !commonRates.professorSalary ||
        isNaN(hourlyRate) ||
        isNaN(quantity) ||
        isNaN(professorSalary) ||
        hourlyRate <= 0 ||
        quantity <= 0 ||
        professorSalary <= 0
      ) {
        throw new Error(
          "Veuillez remplir tous les champs de tarification avec des valeurs valides"
        );
      }

      // Préparer les données à envoyer avec les tarifs communs appliqués
      const dataToSend = {
        ...formData,
        subjects: formData.subjects.map((subject) => ({
          subjectId: subject.subjectId,
          hourlyRate: parseFloat(commonRates.hourlyRate),
          quantity: parseInt(commonRates.quantity),
          professorSalary: parseFloat(commonRates.professorSalary),
        })),
      };

      // Ajouter l'échéancier seulement s'il est activé et valide
      if (formData.hasPaymentSchedule && formData.paymentSchedule) {
        dataToSend.paymentSchedule = formData.paymentSchedule;
      }
      // Si pas d'échéancier, ne pas inclure le champ du tout
      
      // Supprimer les champs qui n'existent que côté frontend
      delete dataToSend.hasPaymentSchedule;
      // Supprimer le champ subjectId qui pourrait être resté de l'ancien système
      if (dataToSend.subjectId) {
        delete dataToSend.subjectId;
      }

      // 🔍 LOG AVANT ENVOI À L'API
      logger.debug("🚀 Envoi des données à l'API:", {
        ...dataToSend,
        paymentScheduleStatus: formData.hasPaymentSchedule ? 'activé' : 'désactivé',
        hasPaymentScheduleField: 'paymentSchedule' in dataToSend
      });

      // Créer la note de règlement
      await settlementService.createSettlementNote(dataToSend);

      // NAVIGUER D'ABORD
      logger.debug("🚀 Navigation vers le Dashboard");
      navigate("/admin/dashboard");

      // PUIS déclencher le refresh après un délai
      setTimeout(() => {
        logger.debug("🔄 Déclenchement du rafraîchissement après navigation");
        triggerRefresh();
      }, 200);
    } catch (err) {
      logger.error("ERREUR DÉTAILLÉE:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour créer un nouvel élève dans la famille
  const createStudentInFamily = async (studentName: string) => {
    if (!formData.familyId) {
      throw new Error("ID de famille requis pour créer un élève");
    }

    // Parser le nom (format: "Prénom Nom")
    const nameParts = studentName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    if (!firstName || !lastName) {
      throw new Error("Format du nom invalide. Utilisez 'Prénom Nom'");
    }

    // Créer l'élève via l'API
    const studentData = {
      firstName,
      lastName,
      dateOfBirth: new Date(), // Date par défaut
      school: {
        name: "À définir",
        level: "primaire",
        grade: "À définir",
      },
      contact: {
        email: "",
        phone: "",
      },
      family: formData.familyId,
    };

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/students`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(studentData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de la création de l'élève");
    }

    return response.json();
  };

  // Fonction pour ouvrir la modal de création de famille
  const handleCreateNewFamily = () => {
    setShowFamilyModal(true);
  };

  // Fonction pour ouvrir la modal de création d'élève
  const handleCreateNewStudent = () => {
    logger.debug("🔍 DEBUG - handleCreateNewStudent appelé");
    logger.debug("🔍 DEBUG - formData.familyId:", formData.familyId);
    logger.debug("🔍 DEBUG - families.length:", families.length);

    if (!formData.familyId) {
      logger.debug("DEBUG - Aucune famille sélectionnée");
      alert("Veuillez d'abord sélectionner une famille pour créer un élève");
      return;
    }

    // Vérifier que la famille existe bien
    const selectedFamily = families.find((f) => f._id === formData.familyId);
    logger.debug("🔍 DEBUG - selectedFamily trouvé:", selectedFamily);

    if (!selectedFamily) {
      logger.debug("DEBUG - Famille sélectionnée introuvable");
      alert("Erreur: Famille sélectionnée introuvable");
      return;
    }

    logger.debug(
      "👨‍🎓 Ouverture de la modal création élève pour la famille:",
      selectedFamily.primaryContact.firstName,
      selectedFamily.primaryContact.lastName
    );

    logger.debug("🔍 DEBUG - showStudentModal avant:", showStudentModal);
    setShowStudentModal(true);
    logger.debug("🔍 DEBUG - showStudentModal après setShowStudentModal(true)");
  };

  // Créer une nouvelle famille avec EntityForm
  const handleFamilySubmit = async (familyData: Record<string, unknown>) => {
    logger.debug("🏠 FAMILLE - Début de la création de famille");
    logger.debug(
      "📋 FAMILLE - Données reçues du formulaire:",
      JSON.stringify(familyData, null, 2)
    );

    setIsModalLoading(true);
    try {
      // Type guard pour vérifier les propriétés requises
      const validateFamilyData = (
        data: Record<string, unknown>
      ): FamilyFormData => {
        if (!data.primaryContact || typeof data.primaryContact !== "object") {
          throw new Error("Objet primaryContact manquant");
        }
        if (!data.address || typeof data.address !== "object") {
          throw new Error("Objet address manquant");
        }
        if (!data.financialInfo || typeof data.financialInfo !== "object") {
          throw new Error("Objet financialInfo manquant");
        }

        const primaryContact = data.primaryContact as Record<string, unknown>;
        const address = data.address as Record<string, unknown>;
        const financialInfo = data.financialInfo as Record<string, unknown>;

        if (
          !primaryContact.firstName ||
          typeof primaryContact.firstName !== "string" ||
          primaryContact.firstName.trim() === ""
        ) {
          throw new Error("Prénom du contact requis");
        }
        if (
          !primaryContact.lastName ||
          typeof primaryContact.lastName !== "string" ||
          primaryContact.lastName.trim() === ""
        ) {
          throw new Error("Nom du contact requis");
        }
        if (
          !primaryContact.email ||
          typeof primaryContact.email !== "string" ||
          primaryContact.email.trim() === ""
        ) {
          throw new Error("Email du contact requis");
        }
        if (
          !primaryContact.primaryPhone ||
          typeof primaryContact.primaryPhone !== "string" ||
          primaryContact.primaryPhone.trim() === ""
        ) {
          throw new Error("Téléphone principal requis");
        }

        if (
          !address.street ||
          typeof address.street !== "string" ||
          address.street.trim() === ""
        ) {
          throw new Error("Rue requise");
        }
        if (
          !address.city ||
          typeof address.city !== "string" ||
          address.city.trim() === ""
        ) {
          throw new Error("Ville requise");
        }
        if (
          !address.postalCode ||
          typeof address.postalCode !== "string" ||
          address.postalCode.trim() === ""
        ) {
          throw new Error("Code postal requis");
        }

        // Vérifier le mode de paiement
        if (
          !financialInfo.paymentMethod ||
          typeof financialInfo.paymentMethod !== "string" ||
          financialInfo.paymentMethod.trim() === ""
        ) {
          throw new Error("Mode de paiement requis");
        }

        return data as unknown as FamilyFormData;
      };

      const validatedData = validateFamilyData(familyData);

      // Transformation des données pour l'API
      const primaryContact = validatedData.primaryContact as Record<
        string,
        unknown
      >;
      const address = validatedData.address as Record<string, unknown>;
      const financialInfo = validatedData.financialInfo as Record<
        string,
        unknown
      >;
      const secondaryContact = validatedData.secondaryContact as
        | Record<string, unknown>
        | undefined;

      const apiData = {
        primaryContact: {
          firstName: primaryContact.firstName,
          lastName: primaryContact.lastName,
          email: primaryContact.email,
          primaryPhone: primaryContact.primaryPhone,
          secondaryPhone: primaryContact.secondaryPhone || undefined,
        },
        address: {
          street: address.street,
          city: address.city,
          postalCode: address.postalCode,
        },
        secondaryContact:
          secondaryContact?.firstName &&
          secondaryContact?.lastName &&
          secondaryContact?.phone
            ? {
                firstName: secondaryContact.firstName,
                lastName: secondaryContact.lastName,
                phone: secondaryContact.phone,
                email: secondaryContact.email || undefined,
                relationship: secondaryContact.relationship || undefined,
              }
            : undefined,
        financialInfo: {
          paymentMethod: financialInfo.paymentMethod,
        },
        notes: validatedData.notes || undefined,
        status: "prospect" as const,
        createdBy: (() => {
          const userStr = localStorage.getItem("user");
          if (!userStr) {
            logger.error("Aucun utilisateur trouvé dans localStorage");
            throw new Error("Utilisateur non connecté");
          }
          const user = JSON.parse(userStr);
          if (!user.id) {
            logger.error("ID utilisateur manquant dans l'objet user:", user);
            throw new Error("ID utilisateur manquant");
          }
          return user.id;
        })(), //ID de l'utilisateur connecté
      };

      // Debug: vérifier ce qui est dans localStorage
      logger.debug(
        "🔍 DEBUG - localStorage.getItem('user'):",
        localStorage.getItem("user")
      );
      logger.debug(
        "🔍 DEBUG - JSON.parse result:",
        JSON.parse(localStorage.getItem("user") || "{}")
      );
      logger.debug(
        "🔍 DEBUG - createdBy value:",
        JSON.parse(localStorage.getItem("user") || "{}")._id
      );

      logger.debug(
        "🔄 FAMILLE - Données transformées pour l'API:",
        JSON.stringify(apiData, null, 2)
      );

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/families`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(apiData),
        }
      );

      logger.debug(
        "📡 FAMILLE - Réponse de l'API:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error("FAMILLE - Erreur de l'API:", error);
        throw new Error(
          error.message || "Erreur lors de la création de la famille"
        );
      }

      const newFamily = await response.json();
      logger.debug("FAMILLE - Famille créée avec succès:", newFamily);

      // Extraire la famille de la réponse API
      const apiResponseFamily = newFamily.family;
      logger.debug("🔍 FAMILLE - Structure de apiResponseFamily:", {
        _id: apiResponseFamily._id,
        primaryContact: apiResponseFamily.primaryContact,
        address: apiResponseFamily.address,
        hasPrimaryContact: !!apiResponseFamily.primaryContact,
        primaryContactKeys: apiResponseFamily.primaryContact
          ? Object.keys(apiResponseFamily.primaryContact)
          : "undefined",
      });

      // L'API retourne maintenant les bonnes données, utilisons-les directement
      const formattedFamily: Family = {
        _id: apiResponseFamily._id,
        primaryContact: apiResponseFamily.primaryContact,
        address: apiResponseFamily.address,
        secondaryContact: apiResponseFamily.secondaryContact,
        settlementNotes: apiResponseFamily.settlementNotes || [],
        status: apiResponseFamily.status,
        notes: apiResponseFamily.notes,
        createdBy: apiResponseFamily.createdBy,
        students: apiResponseFamily.students || [],
        createdAt: apiResponseFamily.createdAt,
        updatedAt: apiResponseFamily.updatedAt,
      };

      logger.debug(
        "🔧 FAMILLE - Famille formatée avec les données de l'API:",
        formattedFamily
      );

      // Ajouter la famille formatée à la liste
      setFamilies((prev) => [...prev, formattedFamily]);

      // Sélectionner automatiquement la nouvelle famille
      handleFamilyChange(apiResponseFamily._id);

      // Fermer la modal
      setShowFamilyModal(false);

      alert(
        `Famille "${primaryContact.firstName} ${primaryContact.lastName}" créée avec succès !`
      );
    } catch (error) {
      logger.error("💥 FAMILLE - Erreur complète:", error);
      alert(
        `Erreur lors de la création de la famille: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  // Créer un nouvel élève avec EntityForm
  const handleStudentSubmit = async (
    studentData: Record<string, unknown>
  ): Promise<void> => {
    logger.debug("👨‍🎓 ÉLÈVE - Début de la création d'élève");
    logger.debug(
      "📋 ÉLÈVE - Données reçues du formulaire:",
      JSON.stringify(studentData, null, 2)
    );

    // Debug: vérifier la structure des données
    logger.debug("🔍 ÉLÈVE - Structure des données:");
    logger.debug(
      "- firstName:",
      studentData.firstName,
      "type:",
      typeof studentData.firstName
    );
    logger.debug(
      "- lastName:",
      studentData.lastName,
      "type:",
      typeof studentData.lastName
    );
    logger.debug(
      "- dateOfBirth:",
      studentData.dateOfBirth,
      "type:",
      typeof studentData.dateOfBirth
    );
    logger.debug(
      "- school.name:",
      studentData["school.name"],
      "type:",
      typeof studentData["school.name"]
    );
    logger.debug(
      "- school.level:",
      studentData["school.level"],
      "type:",
      typeof studentData["school.level"]
    );
    logger.debug(
      "- school.grade:",
      studentData["school.grade"],
      "type:",
      typeof studentData["school.grade"]
    );
    logger.debug(
      "- contact.email:",
      studentData["contact.email"],
      "type:",
      typeof studentData["contact.email"]
    );
    logger.debug(
      "- contact.phone:",
      studentData["contact.phone"],
      "type:",
      typeof studentData["contact.phone"]
    );
    logger.debug(
      "- notes:",
      studentData.notes,
      "type:",
      typeof studentData.notes
    );

    setIsModalLoading(true);
    try {
      // Type guard pour vérifier les propriétés requises
      const validateStudentData = (
        data: Record<string, unknown>
      ): StudentFormData => {
        logger.debug("🔍 ÉLÈVE - Validation des données:", data);

        // Vérifier les champs simples
        if (
          !data.firstName ||
          typeof data.firstName !== "string" ||
          data.firstName.trim() === ""
        ) {
          throw new Error("Prénom requis");
        }
        if (
          !data.lastName ||
          typeof data.lastName !== "string" ||
          data.lastName.trim() === ""
        ) {
          throw new Error("Nom requis");
        }
        if (
          !data.dateOfBirth ||
          typeof data.dateOfBirth !== "string" ||
          data.dateOfBirth.trim() === ""
        ) {
          throw new Error("Date de naissance requise");
        }

        // Vérifier les champs imbriqués
        const school = data.school as Record<string, unknown>;

        if (!school || typeof school !== "object") {
          throw new Error("Informations scolaires manquantes");
        }

        if (
          !school.name ||
          typeof school.name !== "string" ||
          school.name.trim() === ""
        ) {
          throw new Error("Établissement requis");
        }
        if (
          !school.level ||
          typeof school.level !== "string" ||
          school.level.trim() === ""
        ) {
          throw new Error("Niveau scolaire requis");
        }
        if (
          !school.grade ||
          typeof school.grade !== "string" ||
          school.grade.trim() === ""
        ) {
          throw new Error("Classe requise");
        }

        return data as unknown as StudentFormData;
      };

      const validatedData = validateStudentData(studentData);
      logger.debug("ÉLÈVE - Données validées:", validatedData);

      // Vérifier que la famille existe toujours
      if (!formData.familyId) {
        throw new Error("Aucune famille sélectionnée pour créer l'élève");
      }

      const selectedFamily = families.find((f) => f._id === formData.familyId);
      if (!selectedFamily) {
        throw new Error("Famille sélectionnée introuvable");
      }

      logger.debug(
        "👨‍👩‍👧‍👦 ÉLÈVE - Famille sélectionnée:",
        selectedFamily.primaryContact.firstName,
        selectedFamily.primaryContact.lastName
      );

      // Préparer les données pour l'API
      const apiData = {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        school: validatedData.school,
        contact: validatedData.contact || { email: "", phone: "" },
        family: formData.familyId,
        notes: validatedData.notes || "",
      };

      logger.debug("🔄 ÉLÈVE - Données transformées pour l'API:", apiData);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(apiData),
        }
      );

      logger.debug(
        "📡 ÉLÈVE - Réponse de l'API:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const error: { message?: string } = await response.json();
        logger.error("ÉLÈVE - Erreur de l'API:", error);
        throw new Error(
          error.message || "Erreur lors de la création de l'élève"
        );
      }

      const newStudent: {
        _id: string;
        firstName: string;
        lastName: string;
        level?: string;
      } = await response.json();

      logger.debug("ÉLÈVE - Élève créé avec succès:", newStudent);

      // Extraire l'élève de la réponse API (comme pour les familles)
      const apiResponseStudent =
        (newStudent as Record<string, unknown>).student || newStudent;
      logger.debug(
        "🔍 ÉLÈVE - Structure de apiResponseStudent:",
        apiResponseStudent
      );

      // Créer l'objet élève avec les bonnes données
      const formattedStudent = {
        _id: (apiResponseStudent as Record<string, unknown>)._id as string,
        firstName: (apiResponseStudent as Record<string, unknown>)
          .firstName as string,
        lastName: (apiResponseStudent as Record<string, unknown>)
          .lastName as string,
        level:
          ((apiResponseStudent as Record<string, unknown>).level as string) ||
          "À définir",
      };

      logger.debug(
        "🔧 ÉLÈVE - Élève formaté avec les données de l'API:",
        formattedStudent
      );

      // Ajouter le nouvel élève à la liste
      setStudents((prev) => [...prev, formattedStudent]);

      // Activer le select d'élève si c'était le premier
      if (students.length === 0) {
        setShowStudentSelect(true);
      }

      // Ajouter automatiquement le nouvel élève aux sélectionnés
      setFormData((prev) => ({
        ...prev,
        studentIds: [...prev.studentIds, formattedStudent._id],
      }));

      // Fermer la modal
      setShowStudentModal(false);

      alert(
        `Élève "${validatedData.firstName} ${validatedData.lastName}" créé avec succès !`
      );
    } catch (error) {
      logger.error("💥 ÉLÈVE - Erreur complète:", error);
      alert(
        `Erreur lors de la création de l'élève: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div>
      <Navbar activePath="/admin/dashboard" />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Tableau de bord", href: "/admin/dashboard" },
          { label: "Créer une NDR", href: "/admin/dashboard/create" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Créer une note de règlement</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Container layout="grid" padding="none">
            {/* Informations client */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations client</h3>

              <div>
                <label
                  htmlFor="familyId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Choisir un client *
                </label>
                <div className="flex space-x-2">
                  <select
                    id="familyId"
                    name="familyId"
                    value={formData.familyId}
                    onChange={(e) => handleFamilyChange(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option key="default" value="">
                      Sélectionner une famille
                    </option>
                    {families.map((family) => (
                      <option key={family._id} value={family._id}>
                        {family.primaryContact?.firstName}{" "}
                        {family.primaryContact?.lastName}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNewFamily}
                    className="whitespace-nowrap"
                  >
                    + Nouveau client
                  </Button>
                </div>
              </div>

              {/* Informations détaillées du client sélectionné */}
              {formData.familyId &&
                (() => {
                  const selectedFamily = families.find(
                    (f) => f._id === formData.familyId
                  );
                  if (!selectedFamily) return null;

                  return (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nom: </span>
                          <span className="ml-2 font-medium">
                            {selectedFamily.primaryContact.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Prénom: </span>
                          <span className="ml-2 font-medium">
                            {selectedFamily.primaryContact.firstName}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Adresse: </span>
                          <span className="ml-2 font-medium">
                            {selectedFamily.address.street}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Code postal: </span>
                          <span className="ml-2 font-medium">
                            {selectedFamily.address.postalCode}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Ville: </span>
                          <span className="ml-2 font-medium">
                            {selectedFamily.address.city}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              <div>
                <label
                  htmlFor="paymentMethod"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mode de règlement *
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="card">Carte</option>
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="cash">Espèces</option>
                </select>
              </div>
            </div>

            {/* Informations cours */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations cours</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Élèves concernés *
                </label>
                <div className="space-y-2">
                  {formData.familyId && showStudentSelect ? (
                    // Checkboxes pour sélection multiple d'élèves
                    <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                      {students.length > 0 ? (
                        students.map((student) => (
                          <div
                            key={student._id}
                            className="flex items-center mb-2"
                          >
                            <input
                              type="checkbox"
                              id={`student-${student._id}`}
                              checked={formData.studentIds.includes(
                                student._id
                              )}
                              onChange={(e) =>
                                handleStudentSelection(
                                  student._id,
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`student-${student._id}`}
                              className="ml-2 text-sm text-gray-700 cursor-pointer"
                            >
                              {student.firstName} {student.lastName}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Aucun élève trouvé pour cette famille
                        </p>
                      )}
                    </div>
                  ) : formData.familyId && !showStudentSelect ? (
                    // Message quand la famille n'a pas d'élève
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 italic">
                      Le client n'a pas d'élève
                    </div>
                  ) : (
                    // Affichage par défaut quand aucune famille n'est sélectionnée
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-400 italic">
                      Sélectionnez d'abord une famille
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    {formData.studentIds.length > 0 && (
                      <div className="text-sm text-blue-600">
                        {formData.studentIds.length} élève(s) sélectionné(s)
                      </div>
                    )}
                    {formData.familyId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNewStudent}
                        className="whitespace-nowrap"
                      >
                        + Nouvel élève
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sélection des matières */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Matières sélectionnées *
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={openSubjectSelectionModal}
                    disabled={subjects.length === 0}
                  >
                    Sélectionner les matières
                  </Button>
                </div>

                {subjects.length === 0 && (
                  <p className="text-sm text-red-600 mb-3">
                    Aucune matière disponible. Veuillez en créer une d'abord.
                  </p>
                )}

                {formData.subjects.length === 0 && subjects.length > 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-2">
                      Aucune matière sélectionnée
                    </p>
                    <p className="text-sm text-gray-400">
                      Utilisez le bouton "Sélectionner les matières" ci-dessus
                    </p>
                  </div>
                )}

                {formData.subjects.length > 0 && (
                  <div className="space-y-4">
                    {/* Liste des matières sélectionnées */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        {formData.subjects.length} matière(s) sélectionnée(s):
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.subjects.map((subject) => {
                          const subjectInfo = subjects.find(
                            (s) => s._id === subject.subjectId
                          );
                          return (
                            <span
                              key={subject.subjectId}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {subjectInfo ? subjectInfo.name : "Matière"}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tarifs communs */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-md font-medium text-gray-800 mb-4">
                        Tarification commune pour toutes les matières
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tarif horaire (€) *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={commonRates.hourlyRate}
                            onChange={(e) =>
                              handleCommonRateChange(
                                "hourlyRate",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantité (heures) *
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={commonRates.quantity}
                            onChange={(e) =>
                              handleCommonRateChange("quantity", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Salaire professeur (€/h) *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={commonRates.professorSalary}
                            onChange={(e) =>
                              handleCommonRateChange(
                                "professorSalary",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informations financières globales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Informations financières globales
              </h3>

              <div>
                <label
                  htmlFor="charges"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Charges (€/h) *
                </label>
                <Input
                  id="charges"
                  name="charges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.charges}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                />
              </div>

              {/* Échéancier */}
              <div className="col-span-2">
                <div className="border rounded-lg p-4">
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={formData.hasPaymentSchedule}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hasPaymentSchedule: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Créer un échéancier de paiement
                    </span>
                  </label>

                  {formData.hasPaymentSchedule && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mode de règlement *
                        </label>
                        <select
                          value={formData.paymentSchedule.paymentMethod}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentSchedule: {
                                ...prev.paymentSchedule,
                                paymentMethod: e.target.value as
                                  | "PRLV"
                                  | "check",
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PRLV">Prélèvement</option>
                          <option value="check">Chèque</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre d'échéances *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.paymentSchedule.numberOfInstallments}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentSchedule: {
                                ...prev.paymentSchedule,
                                numberOfInstallments:
                                  parseInt(e.target.value) || 1,
                              },
                            }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jour de{" "}
                          {formData.paymentSchedule.paymentMethod === "PRLV"
                            ? "prélèvement"
                            : "remise"}{" "}
                          *
                        </label>
                        <select
                          value={formData.paymentSchedule.dayOfMonth}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentSchedule: {
                                ...prev.paymentSchedule,
                                dayOfMonth: parseInt(e.target.value),
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <option key={day} value={day}>
                                {day} {day === 1 ? "er" : ""}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Container>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes supplémentaires..."
            />
          </div>

          {/* Résumé financier global */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Résumé financier global</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre de matières:</span>
                <span className="ml-2 font-medium">
                  {formData.subjects.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total heures:</span>
                <span className="ml-2 font-medium">
                  {(parseInt(commonRates.quantity) || 0) *
                    formData.subjects.length}{" "}
                  h
                </span>
              </div>
              <div>
                <span className="text-gray-600">Salaire total à verser:</span>
                <span className="ml-2 font-medium">
                  {formData.salaryToPay.toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Charges à verser:</span>
                <span className="ml-2 font-medium">
                  {formData.chargesToPay.toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Chiffre d'affaires total:</span>
                <span className="ml-2 font-medium text-blue-600">
                  {(
                    (parseFloat(commonRates.hourlyRate) || 0) *
                    (parseInt(commonRates.quantity) || 0) *
                    formData.subjects.length
                  ).toFixed(2)}{" "}
                  €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Marge totale:</span>
                <span
                  className={`ml-2 font-medium ${
                    formData.marginAmount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formData.marginAmount.toFixed(2)} € (
                  {formData.marginPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <Container layout="flex">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Création..." : "Créer la note de règlement"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
          </Container>
        </form>
      </Container>

      {/* NOUVELLES MODALS avec EntityForm */}

      {/* Modal création famille */}
      <ModalWrapper
        isOpen={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
        size="lg"
        closeOnOverlayClick={false}
      >
        <EntityForm
          entityType="family"
          onSubmit={handleFamilySubmit}
          onCancel={() => setShowFamilyModal(false)}
          isLoading={isModalLoading}
        />
      </ModalWrapper>

      {/* Modal création élève */}
      <ModalWrapper
        isOpen={showStudentModal}
        onClose={() => {
          logger.debug("🔍 DEBUG - Fermeture de la modal élève");
          setShowStudentModal(false);
        }}
        size="lg"
        closeOnOverlayClick={false}
      >
        <EntityForm
          entityType="student"
          additionalProps={{ familyId: formData.familyId }}
          onSubmit={handleStudentSubmit}
          onCancel={() => {
            logger.debug("🔍 DEBUG - Annulation de la modal élève");
            setShowStudentModal(false);
          }}
          isLoading={isModalLoading}
        />
      </ModalWrapper>

      {/* Modal sélection des matières */}
      {showSubjectSelectionModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full mx-4"
            style={{
              maxWidth: "600px",
              height: "500px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header fixe */}
            <div
              className="px-6 py-4 border-b border-gray-200"
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
                flexShrink: 0,
              }}
            >
              <h3 className="text-lg font-semibold">
                Sélectionner les matières
              </h3>
            </div>

            {/* Liste avec scroll forcé */}
            <div
              style={{
                height: "340px",
                overflowY: "auto",
                overflowX: "hidden",
                padding: "16px 24px",
                flex: 1,
              }}
            >
              <div className="space-y-2">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <div
                      key={subject._id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        id={`subject-modal-${subject._id}`}
                        checked={selectedSubjectIds.includes(subject._id)}
                        onChange={(e) =>
                          handleSubjectSelection(subject._id, e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`subject-modal-${subject._id}`}
                        className="ml-3 flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">
                          {subject.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subject.category}
                        </div>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Aucune matière disponible
                  </p>
                )}
              </div>
            </div>

            {/* Footer fixe */}
            <div
              className="px-6 py-4 border-t border-gray-200 bg-gray-50"
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                flexShrink: 0,
              }}
            >
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {selectedSubjectIds.length} matière(s) sélectionnée(s)
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubjectSelectionModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={confirmSubjectSelection}
                    disabled={selectedSubjectIds.length === 0}
                  >
                    Confirmer la sélection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
