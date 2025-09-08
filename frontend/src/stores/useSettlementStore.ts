import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settlementService } from '../services/settlementService';
import type { SettlementNote } from '../services/settlementService';

// Interface pour les données unifiées des NDR
interface UnifiedSettlementData {
  settlements: SettlementNote[];
  totalCount: number;
  counts: Record<string, number>; // Nombre de NDR par famille
  firstDates: Record<string, string>; // Première date NDR par famille
}

interface SettlementState {
  // État
  data: UnifiedSettlementData | null;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  
  // Actions
  loadSettlements: () => Promise<void>;
  clearCache: () => void;
  isExpired: () => boolean;
  
  // Sélecteurs mémorisés
  getSettlements: () => SettlementNote[];
  getSettlementCount: (familyId: string) => number;
  getFirstSettlementDate: (familyId: string) => string;
  getTotalCount: () => number;
}

// TTL d'1 heure (60 * 60 * 1000 ms)
const TTL = 60 * 60 * 1000;

export const useSettlementStore = create<SettlementState>()(
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

      // Charger les données NDR (une seule fois tant que non expiré)
      loadSettlements: async () => {
        const { data, isLoading, isExpired } = get();
        
        // Si données présentes et non expirées, ne rien faire
        if (data && !isExpired() && !isLoading) {
          console.log('🚀 [SETTLEMENT-STORE] Using valid cache');
          return;
        }
        
        // Si déjà en cours de chargement, attendre
        if (isLoading) {
          console.log('🚀 [SETTLEMENT-STORE] Loading already in progress');
          return;
        }
        
        console.log('🚀 [SETTLEMENT-STORE] Starting API fetch...');
        set({ isLoading: true, error: null });
        
        try {
          // Charger toutes les NDR
          const response = await settlementService.getAllSettlementNotes(1, 100); // Limite API maximum
          const settlementsData = response.notes || [];
          const settlements = Array.isArray(settlementsData) ? settlementsData : [];
          
          // Calculer les statistiques par famille
          const counts: Record<string, number> = {};
          const firstDates: Record<string, string> = {};
          
          settlements.forEach((settlement) => {
            // Extraire l'ID de famille (peut être un string ou un objet)
            const familyId = typeof settlement.familyId === 'string' 
              ? settlement.familyId 
              : settlement.familyId._id;
            
            // Compter les NDR par famille
            counts[familyId] = (counts[familyId] || 0) + 1;
            
            // Déterminer la première date par famille
            const currentDate = new Date(settlement.createdAt);
            const currentDateStr = currentDate.toLocaleDateString('fr-FR');
            
            if (!firstDates[familyId] || currentDate < new Date(firstDates[familyId])) {
              firstDates[familyId] = currentDateStr;
            }
          });
          
          const unifiedData: UnifiedSettlementData = {
            settlements,
            totalCount: settlements.length,
            counts,
            firstDates,
          };
          
          console.log(`🚀 [SETTLEMENT-STORE] Data loaded: ${settlements.length} settlements, ${Object.keys(counts).length} families`);
          
          set({ 
            data: unifiedData, 
            isLoading: false, 
            lastFetch: Date.now(),
            error: null 
          });
          
        } catch (error: any) {
          console.error('❌ [SETTLEMENT-STORE] Error loading settlements:', error);
          set({ 
            isLoading: false, 
            error: error?.message || 'Error loading settlement data',
            lastFetch: 0
          });
        }
      },

      // Vider le cache
      clearCache: () => {
        set({ data: null, lastFetch: 0, error: null });
      },

      // Sélecteurs optimisés
      getSettlements: () => {
        const { data } = get();
        return data?.settlements || [];
      },

      getSettlementCount: (familyId: string) => {
        const { data } = get();
        return data?.counts[familyId] || 0;
      },

      getFirstSettlementDate: (familyId: string) => {
        const { data } = get();
        return data?.firstDates[familyId] || '';
      },

      getTotalCount: () => {
        const { data } = get();
        return data?.totalCount || 0;
      },
    }),
    {
      name: 'settlements-storage', // Nom unique pour le localStorage
      partialize: (state) => ({ 
        data: state.data,
        lastFetch: state.lastFetch
      }), // On ne persiste que les données et lastFetch, pas isLoading/error
    }
  )
);