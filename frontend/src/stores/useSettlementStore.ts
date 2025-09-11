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
  replaceSettlementId: (tempId: string, realId: string) => void;
  
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

      // Méthode optimisticUpdate pour ActionCache
      optimisticUpdate: (action: any, actionData: any) => {
        if (action === 'CREATE_NDR') {
          const { familyId, ndrData, tempNdrId } = actionData;
          const { data } = get();
          if (!data) return;
          
          // Créer NDR optimiste avec ID temporaire fourni
          const tempNDR = {
            ...ndrData,
            _id: tempNdrId || `temp-${Date.now()}`, // Utiliser l'ID fourni ou générer un nouveau
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          
          // Mettre à jour settlements, counts, firstDates
          const updatedSettlements = [...data.settlements, tempNDR];
          const updatedCounts = { ...data.counts };
          updatedCounts[familyId] = (updatedCounts[familyId] || 0) + 1;
          
          // Première date pour cette famille si nécessaire
          const updatedFirstDates = { ...data.firstDates };
          if (!updatedFirstDates[familyId]) {
            updatedFirstDates[familyId] = new Date().toLocaleDateString('fr-FR');
          }
          
          set({
            data: {
              ...data,
              settlements: updatedSettlements,
              counts: updatedCounts,
              firstDates: updatedFirstDates,
              totalCount: data.totalCount + 1
            }
          });
          
          console.log(`📋 [SETTLEMENT-STORE] NDR optimiste ajoutée pour famille ${familyId}`);
        }
        
        if (action === 'DELETE_NDR') {
          const { ndrId, familyId } = actionData;
          const { data } = get();
          if (!data) return;
          
          // Retirer la NDR des settlements
          const updatedSettlements = data.settlements.filter(ndr => ndr._id !== ndrId);
          
          // Mettre à jour les counts
          const updatedCounts = { ...data.counts };
          if (updatedCounts[familyId] > 0) {
            updatedCounts[familyId] = updatedCounts[familyId] - 1;
            
            // Si plus de NDR pour cette famille, retirer de counts et firstDates
            if (updatedCounts[familyId] === 0) {
              delete updatedCounts[familyId];
              const updatedFirstDates = { ...data.firstDates };
              delete updatedFirstDates[familyId];
              
              set({
                data: {
                  ...data,
                  settlements: updatedSettlements,
                  counts: updatedCounts,
                  firstDates: updatedFirstDates,
                  totalCount: data.totalCount - 1
                }
              });
            } else {
              set({
                data: {
                  ...data,
                  settlements: updatedSettlements,
                  counts: updatedCounts,
                  totalCount: data.totalCount - 1
                }
              });
            }
          }
          
          console.log(`📋 [SETTLEMENT-STORE] NDR ${ndrId} supprimée pour famille ${familyId}`);
        }
      },

      // Remplacer l'ID temporaire d'une NDR par le vrai ID après création
      replaceSettlementId: (tempId: string, realId: string) => {
        const { data } = get();
        if (!data) return;

        // Remplacer l'ID dans settlements
        const updatedSettlements = data.settlements.map(ndr => 
          ndr._id === tempId ? { ...ndr, _id: realId, status: 'active' } : ndr
        );
        
        const updatedData: UnifiedSettlementData = {
          ...data,
          settlements: updatedSettlements,
        };

        set({ 
          data: updatedData,
          // Ne pas toucher au lastFetch pour éviter de déclencher un rechargement
        });
        
        console.log(`🔄 [SETTLEMENT-STORE] ID temporaire NDR ${tempId} remplacé par ${realId}`);
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