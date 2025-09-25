import React, { useState } from "react";
import { familyService } from "../../services/familyService";
import "./DatePicker.css";

interface DatePickerProps {
  value: Date | string | null;
  familyId: string;
  onUpdate?: (familyId: string, newDate: Date | null) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  familyId,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Convertir la valeur en Date ou null
  const currentDate = value ? new Date(value) : null;

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleDateChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDateString = event.target.value;
    const newDate = newDateString ? new Date(newDateString) : null;

    try {
      setIsLoading(true);
      await familyService.updateFamily(familyId, {
        nextActionDate: newDate
      });
      
      // Mise à jour locale optimisée
      if (onUpdate) {
        onUpdate(familyId, newDate);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la date:", error);
      // En cas d'erreur, on reste en mode édition
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = () => {
    // Fermer l'édition si on clique ailleurs
    setTimeout(() => setIsEditing(false), 100);
  };

  // Formater la date pour l'affichage
  const formatDate = (date: Date | null): string => {
    if (!date) return "-";
    return date.toLocaleDateString("fr-FR");
  };

  // Formater la date pour l'input HTML
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  if (isEditing) {
    return (
      <div className="date-picker date-picker--editing">
        <input
          type="date"
          value={formatDateForInput(currentDate)}
          onChange={handleDateChange}
          onBlur={handleBlur}
          disabled={isLoading}
          className="date-picker__input"
          autoFocus
        />
        {isLoading && (
          <div className="date-picker__loading">⏳</div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="date-picker date-picker--display"
      onClick={handleClick}
      title="Cliquer pour modifier la date de rappel"
    >
      <span className="date-picker__value">
        {formatDate(currentDate)}
      </span>
      {!currentDate && (
        <span className="date-picker__icon">📅</span>
      )}
    </div>
  );
};