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
import { familyService, type Family } from "../../../services/familyService";
import { subjectService } from "../../../services/subjectService";
import type { CreateSettlementNoteData } from "../../../types/settlement";
import type { Subject } from "../../../types/subject";
import { useRefresh } from "../../../contexts/RefreshContext";

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
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [showStudentSelect, setShowStudentSelect] = useState(false);

  // Log pour déboguer l'état de la modal
  console.log("🔍 DEBUG - Rendu - showStudentModal:", showStudentModal);

  const [formData, setFormData] = useState<CreateSettlementNoteData>({
    familyId: familyId || "",
    studentId: "",
    clientName: "",
    department: "",
    paymentMethod: "card",
    subjectId: "",
    hourlyRate: 0,
    quantity: 1,
    professorSalary: 0,
    charges: 0,
    dueDate: new Date(),
    notes: "",
    // Champs calculés automatiquement
    marginPercentage: 0,
    marginAmount: 0,
    chargesToPay: 0,
    salaryToPay: 0,
  });

  // Charger les données des matières et des familles
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger toutes les familles
        console.log("🔍 Chargement des familles...");
        const familiesData = await familyService.getFamilies();
        console.log("🔍 Familles reçues:", familiesData);
        setFamilies(familiesData);

        // Charger toutes les matières
        console.log("🔍 Chargement des matières...");
        let subjectsData: Subject[] = [];
        try {
          // Test direct de l'API
          console.log("🔍 Test direct de l'API /api/subjects...");
          const testResponse = await fetch(
            "http://localhost:3000/api/subjects",
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          console.log("🔍 Test API - Status:", testResponse.status);
          console.log("🔍 Test API - OK:", testResponse.ok);

          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log("🔍 Test API - Données brutes:", testData);
          } else {
            console.log("❌ Test API - Erreur:", testResponse.statusText);
          }

          subjectsData = await subjectService.getSubjects();
          console.log("🔍 Matières reçues via service:", subjectsData);
          console.log("🔍 Nombre de matières:", subjectsData.length);
          console.log("🔍 Type des matières:", typeof subjectsData);
          console.log("🔍 Est-ce un tableau?", Array.isArray(subjectsData));
          setSubjects(subjectsData);
        } catch (error) {
          console.error("❌ Erreur lors du chargement des matières:", error);
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
            console.error("Erreur lors du chargement de la famille:", err);
          }
        }

        // Sélectionner automatiquement la première matière si disponible
        if (subjectsData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            subjectId: subjectsData[0]._id,
          }));
          console.log(
            "✅ Première matière sélectionnée:",
            subjectsData[0].name
          );
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Impossible de charger les données. Veuillez réessayer.");
      }
    };

    loadData();
  }, [familyId]);

  // Calculer automatiquement les valeurs dérivées
  useEffect(() => {
    const salaryToPay = formData.professorSalary * formData.quantity;
    const chargesToPay = formData.charges * formData.quantity;
    const totalAmount = formData.hourlyRate * formData.quantity;
    const marginAmount = totalAmount - salaryToPay - chargesToPay;
    const marginPercentage =
      totalAmount > 0 ? (marginAmount / totalAmount) * 100 : 0;

    // 🔍 LOGS DE DÉBOGAGE - Calcul des valeurs dérivées
    console.log("🔍 === CALCUL VALEURS DÉRIVÉES ===");
    console.log("🔍 Inputs:", {
      professorSalary: formData.professorSalary,
      charges: formData.charges,
      hourlyRate: formData.hourlyRate,
      quantity: formData.quantity,
    });
    console.log("🔍 Calculs:", {
      salaryToPay,
      chargesToPay,
      totalAmount,
      marginAmount,
      marginPercentage,
    });
    console.log("🔍 === FIN CALCUL ===");

    setFormData((prev) => ({
      ...prev,
      salaryToPay,
      chargesToPay,
      marginAmount,
      marginPercentage,
    }));
  }, [
    formData.professorSalary,
    formData.charges,
    formData.hourlyRate,
    formData.quantity,
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // 🔍 LOG DE DÉBOGAGE - Changement de valeur
    console.log(
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
        studentId: "", // Réinitialiser l'élève sélectionné
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
          studentId: studentsArray[0]._id,
        }));
      } else {
        setStudents([]);
        setShowStudentSelect(false);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la famille:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 🔍 LOGS DE DÉBOGAGE - Vérification des données avant envoi
    console.log("🔍 === DÉBOGAGE FORMULAIRE ===");
    console.log("🔍 formData complet:", formData);
    console.log("🔍 Vérification des champs requis:");
    console.log(
      "  - familyId:",
      formData.familyId,
      "✅" + (formData.familyId ? "" : "❌ MANQUANT")
    );
    console.log(
      "  - studentId:",
      formData.studentId,
      "✅" + (formData.studentId ? "" : "❌ MANQUANT")
    );
    console.log(
      "  - clientName:",
      formData.clientName,
      "✅" + (formData.clientName ? "" : "❌ MANQUANT")
    );
    console.log(
      "  - department:",
      formData.department,
      "✅" + (formData.department ? "" : "❌ MANQUANT")
    );
    console.log(
      "  - subjectId:",
      formData.subjectId,
      "✅" + (formData.subjectId ? "" : "❌ MANQUANT")
    );
    console.log(
      "  - hourlyRate:",
      formData.hourlyRate,
      "✅" + (formData.hourlyRate > 0 ? "" : "❌ DOIT ÊTRE > 0")
    );
    console.log(
      "  - quantity:",
      formData.quantity,
      "✅" + (formData.quantity > 0 ? "" : "❌ DOIT ÊTRE > 0")
    );
    console.log(
      "  - professorSalary:",
      formData.professorSalary,
      "✅" + (formData.professorSalary > 0 ? "" : "❌ DOIT ÊTRE > 0")
    );
    console.log(
      "  - charges:",
      formData.charges,
      "✅" + (formData.charges > 0 ? "" : "❌ DOIT ÊTRE > 0")
    );
    console.log(
      "  - dueDate:",
      formData.dueDate,
      "✅" + (formData.dueDate ? "" : "❌ MANQUANT")
    );
    console.log("  - paymentMethod:", formData.paymentMethod, "✅");
    console.log("🔍 === FIN DÉBOGAGE ===");

    try {
      // Si c'est un nouvel élève (pas un ID MongoDB), le créer d'abord
      if (
        formData.studentId &&
        !formData.studentId.match(/^[0-9a-fA-F]{24}$/)
      ) {
        console.log("🔍 Création d'un nouvel élève:", formData.studentId);

        // Créer l'élève dans la famille
        const newStudent = await createStudentInFamily(formData.studentId);

        // Mettre à jour le studentId avec l'ID créé
        formData.studentId = newStudent._id;
        console.log("✅ Nouvel élève créé avec l'ID:", newStudent._id);
      }

      // 🔍 LOG AVANT ENVOI À L'API
      console.log("🚀 Envoi des données à l'API:", formData);

      // Créer la note de règlement
      await settlementService.createSettlementNote(formData);

      // ✅ NAVIGUER D'ABORD
      console.log("🚀 Navigation vers le Dashboard");
      navigate("/admin/dashboard");

      // ✅ PUIS déclencher le refresh après un délai
      setTimeout(() => {
        console.log("🔄 Déclenchement du rafraîchissement après navigation");
        triggerRefresh();
      }, 200);
    } catch (err) {
      console.error("❌ ERREUR DÉTAILLÉE:", err);
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
    console.log("🔍 DEBUG - handleCreateNewStudent appelé");
    console.log("🔍 DEBUG - formData.familyId:", formData.familyId);
    console.log("🔍 DEBUG - families.length:", families.length);

    if (!formData.familyId) {
      console.log("❌ DEBUG - Aucune famille sélectionnée");
      alert("Veuillez d'abord sélectionner une famille pour créer un élève");
      return;
    }

    // Vérifier que la famille existe bien
    const selectedFamily = families.find((f) => f._id === formData.familyId);
    console.log("🔍 DEBUG - selectedFamily trouvé:", selectedFamily);

    if (!selectedFamily) {
      console.log("❌ DEBUG - Famille sélectionnée introuvable");
      alert("Erreur: Famille sélectionnée introuvable");
      return;
    }

    console.log(
      "👨‍🎓 Ouverture de la modal création élève pour la famille:",
      selectedFamily.primaryContact.firstName,
      selectedFamily.primaryContact.lastName
    );

    console.log("🔍 DEBUG - showStudentModal avant:", showStudentModal);
    setShowStudentModal(true);
    console.log("🔍 DEBUG - showStudentModal après setShowStudentModal(true)");
  };

  // Créer une nouvelle famille avec EntityForm
  const handleFamilySubmit = async (familyData: Record<string, unknown>) => {
    console.log("🏠 FAMILLE - Début de la création de famille");
    console.log(
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
            console.error("❌ Aucun utilisateur trouvé dans localStorage");
            throw new Error("Utilisateur non connecté");
          }
          const user = JSON.parse(userStr);
          if (!user.id) {
            console.error(
              "❌ ID utilisateur manquant dans l'objet user:",
              user
            );
            throw new Error("ID utilisateur manquant");
          }
          return user.id;
        })(), //ID de l'utilisateur connecté
      };

      // Debug: vérifier ce qui est dans localStorage
      console.log(
        "🔍 DEBUG - localStorage.getItem('user'):",
        localStorage.getItem("user")
      );
      console.log(
        "🔍 DEBUG - JSON.parse result:",
        JSON.parse(localStorage.getItem("user") || "{}")
      );
      console.log(
        "🔍 DEBUG - createdBy value:",
        JSON.parse(localStorage.getItem("user") || "{}")._id
      );

      console.log(
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

      console.log(
        "📡 FAMILLE - Réponse de l'API:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ FAMILLE - Erreur de l'API:", error);
        throw new Error(
          error.message || "Erreur lors de la création de la famille"
        );
      }

      const newFamily = await response.json();
      console.log("✅ FAMILLE - Famille créée avec succès:", newFamily);

      // Extraire la famille de la réponse API
      const apiResponseFamily = newFamily.family;
      console.log("🔍 FAMILLE - Structure de apiResponseFamily:", {
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
        financialInfo: apiResponseFamily.financialInfo,
        status: apiResponseFamily.status,
        createdBy: apiResponseFamily.createdBy,
        students: apiResponseFamily.students || [],
        createdAt: apiResponseFamily.createdAt,
        updatedAt: apiResponseFamily.updatedAt,
      };

      console.log(
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
      console.error("💥 FAMILLE - Erreur complète:", error);
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
    console.log("👨‍🎓 ÉLÈVE - Début de la création d'élève");
    console.log(
      "📋 ÉLÈVE - Données reçues du formulaire:",
      JSON.stringify(studentData, null, 2)
    );

    // Debug: vérifier la structure des données
    console.log("🔍 ÉLÈVE - Structure des données:");
    console.log(
      "- firstName:",
      studentData.firstName,
      "type:",
      typeof studentData.firstName
    );
    console.log(
      "- lastName:",
      studentData.lastName,
      "type:",
      typeof studentData.lastName
    );
    console.log(
      "- dateOfBirth:",
      studentData.dateOfBirth,
      "type:",
      typeof studentData.dateOfBirth
    );
    console.log(
      "- school.name:",
      studentData["school.name"],
      "type:",
      typeof studentData["school.name"]
    );
    console.log(
      "- school.level:",
      studentData["school.level"],
      "type:",
      typeof studentData["school.level"]
    );
    console.log(
      "- school.grade:",
      studentData["school.grade"],
      "type:",
      typeof studentData["school.grade"]
    );
    console.log(
      "- contact.email:",
      studentData["contact.email"],
      "type:",
      typeof studentData["contact.email"]
    );
    console.log(
      "- contact.phone:",
      studentData["contact.phone"],
      "type:",
      typeof studentData["contact.phone"]
    );
    console.log(
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
        console.log("🔍 ÉLÈVE - Validation des données:", data);

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
      console.log("✅ ÉLÈVE - Données validées:", validatedData);

      // Vérifier que la famille existe toujours
      if (!formData.familyId) {
        throw new Error("Aucune famille sélectionnée pour créer l'élève");
      }

      const selectedFamily = families.find((f) => f._id === formData.familyId);
      if (!selectedFamily) {
        throw new Error("Famille sélectionnée introuvable");
      }

      console.log(
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

      console.log("🔄 ÉLÈVE - Données transformées pour l'API:", apiData);

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

      console.log(
        "📡 ÉLÈVE - Réponse de l'API:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const error: { message?: string } = await response.json();
        console.error("❌ ÉLÈVE - Erreur de l'API:", error);
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

      console.log("✅ ÉLÈVE - Élève créé avec succès:", newStudent);

      // Extraire l'élève de la réponse API (comme pour les familles)
      const apiResponseStudent =
        (newStudent as Record<string, unknown>).student || newStudent;
      console.log(
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

      console.log(
        "🔧 ÉLÈVE - Élève formaté avec les données de l'API:",
        formattedStudent
      );

      // Ajouter le nouvel élève à la liste
      setStudents((prev) => [...prev, formattedStudent]);

      // Activer le select d'élève si c'était le premier
      if (students.length === 0) {
        setShowStudentSelect(true);
      }

      // Sélectionner automatiquement le nouvel élève
      setFormData((prev) => ({
        ...prev,
        studentId: formattedStudent._id,
      }));

      // Fermer la modal
      setShowStudentModal(false);

      alert(
        `Élève "${validatedData.firstName} ${validatedData.lastName}" créé avec succès !`
      );
    } catch (error) {
      console.error("💥 ÉLÈVE - Erreur complète:", error);
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
                <label
                  htmlFor="studentId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Élève concerné *
                </label>
                <div className="flex space-x-2">
                  {formData.familyId && showStudentSelect ? (
                    // Select d'élève quand il y en a
                    <select
                      value={formData.studentId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          studentId: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option key="default" value="">
                        Sélectionner un élève
                      </option>
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                  ) : formData.familyId && !showStudentSelect ? (
                    // Message quand la famille n'a pas d'élève
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 italic">
                      Le client n'a pas d'élève
                    </div>
                  ) : (
                    // Affichage par défaut quand aucune famille n'est sélectionnée
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-400 italic">
                      Sélectionnez d'abord une famille
                    </div>
                  )}
                  {/* Bouton "+ Nouvel élève" - affiché uniquement si une famille est sélectionnée */}
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

              <div>
                <label
                  htmlFor="subjectId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Matière *
                </label>
                <select
                  id="subjectId"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.category})
                    </option>
                  ))}
                </select>
                {subjects.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Aucune matière disponible. Veuillez en créer une d'abord.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="hourlyRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tarif horaire (€) *
                </label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quantité (heures) *
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  placeholder="1"
                />
              </div>
            </div>

            {/* Informations financières */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Informations financières
              </h3>

              <div>
                <label
                  htmlFor="professorSalary"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Salaire du professeur (€/h) *
                </label>
                <Input
                  id="professorSalary"
                  name="professorSalary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.professorSalary}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                />
              </div>

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

              <div>
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date d'échéance *
                </label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate.toISOString().split("T")[0]}
                  onChange={handleInputChange}
                  required
                />
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

          {/* Calculs automatiques */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Calculs automatiques</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Salaire à verser:</span>
                <span className="ml-2 font-medium">
                  {(formData.professorSalary * formData.quantity).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Charges à verser:</span>
                <span className="ml-2 font-medium">
                  {(formData.charges * formData.quantity).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Montant total:</span>
                <span className="ml-2 font-medium">
                  {(formData.hourlyRate * formData.quantity).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Marge:</span>
                <span className="ml-2 font-medium">
                  {(
                    formData.hourlyRate * formData.quantity -
                    formData.professorSalary * formData.quantity -
                    formData.charges * formData.quantity
                  ).toFixed(2)}{" "}
                  €
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
          console.log("🔍 DEBUG - Fermeture de la modal élève");
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
            console.log("🔍 DEBUG - Annulation de la modal élève");
            setShowStudentModal(false);
          }}
          isLoading={isModalLoading}
        />
      </ModalWrapper>
    </div>
  );
};
