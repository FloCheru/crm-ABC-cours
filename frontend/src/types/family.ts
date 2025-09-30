import type { RendezVous } from "./rdv";

export interface Family {
  _id: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  // Adresse de facturation (si différente)
  billingAddress?: {
    street: string;
    city: string;
    postalCode: string;
  };
  // Informations entreprise
  companyInfo?: {
    urssafNumber?: string;
    siretNumber?: string;
    ceNumber?: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
    birthDate?: Date;
    relationship?: string; // Lien de parenté
    gender: "M." | "Mme";
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string; // Lien de parenté
    birthDate?: Date;
  };
  ndr: Array<{ id: string }>; // NDR ObjectId refs
  status: "prospect" | "client";
  notes?: string;
  // Champs spécifiques aux prospects
  prospectStatus?:
    | "en_reflexion"
    | "interesse_prof_a_trouver"
    | "injoignable"
    | "ndr_editee"
    | "premier_cours_effectue"
    | "rdv_prospect"
    | "ne_va_pas_convertir"
    | null;
  nextAction?: string; // Objet du rappel
  nextActionDate?: Date | null; // Date de la prochaine action (RRR)
  source?: string; // Source du prospect
  // Section demande de cours (obligatoire)
  demande: {
    beneficiaryType: "adulte" | "eleves";
    level: string; // Changé de beneficiaryLevel à level pour correspondre au modèle MongoDB
    subjects: Array<{ id: string; name: string }>; // Objets avec id et name populé depuis le backend
    notes?: string;
  };
  // Professeur prévu
  plannedTeacher?: string;
  createdBy: string; // ObjectId ref
  rdvs?: RendezVous[];
  // Students avec informations complètes
  students?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    birthDate?: Date;
    school?: {
      name?: string;
      level?: string;
      grade?: string;
    };
    contact?: {
      phone?: string;
      email?: string;
    };
    courseLocation?: {
      type?: "domicile" | "professeur" | "autre";
      address?: {
        street?: string;
        city?: string;
        postalCode?: string;
      };
      otherDetails?: string;
    };
    availability?: string;
    comments?: string;
    medicalInfo?: {
      allergies?: string[];
      conditions?: string[];
      medications?: string[];
      emergencyContact?: {
        name?: string;
        phone?: string;
        relationship?: string;
      };
    };
    status?: "active" | "inactive" | "graduated";
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  school: {
    name: string;
    level: "primaire" | "collège" | "lycée" | "supérieur";
    grade: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  courseLocation?: {
    type: "domicile" | "professeur" | "autre";
    address?: {
      street: string;
      city: string;
      postalCode: string;
    };
    otherDetails?: string;
  };
  availability?: string;
  comments?: string;
  medicalInfo?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
  };
  status: "active" | "inactive" | "graduated";
  notes?: string;
  settlementNoteIds?: string[];
  familyId:
    | string
    | {
        _id: string;
        name: string;
      };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyData {
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  // Adresse de facturation (si différente)
  billingAddress?: {
    street: string;
    city: string;
    postalCode: string;
  };
  // Informations entreprise
  companyInfo?: {
    urssafNumber?: string;
    siretNumber?: string;
    ceNumber?: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
    birthDate?: Date;
    relationship?: string; // Lien de parenté
    gender: "M." | "Mme";
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string; // Lien de parenté
    birthDate?: Date;
  };
  // Section demande de cours (obligatoire) - INPUT TYPE (pour création)
  demande: {
    beneficiaryType: "adulte" | "eleves";
    level: string; // Changé de beneficiaryLevel à level pour correspondre au modèle MongoDB
    subjects: Array<{ id: string }>; // Input API - seulement l'id, name sera populé par le backend
    notes?: string;
  };
  // Professeur prévu
  plannedTeacher?: string;
  status?: "prospect" | "client";
  notes?: string;
}

export interface FamilyStats {
  total: number;
  prospects: number;
  clients: number;
}

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  birthDate: Date;
  level: string;
  school: {
    name: string;
    address: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  courseLocation?: {
    type: "domicile" | "professeur" | "autre";
    address?: {
      street: string;
      city: string;
      postalCode: string;
    };
    otherDetails?: string;
  };
  availability?: string;
  comments?: string;
  subjects: {
    [key: string]: {
      level: string;
      notes?: string;
    };
  };
  familyId: string;
}
