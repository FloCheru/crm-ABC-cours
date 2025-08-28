/**
 * Tests pour la fonctionnalité de lignes cliquables des séries de coupons
 * 
 * Objectif : Vérifier que les lignes de tableau sont bien cliquables
 * et redirigent vers la page de détails appropriée
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Admin } from '../../src/pages/admin/coupons/Admin';
import { couponSeriesService } from '../../src/services/couponSeriesService';

// Mock des services
jest.mock('../../src/services/couponSeriesService');
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

// Mock du hook useCouponSeriesCache
const mockUseCouponSeriesCache = require('../../src/hooks/useCouponSeriesCache');
mockUseCouponSeriesCache.useCouponSeriesCache = jest.fn(() => ({
  couponSeriesData: mockCouponSeriesData,
  isFromCache: false,
  isLoading: false
}));

describe('Coupon Series Row Click Navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );
  };

  test('should render coupon series table with clickable rows', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier que les données des séries sont affichées
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    expect(screen.getByText('Mathématiques')).toBeInTheDocument();
    expect(screen.getByText('Physique')).toBeInTheDocument();
  });

  test('should navigate to series details when clicking on a table row', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Trouver la première ligne du tableau (ignorer l'en-tête)
    const firstRow = screen.getByText('Jean Dupont').closest('tr');
    expect(firstRow).toBeInTheDocument();

    // Cliquer sur la ligne
    fireEvent.click(firstRow);

    // Vérifier que la navigation a été appelée avec la bonne URL
    expect(mockNavigate).toHaveBeenCalledWith('/admin/coupons/series-001/coupons');
  });

  test('should navigate to different series when clicking different rows', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Cliquer sur la deuxième ligne
    const secondRow = screen.getByText('Marie Martin').closest('tr');
    fireEvent.click(secondRow);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/coupons/series-002/coupons');
  });

  test('should not display view buttons - only row clicks for navigation', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier que les boutons d'action "voir" (👁️) n'existent plus
    const viewButtons = screen.queryAllByText('👁️');
    expect(viewButtons).toHaveLength(0);

    // Vérifier que seuls les boutons de suppression sont présents
    const deleteButtons = screen.getAllByText('✕');
    expect(deleteButtons.length).toBe(2); // Un pour chaque série
  });

  test('should apply clickable cursor style to table rows', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    const firstRow = screen.getByText('Jean Dupont').closest('tr');
    
    // Vérifier que la classe clickable est appliquée
    expect(firstRow).toHaveClass('table__row--clickable');
  });

  test('should display correct series information in the table', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Liste des séries de coupons')).toBeInTheDocument();
    });

    // Vérifier les informations de la première série
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Pierre Dupont')).toBeInTheDocument();
    expect(screen.getByText('Mathématiques')).toBeInTheDocument();
    
    // Utiliser getAllByText pour les valeurs en double et vérifier leur présence
    const totalCoupons = screen.getAllByText('10');
    expect(totalCoupons.length).toBeGreaterThan(0);
    
    const usedCoupons = screen.getAllByText('3');
    expect(usedCoupons.length).toBeGreaterThan(0);
    
    const remainingCoupons = screen.getAllByText('7');
    expect(remainingCoupons.length).toBeGreaterThan(0);
    
    expect(screen.getByText('250.00 €')).toBeInTheDocument(); // Total amount

    // Vérifier les informations de la deuxième série
    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    expect(screen.getByText('Sophie Martin')).toBeInTheDocument();
    expect(screen.getByText('Physique')).toBeInTheDocument();
    
    // Utiliser getAllByText pour la valeur 15 qui peut apparaître plusieurs fois
    const series2TotalCoupons = screen.getAllByText('15');
    expect(series2TotalCoupons.length).toBeGreaterThan(0);
    
    expect(screen.getByText('450.00 €')).toBeInTheDocument(); // Total amount
  });
});