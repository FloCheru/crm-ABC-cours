/**
 * Types pour le système de cache basé sur les actions métier
 */

// Actions métier disponibles
export type BusinessAction = 
  | 'CREATE_PROSPECT'
  | 'CREATE_NDR' 
  | 'DELETE_NDR'
  | 'DELETE_CLIENT'
  | 'DELETE_PROSPECT'
  // Nouvelles actions pour remplacer les systèmes de cache obsolètes
  | 'ADD_STUDENT'           // Ajout d'un élève à une famille
  | 'UPDATE_PROSPECT_STATUS' // Mise à jour du statut d'un prospect
  | 'UPDATE_FAMILY'          // Mise à jour générale d'une famille
  | 'UPDATE_REMINDER';       // Mise à jour des rappels (date, objet)

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
  // Nouvelles actions
  ADD_STUDENT: {
    familyId: string;
    studentData: any;
    tempStudentId?: string;
  };
  UPDATE_PROSPECT_STATUS: {
    prospectId: string;
    newStatus: string | null;
    oldStatus?: string | null;
  };
  UPDATE_FAMILY: {
    familyId: string;
    updates: any;
    previousData?: any;
  };
  UPDATE_REMINDER: {
    familyId: string;
    reminderData: {
      nextActionDate?: string;
      nextActionReminderSubject?: string;
    };
    previousData?: any;
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