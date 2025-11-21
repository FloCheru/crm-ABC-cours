/**
 * Service pour interagir avec l'API Geo du gouvernement français
 * Documentation complète : .claude/guides/api-geo-gouv.md
 *
 * API Geo : https://geo.api.gouv.fr
 */

/**
 * Interface représentant une commune française retournée par l'API Geo
 */
export interface Commune {
  nom: string;                // Nom de la commune (ex: "Paris", "Lyon")
  code: string;               // Code INSEE (ex: "75056")
  codeDepartement: string;    // Code du département (ex: "75")
  codeRegion: string;         // Code de la région (ex: "11")
  codesPostaux: string[];     // Liste des codes postaux de la commune
  population?: number;        // Population (optionnel)
}

/**
 * Service pour récupérer les informations géographiques via l'API Geo
 */
class GeoApiService {
  private readonly baseUrl = "https://geo.api.gouv.fr";

  /**
   * Récupère les communes associées à un code postal
   *
   * @param postalCode - Code postal à 5 chiffres (ex: "75001", "38080")
   * @returns Promise<Commune[]> - Liste des communes (peut contenir plusieurs communes pour un même code postal)
   *
   * @example
   * ```typescript
   * const communes = await geoApiService.getCommunesByPostalCode("75001");
   * // Retourne : [{ nom: "Paris", code: "75056", ... }]
   * ```
   *
   * @example
   * ```typescript
   * // Certains codes postaux correspondent à plusieurs communes
   * const communes = await geoApiService.getCommunesByPostalCode("38080");
   * // Retourne : [
   * //   { nom: "L'Isle-d'Abeau", code: "38193", ... },
   * //   { nom: "Saint-Quentin-Fallavier", code: "38461", ... }
   * // ]
   * ```
   */
  async getCommunesByPostalCode(postalCode: string): Promise<Commune[]> {
    try {
      // Validation basique du code postal
      if (!postalCode || postalCode.length !== 5) {
        console.warn(`[GeoApiService] Code postal invalide : ${postalCode}`);
        return [];
      }

      const url = `${this.baseUrl}/communes?codePostal=${postalCode}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `[GeoApiService] Erreur API Geo (${response.status}) pour le code postal ${postalCode}`
        );
        return [];
      }

      const data: Commune[] = await response.json();
      return data;
    } catch (error) {
      console.error(
        `[GeoApiService] Erreur lors de la récupération des communes pour ${postalCode}:`,
        error
      );
      return [];
    }
  }

  /**
   * Récupère les noms de villes uniques pour une liste de codes postaux
   *
   * @param postalCodes - Liste de codes postaux
   * @returns Promise<string[]> - Liste des noms de villes triés par ordre alphabétique
   *
   * @example
   * ```typescript
   * const cities = await geoApiService.getUniqueCityNames(["75001", "69001", "38080"]);
   * // Retourne : ["L'Isle-d'Abeau", "Lyon", "Paris", "Saint-Quentin-Fallavier"]
   * ```
   */
  async getUniqueCityNames(postalCodes: string[]): Promise<string[]> {
    try {
      // Appels parallèles pour améliorer les performances
      const promises = postalCodes.map((code) =>
        this.getCommunesByPostalCode(code)
      );

      const results = await Promise.all(promises);

      // Extraire les noms de communes, dédupliquer et trier
      const cityNames = results
        .flat()
        .map((commune) => commune.nom)
        .filter((nom, index, self) => self.indexOf(nom) === index) // Dédupliquer
        .sort(); // Tri alphabétique

      return cityNames;
    } catch (error) {
      console.error(
        "[GeoApiService] Erreur lors de la récupération des noms de villes:",
        error
      );
      return [];
    }
  }

  /**
   * Crée un mapping code postal -> nom de ville
   * Utile pour associer rapidement un code postal à sa ville
   *
   * @param postalCodes - Liste de codes postaux
   * @returns Promise<Record<string, string>> - Mapping {codePostal: nomVille}
   *
   * @example
   * ```typescript
   * const mapping = await geoApiService.getPostalCodeToCityMapping(["75001", "69001"]);
   * // Retourne : { "75001": "Paris", "69001": "Lyon" }
   * ```
   *
   * @remarks
   * Si un code postal correspond à plusieurs communes, seule la première est retenue.
   */
  async getPostalCodeToCityMapping(
    postalCodes: string[]
  ): Promise<Record<string, string>> {
    try {
      const promises = postalCodes.map((code) =>
        this.getCommunesByPostalCode(code)
      );

      const results = await Promise.all(promises);

      const mapping: Record<string, string> = {};

      postalCodes.forEach((code, index) => {
        const communes = results[index];
        if (communes.length > 0) {
          // Prendre la première commune si plusieurs résultats
          mapping[code] = communes[0].nom;
        }
      });

      return mapping;
    } catch (error) {
      console.error(
        "[GeoApiService] Erreur lors de la création du mapping code postal -> ville:",
        error
      );
      return {};
    }
  }
}

// Exporter une instance unique du service (singleton)
export const geoApiService = new GeoApiService();
export default geoApiService;