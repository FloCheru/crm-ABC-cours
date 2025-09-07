# Tests Hooks

Ce dossier contient les tests unitaires pour les hooks React personnalisés.

## Structure recommandée
```
hooks/
├── useCache.test.js
├── useFamiliesCache.test.js
├── useAuthStore.test.js
└── useDataCacheStore.test.js
```

## Exemple de test hook
```javascript
import { renderHook, act } from '@testing-library/react';
import useCache from '../../src/hooks/useCache';

describe('useCache Hook', () => {
  test('returns cached data when available', () => {
    const { result } = renderHook(() => 
      useCache('test-key', { data: 'cached' })
    );
    
    expect(result.current.data).toBe('cached');
    expect(result.current.isFromCache).toBe(true);
  });
  
  test('invalidates cache when requested', () => {
    const { result } = renderHook(() => useCache('test-key'));
    
    act(() => {
      result.current.invalidateCache();
    });
    
    expect(result.current.isFromCache).toBe(false);
  });
});
```

## Patterns à suivre
- Utiliser `renderHook` de React Testing Library
- Tester tous les états du hook
- Tester les effets de bord
- Mocker les dépendances externes
- Tester les cleanup effects