import { useEffect } from 'react';
import { useCouponsStore } from '../stores/useCouponsStore';

export function useCouponsGlobal(filters?: any) {
  const {
    data,
    isLoading,
    error,
    loadCoupons,
    clearCache,
    isExpired,
    getCoupons,
    getCouponsByStatus,
    getCouponsBySeriesId,
    getStats,
    getTotalCount,
  } = useCouponsStore();

  // Auto-chargement avec vérification d'expiration
  useEffect(() => {
    if (!data || isExpired()) {
      loadCoupons(filters);
    }
  }, [loadCoupons, data, isExpired, filters]);

  return {
    // Données
    coupons: getCoupons(),
    stats: getStats(),
    totalCount: getTotalCount(),
    
    // État
    isLoading,
    error,
    
    // Actions
    loadCoupons,
    clearCache,
    
    // Sélecteurs
    getCouponsByStatus,
    getCouponsBySeriesId,
    
    // Helpers
    isDataLoaded: !!data,
    isExpired,
  };
}