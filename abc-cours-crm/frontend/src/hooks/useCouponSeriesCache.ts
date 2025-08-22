import { useCallback } from 'react';
import { useCache } from './useCache';
import { couponSeriesService } from '../services/couponSeriesService';
import type { CouponSeries } from '../types/coupon';

interface CouponSeriesData {
  couponSeries: CouponSeries[];
}

export function useCouponSeriesCache() {
  const fetchCouponSeriesData = useCallback(async (): Promise<CouponSeriesData> => {
    console.log('📊 CouponSeriesCache: Chargement des données depuis l\'API');
    
    const data = await couponSeriesService.getCouponSeries();
    const couponSeries = Array.isArray(data) ? data : [];
    
    return {
      couponSeries,
    };
  }, []);
  
  const {
    data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  } = useCache('couponSeries', fetchCouponSeriesData, {
    ttl: 5 * 60 * 1000, // 5 minutes de cache
  });
  
  return {
    couponSeriesData: data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  };
}