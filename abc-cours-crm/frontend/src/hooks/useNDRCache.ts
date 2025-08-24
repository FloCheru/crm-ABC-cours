import { useCallback } from 'react';
import { useCache } from './useCache';
import { settlementService } from '../services/settlementService';

interface NDRData {
  counts: Record<string, number>;
  firstDates: Record<string, string>;
}

export function useNDRCache() {
  const fetchNDRData = useCallback(async (familyIds: string[]): Promise<NDRData> => {
    console.log('🏗️ NDRCache: Chargement des données NDR pour', familyIds.length, 'familles');
    
    const counts: Record<string, number> = {};
    const firstDates: Record<string, string> = {};
    
    // Traitement par batch pour éviter les erreurs 429
    const batchSize = 3;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < familyIds.length; i += batchSize) {
      const batch = familyIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (familyId) => {
          try {
            const ndrList = await settlementService.getSettlementNotesByFamily(familyId);
            counts[familyId] = ndrList.length;
            
            if (ndrList.length > 0) {
              const sortedNDRs = ndrList.sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              firstDates[familyId] = new Date(sortedNDRs[0].createdAt).toLocaleDateString('fr-FR');
            }
          } catch (err) {
            console.error(`Erreur lors du chargement des NDR pour ${familyId}:`, err);
            counts[familyId] = 0;
          }
        })
      );
      
      // Pause entre les batches pour éviter le rate limiting
      if (i + batchSize < familyIds.length) {
        await delay(200);
      }
    }
    
    console.log(`✅ NDRCache: ${Object.keys(counts).length} familles traitées`);
    
    return {
      counts,
      firstDates,
    };
  }, []);
  
  // Cache NDR avec lazy loading optimisé
  const {
    data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  } = useCache('ndr', () => fetchNDRData([]), {
    enabled: false, // LAZY LOADING - Cache désactivé par défaut
  });
  
  // LAZY LOADING - Fonction pour charger les NDR à la demande
  const loadNDRForFamilies = useCallback(async (familyIds: string[]): Promise<NDRData> => {
    console.log(`🔄 NDRCache: Chargement lazy pour ${familyIds.length} familles`);
    
    if (familyIds.length === 0) {
      console.log('⚠️ NDRCache: Aucune famille fournie, retour données vides');
      return { counts: {}, firstDates: {} };
    }
    
    // Vérifier si on a déjà les données en cache
    if (data && !isExpired) {
      console.log('✅ NDRCache: Données trouvées en cache, pas de rechargement');
      return data;
    }
    
    try {
      const ndrData = await fetchNDRData(familyIds);
      setCacheData(ndrData);
      console.log(`✅ NDRCache: ${Object.keys(ndrData.counts).length} familles chargées et mises en cache`);
      return ndrData;
    } catch (error) {
      console.error('❌ NDRCache: Erreur lors du chargement lazy:', error);
      throw error;
    }
  }, [fetchNDRData, setCacheData, data, isExpired]);
  
  // Fonction pour activer le cache avec des familyIds
  const enableCacheForFamilies = useCallback(async (familyIds: string[]) => {
    return loadNDRForFamilies(familyIds);
  }, [loadNDRForFamilies]);
  
  return {
    ndrData: data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
    // LAZY LOADING API
    loadNDRForFamilies,
    enableCacheForFamilies,
    // Getters pour accès facile avec support lazy
    getNDRCount: (familyId: string) => data?.counts[familyId] || 0,
    getFirstNDRDate: (familyId: string) => data?.firstDates[familyId] || '',
    // Status helpers
    isCacheEmpty: () => !data || Object.keys(data.counts).length === 0,
    isCacheActive: () => !!data && !isExpired,
  };
}