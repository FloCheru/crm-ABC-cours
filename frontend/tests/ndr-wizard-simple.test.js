/**
 * Tests simplifiés pour validation du wizard NDR
 */

import { render, screen, waitFor, act } from '@testing-library/react';
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
    companyInfo: {}
  }
];

const WizardWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('NDR Wizard - Tests simplifiés', () => {
  beforeEach(() => {
    familyService.getFamilies.mockResolvedValue(mockFamilies);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('devrait rendre le wizard sans erreur', async () => {
    await act(async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );
    });

    // Vérifier que les éléments principaux sont présents
    expect(screen.getByText('Création d\'une Note de Règlement')).toBeInTheDocument();
    expect(screen.getByText('Étape 1 : Informations Client')).toBeInTheDocument();
  });

  test('devrait afficher le stepper de progression', async () => {
    await act(async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );
    });

    // Vérifier que les étapes sont visibles
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Élèves')).toBeInTheDocument();
    expect(screen.getByText('Tarifs')).toBeInTheDocument();
  });

  test('devrait charger et afficher les familles', async () => {
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

    // Vérifier que le service a été appelé
    expect(familyService.getFamilies).toHaveBeenCalled();
  });

  test('devrait afficher les sections de formulaire', async () => {
    await act(async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Sélection du client')).toBeInTheDocument();
    });
  });

  test('devrait avoir les bonnes routes et navigation', async () => {
    await act(async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );
    });

    // Vérifier la présence du breadcrumb
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Création NDR')).toBeInTheDocument();
  });
});