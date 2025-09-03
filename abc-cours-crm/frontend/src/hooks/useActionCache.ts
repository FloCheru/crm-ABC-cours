import { useCallback, useMemo } from 'react';
import { useFamiliesStore } from '../stores/useFamiliesStore';
import { useSettlementStore } from '../stores/useSettlementStore';
import { useCouponsStore } from '../stores/useCouponsStore';
import { useCouponSeriesStore } from '../stores/useCouponSeriesStore';
import type { 
  BusinessAction, 
  StoreName, 
  ActionStoreMapping, 
  CacheStore, 
  OptimisticData,
  UseActionCacheReturn 
} from '../types/actionCache';

// Configuration centralisée du mapping actions → stores
const ACTION_CACHE_MAP: ActionStoreMapping = {
  CREATE_PROSPECT: ['families'],
  CREATE_NDR: ['settlements', 'families', 'coupons', 'couponSeries'],
  DELETE_NDR: ['settlements', 'families', 'coupons', 'couponSeries'], 
  DELETE_CLIENT: ['settlements', 'families', 'coupons', 'couponSeries'],
  DELETE_PROSPECT: ['families'],
  // Nouvelles actions pour éliminer les autres systèmes de cache
  ADD_STUDENT: ['families'],           // Impact seulement families
  UPDATE_PROSPECT_STATUS: ['families'], // Impact seulement families
  UPDATE_FAMILY: ['families'],          // Impact seulement families
  UPDATE_REMINDER: ['families']         // Impact seulement families
} as const;

/**
 * Hook pour la gestion centralisée du cache basée sur les actions métier
 * 
 * FONCTIONNALITÉS:
 * - Invalidation conditionnelle (seulement stores chargés)
 * - Updates optimistes avec rollback
 * - Gestion d'erreur robuste
 * - Type-safe pour toutes les actions
 * 
 * USAGE:
 * ```typescript
 * const { executeAction } = useActionCache();
 * 
 * const result = await executeAction(
 *   'CREATE_NDR',
 *   () => settlementService.createSettlementNote(data),
 *   { familyId: 'xxx', newStatus: 'client', ndrData: {...} }
 * );
 * ```
 */
