/**
 * Liste des langues disponibles pour la sélection "Langue maternelle"
 * Code ISO 639-1 + nom en français
 */

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'Anglais' },
  { code: 'es', name: 'Espagnol' },
  { code: 'de', name: 'Allemand' },
  { code: 'it', name: 'Italien' },
  { code: 'pt', name: 'Portugais' },
  { code: 'ar', name: 'Arabe' },
  { code: 'zh', name: 'Chinois (Mandarin)' },
  { code: 'ja', name: 'Japonais' },
  { code: 'ko', name: 'Coréen' },
  { code: 'ru', name: 'Russe' },
  { code: 'nl', name: 'Néerlandais' },
  { code: 'pl', name: 'Polonais' },
  { code: 'tr', name: 'Turc' },
  { code: 'vi', name: 'Vietnamien' },
  { code: 'th', name: 'Thaï' },
  { code: 'el', name: 'Grec' },
  { code: 'he', name: 'Hébreu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamoul' },
  { code: 'fa', name: 'Persan (Farsi)' },
  { code: 'uk', name: 'Ukrainien' },
  { code: 'ro', name: 'Roumain' },
  { code: 'hu', name: 'Hongrois' },
  { code: 'cs', name: 'Tchèque' },
  { code: 'sv', name: 'Suédois' },
  { code: 'da', name: 'Danois' },
  { code: 'fi', name: 'Finnois' },
  { code: 'no', name: 'Norvégien' },
  { code: 'id', name: 'Indonésien' },
  { code: 'ms', name: 'Malais' },
  { code: 'tl', name: 'Tagalog (Filipino)' },
  { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharique' },
  { code: 'wo', name: 'Wolof' },
  { code: 'other', name: 'Autre' },
];

/**
 * Récupère le nom d'une langue à partir de son code
 */
export const getLanguageName = (code: string): string => {
  const language = LANGUAGES.find((l) => l.code === code);
  return language?.name || code;
};