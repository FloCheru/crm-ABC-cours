/**
 * Tests pour la page AddStudent
 * Vérifie le flow complet d'ajout d'élève depuis différents contextes
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddStudent from '../../../src/pages/families/AddStudent';
import { familyService } from '../../../src/services/familyService';

// Mock des services
jest.mock('../../../src/services/familyService');
const mockFamilyService = familyService;

// Mock de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ familyId: 'test-family-id' }),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams('returnTo=prospects')]
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AddStudent Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyService.addStudent = jest.fn().mockResolvedValue();
  });

  test('renders page correctly with breadcrumb from prospects', () => {
    renderWithRouter(<AddStudent />);
    
    // Vérifier le breadcrumb
    expect(screen.getByText('Prospects')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un élève')).toBeInTheDocument();
    
    // Vérifier que le composant AddStudentForm est rendu
    expect(screen.getByText('Ajouter un nouveau bénéficiaire')).toBeInTheDocument();
  });

  test('handles successful student addition from prospects', async () => {
    renderWithRouter(<AddStudent />);
    
    // Simuler le remplissage du formulaire
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Marie' }
    });
    fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: 'Dupont' }
    });
    
    // Soumettre le formulaire
    const saveButton = screen.getByText('Ajouter l\'élève');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockFamilyService.addStudent).toHaveBeenCalledWith('test-family-id', {
        firstName: 'Marie',
        lastName: 'Dupont',
        level: undefined,
        dateOfBirth: undefined,
        school: {
          name: undefined,
          address: undefined
        },
        contact: {
          email: undefined,
          phone: undefined
        },
        notes: undefined
      });
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/prospects', {
        state: {
          message: 'Élève ajouté avec succès',
          type: 'success'
        }
      });
    });
  });

  test('handles cancel action correctly', () => {
    renderWithRouter(<AddStudent />);
    
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/prospects');
  });

  test('displays error message on API failure', async () => {
    mockFamilyService.addStudent = jest.fn().mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<AddStudent />);
    
    // Remplir et soumettre le formulaire
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: 'Student' }
    });
    
    const saveButton = screen.getByText('Ajouter l\'élève');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Erreur lors de l'ajout de l'élève/)).toBeInTheDocument();
    });
  });

  test('shows loading state during form submission', async () => {
    // Simule un delai pour observer l'état de chargement
    mockFamilyService.addStudent = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithRouter(<AddStudent />);
    
    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: 'Student' }
    });
    
    // Soumettre
    const saveButton = screen.getByText('Ajouter l\'élève');
    fireEvent.click(saveButton);
    
    // Vérifier l'état de chargement
    expect(screen.getByText('Ajout en cours...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});

// Tests pour différents contextes de retour
describe('AddStudent Page - Different Return Contexts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyService.addStudent = jest.fn().mockResolvedValue();
  });

  test('handles wizard context correctly', async () => {
    // Mock pour le contexte wizard
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ familyId: 'test-family-id' }),
      useNavigate: () => mockNavigate,
      useSearchParams: () => [new URLSearchParams('returnTo=wizard')]
    }));

    const { AddStudent: AddStudentComponent } = await import('../../../src/pages/families/AddStudent');
    
    renderWithRouter(<AddStudentComponent />);
    
    // Remplir et soumettre
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: 'Student' }
    });
    
    const saveButton = screen.getByText('Ajouter l\'élève');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard/create/step2?familyId=test-family-id', {
        state: {
          message: 'Élève ajouté avec succès',
          type: 'success'
        }
      });
    });
  });

  test('handles missing family ID error', () => {
    // Mock pour familyId manquant
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ familyId: undefined }),
      useNavigate: () => mockNavigate,
      useSearchParams: () => [new URLSearchParams()]
    }));

    renderWithRouter(<AddStudent />);
    
    expect(screen.getByText('ID de famille manquant. Impossible d\'ajouter un élève.')).toBeInTheDocument();
    expect(screen.getByText('Retour aux clients')).toBeInTheDocument();
  });
});