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

/**
 * Utilitaires pour gérer l'affichage des noms de famille de manière robuste
 */

/**
 * Extrait un nom de famille à partir des données disponibles
 * Gère tous les cas edge et fournit des fallbacks intelligents
 */
export function getFamilyDisplayName(
  familyId?: Family | string | null,
  fallbackText: string = "Famille inconnue"
): string {
  // Si familyId est une string (ObjectId) ou null/undefined
  if (!familyId || typeof familyId === 'string') {
    return fallbackText;
  }

  // Si familyId est un objet mais n'a pas de primaryContact
  if (!familyId.primaryContact) {
    return fallbackText;
  }

  const { firstName, lastName, email } = familyId.primaryContact;

  // Vérifier si les noms sont vides ou manquants
  const hasValidFirstName = firstName && firstName.trim() !== '';
  const hasValidLastName = lastName && lastName.trim() !== '';

  // Si on a au moins un nom valide
  if (hasValidFirstName || hasValidLastName) {
    const displayName = [
      hasValidFirstName ? firstName!.trim() : '',
      hasValidLastName ? lastName!.trim() : ''
    ].filter(Boolean).join(' ');
    
    return displayName || fallbackText;
  }

  // Si aucun nom valide, essayer de générer à partir de l'email
  if (email && email.trim() !== '') {
    const emailParts = email.split('@')[0].split('.');
    const generatedFirstName = emailParts[0] || 'Client';
    const generatedLastName = emailParts[1] || 'Famille';
    
    return `${generatedFirstName} ${generatedLastName}`;
  }

  // Dernier recours
  return fallbackText;
}

/**
 * Vérifie si les données de famille sont valides pour l'affichage
 */
export function isValidFamilyData(familyId?: Family | string | null): boolean {
  if (!familyId || typeof familyId === 'string') {
    return false;
  }

  if (!familyId.primaryContact) {
    return false;
  }

  const { firstName, lastName, email } = familyId.primaryContact;
  
  // Au moins un nom valide ou un email pour générer
  const hasValidNames = Boolean((firstName && firstName.trim() !== '') || 
                               (lastName && lastName.trim() !== ''));
  const hasValidEmail = Boolean(email && email.trim() !== '');

  return hasValidNames || hasValidEmail;
}

/**
 * Génère des noms de série de coupons
 * Format: NomFamille_MM_YYYY
 */
export function generateCouponSeriesName(
  familyId?: Family | string | null,
  createdAt?: Date | string
): string {
  const familyName = getFamilyDisplayName(familyId, "FamilleInconnue")
    .replace(/\s+/g, '') // Supprimer les espaces
    .replace(/[^a-zA-ZÀ-ÿ0-9]/g, ''); // Garder seulement les lettres et chiffres

  const date = new Date(createdAt || new Date());
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${familyName}_${month}_${year}`;
}

/**
 * Version d'affichage de la logique frontend existante
 * Compatible avec le code existant des composants de coupons
 */
export function getCompatibleFamilyName(row: any): string {
  return (row.familyId && typeof row.familyId === 'object' && row.familyId.primaryContact)
    ? getFamilyDisplayName(row.familyId)
    : "Famille inconnue";
}