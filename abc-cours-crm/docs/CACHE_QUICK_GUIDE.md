# 🚀 Guide Rapide - Cache ABC Cours CRM

## 🎯 Guide 5 Minutes pour Développeurs

### Quel Hook Utiliser ?

```typescript
// 📊 FAMILLES, PROSPECTS, CLIENTS → useFamiliesCache
import { useFamiliesCache } from '../hooks/useFamiliesCache';

// 📋 NOTES DE RÈGLEMENT → useNDRCache (lazy)
import { useNDRCache } from '../hooks/useNDRCache';

// 🎫 COUPONS → useCouponCache (lazy) 
import { useCouponCache } from '../hooks/useCouponCache';
```

---

## ⚡ Usage Instantané

### Page Familles/Prospects/Clients
```typescript
const {
  getProspects,      // → Family[] (prospects uniquement)
  getClients,        // → Family[] (clients uniquement)
  getClientsWithNDR, // → Family[] (clients avec NDR)
  getStats,          // → FamilyStats (totaux)
  getFirstNDRDate,   // → (id) => string (date première NDR)
} = useFamiliesCache();

// Utilisation directe - PERFORMANCE INSTANTANÉE
const prospects = getProspects();
const clients = getClientsWithNDR();
const stats = getStats();
```

### Page Dashboard NDR (Lazy)
```typescript
const {
  loadNDRForFamilies, // → (ids[]) => Promise<data>
  getNDRCount,        // → (id) => number
  isCacheActive,      // → boolean
} = useNDRCache();

// Activation lazy
useEffect(() => {
  if (shouldShowNDR) {
    loadNDRForFamilies(familyIds);
  }
}, [navigation]);
```

### Page Coupons (Lazy)
```typescript
const {
  loadCoupons,       // → () => Promise<data>
  getSeries,         // → CouponSeries[]
  getStats,          // → { total, used, available }
} = useCouponCache();

// Activation lazy
useEffect(() => {
  loadCoupons(); // Charge seulement si on navigue vers coupons
}, []);
```

---

## 🔄 Patterns d'Invalidation

### 🎯 Invalidation Simple
```typescript
// Après création/modification
const { invalidateCache } = useFamiliesCache();

const handleCreateFamily = async (data) => {
  await familyService.create(data);
  invalidateCache(); // Force refresh
};
```

### 🔄 Rechargement Forcé (Nouveau !)
```typescript
// Pour rechargement immédiat avec dependencies
const [refreshKey, setRefreshKey] = useState(0);
const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();

const { getProspects } = useFamiliesCache({
  dependencies: [refreshKey] // ⚡ Déclenche rechargement
});

const handleCreateProspect = async (data) => {
  await familyService.createFamily(data);
  
  // Double invalidation pour rechargement garanti
  invalidateAllFamilyRelatedCaches();
  setTimeout(() => {
    setRefreshKey(prev => prev + 1); // 🔄 Force reload
  }, 200);
};
```

### 🌐 Invalidation Globale
```typescript
// Invalider tous les caches famille-related
const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();

invalidateAllFamilyRelatedCaches(); // families + ndr + prospects + clients
```

---

## 📊 TTL par Domaine

| Cache | TTL | Raison |
|-------|-----|--------|
| **families** | 30min | Données très stables |
| **ndr** | 15min | Modérément stables |
| **coupons** | 60min | Très stables |

---

## 🐛 Debug Rapide

```typescript
// Vérifier si données viennent du cache
const { isFromCache, isLoading } = useFamiliesCache();

console.log(isFromCache ? '⚡ Cache hit' : '🌐 API call');
console.log(isLoading ? '⏳ Loading...' : '✅ Ready');
```

---

## ❌ À NE PAS Faire

```typescript
// ❌ ANCIEN (supprimé)
import { useClientsCache } from '...'; // N'existe plus

// ❌ Charger cache inutilement  
useCouponCache(); // Si pas sur page coupons

// ❌ Ignorer lazy loading
useNDRCache(); // Sans loadNDRForFamilies()
```

## ✅ À Faire

```typescript
// ✅ Cache unifié
const { getClients } = useFamiliesCache();

// ✅ Lazy loading approprié
const { loadCoupons } = useCouponCache();
if (onCouponPage) loadCoupons();

// ✅ Invalidation après mutations
invalidateCache();
```

---

*Guide rapide - Pour documentation complète voir `CACHE_ARCHITECTURE.md`*