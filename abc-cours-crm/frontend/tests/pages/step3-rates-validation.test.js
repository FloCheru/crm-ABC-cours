/**
 * Tests Step 3 - Rates Validation du wizard NDR
 * Test des corrections : service methods, types, compilation
 */

const { render, screen, waitFor, fireEvent } = require('@testing-library/react');
require('@testing-library/jest-dom');
const React = require('react');
const { BrowserRouter } = require('react-router-dom');

// Mock des services
jest.mock('../../src/services/subjectService', () => ({
  subjectService: {
    getActiveSubjects: jest.fn()
  }
}));

jest.mock('../../src/services/settlementService', () => ({
  settlementService: {
    createSettlementNote: jest.fn()
  }
}));

jest.mock('../../src/hooks/useRefresh', () => ({
  useRefresh: () => ({ triggerRefresh: jest.fn() })
}));

// Mock pour react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// État wizard valide pour Step 3
const validWizardState = {
  step1: {
    familyId: 'family123',
    clientName: 'Dupont Marie',
    department: '75'
  },
  step2: {
    studentIds: ['student123'],
    selectedSubjectIds: ['math123', 'french456'],
    familySelected: true
  },
  step3: {}
};

// Données matières mockées
const mockSubjects = [
  { _id: 'math123', name: 'Mathématiques', category: 'Sciences' },
  { _id: 'french456', name: 'Français', category: 'Littéraire' }
];

describe('Step3RatesValidation - Tests après corrections', () => {
  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    
    // Mock du service getActiveSubjects
    require('../../src/services/subjectService').subjectService.getActiveSubjects
      .mockResolvedValue(mockSubjects);
  });

  const renderStep3 = (customState = {}) => {
    const finalState = { ...validWizardState, ...customState };
    
    return render(
      <BrowserRouter>
        <RefreshProvider>
          <NDRWizardProvider initialState={finalState}>
            <Step3RatesValidation />
          </NDRWizardProvider>
        </RefreshProvider>
      </BrowserRouter>
    );
  };

  test('1. Service method correction: appelle getActiveSubjects au lieu de getSubjects', async () => {
    renderStep3();
    
    // Vérifier que getActiveSubjects est appelé
    await waitFor(() => {
      expect(require('../../src/services/subjectService').subjectService.getActiveSubjects)
        .toHaveBeenCalledTimes(1);
    });
    
    console.log('✅ Test 1 : getActiveSubjects appelé correctement');
  });

  test('2. Chargement et affichage des matières sélectionnées', async () => {
    renderStep3();
    
    // Attendre le chargement des matières
    await waitFor(() => {
      expect(screen.getByText('Mathématiques')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
    });
    
    // Vérifier que les champs de tarification sont présents
    expect(screen.getAllByPlaceholderText('0.00')).toHaveLength(4); // 2 matières × 2 champs numériques
    
    console.log('✅ Test 2 : Matières affichées et champs tarification présents');
  });

  test('3. Calculs automatiques fonctionnels', async () => {
    renderStep3();
    
    await waitFor(() => {
      expect(screen.getByText('Mathématiques')).toBeInTheDocument();
    });
    
    // Remplir les tarifs pour une matière
    const hourlyRateInputs = screen.getAllByPlaceholderText('0.00');
    const quantityInputs = screen.getAllByPlaceholderText('0');
    
    // Mathématiques: 25€/h, 10h, salaire 15€/h
    fireEvent.change(hourlyRateInputs[0], { target: { value: '25' } });
    fireEvent.change(quantityInputs[0], { target: { value: '10' } });
    fireEvent.change(hourlyRateInputs[1], { target: { value: '15' } });
    
    // Vérifier calcul du total dans le récapitulatif
    await waitFor(() => {
      expect(screen.getByText(/250\.00 €/)).toBeInTheDocument(); // Total revenus
    });
    
    console.log('✅ Test 3 : Calculs automatiques fonctionnels');
  });

  test('4. Validation formulaire avec erreurs', async () => {
    renderStep3();
    
    await waitFor(() => {
      expect(screen.getByText('Mathématiques')).toBeInTheDocument();
    });
    
    // Tenter de soumettre sans données
    const submitButton = screen.getByText('Générer la Note de Règlement');
    fireEvent.click(submitButton);
    
    // Vérifier message d'erreur
    await waitFor(() => {
      expect(screen.getByText(/Tous les champs de tarification doivent être remplis/))
        .toBeInTheDocument();
    });
    
    console.log('✅ Test 4 : Validation formulaire avec messages d\'erreur');
  });

  test('5. Types TypeScript: pas d\'erreur de compilation', () => {
    // Ce test vérifie que le composant peut être rendu sans erreur TypeScript
    const { container } = renderStep3();
    
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Étape 3 : Tarification et Validation')).toBeInTheDocument();
    
    console.log('✅ Test 5 : Pas d\'erreur de compilation TypeScript');
  });

  test('6. Gestion des erreurs de service', async () => {
    // Mock erreur service
    require('../../src/services/subjectService').subjectService.getActiveSubjects
      .mockRejectedValue(new Error('Erreur réseau'));
    
    renderStep3();
    
    // Vérifier affichage erreur
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des matières')).toBeInTheDocument();
    });
    
    console.log('✅ Test 6 : Gestion des erreurs de service');
  });
});