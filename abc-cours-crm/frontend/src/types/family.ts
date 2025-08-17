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
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
    dateOfBirth?: Date;
    relationship?: string; // Lien de parenté
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
  prospectStatus?: 'en_reflexion' | 'interesse_prof_a_trouver' | 'injoignable' | 'ndr_editee' | 'premier_cours_effectue' | 'rdv_prospect' | 'ne_va_pas_convertir';
  nextActionReminderSubject?: string; // Objet du rappel
  nextActionDate?: Date; // Date de la prochaine action (RRR)
  source?: string; // Source du prospect
  createdBy: string; // ObjectId ref
  students:
    | string[]
    | Array<{
        _id: string;
        firstName: string;
        lastName: string;
        level: string;
      }>; // IDs des élèves ou objets populés
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
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
    dateOfBirth?: Date;
    relationship?: string; // Lien de parenté
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string; // Lien de parenté
    dateOfBirth?: Date;
  };
  status?: 'prospect' | 'client';
  notes?: string;
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
  subjects: {
    [key: string]: {
      level: string;
      notes?: string;
    };
  };
  familyId: string;
}
