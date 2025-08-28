/**
 * Tests pour le mode édition des séries de coupons
 * 
 * Objectif : Vérifier que le bouton modifier et le mode édition 
 * fonctionnent correctement dans la page de détails série
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { SeriesDetails } from '../../src/pages/admin/coupons/SeriesDetails';
import { couponSeriesService } from '../../src/services/couponSeriesService';
import { couponService } from '../../src/services/couponService';

// Mock des services
jest.mock('../../src/services/couponSeriesService');
jest.mock('../../src/services/couponService');

const mockCouponSeriesService = couponSeriesService;
const mockCouponService = couponService;

// Mock react-router-dom pour tester la navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ seriesId: 'series-001' }),
}));

// Données de test
const mockSeriesData = {
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
};

const mockCouponsData = [
  {
    _id: 'coupon-001',
    seriesId: 'series-001',
    couponNumber: 1,
    status: 'available',
    createdAt: '2024-01-15T10:00:00.000Z'
  },
  {
    _id: 'coupon-002',
    seriesId: 'series-001',
    couponNumber: 2,
    status: 'used',
    createdAt: '2024-01-15T10:00:00.000Z'
  }
];

describe('Series Edit Mode', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockCouponSeriesService.getCouponSeriesById.mockResolvedValue(mockSeriesData);
    mockCouponService.getCouponsBySeriesId.mockResolvedValue(mockCouponsData);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/admin/coupons/series-001/coupons']}>
        <SeriesDetails />
      </MemoryRouter>
    );
  };

  test('should render series details page with modify button', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Détails de la série :')).toBeInTheDocument();
    });

    // Vérifier que le bouton "Modifier" est présent
    expect(screen.getByText('Modifier')).toBeInTheDocument();
    
    // Vérifier que le bouton "Retour" est aussi présent
    expect(screen.getByText('Retour')).toBeInTheDocument();
  });

  test('should enter edit mode when clicking modify button', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Modifier')).toBeInTheDocument();
    });

    // Cliquer sur le bouton Modifier
    const modifyButton = screen.getByText('Modifier');
    fireEvent.click(modifyButton);

    // Vérifier que les boutons ont changé pour le mode édition
    await waitFor(() => {
      expect(screen.getByText('Annuler')).toBeInTheDocument();
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    });

    // Vérifier que les champs deviennent éditables
    expect(screen.getByDisplayValue('25')).toBeInTheDocument(); // Tarif horaire
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Nombre de coupons
  });

  test('should cancel edit mode when clicking cancel button', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Modifier')).toBeInTheDocument();
    });

    // Entrer en mode édition
    const modifyButton = screen.getByText('Modifier');
    fireEvent.click(modifyButton);

    await waitFor(() => {
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    // Modifier une valeur
    const hourlyRateInput = screen.getByDisplayValue('25');
    fireEvent.change(hourlyRateInput, { target: { value: '30' } });

    // Cliquer sur Annuler
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    // Vérifier le retour au mode visualisation
    await waitFor(() => {
      expect(screen.getByText('Modifier')).toBeInTheDocument();
      expect(screen.getByText('Retour')).toBeInTheDocument();
    });

    // Vérifier que les modifications ont été annulées
    expect(screen.getByText('25.00 €')).toBeInTheDocument();
  });

  test('should save modifications when clicking save button', async () => {
    mockCouponSeriesService.updateCouponSeries.mockResolvedValue({
      ...mockSeriesData,
      hourlyRate: 30.0,
      totalCoupons: 12
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Modifier')).toBeInTheDocument();
    });

    // Entrer en mode édition
    const modifyButton = screen.getByText('Modifier');
    fireEvent.click(modifyButton);

    await waitFor(() => {
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    });

    // Modifier les valeurs
    const hourlyRateInput = screen.getByDisplayValue('25');
    const totalCouponsInput = screen.getByDisplayValue('10');
    
    fireEvent.change(hourlyRateInput, { target: { value: '30' } });
    fireEvent.change(totalCouponsInput, { target: { value: '12' } });

    // Cliquer sur Enregistrer
    const saveButton = screen.getByText('Enregistrer');
    fireEvent.click(saveButton);

    // Vérifier que le service a été appelé avec les bonnes valeurs
    await waitFor(() => {
      expect(mockCouponSeriesService.updateCouponSeries).toHaveBeenCalledWith('series-001', {
        hourlyRate: 30,
        totalCoupons: 12,
        status: 'active',
        studentId: mockSeriesData.studentId,
        familyId: mockSeriesData.familyId,
        subject: mockSeriesData.subject,
      });
    });
  });

  test('should show validation errors for invalid inputs', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Modifier')).toBeInTheDocument();
    });

    // Entrer en mode édition
    const modifyButton = screen.getByText('Modifier');
    fireEvent.click(modifyButton);

    await waitFor(() => {
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    });

    // Saisir des valeurs invalides
    const hourlyRateInput = screen.getByDisplayValue('25');
    const totalCouponsInput = screen.getByDisplayValue('10');
    
    fireEvent.change(hourlyRateInput, { target: { value: '0' } });
    fireEvent.change(totalCouponsInput, { target: { value: '0' } });

    // Cliquer sur Enregistrer
    const saveButton = screen.getByText('Enregistrer');
    fireEvent.click(saveButton);

    // Vérifier que les erreurs de validation sont affichées
    await waitFor(() => {
      expect(screen.getByText('Le tarif horaire est requis et doit être positif')).toBeInTheDocument();
      expect(screen.getByText('Le nombre de coupons est requis et doit être positif')).toBeInTheDocument();
    });

    // Vérifier que le service n'a pas été appelé
    expect(mockCouponSeriesService.updateCouponSeries).not.toHaveBeenCalled();
  });

  test('should navigate back when clicking return button', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Retour')).toBeInTheDocument();
    });

    // Cliquer sur le bouton Retour
    const returnButton = screen.getByText('Retour');
    fireEvent.click(returnButton);

    // Vérifier que la navigation a été appelée
    expect(mockNavigate).toHaveBeenCalledWith('/admin/coupons');
  });

  test('should display correct series information in view mode', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Détails de la série :')).toBeInTheDocument();
    });

    // Vérifier les informations affichées
    expect(screen.getByText('25.00 €')).toBeInTheDocument(); // Tarif horaire
    expect(screen.getByText('10')).toBeInTheDocument(); // Total coupons
    expect(screen.getByText('Actif')).toBeInTheDocument(); // Statut
  });
});