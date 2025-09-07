/**
 * Tests d'intégration pour l'affichage des colonnes NDR-Élève
 * Validation des colonnes settlementNoteIds dans ProspectDetails et ClientDetails
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProspectDetails from '../../src/pages/prospects/ProspectDetails';
import ClientDetails from '../../src/pages/clients/ClientDetails';

// Mock des services
jest.mock('../../src/services/familyService', () => ({
  familyService: {
    getFamilyById: jest.fn(),
    updateFamily: jest.fn(),
    addStudent: jest.fn()
  }
}));

jest.mock('../../src/services/settlementService', () => ({
  settlementService: {
    getSettlementNotesByFamily: jest.fn()
  }
}));

jest.mock('../../src/stores/useFamiliesStore', () => ({
  useFamiliesStore: () => ({
    families: [],
    setFamilies: jest.fn(),
    updateFamily: jest.fn()
  })
}));

// Données de test pour famille avec étudiants
const mockFamilyWithStudents = {
  _id: 'family123',
  status: 'prospect',
  primaryContact: {
    firstName: 'Jean',
    lastName: 'Martin',
    email: 'jean.martin@email.com',
    primaryPhone: '0123456789',
    gender: 'M.'
  },
  address: {
    street: '123 Rue Test',
    city: 'Paris',
    postalCode: '75001'
  },
  demande: {
    beneficiaryType: 'eleves',
    beneficiaryLevel: 'college',
    subjects: ['Mathématiques', 'Physique']
  },
  settlementNotes: ['ndr1', 'ndr2'],
  students: [
    {
      _id: 'student1',
      firstName: 'Alice',
      lastName: 'Martin',
      dateOfBirth: new Date('2008-05-15'),
      school: { name: 'Collège Test', level: 'college', grade: '4ème' },
      status: 'active',
      settlementNoteIds: ['ndr1', 'ndr2'] // 2 NDR
    },
    {
      _id: 'student2', 
      firstName: 'Bob',
      lastName: 'Martin',
      dateOfBirth: new Date('2010-03-20'),
      school: { name: 'Collège Test', level: 'college', grade: '6ème' },
      status: 'active',
      settlementNoteIds: ['ndr1'] // 1 NDR
    },
    {
      _id: 'student3',
      firstName: 'Charlie',
      lastName: 'Martin', 
      dateOfBirth: new Date('2012-07-10'),
      school: { name: 'École Test', level: 'primaire', grade: 'CE2' },
      status: 'active',
      settlementNoteIds: [] // 0 NDR
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Setup des mocks
const { familyService } = require('../../src/services/familyService');

// Utilitaire pour render avec providers
const renderWithProviders = (component, initialRoute = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('NDR-Student Display Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    familyService.getFamilyById.mockResolvedValue(mockFamilyWithStudents);
  });

  describe('ProspectDetails - Colonnes NDR', () => {
    test('should display NDR column header in students table', async () => {
      renderWithProviders(<ProspectDetails />, '/prospects/family123');
      
      await waitFor(() => {
        expect(screen.getByText('NDR')).toBeInTheDocument();
      });
    });

    test('should display correct NDR counts for each student', async () => {
      renderWithProviders(<ProspectDetails />, '/prospects/family123');
      
      await waitFor(() => {
        // Alice - 2 NDR
        const aliceRow = screen.getByText('Alice').closest('tr');
        expect(aliceRow.querySelector('[class*="badge"]')).toHaveTextContent('2');
        
        // Bob - 1 NDR
        const bobRow = screen.getByText('Bob').closest('tr');
        expect(bobRow.querySelector('[class*="badge"]')).toHaveTextContent('1');
        
        // Charlie - 0 NDR
        const charlieRow = screen.getByText('Charlie').closest('tr');
        expect(charlieRow.querySelector('[class*="badge"]')).toHaveTextContent('0');
      });
    });

    test('should handle missing settlementNoteIds gracefully', async () => {
      const familyWithMissingNDR = {
        ...mockFamilyWithStudents,
        students: [
          {
            ...mockFamilyWithStudents.students[0],
            settlementNoteIds: undefined
          }
        ]
      };
      
      familyService.getFamilyById.mockResolvedValue(familyWithMissingNDR);
      
      renderWithProviders(<ProspectDetails />, '/prospects/family123');
      
      await waitFor(() => {
        const studentRow = screen.getByText('Alice').closest('tr');
        expect(studentRow.querySelector('[class*="badge"]')).toHaveTextContent('0');
      });
    });
  });

  describe('ClientDetails - Colonnes NDR', () => {
    beforeEach(() => {
      // Pour ClientDetails, on change le status en 'client'
      const clientFamily = { ...mockFamilyWithStudents, status: 'client' };
      familyService.getFamilyById.mockResolvedValue(clientFamily);
    });

    test('should display NDR column header in students table', async () => {
      renderWithProviders(<ClientDetails />, '/clients/family123');
      
      await waitFor(() => {
        expect(screen.getByText('NDR')).toBeInTheDocument();
      });
    });

    test('should display correct NDR counts for each student', async () => {
      renderWithProviders(<ClientDetails />, '/clients/family123');
      
      await waitFor(() => {
        // Alice - 2 NDR
        const aliceRow = screen.getByText('Alice').closest('tr');
        expect(aliceRow.querySelector('[class*="badge"]')).toHaveTextContent('2');
        
        // Bob - 1 NDR
        const bobRow = screen.getByText('Bob').closest('tr');
        expect(bobRow.querySelector('[class*="badge"]')).toHaveTextContent('1');
        
        // Charlie - 0 NDR
        const charlieRow = screen.getByText('Charlie').closest('tr');
        expect(charlieRow.querySelector('[class*="badge"]')).toHaveTextContent('0');
      });
    });

    test('should handle null settlementNoteIds gracefully', async () => {
      const familyWithNullNDR = {
        ...mockFamilyWithStudents,
        status: 'client',
        students: [
          {
            ...mockFamilyWithStudents.students[0],
            settlementNoteIds: null
          }
        ]
      };
      
      familyService.getFamilyById.mockResolvedValue(familyWithNullNDR);
      
      renderWithProviders(<ClientDetails />, '/clients/family123');
      
      await waitFor(() => {
        const studentRow = screen.getByText('Alice').closest('tr');
        expect(studentRow.querySelector('[class*="badge"]')).toHaveTextContent('0');
      });
    });
  });

  describe('Cohérence entre ProspectDetails et ClientDetails', () => {
    test('should display identical NDR columns structure in both pages', async () => {
      // Test ProspectDetails
      const { unmount } = renderWithProviders(<ProspectDetails />, '/prospects/family123');
      
      await waitFor(() => {
        expect(screen.getByText('NDR')).toBeInTheDocument();
      });
      
      unmount();
      
      // Test ClientDetails avec même famille en client
      const clientFamily = { ...mockFamilyWithStudents, status: 'client' };
      familyService.getFamilyById.mockResolvedValue(clientFamily);
      
      renderWithProviders(<ClientDetails />, '/clients/family123');
      
      await waitFor(() => {
        expect(screen.getByText('NDR')).toBeInTheDocument();
      });
    });
  });

  describe('Performance et Edge Cases', () => {
    test('should handle empty students array', async () => {
      const familyWithoutStudents = {
        ...mockFamilyWithStudents,
        students: []
      };
      
      familyService.getFamilyById.mockResolvedValue(familyWithoutStudents);
      
      renderWithProviders(<ProspectDetails />, '/prospects/family123');
      
      await waitFor(() => {
        expect(screen.getByText('NDR')).toBeInTheDocument();
        // Table header should exist even with no students
      });
    });

    test('should handle large number of NDR gracefully', async () => {
      const familyWithManyNDRs = {
        ...mockFamilyWithStudents,
        students: [
          {
            ...mockFamilyWithStudents.students[0],
            settlementNoteIds: Array(15).fill().map((_, i) => `ndr${i}`)
          }
        ]
      };
      
      familyService.getFamilyById.mockResolvedValue(familyWithManyNDRs);
      
      renderWithProviders(<ProspectDetails />, '/prospects/family123');
      
      await waitFor(() => {
        const studentRow = screen.getByText('Alice').closest('tr');
        expect(studentRow.querySelector('[class*="badge"]')).toHaveTextContent('15');
      });
    });
  });
});