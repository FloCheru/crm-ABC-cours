import { useState, useEffect } from "react";
import type { CouponSeriesFormData } from "../types/coupon";
import type { Family, Student } from "../types/family";
import type { Subject } from "../types/subject";
import { familyService } from "../services/familyService";
import { subjectService } from "../services/subjectService";
import { logger } from "../utils/logger";

interface UseCouponSeriesFormReturn {
  formData: CouponSeriesFormData;
  families: Family[];
  students: Student[];
  subjects: Subject[];
  selectedFamily: Family | null;
  selectedStudent: Student | null;
  selectedSubject: Subject | null;
  isLoading: boolean;
  errors: Record<string, string>;
  totalAmount: number;
  updateFormData: (
    field: keyof CouponSeriesFormData,
    value: string | number | boolean
  ) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

const initialFormData: CouponSeriesFormData = {
  familyId: "",
  studentId: "",
  subject: "",
  hourlyRate: 0,
  totalCoupons: 0,
  notes: "",
  autoAssignTeacher: false,
  sendNotification: false,
};

export const useCouponSeriesForm = (): UseCouponSeriesFormReturn => {
  const [formData, setFormData] =
    useState<CouponSeriesFormData>(initialFormData);
  const [families, setFamilies] = useState<Family[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        logger.debug("Chargement des données initiales...");
        const [familiesData, subjectsData] = await Promise.all([
          familyService.getFamilies(),
          subjectService.getActiveSubjects(),
        ]);
        logger.debug("Familles chargées:", familiesData.length);
        logger.debug("Matières chargées:", subjectsData.length);
        setFamilies(familiesData);
        setSubjects(subjectsData);
      } catch (error) {
        logger.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Charger les élèves quand une famille est sélectionnée
  useEffect(() => {
    const loadStudents = async () => {
      if (formData.familyId) {
        try {
          const selectedFam = families.find((f) => f._id === formData.familyId);
          const studentsData = Array.isArray(selectedFam?.students) && selectedFam.students.length > 0 && typeof selectedFam.students[0] === 'object'
            ? selectedFam.students as Student[]
            : [];
          setStudents(studentsData);
          setSelectedFamily(
            families.find((f) => f._id === formData.familyId) || null
          );
        } catch (error) {
          logger.error("Erreur lors du chargement des élèves:", error);
        }
      } else {
        setStudents([]);
        setSelectedFamily(null);
      }
    };

    loadStudents();
  }, [formData.familyId, families]);

  // Mettre à jour l'élève sélectionné
  useEffect(() => {
    if (formData.studentId) {
      setSelectedStudent(
        students.find((s) => s._id === formData.studentId) || null
      );
    } else {
      setSelectedStudent(null);
    }
  }, [formData.studentId, students]);

  // Mettre à jour la matière sélectionnée
  useEffect(() => {
    if (formData.subject) {
      setSelectedSubject(
        subjects.find((s) => s._id === formData.subject) || null
      );
    } else {
      setSelectedSubject(null);
    }
  }, [formData.subject, subjects]);

  // Calculer le montant total
  const totalAmount = formData.hourlyRate * formData.totalCoupons;

  const updateFormData = (
    field: keyof CouponSeriesFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Réinitialiser les erreurs pour ce champ
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Réinitialiser les champs dépendants
    if (field === "familyId") {
      setFormData((prev) => ({ ...prev, studentId: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.familyId) {
      newErrors.familyId = "La famille est requise";
    }

    if (!formData.studentId) {
      newErrors.studentId = "L'élève est requis";
    }

    if (!formData.subject) {
      newErrors.subject = "La matière est requise";
    }

    if (!formData.hourlyRate || formData.hourlyRate <= 0) {
      newErrors.hourlyRate = "Le tarif horaire doit être supérieur à 0";
    }

    if (!formData.totalCoupons || formData.totalCoupons <= 0) {
      newErrors.totalCoupons = "Le nombre de coupons doit être supérieur à 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setSelectedFamily(null);
    setSelectedStudent(null);
    setSelectedSubject(null);
  };

  return {
    formData,
    families,
    students,
    subjects,
    selectedFamily,
    selectedStudent,
    selectedSubject,
    isLoading,
    errors,
    totalAmount,
    updateFormData,
    validateForm,
    resetForm,
  };
};
