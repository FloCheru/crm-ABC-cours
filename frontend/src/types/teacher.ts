/**
 * Types pour les professeurs
 */

import type { SchoolCategory } from '../constants/schoolLevels';

export type Gender = "M." | "Mme";
export type TransportMode = "voiture" | "vélo" | "transports" | "moto";
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
  | "etudiant"
  | "autre";

export type EmploymentStatus = "salarie" | "auto-entrepreneur";

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
}

export interface Teacher {
  _id: string;

  // Section Identité
  gender: Gender;
  firstName: string;
  lastName: string;
  birthName?: string; // Nom de naissance (si différent)
  birthDate: string;
  socialSecurityNumber?: string;
  birthCountry?: string;

  // Section Coordonnées
  email: string;
  phone: string;
  secondaryPhone?: string;
  address?: string;
  addressComplement?: string;
  postalCode: string;
  city?: string;
  inseeCity?: string;
  distributionOffice?: string; // Bureau distributeur (si différent de la commune)
  transportMode?: TransportMode;
  courseLocation?: CourseLocation;
  secondaryAddress?: string;

  // Section CV
  experience?: string;
  certifications?: string;
  miscellaneous?: string;
  disabilityKnowledge?: DisabilityKnowledge[];
  additionalNotes?: string; // Ce que je juge bon de signaler

  // Section Situation actuelle
  currentSituation?: CurrentSituation[];

  // Section Mon RIB
  employmentStatus?: EmploymentStatus;
  siret?: string; // Obligatoire si auto-entrepreneur
  bankName?: string;
  iban?: string;
  bic?: string;

  // Section Déplacements
  availableDepartments?: string[]; // Codes département (ex: ["75", "92", "93"])

  // Section Disponibilités
  weeklyAvailability?: WeeklySchedule;

  // Section Mes Choix (matières enseignées)
  teachingSubjects?: TeachingSubject[];

  // Champs système
  identifier: string; // Calculé automatiquement : prénom+nom (ex: "MarieDupont")
  notifyEmail?: string; // Email de notification (optionnel)
  createdAt: string;
  updatedAt?: string;
}

export type CreateTeacherData = Omit<Teacher, "_id" | "createdAt" | "updatedAt">;

/**
 * Type unifié combinant User (auth) et Teacher (données professeur)
 * Utilisé quand un professeur est connecté et a accès à ses informations complètes
 */
export interface TeacherProfile extends Omit<Teacher, '_id' | 'email' | 'firstName' | 'lastName'> {
  // Hérite de User pour les champs d'authentification
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'professor';

  // Inclut les matières enseignées
  teachingSubjects?: TeachingSubject[];
}
