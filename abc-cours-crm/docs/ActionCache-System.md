# Système ActionCache - Gestion Intelligente du Cache

## Vue d'ensemble

Le système ActionCache est une architecture avancée de gestion du cache basée sur les actions métier, implémentée pour optimiser les performances et maintenir la cohérence des données dans l'application CRM ABC Cours.

**Problème résolu :**
- Élimination des invalidations de cache excessives
- Coordination automatique entre les stores Zustand
- Amélioration des performances UX avec les updates optimistes
- Gestion centralisée des erreurs avec rollback

## Architecture et Composants

### 1. Actions Métier Supportées

```typescript
export type BusinessAction = 
  | 'CREATE_PROSPECT'    // Création nouveau prospect
  | 'CREATE_NDR'         // Création note de règlement (prospect → client)
  | 'DELETE_NDR'         // Suppression note de règlement  
  | 'DELETE_CLIENT'      // Suppression client complet
  | 'DELETE_PROSPECT';   // Suppression prospect simple
```

### 2. Mapping Actions → Stores

```typescript
const ACTION_CACHE_MAP: ActionStoreMapping = {
  CREATE_PROSPECT: ['families'],                                    // Impact minimal
  CREATE_NDR: ['settlements', 'families', 'coupons', 'couponSeries'], // Impact total
  DELETE_NDR: ['settlements', 'families', 'coupons', 'couponSeries'], // Impact total  
  DELETE_CLIENT: ['settlements', 'families', 'coupons', 'couponSeries'], // Impact total
  DELETE_PROSPECT: ['families']                                     // Impact minimal
};
```

### 3. Interface Store Compatible

Chaque store doit implémenter l'interface `CacheStore` :

```typescript
export interface CacheStore {
  // État obligatoire
  data: any;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  
  // Actions obligatoires
  clearCache: () => void;
  isExpired: () => boolean;
  
  // Actions optionnelles (optimistic updates)
  optimisticUpdate?: (action: BusinessAction, data: any) => void;
  rollback?: (action: BusinessAction, data: any) => void;
}
```

## Guide d'Utilisation Pratique

### 1. Hook React (Composants)

```typescript
import { useActionCache } from '../hooks/useActionCache';

function ProspectForm() {
  const { executeAction, getCacheStatus } = useActionCache();
  
  const handleCreateProspect = async (formData) => {
    try {
      const newProspect = await executeAction(
        'CREATE_PROSPECT',
        () => apiClient.post('/api/families', formData),
        {
          tempId: `temp-${Date.now()}`,
          familyData: formData
        }
      );
      
      // Succès : cache invalidé automatiquement
      navigate('/prospects');
      
    } catch (error) {
      // Échec : rollback automatique des updates optimistes
      toast.error('Erreur lors de la création');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(handleCreateProspect)}>
      {/* Formulaire */}
    </form>
  );
}
```

### 2. Service (Logique métier)

```typescript
import ActionCacheService from '../services/actionCacheService';

class SettlementService {
  static async createSettlementNote(data: CreateSettlementData) {
    return ActionCacheService.executeAction(
      'CREATE_NDR',
      async () => {
        const response = await rateLimitedApiClient.post("/api/settlement-notes", data);
        return response.settlementNote;
      },
      {
        familyId: data.familyId,
        newStatus: 'client' as const,
        ndrData: data
      }
    );
  }
  
  static async deleteSettlementNote(ndrId: string, familyId: string) {
    return ActionCacheService.executeAction(
      'DELETE_NDR',
      () => apiClient.delete(`/api/settlement-notes/${ndrId}`),
      {
        ndrId,
        familyId,
        revertStatus: 'prospect'
      }
    );
  }
}
```

## Logique Métier des Actions

### CREATE_PROSPECT
- **Impact :** `families` store uniquement  
- **Optimistic :** Ajoute temporairement le prospect à la liste
- **Rollback :** Retire le prospect temporaire en cas d'échec

### CREATE_NDR (Critique)
- **Impact :** Tous les stores (`settlements`, `families`, `coupons`, `couponSeries`)
- **Logique métier :** Transformation prospect → client + création NDR
- **Optimistic :** Met à jour le status famille + ajoute NDR temporaire
- **Backend sync :** `Family.findByIdAndUpdate(familyId, { status: "client" })`

**Implémentation backend (ligne 375-381 dans `backend/routes/settlementNotes.js`) :**
```javascript
// Changer automatiquement le statut de "prospect" à "client" si c'est la première note de règlement
const family = await Family.findById(familyId);
if (family && family.status === "prospect") {
  await Family.findByIdAndUpdate(
    familyId, 
    { status: "client" },
    { new: true, runValidators: false }
  );
}
```

