/**
 * Types pour les professeurs
 */

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

  // Champs système
  identifier: string; // Calculé automatiquement : prénom+nom (ex: "MarieDupont")
  notifyEmail?: string; // Email de notification (optionnel)
  createdAt: string;
  updatedAt?: string;
}

export type CreateTeacherData = Omit<Teacher, "_id" | "createdAt" | "updatedAt">;
