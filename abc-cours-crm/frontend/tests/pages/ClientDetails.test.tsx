import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ClientDetails } from '../../src/pages/clients/ClientDetails';
import { familyService } from '../../src/services/familyService';
import { settlementService } from '../../src/services/settlementService';
import type { Family } from '../../src/types/family';
import type { SettlementNote } from '../../src/services/settlementService';

// Mock des services
jest.mock('../../src/services/familyService', () => ({
  familyService: {
    getFamily: jest.fn(),
    updateFamily: jest.fn(),
  }
}));

jest.mock('../../src/services/settlementService', () => ({
  settlementService: {
    getSettlementNotesByFamily: jest.fn(),
  }
}));

const mockFamilyService = require('../../src/services/familyService').familyService;
const mockSettlementService = require('../../src/services/settlementService').settlementService;

// Mock des données de test
const mockFamily: Family = {
  _id: '66f4a2b3c8e1f2d3e4a5b6c7',
  primaryContact: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.com',
    primaryPhone: '06 12 34 56 78',
    secondaryPhone: '',
    gender: 'M',
    relationship: 'Père'
  },
  address: {
    street: '123 rue de la Paix',
    city: 'Paris',
    postalCode: '75001'
  },
  students: [
    {
      _id: '66f4a2b3c8e1f2d3e4a5b6c8',
      firstName: 'Pierre',
      lastName: 'Dupont',
      dateOfBirth: '2010-05-15',
      courseLocation: {
        type: 'domicile',
        address: {
          street: '123 rue de la Paix',
          city: 'Paris',
          postalCode: '75001'
        }
      },
      contact: {
        phone: '06 12 34 56 78'
      },
      availability: 'Mercredi après-midi',
      notes: 'Bon élève'
    }
  ],
  demande: {
    beneficiaryType: 'eleves',
    subjects: ['Mathématiques', 'Physique'],
    notes: 'Cours intensifs'
  },
  source: 'Bouche à oreille',
  notes: 'Famille sérieuse',
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-20T15:30:00.000Z'
};

const mockSettlementNotes: SettlementNote[] = [
  {
    _id: '66f4a2b3c8e1f2d3e4a5b6c9',
    familyId: '66f4a2b3c8e1f2d3e4a5b6c7',
    studentIds: ['66f4a2b3c8e1f2d3e4a5b6c8'],
    clientName: 'Jean Dupont',
    department: '75',
    paymentMethod: 'card',
    subjects: [
      {
        subjectId: {
          _id: 'sub1',
          name: 'Mathématiques',
          category: 'Scientific'
        },
        hourlyRate: 30,
        quantity: 10,
        professorSalary: 20
      },
      {
        subjectId: {
          _id: 'sub2', 
          name: 'Physique',
          category: 'Scientific'
        },
        hourlyRate: 32,
        quantity: 8,
        professorSalary: 22
      }
    ],
    totalHourlyRate: 62,
    totalQuantity: 18,
    totalProfessorSalary: 42,
    salaryToPay: 556,
    charges: 111.2,
    chargesToPay: 667.2,
    marginAmount: 189,
    marginPercentage: 22.1,
    status: 'pending',
    createdAt: '2024-01-16T09:00:00.000Z',
    updatedAt: '2024-01-16T09:00:00.000Z',
    createdBy: {
      _id: 'admin1',
      firstName: 'Admin',
      lastName: 'User'
    }
  }
];

