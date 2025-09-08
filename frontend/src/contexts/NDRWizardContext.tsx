import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { NDRWizardState, Step1Data, Step2Data, Step3Data, ValidationErrors } from '../types/ndrWizard';

interface NDRWizardContextType {
  state: NDRWizardState;
  
  // Actions pour changer d'étape
  goToStep: (step: 1 | 2 | 3) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Actions pour mettre à jour les données
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  
  // Actions de validation
  validateStep1: () => boolean;
  validateStep2: () => boolean;
  validateStep3: () => boolean;
  
  // Reset
  resetWizard: () => void;
  
  // Contexte de retour
  setReturnContext: (context: string) => void;
  
  // Erreurs
  errors: ValidationErrors;
  setErrors: (errors: ValidationErrors) => void;
}

const initialState: NDRWizardState = {
  currentStep: 1,
  step1: {
    familyId: '',
    clientName: '',
    department: '',
    primaryContact: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    address: {
      street: '',
      city: '',
      postalCode: '',
    },
    companyInfo: {
      urssafNumber: '',
      siretNumber: '',
      ceNumber: '',
    },
    sameBillingAddress: true,
  },
  step2: {
    familySelected: false,
    studentIds: [],
    studentsDetails: [],
    selectedSubjectIds: [],
  },
  step3: {
    subjects: [],
    charges: 0,
    paymentMethod: '',
    hasPaymentSchedule: false,
    notes: '',
    marginAmount: 0,
    marginPercentage: 0,
    chargesToPay: 0,
    salaryToPay: 0,
  },
  isValid: {
    step1: false,
    step2: false,
    step3: false,
  },
  returnContext: undefined,
};

const NDRWizardContext = createContext<NDRWizardContextType | undefined>(undefined);

export const NDRWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NDRWizardState>(initialState);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const goToStep = (step: 1 | 2 | 3) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: (Math.min(prev.currentStep + 1, 3)) as 1 | 2 | 3,
    }));
  };

  const previousStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: (Math.max(prev.currentStep - 1, 1)) as 1 | 2 | 3,
    }));
  };

  const updateStep1 = (data: Partial<Step1Data>) => {
    setState(prev => ({
      ...prev,
      step1: { ...prev.step1, ...data },
    }));
  };

  const updateStep2 = (data: Partial<Step2Data>) => {
    setState(prev => ({
      ...prev,
      step2: { ...prev.step2, ...data },
    }));
  };

  const updateStep3 = (data: Partial<Step3Data>) => {
    setState(prev => ({
      ...prev,
      step3: { ...prev.step3, ...data },
    }));
  };

  const validateStep1 = (): boolean => {
    const { step1 } = state;
    const stepErrors: ValidationErrors['step1'] = {};

    if (!step1.familyId) {
      stepErrors.familyId = 'Une famille doit être sélectionnée';
    }

    if (step1.primaryContact.dateOfBirth) {
      const birthDate = new Date(step1.primaryContact.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 16 || age > 100) {
        stepErrors.clientBirthDate = 'La date de naissance semble incorrecte';
      }
    }

    setErrors(prev => ({ ...prev, step1: stepErrors }));
    const isValid = Object.keys(stepErrors).length === 0;
    
    setState(prev => ({
      ...prev,
      isValid: { ...prev.isValid, step1: isValid },
    }));

    return isValid;
  };

  const validateStep2 = (): boolean => {
    const { step2 } = state;
    const stepErrors: ValidationErrors['step2'] = {};

    // Vérification qu'au moins la famille OU un élève est sélectionné
    if (!step2.familySelected && step2.studentIds.length === 0) {
      stepErrors.students = 'Au moins la famille ou un élève doit être sélectionné comme bénéficiaire';
    }

    if (step2.selectedSubjectIds.length === 0) {
      stepErrors.subjects = 'Au moins une matière doit être sélectionnée';
    }

    // Validation des détails famille (si sélectionnée)
    if (step2.familySelected && step2.familyDetails) {
      const familyDetail = step2.familyDetails;
      if (familyDetail.courseLocation.type === 'autre' && !familyDetail.courseLocation.otherDetails) {
        stepErrors.studentLocation = 'Les détails du lieu de cours sont requis pour "Autre"';
      }
      if (familyDetail.courseLocation.type === 'domicile' && familyDetail.courseLocation.address) {
        const addr = familyDetail.courseLocation.address;
        if (!addr.street || !addr.city || !addr.postalCode) {
          stepErrors.studentAddress = 'L\'adresse complète est requise pour les cours à domicile';
        }
      }
    }
    
    // Validation des lieux de cours pour les élèves
    for (const studentDetail of step2.studentsDetails) {
      if (studentDetail.courseLocation.type === 'autre' && !studentDetail.courseLocation.otherDetails) {
        stepErrors.studentLocation = 'Les détails du lieu de cours sont requis pour "Autre"';
        break;
      }
      if (studentDetail.courseLocation.type === 'domicile' && studentDetail.courseLocation.address) {
        const addr = studentDetail.courseLocation.address;
        if (!addr.street || !addr.city || !addr.postalCode) {
          stepErrors.studentAddress = 'L\'adresse complète est requise pour les cours à domicile';
          break;
        }
      }
    }

    setErrors(prev => ({ ...prev, step2: stepErrors }));
    const isValid = Object.keys(stepErrors).length === 0;
    
    setState(prev => ({
      ...prev,
      isValid: { ...prev.isValid, step2: isValid },
    }));

    return isValid;
  };

  const validateStep3 = (): boolean => {
    const { step3 } = state;
    const stepErrors: ValidationErrors['step3'] = {};

    if (!step3.paymentMethod) {
      stepErrors.paymentMethod = 'Un mode de paiement doit être sélectionné';
    }

    // Validation des tarifs
    for (const subject of step3.subjects) {
      const hourlyRate = parseFloat(subject.hourlyRate.toString());
      const quantity = parseInt(subject.quantity.toString());
      const professorSalary = parseFloat(subject.professorSalary.toString());

      if (isNaN(hourlyRate) || hourlyRate <= 0 ||
          isNaN(quantity) || quantity <= 0 ||
          isNaN(professorSalary) || professorSalary <= 0) {
        stepErrors.rates = 'Tous les tarifs doivent être remplis avec des valeurs valides';
        break;
      }
    }

    setErrors(prev => ({ ...prev, step3: stepErrors }));
    const isValid = Object.keys(stepErrors).length === 0;
    
    setState(prev => ({
      ...prev,
      isValid: { ...prev.isValid, step3: isValid },
    }));

    return isValid;
  };

  const resetWizard = () => {
    setState(initialState);
    setErrors({});
  };

  const setReturnContext = (context: string) => {
    setState(prev => ({ ...prev, returnContext: context }));
  };

  const value: NDRWizardContextType = {
    state,
    goToStep,
    nextStep,
    previousStep,
    updateStep1,
    updateStep2,
    updateStep3,
    validateStep1,
    validateStep2,
    validateStep3,
    resetWizard,
    setReturnContext,
    errors,
    setErrors,
  };

  return (
    <NDRWizardContext.Provider value={value}>
      {children}
    </NDRWizardContext.Provider>
  );
};

export const useNDRWizard = (): NDRWizardContextType => {
  const context = useContext(NDRWizardContext);
  if (context === undefined) {
    throw new Error('useNDRWizard must be used within a NDRWizardProvider');
  }
  return context;
};