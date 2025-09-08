/**
 * Tests pour le bouton "Ajouter un élève" dans le tableau des prospects
 * Vérifie le flow complet : affichage conditionnel -> navigation -> sauvegarde -> retour
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Prospects } from '../../src/pages/prospects/Prospects';
import { familyService } from '../../src/services/familyService';
import { useFamiliesCache } from '../../src/hooks/useFamiliesCache';

// Mocks
jest.mock('../../src/services/familyService');
jest.mock('../../src/hooks/useFamiliesCache');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockNavigate = require('react-router-dom').useNavigate;

describe('Prospects - Bouton Ajouter un élève', () => {
  const mockProspectWithoutStudents = {
    _id: 'family-123',
    status: 'prospect',
    primaryContact: {
      firstName: 'Jean',
      lastName: 'Dupont',
      primaryPhone: '0123456789',
    },
    address: {
      street: '123 rue Test',
      city: 'Paris',
      postalCode: '75001',
    },
    demande: {
      beneficiaryType: 'eleves',
      subjects: ['Mathématiques'],
    },
    students: [], // Aucun élève
    createdAt: new Date().toISOString(),
  };

  const mockProspectWithStudents = {
    ...mockProspectWithoutStudents,
    _id: 'family-456',
    students: [{ firstName: 'Pierre', lastName: 'Martin' }], // Avec élèves
  };

  const mockProspectAdult = {
    ...mockProspectWithoutStudents,
    _id: 'family-789',
    demande: {
      beneficiaryType: 'adulte', // Bénéficiaire adulte
      subjects: ['Anglais'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock du cache unifié avec données de test
    useFamiliesCache.mockReturnValue({
      familiesData: {
        families: [mockProspectWithoutStudents, mockProspectWithStudents, mockProspectAdult],
        prospects: [mockProspectWithoutStudents, mockProspectWithStudents, mockProspectAdult],
        clients: [],
      },
      isFromCache: false,
      isLoading: false,
      setCacheData: jest.fn(),
      getProspects: jest.fn(() => [mockProspectWithoutStudents, mockProspectWithStudents, mockProspectAdult]),
      getStats: jest.fn(() => ({ prospects: 3, total: 3 })),
    });
    
    mockNavigate.mockReturnValue(jest.fn());
  });

  test('affiche le bouton "Ajouter un élève" seulement pour beneficiaryType "eleves" sans élèves', () => {
    render(
      <BrowserRouter>
        <Prospects />
      </BrowserRouter>
    );

    // Vérifier que le bouton est affiché pour la famille sans élèves
    expect(screen.getByText('Ajouter un élève')).toBeInTheDocument();

    // Vérifier qu'il n'y a qu'un seul bouton (pas pour les autres cas)
    expect(screen.getAllByText('Ajouter un élève')).toHaveLength(1);
  });

  test('n\'affiche PAS le bouton pour beneficiaryType "adulte"', () => {
    render(
      <BrowserRouter>
        <Prospects />
      </BrowserRouter>
    );

    // Chercher "Adulte" dans le tableau
    expect(screen.getByText('Adulte')).toBeInTheDocument();
    
    // Vérifier qu'il n'y a qu'un seul bouton au total (pas pour l'adulte)
    expect(screen.getAllByText('Ajouter un élève')).toHaveLength(1);
  });

  test('n\'affiche PAS le bouton pour les familles avec élèves existants', () => {
    render(
      <BrowserRouter>
        <Prospects />
      </BrowserRouter>
    );

    // La famille avec élèves devrait afficher "Pierre Martin"
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument();
    
    // Vérifier qu'il n'y a qu'un seul bouton au total (pas pour cette famille)
    expect(screen.getAllByText('Ajouter un élève')).toHaveLength(1);
  });

  test('navigue vers le wizard avec les bons paramètres au clic', () => {
    const mockNavigateFunction = jest.fn();
    mockNavigate.mockReturnValue(mockNavigateFunction);

    render(
      <BrowserRouter>
        <Prospects />
      </BrowserRouter>
    );

    // Cliquer sur le bouton
    fireEvent.click(screen.getByText('Ajouter un élève'));

    // Vérifier la navigation avec les bons paramètres
    expect(mockNavigateFunction).toHaveBeenCalledWith(
      '/admin/dashboard/create/wizard?familyId=family-123&returnTo=prospects&step=2'
    );
  });

  test('empêche la propagation du clic sur la ligne du tableau', () => {
    const mockNavigateFunction = jest.fn();
    mockNavigate.mockReturnValue(mockNavigateFunction);

    render(
      <BrowserRouter>
        <Prospects />
      </BrowserRouter>
    );

    // Simuler un clic sur le bouton
    const button = screen.getByText('Ajouter un élève');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    
    // Espionner la méthode stopPropagation
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
    
    // Déclencher l'événement
    fireEvent.click(button, clickEvent);

    // Le clic sur le bouton devrait naviguer vers le wizard, pas vers les détails
    expect(mockNavigateFunction).toHaveBeenCalledWith(
      '/admin/dashboard/create/wizard?familyId=family-123&returnTo=prospects&step=2'
    );
    
    // La navigation vers les détails ne devrait PAS se produire
    expect(mockNavigateFunction).not.toHaveBeenCalledWith('/families/family-123');
  });

  test('affiche "Aucun élève" avec le bouton pour les familles sans élèves', () => {
    render(
      <BrowserRouter>
        <Prospects />
      </BrowserRouter>
    );

    // Vérifier le texte d'accompagnement
    expect(screen.getByText('Aucun élève')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un élève')).toBeInTheDocument();
  });
});