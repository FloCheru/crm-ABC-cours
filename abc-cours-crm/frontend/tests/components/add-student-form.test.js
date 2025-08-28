/**
 * Tests pour le composant AddStudentForm
 * Vérifie le formulaire d'ajout d'élève réutilisable
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddStudentForm } from '../../src/components/forms/AddStudentForm';

describe('AddStudentForm', () => {
  const defaultProps = {
    onSave: jest.fn(),
    onCancel: jest.fn(),
    familyId: 'test-family-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form sections and fields', () => {
    render(<AddStudentForm {...defaultProps} />);
    
    // Vérifier le titre
    expect(screen.getByText('Ajouter un nouveau bénéficiaire')).toBeInTheDocument();
    
    // Vérifier les sections
    expect(screen.getByText('Identité de l\'élève')).toBeInTheDocument();
    expect(screen.getByText('École')).toBeInTheDocument();
    expect(screen.getByText('Contact personnel de l\'élève')).toBeInTheDocument();
    expect(screen.getByText('Notes et observations')).toBeInTheDocument();
    
    // Vérifier les champs obligatoires
    expect(screen.getByLabelText('Prénom *')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom *')).toBeInTheDocument();
    
    // Vérifier les boutons
    expect(screen.getByText('📝 Exemple')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
    expect(screen.getByText('Ajouter l\'élève')).toBeInTheDocument();
  });

  test('validates required fields correctly', () => {
    render(<AddStudentForm {...defaultProps} />);
    
    const saveButton = screen.getByText('Ajouter l\'élève');
    
    // Le bouton doit être désactivé au début
    expect(saveButton).toBeDisabled();
    
    // Remplir seulement le prénom
    const firstNameInput = screen.getByLabelText('Prénom *');
    fireEvent.change(firstNameInput, { target: { value: 'Marie' } });
    expect(saveButton).toBeDisabled();
    
    // Remplir le nom aussi
    const lastNameInput = screen.getByLabelText('Nom *');
    fireEvent.change(lastNameInput, { target: { value: 'Dupont' } });
    expect(saveButton).not.toBeDisabled();
  });

  test('fills example data correctly', () => {
    render(<AddStudentForm {...defaultProps} />);
    
    const exampleButton = screen.getByText('📝 Exemple');
    fireEvent.click(exampleButton);
    
    // Vérifier que les champs sont préremplis
    expect(screen.getByDisplayValue('Marie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5ème')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Collège Victor Hugo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('marie.dupont@example.com')).toBeInTheDocument();
  });

  test('calls onSave with correct data when form is submitted', async () => {
    const mockOnSave = jest.fn().mockResolvedValue();
    render(<AddStudentForm {...defaultProps} onSave={mockOnSave} />);
    
    // Remplir les champs obligatoires
    fireEvent.change(screen.getByLabelText('Prénom *'), { 
      target: { value: 'Jean' } 
    });
    fireEvent.change(screen.getByLabelText('Nom *'), { 
      target: { value: 'Durand' } 
    });
    fireEvent.change(screen.getByLabelText('Niveau/Classe'), { 
      target: { value: 'CM2' } 
    });
    
    // Soumettre le formulaire
    const saveButton = screen.getByText('Ajouter l\'élève');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        firstName: 'Jean',
        lastName: 'Durand',
        level: 'CM2',
        dateOfBirth: '',
        schoolName: '',
        schoolAddress: '',
        email: '',
        phone: '',
        notes: ''
      });
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<AddStudentForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  test('displays loading state correctly', () => {
    render(<AddStudentForm {...defaultProps} isLoading={true} />);
    
    const saveButton = screen.getByText('Ajout en cours...');
    const cancelButton = screen.getByText('Annuler');
    
    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  test('handles all form fields changes', () => {
    render(<AddStudentForm {...defaultProps} />);
    
    const fields = [
      { label: 'Prénom *', value: 'Test' },
      { label: 'Nom *', value: 'Student' },
      { label: 'Niveau/Classe', value: '6ème' },
      { label: 'Nom de l\'école', value: 'École Test' },
      { label: 'Adresse de l\'école', value: '123 Rue Test' },
      { label: 'Email de l\'élève', value: 'test@example.com' },
      { label: 'Téléphone de l\'élève', value: '01 23 45 67 89' }
    ];
    
    fields.forEach(field => {
      const input = screen.getByLabelText(field.label);
      fireEvent.change(input, { target: { value: field.value } });
      expect(input.value).toBe(field.value);
    });
    
    // Test textarea
    const notesField = screen.getByLabelText('Notes');
    fireEvent.change(notesField, { target: { value: 'Notes de test' } });
    expect(notesField.value).toBe('Notes de test');
    
    // Test date field
    const dateField = screen.getByLabelText('Date de naissance');
    fireEvent.change(dateField, { target: { value: '2010-01-15' } });
    expect(dateField.value).toBe('2010-01-15');
  });
});