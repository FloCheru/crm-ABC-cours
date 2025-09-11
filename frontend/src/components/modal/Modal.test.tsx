import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

// Mock des composants enfants pour éviter les erreurs de rendu
jest.mock('../../components', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>
      {children}
    </button>
  ),
  Input: ({ label, value, onChange, disabled, required, type = 'text', ...props }: any) => (
    <div>
      <label>
        {label}
        {required && <span>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e)}
        disabled={disabled}
        data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        {...props}
      />
    </div>
  ),
  Select: ({ label, value, onChange, options = [], disabled, required }: any) => (
    <div>
      <label>
        {label}
        {required && <span>*</span>}
      </label>
      <select 
        value={value} 
        onChange={(e) => onChange?.(e)} 
        disabled={disabled}
        data-testid={`select-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {options.map((option: any, index: number) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
  DataCard: ({ title, children }: any) => (
    <div data-testid="datacard">
      <h3>{title}</h3>
      {children}
    </div>
  ),
  Container: ({ children }: any) => <div data-testid="container">{children}</div>,
  PageHeader: ({ title, actions }: any) => (
    <div data-testid="pageheader">
      <h1>{title}</h1>
      {actions}
    </div>
  ),
}));

// Mock des services
jest.mock('../../services/familyService');
jest.mock('../../services/rdvService');
jest.mock('../../services/adminService');
jest.mock('../../services/actionCacheService');

// Import des services mockés
import { familyService } from '../../services/familyService';
import rdvService from '../../services/rdvService';
import { adminService } from '../../services/adminService';
import ActionCacheService from '../../services/actionCacheService';

// Cast des mocks
const mockedFamilyService = familyService as jest.Mocked<typeof familyService>;
const mockedRdvService = rdvService as jest.Mocked<typeof rdvService>;
const mockedAdminService = adminService as jest.Mocked<typeof adminService>;
const mockedActionCacheService = ActionCacheService as jest.Mocked<typeof ActionCacheService>;

describe('Modal', () => {
  const mockAdmins = [
    { id: 'admin1', firstName: 'John', lastName: 'Doe' },
    { id: 'admin2', firstName: 'Jane', lastName: 'Smith' }
  ];

  const mockFamilyData = {
    _id: 'family123',
    familyId: 'family123'
  };

  const mockStudentData = {
    _id: 'student123',
    familyId: 'family123',
    firstName: 'Jean',
    lastName: 'Dupont',
    dateOfBirth: '2010-01-15',
    school: { name: 'École Test', grade: '6e' },
    contact: { email: 'jean@test.com', phone: '0123456789' },
    courseLocation: { type: 'domicile', usesFamilyAddress: true },
    notes: 'Notes test'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock les méthodes des services
    if (mockedAdminService.getAdmins) {
      mockedAdminService.getAdmins.mockResolvedValue(mockAdmins);
    }
    if (mockedFamilyService.updateStudent) {
      mockedFamilyService.updateStudent.mockResolvedValue({ success: true });
    }
    if (mockedFamilyService.addStudent) {
      mockedFamilyService.addStudent.mockResolvedValue({ success: true });
    }
    if (mockedRdvService.updateRdv) {
      mockedRdvService.updateRdv.mockResolvedValue({ success: true });
    }
    if (mockedRdvService.createRdv) {
      mockedRdvService.createRdv.mockResolvedValue({ success: true });
    }
    if (mockedActionCacheService.executeAction) {
      mockedActionCacheService.executeAction.mockResolvedValue({ success: true });
    }
  });

  // P0 Tests - Setup et tests critiques
  describe('P0 - Tests critiques', () => {
    test('should render modal in document body when isOpen=true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      expect(screen.getByText('Nouvel élève')).toBeInTheDocument();
      expect(document.querySelector('.modal-overlay')).toBeInTheDocument();
    });

    test('should not render modal when isOpen=false', () => {
      render(
        <Modal
          isOpen={false}
          onClose={jest.fn()}
          type="student"
        />
      );

      expect(screen.queryByText('Nouvel élève')).not.toBeInTheDocument();
      expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument();
    });

    test('should have modal container element', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      const modal = document.querySelector('.modal-container');
      expect(modal).toBeInTheDocument();
    });
  });

  // P1 Tests - Tests critiques selon best-practices
  describe('P1 - Tests critiques', () => {
    test('should render modal with student type', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      expect(screen.getByText('Nouvel élève')).toBeInTheDocument();
      expect(screen.getByTestId('input-firstName')).toBeInTheDocument();
      expect(screen.getByTestId('input-lastName')).toBeInTheDocument();
    });

    test('should render modal with rdv type', async () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="rdv"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Nouveau rendez-vous')).toBeInTheDocument();
        expect(screen.getByTestId('input-date')).toBeInTheDocument();
        expect(screen.getByTestId('input-time')).toBeInTheDocument();
      });
    });

    test('should render with different titles based on mode and data', () => {
      const { rerender } = render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      expect(screen.getByText('Nouvel élève')).toBeInTheDocument();

      rerender(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
          data={mockStudentData}
          mode="view"
        />
      );

      expect(screen.getByText('Détails élève')).toBeInTheDocument();

      rerender(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
          data={mockStudentData}
          mode="edit"
        />
      );

      expect(screen.getByText('Modifier élève')).toBeInTheDocument();
    });

    test('should close modal on close button click', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          type="student"
          mode="view"
        />
      );

      const closeButton = screen.getByTestId('close-button-footer');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should call onSuccess after successful student creation', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
          onSuccess={mockOnSuccess}
        />
      );

      // Remplir les champs requis
      await user.type(screen.getByTestId('input-firstName'), 'Jean');
      await user.type(screen.getByTestId('input-lastName'), 'Dupont');

      const saveButton = screen.getByTestId('save-button-footer');
      await user.click(saveButton);

      await waitFor(() => {
        if (mockedFamilyService.addStudent) {
          expect(mockedFamilyService.addStudent).toHaveBeenCalled();
        }
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('should load admins for rdv type', async () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="rdv"
        />
      );

      await waitFor(() => {
        if (mockedAdminService.getAdmins) {
          expect(mockedAdminService.getAdmins).toHaveBeenCalled();
        }
      });
    });
  });

  // P2 Tests - États et interactions
  describe('P2 - Tests états et interactions', () => {
    test('should handle form field changes', async () => {
      const user = userEvent.setup();

      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      const firstNameInput = screen.getByTestId('input-firstName');
      await user.type(firstNameInput, 'Jean');

      expect(firstNameInput).toHaveValue('Jean');
    });

    test('should validate required fields', async () => {
      const user = userEvent.setup();

      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      const saveButton = screen.getByTestId('save-button-footer');
      expect(saveButton).toBeDisabled();

      await user.type(screen.getByTestId('input-firstName'), 'Jean');
      expect(saveButton).toBeDisabled();

      await user.type(screen.getByTestId('input-lastName'), 'Dupont');
      expect(saveButton).not.toBeDisabled();
    });

    test('should show loading state during save operation', async () => {
      const user = userEvent.setup();
      
      // Mock d'une promesse qui ne se résout pas immédiatement
      if (mockedFamilyService.addStudent) {
        mockedFamilyService.addStudent.mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
        );
      }

      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      await user.type(screen.getByTestId('input-firstName'), 'Jean');
      await user.type(screen.getByTestId('input-lastName'), 'Dupont');
      
      const saveButton = screen.getByTestId('save-button-footer');
      await user.click(saveButton);

      // Le bouton cliqué doit être désactivé et contenir le texte "En cours"
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveTextContent(/En cours/);
    });
  });

  // Tests accessibilité
  describe('Accessibility Tests', () => {
    test('should have proper form labels', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      expect(screen.getByText('Prénom')).toBeInTheDocument();
      expect(screen.getByText('Nom')).toBeInTheDocument();
    });

    test('should mark required fields with asterisk', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels.length).toBeGreaterThan(0);
    });

    test('should support basic keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
        />
      );

      const firstInput = screen.getByTestId('input-firstName');
      firstInput.focus();
      expect(firstInput).toHaveFocus();

      await user.tab();
      const secondInput = screen.getByTestId('input-lastName');
      expect(secondInput).toHaveFocus();
    });
  });

  // Tests mode toggle
  describe('Mode Toggle Tests', () => {
    test('should toggle between view and edit mode', async () => {
      const user = userEvent.setup();

      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
          data={mockStudentData}
          mode="view"
        />
      );

      expect(screen.getByText('Détails élève')).toBeInTheDocument();
      
      const editButton = screen.getByTestId('edit-button-footer');
      await user.click(editButton);

      expect(screen.getByText('Modifier élève')).toBeInTheDocument();
    });

    test('should disable form fields in view mode', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          type="student"
          data={mockStudentData}
          mode="view"
        />
      );

      const firstNameInput = screen.getByDisplayValue('Jean');
      expect(firstNameInput).toBeDisabled();
    });
  });
});