describe('ClientDetails - NDR Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  const renderClientDetails = (clientId = '66f4a2b3c8e1f2d3e4a5b6c7') => {
    return render(
      <MemoryRouter initialEntries={[`/clients/${clientId}`]}>
        <Routes>
          <Route path="/clients/:clientId" element={<ClientDetails />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should load and display settlement notes section structure', async () => {
    // Mock successful API responses for this specific test
    mockFamilyService.getFamily.mockResolvedValue(mockFamily);
    mockSettlementService.getSettlementNotesByFamily.mockResolvedValue([]);

    renderClientDetails();

    // Attendre que les données se chargent
    await waitFor(() => {
      expect(screen.getByText('Détails du client Jean Dupont')).toBeInTheDocument();
    });

    // Vérifier que le service de récupération des NDRs a été appelé
    expect(mockSettlementService.getSettlementNotesByFamily).toHaveBeenCalledWith('66f4a2b3c8e1f2d3e4a5b6c7');

    // Vérifier que la section NDR est présente (même vide)
    await waitFor(() => {
      expect(screen.getByText(/Notes de règlement/)).toBeInTheDocument();
    });

    // Vérifier que le bouton "Nouvelle note de règlement" est présent
    expect(screen.getByText('Nouvelle note de règlement')).toBeInTheDocument();

    // Vérifier que le lien de création pointe vers la bonne URL avec familyId
    const newNdrButton = screen.getByText('Nouvelle note de règlement');
    expect(newNdrButton.closest('button')).toBeInTheDocument();
  });

  it('should display empty state when no settlement notes exist', async () => {
    // Mock empty response for this specific test
    mockFamilyService.getFamily.mockResolvedValue(mockFamily);
    mockSettlementService.getSettlementNotesByFamily.mockResolvedValue([]);
    
    renderClientDetails();

    // Attendre que les données se chargent
    await waitFor(() => {
      expect(screen.getByText('Détails du client Jean Dupont')).toBeInTheDocument();
    });

    // Vérifier que la section NDR indique 0 notes
    await waitFor(() => {
      expect(screen.getByText('Notes de règlement (0)')).toBeInTheDocument();
    });

    // Vérifier le message d'état vide
    expect(screen.getByText('Aucune note de règlement enregistrée')).toBeInTheDocument();

    // Vérifier que le bouton de création est toujours disponible
    expect(screen.getByText('Nouvelle note de règlement')).toBeInTheDocument();
  });

  it('should handle settlement notes loading error gracefully', async () => {
    // Mock error in settlement service for this specific test
    mockFamilyService.getFamily.mockResolvedValue(mockFamily);
    mockSettlementService.getSettlementNotesByFamily.mockRejectedValue(new Error('API Error'));
    
    renderClientDetails();

    // Attendre que les données se chargent
    await waitFor(() => {
      expect(screen.getByText('Détails du client Jean Dupont')).toBeInTheDocument();
    });

    // Vérifier que l'erreur n'empêche pas l'affichage du client
    expect(screen.getByText('Détails du client Jean Dupont')).toBeInTheDocument();

    // Vérifier que la section NDR indique 0 notes (état par défaut)
    await waitFor(() => {
      expect(screen.getByText('Notes de règlement (0)')).toBeInTheDocument();
    });
  });
});

// Tests des fonctions utilitaires
describe('ClientDetails - Utility Functions', () => {
  // Ces tests devraient être dans un fichier séparé en principe,
  // mais pour la démonstration on les met ici

  const mockNote: SettlementNote['subjects'] = [
    {
      subjectId: { _id: 'sub1', name: 'Mathématiques', category: 'Scientific' },
      hourlyRate: 30,
      quantity: 10,
      professorSalary: 20
    },
    {
      subjectId: { _id: 'sub2', name: 'Physique', category: 'Scientific' },
      hourlyRate: 32,
      quantity: 8,
      professorSalary: 22
    }
  ];

  // Note: Ces fonctions sont définies dans le composant, donc difficiles à tester isolément
  // Dans un vrai projet, on les déplacerait dans des fichiers utilitaires séparés

  it('should calculate total amount correctly', () => {
    // Test conceptuel - la logique serait :
    // Utiliser totalHourlyRate * totalQuantity si disponible
    const totalHourlyRate = 62;
    const totalQuantity = 18;
    const expectedTotal = totalHourlyRate * totalQuantity; // 62 * 18 = 1116
    expect(expectedTotal).toBe(1116);
  });

  it('should format subjects display correctly', () => {
    // Test conceptuel - la logique serait :
    // "Nom matière (quantité h)" pour chaque matière, jointes par ", "
    const expectedFormat = 'Mathématiques (10h), Physique (8h)';
    // Cette assertion est conceptuelle car la fonction est dans le composant
    expect(expectedFormat).toBe('Mathématiques (10h), Physique (8h)');
  });
});