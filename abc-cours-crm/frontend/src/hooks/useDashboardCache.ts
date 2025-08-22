import { useCallback } from 'react';
import { useCache } from './useCache';
import { familyService } from '../services/familyService';
import { settlementService } from '../services/settlementService';
import type { Family, FamilyStats } from '../types/family';

interface DashboardData {
  families: Family[];
  stats: FamilyStats;
  settlementCounts: Record<string, number>;
}

export function useDashboardCache() {
  const fetchDashboardData = useCallback(async (): Promise<DashboardData> => {
    console.log('📊 DashboardCache: Chargement des données depuis l\'API');
    
    const [familiesData, statsData] = await Promise.all([
      familyService.getFamilies(),
      familyService.getFamilyStats(),
    ]);
    
    const families = Array.isArray(familiesData) ? familiesData : [];
    
    // Charger le nombre de notes de règlement pour chaque famille
    const counts: Record<string, number> = {};
    for (const family of families) {
      try {
        const count = await settlementService.getSettlementNotesCountByFamily(family._id);
        counts[family._id] = count;
      } catch (err) {
        console.error(`Erreur lors du comptage pour la famille ${family._id}:`, err);
        counts[family._id] = 0;
      }
    }
    
    return {
      families,
      stats: statsData,
      settlementCounts: counts,
    };
  }, []);
  
  const {
    data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  } = useCache('dashboard', fetchDashboardData, {
    ttl: 5 * 60 * 1000, // 5 minutes de cache
  });
  
  return {
    dashboardData: data,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache,
    isExpired,
  };
}