# ⏰ Stratégies TTL et Cache par Domaine - ABC Cours CRM

## 🎯 Philosophie des TTL

### Principe de Base
**TTL = Équilibre entre Performance et Fraîcheur des Données**

```
Plus les données changent rarement → TTL plus long → Moins d'appels API
Plus les données changent souvent → TTL plus court → Plus de fraîcheur
```

---

## 📊 Matrice TTL par Domaine

| Domaine | TTL | Fréquence Changement | Justification |
|---------|-----|---------------------|---------------|
| **families** | 30min | Très faible | Infos famille changent rarement |
| **ndr** | 15min | Modérée | Créations NDR régulières |
| **couponSeries** | 60min | Très faible | Séries créées ponctuellement |
| **coupons** | 15min | Modérée | Utilisation quotidienne |
| **default** | 5min | Variable | Sécurité pour nouveaux caches |

---

## 🏗️ Stratégies par Type de Données

### 1. Données Référentielles (TTL Long)
**Exemples** : Séries de coupons, informations familles, matières
**TTL Recommandé** : 30-60 minutes

```typescript
// Configuration
families: 30 * 60 * 1000,    // 30min
couponSeries: 60 * 60 * 1000, // 60min

// Raison
// Ces données changent très rarement
// Impact performance élevé si rechargées souvent
// Acceptable d'avoir 30-60min de délai
```

### 2. Données Transactionnelles (TTL Moyen)
**Exemples** : Notes de règlement, utilisation coupons
**TTL Recommandé** : 10-20 minutes

```typescript
// Configuration  
ndr: 15 * 60 * 1000,      // 15min
coupons: 15 * 60 * 1000,  // 15min

// Raison
// Mises à jour régulières mais pas temps réel
// Équilibre entre performance et fraîcheur
// 15min acceptable pour la plupart des cas
```

### 3. Données Temps Réel (TTL Court)
**Exemples** : Alertes, notifications, états critiques
**TTL Recommandé** : 1-5 minutes

```typescript
// Configuration
notifications: 1 * 60 * 1000,  // 1min
alerts: 2 * 60 * 1000,         // 2min
default: 5 * 60 * 1000,        // 5min (fallback)

// Raison
// Données critiques nécessitant fraîcheur
// TTL court pour cohérence temps réel
```

---

## 🔄 Stratégies d'Invalidation

### 1. Invalidation Automatique (Expiration TTL)
```typescript
// Vérification automatique à chaque accès
if (Date.now() - timestamp > ttl) {
  console.log(`🕐 Cache expiré pour ${key} après ${ttl}ms`);
  invalidateAndReload();
}
```

### 2. Invalidation Manuelle (Mutations)
```typescript
// Après création/modification/suppression
const handleCreateFamily = async (data) => {
  await familyService.create(data);
  
  // Invalider caches impactés
  invalidateFamiliesCache();    // Cache principal
  invalidateStatsCache();       // Stats dépendantes
  
  console.log('💥 Cache invalidé après création famille');
};
```

### 3. Invalidation Intelligente (Dépendances)
```typescript
// Invalider automatiquement les caches dépendants
const invalidationMap = {
  families: ['stats', 'prospects', 'clients'],
  ndr: ['familyStats', 'dashboardData'],
  coupons: ['couponStats', 'seriesUsage']
};

function smartInvalidation(primaryCache: string) {
  const dependentCaches = invalidationMap[primaryCache] || [];
  
  dependentCaches.forEach(cache => {
    invalidateCache(cache);
    console.log(`🔗 Invalidation en cascade: ${cache}`);
  });
}
```

---

## ⚡ Optimisations Avancées

### 1. TTL Adaptatif
```typescript
// Ajuster TTL selon l'usage
function getAdaptiveTTL(cacheKey: string, usage: CacheUsage): number {
  const baseTTL = CACHE_TTL[cacheKey] || CACHE_TTL.default;
  
  if (usage.hitRate > 0.9) {
    // Cache très utilisé → TTL plus long
    return baseTTL * 1.5;
  }
  
  if (usage.errorRate > 0.1) {
    // Beaucoup d'erreurs → TTL plus court
    return baseTTL * 0.5;
  }
  
  return baseTTL;
}
```

### 2. Cache Warming
```typescript
// Pré-charger les caches critiques
function warmupCriticalCaches() {
  // Au démarrage app
  useFamiliesCache(); // Charge immédiatement
  
  // Après login
  setTimeout(() => {
    preloadStats();
    preloadUserPreferences();
  }, 1000);
}
```

### 3. Cache Layering
```typescript
// Plusieurs niveaux de cache
interface CacheLayer {
  l1: MemoryCache;    // TTL court, accès ultra-rapide
  l2: LocalStorage;   // TTL moyen, persistant
  l3: IndexedDB;      // TTL long, grandes données
}

// Stratégie d'accès
function getData(key: string) {
  return l1.get(key) || 
         l2.get(key) || 
         l3.get(key) || 
         fetchFromAPI(key);
}
```

---

## 📈 Monitoring TTL

### 1. Métriques de Performance
```typescript
interface TTLMetrics {
  cacheKey: string;
  averageAge: number;      // Âge moyen des données
  hitRate: number;         // Taux de cache hit
  prematureExpiration: number; // Expirations trop rapides
  staleDataRate: number;   // Taux de données obsolètes
}

// Alertes automatiques
function monitorTTL(metrics: TTLMetrics) {
  if (metrics.hitRate < 0.7) {
    console.warn(`⚠️ TTL trop court pour ${metrics.cacheKey} - Hit rate: ${metrics.hitRate}`);
  }
  
  if (metrics.staleDataRate > 0.2) {
    console.warn(`⚠️ TTL trop long pour ${metrics.cacheKey} - Stale rate: ${metrics.staleDataRate}`);
  }
}
```

