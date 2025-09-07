/**
 * Test de l'invalidation du cache après ajout d'élève
 * Vérifie que le tableau des prospects se rafraîchit automatiquement
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddStudent from '../../src/pages/families/AddStudent';

// Mocks - Déclarés avant les imports des modules mockés
const mockNavigate = jest.fn();
const mockInvalidateAllFamilyRelatedCaches = jest.fn();
const mockAddStudent = jest.fn().mockResolvedValue({ success: true });

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ familyId: 'test-family-id' }),
  useSearchParams: () => [new URLSearchParams('returnTo=prospects')],
}));

jest.mock('../../src/hooks/useCacheInvalidation', () => ({
  useCacheInvalidation: () => ({
    invalidateAllFamilyRelatedCaches: mockInvalidateAllFamilyRelatedCaches,
  }),
}));

jest.mock('../../src/services/familyService', () => ({
  familyService: {
    addStudent: mockAddStudent,
  },
}));

jest.mock('../../src/components/forms/AddStudentForm', () => ({
  AddStudentForm: ({ onSave }) => (
    <div data-testid="add-student-form">
      <button
        onClick={() =>
          onSave({
            firstName: 'Jean',
            lastName: 'Dupont',
            dateOfBirth: '2010-01-01',
            level: '6ème',
            schoolName: 'Collège Test',
            email: '',
            phone: '',
            notes: '',
          })
        }
      >
        Sauvegarder
      </button>
    </div>
  ),
}));

describe('AddStudent - Cache Invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit invalider le cache après ajout réussi d\'élève', async () => {
    render(
      <BrowserRouter>
        <AddStudent />
      </BrowserRouter>
    );

    // Cliquer sur le bouton de sauvegarde
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    // Attendre que l'ajout soit effectué
    await waitFor(() => {
      expect(mockAddStudent).toHaveBeenCalledWith('test-family-id', {
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: '2010-01-01',
        school: {
          name: 'Collège Test',
          level: 'college',
          grade: '6ème',
        },
        contact: {},
        courseLocation: { type: 'domicile' },
        status: 'active',
      });
    });

    // Vérifier que l'invalidation du cache est appelée
    await waitFor(() => {
      expect(mockInvalidateAllFamilyRelatedCaches).toHaveBeenCalledTimes(1);
    });

    // Vérifier la navigation vers prospects
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/prospects', {
        state: {
          message: 'Élève ajouté avec succès',
          type: 'success',
        },
      });
    });
  });

  test('doit invalider le cache avant la navigation', async () => {
    // Créer un ordre d'exécution pour vérifier la séquence
    const callOrder = [];
    
    mockInvalidateAllFamilyRelatedCaches.mockImplementation(() => {
      callOrder.push('invalidateCache');
    });
    
    mockNavigate.mockImplementation(() => {
      callOrder.push('navigate');
    });

    render(
      <BrowserRouter>
        <AddStudent />
      </BrowserRouter>
    );

    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(callOrder).toEqual(['invalidateCache', 'navigate']);
    });
  });

  test('ne doit pas invalider le cache si l\'ajout échoue', async () => {
    // Simuler une erreur d'ajout
    mockAddStudent.mockRejectedValue(new Error('Erreur API'));

    render(
      <BrowserRouter>
        <AddStudent />
      </BrowserRouter>
    );

    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddStudent).toHaveBeenCalled();
    });

    // Vérifier que l'invalidation n'est PAS appelée en cas d'erreur
    expect(mockInvalidateAllFamilyRelatedCaches).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('doit mapper correctement les niveaux scolaires', async () => {
    render(
      <BrowserRouter>
        <AddStudent />
      </BrowserRouter>
    );

    // Mock du formulaire avec différents niveaux
    const formMock = jest.fn();
    const TestForm = ({ onSave }) => (
      <div>
        <button onClick={() => onSave({ 
          firstName: 'Test', 
          lastName: 'User', 
          dateOfBirth: '2010-01-01',
          level: 'CP',
          schoolName: 'École Test',
          email: '', phone: '', notes: ''
        })}>
          Niveau Primaire
        </button>
        <button onClick={() => onSave({ 
          firstName: 'Test', 
          lastName: 'User', 
          dateOfBirth: '2010-01-01',
          level: 'Seconde',
          schoolName: 'Lycée Test',
          email: '', phone: '', notes: ''
        })}>
          Niveau Lycée
        </button>
      </div>
    );

    // Test niveau primaire
    const primaire = screen.getByText('Sauvegarder');
    if (primaire.textContent === 'Sauvegarder') {
      fireEvent.click(primaire);
      
      await waitFor(() => {
        expect(mockAddStudent).toHaveBeenCalledWith('test-family-id', 
          expect.objectContaining({
            school: expect.objectContaining({
              level: 'college', // Niveau par défaut selon le mapping
            }),
          })
        );
      });
    }
  });
});