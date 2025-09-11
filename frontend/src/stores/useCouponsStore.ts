import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { couponService } from '../services/couponService';
import type { Coupon } from '../types/coupon';

// Interface pour les données unifiées des coupons
interface UnifiedCouponsData {
  coupons: Coupon[];
  totalCount: number;
  stats: {
    available: number;
    used: number;
    expired: number;
    cancelled: number;
  };
}

interface CouponsState {
  // État
  data: UnifiedCouponsData | null;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  
  // Actions
  loadCoupons: (filters?: any) => Promise<void>;
  clearCache: () => void;
  isExpired: () => boolean;
  
  // Sélecteurs mémorisés
  getCoupons: () => Coupon[];
  getCouponsByStatus: (status: string) => Coupon[];
  getCouponsBySeriesId: (seriesId: string) => Coupon[];
  getStats: () => { available: number; used: number; expired: number; cancelled: number };
  getTotalCount: () => number;
}

// TTL d'1 heure (60 * 60 * 1000 ms)
const TTL = 60 * 60 * 1000;

export const useCouponsStore = create<CouponsState>()(
  persist(
    (set, get) => ({
      data: null,
      isLoading: false,
      lastFetch: 0,
      error: null,

      // Vérifier si le cache a expiré
      isExpired: () => {
        const { lastFetch } = get();
        return Date.now() - lastFetch > TTL;
      },

      // Charger les coupons (une seule fois tant que non expiré)
      loadCoupons: async (filters = {}) => {
        const { data, isLoading, isExpired } = get();
        
        // Si données présentes et non expirées, ne rien faire
        if (data && !isExpired() && !isLoading) {
          console.log('🚀 [COUPONS-STORE] Using valid cache');
          return;
        }
        
        // Si déjà en cours de chargement, attendre
        if (isLoading) {
          console.log('🚀 [COUPONS-STORE] Loading already in progress');
          return;
        }
        
        console.log('🚀 [COUPONS-STORE] Starting API fetch...');
        set({ isLoading: true, error: null });
        
        try {
          // Charger tous les coupons avec filtres
          const couponsData = await couponService.getCoupons({
            limit: 100,
            ...filters
          });
          const coupons = Array.isArray(couponsData) ? couponsData : [];
          
          // Calculer les statistiques
          const stats = {
            available: coupons.filter(c => c.status === 'available').length,
            used: coupons.filter(c => c.status === 'used').length,
            expired: coupons.filter(c => c.status === 'expired').length,
            cancelled: coupons.filter(c => c.status === 'cancelled').length,
          };
          
          const unifiedData: UnifiedCouponsData = {
            coupons,
            totalCount: coupons.length,
            stats,
          };
          
          console.log(`🚀 [COUPONS-STORE] Data loaded: ${coupons.length} coupons`);
          
          set({ 
            data: unifiedData, 
            isLoading: false, 
            lastFetch: Date.now(),
            error: null 
          });
          
        } catch (error: any) {
          console.error('❌ [COUPONS-STORE] Error loading coupons:', error);
          set({ 
            isLoading: false, 
            error: error?.message || 'Error loading coupons data',
            lastFetch: 0
          });
        }
      },

      // Vider le cache
      clearCache: () => {
        set({ data: null, lastFetch: 0, error: null });
      },

      // Sélecteurs optimisés
      getCoupons: () => {
        const { data } = get();
        return data?.coupons || [];
      },

      getCouponsByStatus: (status: string) => {
        const { data } = get();
        return data?.coupons.filter(coupon => coupon.status === status) || [];
      },

      getCouponsBySeriesId: (seriesId: string) => {
        const { data } = get();
        return data?.coupons.filter(coupon => coupon.couponSeriesId?._id === seriesId) || [];
      },

      getStats: () => {
        const { data } = get();
        return data?.stats || { available: 0, used: 0, expired: 0, cancelled: 0 };
      },

      getTotalCount: () => {
        const { data } = get();
        return data?.totalCount || 0;
      },

      // Méthode optimisticUpdate pour ActionCache
      optimisticUpdate: (action: any, actionData: any) => {
        if (action === 'DELETE_NDR') {
          const { ndrId } = actionData;
          const { data } = get();
          if (!data) return;
          
          console.log(`🎯 [COUPONS-STORE] Applying DELETE_NDR optimistic update for NDR ${ndrId}`);
          
          // Filtrer les coupons liés à cette NDR
          // Les coupons sont liés aux NDR via couponSeriesId.settlementNoteId
          const updatedCoupons = data.coupons.filter(coupon => {
            const settlementNoteId = typeof coupon.couponSeriesId === 'object' 
              ? coupon.couponSeriesId?.settlementNoteId 
              : null;
            return settlementNoteId !== ndrId;
          });
          
          // Recalculer les statistiques
          const updatedStats = {
            available: updatedCoupons.filter(c => c.status === 'available').length,
            used: updatedCoupons.filter(c => c.status === 'used').length,
            expired: updatedCoupons.filter(c => c.status === 'expired').length,
            cancelled: updatedCoupons.filter(c => c.status === 'cancelled').length,
          };
          
          const updatedData: UnifiedCouponsData = {
            coupons: updatedCoupons,
            totalCount: updatedCoupons.length,
            stats: updatedStats,
          };
          
          set({ data: updatedData });
          
          console.log(`📋 [COUPONS-STORE] Removed ${data.coupons.length - updatedCoupons.length} coupons linked to NDR ${ndrId}`);
        }
      },
    }),
    {
      name: 'coupons-storage', // Nom unique pour le localStorage
      partialize: (state) => ({ 
        data: state.data,
        lastFetch: state.lastFetch
      }), // On ne persiste que les données et lastFetch, pas isLoading/error
    }
  )
);