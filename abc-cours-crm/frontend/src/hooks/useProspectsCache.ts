import { useCallback } from 'react';
import { useCache } from './useCache';
import { familyService, type FamilyStats } from '../services/familyService';
import type { Family } from '../types/family';

interface ProspectsData {
  prospects: Family[];
  stats: FamilyStats;
}

export function useProspectsCache() {
  const fetchProspectsData = useCallback(async (): Promise<ProspectsData> => {
    console.log('📊 ProspectsCache: Chargement des données depuis l\'API');
    
    const [familiesData, statsData] = await Promise.all([
      familyService.getFamilies(),
      familyService.getFamilyStats(),
    ]);
    
    const families = Array.isArray(familiesData) ? familiesData : [];
    const prospects = families.filter((family) => family.status === 'prospect');
    
    return {
      prospects,
      stats: statsData,
    };
  }, []);
  
  const {
    data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  } = useCache('prospects', fetchProspectsData, {
    ttl: 5 * 60 * 1000, // 5 minutes de cache
  });
  
  return {
    prospectsData: data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  };
}