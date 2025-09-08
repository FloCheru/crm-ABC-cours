import { useEffect } from 'react';
import { useCouponSeriesStore } from '../stores/useCouponSeriesStore';

interface UseCouponSeriesGlobalOptions {
  autoLoad?: boolean; // Charger automatiquement au montage (défaut: true)
}

/**
 * Hook optimisé pour accéder aux données des séries de coupons sans remontage
 * 
 * AVANTAGES vs anciens caches:
 * - Pas de callback recréé à chaque montage
 * - Pas de re-calculs inutiles
 * - Cache persistant entre navigations
 * - TTL d'1 heure
 * - Sélecteurs mémorisés
 */
export function useCouponSeriesGlobal(options: UseCouponSeriesGlobalOptions = {}) {
  const { autoLoad = true } = options;
  
  // Sélecteurs du store (pas de recréation à chaque render)
  const data = useCouponSeriesStore((state) => state.data);
  const isLoading = useCouponSeriesStore((state) => state.isLoading);
  const error = useCouponSeriesStore((state) => state.error);
  const isExpired = useCouponSeriesStore((state) => state.isExpired());
  
  // Actions
  const loadCouponSeries = useCouponSeriesStore((state) => state.loadCouponSeries);
  const loadSeriesDetails = useCouponSeriesStore((state) => state.loadSeriesDetails);
  const clearCache = useCouponSeriesStore((state) => state.clearCache);
  
  // Sélecteurs optimisés
  const getCouponSeries = useCouponSeriesStore((state) => state.getCouponSeries);
  const getSeriesDetails = useCouponSeriesStore((state) => state.getSeriesDetails);
  const getTotalCount = useCouponSeriesStore((state) => state.getTotalCount);
  
  // Chargement automatique au montage (si pas de données ou expirées)
  useEffect(() => {
    if (autoLoad && (!data || isExpired)) {
      console.log('🚀 [COUPON-SERIES-GLOBAL] Loading coupon series data...');
      loadCouponSeries();
    } else if (data) {
      console.log('🚀 [COUPON-SERIES-GLOBAL] Using cached data');
    }
  }, [autoLoad, data, isExpired, loadCouponSeries]);
  
  return {
    // État
    data,
    isLoading,
    error,
    isFromCache: !!data && !isExpired,
    isExpired,
    
    // Actions
    loadCouponSeries,
    loadSeriesDetails,
    clearCache,
    
    // Sélecteurs (OPTIMISÉS - pas de recalcul)
    getCouponSeries,
    getSeriesDetails,
    getTotalCount,
    
    // Getters directs pour compatibilité
    series: getCouponSeries(),
    totalCount: getTotalCount(),
  };
}