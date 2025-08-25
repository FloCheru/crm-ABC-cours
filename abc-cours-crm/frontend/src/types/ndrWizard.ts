// STEP 1 - Informations Client
export interface Step1Data {
  // Sélection famille
  familyId: string;
  clientName: string;
  department: string;
  
  // Informations personnelles
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: Date;
    gender?: 'M.' | 'Mme';
  };
  
  // Adresse principale
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  
  // Informations entreprise
  companyInfo: {
    urssafNumber?: string;
    siretNumber?: string;
    ceNumber?: string;
  };
  
  // Adresse de facturation
  sameBillingAddress: boolean;
  billingAddress?: {
    street: string;
    city: string;
    postalCode: string;
  };
}

// STEP 2 - Bénéficiaires et Matières
export interface Step2Data {
  // Famille sélectionnée comme bénéficiaire
  familySelected: boolean;
  
  // Élèves sélectionnés
  studentIds: string[];
  
  // Détails par élève
  studentsDetails: Array<{
    studentId: string;
    firstName: string;
    lastName: string;
    
    // Localisation des cours
    courseLocation: {
      type: 'domicile' | 'professeur' | 'autre';
      address?: {
        street: string;
        city: string;
        postalCode: string;
        phone: string;
      };
      otherDetails?: string;
    };
    
    // Horaires disponibilité
    availability?: string;
  }>;
  
  // Détails famille (si sélectionnée)
  familyDetails?: {
    // Localisation des cours pour la famille
    courseLocation: {
      type: 'domicile' | 'professeur' | 'autre';
      address?: {
        street: string;
        city: string;
        postalCode: string;
      };
      otherDetails?: string;
    };
    
    // Horaires disponibilité famille
    availability?: string;
  };
  
  // Matières sélectionnées
  selectedSubjectIds: string[];
}

// STEP 3 - Tarification et Finalisation
export interface Step3Data {
  // Tarifs par matière
  subjects: Array<{
    subjectId: string;
    hourlyRate: number | string;
    quantity: number | string;
    professorSalary: number | string;
  }>;
  
  // Charges
  charges: number;
  
  // Paiement
  paymentMethod: 'card' | 'check' | 'transfer' | 'cash' | 'PRLV' | '';
  paymentType?: 'immediate_advance' | 'tax_credit_n1' | '';
  
  // Échéancier
  hasPaymentSchedule: boolean;
  paymentSchedule?: {
    paymentMethod: 'PRLV' | 'check';
    numberOfInstallments: number;
    dayOfMonth: number;
  };
  
  // Notes
  notes: string;
  
  // Calculs (automatiques)
  marginAmount: number;
  marginPercentage: number;
  chargesToPay: number;
  salaryToPay: number;
}

// Type pour la validation des étapes
export interface ValidationErrors {
  step1?: {
    familyId?: string;
    clientBirthDate?: string;
  };
  step2?: {
    students?: string;
    subjects?: string;
    studentLocation?: string;
    studentAddress?: string;
    beneficiarySelection?: string;
  };
  step3?: {
    rates?: string;
    paymentMethod?: string;
  };
}

// Types pour le wizard de création NDR multi-étapes
export interface NDRWizardState {
  currentStep: 1 | 2 | 3;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  isValid: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
  };
}