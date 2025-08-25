import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Step2StudentsSubjects } from '../src/pages/admin/dashboard/create/Step2StudentsSubjects';
import { NDRWizardProvider } from '../src/contexts/NDRWizardContext';

// Mock des services
jest.mock('../src/services/familyService', () => ({
  familyService: {
    getFamily: jest.fn().mockResolvedValue({
      students: [
        {
          _id: 'student1',
          firstName: 'Marie',
          lastName: 'Dupont',
          level: '5ème'
        }
      ]
    })
  }
}));

jest.mock('../src/services/subjectService', () => ({
  subjectService: {
    getSubjects: jest.fn().mockResolvedValue([
      {
        _id: 'subject1',
        name: 'Mathématiques',
        description: 'Cours de mathématiques'
      },
      {
        _id: 'subject2',
        name: 'Français',
        description: 'Cours de français'
      }
    ])
  }
}));

// Mock du contexte NDRWizard avec des données de test
const mockWizardState = {
  currentStep: 2,
  step1: {
    familyId: 'family123',
    primaryContact: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@test.com',
      phone: '0123456789'
    },
    address: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  step2: {
    familySelected: false,
    studentIds: [],
    selectedSubjectIds: [],
    studentsDetails: []
  },
  isValid: {
    step1: true,
    step2: false,
    step3: false
  }
};

const mockWizardActions = {
  updateStep2: jest.fn(),
  validateStep2: jest.fn().mockReturnValue(true),
  nextStep: jest.fn(),
  previousStep: jest.fn(),
  errors: {}
};

jest.mock('../src/contexts/NDRWizardContext', () => ({
  NDRWizardProvider: ({ children }) => children,
  useNDRWizard: () => ({
    state: mockWizardState,
    ...mockWizardActions
  })
}));

const TestWrapper = ({ children }) => {
  return (
    <div>{children}</div>
  );
};


describe('Step2StudentsSubjects - Family as Beneficiary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les mocks
    mockWizardActions.updateStep2.mockClear();
    mockWizardActions.validateStep2.mockClear();
    mockWizardActions.nextStep.mockClear();
    mockWizardActions.previousStep.mockClear();
  });

  it('should display family card as first beneficiary option', async () => {
    render(
      <TestWrapper>
        <Step2StudentsSubjects />
      </TestWrapper>
    );

    await waitFor(() => {
      // Vérifier que le titre a été mis à jour
      expect(screen.getByText('Sélection des bénéficiaires')).toBeInTheDocument();
    });

    await waitFor(() => {
      // Vérifier que la carte famille est présente avec les bonnes informations
      expect(screen.getByLabelText(/Jean Dupont/i)).toBeInTheDocument();
      expect(screen.getByText('Famille')).toBeInTheDocument();
    });
  });

  it('should display family contact information in family card', async () => {
    render(
      <TestWrapper>
        <Step2StudentsSubjects />
      </TestWrapper>
    );

    await waitFor(() => {
      // Vérifier que les informations de contact sont affichées
      expect(screen.getByText('📧 jean.dupont@test.com')).toBeInTheDocument();
      expect(screen.getByText('📞 0123456789')).toBeInTheDocument();
    });
  });

  it('should call updateStep2 when family checkbox is clicked', async () => {
    render(
      <TestWrapper>
        <Step2StudentsSubjects />
      </TestWrapper>
    );

    await waitFor(() => {
      const familyCheckbox = screen.getByLabelText(/Jean Dupont/i);
      expect(familyCheckbox).toBeInTheDocument();
    });

    // Sélectionner la famille
    const familyCheckbox = screen.getByLabelText(/Jean Dupont/i);
    fireEvent.click(familyCheckbox);

    // Vérifier que updateStep2 a été appelé avec familySelected: true
    expect(mockWizardActions.updateStep2).toHaveBeenCalledWith({
      familySelected: true
    });
  });

  it('should update button text to use "bénéficiaire" instead of "élève"', async () => {
    render(
      <TestWrapper>
        <Step2StudentsSubjects />
      </TestWrapper>
    );

    await waitFor(() => {
      // Vérifier que le texte du bouton a été mis à jour
      expect(screen.getByText('+ Ajouter un nouvel bénéficiaire')).toBeInTheDocument();
    });
  });

  it('should display both family and student cards', async () => {
    render(
      <TestWrapper>
        <Step2StudentsSubjects />
      </TestWrapper>
    );

    await waitFor(() => {
      // Vérifier que les deux cartes sont présentes
      expect(screen.getByLabelText(/Jean Dupont/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Marie Dupont/i)).toBeInTheDocument();
      
      // Vérifier que le badge famille est présent
      expect(screen.getByText('Famille')).toBeInTheDocument();
      
      // Vérifier que le niveau de l'élève est affiché
      expect(screen.getByText('Niveau: 5ème')).toBeInTheDocument();
    });
  });

  it('should call updateStep2 when student checkbox is clicked', async () => {
    render(
      <TestWrapper>
        <Step2StudentsSubjects />
      </TestWrapper>
    );

    await waitFor(() => {
      // Sélectionner un élève
      const studentCheckbox = screen.getByLabelText(/Marie Dupont/i);
      fireEvent.click(studentCheckbox);
    });

    // Vérifier que updateStep2 a été appelé avec le studentId
    expect(mockWizardActions.updateStep2).toHaveBeenCalledWith({
      studentIds: ['student1']
    });
  });

  it('should show error when neither family nor students are selected', async () => {
    render(
      <TestWrapper>
        <Step2StudentsSubjects />
      </TestWrapper>
    );

    await waitFor(() => {
      // Essayer de passer à l'étape suivante sans sélectionner de bénéficiaire
      const nextButton = screen.getByText(/Suivant : Tarifs/i);
      expect(nextButton).toBeDisabled();
    });
  });
});