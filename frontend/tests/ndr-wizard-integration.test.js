/**
 * Tests d'intégration pour le wizard de création NDR multi-étapes
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NDRCreationWizard } from '../src/pages/admin/dashboard/create/NDRCreationWizard';
import { familyService } from '../src/services/familyService';

// Mock des services
jest.mock('../src/services/familyService', () => ({
  familyService: {
    getFamilies: jest.fn(),
    getFamily: jest.fn(),
  }
}));

// Mock des données de test
const mockFamilies = [
  {
    _id: 'family1',
    primaryContact: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.com',
      primaryPhone: '0123456789',
      gender: 'M.',
    },
    address: {
      street: '123 Rue Test',
      city: 'Paris',
      postalCode: '75001',
    },
    status: 'prospect',
    companyInfo: {
      urssafNumber: '12345678901',
      siretNumber: '12345678901234',
      ceNumber: '1234',
    }
  },
  {
    _id: 'family2',
    primaryContact: {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@email.com',
      primaryPhone: '0987654321',
      gender: 'Mme',
    },
    address: {
      street: '456 Avenue Test',
      city: 'Lyon',
      postalCode: '69001',
    },
    status: 'client',
    companyInfo: {}
  }
];

const WizardWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('NDR Wizard - Tests d\'intégration', () => {
  beforeEach(() => {
    familyService.getFamilies.mockResolvedValue(mockFamilies);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1 - Sélection Client', () => {
    test('devrait afficher la liste des familles', async () => {
      await act(async () => {
        render(
          <WizardWrapper>
            <NDRCreationWizard />
          </WizardWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('Marie Martin')).toBeInTheDocument();
      });
    });

    test('devrait permettre la sélection d\'une famille', async () => {
      await act(async () => {
        render(
          <WizardWrapper>
            <NDRCreationWizard />
          </WizardWrapper>
        );
      });

      await waitFor(() => {
        const familyCard = screen.getByText('Jean Dupont').closest('div');
        act(() => {
          fireEvent.click(familyCard);
        });
      });

      // Vérifier que les détails de la famille apparaissent
      await waitFor(() => {
        expect(screen.getByDisplayValue('Jean')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jean.dupont@email.com')).toBeInTheDocument();
      });
    });

    test('devrait valider les champs obligatoires', async () => {
      await act(async () => {
        render(
          <WizardWrapper>
            <NDRCreationWizard />
          </WizardWrapper>
        );
      });

      // Attendre que les données soient chargées
      await waitFor(() => {
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      });

      // Essayer de passer à l'étape suivante sans sélectionner de famille
      const nextButton = screen.getByText(/Suivant.*Matières/i);
      
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/famille.*sélectionnée/i)).toBeInTheDocument();
      });
    });

    test('devrait permettre de modifier les informations famille', async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );

      await waitFor(() => {
        const familyCard = screen.getByText('Jean Dupont').closest('div');
        fireEvent.click(familyCard);
      });

      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('Jean');
        fireEvent.change(firstNameInput, { target: { value: 'Jean-Claude' } });
        expect(screen.getByDisplayValue('Jean-Claude')).toBeInTheDocument();
      });
    });

    test('devrait gérer l\'adresse de facturation', async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );

      await waitFor(() => {
        const familyCard = screen.getByText('Jean Dupont').closest('div');
        fireEvent.click(familyCard);
      });

      await waitFor(() => {
        const sameAddressCheckbox = screen.getByLabelText(/adresse de facturation.*même/i);
        expect(sameAddressCheckbox).toBeChecked();

        // Décocher pour afficher les champs séparés
        fireEvent.click(sameAddressCheckbox);
        expect(screen.getByLabelText(/Rue.*facturation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation du Wizard', () => {
    test('devrait afficher le stepper de progression', async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );

      // Vérifier que les étapes sont visibles
      expect(screen.getByText('Client')).toBeInTheDocument();
      expect(screen.getByText('Élèves')).toBeInTheDocument();
      expect(screen.getByText('Tarifs')).toBeInTheDocument();
    });

    test('devrait permettre la navigation entre les étapes', async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );

      // Sélectionner une famille d'abord
      await waitFor(() => {
        const familyCard = screen.getByText('Jean Dupont').closest('div');
        fireEvent.click(familyCard);
      });

      // Passer à l'étape 2
      await waitFor(() => {
        const nextButton = screen.getByText(/Suivant.*Élèves/);
        fireEvent.click(nextButton);
      });

      // Vérifier qu'on est sur l'étape 2
      await waitFor(() => {
        expect(screen.getByText('Étape 2 : Élèves et Matières')).toBeInTheDocument();
      });

      // Revenir à l'étape 1
      const backButton = screen.getByText(/Retour.*Client/);
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Étape 1 : Informations Client')).toBeInTheDocument();
      });
    });
  });

  describe('Intégration avec paramètres URL', () => {
    test('devrait pré-sélectionner la famille si familyId fourni', async () => {
      // Mock URLSearchParams
      const mockSearchParams = new URLSearchParams('?familyId=family1');
      jest.spyOn(require('react-router-dom'), 'useSearchParams')
        .mockReturnValue([mockSearchParams]);

      familyService.getFamily = jest.fn().mockResolvedValue(mockFamilies[0]);

      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );

      await waitFor(() => {
        expect(familyService.getFamily).toHaveBeenCalledWith('family1');
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jean')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
      });
    });
  });

  describe('Validation et erreurs', () => {
    test('devrait afficher les erreurs de validation', async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );

      // Essayer de passer à l'étape suivante sans sélection
      const nextButton = screen.getByText(/Suivant.*Élèves/);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/famille.*sélectionnée/i)).toBeInTheDocument();
      });
    });

    test('devrait valider l\'âge de la date de naissance', async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );

      await waitFor(() => {
        const familyCard = screen.getByText('Jean Dupont').closest('div');
        fireEvent.click(familyCard);
      });

      await waitFor(() => {
        const birthDateInput = screen.getByLabelText(/Date de naissance/i);
        fireEvent.change(birthDateInput, { target: { value: '2020-01-01' } });
      });

      const nextButton = screen.getByText(/Suivant.*Élèves/);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/date de naissance.*incorrecte/i)).toBeInTheDocument();
      });
    });
  });
});