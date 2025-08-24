import { useCallback } from 'react';
import { useCache } from './useCache';
import { familyService, type FamilyStats } from '../services/familyService';
import { settlementService } from '../services/settlementService';
import type { Family } from '../types/family';

interface UnifiedFamiliesData {
  families: Family[];
  stats: FamilyStats;
  prospects: Family[];
  clients: Family[];
  clientsWithNDR: Family[];
  firstNDRDates: { [familyId: string]: string };
}

interface UseFamiliesCacheOptions {
  dependencies?: any[];
}

export function useFamiliesCache(options: UseFamiliesCacheOptions = {}) {
  const fetchUnifiedFamiliesData = useCallback(async (): Promise<UnifiedFamiliesData> => {
    console.log('🏗️ FamiliesCache: Chargement unifié optimisé des données familles');
    
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
    
    console.log(`✅ FamiliesCache: ${families.length} familles, ${prospects.length} prospects, ${clientsWithNDR.length} clients avec NDR`);
    
    return {
      families,
      stats: statsData,
      prospects,
      clients,
      clientsWithNDR,
      firstNDRDates: ndrDates,
    };
  }, []);
  
  const {
    data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  } = useCache('families', fetchUnifiedFamiliesData, {
    dependencies: options.dependencies || []
  });
  
  return {
    familiesData: data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
    // Getters spécialisés pour chaque page - PERFORMANCE OPTIMISÉE
    getProspects: () => data?.prospects || [],
    getClients: () => data?.clients || [],
    getClientsWithNDR: () => data?.clientsWithNDR || [],
    getAllFamilies: () => data?.families || [],
    getStats: () => data?.stats,
    getFirstNDRDate: (familyId: string) => data?.firstNDRDates[familyId] || '',
  };
}