# 📚 API Reference - Hooks de Cache ABC Cours CRM

## 🎯 Vue d'Ensemble

Cette référence détaille l'API complète des hooks de cache optimisés pour faciliter l'intégration et le développement.

---

## 🏗️ useFamiliesCache()

**Fichier** : `src/hooks/useFamiliesCache.ts`  
**Description** : Hook principal unifié pour la gestion des familles, prospects, clients et statistiques.  
**TTL** : 30 minutes (optimisé pour données stables)

### Import
```typescript
import { useFamiliesCache } from '../hooks/useFamiliesCache';
```

### Signature TypeScript
```typescript
interface UnifiedFamiliesData {
  families: Family[];
  stats: FamilyStats;
  prospects: Family[];
  clients: Family[];
  clientsWithNDR: Family[];
  firstNDRDates: { [familyId: string]: string };
}

interface UseFamiliesCacheOptions {
  dependencies?: any[]; // 🔄 NOUVEAU: Dependencies pour rechargement forcé
}

interface UseFamiliesCacheReturn {
  // État
  familiesData: UnifiedFamiliesData | null;
  isFromCache: boolean;
  isLoading: boolean;
  isExpired: boolean;
  
  // Getters optimisés
  getProspects: () => Family[];
  getClients: () => Family[];
  getClientsWithNDR: () => Family[];
  getAllFamilies: () => Family[];
  getStats: () => FamilyStats | undefined;
  getFirstNDRDate: (familyId: string) => string;
  
  // Gestion cache
  setCacheData: (data: UnifiedFamiliesData) => void;
  invalidateCache: () => void;
}

// 🔄 NOUVELLE SIGNATURE avec options
function useFamiliesCache(options?: UseFamiliesCacheOptions): UseFamiliesCacheReturn;
```

### Propriétés de Retour

#### État du Cache
| Propriété | Type | Description |
|-----------|------|-------------|
| `familiesData` | `UnifiedFamiliesData \| null` | Données complètes ou null si pas encore chargées |
| `isFromCache` | `boolean` | true si données viennent du cache, false si appel API |
| `isLoading` | `boolean` | true pendant le chargement des données |
| `isExpired` | `boolean` | true si le cache a expiré (> 30min) |

#### Getters Optimisés (Performance Instantanée)
| Méthode | Retour | Description |
|---------|--------|-------------|
| `getProspects()` | `Family[]` | Familles avec status 'prospect' uniquement |
| `getClients()` | `Family[]` | Familles avec status 'client' uniquement |
| `getClientsWithNDR()` | `Family[]` | Clients ayant au moins une NDR |
| `getAllFamilies()` | `Family[]` | Toutes les familles sans filtre |
| `getStats()` | `FamilyStats \| undefined` | Statistiques globales (total, prospects, clients) |
| `getFirstNDRDate(id)` | `string` | Date de la première NDR pour une famille (format FR) |

#### Gestion du Cache
| Méthode | Paramètres | Description |
|---------|------------|-------------|
| `setCacheData(data)` | `UnifiedFamiliesData` | Sauvegarde manuelle dans le cache |
| `invalidateCache()` | aucun | Force l'expiration et le rechargement |

### Exemples d'Usage

#### 🎯 Usage Standard
```typescript
const {
  familiesData,
  isFromCache,
  isLoading,
  getProspects,
  getClientsWithNDR,
  getStats,
  getFirstNDRDate,
  invalidateCache
} = useFamiliesCache();

// Vérification de l'état
if (isLoading) {
  return <Loading />;
}

// Utilisation des getters (instantané)
const prospects = getProspects();
const clients = getClientsWithNDR();
const stats = getStats();

// Accès aux dates NDR
const firstNDR = getFirstNDRDate('family_id_123');

// Performance monitoring
console.log(isFromCache ? '⚡ Cache hit' : '🌐 API call');

// Invalidation après mutation
const handleCreateFamily = async (data) => {
  await familyService.create(data);
  invalidateCache(); // Force refresh
};
```

#### 🔄 Rechargement Forcé (Nouveau !)
```typescript
// Component avec rechargement forcé
const [refreshKey, setRefreshKey] = useState(0);
const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();

const {
  getProspects,
  isLoading
} = useFamiliesCache({
  dependencies: [refreshKey] // ⚡ Déclenche rechargement sur changement
});

const handleCreateProspect = async (data) => {
  try {
    await familyService.createFamily(data);
    
    // 🔄 Double invalidation pour rechargement garanti
    invalidateAllFamilyRelatedCaches(); // Vide tous les caches
    
    setTimeout(() => {
      setRefreshKey(prev => prev + 1); // Force rechargement immédiat
      console.log('🔄 Rechargement forcé déclenché');
    }, 200); // Délai pour garantir API response
    
  } catch (error) {
    console.error('Erreur création prospect:', error);
  }
};

// Résultat : Le tableau se recharge automatiquement en ~200ms
```

