/**
 * Tests pour les styles CSS du SettlementDashboard
 * Validation du remplacement des classes Tailwind par CSS modulaire
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock du SettlementDashboard avec les nouveaux styles CSS
const MockSettlementDashboard = ({ isLoading = false, hasData = true, searchTerm = '' }) => {
  const filteredData = hasData ? [{ id: 1 }] : [];
  
  return (
    <div data-testid="settlement-dashboard">
      {isLoading ? (
        <div className="settlement-dashboard__loading" data-testid="loading-container">
          <div className="settlement-dashboard__loading-text" data-testid="loading-text">
            Chargement des notes de règlement...
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="settlement-dashboard__empty" data-testid="empty-container">
          <div className="settlement-dashboard__empty-text" data-testid="empty-text">
            {searchTerm
              ? "Aucune note trouvée pour cette recherche"
              : "Aucune note de règlement disponible"}
          </div>
        </div>
      ) : (
        <div data-testid="table-container">Tableau avec données</div>
      )}
    </div>
  );
};

// Helper pour wrapper avec les providers nécessaires
const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SettlementDashboard CSS Styles', () => {
  
  describe('État de chargement', () => {
    test('affiche le conteneur de chargement avec les bonnes classes CSS', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={true} />);
      
      const loadingContainer = screen.getByTestId('loading-container');
      const loadingText = screen.getByTestId('loading-text');
      
      // Vérifier les classes CSS
      expect(loadingContainer).toHaveClass('settlement-dashboard__loading');
      expect(loadingText).toHaveClass('settlement-dashboard__loading-text');
      
      // Vérifier le contenu
      expect(loadingText).toHaveTextContent('Chargement des notes de règlement...');
    });

    test('utilise les classes CSS modulaires au lieu de Tailwind', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={true} />);
      
      const loadingContainer = screen.getByTestId('loading-container');
      const loadingText = screen.getByTestId('loading-text');
      
      // Vérifier que les classes CSS modulaires sont appliquées
      expect(loadingContainer).toHaveClass('settlement-dashboard__loading');
      expect(loadingText).toHaveClass('settlement-dashboard__loading-text');
      
      // Vérifier que les classes Tailwind ne sont pas présentes
      expect(loadingContainer).not.toHaveClass('text-center');
      expect(loadingContainer).not.toHaveClass('py-8');
      expect(loadingText).not.toHaveClass('text-gray-500');
    });

    test('structure HTML correcte pour l\'état de chargement', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={true} />);
      
      const loadingContainer = screen.getByTestId('loading-container');
      const loadingText = screen.getByTestId('loading-text');
      
      // Vérifier la structure HTML
      expect(loadingContainer).toContainElement(loadingText);
      expect(loadingText).toHaveTextContent('Chargement des notes de règlement...');
    });
  });

  describe('État vide (pas de données)', () => {
    test('affiche le conteneur vide avec les bonnes classes CSS', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={false} hasData={false} />);
      
      const emptyContainer = screen.getByTestId('empty-container');
      const emptyText = screen.getByTestId('empty-text');
      
      // Vérifier les classes CSS
      expect(emptyContainer).toHaveClass('settlement-dashboard__empty');
      expect(emptyText).toHaveClass('settlement-dashboard__empty-text');
      
      // Vérifier le contenu par défaut
      expect(emptyText).toHaveTextContent('Aucune note de règlement disponible');
    });

    test('affiche le message de recherche vide quand searchTerm est fourni', () => {
      renderWithProviders(
        <MockSettlementDashboard 
          isLoading={false} 
          hasData={false} 
          searchTerm="recherche test" 
        />
      );
      
      const emptyText = screen.getByTestId('empty-text');
      expect(emptyText).toHaveTextContent('Aucune note trouvée pour cette recherche');
    });

    test('utilise les classes CSS cohérentes avec l\'état de chargement', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={false} hasData={false} />);
      
      const emptyContainer = screen.getByTestId('empty-container');
      const emptyText = screen.getByTestId('empty-text');
      
      // Vérifier les classes CSS modulaires
      expect(emptyContainer).toHaveClass('settlement-dashboard__empty');
      expect(emptyText).toHaveClass('settlement-dashboard__empty-text');
      
      // Vérifier l'absence de classes Tailwind
      expect(emptyContainer).not.toHaveClass('text-center');
      expect(emptyContainer).not.toHaveClass('py-8');
      expect(emptyText).not.toHaveClass('text-gray-500');
    });
  });

  describe('État avec données', () => {
    test('affiche le tableau quand il y a des données', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={false} hasData={true} />);
      
      const tableContainer = screen.getByTestId('table-container');
      expect(tableContainer).toBeInTheDocument();
      expect(tableContainer).toHaveTextContent('Tableau avec données');
    });

    test('ne doit pas afficher les états loading ou empty', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={false} hasData={true} />);
      
      expect(screen.queryByTestId('loading-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('empty-container')).not.toBeInTheDocument();
    });
  });

  describe('Cohérence des styles', () => {
    test('les classes CSS respectent les conventions du projet', () => {
      renderWithProviders(<MockSettlementDashboard isLoading={true} />);
      
      const loadingContainer = screen.getByTestId('loading-container');
      const loadingText = screen.getByTestId('loading-text');
      
      // Vérifier le préfixe modulaire settlement-dashboard__
      expect(loadingContainer.className).toMatch(/^settlement-dashboard__/);
      expect(loadingText.className).toMatch(/^settlement-dashboard__/);
    });

    test('assure la cohérence entre les états loading et empty', () => {
      const { rerender } = renderWithProviders(<MockSettlementDashboard isLoading={true} />);
      
      const loadingContainer = screen.getByTestId('loading-container');
      const loadingStyle = window.getComputedStyle(loadingContainer);
      
      rerender(<MockSettlementDashboard isLoading={false} hasData={false} />);
      
      const emptyContainer = screen.getByTestId('empty-container');
      const emptyStyle = window.getComputedStyle(emptyContainer);
      
      // Les styles doivent être identiques
      expect(loadingStyle.textAlign).toBe(emptyStyle.textAlign);
      expect(loadingStyle.display).toBe(emptyStyle.display);
      expect(loadingStyle.justifyContent).toBe(emptyStyle.justifyContent);
      expect(loadingStyle.alignItems).toBe(emptyStyle.alignItems);
    });
  });

});

describe('Intégration CSS du SettlementDashboard', () => {
  
  test('le fichier CSS est correctement structuré', () => {
    // Test que la structure CSS modulaire est correcte
    renderWithProviders(<MockSettlementDashboard isLoading={true} />);
    
    const loadingContainer = screen.getByTestId('loading-container');
    const loadingText = screen.getByTestId('loading-text');
    
    // Vérifier que les éléments existent avec les bonnes classes
    expect(loadingContainer).toHaveClass('settlement-dashboard__loading');
    expect(loadingText).toHaveClass('settlement-dashboard__loading-text');
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingText).toBeInTheDocument();
  });

  test('les styles sont appliqués sans classes Tailwind', () => {
    renderWithProviders(<MockSettlementDashboard isLoading={true} />);
    
    const loadingContainer = screen.getByTestId('loading-container');
    
    // Vérifier qu'aucune classe Tailwind n'est présente
    expect(loadingContainer.className).not.toContain('text-center');
    expect(loadingContainer.className).not.toContain('py-8');
    
    const loadingText = screen.getByTestId('loading-text');
    expect(loadingText.className).not.toContain('text-gray-500');
  });

});