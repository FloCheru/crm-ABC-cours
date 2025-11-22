/**
 * Constantes pour les filtres de la page Professeurs
 */

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Options de filtre pour le sexe
 */
export const GENDER_OPTIONS: FilterOption[] = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
];

/**
 * Options de filtre pour le statut actif/inactif
 */
export const ACTIVE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

/**
 * Options de filtre pour la situation actuelle
 */
export const CURRENT_SITUATION_OPTIONS: FilterOption[] = [
  {
    value: 'enseignant_education_nationale',
    label: 'Enseignant de l\'Education Nationale en poste, en disponibilité ou à la retraite'
  },
  {
    value: 'enseignant_vacataire_contractuel',
    label: 'Enseignant vacataire ou contractuel actif ou ayant déjà enseigné dans le public ou dans le privé'
  },
  {
    value: 'etudiant_master_professorat',
    label: 'Enseignant préparant le concours de professeur'
  },
  {
    value: 'enseignant_avec_activite_domicile',
    label: 'Enseignant avec pour seule activité le cours à domicile'
  },
  {
    value: 'enseignant_activite_professionnelle',
    label: 'Enseignant ayant une activité professionnelle autre que l\'enseignement et dispensant des cours à domicile'
  },
  {
    value: 'enseignant_formation_professionnelle',
    label: 'Enseignant en formation professionnelle'
  },
  {
    value: 'etudiant',
    label: 'Etudiant'
  },
];

/**
 * Options de filtre pour le statut d'emploi
 */
export const EMPLOYMENT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'auto-entrepreneur', label: 'Autoentrepreneur' },
  { value: 'formation-professionnel', label: 'Formation professionnel' },
  { value: 'salarie', label: 'Salarié' },
];

/**
 * Helper pour obtenir une option de filtre par sa valeur
 */
export const getFilterOptionByValue = (
  options: FilterOption[],
  value: string
): FilterOption | undefined => {
  return options.find(option => option.value === value);
};
