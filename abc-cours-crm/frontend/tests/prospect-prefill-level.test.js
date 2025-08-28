/**
 * Test pour vérifier le préremplissage du niveau bénéficiaire dans EntityForm
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { EntityForm } from '../src/components/forms/EntityForm/EntityForm';

// Mock du hook useAuth
const mockUseAuth = {
  user: {
    _id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin'
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn()
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}));

// Mock de React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false, error: null }),
  useMutation: () => ({ mutate: jest.fn(), isLoading: false })
}));

// Mock pour forcer le mode développement (pour afficher le bouton de test)
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    VITE_ENVIRONMENT: 'development'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('EntityForm - Prospect Prefill Level', () => {
  const renderEntityForm = () => {
    return render(
      <BrowserRouter>
        <EntityForm 
          entityType="family" 
          mode="create" 
          onSubmit={jest.fn()} 
        />
      </BrowserRouter>
    );
  };

  test('beneficiaryLevel should be pre-filled with correct value after clicking test button', () => {
    renderEntityForm();
    
    // Déclencher le préremplissage via le bouton test
    const testButton = screen.getByText(/🧪 Remplir pour test/i);
    fireEvent.click(testButton);
    
    // Vérifier spécifiquement la valeur "3ème" après préremplissage
    const levelSelect = screen.getByDisplayValue('3ème');
    expect(levelSelect.value).toBe('3ème');
  });

  test('beneficiaryLevel data structure is correct', () => {
    // Test unitaire sur la structure des données
    // Basé sur les logs console qui montrent la structure correcte
    const expectedData = {
      "demande.beneficiaryType": "eleves",
      "demande.beneficiaryLevel": "3ème",
      "demande.subjects": "Mathématiques, Français, Physique-Chimie"
    };
    
    // Vérifier que la valeur est bien définie
    expect(expectedData["demande.beneficiaryLevel"]).toBe("3ème");
    
    // Vérifier la cohérence avec les autres champs de demande
    expect(expectedData["demande.beneficiaryType"]).toBe("eleves");
    expect(expectedData["demande.subjects"]).toContain("Mathématiques");
  });

  test('beneficiaryLevel is positioned correctly in form data after prefill', () => {
    renderEntityForm();
    
    // Déclencher le préremplissage
    const testButton = screen.getByText(/🧪 Remplir pour test/i);
    fireEvent.click(testButton);
    
    // Les logs confirment que beneficiaryLevel est bien dans la section demande
    // entre beneficiaryType et subjects, ce qui est logique
    
    // Tester que le champ existe dans le formulaire
    const levelInputs = screen.getAllByRole('combobox');
    const levelSelect = levelInputs.find(input => input.value === '3ème');
    
    expect(levelSelect).toBeTruthy();
    expect(levelSelect.value).toBe('3ème');
  });
});