export function useActionCache(): UseActionCacheReturn {
  
  // Références stables aux stores (pas de re-création à chaque render)
  const storeInstances = useMemo(() => {
    return {
      families: useFamiliesStore,
      settlements: useSettlementStore,
      coupons: useCouponsStore,
      couponSeries: useCouponSeriesStore
    };
  }, []);

  // Fonction utilitaire pour obtenir l'état d'un store
  const getStoreState = useCallback((storeName: StoreName): CacheStore => {
    return storeInstances[storeName].getState() as CacheStore;
  }, [storeInstances]);

  // Vérifier si un store est chargé (a des données)
  const isStoreLoaded = useCallback((storeName: StoreName): boolean => {
    const store = getStoreState(storeName);
    return !!store.data;
  }, [getStoreState]);

  // Obtenir les stores affectés par une action
  const getAffectedStores = useCallback((action: BusinessAction): StoreName[] => {
    return ACTION_CACHE_MAP[action] || [];
  }, []);

  // Obtenir le status de tous les caches
  const getCacheStatus = useCallback(() => {
    const status: Record<StoreName, { loaded: boolean; expired: boolean }> = {} as any;
    
    Object.keys(storeInstances).forEach((key) => {
      const storeName = key as StoreName;
      const store = getStoreState(storeName);
      status[storeName] = {
        loaded: !!store.data,
        expired: store.isExpired?.() ?? false
      };
    });
    
    return status;
  }, [storeInstances, getStoreState]);

  // Exécuter les updates optimistes
  const executeOptimisticUpdates = useCallback((
    affectedStores: StoreName[], 
    action: BusinessAction, 
    optimisticData?: OptimisticData[BusinessAction]
  ) => {
    if (!optimisticData) return;

    console.log(`🔮 [ACTION-CACHE] Applying optimistic updates for ${action}...`);
    
    affectedStores.forEach(storeName => {
      const store = getStoreState(storeName);
      if (store.data && store.optimisticUpdate) {
        try {
          store.optimisticUpdate(action, optimisticData);
          console.log(`✅ [ACTION-CACHE] Optimistic update applied to ${storeName}`);
        } catch (error) {
          console.warn(`⚠️ [ACTION-CACHE] Optimistic update failed for ${storeName}:`, error);
        }
      }
    });
  }, [getStoreState]);

  // Exécuter les rollbacks
  const executeRollbacks = useCallback((
    affectedStores: StoreName[],
    action: BusinessAction,
    optimisticData?: OptimisticData[BusinessAction]
  ) => {
    if (!optimisticData) return;

    console.log(`🔄 [ACTION-CACHE] Rolling back optimistic updates for ${action}...`);
    
    affectedStores.forEach(storeName => {
      const store = getStoreState(storeName);
      if (store.rollback) {
        try {
          store.rollback(action, optimisticData);
          console.log(`✅ [ACTION-CACHE] Rollback completed for ${storeName}`);
        } catch (error) {
          console.warn(`⚠️ [ACTION-CACHE] Rollback failed for ${storeName}:`, error);
        }
      }
    });
  }, [getStoreState]);

  // Invalider les caches chargés
  const invalidateLoadedCaches = useCallback((affectedStores: StoreName[]) => {
    console.log(`🗑️ [ACTION-CACHE] Checking stores for cache invalidation...`);
    
    let invalidatedCount = 0;
    
    affectedStores.forEach(storeName => {
      const store = getStoreState(storeName);
      if (store.data) {
        console.log(`🗑️ [ACTION-CACHE] Invalidating ${storeName} cache (was loaded)`);
        store.clearCache();
        invalidatedCount++;
      } else {
        console.log(`⏭️ [ACTION-CACHE] Skipping ${storeName} cache (not loaded)`);
      }
    });
    
    console.log(`✅ [ACTION-CACHE] Cache invalidation complete: ${invalidatedCount}/${affectedStores.length} stores invalidated`);
  }, [getStoreState]);

  // Fonction principale d'exécution d'action
  const executeAction = useCallback(async <T = any>(
    action: BusinessAction,
    persistFn: () => Promise<T>,
    optimisticData?: OptimisticData[BusinessAction]
  ): Promise<T> => {
    
    // Validation de l'action
    if (!ACTION_CACHE_MAP[action]) {
      throw new Error(`Unknown business action: ${action}`);
    }

    const affectedStores = getAffectedStores(action);
    const startTime = performance.now();
    
    console.log(`🚀 [ACTION-CACHE] Executing ${action} affecting [${affectedStores.join(', ')}]`);

    try {
      // 1. Updates optimistes (si données fournies)
      executeOptimisticUpdates(affectedStores, action, optimisticData);

      // 2. Persistance en base de données
      console.log(`💾 [ACTION-CACHE] Persisting ${action} to database...`);
      const result = await persistFn();
      console.log(`✅ [ACTION-CACHE] Database persistence successful for ${action}`);

      // 3. Invalidation conditionnelle (seulement stores chargés)
      invalidateLoadedCaches(affectedStores);

      const duration = Math.round(performance.now() - startTime);
      console.log(`🎉 [ACTION-CACHE] ${action} completed successfully in ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ [ACTION-CACHE] ${action} failed after ${duration}ms:`, error);

      // 4. Rollback des updates optimistes
      executeRollbacks(affectedStores, action, optimisticData);

      // Re-throw l'erreur pour que l'appelant puisse la gérer
      throw error;
    }
  }, [
    getAffectedStores,
    executeOptimisticUpdates,
    executeRollbacks,
    invalidateLoadedCaches
  ]);

  return {
    executeAction,
    getAffectedStores,
    isStoreLoaded,
    getCacheStatus
  };
}