### 2. Dashboard TTL
```typescript
// Tableau de bord des performances cache
const CacheMetricsDashboard = () => {
  const metrics = useCacheMetrics();
  
  return (
    <div>
      {Object.entries(metrics).map(([key, data]) => (
        <div key={key}>
          <h3>{key}</h3>
          <p>TTL: {CACHE_TTL[key]}ms</p>
          <p>Hit Rate: {data.hitRate}%</p>
          <p>Average Age: {data.averageAge}ms</p>
          <ProgressBar 
            value={data.hitRate} 
            color={data.hitRate > 80 ? 'green' : 'orange'} 
          />
        </div>
      ))}
    </div>
  );
};
```

---

## 🎛️ Configuration Environnement

### Développement vs Production

```typescript
// config/cache.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const CACHE_TTL = {
  families: isDevelopment 
    ? 5 * 60 * 1000     // 5min en dev (plus de flexibilité)
    : 30 * 60 * 1000,   // 30min en prod (performance)
    
  ndr: isDevelopment
    ? 2 * 60 * 1000     // 2min en dev
    : 15 * 60 * 1000,   // 15min en prod
    
  couponSeries: isDevelopment
    ? 5 * 60 * 1000     // 5min en dev
    : 60 * 60 * 1000,   // 60min en prod
};

// Logs plus détaillés en développement
export const CACHE_DEBUG = {
  enabled: isDevelopment,
  verboseLogging: isDevelopment,
  performanceWarnings: true,
};
```

### Configuration par Utilisateur
```typescript
// Paramètres utilisateur avancés
interface UserCachePreferences {
  aggressiveCaching: boolean;  // TTL * 2 pour utilisateurs avancés
  backgroundRefresh: boolean;  // Refresh automatique en arrière-plan
  offlineMode: boolean;        // TTL très long pour mode offline
}

function getUserOptimizedTTL(baseKey: string, userPrefs: UserCachePreferences): number {
  let ttl = CACHE_TTL[baseKey] || CACHE_TTL.default;
  
  if (userPrefs.aggressiveCaching) {
    ttl *= 2; // Double TTL pour utilisateurs expérimentés
  }
  
  if (userPrefs.offlineMode) {
    ttl *= 10; // TTL très long pour mode offline
  }
  
  return ttl;
}
```

---

## 🧪 Testing des Stratégies TTL

### Tests Unitaires
```typescript
describe('Cache TTL Strategy', () => {
  test('families cache should have 30min TTL', () => {
    const { setCacheData, isExpired } = useFamiliesCache();
    
    setCacheData(mockFamilyData);
    
    // Simuler 25 minutes
    jest.advanceTimersByTime(25 * 60 * 1000);
    expect(isExpired()).toBe(false);
    
    // Simuler 35 minutes
    jest.advanceTimersByTime(10 * 60 * 1000);
    expect(isExpired()).toBe(true);
  });
  
  test('ndr cache should have 15min TTL', () => {
    // Test similaire pour NDR
  });
});
```

### Tests d'Intégration
```typescript
// Test performance avec différents TTL
describe('TTL Performance Impact', () => {
  test('should reduce API calls with appropriate TTL', async () => {
    const apiSpy = jest.spyOn(familyService, 'getFamilies');
    
    // Premier appel
    const { getProspects } = useFamiliesCache();
    await getProspects();
    
    // Deuxième appel immédiat (doit utiliser cache)
    await getProspects();
    
    expect(apiSpy).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📋 Recommandations par Cas d'Usage

### Application Desktop (Performance Prioritaire)
```typescript
// TTL plus longs pour réduire latence réseau
const DESKTOP_TTL = {
  families: 45 * 60 * 1000,    // 45min
  ndr: 20 * 60 * 1000,         // 20min
  couponSeries: 90 * 60 * 1000, // 90min
};
```

### Application Mobile (Batterie/Data Prioritaire)
```typescript
// TTL très longs pour économiser batterie/data
const MOBILE_TTL = {
  families: 60 * 60 * 1000,    // 60min
  ndr: 30 * 60 * 1000,         // 30min
  couponSeries: 120 * 60 * 1000, // 120min
};
```

### Mode Temps Réel (Fraîcheur Prioritaire)
```typescript
// TTL courts pour données temps réel
const REALTIME_TTL = {
  families: 5 * 60 * 1000,     // 5min
  ndr: 2 * 60 * 1000,          // 2min
  couponSeries: 10 * 60 * 1000, // 10min
};
```

---

## 🔄 Évolution et Maintenance

### Révision Mensuelle
1. **Analyser les métriques** de cache hit rate
2. **Ajuster TTL** selon les patterns d'usage réels
3. **Identifier nouveaux domaines** nécessitant cache
4. **Optimiser** les stratégies d'invalidation

### Expansion Future
```typescript
// Nouveaux domaines à considérer
const FUTURE_CACHE_DOMAINS = {
  userSessions: 60 * 60 * 1000,     // Sessions utilisateur
  notifications: 1 * 60 * 1000,     // Notifications
  systemHealth: 30 * 1000,          // Santé système
  reports: 24 * 60 * 60 * 1000,     // Rapports (cache 24h)
};
```

---

*Documentation TTL - Maintenue par l'Agent Documentation*  
*Dernière révision : 2025-01-22*