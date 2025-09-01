import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { familyService } from '../services/familyService';
import { settlementService } from '../services/settlementService';
import type { Family } from '../types/family';
import type { FamilyStats } from '../services/familyService';

// Interface pour les données unifiées
interface UnifiedFamiliesData {
  families: Family[];
  stats: FamilyStats;
  prospects: Family[];
  clients: Family[];
  clientsWithNDR: Family[];
  firstNDRDates: { [familyId: string]: string };
}

interface FamiliesState {
  // État
  data: UnifiedFamiliesData | null;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  
  // Actions
  loadFamilies: () => Promise<void>;
  clearCache: () => void;
  isExpired: () => boolean;
  addProspectOptimistic: (newProspect: Family) => void;
  removeProspectOptimistic: (prospectId: string) => void;
  updateProspectOptimistic: (prospectId: string, updates: Partial<Family>) => void;
  replaceProspectId: (tempId: string, realId: string) => void;
  
  // Sélecteurs mémorisés
  getProspects: () => Family[];
  getClients: () => Family[];
  getClientsWithNDR: () => Family[];
  getStats: () => FamilyStats | null;
  getFirstNDRDate: (familyId: string) => string;
}

// TTL d'1 heure (60 * 60 * 1000 ms)
const TTL = 60 * 60 * 1000;

