import { useEffect } from 'react';
import { useFamiliesStore } from '../stores/useFamiliesStore';

interface UseFamiliesGlobalOptions {
  autoLoad?: boolean; // Charger automatiquement au montage (défaut: true)
}

/**
 * Hook optimisé pour accéder aux données families sans remontage
 * 
 * AVANTAGES vs useFamiliesCache:
 * - Pas de callback recréé à chaque montage
 * - Pas de re-calculs inutiles des filtres
 * - Cache persistant entre navigations
 * - TTL d'1 heure
 * - Sélecteurs mémorisés
 */
export function useFamiliesGlobal(options: UseFamiliesGlobalOptions = {}) {
  const { autoLoad = true } = options;
  
  // Sélecteurs du store (pas de recréation à chaque render)
  const data = useFamiliesStore((state) => state.data);
  const isLoading = useFamiliesStore((state) => state.isLoading);
  const error = useFamiliesStore((state) => state.error);
  const isExpired = useFamiliesStore((state) => state.isExpired());
  
  // Actions
  const loadFamilies = useFamiliesStore((state) => state.loadFamilies);
  const clearCache = useFamiliesStore((state) => state.clearCache);
  const addProspectOptimistic = useFamiliesStore((state) => state.addProspectOptimistic);
  const removeProspectOptimistic = useFamiliesStore((state) => state.removeProspectOptimistic);
  const updateProspectOptimistic = useFamiliesStore((state) => state.updateProspectOptimistic);
  const replaceProspectId = useFamiliesStore((state) => state.replaceProspectId);
  
  // Sélecteurs optimisés
  const getProspects = useFamiliesStore((state) => state.getProspects);
  const getClients = useFamiliesStore((state) => state.getClients);
  const getClientsWithNDR = useFamiliesStore((state) => state.getClientsWithNDR);
  const getStats = useFamiliesStore((state) => state.getStats);
  const getFirstNDRDate = useFamiliesStore((state) => state.getFirstNDRDate);
  
  // Chargement automatique au montage (si pas de données ou expirées)
  useEffect(() => {
    if (autoLoad && (!data || isExpired)) {
      console.log('🚀 [FAMILIES-GLOBAL] Loading families data...');
      loadFamilies();
    } else if (data) {
      console.log('🚀 [FAMILIES-GLOBAL] Using cached data');
    }
  }, [autoLoad, data, isExpired, loadFamilies]);
  
  return {
    // État
    data,
    isLoading,
    error,
    isFromCache: !!data && !isExpired,
    isExpired,
    
    // Actions
    loadFamilies,
    clearCache,
    addProspectOptimistic,
    removeProspectOptimistic,
    updateProspectOptimistic,
    replaceProspectId,
    
    // Sélecteurs (OPTIMISÉS - pas de recalcul)
    getProspects,
    getClients,
    getClientsWithNDR,
    getStats,
    getFirstNDRDate,
    
    // Getters directs pour compatibilité
    prospects: getProspects(),
    clients: getClients(),
    clientsWithNDR: getClientsWithNDR(),
    stats: getStats(),
  };
}