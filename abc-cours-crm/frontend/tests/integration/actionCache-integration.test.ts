import { renderHook, act } from '@testing-library/react';
import { useActionCache } from '../../src/hooks/useActionCache';
import { useFamiliesStore } from '../../src/stores/useFamiliesStore';
import { useSettlementStore } from '../../src/stores/useSettlementStore';
import { useCouponsStore } from '../../src/stores/useCouponsStore';
import { useCouponSeriesStore } from '../../src/stores/useCouponSeriesStore';

// Tests d'intégration avec les vrais stores (mais données mockées)
describe('ActionCache Integration Tests', () => {
  
  beforeEach(() => {
    // Reset de tous les stores avant chaque test
    useFamiliesStore.getState().clearCache();
    useSettlementStore.getState().clearCache();
    useCouponsStore.getState().clearCache();
    useCouponSeriesStore.getState().clearCache();

    // Silence des logs pour les tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Scenario 1: CREATE_PROSPECT', () => {
    test('doit affecter seulement le store families et respecter la logique métier', async () => {
      // Setup: simuler que families est chargé, autres stores pas chargés
      const familiesStore = useFamiliesStore.getState();
      const settlementsStore = useSettlementStore.getState();
      const couponsStore = useCouponsStore.getState();
      
      // Simuler un cache families chargé
      useFamiliesStore.setState({
        data: {
          families: [],
          prospects: [],
          clients: [],
          stats: { totalFamilies: 0, totalProspects: 0 }
        },
        lastFetch: Date.now()
      });

      const { result } = renderHook(() => useActionCache());

      // Mock persistFn qui simule la création d'un prospect
      const mockCreateProspect = jest.fn().mockResolvedValue({
        _id: 'new-prospect-123',
        status: 'prospect',
        primaryContact: {
          firstName: 'Jean',
          lastName: 'Test',
          email: 'jean@test.com',
          gender: 'M.'
        }
      });

      // Vérifier l'état initial
      expect(result.current.isStoreLoaded('families')).toBe(true);
      expect(result.current.isStoreLoaded('settlements')).toBe(false);
      expect(result.current.isStoreLoaded('coupons')).toBe(false);

      // Action: créer prospect
      await act(async () => {
        const resultData = await result.current.executeAction(
          'CREATE_PROSPECT',
          mockCreateProspect,
          {
            tempId: 'temp-123',
            familyData: { name: 'Test Family' }
          }
        );

        expect(resultData._id).toBe('new-prospect-123');
      });

      // Vérifications post-action
      expect(mockCreateProspect).toHaveBeenCalledTimes(1);

      // Vérifier que seulement families cache a été invalidé
      const postActionStatus = result.current.getCacheStatus();
      expect(postActionStatus.families.loaded).toBe(false); // Invalidé
      expect(postActionStatus.settlements.loaded).toBe(false); // Était déjà pas chargé
      expect(postActionStatus.coupons.loaded).toBe(false); // Était déjà pas chargé
    });
  });

  describe('Scenario 2: CREATE_NDR (Workflow complet)', () => {
    test('doit gérer la transition prospect→client + génération NDR + coupons', async () => {
      // Setup: charger plusieurs stores pour simuler un utilisateur actif
      useFamiliesStore.setState({
        data: {
          families: [{ _id: 'family-123', status: 'prospect' }],
          prospects: [{ _id: 'family-123', status: 'prospect' }],
          clients: [],
          stats: { totalFamilies: 1, totalProspects: 1 }
        },
        lastFetch: Date.now()
      });

      useSettlementStore.setState({
        data: {
          settlements: [],
          totalCount: 0,
          counts: {},
          firstDates: {}
        },
        lastFetch: Date.now()
      });

      useCouponsStore.setState({
        data: {
          coupons: [],
          totalCount: 0,
          stats: { available: 0, used: 0, expired: 0, cancelled: 0 }
        },
        lastFetch: Date.now()
      });

      const { result } = renderHook(() => useActionCache());

      // Mock persistFn qui simule la création complète NDR
      const mockCreateNDR = jest.fn().mockResolvedValue({
        _id: 'ndr-456',
        familyId: 'family-123',
        status: 'pending',
        couponSeriesId: 'series-789',
        totalCoupons: 12
      });

      // Vérifier que tous les stores sont chargés
      expect(result.current.isStoreLoaded('families')).toBe(true);
      expect(result.current.isStoreLoaded('settlements')).toBe(true);
      expect(result.current.isStoreLoaded('coupons')).toBe(true);
      expect(result.current.isStoreLoaded('couponSeries')).toBe(false); // Pas chargé

      // Action: créer NDR (action la plus complexe)
      await act(async () => {
        const resultData = await result.current.executeAction(
          'CREATE_NDR',
          mockCreateNDR,
          {
            familyId: 'family-123',
            newStatus: 'client',
            ndrData: { subjects: ['Math'], totalAmount: 1200 }
          }
        );

        expect(resultData._id).toBe('ndr-456');
      });

      // Vérifications post-action
      expect(mockCreateNDR).toHaveBeenCalledTimes(1);

      // Vérifier que tous les stores chargés ont été invalidés
      const postActionStatus = result.current.getCacheStatus();
      expect(postActionStatus.families.loaded).toBe(false); // Invalidé
      expect(postActionStatus.settlements.loaded).toBe(false); // Invalidé
      expect(postActionStatus.coupons.loaded).toBe(false); // Invalidé
      expect(postActionStatus.couponSeries.loaded).toBe(false); // Était pas chargé, reste pas chargé
    });
  });

  describe('Scenario 3: DELETE_NDR (Rollback workflow)', () => {
    test('doit gérer la suppression NDR et retour client→prospect potentiel', async () => {
      // Setup: client avec NDR existante
      useFamiliesStore.setState({
        data: {
          families: [{ _id: 'family-123', status: 'client' }],
          prospects: [],
          clients: [{ _id: 'family-123', status: 'client' }],
          stats: { totalFamilies: 1, totalClients: 1 }
        },
        lastFetch: Date.now()
      });

      useSettlementStore.setState({
        data: {
          settlements: [{ _id: 'ndr-456', familyId: 'family-123' }],
          totalCount: 1,
          counts: { 'family-123': 1 },
          firstDates: { 'family-123': '01/01/2025' }
        },
        lastFetch: Date.now()
      });

      const { result } = renderHook(() => useActionCache());

      // Mock persistFn qui simule la suppression NDR
      const mockDeleteNDR = jest.fn().mockResolvedValue({
        success: true,
        deletedNDR: 'ndr-456',
        updatedFamily: { _id: 'family-123', status: 'prospect' }
      });

      // Action: supprimer NDR
      await act(async () => {
        const resultData = await result.current.executeAction(
          'DELETE_NDR',
          mockDeleteNDR,
          {
            ndrId: 'ndr-456',
            familyId: 'family-123',
            revertStatus: 'prospect'
          }
        );

        expect(resultData.success).toBe(true);
      });

      // Vérifications
      expect(mockDeleteNDR).toHaveBeenCalledTimes(1);

      // Stores chargés doivent être invalidés pour refresh
      const postActionStatus = result.current.getCacheStatus();
      expect(postActionStatus.families.loaded).toBe(false); // Invalidé
      expect(postActionStatus.settlements.loaded).toBe(false); // Invalidé
    });
  });

  describe('Scenario 4: DELETE_CLIENT (Cascade delete)', () => {
    test('doit gérer la suppression complète client + NDRs + coupons', async () => {
      // Setup: client avec plusieurs NDRs et coupons
      useFamiliesStore.setState({
        data: {
          families: [{ _id: 'family-123', status: 'client' }],
          clients: [{ _id: 'family-123', status: 'client' }],
          stats: { totalFamilies: 1, totalClients: 1 }
        },
        lastFetch: Date.now()
      });

      useSettlementStore.setState({
        data: {
          settlements: [
            { _id: 'ndr-1', familyId: 'family-123' },
            { _id: 'ndr-2', familyId: 'family-123' }
          ],
          totalCount: 2,
          counts: { 'family-123': 2 }
        },
        lastFetch: Date.now()
      });

      useCouponsStore.setState({
        data: {
          coupons: [
            { _id: 'coupon-1', familyId: 'family-123' },
            { _id: 'coupon-2', familyId: 'family-123' }
          ],
          totalCount: 2
        },
        lastFetch: Date.now()
      });

      const { result } = renderHook(() => useActionCache());

      // Mock persistFn pour suppression en cascade
      const mockDeleteClient = jest.fn().mockResolvedValue({
        success: true,
        deletedClient: 'family-123',
        deletedNDRs: ['ndr-1', 'ndr-2'],
        deletedCoupons: ['coupon-1', 'coupon-2']
      });

      // Action: supprimer client (cascade)
      await act(async () => {
        const resultData = await result.current.executeAction(
          'DELETE_CLIENT',
          mockDeleteClient,
          {
            clientId: 'family-123'
          }
        );

        expect(resultData.success).toBe(true);
        expect(resultData.deletedNDRs).toHaveLength(2);
        expect(resultData.deletedCoupons).toHaveLength(2);
      });

      // Vérifications: tous les stores chargés invalidés
      const postActionStatus = result.current.getCacheStatus();
      expect(postActionStatus.families.loaded).toBe(false);
      expect(postActionStatus.settlements.loaded).toBe(false);
      expect(postActionStatus.coupons.loaded).toBe(false);
    });
  });

  describe('Scenario 5: Performance - Conditional Invalidation', () => {
    test('ne doit pas invalider les stores non chargés pour optimiser les performances', async () => {
      // Setup: seulement families chargé (cas utilisateur qui n'a visité qu'une page)
      useFamiliesStore.setState({
        data: { families: [], prospects: [] },
        lastFetch: Date.now()
      });
      
      // settlements, coupons, couponSeries restent non chargés (data: null)

      const { result } = renderHook(() => useActionCache());

      const mockCreateNDR = jest.fn().mockResolvedValue({ _id: 'ndr-123' });

      // État initial
      expect(result.current.isStoreLoaded('families')).toBe(true);
      expect(result.current.isStoreLoaded('settlements')).toBe(false);
      expect(result.current.isStoreLoaded('coupons')).toBe(false);
      expect(result.current.isStoreLoaded('couponSeries')).toBe(false);

      // Action CREATE_NDR (qui normalement affecte tous les stores)
      await act(async () => {
        await result.current.executeAction('CREATE_NDR', mockCreateNDR);
      });

      // Vérifications: seulement families invalidé
      const postActionStatus = result.current.getCacheStatus();
      expect(postActionStatus.families.loaded).toBe(false); // Était chargé → invalidé
      expect(postActionStatus.settlements.loaded).toBe(false); // Était pas chargé → reste pas chargé
      expect(postActionStatus.coupons.loaded).toBe(false); // Était pas chargé → reste pas chargé
      expect(postActionStatus.couponSeries.loaded).toBe(false); // Était pas chargé → reste pas chargé

      // Performance: pas de clearCache() appelé sur stores non chargés
      // (vérifié implicitement par le fait qu'ils restent non chargés)
    });
  });

  describe('Error Scenarios', () => {
    test('doit gérer les erreurs réseau et rollback des optimistic updates', async () => {
      // Setup avec optimistic updates
      useFamiliesStore.setState({
        data: { families: [], prospects: [] },
        lastFetch: Date.now()
      });

      const { result } = renderHook(() => useActionCache());

      // PersistFn qui échoue (erreur réseau)
      const mockFailingPersist = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );

      // Action qui échoue
      await act(async () => {
        await expect(
          result.current.executeAction(
            'CREATE_PROSPECT',
            mockFailingPersist,
            {
              tempId: 'temp-123',
              familyData: { name: 'Test' }
            }
          )
        ).rejects.toThrow('Network timeout');
      });

      // Vérifications: cache ne doit PAS être invalidé (car persist a échoué)
      const postActionStatus = result.current.getCacheStatus();
      expect(postActionStatus.families.loaded).toBe(true); // Reste chargé car rollback

      expect(mockFailingPersist).toHaveBeenCalledTimes(1);
    });
  });
});