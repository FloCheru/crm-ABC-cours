import { renderHook, act } from '@testing-library/react';
import type { BusinessAction, CacheStore } from '../../src/types/actionCache';

// Mock des imports de stores AVANT les imports
jest.mock('../../src/stores/useFamiliesStore', () => ({
  useFamiliesStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../../src/stores/useSettlementStore', () => ({
  useSettlementStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../../src/stores/useCouponsStore', () => ({
  useCouponsStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../../src/stores/useCouponSeriesStore', () => ({
  useCouponSeriesStore: {
    getState: jest.fn(),
  },
}));

// Import après les mocks
import { useActionCache } from '../../src/hooks/useActionCache';
import { useFamiliesStore } from '../../src/stores/useFamiliesStore';
import { useSettlementStore } from '../../src/stores/useSettlementStore';
import { useCouponsStore } from '../../src/stores/useCouponsStore';
import { useCouponSeriesStore } from '../../src/stores/useCouponSeriesStore';

// Récupération des mocks typés
const mockFamiliesStore = useFamiliesStore as jest.Mocked<typeof useFamiliesStore>;
const mockSettlementStore = useSettlementStore as jest.Mocked<typeof useSettlementStore>;
const mockCouponsStore = useCouponsStore as jest.Mocked<typeof useCouponsStore>;
const mockCouponSeriesStore = useCouponSeriesStore as jest.Mocked<typeof useCouponSeriesStore>;

