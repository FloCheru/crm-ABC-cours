import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RdvModal } from '../src/components/modal/RdvModal';

// Mock ModalWrapper to verify it's used correctly
jest.mock('../src/components/ui/ModalWrapper/ModalWrapper', () => ({
  ModalWrapper: ({ isOpen, children, onClose }: any) => {
    return isOpen ? (
      <div data-testid="modal-wrapper" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    ) : null;
  }
}));

const defaultFormData = {
  assignedAdminId: '',
  date: '',
  time: '',
  type: 'physique' as const,
  notes: ''
};

const defaultProps = {
  isOpen: false,
  onClose: jest.fn(),
  formData: defaultFormData,
  onFormChange: jest.fn(),
  onSubmit: jest.fn(),
  isEditing: false
};

describe('RdvModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<RdvModal {...defaultProps} />);
    expect(screen.queryByTestId('modal-wrapper')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<RdvModal {...defaultProps} isOpen={true} />);
    expect(screen.getByTestId('modal-wrapper')).toBeInTheDocument();
  });

  it('should use ModalWrapper instead of Modal', () => {
    render(<RdvModal {...defaultProps} isOpen={true} />);
    
    // Verify ModalWrapper is rendered (our mock has data-testid="modal-wrapper")
    expect(screen.getByTestId('modal-wrapper')).toBeInTheDocument();
    
    // Verify the modal contains the expected content
    expect(screen.getByText('Nouveau rendez-vous')).toBeInTheDocument();
    expect(screen.getByLabelText('Date *')).toBeInTheDocument();
    expect(screen.getByLabelText('Heure *')).toBeInTheDocument();
  });

  it('should display edit title when isEditing is true', () => {
    render(<RdvModal {...defaultProps} isOpen={true} isEditing={true} />);
    expect(screen.getByText('Modifier le rendez-vous')).toBeInTheDocument();
  });

  it('should display create title when isEditing is false', () => {
    render(<RdvModal {...defaultProps} isOpen={true} isEditing={false} />);
    expect(screen.getByText('Nouveau rendez-vous')).toBeInTheDocument();
  });

  it('should call onClose when clicking the cancel button', () => {
    const onClose = jest.fn();
    render(<RdvModal {...defaultProps} isOpen={true} onClose={onClose} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Annuler' });
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onFormChange when form inputs change', () => {
    const onFormChange = jest.fn();
    render(<RdvModal {...defaultProps} isOpen={true} onFormChange={onFormChange} />);
    
    const dateInput = screen.getByLabelText('Date *');
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    
    expect(onFormChange).toHaveBeenCalledWith('date', '2025-01-15');
  });

  it('should disable submit button when form is invalid', () => {
    render(<RdvModal {...defaultProps} isOpen={true} />);
    
    const submitButton = screen.getByRole('button', { name: 'Créer RDV' });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', () => {
    const validFormData = {
      ...defaultFormData,
      date: '2025-01-15',
      time: '10:00'
    };
    
    render(<RdvModal {...defaultProps} isOpen={true} formData={validFormData} />);
    
    const submitButton = screen.getByRole('button', { name: 'Créer RDV' });
    expect(submitButton).not.toBeDisabled();
  });
});