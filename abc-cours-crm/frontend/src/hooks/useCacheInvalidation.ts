import { useCallback } from 'react';
import { useDataCacheStore } from '../stores/useDataCacheStore';

export function useCacheInvalidation() {
  const { invalidateCache } = useDataCacheStore();
  
  // Invalidation ciblée après création/modification/suppression de famille
  const invalidateAllFamilyRelatedCaches = useCallback(() => {
    console.log('🔄 Invalidation de tous les caches liés aux familles');
    invalidateCache('families');
    invalidateCache('ndr');
    // Dashboard utilise les mêmes données donc sera rafraîchi automatiquement
  }, [invalidateCache]);
  
  // Invalidation spécifique NDR (après création/suppression de note)
  const invalidateNDRCache = useCallback(() => {
    console.log('🔄 Invalidation du cache NDR');
    invalidateCache('ndr');
  }, [invalidateCache]);
  
  // Invalidation spécifique coupons (après actions sur coupons)
  const invalidateCouponCaches = useCallback(() => {
    console.log('🔄 Invalidation des caches coupons');
    invalidateCache('couponSeries');
    invalidateCache('coupons');
  }, [invalidateCache]);
  
  // Invalidation complète de tous les caches
  const invalidateAllCaches = useCallback(() => {
    console.log('🔄 Invalidation complète de tous les caches');
    invalidateCache('families');
    invalidateCache('ndr');
    invalidateCache('couponSeries');
    invalidateCache('coupons');
  }, [invalidateCache]);
  
  return {
    invalidateAllFamilyRelatedCaches,
    invalidateNDRCache,
    invalidateCouponCaches,
    invalidateAllCaches,
  };
}