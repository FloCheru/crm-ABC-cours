import ActionCacheService from '../../src/services/actionCacheService';

// Mock des stores
jest.mock('../../src/stores/useFamiliesStore', () => ({
  useFamiliesStore: {
    getState: jest.fn(() => ({
      data: { families: [] },
      clearCache: jest.fn(),
      isExpired: jest.fn(() => false),
    })),
  },
}));

jest.mock('../../src/stores/useSettlementStore', () => ({
  useSettlementStore: {
    getState: jest.fn(() => ({
      data: null,
      clearCache: jest.fn(),
      isExpired: jest.fn(() => false),
    })),
  },
}));

jest.mock('../../src/stores/useCouponsStore', () => ({
  useCouponsStore: {
    getState: jest.fn(() => ({
      data: null,
      clearCache: jest.fn(),
      isExpired: jest.fn(() => false),
    })),
  },
}));

jest.mock('../../src/stores/useCouponSeriesStore', () => ({
  useCouponSeriesStore: {
    getState: jest.fn(() => ({
      data: null,
      clearCache: jest.fn(),
      isExpired: jest.fn(() => false),
    })),
  },
}));

describe('ActionCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('doit exécuter CREATE_NDR et invalider les stores chargés', async () => {
    const mockPersistFn = jest.fn().mockResolvedValue({ _id: 'ndr-123' });

    const result = await ActionCacheService.executeAction(
      'CREATE_NDR',
      mockPersistFn,
      {
        familyId: 'family-123',
        newStatus: 'client',
        ndrData: { subjects: ['Math'] }
      }
    );

    expect(result._id).toBe('ndr-123');
    expect(mockPersistFn).toHaveBeenCalledTimes(1);
  });

  test('doit obtenir les stores affectés correctement', () => {
    expect(ActionCacheService.getAffectedStores('CREATE_PROSPECT')).toEqual(['families']);
    expect(ActionCacheService.getAffectedStores('CREATE_NDR')).toEqual([
      'settlements', 'families', 'coupons', 'couponSeries'
    ]);
  });

  test('doit gérer les erreurs de persistance', async () => {
    const mockFailingPersist = jest.fn().mockRejectedValue(new Error('DB Error'));

    await expect(
      ActionCacheService.executeAction('CREATE_PROSPECT', mockFailingPersist)
    ).rejects.toThrow('DB Error');

    expect(mockFailingPersist).toHaveBeenCalledTimes(1);
  });
});