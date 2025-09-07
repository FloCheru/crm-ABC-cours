import React from 'react';
import './FamilyNameDisplay.css';

interface FamilyContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  primaryPhone?: string;
}

interface Family {
  _id?: string;
  primaryContact?: FamilyContact;
}

interface FamilyNameDisplayProps {
  familyId?: Family | string | null;
  fallbackText?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  className?: string;
}

/**
 * Composant pour afficher le nom d'une famille de manière robuste
 * Gère tous les cas edge et fournit des fallbacks intelligents
 */
export const FamilyNameDisplay: React.FC<FamilyNameDisplayProps> = ({
  familyId,
  fallbackText = "Famille inconnue",
  showEmail = false,
  showPhone = false,
  className = ""
}) => {
  // Si familyId est une string (ObjectId), retourner le fallback
  if (!familyId || typeof familyId === 'string') {
    return (
      <span className={`family-name-display family-name-display--unknown ${className}`}>
        {fallbackText}
      </span>
    );
  }

  // Si familyId est un objet mais n'a pas de primaryContact
  if (!familyId.primaryContact) {
    return (
      <span className={`family-name-display family-name-display--unknown ${className}`}>
        {fallbackText}
      </span>
    );
  }

  const { firstName, lastName, email, primaryPhone } = familyId.primaryContact;

  // Vérifier si les noms sont vides ou manquants
  const hasValidFirstName = firstName && firstName.trim() !== '';
  const hasValidLastName = lastName && lastName.trim() !== '';

  // Si aucun nom valide, essayer de générer à partir de l'email
  if (!hasValidFirstName && !hasValidLastName) {
    if (email && email.trim() !== '') {
      const emailParts = email.split('@')[0].split('.');
      const generatedFirstName = emailParts[0] || 'Client';
      const generatedLastName = emailParts[1] || 'Famille';
      
      return (
        <div className={`family-name-display family-name-display--generated ${className}`}>
          <span className="family-name-display__name">
            {generatedFirstName} {generatedLastName}
          </span>
          <span className="family-name-display__note"> (généré depuis email)</span>
          {showEmail && email && (
            <div className="family-name-display__email">{email}</div>
          )}
          {showPhone && primaryPhone && (
            <div className="family-name-display__phone">{primaryPhone}</div>
          )}
        </div>
      );
    }
    
    // Dernier recours : fallback text
    return (
      <span className={`family-name-display family-name-display--unknown ${className}`}>
        {fallbackText}
      </span>
    );
  }

  // Construction du nom avec les données disponibles
  const displayName = [
    hasValidFirstName ? firstName.trim() : '',
    hasValidLastName ? lastName.trim() : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`family-name-display family-name-display--valid ${className}`}>
      <span className="family-name-display__name">{displayName}</span>
      {showEmail && email && (
        <div className="family-name-display__email">{email}</div>
      )}
      {showPhone && primaryPhone && (
        <div className="family-name-display__phone">{primaryPhone}</div>
      )}
    </div>
  );
};