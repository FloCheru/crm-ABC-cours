import { useCallback } from 'react';
import { useCache } from './useCache';

// Types pour les coupons (à ajuster selon votre interface)
interface CouponSeries {
  _id: string;
  seriesName: string;
  startNumber: number;
  endNumber: number;
  usedNumbers: number[];
  createdAt: string;
  updatedAt: string;
}

interface CouponData {
  series: CouponSeries[];
  totalCoupons: number;
  usedCoupons: number;
  availableCoupons: number;
}

// Service fictif - à remplacer par le vrai service
const couponService = {
  async getCouponSeries(): Promise<CouponSeries[]> {
    // TODO: Implémenter l'appel API réel
    throw new Error('Service coupon non implémenté');
  },
  
  async getCouponStats(): Promise<{ total: number; used: number; available: number }> {
    // TODO: Implémenter l'appel API réel
    throw new Error('Service coupon stats non implémenté');
  }
};

export function useCouponCache() {
  const fetchCouponData = useCallback(async (): Promise<CouponData> => {
    console.log('🎫 CouponCache: Chargement lazy des données coupons');
    
    const [seriesData, statsData] = await Promise.all([
      couponService.getCouponSeries(),
      couponService.getCouponStats(),
    ]);
    
    const series = Array.isArray(seriesData) ? seriesData : [];
    
    console.log(`✅ CouponCache: ${series.length} séries de coupons chargées`);
    
    return {
      series,
      totalCoupons: statsData.total,
      usedCoupons: statsData.used,
      availableCoupons: statsData.available,
    };
  }, []);
  
  // LAZY LOADING - Cache désactivé par défaut
  const {
    data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  } = useCache('couponSeries', fetchCouponData, {
    enabled: false, // LAZY LOADING - Cache désactivé par défaut
  });
  
  // LAZY LOADING - Fonction pour charger les coupons à la demande
  const loadCoupons = useCallback(async (): Promise<CouponData> => {
    console.log('🔄 CouponCache: Activation lazy loading coupons');
    
    // Vérifier si on a déjà les données en cache
    if (data && !isExpired) {
      console.log('✅ CouponCache: Données trouvées en cache, pas de rechargement');
      return data;
    }
    
    try {
      const couponData = await fetchCouponData();
      setCacheData(couponData);
      console.log(`✅ CouponCache: ${couponData.series.length} séries chargées et mises en cache`);
      return couponData;
    } catch (error) {
      console.error('❌ CouponCache: Erreur lors du chargement lazy:', error);
      throw error;
    }
  }, [fetchCouponData, setCacheData, data, isExpired]);
  
  // Fonction pour activer le cache
  const enableCache = useCallback(async () => {
    return loadCoupons();
  }, [loadCoupons]);
  
  // Fonction pour recharger les données
  const refreshCoupons = useCallback(async () => {
    console.log('🔄 CouponCache: Rechargement forcé des données');
    invalidateCache();
    return loadCoupons();
  }, [invalidateCache, loadCoupons]);
  
  return {
    couponData: data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
    // LAZY LOADING API
    loadCoupons,
    enableCache,
    refreshCoupons,
    // Getters pour accès facile
    getSeries: () => data?.series || [],
    getStats: () => ({
      total: data?.totalCoupons || 0,
      used: data?.usedCoupons || 0,
      available: data?.availableCoupons || 0,
    }),
    // Status helpers
    isCacheEmpty: () => !data || data.series.length === 0,
    isCacheActive: () => !!data && !isExpired,
    // Helpers pour les séries
    getSeriesById: (id: string) => data?.series.find(s => s._id === id),
    getAvailableCouponsInSeries: (series: CouponSeries) => {
      const totalInSeries = series.endNumber - series.startNumber + 1;
      return totalInSeries - series.usedNumbers.length;
    },
  };
}