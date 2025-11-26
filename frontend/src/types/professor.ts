/**
 * Types pour les professeurs
 * Source: backend/models/Professor.js
 * Alignment avec le modèle MongoDB comme source de vérité
 */

import type { SchoolCategory } from '../constants/schoolLevels';

export type Gender = "M." | "Mme";
export type TransportMode = "voiture" | "vélo" | "transports" | "moto" | "pied";
export type CourseLocation = "domicile" | "visio";
export type DisabilityKnowledge =
  | "aucune"
  | "dys"
  | "autisme"
  | "déficience_visuelle"
  | "déficience_auditive"
  | "handicap_moteur"
  | "handicap_cognitif"
  | "autre";

export type CurrentSituation =
  | "enseignant_education_nationale"
  | "enseignant_vacataire_contractuel"
  | "etudiant_master_professorat"
  | "enseignant_avec_activite_domicile"
  | "enseignant_activite_professionnelle"
  | "enseignant_formation_professionnelle"
  | "etudiant";

export type EmploymentStatus = "salarie" | "auto-entrepreneur" | "formation-professionnel";

export type ProfessorStatus = "active" | "inactive" | "pending" | "suspended";

export interface Address {
  street?: string;
  addressComplement?: string;
  postalCode?: string;
  city?: string;
}

export type TimeSlot = {
  start: string; // Format: "HH:mm" (ex: "09:00")
  end: string;   // Format: "HH:mm" (ex: "12:00")
};

export type DayAvailability = {
  enabled: boolean;
  timeSlots: TimeSlot[];
};

export type WeeklySchedule = {
  lundi?: DayAvailability;
  mardi?: DayAvailability;
  mercredi?: DayAvailability;
  jeudi?: DayAvailability;
  vendredi?: DayAvailability;
  samedi?: DayAvailability;
  dimanche?: DayAvailability;
};

/**
 * Matière enseignée par le professeur avec les niveaux associés
 */
export interface TeachingSubject {
  subjectId: string;          // Référence à Subject._id
  subjectName: string;        // Nom de la matière (ex: "Mathématiques")
  grades: string[];           // Classes précises (ex: ["6ème", "5ème", "3ème"])
  levels: SchoolCategory[];   // Catégories (ex: ["college", "lycee"])
  isCustom?: boolean;         // Flag pour matières personnalisées
}

/**
 * Document professeur (CV, diplôme, certificat, etc.)
 */
export interface ProfessorDocument {
  name: string;
  type: "cv" | "diploma" | "certificate" | "id" | "other";
  filename: string;
  uploadDate: string;
  verified: boolean;
}

/**
 * Information d'éducation du professeur
 */
export interface EducationInfo {
  degree: string;
  institution: string;
  year: number;
  description: string;
}

/**
 * Information d'expérience du professeur
 */
export interface ExperienceInfo {
  position: string;
  company: string;
  startDate: string;
  endDate?: string;
  description: string;
}

/**
 * Rating (note moyenne) du professeur
 */
export interface ProfessorRating {
  average: number;
  count: number;
}

/**
 * Interface principale du professeur
 * Basée sur le modèle MongoDB backend/models/Professor.js
 */
export interface Professor {
  _id: string;

  // Informations personnelles (requis)
  firstName: string;
  lastName: string;
  email: string;

  // Informations optionnelles
  phone?: string;
  birthDate?: string;
  postalCode?: string;
  identifier?: string;
  notifyEmail?: string;

  // Matières enseignées (références à Subject._id)
  subjects?: string[];

  // Disponibilités hebdomadaires (format backend: {day: string, timeSlots: []})
  availability?: Array<{
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    timeSlots: TimeSlot[];
  }>;

  // Documents uploadés
  documents?: ProfessorDocument[];

  // Statut et rating
  status?: ProfessorStatus;
  rating?: ProfessorRating;

  // Informations académiques et professionnelles
  bio?: string;
  education?: EducationInfo[];
  experience?: ExperienceInfo[];
  notes?: string;

  // Champs système
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Type pour la création d'un professeur (sans champs système)
 */
export type CreateProfessorData = Omit<Professor, "_id" | "createdAt" | "updatedAt">;

/**
 * Type pour l'interface service (données retournées par l'API)
 * Inclut tous les champs du formulaire professeur
 */
export interface ProfessorProfile extends Professor {
  gender?: Gender;
  birthName?: string;
  socialSecurityNumber?: string;
  birthCountry?: string;
  nativeLanguage?: boolean;
  secondaryPhone?: string;
  primaryAddress?: Address;
  secondaryAddress?: Address;
  transportMode?: TransportMode;
  courseLocation?: CourseLocation;
  employmentStatus?: EmploymentStatus;
  currentSituation?: CurrentSituation;
  siret?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
  availableDepartments?: string[];
  availableCities?: string[];
  weeklyAvailability?: WeeklySchedule;
}
