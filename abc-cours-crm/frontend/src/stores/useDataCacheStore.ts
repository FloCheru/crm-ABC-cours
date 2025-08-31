import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interface CacheEntry supprimée - utilisons CacheState directement

interface CacheState {
  data: any;
  timestamp: number;
  ttl: number;
}

interface DataCacheState {
  // Cache unifié optimisé
  familiesCache: CacheState | null;
  ndrCache: CacheState | null;
  couponSeriesCache: CacheState | null;
  couponsCache: CacheState | null;
  
  // Actions génériques
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  getCache: <T>(key: string) => T | null;
  invalidateCache: (key: string) => void;
  invalidateAllCache: () => void;
  isExpired: (key: string) => boolean;
}

// TTL optimisés par type de données
const CACHE_TTL = {
  families: 30 * 60 * 1000,    // 30min - données très stables
  ndr: 15 * 60 * 1000,         // 15min - modérément stables
  couponSeries: 60 * 60 * 1000, // 60min - très stables
  coupons: 15 * 60 * 1000,     // 15min - modérément stables
  default: 5 * 60 * 1000       // 5min - fallback
};

export const useDataCacheStore = create<DataCacheState>()(
  devtools(
    (set, get) => ({
      // État initial unifié
      familiesCache: null,
      ndrCache: null,
      couponSeriesCache: null,
      couponsCache: null,
      
      // Actions génériques avec TTL auto-optimisé
      setCache: <T>(key: string, data: T, ttl?: number) => {
        const optimizedTTL = ttl || CACHE_TTL[key as keyof typeof CACHE_TTL] || CACHE_TTL.default;
        const cacheState: CacheState = {
          data,
          timestamp: Date.now(),
          ttl: optimizedTTL,
        };
        
        set((state) => ({
          ...state,
          [`${key}Cache`]: cacheState,
        }));
        
        console.log(`🔥 [CACHE-DEBUG] Store: Données SAUVEGARDÉES pour ${key} (TTL: ${optimizedTTL}ms)`);
      },
      
      getCache: <T>(key: string): T | null => {
        const state = get();
        const cacheState = (state as any)[`${key}Cache`] as CacheState | null;
        
        if (!cacheState) {
          console.log(`🔥 [CACHE-DEBUG] Store: AUCUNE donnée trouvée pour ${key}`);
          return null;
        }
        
        const isExpired = Date.now() - cacheState.timestamp > cacheState.ttl;
        const age = Date.now() - cacheState.timestamp;
        
        if (isExpired) {
          console.log(`🔥 [CACHE-DEBUG] Store: Données EXPIRÉES pour ${key} (âge: ${age}ms, TTL: ${cacheState.ttl}ms)`);
          // Auto-nettoyage des données expirées
          set((state) => ({
            ...state,
            [`${key}Cache`]: null,
          }));
          return null;
        }
        
        console.log(`🔥 [CACHE-DEBUG] Store: Données VALIDES trouvées pour ${key} (âge: ${age}ms, TTL: ${cacheState.ttl}ms)`);
        return cacheState.data;
      },
      
      invalidateCache: (key: string) => {
        set((state) => ({
          ...state,
          [`${key}Cache`]: null,
        }));
        console.log(`🔥 [CACHE-DEBUG] Store: INVALIDATION de ${key}`);
      },
      
      invalidateAllCache: () => {
        set({
          familiesCache: null,
          ndrCache: null,
          couponSeriesCache: null,
          couponsCache: null,
        });
        console.log('🔥 [CACHE-DEBUG] Store: INVALIDATION COMPLÈTE de tous les caches');
      },
      
      isExpired: (key: string): boolean => {
        const state = get();
        const cacheState = (state as any)[`${key}Cache`];
        
        if (!cacheState) return true;
        
        return Date.now() - cacheState.timestamp > cacheState.ttl;
      },
    }),
    {
      name: 'data-cache-store',
    }
  )
);