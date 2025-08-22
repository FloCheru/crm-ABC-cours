import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

interface DataCacheState {
  // Cache pour les différentes pages
  prospectsCache: CacheEntry<any> | null;
  clientsCache: CacheEntry<any> | null;
  dashboardCache: CacheEntry<any> | null;
  couponSeriesCache: CacheEntry<any> | null;
  
  // Actions génériques
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  getCache: <T>(key: string) => T | null;
  invalidateCache: (key: string) => void;
  invalidateAllCache: () => void;
  isExpired: (key: string) => boolean;
  
  // Actions spécialisées pour chaque page
  setProspectsCache: (data: any, ttl?: number) => void;
  getProspectsCache: () => any | null;
  setClientsCache: (data: any, ttl?: number) => void;
  getClientsCache: () => any | null;
  setDashboardCache: (data: any, ttl?: number) => void;
  getDashboardCache: () => any | null;
  setCouponSeriesCache: (data: any, ttl?: number) => void;
  getCouponSeriesCache: () => any | null;
}

// TTL par défaut : 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

export const useDataCacheStore = create<DataCacheState>()(
  devtools(
    (set, get) => ({
      // État initial
      prospectsCache: null,
      clientsCache: null,
      dashboardCache: null,
      couponSeriesCache: null,
      
      // Actions génériques
      setCache: <T>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
        const cacheEntry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          ttl,
        };
        
        set((state) => ({
          ...state,
          [`${key}Cache`]: cacheEntry,
        }));
        
        console.log(`🗄️ Cache: Données sauvegardées pour ${key} (TTL: ${ttl}ms)`);
      },
      
      getCache: <T>(key: string): T | null => {
        const state = get();
        const cacheEntry = (state as any)[`${key}Cache`] as CacheEntry<T> | null;
        
        if (!cacheEntry) {
          console.log(`🗄️ Cache: Aucune donnée trouvée pour ${key}`);
          return null;
        }
        
        const isExpired = Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
        
        if (isExpired) {
          console.log(`🗄️ Cache: Données expirées pour ${key}`);
          // Auto-nettoyage des données expirées
          set((state) => ({
            ...state,
            [`${key}Cache`]: null,
          }));
          return null;
        }
        
        console.log(`🗄️ Cache: Données valides trouvées pour ${key}`);
        return cacheEntry.data;
      },
      
      invalidateCache: (key: string) => {
        set((state) => ({
          ...state,
          [`${key}Cache`]: null,
        }));
        console.log(`🗄️ Cache: Invalidation de ${key}`);
      },
      
      invalidateAllCache: () => {
        set({
          prospectsCache: null,
          clientsCache: null,
          dashboardCache: null,
          couponSeriesCache: null,
        });
        console.log('🗄️ Cache: Invalidation complète');
      },
      
      isExpired: (key: string): boolean => {
        const state = get();
        const cacheEntry = (state as any)[`${key}Cache`];
        
        if (!cacheEntry) return true;
        
        return Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
      },
      
      // Actions spécialisées
      setProspectsCache: (data: any, ttl: number = DEFAULT_TTL) => {
        get().setCache('prospects', data, ttl);
      },
      
      getProspectsCache: () => {
        return get().getCache('prospects');
      },
      
      setClientsCache: (data: any, ttl: number = DEFAULT_TTL) => {
        get().setCache('clients', data, ttl);
      },
      
      getClientsCache: () => {
        return get().getCache('clients');
      },
      
      setDashboardCache: (data: any, ttl: number = DEFAULT_TTL) => {
        get().setCache('dashboard', data, ttl);
      },
      
      getDashboardCache: () => {
        return get().getCache('dashboard');
      },
      
      setCouponSeriesCache: (data: any, ttl: number = DEFAULT_TTL) => {
        get().setCache('couponSeries', data, ttl);
      },
      
      getCouponSeriesCache: () => {
        return get().getCache('couponSeries');
      },
    }),
    {
      name: 'data-cache-store',
    }
  )
);