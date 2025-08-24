# 🧪 Guide Agent Test - Organisation des Tests

## 📁 Structure des Tests

```
tests/
├── backend/
│   ├── unit/           # Tests unitaires modèles
│   ├── integration/    # Tests API routes
│   └── fixtures/       # Données réutilisables
│
├── frontend/
│   ├── pages/         # 1 fichier = 1 page
│   ├── components/    # Tests composants
│   ├── hooks/         # Tests hooks custom
│   └── fixtures/      # Mocks frontend
│
└── e2e/
    ├── workflows/     # Tests bout-en-bout
    └── fixtures/      # Config E2E
```

## 🎯 Commandes NPM Disponibles

### Tests par Type
```bash
# Backend
npm run test:backend:unit        # Tests unitaires
npm run test:backend:api         # Tests intégration API

# Frontend  
npm run test:frontend:pages      # Toutes les pages
npm run test:frontend:components # Tous les composants

# E2E
npm run test:e2e                 # Tests bout-en-bout
```

### Tests par Page Spécifique
```bash
npm run test:page:prospects      # Page prospects uniquement
npm run test:page:clients        # Page clients uniquement
npm run test:page:dashboard      # Dashboard uniquement
```

### Tests Complets
```bash
npm run test:all                 # Tous les tests
npm run test:coverage            # Avec rapport de couverture
npm run test:ci                  # Pour CI/CD
```

## 📝 Template de Rapport Agent Test

```markdown
## 🧪 AGENT TEST - Exécution

### 📄 Page/Module testé : [NOM]
### 📁 Fichier : tests/[chemin]/[fichier].test.js

### ⚡ Commande exécutée :
\```bash
npm run test:page:[nom]
\```

### ✅ Résultats :
- 🎨 **Affichage** : X/Y tests passés
- ⚡ **Interactions** : X/Y tests passés  
- 🔄 **Cache** : X/Y tests passés
- 🌐 **API** : X/Y tests passés
- ❌ **Erreurs** : X/Y tests passés

### 📊 Coverage :
- **Statements** : XX%
- **Branches** : XX%
- **Functions** : XX%
- **Lines** : XX%

### 🐛 Tests échoués :
1. [Nom du test] : [Raison]
2. [Nom du test] : [Raison]

### 🔄 Status
TESTS_VALIDÉS / CORRECTIONS_REQUISES
```

## 🔧 Utilisation des Fixtures

### Backend
```javascript
// Import fixtures
const { prospectComplete, getAdminToken } = require('../fixtures/families.fixture');
const { setupAuth } = require('../fixtures/auth.fixture');

// Utilisation
test('Create prospect', async () => {
  const { tokens } = await setupAuth(User);
  
  const response = await request(app)
    .post('/api/families')
    .set('Authorization', `Bearer ${tokens.admin}`)
    .send(prospectComplete)
    .expect(201);
});
```

### Frontend
```javascript
// Import mock data
import { mockFamilies, mockNDR } from '../fixtures/mockData';

// Utilisation dans tests
const mockFamily = mockFamilies.prospectWithStudents;
render(<ProspectCard family={mockFamily} />);
```

## 📋 Checklist Avant Validation

### Pour chaque page testée :
- [ ] **Affichage** : Tous les éléments UI présents
- [ ] **Interactions** : Actions utilisateur fonctionnelles
- [ ] **Cache** : Invalidation et rechargement corrects
- [ ] **API** : Appels backend avec bons paramètres
- [ ] **Erreurs** : Gestion des cas d'échec
- [ ] **Performance** : Temps de réponse < 200ms
- [ ] **Accessibilité** : Labels et ARIA corrects

### Critères de validation :
- ✅ Coverage > 80%
- ✅ 0 test ignoré (skip/todo)
- ✅ Temps total < 30 secondes
- ✅ Pas de console.error non gérée

## 🚀 Workflow Agent Test

1. **Identifier** la page/module à tester
2. **Localiser** le fichier test correspondant
3. **Exécuter** avec la commande npm appropriée
4. **Analyser** les résultats et coverage
5. **Reporter** avec le template ci-dessus
6. **Corriger** si nécessaire avec Agent Codeur

## 🎯 Priorités de Test

### Niveau 1 - Critique
- Pages principales (Prospects, Clients, Dashboard)
- Authentification et autorisation
- Création/modification données

### Niveau 2 - Important  
- Composants réutilisables (Table, Form, Modal)
- Gestion du cache
- Validation formulaires

### Niveau 3 - Nice to have
- Animations et transitions
- Messages de confirmation
- Tooltips et aide contextuelle

## 📊 Objectifs de Qualité

| Métrique | Minimum | Cible |
|----------|---------|-------|
| **Coverage global** | 70% | 85% |
| **Coverage pages** | 80% | 95% |
| **Coverage API** | 90% | 100% |
| **Tests E2E** | 5 workflows | 10 workflows |
| **Temps exécution** | < 60s | < 30s |

## 🔍 Commandes de Debug

```bash
# Test un fichier spécifique avec détails
npm test -- tests/frontend/pages/prospects.test.js --verbose

# Test avec watch mode
npm test -- --watch

# Test avec breakpoint debugging
node --inspect-brk ./node_modules/.bin/jest tests/frontend/pages/prospects.test.js

# Coverage détaillé HTML
npm run test:coverage -- --coverageReporters=html
# Ouvrir coverage/index.html dans le navigateur
```

---

*Guide maintenu par le Chef de Projet - v1.0*