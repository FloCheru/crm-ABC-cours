/**
 * Tests pour vérifier que les boutons œil et crayon ont été retirés
 * du tableau des séries de coupons
 * 
 * Objectif : S'assurer que seuls les clics de ligne permettent la navigation
 * et que les boutons d'actions inutiles ont été supprimés
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Admin } from '../../src/pages/admin/coupons/Admin';
import { useCouponSeriesCache } from '../../src/hooks/useCouponSeriesCache';

// Mock du hook useCouponSeriesCache
jest.mock('../../src/hooks/useCouponSeriesCache');

// Mock react-router-dom pour tester la navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin/coupons' })
}));

// Données de test
const mockCouponSeriesData = {
  couponSeries: [
    {
      _id: 'series-001',
      familyId: {
        _id: 'family-001',
        primaryContact: {
          firstName: 'Jean',
          lastName: 'Dupont'
        }
      },
      studentId: {
        _id: 'student-001',
        firstName: 'Pierre',
        lastName: 'Dupont',
        level: '3ème'
      },
      subject: {
        _id: 'subject-001',
        name: 'Mathématiques'
      },
      totalCoupons: 10,
      usedCoupons: 3,
      hourlyRate: 25.0,
      status: 'active',
      createdAt: '2024-01-15T10:00:00.000Z',
      createdBy: {
        firstName: 'Admin',
        lastName: 'User'
      }
    },
    {
      _id: 'series-002',
      familyId: {
        _id: 'family-002',
        primaryContact: {
          firstName: 'Marie',
          lastName: 'Martin'
        }
      },
      studentId: {
        _id: 'student-002',
        firstName: 'Sophie',
        lastName: 'Martin',
        level: 'Terminal'
      },
      subject: {
        _id: 'subject-002',
        name: 'Physique'
      },
      totalCoupons: 15,
      usedCoupons: 0,
      hourlyRate: 30.0,
      status: 'active',
      createdAt: '2024-01-20T14:30:00.000Z',
      createdBy: {
        firstName: 'Admin',
        lastName: 'User'
      }
    }
  ],
  totalSeries: 2
};

const mockUseCouponSeriesCache = useCouponSeriesCache;

describe('Table Actions Removed', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseCouponSeriesCache.mockReturnValue({
      couponSeriesData: mockCouponSeriesData,
      isFromCache: false,
      isLoading: false
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );
  };

  test('should not display view (👁️) buttons in table actions', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier que les boutons œil ne sont pas présents
    const eyeButtons = screen.queryAllByText('👁️');
    expect(eyeButtons).toHaveLength(0);
  });

  test('should not display edit (✏️) buttons in table actions', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier que les boutons crayon ne sont pas présents
    const editButtons = screen.queryAllByText('✏️');
    expect(editButtons).toHaveLength(0);
    
    // Vérifier aussi les variantes possibles du crayon
    const pencilButtons = screen.queryAllByText('📝');
    expect(pencilButtons).toHaveLength(0);
  });

  test('should only display delete (✕) buttons in table actions', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier que seuls les boutons de suppression sont présents
    const deleteButtons = screen.getAllByText('✕');
    expect(deleteButtons).toHaveLength(2); // Une pour chaque série
  });

  test('should navigate to series details when clicking on table row', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Cliquer sur la première ligne
    const firstRow = screen.getByText('Jean Dupont').closest('tr');
    expect(firstRow).toBeInTheDocument();
    
    fireEvent.click(firstRow);

    // Vérifier que la navigation se fait uniquement par le clic de ligne
    expect(mockNavigate).toHaveBeenCalledWith('/admin/coupons/series-001/coupons');
  });

  test('should not have handleViewCoupons function calls', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier qu'aucun bouton avec onclick handleViewCoupons n'existe
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('onclick', expect.stringContaining('handleViewCoupons'));
    });
  });

  test('should not have handleEditSeries function calls', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier qu'aucun bouton avec onclick handleEditSeries n'existe
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('onclick', expect.stringContaining('handleEditSeries'));
    });
  });

  test('should have clickable rows with proper cursor style', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier que les lignes ont la classe clickable
    const firstRow = screen.getByText('Jean Dupont').closest('tr');
    expect(firstRow).toHaveClass('table__row--clickable');
    
    const secondRow = screen.getByText('Marie Martin').closest('tr');
    expect(secondRow).toHaveClass('table__row--clickable');
  });

  test('should only show essential table columns', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier que les colonnes principales sont présentes
    expect(screen.getByText('Nom de la série')).toBeInTheDocument();
    expect(screen.getByText('Famille')).toBeInTheDocument();
    expect(screen.getByText('Élève')).toBeInTheDocument();
    expect(screen.getByText('Matière')).toBeInTheDocument();
    expect(screen.getByText('Total coupons')).toBeInTheDocument();
    expect(screen.getByText('Utilisés')).toBeInTheDocument();
    expect(screen.getByText('Restants')).toBeInTheDocument();
    expect(screen.getByText('Montant total')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Vérifier que la colonne Actions ne contient que les boutons de suppression
    const actionCells = screen.getAllByText('✕');
    expect(actionCells).toHaveLength(2);
  });
});