describe('useActionCache', () => {
  let mockStoreState: Partial<CacheStore>;
  let mockPersistFn: jest.Mock;

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    // État par défaut d'un store
    mockStoreState = {
      data: null,
      isLoading: false,
      lastFetch: 0,
      error: null,
      clearCache: jest.fn(),
      isExpired: jest.fn(() => false),
      optimisticUpdate: jest.fn(),
      rollback: jest.fn(),
    };

    // Fonction de persistance mock
    mockPersistFn = jest.fn().mockResolvedValue({ success: true });

    // Configuration par défaut des stores
    mockFamiliesStore.getState.mockReturnValue(mockStoreState);
    mockSettlementStore.getState.mockReturnValue(mockStoreState);
    mockCouponsStore.getState.mockReturnValue(mockStoreState);
    mockCouponSeriesStore.getState.mockReturnValue(mockStoreState);
  });

  describe('executeAction - Action Mapping', () => {
    test('CREATE_PROSPECT doit affecter seulement families', async () => {
      const { result } = renderHook(() => useActionCache());

      const affectedStores = result.current.getAffectedStores('CREATE_PROSPECT');
      expect(affectedStores).toEqual(['families']);
    });

    test('CREATE_NDR doit affecter tous les stores', async () => {
      const { result } = renderHook(() => useActionCache());

      const affectedStores = result.current.getAffectedStores('CREATE_NDR');
      expect(affectedStores).toEqual(['settlements', 'families', 'coupons', 'couponSeries']);
    });

    test('DELETE_PROSPECT doit affecter seulement families', async () => {
      const { result } = renderHook(() => useActionCache());

      const affectedStores = result.current.getAffectedStores('DELETE_PROSPECT');
      expect(affectedStores).toEqual(['families']);
    });

    test('DELETE_NDR doit affecter tous les stores', async () => {
      const { result } = renderHook(() => useActionCache());

      const affectedStores = result.current.getAffectedStores('DELETE_NDR');
      expect(affectedStores).toEqual(['settlements', 'families', 'coupons', 'couponSeries']);
    });

    test('DELETE_CLIENT doit affecter tous les stores', async () => {
      const { result } = renderHook(() => useActionCache());

      const affectedStores = result.current.getAffectedStores('DELETE_CLIENT');
      expect(affectedStores).toEqual(['settlements', 'families', 'coupons', 'couponSeries']);
    });
  });

  describe('executeAction - Cache Invalidation Logic', () => {
    test('doit invalider seulement les stores chargés', async () => {
      // Setup: families chargé, settlements pas chargé
      const loadedStore = {
        ...mockStoreState,
        data: { some: 'data' }, // Store chargé
        clearCache: jest.fn(),
      };
      const unloadedStore = {
        ...mockStoreState,
        data: null, // Store non chargé
        clearCache: jest.fn(),
      };

      mockFamiliesStore.getState.mockReturnValue(loadedStore);
      mockSettlementStore.getState.mockReturnValue(unloadedStore);

      const { result } = renderHook(() => useActionCache());

      await act(async () => {
        await result.current.executeAction('CREATE_NDR', mockPersistFn);
      });

      // Families chargé → doit être invalidé
      expect(loadedStore.clearCache).toHaveBeenCalledTimes(1);
      
      // Settlements pas chargé → ne doit pas être invalidé
      expect(unloadedStore.clearCache).not.toHaveBeenCalled();

      // PersistFn doit être appelée
      expect(mockPersistFn).toHaveBeenCalledTimes(1);
    });

    test('ne doit pas invalider les stores si aucun n\'est chargé', async () => {
      // Tous les stores non chargés
      const unloadedStore = {
        ...mockStoreState,
        data: null,
        clearCache: jest.fn(),
      };

      mockFamiliesStore.getState.mockReturnValue(unloadedStore);
      mockSettlementStore.getState.mockReturnValue(unloadedStore);
      mockCouponsStore.getState.mockReturnValue(unloadedStore);
      mockCouponSeriesStore.getState.mockReturnValue(unloadedStore);

      const { result } = renderHook(() => useActionCache());

      await act(async () => {
        await result.current.executeAction('CREATE_NDR', mockPersistFn);
      });

      // Aucun store ne doit être invalidé
      expect(unloadedStore.clearCache).not.toHaveBeenCalled();
      
      // Mais persistFn doit quand même être appelée
      expect(mockPersistFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeAction - Optimistic Updates', () => {
    test('doit faire update optimiste puis persister', async () => {
      const loadedStore = {
        ...mockStoreState,
        data: { some: 'data' },
        optimisticUpdate: jest.fn(),
        clearCache: jest.fn(),
      };

      mockFamiliesStore.getState.mockReturnValue(loadedStore);

      const { result } = renderHook(() => useActionCache());

      const optimisticData = {
        tempId: 'temp-123',
        familyData: { name: 'Test Family' }
      };

      await act(async () => {
        await result.current.executeAction(
          'CREATE_PROSPECT', 
          mockPersistFn, 
          optimisticData
        );
      });

      // 1. Update optimiste doit être appelé AVANT persist
      expect(loadedStore.optimisticUpdate).toHaveBeenCalledWith(
        'CREATE_PROSPECT', 
        optimisticData
      );
      
      // 2. Persist doit être appelé
      expect(mockPersistFn).toHaveBeenCalledTimes(1);
      
      // 3. Cache doit être invalidé APRÈS persist
      expect(loadedStore.clearCache).toHaveBeenCalledTimes(1);
    });

    test('doit faire rollback si persistFn échoue', async () => {
      const loadedStore = {
        ...mockStoreState,
        data: { some: 'data' },
        optimisticUpdate: jest.fn(),
        rollback: jest.fn(),
        clearCache: jest.fn(),
      };

      mockFamiliesStore.getState.mockReturnValue(loadedStore);

      // PersistFn qui échoue
      const failingPersistFn = jest.fn().mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useActionCache());

      const optimisticData = {
        tempId: 'temp-123',
        familyData: { name: 'Test Family' }
      };

      await act(async () => {
        try {
          await result.current.executeAction(
            'CREATE_PROSPECT', 
            failingPersistFn, 
            optimisticData
          );
        } catch (error) {
          // Expected error
        }
      });

      // 1. Update optimiste doit être appelé
      expect(loadedStore.optimisticUpdate).toHaveBeenCalledWith(
        'CREATE_PROSPECT', 
        optimisticData
      );
      
      // 2. PersistFn doit être appelé et échouer
      expect(failingPersistFn).toHaveBeenCalledTimes(1);
      
      // 3. Rollback doit être appelé
      expect(loadedStore.rollback).toHaveBeenCalledWith(
        'CREATE_PROSPECT', 
        optimisticData
      );
      
      // 4. Cache NE doit PAS être invalidé (car persist a échoué)
      expect(loadedStore.clearCache).not.toHaveBeenCalled();
    });

    test('doit gérer l\'absence de méthodes optimistic update', async () => {
      const storeWithoutOptimistic = {
        ...mockStoreState,
        data: { some: 'data' },
        // Pas de optimisticUpdate/rollback
        clearCache: jest.fn(),
      };

      mockFamiliesStore.getState.mockReturnValue(storeWithoutOptimistic);

      const { result } = renderHook(() => useActionCache());

      const optimisticData = {
        tempId: 'temp-123',
        familyData: { name: 'Test Family' }
      };

      // Ne doit pas throw même sans méthodes optimistic
      await act(async () => {
        await result.current.executeAction(
          'CREATE_PROSPECT', 
          mockPersistFn, 
          optimisticData
        );
      });

      expect(mockPersistFn).toHaveBeenCalledTimes(1);
      expect(storeWithoutOptimistic.clearCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeAction - Error Handling', () => {
    test('doit re-throw les erreurs de persistFn', async () => {
      const error = new Error('Database connection failed');
      const failingPersistFn = jest.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useActionCache());

      await act(async () => {
        await expect(
          result.current.executeAction('CREATE_PROSPECT', failingPersistFn)
        ).rejects.toThrow('Database connection failed');
      });

      expect(failingPersistFn).toHaveBeenCalledTimes(1);
    });

    test('doit gérer les actions inconnues', async () => {
      const { result } = renderHook(() => useActionCache());

      await act(async () => {
        await expect(
          result.current.executeAction(
            'UNKNOWN_ACTION' as BusinessAction, 
            mockPersistFn
          )
        ).rejects.toThrow('Unknown business action: UNKNOWN_ACTION');
      });

      expect(mockPersistFn).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    test('isStoreLoaded doit retourner true pour store avec data', () => {
      const loadedStore = { ...mockStoreState, data: { some: 'data' } };
      mockFamiliesStore.getState.mockReturnValue(loadedStore);

      const { result } = renderHook(() => useActionCache());

      expect(result.current.isStoreLoaded('families')).toBe(true);
    });

    test('isStoreLoaded doit retourner false pour store sans data', () => {
      const unloadedStore = { ...mockStoreState, data: null };
      mockFamiliesStore.getState.mockReturnValue(unloadedStore);

      const { result } = renderHook(() => useActionCache());

      expect(result.current.isStoreLoaded('families')).toBe(false);
    });

    test('getCacheStatus doit retourner le status de tous les stores', () => {
      const loadedStore = { 
        ...mockStoreState, 
        data: { some: 'data' },
        isExpired: jest.fn(() => false)
      };
      const expiredStore = { 
        ...mockStoreState, 
        data: { some: 'data' },
        isExpired: jest.fn(() => true)
      };

      mockFamiliesStore.getState.mockReturnValue(loadedStore);
      mockSettlementStore.getState.mockReturnValue(expiredStore);
      mockCouponsStore.getState.mockReturnValue({ ...mockStoreState, data: null });
      mockCouponSeriesStore.getState.mockReturnValue({ ...mockStoreState, data: null });

      const { result } = renderHook(() => useActionCache());

      const status = result.current.getCacheStatus();

      expect(status).toEqual({
        families: { loaded: true, expired: false },
        settlements: { loaded: true, expired: true },
        coupons: { loaded: false, expired: false },
        couponSeries: { loaded: false, expired: false }
      });
    });
  });
});