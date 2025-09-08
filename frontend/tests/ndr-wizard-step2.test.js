/**
 * Tests pour Step 2 du wizard NDR - Élèves et Matières
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NDRCreationWizard } from '../src/pages/admin/dashboard/create/NDRCreationWizard';
import { familyService } from '../src/services/familyService';
import { subjectService } from '../src/services/subjectService';

// Mock des services
jest.mock('../src/services/familyService', () => ({
  familyService: {
    getFamilies: jest.fn(),
    getFamily: jest.fn(),
  }
}));

jest.mock('../src/services/subjectService', () => ({
  subjectService: {
    getSubjects: jest.fn(),
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
    status: 'client',
    companyInfo: {},
    students: [
      {
        _id: 'student1',
        firstName: 'Alice',
        lastName: 'Dupont',
        level: 'Terminale S',
        courseLocation: {
          type: 'domicile',
          address: {
            street: '123 Rue Test',
            city: 'Paris', 
            postalCode: '75001'
          }
        },
        availability: 'Lundi-Mercredi 18h-20h'
      },
      {
        _id: 'student2', 
        firstName: 'Bob',
        lastName: 'Dupont',
        level: '1ère ES',
        courseLocation: {
          type: 'professeur',
          address: {
            street: '456 Avenue Prof',
            city: 'Paris',
            postalCode: '75002'
          }
        }
      }
    ]
  }
];

const mockSubjects = [
  {
    _id: 'subject1',
    name: 'Mathématiques',
    description: 'Cours de mathématiques niveau lycée'
  },
  {
    _id: 'subject2',
    name: 'Physique-Chimie',
    description: 'Cours de sciences physiques'
  },
  {
    _id: 'subject3',
    name: 'Anglais',
    description: 'Cours d\'anglais tous niveaux'
  }
];

const WizardWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('NDR Wizard - Step 2 Élèves et Matières', () => {
  beforeEach(() => {
    familyService.getFamilies.mockResolvedValue(mockFamilies);
    familyService.getFamily.mockResolvedValue(mockFamilies[0]);
    subjectService.getSubjects.mockResolvedValue(mockSubjects);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const navigateToStep2 = async () => {
    await act(async () => {
      render(
        <WizardWrapper>
          <NDRCreationWizard />
        </WizardWrapper>
      );
    });

    // Sélectionner une famille dans Step 1
    await waitFor(() => {
      const familyCard = screen.getByText('Jean Dupont').closest('div');
      act(() => {
        fireEvent.click(familyCard);
      });
    });

    // Passer à Step 2
    await waitFor(() => {
      const nextButton = screen.getByText(/Suivant.*Élèves/);
      act(() => {
        fireEvent.click(nextButton);
      });
    });

    // Attendre que Step 2 soit chargé
    await waitFor(() => {
      expect(screen.getByText('Étape 2 : Élèves et Matières')).toBeInTheDocument();
    });
  };

  describe('Chargement et affichage', () => {
    test('devrait afficher Step 2 avec les élèves de la famille', async () => {
      await navigateToStep2();

      // Vérifier que les élèves sont affichés
      await waitFor(() => {
        expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
        expect(screen.getByText('Bob Dupont')).toBeInTheDocument();
        expect(screen.getByText('Niveau: Terminale S')).toBeInTheDocument();
        expect(screen.getByText('Niveau: 1ère ES')).toBeInTheDocument();
      });
    });

    test('devrait charger les matières disponibles', async () => {
      await navigateToStep2();

      // Ouvrir la modal de sélection des matières
      const selectSubjectsButton = screen.getByText(/Sélectionner des matières/);
      fireEvent.click(selectSubjectsButton);

      // Vérifier que les matières sont affichées dans la modal
      await waitFor(() => {
        expect(screen.getByText('Mathématiques')).toBeInTheDocument();
        expect(screen.getByText('Physique-Chimie')).toBeInTheDocument();
        expect(screen.getByText('Anglais')).toBeInTheDocument();
      });
    });

    test('devrait afficher un message quand aucun élève trouvé', async () => {
      // Mock famille sans élèves
      const familyWithoutStudents = {
        ...mockFamilies[0],
        students: []
      };
      familyService.getFamily.mockResolvedValue(familyWithoutStudents);

      await navigateToStep2();

      expect(screen.getByText('Aucun élève trouvé pour cette famille.')).toBeInTheDocument();
      expect(screen.getByText('Vous pouvez ajouter un élève depuis l\'étape précédente.')).toBeInTheDocument();
    });
  });

  describe('Sélection des élèves', () => {
    test('devrait permettre de sélectionner des élèves', async () => {
      await navigateToStep2();

      // Sélectionner Alice en utilisant l'ID du checkbox
      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      fireEvent.click(aliceCheckbox);

      // Vérifier que l'élève est sélectionné visuellement
      expect(aliceCheckbox).toBeChecked();
      
      // Vérifier que les détails de l'élève apparaissent
      await waitFor(() => {
        expect(screen.getByText('Informations complémentaires des élèves')).toBeInTheDocument();
      });
    });

    test('devrait permettre de sélectionner plusieurs élèves', async () => {
      await navigateToStep2();

      // Sélectionner Alice et Bob
      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      const bobCheckbox = screen.getByRole('checkbox', { name: 'Bob Dupont' });
      
      fireEvent.click(aliceCheckbox);
      fireEvent.click(bobCheckbox);

      expect(aliceCheckbox).toBeChecked();
      expect(bobCheckbox).toBeChecked();
    });

    test('devrait désélectionner un élève', async () => {
      await navigateToStep2();

      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      
      // Sélectionner puis désélectionner
      fireEvent.click(aliceCheckbox);
      expect(aliceCheckbox).toBeChecked();
      
      fireEvent.click(aliceCheckbox);
      expect(aliceCheckbox).not.toBeChecked();
    });
  });

  describe('Détails des élèves', () => {
    test('devrait afficher les formulaires de détails pour les élèves sélectionnés', async () => {
      await navigateToStep2();

      // Sélectionner Alice
      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      fireEvent.click(aliceCheckbox);

      // Vérifier que les champs de détails apparaissent
      await waitFor(() => {
        expect(screen.getByText('Informations complémentaires des élèves')).toBeInTheDocument();
        expect(screen.getByLabelText('Lieu des cours *')).toBeInTheDocument();
        expect(screen.getByLabelText('Adresse des cours *')).toBeInTheDocument();
        expect(screen.getByLabelText('Ville *')).toBeInTheDocument();
        expect(screen.getByLabelText('Code postal *')).toBeInTheDocument();
        expect(screen.getByLabelText('Disponibilités')).toBeInTheDocument();
      });
    });

    test('devrait pré-remplir les informations existantes de l\'élève', async () => {
      await navigateToStep2();

      // Sélectionner Alice
      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      fireEvent.click(aliceCheckbox);

      await waitFor(() => {
        const locationSelect = screen.getByLabelText('Lieu des cours *');
        expect(locationSelect.value).toBe('domicile');
        
        const streetInput = screen.getByLabelText('Adresse des cours *');
        expect(streetInput.value).toBe('123 Rue Test');
        
        const availabilityTextarea = screen.getByLabelText('Disponibilités');
        expect(availabilityTextarea.value).toBe('Lundi-Mercredi 18h-20h');
      });
    });

    test('devrait permettre de modifier les détails de l\'élève', async () => {
      await navigateToStep2();

      // Sélectionner Alice
      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      fireEvent.click(aliceCheckbox);

      await waitFor(() => {
        const locationSelect = screen.getByLabelText('Lieu des cours *');
        fireEvent.change(locationSelect, { target: { value: 'professeur' } });
        expect(locationSelect.value).toBe('professeur');

        const streetInput = screen.getByLabelText('Adresse des cours *');
        fireEvent.change(streetInput, { target: { value: '789 Nouvelle Rue' } });
        expect(streetInput.value).toBe('789 Nouvelle Rue');
      });
    });

    test('devrait afficher le champ de précisions pour le lieu "autre"', async () => {
      await navigateToStep2();

      // Sélectionner Alice
      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      fireEvent.click(aliceCheckbox);

      await waitFor(() => {
        const locationSelect = screen.getByLabelText('Lieu des cours *');
        fireEvent.change(locationSelect, { target: { value: 'autre' } });

        // Vérifier que le champ de précisions apparaît
        expect(screen.getByLabelText('Précisions lieu (autre)')).toBeInTheDocument();
      });
    });
  });

  describe('Sélection des matières', () => {
    test('devrait ouvrir la modal de sélection des matières', async () => {
      await navigateToStep2();

      const selectButton = screen.getByText(/Sélectionner des matières/);
      fireEvent.click(selectButton);

      // Vérifier que la modal s'ouvre
      await waitFor(() => {
        expect(screen.getByText('Sélectionner les matières')).toBeInTheDocument();
        expect(screen.getByText('Mathématiques')).toBeInTheDocument();
        expect(screen.getByText('Physique-Chimie')).toBeInTheDocument();
        expect(screen.getByText('Anglais')).toBeInTheDocument();
      });
    });

    test('devrait permettre de sélectionner des matières', async () => {
      await navigateToStep2();

      // Ouvrir la modal
      const selectButton = screen.getByText(/Sélectionner des matières/);
      fireEvent.click(selectButton);

      await waitFor(() => {
        // Sélectionner Mathématiques et Anglais
        const mathCheckbox = screen.getByRole('checkbox', { name: /Mathématiques/ });
        const englishCheckbox = screen.getByRole('checkbox', { name: /Anglais/ });
        
        fireEvent.click(mathCheckbox);
        fireEvent.click(englishCheckbox);

        expect(mathCheckbox).toBeChecked();
        expect(englishCheckbox).toBeChecked();

        // Vérifier le compteur
        expect(screen.getByText('2 matière(s) sélectionnée(s)')).toBeInTheDocument();
      });
    });

    test('devrait confirmer la sélection et fermer la modal', async () => {
      await navigateToStep2();

      // Ouvrir la modal et sélectionner des matières
      const selectButton = screen.getByText(/Sélectionner des matières/);
      fireEvent.click(selectButton);

      await waitFor(() => {
        const mathCheckbox = screen.getByRole('checkbox', { name: /Mathématiques/ });
        fireEvent.click(mathCheckbox);

        const confirmButton = screen.getByText('Confirmer la sélection');
        fireEvent.click(confirmButton);
      });

      // Vérifier que la modal se ferme et que les matières sont affichées
      await waitFor(() => {
        expect(screen.queryByText('Sélectionner les matières')).not.toBeInTheDocument();
        expect(screen.getByText('1 matière(s) sélectionnée(s):')).toBeInTheDocument();
        expect(screen.getByText('Mathématiques')).toBeInTheDocument();
      });
    });

    test('devrait permettre d\'annuler la sélection', async () => {
      await navigateToStep2();

      // Ouvrir la modal
      const selectButton = screen.getByText(/Sélectionner des matières/);
      fireEvent.click(selectButton);

      await waitFor(() => {
        // Sélectionner une matière
        const mathCheckbox = screen.getByRole('checkbox', { name: /Mathématiques/ });
        fireEvent.click(mathCheckbox);

        // Annuler
        const cancelButton = screen.getByText('Annuler');
        fireEvent.click(cancelButton);
      });

      // Vérifier que la modal se ferme sans sauvegarder
      await waitFor(() => {
        expect(screen.queryByText('Sélectionner les matières')).not.toBeInTheDocument();
        expect(screen.getByText('Aucune matière sélectionnée')).toBeInTheDocument();
      });
    });
  });

  describe('Validation et navigation', () => {
    test('devrait empêcher la progression sans élève sélectionné', async () => {
      await navigateToStep2();

      const nextButton = screen.getByText(/Suivant.*Tarifs/);
      expect(nextButton).toBeDisabled();
    });

    test('devrait empêcher la progression sans matière sélectionnée', async () => {
      await navigateToStep2();

      // Sélectionner un élève mais pas de matière
      const aliceCheckbox = screen.getByLabelText('Alice Dupont');
      fireEvent.click(aliceCheckbox);

      const nextButton = screen.getByText(/Suivant.*Tarifs/);
      expect(nextButton).toBeDisabled();
    });

    test('devrait permettre la progression avec élève et matière sélectionnés', async () => {
      await navigateToStep2();

      // Sélectionner un élève
      const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice Dupont' });
      fireEvent.click(aliceCheckbox);

      // Sélectionner une matière
      const selectButton = screen.getByText(/Sélectionner des matières/);
      fireEvent.click(selectButton);

      await waitFor(() => {
        const mathCheckbox = screen.getByRole('checkbox', { name: /Mathématiques/ });
        fireEvent.click(mathCheckbox);
        
        const confirmButton = screen.getByText('Confirmer la sélection');
        fireEvent.click(confirmButton);
      });

      // Vérifier que le bouton suivant est activé
      await waitFor(() => {
        const nextButton = screen.getByText(/Suivant.*Tarifs/);
        expect(nextButton).not.toBeDisabled();
      });
    });

    test('devrait permettre de revenir à l\'étape précédente', async () => {
      await navigateToStep2();

      const backButton = screen.getByText(/Retour.*Client/);
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Étape 1 : Informations Client')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait afficher les erreurs de validation', async () => {
      await navigateToStep2();

      // Essayer de passer à l'étape suivante sans élève ni matière
      const nextButton = screen.getByText(/Suivant.*Tarifs/);
      fireEvent.click(nextButton);

      // Le bouton doit être désactivé car aucun élève/matière n'est sélectionné
      expect(nextButton).toBeDisabled();
      
      // Vérifier qu'on reste sur Step 2
      expect(screen.getByText('Étape 2 : Élèves et Matières')).toBeInTheDocument();
    });
  });
});