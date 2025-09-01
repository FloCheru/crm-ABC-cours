/**
 * Types pour le système de cache basé sur les actions métier
 */

// Actions métier disponibles
export type BusinessAction = 
  | 'CREATE_PROSPECT'
  | 'CREATE_NDR' 
  | 'DELETE_NDR'
  | 'DELETE_CLIENT'
  | 'DELETE_PROSPECT';

// Noms des stores disponibles
export type StoreName = 'families' | 'settlements' | 'coupons' | 'couponSeries';

// Interface que doit implémenter chaque store pour être géré par le cache
export interface CacheStore {
  // État
  data: any;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  
  // Actions obligatoires
  clearCache: () => void;
  isExpired: () => boolean;
  
  // Actions optionnelles pour optimistic updates
  optimisticUpdate?: (action: BusinessAction, data: any) => void;
  rollback?: (action: BusinessAction, data: any) => void;
}

// Données optimistes pour chaque type d'action
export interface OptimisticData {
  CREATE_PROSPECT: {
    tempId: string;
    familyData: any;
  };
  CREATE_NDR: {
    familyId: string;
    newStatus: 'client';
    ndrData: any;
  };
  DELETE_NDR: {
    ndrId: string;
    familyId: string;
    revertStatus?: 'prospect';
  };
  DELETE_CLIENT: {
    clientId: string;
  };
  DELETE_PROSPECT: {
    prospectId: string;
  };
}

// Résultat de l'exécution d'une action
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  affectedStores: StoreName[];
}

// Configuration du mapping actions → stores
export type ActionStoreMapping = {
  [K in BusinessAction]: StoreName[];
};

// Hook return type
export interface UseActionCacheReturn {
  executeAction: <T = any>(
    action: BusinessAction,
    persistFn: () => Promise<T>,
    optimisticData?: OptimisticData[BusinessAction]
  ) => Promise<T>;
  
  // Méthodes utilitaires
  getAffectedStores: (action: BusinessAction) => StoreName[];
  isStoreLoaded: (storeName: StoreName) => boolean;
  
  // Status pour debugging
  getCacheStatus: () => Record<StoreName, { loaded: boolean; expired: boolean }>;
}