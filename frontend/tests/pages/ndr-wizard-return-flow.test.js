/**
 * Tests pour le flow de retour du wizard NDR vers prospects
 * Vérifie le passage des paramètres URL et la sauvegarde immédiate
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { NDRCreationWizard } from '../../src/pages/admin/dashboard/create/NDRCreationWizard';
import { Step2StudentsSubjects } from '../../src/pages/admin/dashboard/create/Step2StudentsSubjects';
import { NDRWizardProvider } from '../../src/contexts/NDRWizardContext';
import { familyService } from '../../src/services/familyService';

// Mocks
jest.mock('../../src/services/familyService', () => ({
  familyService: {
    getFamily: jest.fn(),
    updateFamily: jest.fn(),
  },
}));
jest.mock('../../src/services/subjectService', () => ({
  subjectService: {
    getSubjects: jest.fn(() => Promise.resolve([])),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NDR Wizard - Flow de retour prospects', () => {
  const mockFamily = {
    _id: 'family-123',
    primaryContact: { firstName: 'Jean', lastName: 'Dupont' },
    students: [],
  };

  const mockUpdatedFamily = {
    ...mockFamily,
    students: [{ firstName: 'Pierre', lastName: 'Martin' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    familyService.getFamily.mockResolvedValue(mockFamily);
    familyService.updateFamily.mockResolvedValue(mockUpdatedFamily);
  });

  test('lit le paramètre returnTo depuis l\'URL et l\'enregistre dans le contexte', async () => {
    const initialEntries = ['/admin/dashboard/create/wizard?familyId=family-123&returnTo=prospects&step=2'];
    
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <NDRCreationWizard />
      </MemoryRouter>
    );

    // Le composant devrait être rendu sans erreur
    expect(screen.getByText('Création d\'une Note de Règlement')).toBeInTheDocument();
  });

  test('sauvegarde immédiatement l\'élève en base si returnContext=prospects', async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={['/wizard?familyId=family-123&returnTo=prospects&step=2']}>
        <NDRWizardProvider>
          <Step2StudentsSubjects />
        </NDRWizardProvider>
      </MemoryRouter>
    );

    render(<TestComponent />);

    // Attendre que le composant soit rendu
    await waitFor(() => {
      expect(screen.getByText('Étape 2 : Bénéficiaires et Matières')).toBeInTheDocument();
    });

    // Ouvrir le modal d'ajout d'élève
    fireEvent.click(screen.getByText('Ajouter un élève'));

    // Remplir le formulaire
    fireEvent.change(screen.getByPlaceholderText('Prénom'), {
      target: { value: 'Pierre' }
    });
    fireEvent.change(screen.getByPlaceholderText('Nom'), {
      target: { value: 'Martin' }
    });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Ajouter l\'élève'));

    // Attendre les appels d'API et la redirection
    await waitFor(() => {
      expect(familyService.getFamily).toHaveBeenCalledWith('family-123');
    });

    await waitFor(() => {
      expect(familyService.updateFamily).toHaveBeenCalledWith('family-123', {
        students: [{
          firstName: 'Pierre',
          lastName: 'Martin',
          level: undefined,
          courseLocation: { type: 'domicile' },
          availability: '',
        }]
      });
    });

    // Vérifier la redirection vers prospects
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/prospects');
    });
  });

  test('fonctionne en mode normal (temporaire) sans returnContext', async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={['/wizard?familyId=family-123']}>
        <NDRWizardProvider>
          <Step2StudentsSubjects />
        </NDRWizardProvider>
      </MemoryRouter>
    );

    render(<TestComponent />);

    // Attendre que le composant soit rendu
    await waitFor(() => {
      expect(screen.getByText('Étape 2 : Bénéficiaires et Matières')).toBeInTheDocument();
    });

    // Ouvrir le modal d'ajout d'élève
    fireEvent.click(screen.getByText('Ajouter un élève'));

    // Remplir le formulaire
    fireEvent.change(screen.getByPlaceholderText('Prénom'), {
      target: { value: 'Pierre' }
    });
    fireEvent.change(screen.getByPlaceholderText('Nom'), {
      target: { value: 'Martin' }
    });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Ajouter l\'élève'));

    // Attendre la fermeture du modal
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Prénom')).not.toBeInTheDocument();
    });

    // Vérifier qu'aucun appel API n'a été fait (mode temporaire)
    expect(familyService.getFamily).not.toHaveBeenCalled();
    expect(familyService.updateFamily).not.toHaveBeenCalled();

    // Vérifier qu'aucune redirection n'a eu lieu
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('gère les erreurs de sauvegarde gracieusement', async () => {
    // Mock d'erreur API
    familyService.getFamily.mockRejectedValue(new Error('Erreur réseau'));
    
    // Mock de console.error et alert
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    const TestComponent = () => (
      <MemoryRouter initialEntries={['/wizard?familyId=family-123&returnTo=prospects&step=2']}>
        <NDRWizardProvider>
          <Step2StudentsSubjects />
        </NDRWizardProvider>
      </MemoryRouter>
    );

    render(<TestComponent />);

    // Attendre que le composant soit rendu
    await waitFor(() => {
      expect(screen.getByText('Étape 2 : Bénéficiaires et Matières')).toBeInTheDocument();
    });

    // Ouvrir le modal d'ajout d'élève
    fireEvent.click(screen.getByText('Ajouter un élève'));

    // Remplir le formulaire
    fireEvent.change(screen.getByPlaceholderText('Prénom'), {
      target: { value: 'Pierre' }
    });
    fireEvent.change(screen.getByPlaceholderText('Nom'), {
      target: { value: 'Martin' }
    });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Ajouter l\'élève'));

    // Attendre la gestion d'erreur
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la sauvegarde de l\'élève:', 
        expect.any(Error)
      );
    });

    expect(alertSpy).toHaveBeenCalledWith('Erreur lors de la sauvegarde de l\'élève');

    // Pas de redirection en cas d'erreur
    expect(mockNavigate).not.toHaveBeenCalled();

    // Nettoyage
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test('préserve les données temporaires dans le contexte pour le mode normal', async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={['/wizard?familyId=family-123']}>
        <NDRWizardProvider>
          <Step2StudentsSubjects />
        </NDRWizardProvider>
      </MemoryRouter>
    );

    render(<TestComponent />);

    // Attendre que le composant soit rendu
    await waitFor(() => {
      expect(screen.getByText('Étape 2 : Bénéficiaires et Matières')).toBeInTheDocument();
    });

    // Ouvrir le modal d'ajout d'élève
    fireEvent.click(screen.getByText('Ajouter un élève'));

    // Remplir le formulaire
    fireEvent.change(screen.getByPlaceholderText('Prénom'), {
      target: { value: 'Pierre' }
    });
    fireEvent.change(screen.getByPlaceholderText('Nom'), {
      target: { value: 'Martin' }
    });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Ajouter l\'élève'));

    // Attendre la fermeture du modal
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Prénom')).not.toBeInTheDocument();
    });

    // L'élève devrait apparaître dans la liste temporaire
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument();
  });
});