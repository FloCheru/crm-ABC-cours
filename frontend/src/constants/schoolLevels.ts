/**
 * Constants pour les niveaux scolaires
 * Centralise tous les niveaux disponibles dans l'application
 */

export type SchoolCategory = "primaire" | "college" | "lycee" | "superieur";

export interface GradeOption {
  value: string;
  label: string;
}

/**
 * Structure des niveaux scolaires par catégorie
 */
export const SCHOOL_GRADES: Record<SchoolCategory, GradeOption[]> = {
  primaire: [
    { value: "CP", label: "CP" },
    { value: "CE1", label: "CE1" },
    { value: "CE2", label: "CE2" },
    { value: "CM1", label: "CM1" },
    { value: "CM2", label: "CM2" },
  ],
  college: [
    { value: "6ème", label: "6ème" },
    { value: "5ème", label: "5ème" },
    { value: "4ème", label: "4ème" },
    { value: "3ème", label: "3ème" },
  ],
  lycee: [
    { value: "Seconde", label: "Seconde" },
    { value: "Première", label: "Première" },
    { value: "Terminale", label: "Terminale" },
  ],
  superieur: [
    { value: "L1", label: "L1" },
    { value: "L2", label: "L2" },
    { value: "L3", label: "L3" },
    { value: "M1", label: "M1" },
    { value: "M2", label: "M2" },
    { value: "Doctorat", label: "Doctorat" },
    { value: "Autre", label: "Autre" },
  ],
};

/**
 * Labels des catégories
 */
export const CATEGORY_LABELS: Record<SchoolCategory, string> = {
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
  superieur: "Supérieur",
};

/**
 * Récupère les niveaux d'une catégorie
 */
export function getGradesByCategory(category: SchoolCategory): GradeOption[] {
  return SCHOOL_GRADES[category] || [];
}

/**
 * Récupère tous les niveaux, toutes catégories confondues
 */
export function getAllGrades(): GradeOption[] {
  return Object.values(SCHOOL_GRADES).flat();
}

/**
 * Options pour select de catégorie
 */
export function getCategoryOptions(): GradeOption[] {
  return Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}
