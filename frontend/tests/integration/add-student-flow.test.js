/**
 * Tests d'intégration pour le flow complet d'ajout d'élève
 * Vérifie l'interaction entre les différentes pages et la navigation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AddStudent from '../../src/pages/families/AddStudent';
import { Prospects } from '../../src/pages/prospects';
import { familyService } from '../../src/services/familyService';

// Mock des services
jest.mock('../../src/services/familyService');
const mockFamilyService = familyService;

// Mock des données prospects
const mockProspects = [
  {
    _id: 'family-1',
    lastName: 'Dupont',
    parentFirstName: 'Marie',
    beneficiaryType: 'eleves',
    students: [],
    status: 'active'
  }
];

// Mock du service prospects
jest.mock('../../src/services/prospectService', () => ({
  prospectService: {
    getProspects: jest.fn().mockResolvedValue(mockProspects),
    updateProspectStatus: jest.fn().mockResolvedValue()
  }
}));

// Component de test avec routing complet
const TestApp = ({ initialRoute = '/prospects' }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/prospects" element={<Prospects />} />
      <Route path="/families/:familyId/add-student" element={<AddStudent />} />
    </Routes>
  </BrowserRouter>
);

describe('Add Student Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyService.addStudent = jest.fn().mockResolvedValue();
    
    // Mock window.location pour les tests de navigation
    delete window.location;
    window.location = { pathname: '/prospects', search: '', hash: '' };
  });

  test('complete flow: prospects → add student → back to prospects', async () => {
    render(<TestApp />);
    
    // Attendre que les prospects se chargent
    await waitFor(() => {
      expect(screen.getByText('Dupont Marie')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton "Ajouter un élève"
    const addStudentButton = screen.getByText('Ajouter un élève');
    fireEvent.click(addStudentButton);
    
    // Vérifier la navigation vers la page AddStudent
    await waitFor(() => {
      expect(screen.getByText('Ajouter un nouveau bénéficiaire')).toBeInTheDocument();
      expect(screen.getByText('Prospects')).toBeInTheDocument(); // Breadcrumb
    });
    
    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Jean' }
    });
    fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: 'Dupont' }
    });
    fireEvent.change(screen.getByLabelText('Niveau/Classe'), {
      target: { value: 'CM2' }
    });
    
    // Soumettre le formulaire
    const saveButton = screen.getByText('Ajouter l\'élève');
    fireEvent.click(saveButton);
    
    // Vérifier l'appel API
    await waitFor(() => {
      expect(mockFamilyService.addStudent).toHaveBeenCalledWith('family-1', {
        firstName: 'Jean',
        lastName: 'Dupont',
        level: 'CM2',
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
  });

  test('cancel flow: add student → back to prospects without saving', async () => {
    // Commencer directement sur la page AddStudent
    const TestAddStudentPage = () => (
      <BrowserRouter>
        <Routes>
          <Route path="/families/:familyId/add-student" element={<AddStudent />} />
          <Route path="/prospects" element={<div>Prospects Page</div>} />
        </Routes>
      </BrowserRouter>
    );
    
    // Mock des paramètres URL
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ familyId: 'family-1' }),
      useSearchParams: () => [new URLSearchParams('returnTo=prospects')]
    }));

    render(<TestAddStudentPage />);
    
    // Vérifier que la page se charge
    expect(screen.getByText('Ajouter un nouveau bénéficiaire')).toBeInTheDocument();
    
    // Remplir partiellement le formulaire
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Jean' }
    });
    
    // Annuler
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    // Vérifier qu'aucun appel API n'a été fait
    expect(mockFamilyService.addStudent).not.toHaveBeenCalled();
  });

  test('validation prevents submission with incomplete required fields', async () => {
    const TestAddStudentPage = () => (
      <BrowserRouter>
        <Routes>
          <Route path="/families/:familyId/add-student" element={<AddStudent />} />
        </Routes>
      </BrowserRouter>
    );
    
    render(<TestAddStudentPage />);
    
    // Remplir seulement le prénom
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Jean' }
    });
    
    // Le bouton doit rester désactivé
    const saveButton = screen.getByText('Ajouter l\'élève');
    expect(saveButton).toBeDisabled();
    
    // Tenter de cliquer (ne devrait rien faire)
    fireEvent.click(saveButton);
    
    // Vérifier qu'aucun appel API n'a été fait
    expect(mockFamilyService.addStudent).not.toHaveBeenCalled();
    
    // Remplir le nom aussi
    fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: 'Dupont' }
    });
    
    // Maintenant le bouton doit être activé
    expect(saveButton).not.toBeDisabled();
  });

  test('handles API error gracefully during submission', async () => {
    mockFamilyService.addStudent = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const TestAddStudentPage = () => (
      <BrowserRouter>
        <Routes>
          <Route path="/families/:familyId/add-student" element={<AddStudent />} />
        </Routes>
      </BrowserRouter>
    );
    
    render(<TestAddStudentPage />);
    
    // Remplir le formulaire complet
    fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: 'Jean' }
    });
    fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: 'Dupont' }
    });
    
    // Soumettre
    const saveButton = screen.getByText('Ajouter l\'élève');
    fireEvent.click(saveButton);
    
    // Vérifier que l'erreur s'affiche
    await waitFor(() => {
      expect(screen.getByText(/Erreur lors de l'ajout de l'élève/)).toBeInTheDocument();
    });
    
    // Vérifier que l'utilisateur reste sur la page
    expect(screen.getByText('Ajouter un nouveau bénéficiaire')).toBeInTheDocument();
  });

  test('example data fills all fields correctly', async () => {
    const TestAddStudentPage = () => (
      <BrowserRouter>
        <Routes>
          <Route path="/families/:familyId/add-student" element={<AddStudent />} />
        </Routes>
      </BrowserRouter>
    );
    
    render(<TestAddStudentPage />);
    
    // Cliquer sur le bouton d'exemple
    const exampleButton = screen.getByText('📝 Exemple');
    fireEvent.click(exampleButton);
    
    // Vérifier que tous les champs sont remplis
    expect(screen.getByDisplayValue('Marie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5ème')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2009-03-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Collège Victor Hugo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('marie.dupont@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('06 12 34 56 78')).toBeInTheDocument();
    
    // Le bouton de sauvegarde doit être activé
    const saveButton = screen.getByText('Ajouter l\'élève');
    expect(saveButton).not.toBeDisabled();
  });
});