#### 🌐 Invalidation Globale
```typescript
import { useCacheInvalidation } from '../hooks/useCacheInvalidation';

const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();

// Invalide tous les caches famille-related (families + ndr + prospects + clients)
const handleMajorUpdate = async () => {
  await performMajorChanges();
  invalidateAllFamilyRelatedCaches(); // 🌐 Reset complet
};
```

---

## 🔍 useNDRCache()

**Fichier** : `src/hooks/useNDRCache.ts`  
**Description** : Hook lazy pour la gestion des Notes de Règlement par famille.  
**TTL** : 15 minutes (données modérément stables)  
**Mode** : Lazy Loading (désactivé par défaut)

### Import
```typescript
import { useNDRCache } from '../hooks/useNDRCache';
```

### Signature TypeScript
```typescript
interface NDRData {
  counts: Record<string, number>;
  firstDates: Record<string, string>;
}

interface UseNDRCacheReturn {
  // État
  ndrData: NDRData | null;
  isFromCache: boolean;
  isLoading: boolean;
  isExpired: boolean;
  
  // Lazy Loading API
  loadNDRForFamilies: (familyIds: string[]) => Promise<NDRData>;
  enableCacheForFamilies: (familyIds: string[]) => Promise<NDRData>;
  
  // Getters
  getNDRCount: (familyId: string) => number;
  getFirstNDRDate: (familyId: string) => string;
  
  // Status helpers
  isCacheEmpty: () => boolean;
  isCacheActive: () => boolean;
  
  // Gestion cache
  setCacheData: (data: NDRData) => void;
  invalidateCache: () => void;
}
```

### Propriétés de Retour

#### État du Cache
| Propriété | Type | Description |
|-----------|------|-------------|
| `ndrData` | `NDRData \| null` | Données NDR ou null si pas encore chargées |
| `isFromCache` | `boolean` | true si données viennent du cache |
| `isLoading` | `boolean` | true pendant le chargement |
| `isExpired` | `boolean` | true si cache expiré (> 15min) |

#### Lazy Loading API
| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `loadNDRForFamilies(ids)` | `string[]` | `Promise<NDRData>` | Charge les NDR pour une liste de familles |
| `enableCacheForFamilies(ids)` | `string[]` | `Promise<NDRData>` | Alias pour loadNDRForFamilies |

#### Getters
| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `getNDRCount(id)` | `string` | `number` | Nombre de NDR pour une famille |
| `getFirstNDRDate(id)` | `string` | `string` | Date première NDR (format FR) |

#### Status Helpers
| Méthode | Retour | Description |
|---------|--------|-------------|
| `isCacheEmpty()` | `boolean` | true si aucune donnée en cache |
| `isCacheActive()` | `boolean` | true si cache existe et non expiré |

### Exemple d'Usage
```typescript
const {
  ndrData,
  isLoading,
  loadNDRForFamilies,
  getNDRCount,
  getFirstNDRDate,
  isCacheActive
} = useNDRCache();

// Activation lazy au besoin
useEffect(() => {
  if (shouldLoadNDRData && !isCacheActive()) {
    const familyIds = families.map(f => f._id);
    loadNDRForFamilies(familyIds);
  }
}, [families, shouldLoadNDRData]);

// Utilisation après chargement
if (ndrData) {
  const count = getNDRCount('family_123');
  const firstDate = getFirstNDRDate('family_123');
}

// Monitoring
console.log(`📊 NDR Cache: ${ndrData ? 'Actif' : 'Inactif'}`);
```

### Rate Limiting
Le hook implémente automatiquement un rate limiting :
- **Batch size** : 3 appels simultanés maximum
- **Délai** : 200ms entre les batches
- **Protection** : Évite les erreurs 429 (Too Many Requests)

---

## 🎫 useCouponCache()

**Fichier** : `src/hooks/useCouponCache.ts`  
**Description** : Hook lazy pour la gestion des séries de coupons et statistiques.  
**TTL** : 60 minutes (données très stables)  
**Mode** : Lazy Loading (désactivé par défaut)

### Import
```typescript
import { useCouponCache } from '../hooks/useCouponCache';
```

