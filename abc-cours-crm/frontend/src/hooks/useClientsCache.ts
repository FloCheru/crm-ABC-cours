import { useCallback } from 'react';
import { useCache } from './useCache';
import { familyService, type FamilyStats } from '../services/familyService';
import { settlementService } from '../services/settlementService';
import type { Family } from '../types/family';

interface ClientsData {
  clients: Family[];
  stats: FamilyStats;
  firstNDRDates: { [familyId: string]: string };
}

export function useClientsCache() {
  const fetchClientsData = useCallback(async (): Promise<ClientsData> => {
    console.log('📊 ClientsCache: Chargement des données depuis l\'API');
    
    const [familiesData, statsData] = await Promise.all([
      familyService.getFamilies(),
      familyService.getFamilyStats(),
    ]);
    
    const families = Array.isArray(familiesData) ? familiesData : [];
    const clients = families.filter((family) => family.status === 'client');
    
    // Charger les dates de première NDR pour chaque client
    const ndrDates: { [familyId: string]: string } = {};
    await Promise.all(
      clients.map(async (client) => {
        try {
          const ndrList = await settlementService.getSettlementNotesByFamily(client._id);
          if (ndrList.length > 0) {
            const sortedNDRs = ndrList.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            ndrDates[client._id] = new Date(sortedNDRs[0].createdAt).toLocaleDateString('fr-FR');
          }
        } catch (err) {
          console.error(`Erreur lors du chargement des NDR pour ${client._id}:`, err);
          ndrDates[client._id] = new Date(client.createdAt).toLocaleDateString('fr-FR');
        }
      })
    );
    
    return {
      clients,
      stats: statsData,
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
  } = useCache('clients', fetchClientsData, {
    ttl: 5 * 60 * 1000, // 5 minutes de cache
  });
  
  return {
    clientsData: data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  };
}