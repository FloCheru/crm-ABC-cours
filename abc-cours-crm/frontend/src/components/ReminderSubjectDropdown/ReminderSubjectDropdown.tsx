import React, { useState, useRef, useEffect } from 'react';
import { familyService } from '../../services/familyService';
import './ReminderSubjectDropdown.css';

export const REMINDER_SUBJECTS = [
  "Actions à définir",
  "Présenter nos cours",
  "Envoyer le devis", 
  "Relancer après devis",
  "Planifier rendez-vous",
  "Editer la NDR",
  "Négocier les tarifs",
  "Organiser cours d'essai",
  "Confirmer les disponibilités",
  "Suivre satisfaction parent"
] as const;

export type ReminderSubject = typeof REMINDER_SUBJECTS[number];

interface ReminderSubjectDropdownProps {
  value: string;
  familyId: string;
  onUpdate?: (familyId: string, newSubject: ReminderSubject) => void;
}

export const ReminderSubjectDropdown: React.FC<ReminderSubjectDropdownProps> = ({
  value,
  familyId,
  onUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown lors du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (newSubject: ReminderSubject) => {
    if (newSubject === currentValue) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Utiliser familyService qui gère ActionCache automatiquement
      await familyService.updateReminderSubject(familyId, newSubject);

      // Mise à jour locale immédiate
      setCurrentValue(newSubject);
      onUpdate?.(familyId, newSubject);
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'objet du rappel:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const displayValue = currentValue || "Actions à définir";

  return (
    <div className="reminder-subject-dropdown" ref={dropdownRef}>
      <button 
        className={`reminder-subject-dropdown__trigger ${isOpen ? 'open' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <span className="reminder-subject-dropdown__value">
          {isLoading ? 'Mise à jour...' : displayValue}
        </span>
        <svg 
          className="reminder-subject-dropdown__arrow" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="reminder-subject-dropdown__menu">
          {REMINDER_SUBJECTS.map((subject) => (
            <button
              key={subject}
              className={`reminder-subject-dropdown__option ${subject === currentValue ? 'selected' : ''}`}
              onClick={() => handleSelect(subject)}
            >
              {subject}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};