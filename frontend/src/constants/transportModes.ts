/**
 * Liste des modes de transport disponibles pour les professeurs
 */

export interface TransportMode {
  value: string;
  label: string;
}

/**
 * Modes de transport disponibles pour les déplacements des professeurs
 */
export const TRANSPORT_MODES: TransportMode[] = [
  { value: 'voiture', label: 'Voiture' },
  { value: 'vélo', label: 'Vélo' },
  { value: 'transports', label: 'Transports en commun' },
  { value: 'moto', label: 'Moto' },
  { value: 'pied', label: 'À pied' },
];

/**
 * Helper pour obtenir un mode de transport par sa valeur
 */
export const getTransportModeByValue = (value: string): TransportMode | undefined => {
  return TRANSPORT_MODES.find(mode => mode.value === value);
};