### Signature TypeScript
```typescript
interface CouponSeries {
  _id: string;
  seriesName: string;
  startNumber: number;
  endNumber: number;
  usedNumbers: number[];
  createdAt: string;
  updatedAt: string;
}

interface CouponData {
  series: CouponSeries[];
  totalCoupons: number;
  usedCoupons: number;
  availableCoupons: number;
}

interface UseCouponCacheReturn {
  // État
  couponData: CouponData | null;
  isFromCache: boolean;
  isLoading: boolean;
  isExpired: boolean;
  
  // Lazy Loading API
  loadCoupons: () => Promise<CouponData>;
  enableCache: () => Promise<CouponData>;
  refreshCoupons: () => Promise<CouponData>;
  
  // Getters
  getSeries: () => CouponSeries[];
  getStats: () => { total: number; used: number; available: number };
  getSeriesById: (id: string) => CouponSeries | undefined;
  getAvailableCouponsInSeries: (series: CouponSeries) => number;
  
  // Status helpers
  isCacheEmpty: () => boolean;
  isCacheActive: () => boolean;
  
  // Gestion cache
  setCacheData: (data: CouponData) => void;
  invalidateCache: () => void;
}
```

### Propriétés de Retour

#### État du Cache
| Propriété | Type | Description |
|-----------|------|-------------|
| `couponData` | `CouponData \| null` | Données coupons ou null si pas chargées |
| `isFromCache` | `boolean` | true si données viennent du cache |
| `isLoading` | `boolean` | true pendant le chargement |
| `isExpired` | `boolean` | true si cache expiré (> 60min) |

#### Lazy Loading API
| Méthode | Retour | Description |
|---------|--------|-------------|
| `loadCoupons()` | `Promise<CouponData>` | Charge les données coupons à la demande |
| `enableCache()` | `Promise<CouponData>` | Alias pour loadCoupons |
| `refreshCoupons()` | `Promise<CouponData>` | Force le rechargement (ignore cache) |

#### Getters
| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `getSeries()` | aucun | `CouponSeries[]` | Toutes les séries de coupons |
| `getStats()` | aucun | `{total, used, available}` | Statistiques globales coupons |
| `getSeriesById(id)` | `string` | `CouponSeries \| undefined` | Série spécifique par ID |
| `getAvailableCouponsInSeries(series)` | `CouponSeries` | `number` | Coupons disponibles dans une série |

### Exemple d'Usage
```typescript
const {
  couponData,
  isLoading,
  loadCoupons,
  getSeries,
  getStats,
  getSeriesById,
  isCacheActive
} = useCouponCache();

// Activation lazy sur navigation coupons
useEffect(() => {
  if (isOnCouponPage && !isCacheActive()) {
    loadCoupons();
  }
}, [isOnCouponPage]);

// Utilisation après chargement
if (couponData) {
  const series = getSeries();
  const stats = getStats();
  const specificSeries = getSeriesById('series_123');
}

// Refresh après modification
const handleCreateSeries = async (data) => {
  await couponService.createSeries(data);
  await refreshCoupons(); // Rechargement forcé
};
```

**Note** : Ce hook contient des services fictifs qui doivent être implémentés selon votre architecture API.

---

## 🎛️ useDataCacheStore()

**Fichier** : `src/stores/useDataCacheStore.ts`  
**Description** : Store Zustand central pour la gestion de tous les caches.

### API Store
```typescript
interface DataCacheState {
  // Caches spécialisés
  familiesCache: CacheState | null;
  ndrCache: CacheState | null;
  couponSeriesCache: CacheState | null;
  couponsCache: CacheState | null;
  
  // Actions génériques
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  getCache: <T>(key: string) => T | null;
  invalidateCache: (key: string) => void;
  invalidateAllCache: () => void;
  isExpired: (key: string) => boolean;
}
```

### Méthodes Store

| Méthode | Paramètres | Description |
|---------|------------|-------------|
| `setCache<T>(key, data, ttl?)` | `string, T, number?` | Sauvegarde avec TTL auto-optimisé |
| `getCache<T>(key)` | `string` | Récupération avec vérification expiration |
| `invalidateCache(key)` | `string` | Invalidation d'un cache spécifique |
| `invalidateAllCache()` | aucun | Reset complet de tous les caches |
| `isExpired(key)` | `string` | Vérification expiration d'un cache |

### TTL Auto-Optimisés
```typescript
const CACHE_TTL = {
  families: 30 * 60 * 1000,    // 30min
  ndr: 15 * 60 * 1000,         // 15min  
  couponSeries: 60 * 60 * 1000, // 60min
  coupons: 15 * 60 * 1000,     // 15min
  default: 5 * 60 * 1000       // 5min
};

// TTL sélectionné automatiquement selon la clé
setCache('families', data); // → TTL 30min automatique
setCache('ndr', data);      // → TTL 15min automatique
setCache('custom', data, 10000); // → TTL manuel 10sec
```

---

## 🛠️ Patterns d'Usage Avancés

### 1. Composition de Hooks
```typescript
// Combiner plusieurs caches
const useUnifiedData = () => {
  const families = useFamiliesCache();
  const ndr = useNDRCache();
  const coupons = useCouponCache();
  
  return {
    families,
    ndr,
    coupons,
    isAnyLoading: families.isLoading || ndr.isLoading || coupons.isLoading,
    invalidateAll: () => {
      families.invalidateCache();
      ndr.invalidateCache();
      coupons.invalidateCache();
    }
  };
};
```

