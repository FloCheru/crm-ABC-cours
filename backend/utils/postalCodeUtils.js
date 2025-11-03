/**
 * Extrait le code département depuis un code postal français.
 * Gère automatiquement les cas métropole (2 chiffres) et DOM-TOM (3 chiffres).
 *
 * @param {string} postalCode - Code postal à analyser (ex: "75001", "97110", "98800")
 * @returns {string} Code département (ex: "75", "971", "988") ou chaîne vide si invalide
 *
 * @example
 * getDepartmentFromPostalCode("75001")   // "75" (Paris)
 * getDepartmentFromPostalCode("97110")   // "971" (Guadeloupe)
 * getDepartmentFromPostalCode("98800")   // "988" (Nouvelle-Calédonie)
 * getDepartmentFromPostalCode("invalid") // ""
 * getDepartmentFromPostalCode("")        // ""
 */
function getDepartmentFromPostalCode(postalCode) {
  if (!postalCode) return "";

  const cleanPostalCode = postalCode.trim();

  // Validation : code postal doit avoir au moins 2 chiffres
  if (cleanPostalCode.length < 2) return "";

  // DOM-TOM : codes postaux commençant par 97 ou 98 (3 chiffres)
  // 971-978 : Départements d'outre-mer (Guadeloupe, Martinique, Guyane, Réunion, Mayotte)
  // 986-988 : Collectivités d'outre-mer (Wallis-et-Futuna, Polynésie, Nouvelle-Calédonie)
  if ((cleanPostalCode.startsWith("97") || cleanPostalCode.startsWith("98"))
      && cleanPostalCode.length >= 3) {
    return cleanPostalCode.substring(0, 3);
  }

  // Métropole : 2 premiers chiffres
  return cleanPostalCode.substring(0, 2);
}

module.exports = { getDepartmentFromPostalCode };
