export { apiClient } from "./apiClient";
export { rateLimitedApiClient } from "./rateLimitedApiClient";
export { logger } from "./logger";
export { getDepartmentFromPostalCode } from "./postalCodeUtils";

/**
 * Formate un numéro de téléphone français au format "XX XX XX XX XX"
 * @param phone - Le numéro de téléphone à formater (peut être undefined)
 * @returns Le numéro formaté ou une chaîne vide si le numéro est invalide
 * @example
 * formatPhoneNumber("0698765432") // "06 98 76 54 32"
 * formatPhoneNumber(undefined) // ""
 */
export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return "";

  // Nettoyer le numéro (enlever les espaces, tirets, etc.)
  const cleaned = phone.replace(/\D/g, "");

  // Vérifier que c'est un numéro français à 10 chiffres
  if (cleaned.length !== 10) return phone;

  // Formater au format "XX XX XX XX XX"
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
};