### 2. Conditional Loading
```typescript
// Chargement conditionnel intelligent
const useSmartDataLoading = (userRole: string, currentPage: string) => {
  const families = useFamiliesCache(); // Toujours chargé
  const ndr = useNDRCache();
  const coupons = useCouponCache();
  
  useEffect(() => {
    // NDR seulement pour admins sur dashboard
    if (userRole === 'admin' && currentPage === 'dashboard') {
      const familyIds = families.getAllFamilies().map(f => f._id);
      ndr.loadNDRForFamilies(familyIds);
    }
    
    // Coupons seulement sur page coupons
    if (currentPage === 'coupons') {
      coupons.loadCoupons();
    }
  }, [userRole, currentPage, families.familiesData]);
};
```

### 3. Cache Warming
```typescript
// Pré-chargement intelligent
const useCacheWarming = () => {
  const families = useFamiliesCache();
  
  useEffect(() => {
    // Pré-charger dès le login
    if (!families.familiesData && !families.isLoading) {
      console.log('🔥 Cache warming: Pré-chargement familles');
    }
  }, []);
  
  return {
    warmupComplete: !!families.familiesData,
    warmupProgress: families.isLoading ? 'loading' : 'complete'
  };
};
```

### 4. Error Handling
```typescript
// Gestion d'erreur robuste
const useRobustCache = () => {
  const [errors, setErrors] = useState<Record<string, Error>>({});
  
  const families = useFamiliesCache();
  const ndr = useNDRCache();
  
  const loadWithErrorHandling = async (
    loader: () => Promise<any>, 
    cacheKey: string
  ) => {
    try {
      await loader();
      setErrors(prev => ({ ...prev, [cacheKey]: undefined }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [cacheKey]: error as Error }));
      console.error(`❌ Cache error for ${cacheKey}:`, error);
    }
  };
  
  return {
    families,
    ndr,
    errors,
    hasErrors: Object.values(errors).some(Boolean),
    retryAll: () => {
      families.invalidateCache();
      ndr.invalidateCache();
    }
  };
};
```

---

## 🔄 useCacheInvalidation() - NOUVEAU !

**Fichier** : `src/hooks/useCacheInvalidation.ts`  
**Description** : Hook spécialisé pour l'invalidation globale et le rechargement forcé des caches.  
**Usage** : Mutations importantes nécessitant un refresh complet.

### Import
```typescript
import { useCacheInvalidation } from '../hooks/useCacheInvalidation';
```

### Signature TypeScript
```typescript
interface UseCacheInvalidationReturn {
  invalidateAllFamilyRelatedCaches: () => void;
}

function useCacheInvalidation(): UseCacheInvalidationReturn;
```

### API Methods

| Méthode | Description | Caches Affectés |
|---------|-------------|-----------------|
| `invalidateAllFamilyRelatedCaches()` | Invalide tous les caches famille-related | families, ndr, prospects, clients |

### Exemples d'Usage

#### 🌐 Invalidation Globale
```typescript
const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();

const handleMajorUpdate = async () => {
  await performMajorDataChanges();
  invalidateAllFamilyRelatedCaches(); // 🌐 Reset complet
};
```

#### 🔄 Pattern Rechargement Forcé
```typescript
// Dans un composant avec setState
const [refreshKey, setRefreshKey] = useState(0);
const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();

const { getProspects } = useFamiliesCache({
  dependencies: [refreshKey] // Écoute les changements
});

const handleCreateWithForceReload = async (data) => {
  await apiCall(data);
  
  // Double invalidation pour garantir le rechargement
  invalidateAllFamilyRelatedCaches(); // 1. Vide les caches
  setTimeout(() => {
    setRefreshKey(prev => prev + 1); // 2. Force reload via dependencies
  }, 200);
};
```

#### ⚡ Cas d'Usage Optimaux
- ✅ Après création/modification bulk d'entités
- ✅ Synchronisation avec API externe
- ✅ Reset après erreur de cache majeure
- ✅ Workflow de création prospect → client
- ❌ Modifications simples (préférer invalidateCache() local)

---

## 📊 Performance Guidelines

### Cache Hit Rate Optimal
- **families** : > 85% (données stables)
- **ndr** : > 70% (données modérées) 
- **coupons** : > 90% (données très stables)

### Memory Usage
- **Limite recommandée** : < 50MB total pour tous les caches
- **Monitoring** : Utiliser `performance.memory` en dev

### Network Efficiency
- **Reduction target** : -60% appels API vs version non-cachée
- **Batch operations** : Préférer 1 gros appel vs plusieurs petits

---

*API Reference - Agent Documentation - v2.0*  
*Dernière mise à jour : 2025-01-22*