export const useFamiliesStore = create<FamiliesState>()(
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

  // Charger les données (une seule fois tant que non expiré)
  loadFamilies: async () => {
    const { data, isLoading, isExpired } = get();
    
    // Si données présentes et non expirées, ne rien faire
    if (data && !isExpired() && !isLoading) {
      console.log('🚀 [FAMILIES-STORE] Using valid cache');
      return;
    }
    
    // Si déjà en cours de chargement, attendre
    if (isLoading) {
      console.log('🚀 [FAMILIES-STORE] Loading already in progress');
      return;
    }
    
    console.log('🚀 [FAMILIES-STORE] Starting API fetch...');
    set({ isLoading: true, error: null });
    
    try {
      const [familiesData, statsData] = await Promise.all([
        familyService.getFamilies(),
        familyService.getFamilyStats(),
      ]);
      
      const families = Array.isArray(familiesData) ? familiesData : [];
      
      // Filtrage local des prospects et clients
      const prospects = families.filter((family) => family.status === 'prospect');
      const clients = families.filter((family) => family.status === 'client');
      
      // Chargement optimisé des NDR pour les clients avec rate limiting
      const clientsWithNDR: Family[] = [];
      const ndrDates: { [familyId: string]: string } = {};
      
      const batchSize = 3;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (let i = 0; i < clients.length; i += batchSize) {
        const batch = clients.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (client) => {
            try {
              const ndrList = await settlementService.getSettlementNotesByFamily(client._id);
              if (ndrList.length > 0) {
                clientsWithNDR.push(client);
                const sortedNDRs = ndrList.sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                ndrDates[client._id] = new Date(sortedNDRs[0].createdAt).toLocaleDateString('fr-FR');
              }
            } catch (err) {
              console.error(`Erreur lors du chargement des NDR pour ${client._id}:`, err);
            }
          })
        );
        
        if (i + batchSize < clients.length) {
          await delay(200);
        }
      }
      
      const unifiedData: UnifiedFamiliesData = {
        families,
        stats: statsData,
        prospects,
        clients,
        clientsWithNDR,
        firstNDRDates: ndrDates,
      };
      
      console.log(`🚀 [FAMILIES-STORE] Data loaded: ${families.length} families, ${prospects.length} prospects, ${clientsWithNDR.length} clients with NDR`);
      
      set({ 
        data: unifiedData, 
        isLoading: false, 
        lastFetch: Date.now(),
        error: null 
      });
      
    } catch (error: any) {
      console.error('❌ [FAMILIES-STORE] Erreur lors du chargement:', error);
      set({ 
        isLoading: false, 
        error: error?.message || 'Erreur lors du chargement des données',
        lastFetch: 0
      });
    }
  },

  // Vider le cache
  clearCache: () => {
    set({ data: null, lastFetch: 0, error: null });
  },

  // Ajouter un prospect de manière optimiste (UX instantanée)
  addProspectOptimistic: (newProspect: Family) => {
    const { data } = get();
    if (!data) return;

    const updatedFamilies = [...data.families, newProspect];
    const updatedProspects = [...data.prospects, newProspect];
    
    // Recalculer les stats optimistes
    const updatedStats = {
      ...data.stats,
      totalFamilies: updatedFamilies.length,
      totalProspects: updatedProspects.length,
    };

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
      stats: updatedStats,
    };

    set({ 
      data: optimisticData,
      lastFetch: Date.now() // Marquer comme fraîchement mis à jour
    });
    
    console.log('🚀 [FAMILIES-STORE] Prospect ajouté de manière optimiste');
  },

  // Supprimer un prospect de manière optimiste (UX instantanée)
  removeProspectOptimistic: (prospectId: string) => {
    const { data } = get();
    if (!data) return;

    const updatedFamilies = data.families.filter(f => f._id !== prospectId);
    const updatedProspects = data.prospects.filter(f => f._id !== prospectId);
    
    // Recalculer les stats optimistes
    const updatedStats = {
      ...data.stats,
      totalFamilies: updatedFamilies.length,
      totalProspects: updatedProspects.length,
    };

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
      stats: updatedStats,
    };

    set({ 
      data: optimisticData,
      lastFetch: Date.now() // Marquer comme fraîchement mis à jour
    });
    
    console.log('🗑️ [FAMILIES-STORE] Prospect supprimé de manière optimiste');
  },

  // Mettre à jour un prospect de manière optimiste (UX instantanée)
  updateProspectOptimistic: (prospectId: string, updates: Partial<Family>) => {
    const { data } = get();
    if (!data) return;

    // Mettre à jour dans families
    const updatedFamilies = data.families.map(f => 
      f._id === prospectId ? { ...f, ...updates } : f
    );
    
    // Mettre à jour dans prospects
    const updatedProspects = data.prospects.map(f => 
      f._id === prospectId ? { ...f, ...updates } : f
    );

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
    };

    set({ 
      data: optimisticData,
      lastFetch: Date.now() // Marquer comme fraîchement mis à jour
    });
    
    console.log('✏️ [FAMILIES-STORE] Prospect mis à jour de manière optimiste');
  },

  // Remplacer l'ID temporaire par le vrai ID après création
  replaceProspectId: (tempId: string, realId: string) => {
    const { data } = get();
    if (!data) return;

    // Remplacer l'ID dans families
    const updatedFamilies = data.families.map(f => 
      f._id === tempId ? { ...f, _id: realId } : f
    );
    
    // Remplacer l'ID dans prospects
    const updatedProspects = data.prospects.map(f => 
      f._id === tempId ? { ...f, _id: realId } : f
    );

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
    };

    set({ 
      data: optimisticData,
      // Ne pas toucher au lastFetch pour éviter de déclencher un rechargement
    });
    
    console.log(`🔄 [FAMILIES-STORE] ID temporaire ${tempId} remplacé par ${realId}`);
  },

  // Sélecteurs optimisés (pas de recalcul si data n'a pas changé)
  getProspects: () => {
    const { data } = get();
    return data?.prospects || [];
  },

  getClients: () => {
    const { data } = get();
    return data?.clients || [];
  },

  getClientsWithNDR: () => {
    const { data } = get();
    return data?.clientsWithNDR || [];
  },

  getStats: () => {
    const { data } = get();
    return data?.stats || null;
  },

  getFirstNDRDate: (familyId: string) => {
    const { data } = get();
    return data?.firstNDRDates[familyId] || '';
  },
}),
{
  name: 'families-storage', // Nom unique pour le localStorage
  partialize: (state) => ({ 
    data: state.data,
    lastFetch: state.lastFetch
  }), // On ne persiste que les données et lastFetch, pas isLoading/error
}
)
);