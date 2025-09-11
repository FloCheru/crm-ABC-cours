import { useEffect } from 'react';
import { useSettlementStore } from '../stores/useSettlementStore';

interface UseSettlementGlobalOptions {
  autoLoad?: boolean; // Charger automatiquement au montage (défaut: true)
}

/**
 * Hook optimisé pour accéder aux données des NDR sans remontage
 * 
 * AVANTAGES vs anciens caches:
 * - Pas de callback recréé à chaque montage
 * - Pas de re-calculs inutiles
 * - Cache persistant entre navigations
 * - TTL d'1 heure
 * - Sélecteurs mémorisés
 */
export function useSettlementGlobal(options: UseSettlementGlobalOptions = {}) {
  const { autoLoad = true } = options;
  
  // Sélecteurs du store (pas de recréation à chaque render)
  const data = useSettlementStore((state) => state.data);
  const isLoading = useSettlementStore((state) => state.isLoading);
  const error = useSettlementStore((state) => state.error);
  const isExpired = useSettlementStore((state) => state.isExpired());
  
  // Actions
  const loadSettlements = useSettlementStore((state) => state.loadSettlements);
  const clearCache = useSettlementStore((state) => state.clearCache);
  
  
  // Fonctions de sélecteurs pour compatibilité
  const getSettlements = useSettlementStore((state) => state.getSettlements);
  const getSettlementCount = useSettlementStore((state) => state.getSettlementCount);
  const getFirstSettlementDate = useSettlementStore((state) => state.getFirstSettlementDate);
  const getTotalCount = useSettlementStore((state) => state.getTotalCount);
  
  // Chargement automatique au montage (si pas de données ou expirées)
  useEffect(() => {
    if (autoLoad && (!data || isExpired)) {
      console.log('🚀 [SETTLEMENT-GLOBAL] Loading settlement data...');
      loadSettlements();
    } else if (data) {
      console.log('🚀 [SETTLEMENT-GLOBAL] Using cached data');
    }
  }, [autoLoad, data, isExpired, loadSettlements]);
  
  return {
    // État
    data,
    isLoading,
    error,
    isFromCache: !!data && !isExpired,
    isExpired,
    
    // Actions
    loadSettlements,
    clearCache,
    
    // Sélecteurs (OPTIMISÉS - pas de recalcul)
    getSettlements,
    getSettlementCount,
    getFirstSettlementDate,
    getTotalCount,
    
    // Données directes pour compatibilité (même pattern que useFamiliesGlobal)
    settlements: getSettlements(),
    totalCount: getTotalCount(),
  };
}