### DELETE_NDR
- **Impact :** Tous les stores
- **Logique métier :** Peut reverter client → prospect selon business rules
- **Optimistic :** Retire NDR + ajuste status famille si nécessaire

### DELETE_CLIENT/DELETE_PROSPECT  
- **Impact :** Variable selon le type
- **Optimistic :** Retire immédiatement de toutes les listes concernées

## Gestion des Erreurs et Rollback

### Flux Normal (Succès)
```
1. Optimistic Updates → 2. Persist Database → 3. Cache Invalidation
```

### Flux Erreur (Échec)
```
1. Optimistic Updates → 2. Database Error → 3. Automatic Rollback
```

**Exemple de gestion d'erreur :**

```typescript
try {
  // 1. Updates optimistes appliqués
  executeOptimisticUpdates(stores, action, data);
  
  // 2. Tentative persistance
  const result = await persistFn();
  
  // 3. Succès → invalidation
  invalidateLoadedCaches(stores);
  
} catch (error) {
  // 4. Échec → rollback automatique
  executeRollbacks(stores, action, data);
  throw error; // Re-throw pour l'appelant
}
```

## Performance et Optimisations

### 1. Invalidation Conditionnelle
- **Principe :** Ne invalide que les stores qui ont des données chargées
- **Bénéfice :** Évite les re-fetch inutiles de stores vides
- **Implémentation :**

```typescript
const isStoreLoaded = (storeName: StoreName): boolean => {
  const store = getStoreState(storeName);
  return !!store.data; // Vérifie la présence de données
};

// Invalidation seulement si chargé
if (store.data) {
  store.clearCache();
  invalidatedCount++;
} else {
  console.log(`⏭️ Skipping ${storeName} cache (not loaded)`);
}
```

