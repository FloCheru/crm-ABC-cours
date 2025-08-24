# Tests Frontend - ABC Cours CRM

Organisation des tests pour l'application React + TypeScript + Vite.

## 📁 Structure

```
tests/
├── setup.js                 # Configuration Jest globale
├── test-basic.test.js       # Tests de base (configuration)
├── README.md               # Ce fichier
├── pages/                  # Tests pages complètes
│   ├── prospects.test.js   # Tests page prospects (13 tests)
│   └── clients.test.js     # Tests page clients (26 tests)
├── components/            # Tests composants unitaires
│   └── README.md         # Guide et exemples
├── hooks/                # Tests hooks personnalisés  
│   └── README.md        # Guide et exemples
└── fixtures/            # Données de test réutilisables
    └── README.md       # Guide et utilisation
```

## 🚀 Scripts NPM

```bash
# Tests basiques
npm run test                    # Tous les tests
npm run test:basic             # Test configuration Jest
npm run test:watch             # Mode watch
npm run test:coverage          # Avec couverture

# Tests par catégorie
npm run test:pages             # Tests pages uniquement
npm run test:components        # Tests composants
npm run test:hooks             # Tests hooks

# Tests par page spécifique
npm run test:page:prospects    # Page prospects
npm run test:page:clients      # Page clients  
npm run test:page:dashboard    # Page dashboard
```

## ⚙️ Configuration

### Jest (jest.config.cjs)
- Environment: jsdom
- ESM support avec Babel
- Module mapping (@/, @components/, etc.)
- Setup global: tests/setup.js
- Coverage: 50% threshold

### Setup Global (setup.js)
- React Testing Library configuration
- Mocks: fetch, localStorage, react-router-dom
- TestHelpers globaux disponibles partout
- Fixtures centralisées

## 🧪 Tests Existants

### ✅ Pages (39/44 tests - 89%)
- **prospects.test.js**: 13 tests (Affichage, Interactions, Cache, API, Erreurs)
- **clients.test.js**: 26 tests (NDR management, reclassification, filtres)

### ✅ Configuration
- **test-basic.test.js**: 5 tests (Jest, setup, mocks, helpers)

## 📊 Couverture Actuelle

```
Pages Tests:     39/44 (89%) ✅
Configuration:    5/5  (100%) ✅  
Components:       0/0  (N/A) 📋
Hooks:           0/0  (N/A) 📋
Total:          44/44 (100% fonctionnels)
```

## 🎯 Patterns Établis

### Test Structure
```javascript
describe('📄 PAGE/COMPONENT NAME', () => {
  beforeAll(() => console.log('🚀 Début tests'));
  afterAll(() => console.log('✅ Fin tests'));

  describe('🎨 Affichage', () => {
    test('✅ Élément visible et correct', () => {
      // Test logique...
      console.log('✅ Test: Description');
    });
  });
});
```

### Mock Components
```javascript
const MockComponent = ({ prop }) => {
  const [state, setState] = useState(initialValue);
  return (
    <div data-testid="component">
      {/* JSX test structure */}
    </div>
  );
};

render(<MockComponent prop="value" />);
expect(screen.getByTestId('component')).toBeInTheDocument();
```

### API Testing
```javascript
global.fetch = jest.fn().mockResolvedValueOnce({
  ok: true,
  json: async () => mockResponse
});

const result = await apiCall();
expect(global.fetch).toHaveBeenCalledWith(expectedUrl, expectedOptions);
```

## 🔧 Outils et Technologies

- **Jest**: Framework de test
- **React Testing Library**: Rendu et interactions composants
- **@testing-library/user-event**: Interactions utilisateur avancées  
- **jsdom**: Environment DOM pour tests
- **Babel**: Transformation ESM/JSX
- **Identity-obj-proxy**: Mock CSS modules

## 📝 Bonnes Pratiques

1. **Tests descriptifs**: Noms explicites avec émojis
2. **Mocks minimaux**: Seulement ce qui est nécessaire
3. **Data-testid**: Sélecteurs stables pour éléments
4. **Async/await**: Gestion correcte asynchrone  
5. **Console.log**: Messages informatifs pour debugging
6. **Fixtures globales**: Réutiliser testHelpers partout
7. **Structure cohérente**: Affichage → Interactions → Cache → API → Erreurs

## 🚨 Problèmes Résolus

- ✅ Configuration Jest ESM
- ✅ TextEncoder/TextDecoder Node.js
- ✅ React Router mocking
- ✅ Module name mapping
- ✅ Template literals parsing
- ✅ Services API mocking

## 🎯 Pour l'Agent Test

Ce système est prêt pour utilisation avec patterns établis, fixtures disponibles, et scripts organisés. Utiliser les exemples des tests existants comme référence pour maintenir la cohérence.