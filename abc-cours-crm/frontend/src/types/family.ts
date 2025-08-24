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
    dateOfBirth?: Date;
    relationship?: string; // Lien de parenté
    gender: "M." | "Mme";
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string; // Lien de parenté
    dateOfBirth?: Date;
  };
  settlementNotes: string[]; // ObjectId refs
  status: 'prospect' | 'client';
  notes?: string;
  // Champs spécifiques aux prospects
  prospectStatus?: 'en_reflexion' | 'interesse_prof_a_trouver' | 'injoignable' | 'ndr_editee' | 'premier_cours_effectue' | 'rdv_prospect' | 'ne_va_pas_convertir' | null;
  nextActionReminderSubject?: string; // Objet du rappel
  nextActionDate?: Date | null; // Date de la prochaine action (RRR)
  source?: string; // Source du prospect
  // Section demande de cours (obligatoire)
  demande: {
    beneficiaryType: "adulte" | "eleves";
    subjects: string[];
    notes?: string;
  };
  // Professeur prévu
  plannedTeacher?: string;
  createdBy: string; // ObjectId ref
  // Students optionnel
  students?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    school?: {
      grade: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  level: string;
  school: {
    name: string;
    address: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  courseLocation: {
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
  family: {
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
    dateOfBirth?: Date;
    relationship?: string; // Lien de parenté
    gender: "M." | "Mme";
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string; // Lien de parenté
    dateOfBirth?: Date;
  };
  // Section demande de cours (obligatoire)
  demande: {
    beneficiaryType: "adulte" | "eleves";
    subjects: string[];
    notes?: string;
  };
  // Professeur prévu
  plannedTeacher?: string;
  status?: 'prospect' | 'client';
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
  dateOfBirth: Date;
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