### 2. Logging Détaillé
- Traçabilité complète des opérations de cache
- Métriques de performance (temps d'exécution)
- Debugging facilité avec préfixes `[ACTION-CACHE]`

**Exemples de logs :**
```
🚀 [ACTION-CACHE] Executing CREATE_NDR affecting [settlements, families, coupons, couponSeries]
🔮 [ACTION-CACHE] Applying optimistic updates for CREATE_NDR...  
💾 [ACTION-CACHE] Persisting CREATE_NDR to database...
🗑️ [ACTION-CACHE] Invalidating families cache (was loaded)
✅ [ACTION-CACHE] CREATE_NDR completed successfully in 245ms
```

### 3. Références Stables
- `useMemo` pour éviter la re-création des instances de stores
- `useCallback` pour toutes les fonctions utilitaires
- Optimisation des re-renders React

## Tests et Validation

### Structure des Tests

```
frontend/tests/
├── hooks/
│   └── useActionCache.test.ts          # Tests unitaires hook (12 tests)
└── integration/
    └── actionCache-integration.test.ts  # Tests intégration (12 tests)
```

### Couverture de Test (24 tests total)

**Tests Unitaires (useActionCache.test.ts) :**
- Configuration et validation des actions
- Gestion des erreurs et rollback
- Invalidation conditionnelle 
- Optimistic updates et recovery

**Tests d'Intégration (actionCache-integration.test.ts) :**
- Scénarios réels avec vrais stores
- Workflow CREATE_PROSPECT complet
- Workflow CREATE_NDR avec transformation métier
- Gestion des échecs avec stores multiples

### Exemple de Test Métier

```typescript
test('CREATE_NDR doit transformer prospect en client et invalider tous les stores chargés', async () => {
  // Setup : simuler stores families et settlements chargés
  useFamiliesStore.setState({ data: familiesData, lastFetch: Date.now() });
  useSettlementStore.setState({ data: settlementsData, lastFetch: Date.now() });
  
  const { result } = renderHook(() => useActionCache());
  
  await act(async () => {
    await result.current.executeAction(
      'CREATE_NDR',
      mockCreateNDR,
      { familyId: 'family-123', newStatus: 'client', ndrData: mockNDR }
    );
  });
  
  // Vérifications
  expect(useFamiliesStore.getState().data).toBeNull(); // Cache invalidé
  expect(useSettlementStore.getState().data).toBeNull(); // Cache invalidé
  expect(useCouponsStore.getState().data).toBeDefined(); // Pas chargé, pas invalidé
});
```

## Bonnes Pratiques

### 1. Choix Hook vs Service

**Utilisez le Hook (`useActionCache`) :**
- Dans les composants React
- Pour les interactions utilisateur directes
- Quand vous avez besoin de `getCacheStatus()` pour debugging

**Utilisez le Service (`ActionCacheService`) :**
- Dans les services métier
- Pour la logique serveur-side
- Dans les utilitaires sans contexte React

### 2. Données Optimistes

**Toujours fournir des données optimistes pour :**
- CREATE_PROSPECT : `{ tempId, familyData }`
- CREATE_NDR : `{ familyId, newStatus: 'client', ndrData }`
- DELETE_* : `{ id, revertStatus? }`

**Règle :** Plus l'action est critique, plus les données optimistes doivent être précises.

### 3. Gestion d'Erreur

```typescript
// ❌ Mauvais : ne pas capturer les erreurs
await executeAction('CREATE_NDR', persistFn);

// ✅ Bon : gestion complète des erreurs
try {
  const result = await executeAction('CREATE_NDR', persistFn, optimisticData);
  toast.success('NDR créée avec succès');
  navigate('/settlements');
} catch (error) {
  // Le rollback est automatique
  toast.error(`Erreur : ${error.message}`);
}
```

### 4. Performance

- **Évitez** les actions en série, privilégiez les actions atomiques
- **Utilisez** le cache status pour debugger les performances
- **Profilez** les actions lentes avec les métriques de durée

### 5. Debugging

```typescript
// Status détaillé des caches
const { getCacheStatus } = useActionCache();
console.log('Cache Status:', getCacheStatus());

// Logs automatiques avec préfixes distinctifs :
// 🚀 [ACTION-CACHE] Executing CREATE_NDR affecting [settlements, families, coupons, couponSeries]
// 🔮 [ACTION-CACHE] Applying optimistic updates for CREATE_NDR...  
// 💾 [ACTION-CACHE] Persisting CREATE_NDR to database...
// 🗑️ [ACTION-CACHE] Invalidating families cache (was loaded)
// ✅ [ACTION-CACHE] CREATE_NDR completed successfully in 245ms
```

## Intégrations Existantes

Le système ActionCache est déjà intégré dans les services suivants :

**Service Settlement (lignes 99-110 dans `frontend/src/services/settlementService.ts`) :**
```typescript
return ActionCacheService.executeAction(
  'CREATE_NDR',
  async () => {
    const response = await rateLimitedApiClient.post("/api/settlement-notes", data);
    return response.settlementNote;
  },
  {
    familyId: data.familyId,
    newStatus: 'client',
    ndrData: data
  }
);
```

**Service Family - CREATE_PROSPECT (lignes 85-98 dans `frontend/src/services/familyService.ts`) :**
```typescript
return ActionCacheService.executeAction(
  'CREATE_PROSPECT',
  async () => {
    const response = await apiClient.post("/api/families", familyData);
    return response.family;
  },
  {
    tempId: `temp-${Date.now()}`,
    familyData: familyData
  }
);
```

**Service Family - DELETE actions (lignes 139-163 dans `frontend/src/services/familyService.ts`) :**
```typescript
return ActionCacheService.executeAction(
  action, // DELETE_PROSPECT ou DELETE_CLIENT
  async () => {
    await apiClient.delete(`/api/families/${id}`);
  },
  action === 'DELETE_CLIENT' 
    ? { clientId: id }
    : { prospectId: id }
);
```

## Fichiers Sources

**Core System :**
- `frontend/src/hooks/useActionCache.ts` - Hook React principal (211 lignes)
- `frontend/src/services/actionCacheService.ts` - Service pour logique métier (196 lignes)
- `frontend/src/types/actionCache.ts` - Types TypeScript complets (84 lignes)

**Intégrations :**
- `frontend/src/services/settlementService.ts` (lignes 99-110) - CREATE_NDR
- `frontend/src/services/familyService.ts` (lignes 85-98, 139-163) - CREATE_PROSPECT + DELETE_*
- `backend/routes/settlementNotes.js` (lignes 375-381) - Sync status famille

**Tests :**
- `frontend/tests/hooks/useActionCache.test.ts` - Tests unitaires (12 tests, 374 lignes)
- `frontend/tests/integration/actionCache-integration.test.ts` - Tests intégration (12 tests, 364 lignes)

## Extension du Système

Pour ajouter de nouvelles actions métier :

1. **Ajouter le type d'action** dans `types/actionCache.ts`
2. **Définir le mapping stores** dans `ACTION_CACHE_MAP`
3. **Ajouter les données optimistes** dans l'interface `OptimisticData`
4. **Implémenter dans les stores** (méthodes `optimisticUpdate` et `rollback`)
5. **Créer des tests spécifiques** pour la nouvelle action

---

*Système ActionCache - Version complète documentée le 01/09/2025*