/**
 * Service de gestion cache basé sur les actions métier
 * Version service (sans hook) pour utilisation dans les services
 */

import { useFamiliesStore } from '../stores/useFamiliesStore';
import { useSettlementStore } from '../stores/useSettlementStore';
import { useCouponsStore } from '../stores/useCouponsStore';
import { useCouponSeriesStore } from '../stores/useCouponSeriesStore';
import type { BusinessAction, StoreName, ActionStoreMapping, CacheStore, OptimisticData } from '../types/actionCache';

// Configuration centralisée du mapping actions → stores
const ACTION_CACHE_MAP: ActionStoreMapping = {
  CREATE_PROSPECT: ['families'],
  CREATE_NDR: ['settlements', 'families', 'coupons', 'couponSeries'],
  DELETE_NDR: ['settlements', 'families', 'coupons', 'couponSeries'], 
  DELETE_CLIENT: ['settlements', 'families', 'coupons', 'couponSeries'],
  DELETE_PROSPECT: ['families'],
  // Nouvelles actions pour éliminer les autres systèmes de cache
  ADD_STUDENT: ['families'],           // Impact seulement families
  DELETE_STUDENT: ['families'],        // Impact seulement families
  UPDATE_STUDENT: ['families'],        // Impact seulement families
  UPDATE_PROSPECT_STATUS: ['families'], // Impact seulement families
  UPDATE_FAMILY: ['families'],          // Impact seulement families
  UPDATE_REMINDER: ['families'],       // Impact seulement families
  // Actions RDV
  CREATE_RDV: ['families'],            // Impact families (ajout rdv à family.rdvs)
  DELETE_RDV: ['families'],            // Impact families (retrait rdv de family.rdvs)
  UPDATE_RDV: ['families']             // Impact families (modification rdv dans family.rdvs)
} as const;

/**
 * Service centralisé pour la gestion du cache basée sur les actions métier
 * 
 * UTILISATION:
 * ```typescript
 * const result = await ActionCacheService.executeAction(
 *   'CREATE_NDR',
 *   () => rateLimitedApiClient.post("/api/settlement-notes", data),
 *   { familyId: 'xxx', newStatus: 'client' }
 * );
 * ```
 */
class ActionCacheService {
  
  // Références aux stores
  private static stores = {
    families: useFamiliesStore,
    settlements: useSettlementStore,
    coupons: useCouponsStore,
    couponSeries: useCouponSeriesStore
  };

  // Obtenir l'état d'un store
  private static getStoreState(storeName: StoreName): CacheStore {
    return this.stores[storeName].getState() as CacheStore;
  }

  // Vérifier si un store est chargé
  private static isStoreLoaded(storeName: StoreName): boolean {
    const store = this.getStoreState(storeName);
    return !!store.data;
  }

  // Obtenir les stores affectés par une action
  private static getAffectedStores(action: BusinessAction): StoreName[] {
    return ACTION_CACHE_MAP[action] || [];
  }

  // Exécuter les updates optimistes
  private static executeOptimisticUpdates(
    affectedStores: StoreName[], 
    action: BusinessAction, 
    optimisticData?: OptimisticData[BusinessAction]
  ) {
    if (!optimisticData) return;

    console.log(`🔮 [ACTION-CACHE-SERVICE] Applying optimistic updates for ${action}...`);
    
    affectedStores.forEach(storeName => {
      const store = this.getStoreState(storeName);
      if (store.data && store.optimisticUpdate) {
        try {
          store.optimisticUpdate(action, optimisticData);
          console.log(`✅ [ACTION-CACHE-SERVICE] Optimistic update applied to ${storeName}`);
        } catch (error) {
          console.warn(`⚠️ [ACTION-CACHE-SERVICE] Optimistic update failed for ${storeName}:`, error);
        }
      }
    });
  }

  // Exécuter les rollbacks
  private static executeRollbacks(
    affectedStores: StoreName[],
    action: BusinessAction,
    optimisticData?: OptimisticData[BusinessAction]
  ) {
    if (!optimisticData) return;

    console.log(`🔄 [ACTION-CACHE-SERVICE] Rolling back optimistic updates for ${action}...`);
    
    affectedStores.forEach(storeName => {
      const store = this.getStoreState(storeName);
      if (store.rollback) {
        try {
          store.rollback(action, optimisticData);
          console.log(`✅ [ACTION-CACHE-SERVICE] Rollback completed for ${storeName}`);
        } catch (error) {
          console.warn(`⚠️ [ACTION-CACHE-SERVICE] Rollback failed for ${storeName}:`, error);
        }
      }
    });
  }


  // Fonction principale d'exécution d'action
  static async executeAction<T = any>(
    action: BusinessAction,
    persistFn: () => Promise<T>,
    optimisticData?: OptimisticData[BusinessAction]
  ): Promise<T> {
    
    // Validation de l'action
    if (!ACTION_CACHE_MAP[action]) {
      throw new Error(`Unknown business action: ${action}`);
    }

    const affectedStores = this.getAffectedStores(action);
    const startTime = performance.now();
    
    console.log(`🚀 [ACTION-CACHE-SERVICE] Executing ${action} affecting [${affectedStores.join(', ')}]`);

    try {
      // 1. Updates optimistes (si données fournies)
      this.executeOptimisticUpdates(affectedStores, action, optimisticData);

      // 2. Persistance en base de données
      console.log(`💾 [ACTION-CACHE-SERVICE] Persisting ${action} to database...`);
      const result = await persistFn();
      console.log(`✅ [ACTION-CACHE-SERVICE] Database persistence successful for ${action}`);

      // 3. Pas d'invalidation - les updates optimistes sont déjà corrects
      console.log(`🎯 [ACTION-CACHE-SERVICE] Keeping optimistic updates (no cache invalidation needed)`);

      const duration = Math.round(performance.now() - startTime);
      console.log(`🎉 [ACTION-CACHE-SERVICE] ${action} completed successfully in ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ [ACTION-CACHE-SERVICE] ${action} failed after ${duration}ms:`, error);

      // 4. Rollback des updates optimistes - MAIS préserver l'état d'erreur pour la UI
      console.log(`🔄 [ACTION-CACHE-SERVICE] Rolling back optimistic updates while preserving error state...`);
      this.executeRollbacks(affectedStores, action, optimisticData);

      // Re-throw l'erreur pour que l'appelant puisse la gérer
      throw error;
    }
  }

  // Méthodes utilitaires publiques
  static getAffectedStoresPublic(action: BusinessAction): StoreName[] {
    return this.getAffectedStores(action);
  }

  static isStoreLoadedPublic(storeName: StoreName): boolean {
    return this.isStoreLoaded(storeName);
  }

  static getCacheStatus(): Record<StoreName, { loaded: boolean; expired: boolean }> {
    const status: Record<StoreName, { loaded: boolean; expired: boolean }> = {} as any;
    
    Object.keys(this.stores).forEach((key) => {
      const storeName = key as StoreName;
      const store = this.getStoreState(storeName);
      status[storeName] = {
        loaded: !!store.data,
        expired: store.isExpired?.() ?? false
      };
    });
    
    return status;
  }
}

export default ActionCacheService;