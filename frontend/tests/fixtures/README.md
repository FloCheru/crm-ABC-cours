# Test Fixtures

Ce dossier contient les données de test réutilisables et les mocks partagés.

## Structure actuelle
```
fixtures/
└── README.md (ce fichier)
```

## Structure recommandée
```
fixtures/
├── families.fixture.js      # Données famille/prospects/clients
├── auth.fixture.js          # Tokens JWT et utilisateurs
├── settlements.fixture.js   # Notes de règlement
├── coupons.fixture.js      # Coupons et séries
└── subjects.fixture.js     # Matières et professeurs
```

## Utilisation
Les fixtures sont déjà disponibles via `testHelpers` global configuré dans `setup.js`.

### Exemple d'utilisation
```javascript
// Dans un test
const mockFamily = testHelpers.createMockFamily({
  status: 'client',
  primaryContact: { firstName: 'Jean', lastName: 'Dupont' },
  settlementNotes: ['ndr-1', 'ndr-2']
});
```

### Patterns établis
- `testHelpers.createMockFamily(overrides)` - Famille avec surcharges
- `testHelpers.waitForAsync()` - Attendre effets asynchrones  
- `testHelpers.createMockStore(state)` - Store Zustand mock

## Notes
- Les fixtures sont chargées globalement via `setup.js`
- Utiliser les overrides pour personnaliser les données
- Éviter la duplication de données de test
- Centraliser les mocks complexes ici