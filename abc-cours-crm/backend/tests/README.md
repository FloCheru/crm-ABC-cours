# Tests Backend - ABC Cours CRM

Organisation des tests pour l'API Node.js + Express + MongoDB.

## 📁 Structure Organisée

```
tests/
├── setup.js                          # Configuration Jest globale
├── testRunner.js                      # Runner personnalisé  
├── README.md                         # Ce fichier
├── fixtures/                        # Données de test réutilisables
│   ├── auth.fixture.js              # Tokens JWT et utilisateurs
│   └── families.fixture.js          # Familles, prospects, clients
├── integration/                     # Tests API et intégration
│   ├── app.test.js                  # Tests application générale
│   ├── auth-api.test.js             # Tests authentification
│   ├── families-api.test.js         # Tests API familles
│   ├── students-api.test.js         # Tests API étudiants
│   ├── coupons-api.test.js          # Tests API coupons
│   ├── settlement-notes-api.test.js # Tests API NDR
│   ├── auth-integration.test.js     # Tests intégration auth
│   ├── test-prospects.test.js       # Tests prospects spécifiques
│   ├── cache-invalidation-prospects.test.js # Tests cache prospects
│   ├── force-reload-cache.test.js   # Tests rechargement cache
│   └── settlementNotes-multiple.test.js # Tests NDR multiples
├── unit/                           # Tests unitaires
│   ├── models/                     # Tests modèles Mongoose
│   │   ├── beneficiary-type-field.test.js # Test champ bénéficiaire
│   │   └── couponSeries.test.js    # Test modèle série coupons
│   ├── services/                   # Tests services métier
│   │   └── pdf-system.test.js      # Test génération PDF
│   └── middleware/                 # Tests middleware Express
├── ui/                            # Tests interface utilisateur
│   ├── prospect-popup-creation.test.js     # Test popup création
│   ├── prospect-popup-error-display.test.js # Test affichage erreurs
│   ├── test-prospects-ui.test.js    # Tests UI prospects
│   └── group-titles-display.test.js # Test affichage titres groupes
└── e2e/                           # Tests end-to-end
    └── end-to-end-error-display.test.js # Test complet erreurs
```

## 🚀 Scripts NPM

```bash
# Tests backend
npm test                    # Tous les tests backend
npm run test:watch          # Mode watch
npm run test:coverage       # Avec couverture

# Tests par catégorie (à ajouter au package.json)
npm run test:integration    # Tests API et intégration
npm run test:unit           # Tests unitaires uniquement
npm run test:ui             # Tests interface utilisateur
npm run test:e2e            # Tests end-to-end
```

## ⚙️ Configuration

### Jest + MongoDB Memory Server
- Database en mémoire pour tests isolés
- Connexion/déconnexion automatique
- Nettoyage entre chaque test
- Fixtures et helpers globaux

### Structure Base de Données Test
```javascript
// Exemple utilisation fixtures
const testFamily = familiesFixtures.createFamily({
  status: 'prospect',
  primaryContact: { firstName: 'Test', lastName: 'User' }
});
```

## 📊 Tests par Catégorie

### 🔗 Integration/ (11 tests)
- **API Routes**: Tests complets endpoints REST
- **Database**: Tests intégration MongoDB
- **Authentication**: Tests JWT et sessions
- **Cache**: Tests invalidation et rechargement
- **Business Logic**: Tests règles métier

### 🧪 Unit/ (3 tests)
- **Models**: Tests schémas Mongoose et validation
- **Services**: Tests logique métier isolée  
- **Middleware**: Tests authentification et validation

### 🎨 UI/ (4 tests)
- **Popups**: Tests modales et interactions
- **Error Display**: Tests affichage erreurs
- **Groups**: Tests regroupement et affichage

### 🔄 E2E/ (1 test)
- **End-to-End**: Tests parcours utilisateur complets
- **Error Flows**: Tests gestion erreurs bout-en-bout

## 🎯 Patterns Établis

### Test Structure
```javascript
describe('🚀 API /api/endpoint', () => {
  beforeAll(async () => {
    await connectDB();
    console.log('🔗 Database connected for tests');
  });
  
  afterAll(async () => {
    await disconnectDB();
    console.log('📤 Database disconnected');
  });
  
  beforeEach(async () => {
    await clearDatabase();
  });
});
```

### API Testing
```javascript
test('✅ POST /api/families creates family', async () => {
  const familyData = familiesFixtures.createFamily();
  
  const response = await request(app)
    .post('/api/families')
    .set('Authorization', `Bearer ${authToken}`)
    .send(familyData)
    .expect(201);
    
  expect(response.body._id).toBeDefined();
  expect(response.body.status).toBe('prospect');
});
```

## 🔧 Outils et Technologies

- **Jest**: Framework de test
- **Supertest**: Tests HTTP/API  
- **MongoDB Memory Server**: Database en mémoire
- **Mongoose**: ODM et modèles
- **Fixtures**: Données de test centralisées

## 📝 Conventions

1. **Noms descriptifs**: Fichiers et tests explicites
2. **Isolation**: Chaque test indépendant
3. **Cleanup**: Nettoyage base entre tests
4. **Async/await**: Gestion asynchrone cohérente
5. **Status codes**: Vérification codes HTTP
6. **Database state**: Vérification état BD après opérations
7. **Error cases**: Tests cas d'erreur systématiques

## 🚨 Configuration Requise

Assurer que ces variables sont configurées :
- `NODE_ENV=test`
- `JWT_SECRET` pour tests auth
- `MONGODB_URI_TEST` pour base test séparée

## 🎯 Pour l'Agent Test

Structure organisée avec séparation claire des responsabilités :
- **Integration/**: Tests API complets avec vraie DB
- **Unit/**: Tests isolés logique métier
- **UI/**: Tests interface et interactions
- **E2E/**: Tests parcours complets
- **Fixtures/**: Données réutilisables centralisées