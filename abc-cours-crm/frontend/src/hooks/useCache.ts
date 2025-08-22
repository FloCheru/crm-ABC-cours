import { useCallback, useEffect, useState } from 'react';
import { useDataCacheStore } from '../stores/useDataCacheStore';
import { useAppStore } from '../stores/useAppStore';

interface UseCacheOptions {
  ttl?: number; // Time to live en millisecondes
  forceRefresh?: boolean; // Forcer le rechargement même si le cache existe
  dependencies?: any[]; // Dépendances pour invalider le cache
}

interface UseCacheResult<T> {
  data: T | null;
  isFromCache: boolean;
  isLoading: boolean;
  setCacheData: (data: T) => void;
  invalidateCache: () => void;
  isExpired: boolean;
}

export function useCache<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheResult<T> {
  const { ttl = 5 * 60 * 1000, forceRefresh = false, dependencies = [] } = options;
  
  const { refreshTrigger } = useAppStore();
  const { getCache, setCache, invalidateCache, isExpired } = useDataCacheStore();
  
  // État de chargement local
  const [isLoading, setIsLoading] = useState(false);
  // Données à préserver pendant le rechargement
  const [lastValidData, setLastValidData] = useState<T | null>(null);
  
  // Vérifier si les données sont en cache et valides
  const cachedData = getCache<T>(cacheKey);
  const isCacheExpired = isExpired(cacheKey);
  const isFromCache = cachedData !== null && !isCacheExpired;
  
  // Mettre à jour lastValidData si on a des données en cache valides
  useEffect(() => {
    if (cachedData !== null && !isCacheExpired) {
      setLastValidData(cachedData);
    }
  }, [cachedData, isCacheExpired]);
  
  // Fonction pour sauvegarder en cache
  const setCacheData = useCallback((data: T) => {
    setCache(cacheKey, data, ttl);
  }, [cacheKey, setCache, ttl]);
  
  // Fonction pour invalider le cache
  const invalidateCacheData = useCallback(() => {
    invalidateCache(cacheKey);
  }, [cacheKey, invalidateCache]);
  
  // Fonction pour charger les données
  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log(`🔄 Cache: Chargement des données pour ${cacheKey}`);
      const data = await fetchFunction();
      setCacheData(data);
      setLastValidData(data); // Sauvegarder comme dernières données valides
      console.log(`✅ Cache: Données chargées pour ${cacheKey}`);
    } catch (error) {
      console.error(`❌ Cache: Erreur lors du chargement de ${cacheKey}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetchFunction, setCacheData]);
  
  // Effect pour gérer le chargement initial et le refresh
  useEffect(() => {
    const shouldLoadData = 
      forceRefresh || 
      cachedData === null || 
      isCacheExpired;
    
    if (shouldLoadData) {
      // Chargement immédiat sans attente
      loadData();
    }
  }, [loadData, forceRefresh, refreshTrigger, ...dependencies]);
  
  // Chargement initial immédiat si pas de données en cache
  useEffect(() => {
    if (cachedData === null && !isLoading) {
      console.log(`🚀 Cache: Chargement initial immédiat pour ${cacheKey}`);
      loadData();
    }
  }, []); // Effect qui ne se déclenche qu'au montage
  
  // Effect pour invalider le cache quand les dépendances changent
  useEffect(() => {
    if (dependencies.length > 0) {
      invalidateCacheData();
    }
  }, dependencies);
  
  // Déterminer quelles données retourner
  const dataToReturn = cachedData !== null ? cachedData : lastValidData;
  
  return {
    data: dataToReturn,
    isFromCache,
    isLoading,
    setCacheData,
    invalidateCache: invalidateCacheData,
    isExpired: isCacheExpired,
  };
}