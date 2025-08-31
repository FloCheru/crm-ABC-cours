import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { couponSeriesService } from '../services/couponSeriesService';
import { couponService } from '../services/couponService';
import type { CouponSeries, Coupon } from '../types/coupon';

// Interface pour les données unifiées des séries de coupons
interface UnifiedCouponSeriesData {
  series: CouponSeries[];
  totalCount: number;
  seriesDetails: Record<string, { series: CouponSeries; coupons: Coupon[] }>; // Cache des détails par série
}

interface CouponSeriesState {
  // État
  data: UnifiedCouponSeriesData | null;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  
  // Actions
  loadCouponSeries: () => Promise<void>;
  loadSeriesDetails: (seriesId: string) => Promise<{ series: CouponSeries; coupons: Coupon[] }>;
  clearCache: () => void;
  isExpired: () => boolean;
  
  // Sélecteurs mémorisés
  getCouponSeries: () => CouponSeries[];
  getSeriesDetails: (seriesId: string) => { series: CouponSeries; coupons: Coupon[] } | null;
  getTotalCount: () => number;
}

// TTL d'1 heure (60 * 60 * 1000 ms)
const TTL = 60 * 60 * 1000;

export const useCouponSeriesStore = create<CouponSeriesState>()(
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

      // Charger les séries de coupons (une seule fois tant que non expiré)
      loadCouponSeries: async () => {
        const { data, isLoading, isExpired } = get();
        
        // Si données présentes et non expirées, ne rien faire
        if (data && !isExpired() && !isLoading) {
          console.log('🚀 [COUPON-SERIES-STORE] Using valid cache');
          return;
        }
        
        // Si déjà en cours de chargement, attendre
        if (isLoading) {
          console.log('🚀 [COUPON-SERIES-STORE] Loading already in progress');
          return;
        }
        
        console.log('🚀 [COUPON-SERIES-STORE] Starting API fetch...');
        set({ isLoading: true, error: null });
        
        try {
          // Charger toutes les séries de coupons
          const seriesData = await couponSeriesService.getCouponSeries();
          const series = Array.isArray(seriesData) ? seriesData : [];
          
          const unifiedData: UnifiedCouponSeriesData = {
            series,
            totalCount: series.length,
            seriesDetails: {}, // Détails chargés à la demande
          };
          
          console.log(`🚀 [COUPON-SERIES-STORE] Data loaded: ${series.length} series`);
          
          set({ 
            data: unifiedData, 
            isLoading: false, 
            lastFetch: Date.now(),
            error: null 
          });
          
        } catch (error: any) {
          console.error('❌ [COUPON-SERIES-STORE] Error loading series:', error);
          set({ 
            isLoading: false, 
            error: error?.message || 'Error loading coupon series data',
            lastFetch: 0
          });
        }
      },

      // Charger les détails d'une série spécifique avec ses coupons
      loadSeriesDetails: async (seriesId: string) => {
        const { data } = get();
        
        // Vérifier si déjà en cache
        if (data?.seriesDetails[seriesId]) {
          console.log(`🚀 [COUPON-SERIES-STORE] Using cached details for series ${seriesId}`);
          return data.seriesDetails[seriesId];
        }
        
        console.log(`🚀 [COUPON-SERIES-STORE] Loading details for series ${seriesId}...`);
        
        try {
          // Charger les détails de la série et ses coupons
          const [seriesDetails, couponsData] = await Promise.all([
            couponSeriesService.getCouponSeriesById(seriesId),
            couponService.getCoupons({ series: seriesId })
          ]);
          
          const coupons = Array.isArray(couponsData) ? couponsData : [];
          const result = { series: seriesDetails, coupons };
          
          // Mettre en cache les détails
          const currentData = get().data;
          if (currentData) {
            const updatedData = {
              ...currentData,
              seriesDetails: {
                ...currentData.seriesDetails,
                [seriesId]: result
              }
            };
            
            set({ data: updatedData });
          }
          
          console.log(`🚀 [COUPON-SERIES-STORE] Details loaded for series ${seriesId}: ${coupons.length} coupons`);
          return result;
          
        } catch (error: any) {
          console.error(`❌ [COUPON-SERIES-STORE] Error loading series details for ${seriesId}:`, error);
          throw error;
        }
      },

      // Vider le cache
      clearCache: () => {
        set({ data: null, lastFetch: 0, error: null });
      },

      // Sélecteurs optimisés
      getCouponSeries: () => {
        const { data } = get();
        return data?.series || [];
      },

      getSeriesDetails: (seriesId: string) => {
        const { data } = get();
        return data?.seriesDetails[seriesId] || null;
      },

      getTotalCount: () => {
        const { data } = get();
        return data?.totalCount || 0;
      },
    }),
    {
      name: 'coupon-series-storage', // Nom unique pour le localStorage
      partialize: (state) => ({ 
        data: state.data,
        lastFetch: state.lastFetch
      }), // On ne persiste que les données et lastFetch, pas isLoading/error
    }
  )
);