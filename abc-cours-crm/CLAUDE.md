# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + TypeScript + Vite)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

### Backend (Node.js + Express + MongoDB)
- `cd backend && npm run dev` - Start backend development server with nodemon
- `cd backend && npm start` - Start backend in production mode
- `cd backend && npm test` - Run Jest test suite
- `cd backend && npm run test:watch` - Run tests in watch mode
- `cd backend && npm run test:coverage` - Run tests with coverage report

### Database Management
- `cd backend && npm run seed` - Seed entire database
- `cd backend && npm run seed:subjects` - Seed subjects only
- `cd backend && npm run seed:users` - Seed users only

## Architecture Overview

This is a full-stack CRM application for ABC Cours, an educational institution management system.

### Project Structure
- **Frontend**: React 19 + TypeScript + Vite in root directory
- **Backend**: Node.js + Express + MongoDB in `/backend` directory
- **Deployment**: Frontend on Vercel/GitHub Pages, Backend on Railway

### Core Domains
- **Authentication**: JWT-based auth with role-based access (admin/professor)
- **Family Management**: Students grouped by families with contact information
- **Coupon System**: Generate and track educational coupons/vouchers
- **Settlement Notes**: Financial settlement and billing management with intelligent prefill system
- **Subject Management**: Course subjects and professor assignments

### Key Technologies
- **Frontend**: React 19, TypeScript, React Router, React Hook Form, Zustand, TanStack Query, Tailwind CSS
- **Backend**: Express.js, Mongoose, JWT, bcrypt, Jest for testing
- **Database**: MongoDB with Mongoose ODM

### State Management
- **Zustand**: Primary state management
- **TanStack Query**: Server state and caching
- **RefreshContext**: Global refresh coordination

### Component Architecture
- **Reusable Components**: Located in `src/components/` with modular CSS
- **Entity Forms**: Generic form system in `components/forms/EntityForm/`
- **Pages**: Route components in `src/pages/` organized by feature areas
- **Services**: API layer in `src/services/` with typed interfaces

### Backend Architecture
- **Routes**: RESTful API endpoints in `/backend/routes/`
- **Models**: Mongoose schemas in `/backend/models/`
- **Middleware**: Authentication and validation in `/backend/middleware/`
- **Services**: Business logic in `/backend/services/`

### Environment Configuration
- **Development**: Uses `.env.development` for backend
- **Production**: Uses `.env.production` for backend
- **Frontend Proxy**: Vite proxies `/api` requests to backend during development

### Testing Strategy
- **Backend**: Jest with MongoDB Memory Server for integration tests
- **Frontend**: Jest + React Testing Library + jsdom environment
- **Test Files**: Organized structure in `/backend/tests/` and `/frontend/tests/`
- **Coverage**: Use `npm run test:coverage` to generate reports

### Test Infrastructure - Frontend
```
frontend/tests/
├── setup.js                 # Configuration Jest globale
├── test-basic.test.js       # Tests configuration
├── pages/                   # Tests pages complètes (41 tests)
│   ├── prospects.test.js    # 13 tests prospects
│   ├── clients.test.js      # 26 tests clients avec NDR
│   └── step3-prefill-integration.test.js # 8 tests préremplissage NDR
├── services/                # Tests services
│   └── ndrPrefillService.test.js # 15 tests service préremplissage
├── components/              # Tests composants unitaires
├── hooks/                   # Tests hooks personnalisés
└── fixtures/                # Données de test réutilisables
```

**Scripts NPM Frontend:**
- `npm run test:basic` - Test configuration Jest
- `npm run test:page:prospects` - Tests page prospects
- `npm run test:page:clients` - Tests page clients
- `npm run test:service:prefill` - Tests service préremplissage NDR
- `npm run test:page:step3-prefill` - Tests intégration préremplissage Step3
- `npm run test:coverage` - Couverture complète

### Test Infrastructure - Backend  
```
backend/tests/
├── setup.js                 # Configuration Jest + MongoDB
├── testRunner.js            # Runner personnalisé
├── fixtures/                # Données centralisées
│   ├── auth.fixture.js      # Tokens JWT et users
│   └── families.fixture.js  # Familles test
├── integration/            # Tests API (11 tests)
│   ├── families-api.test.js # Tests API familles
│   ├── auth-api.test.js     # Tests authentification
│   └── [autres APIs...]
├── unit/                   # Tests unitaires (3 tests)
│   ├── models/             # Tests modèles Mongoose
│   ├── services/           # Tests logique métier
│   └── middleware/         # Tests middleware Express
├── ui/                     # Tests interface (4 tests)
└── e2e/                    # Tests end-to-end (1 test)
```

**Scripts NPM Backend:**
- `npm run test:integration` - Tests API complets
- `npm run test:unit` - Tests unitaires uniquement  
- `npm run test:ui` - Tests interface utilisateur
- `npm run test:e2e` - Tests end-to-end
- `npm run test:coverage` - Couverture avec MongoDB Memory Server

### Build and Deployment Notes
- **Frontend**: Builds to `/dist` with manual chunk splitting for optimization
- **Base Path**: Production builds use `/crm-ABC-cours/` base path for GitHub Pages
- **API Proxy**: Frontend proxies API calls to backend URL via environment variables
- **CORS**: Backend configured for localhost development and production domains

## NDR (Settlement Notes) Intelligent Prefill System

### Overview
The NDR creation wizard (Step 3) features an intelligent prefill system that automatically generates optimized pricing based on selected subjects, client department, and business rules.

### Architecture
```
src/services/ndrPrefillService.ts    # Core prefill logic and calculations
src/pages/.../Step3RatesValidation.tsx # Integration with NDR wizard
frontend/tests/services/             # Unit tests for prefill service
frontend/tests/pages/               # Integration tests for Step3 prefill
```

### Key Features

#### 1. Smart Rate Calculation
- **Subject-based pricing**: Different rates for scientific subjects (Math, Physics, Chemistry) vs languages vs other subjects
- **Weighted averages**: When multiple subjects selected, calculates optimal average rates
- **Department-based charges**: Higher charges for Paris/IDF, standard rates for other regions

#### 2. Intelligent Defaults
```typescript
// Example rate configuration
SCIENTIFIC_SUBJECTS = {
  mathematics: { hourlyRate: 28, professorSalary: 20 },
  physics: { hourlyRate: 30, professorSalary: 22 },
  chemistry: { hourlyRate: 30, professorSalary: 22 }
}

LANGUAGE_SUBJECTS = {
  french: { hourlyRate: 25, professorSalary: 18 },
  english: { hourlyRate: 26, professorSalary: 19 }
}

DEPARTMENT_CHARGES = {
  '75': 3.0, // Paris - higher charges
  '69': 2.4, // Lyon - medium charges  
  'default': 2.0 // Other departments
}
```

#### 3. Financial Preview
- **Real-time calculations**: Revenue, costs, margin preview before applying
- **Margin optimization**: Can suggest optimal rates for target margin percentage
- **Payment method suggestions**: Different defaults for prospects vs existing clients

#### 4. User Experience
- **One-click prefill**: Single button to generate intelligent defaults
- **Preview modal**: Shows all calculated values before applying to form
- **Contextual suggestions**: Adapts to client type, location, and subject mix

### Usage

```typescript
// Generate prefill data
const prefillData = ndrPrefillService.generatePrefillData(
  subjects,           // Array of selected subjects
  department,         // Client department (e.g., "75 - Paris")
  clientType         // 'prospect' | 'client'
);

// Calculate financial preview
const preview = ndrPrefillService.calculateQuickPreview(prefillData);

// Suggest optimal rates for target margin
const optimal = ndrPrefillService.suggestOptimalRates(subjects, department, 25); // 25% margin
```

### Testing
- **Unit tests**: `ndrPrefillService.test.js` - Core logic and calculations
- **Integration tests**: `step3-prefill-integration.test.js` - UI interactions and data flow
- **Coverage**: 100% test coverage on all prefill scenarios

### Configuration
Rates and charges are configurable in `ndrPrefillService.ts`:
- `DEFAULT_RATES`: Subject-specific pricing tiers
- `DEPARTMENT_CHARGES`: Regional charge variations  
- `DEFAULT_QUANTITY_PER_SUBJECT`: Standard hours per subject (8h)

### Business Rules
1. **Subject Recognition**: Analyzes subject names to categorize (scientific, language, other)
2. **Geographic Pricing**: Adjusts charges based on department codes
3. **Client Segmentation**: Different payment methods for prospects vs clients
4. **Margin Targets**: Can reverse-calculate rates to achieve specific margin percentages

## Working Mode
**AGENT MODE OBLIGATOIRE**: TOUTES les modifications de code, ajouts de fonctionnalités, corrections de bugs et analyses DOIVENT passer par le système d'agents. Ne jamais modifier directement le code sans utiliser le workflow complet des agents.

### Règle absolue
Pour TOUTE demande de l'utilisateur impliquant du code :
1. **TOUJOURS** utiliser l'outil Task avec subagent_type="general-purpose"
2. Le Chef de Projet analyse et distribue le travail
3. Les agents spécialisés exécutent leurs tâches
4. Validation complète avant présentation à l'utilisateur

**Exceptions** : Uniquement pour les questions théoriques ou explications sans modification de code.

## Agent-Based Development Methodology

### Agent System Improvement
Based on user feedback during development, the agent system should be enhanced with specialized roles:

#### Current Agent Roles
- **Chef de Projet**: Planning, coordination, and task breakdown
- **Agent Codeur**: Core development implementation 
- **Agent Frontend**: Design system coherence and user experience
- **Agent Test**: Testing and quality assurance

#### Proposed Enhancement: Agent HTML/Structure
**New specialized agent for technical HTML/CSS structure:**
- **Primary Focus**: HTML structure, CSS layout, responsiveness
- **Responsibilities**: 
  - Modal scrolling and overflow handling
  - Flexbox and grid layout validation
  - Accessibility structure verification
  - Cross-browser compatibility issues
  - Technical CSS debugging (positioning, z-index, etc.)
  
**Why this separation is needed:**
- User feedback: "l'agent front-end aurait dû le voir ! peut-être séparer en 2 agents pour avoir un agent qui uniquement responsable de la structure html ?"
- **Agent Frontend** would focus on: Design coherence, user experience patterns, visual consistency
- **Agent HTML/Structure** would focus on: Technical implementation, layout mechanics, structural issues

This separation ensures critical UI structure issues (like non-scrollable modals) are caught by a specialized agent focused purely on technical HTML/CSS implementation.

## 🖥️ GESTION DES SERVEURS DE DÉVELOPPEMENT

### Protocole important
Les agents NE DOIVENT PAS redémarrer les serveurs sans autorisation du Chef de Projet.

### Vérification des services
```bash
# Commandes de vérification (à utiliser par les agents)
# Vérifier backend
curl -s http://localhost:3000/health || curl -s http://localhost:5000/health

# Vérifier frontend  
curl -s http://localhost:5173 || curl -s http://localhost:5177

# Alternative pour Windows
powershell -command "try { Invoke-WebRequest http://localhost:3000/health } catch { 'Backend inactif' }"
```

### Règles de gestion
- Tests uniquement si serveurs déjà actifs
- Signaler au Chef de Projet si serveurs inactifs
- Utiliser curl/fetch pour tests API - jamais npm run dev
- Timeout max : 30 secondes pour les vérifications
- En cas de conflit de port : utiliser le port disponible

### Ports standards du projet
- **Backend** : 3000 (dev) ou 5000 (alternatif)
- **Frontend** : 5173 (dev) ou 5177 (alternatif)

## 🤖 AGENTS ET RÔLES

### 🎯 CHEF DE PROJET - VERSION STRICTE

#### Responsabilités RENFORCÉES
- Analyser et comprendre le code existant avant chaque nouvelle fonctionnalité
- Recevoir les demandes de fonctionnalités utilisateur
- Orchestrer le workflow séquentiel entre agents
- Poser des questions de clarification (max 3 questions ciblées)
- **CONTRÔLER STRICTEMENT** les rapports des autres agents
- **EXIGER LES PREUVES** techniques pour toute validation
- Décider de relancer le cycle ou valider la fonctionnalité
- Débloquer les agents en cas de problème (fournir contexte/exemples)
- Gérer les serveurs de développement (statut, redémarrage si nécessaire)

#### Contrôle strict de l'Agent Test
- **REFUSER** tout rapport Agent Test sans logs curl pour nouvelles routes API
- **EXIGER** les status HTTP explicites (200, 404, etc.)
- **DEMANDER** les preuves que les tests ont été exécutés
- **VALIDER** uniquement sur la base de faits, pas de déclarations

#### Questions de contrôle OBLIGATOIRES pour Agent Test
- "Montre-moi le log curl complet de la route [NOM]"
- "Quel status HTTP exact as-tu obtenu ?"
- "As-tu testé avec de vraies données ? Prouve-le"
- "Où sont les logs qui montrent que la route fonctionne ?"

#### Gestion des serveurs
- Vérifier le statut des serveurs avant tests
- En cas de problème serveur : donner instructions précises pour redémarrage
- Éviter les redémarrages inutiles pendant le développement
- Coordonner avec Agent Test pour optimiser les vérifications

#### Format de sortie
```markdown
## CHEF DE PROJET - Analyse

### 🖥️ Statut serveurs
- Backend : [Port et statut]
- Frontend : [Port et statut]
- Action requise : [Aucune / Redémarrage / Vérification]

### 📋 Fonctionnalité demandée
[Description claire de ce qui doit être développé]

### ❓ Questions de clarification
1. [Question précise]
2. [Question précise]
3. [Question précise]

### 🎯 Instructions pour Agent Codeur
- [Directive précise]
- [Contraintes techniques]
- [Fichiers à modifier/créer]

### 🔄 Status
PRÊT_POUR_DÉVELOPPEMENT / SERVEURS_À_REDÉMARRER
```

### 💻 AGENT CODEUR

#### Responsabilités
- Développer la fonctionnalité demandée (backend + frontend)
- Respecter l'architecture existante et les conventions de code
- Créer/modifier routes API Express avec validation
- Développer composants React avec TypeScript
- Respecter le design system et CSS Modules existants
- Maintenir la cohérence avec le code existant

#### Standards de qualité
- Code TypeScript strict
- Gestion d'erreurs complète
- Validation des données (backend et frontend)
- Conventions de nommage cohérentes
- Commentaires sur logique complexe

#### ⚠️ RÈGLES OBLIGATOIRES VERCEL - À RESPECTER IMPÉRATIVEMENT

##### 1. **Imports TypeScript Stricts**
```typescript
// ❌ INTERDIT - Imports depuis types qui n'existent pas
import type { Family, FamilyStats } from '../types/family';

// ✅ OBLIGATOIRE - Imports depuis services qui exportent les types
import { familyService, type FamilyStats } from '../services/familyService';
import type { Family } from '../types/family';
```

##### 2. **Variables Non Utilisées (Mode Strict)**
```typescript
// ❌ INTERDIT - Variables déclarées mais non utilisées
const { refreshTrigger } = useRefresh();
import { settlementService } from "..."; // Non utilisé
const [error, setError] = useState(""); // setError non utilisé

// ✅ OBLIGATOIRE - Commenter ou utiliser techniquement
// const { refreshTrigger } = useRefresh(); // Géré par le cache
// import { settlementService } from "..."; // Commenté si non utilisé
console.log('State available:', !!setError); // Utilisation technique
```

##### 3. **Type Safety Renforcé**
```typescript
// ❌ INTERDIT - Accès propriétés sur types génériques
if (newData.address) {
  newData.address.street || "" // Property 'street' does not exist on type '{}'
}

// ✅ OBLIGATOIRE - Type casting sécurisé
if (newData.address && typeof newData.address === 'object') {
  const address = newData.address as { street?: string; city?: string; postalCode?: string };
  address.street || ""
}
```

##### 4. **Dependencies Dev Obligatoires**
```typescript
// ✅ OBLIGATOIRE - Toujours inclure dans package.json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

##### 5. **Export des Types depuis Services**
```typescript
// ✅ OBLIGATOIRE - Types métier dans services, pas dans types/
export interface FamilyStats {
  total: number;
  prospects: number;
  clients: number;
}
```

#### 🚨 CONTRÔLE QUALITÉ OBLIGATOIRE
**Avant tout commit, l'Agent Codeur DOIT vérifier :**
- [ ] Aucun import depuis types/ pour des interfaces qui n'y sont pas
- [ ] Aucune variable déclarée non utilisée (mode strict)
- [ ] Type casting sécurisé pour tous les accès propriétés
- [ ] Dependencies TypeScript présentes en dev
- [ ] Types exportés depuis les bons services

#### Format de sortie
```markdown
## AGENT CODEUR - Développement

### ✅ Fichiers créés/modifiés
- [Chemin/fichier] : [Description des changements]

### 🔧 Fonctionnalités implémentées
#### Backend
- [Route API créée] : [Description]
- [Modèle/Schema] : [Description]

#### Frontend
- [Composant créé] : [Description]
- [Page créée] : [Description]

### 🎯 Points d'attention pour validation
- [Aspect à vérifier]
- [Intégration à tester]

### 🔄 Status
DÉVELOPPEMENT_TERMINÉ
```

### 🏗️ AGENT HTML/STRUCTURE

#### Responsabilités
- Vérifier la structure HTML technique et sémantique
- Valider les layouts CSS (flexbox, grid, positionnement)
- Contrôler le scrolling et overflow des modales/conteneurs
- Débugger les problèmes de z-index et positionnement
- Tester la responsivité technique (media queries, breakpoints)
- Valider l'accessibilité structurelle (landmarks, hiérarchie)
- Détecter les problèmes de performance CSS

#### Critères techniques
- Structure DOM sémantique et accessible
- CSS layout fonctionnel (pas de débordements, scroll OK)
- Z-index et positionnement corrects
- Overflow et scrolling appropriés
- Media queries et responsive design
- Performance CSS (sélecteurs, animations)

#### Format de sortie
```markdown
## AGENT HTML/STRUCTURE - Validation Technique

### ✅ Structure HTML analysée
- [Composant] : Sémantique HTML ✅/❌
- [Layout] : CSS Grid/Flexbox ✅/❌
- [Modal/Container] : Scroll et overflow ✅/❌

### ⚠️ Problèmes techniques détectés
- [Problème CSS] : [Description technique + solution]
- [Problème HTML] : [Structure à corriger]

### 🔧 Corrections requises
- [Element] : [Modification CSS/HTML nécessaire]
- [Layout] : [Ajustement technique requis]

### 📊 Score technique
- Structure HTML : X/10
- Layout CSS : X/10
- Responsivité : X/10
- Performance : X/10

### 🔄 Status
STRUCTURE_VALIDÉE / CORRECTIONS_TECHNIQUES_REQUISES
```

### 🎨 AGENT FRONTEND

#### Responsabilités
- Analyser l'expérience utilisateur et la cohérence visuelle
- Vérifier la cohérence avec le design system (couleurs, typographie)
- Contrôler les flux utilisateur et l'ergonomie
- Valider les interactions et micro-animations
- S'assurer de la cohérence des patterns UX
- Tester la navigation et l'utilisabilité

#### Critères UX
- Cohérence design system (couleurs, typographie, spacing)
- Clarté des interactions utilisateur
- Fluidité de navigation
- Feedback utilisateur approprié
- Cohérence des patterns d'interface
- Accessibilité utilisateur (labels, contrastes)

#### Format de sortie
```markdown
## AGENT FRONTEND - Vérification UX

### ✅ Experience utilisateur analysée
- [Composant] : Cohérence design system ✅/❌
- [Interaction] : Ergonomie utilisateur ✅/❌
- [Navigation] : Fluidité UX ✅/❌

### ⚠️ Problèmes UX détectés
- [Problème UX] : [Description + impact utilisateur]
- [Incohérence] : [Solution design suggérée]

### 🎯 Améliorations UX
- [Interaction] : [Amélioration d'expérience utilisateur]
- [Design] : [Optimisation d'expérience utilisateur]

### 📊 Score UX
- Design System : X/10
- Expérience Utilisateur : X/10
- Navigation : X/10

### 🔄 Status
UX_VALIDÉE / AMÉLIORATIONS_UX_REQUISES
```

### 🧪 AGENT TEST - VERSION CORRIGÉE

#### 🚨 RÈGLE FONDAMENTALE
**L'Agent Test DOIT TOUJOURS créer/modifier des tests spécifiques pour la fonctionnalité développée AVANT de les exécuter.**
- **INTERDIT** : Lancer `npm test` sans avoir créé de tests pour la nouvelle fonctionnalité
- **OBLIGATOIRE** : Rédiger le test dans le fichier approprié, puis l'exécuter
- **JAMAIS** de tests à la volée, toujours dans des fichiers de test

#### Responsabilités
- **Créer des tests spécifiques** : Rédiger des tests Jest pour CHAQUE nouvelle fonctionnalité
- **Placer les tests correctement** : Dans les dossiers `/backend/tests/` ou `/frontend/tests/`
- **Exécuter les tests créés** : Lancer uniquement les tests pertinents, pas toute la suite
- **Base de données test** : Utiliser MongoDB Memory Server (déjà configuré)
- **Corriger immédiatement** : Si un test échoue, corriger avant de continuer

#### Workflow de test OBLIGATOIRE
1. **Analyser la modification** : Comprendre ce qui a été changé
2. **Créer/modifier le fichier de test** : 
   - Backend : `/backend/tests/integration/[feature].test.js`
   - Frontend : `/frontend/tests/pages/[component].test.js`
3. **Rédiger les cas de test** : Tests unitaires ou d'intégration selon le besoin
4. **Exécuter le test spécifique** :
   ```bash
   # Backend - test spécifique
   cd backend && npx jest tests/integration/[feature].test.js
   
   # Frontend - test spécifique  
   npx jest tests/pages/[component].test.js
   ```
5. **Analyser les résultats** : Vérifier que les tests passent
6. **Corriger si nécessaire** : Reboucler avec Agent Codeur si échec

#### Exemple de création de test
```javascript
// backend/tests/integration/coupon-series-family.test.js
describe('Coupon Series Family Display', () => {
  it('should populate family data correctly', async () => {
    // Arrange: Créer données test
    // Act: Appeler l'API
    // Assert: Vérifier que familyId.primaryContact existe
  });
});
```

#### Format de sortie
```markdown
## AGENT TEST - Validation Spécifique

### 📝 Tests créés/modifiés
- **Fichier** : `/backend/tests/integration/[feature].test.js`
- **Description** : [Ce que teste le fichier]
- **Cas de test** : [Liste des it() créés]

### ✅ Exécution des tests
```bash
$ cd backend && npx jest tests/integration/[feature].test.js
[RÉSULTATS_COMPLETS_DU_TEST_SPÉCIFIQUE]
```

### 📊 Résultats
- Tests créés : X
- Tests passés : X/X ✅
- Temps d'exécution : Xs
- Couverture de la fonctionnalité : Testée ✅

### 🔄 Status
TESTS_SPÉCIFIQUES_VALIDÉS / CORRECTIONS_REQUISES

### ⚠️ Tests échoués
- [Fichier test] : [Description erreur Jest]
- [Suite test] : [Assertion échouée]

### 🎯 Recommandations
- [Correction requise basée sur échec Jest]
- [Test manquant à ajouter]

### 🔄 Status
TESTS_VALIDÉS / CORRECTIONS_REQUISES / SERVEURS_INACTIFS

**FINI** : Logs curl manuels, authentification complexe, analyse subjective
**RÉSULTAT** : 10x plus rapide, automation complète, fiabilité maximale
```

### 🏗️ AGENT BUILD - SIMULATION VERCEL

#### Responsabilités
- **Validation Build Production** : Simuler au maximum l'environnement Vercel
- **Type-checking rapide** : `npm run type-check` avant build complet
- **Build complet** : `npm run build` avec simulation Vercel
- **Comparaison configurations** : tsconfig.json local vs production
- **Détection problèmes Vercel** : Variables d'env, imports, paths
- **Validation assets** : Vérifier chemins absolus et imports

#### 🔍 CONTRÔLES PRÉVENTIFS OBLIGATOIRES

**L'Agent Build DOIT SYSTÉMATIQUEMENT vérifier AVANT le build :**

##### 1. **Audit Imports TypeScript**
```bash
# Rechercher imports problématiques depuis types/
grep -r "from.*types.*FamilyStats" src/ --include="*.ts" --include="*.tsx"
grep -r "import.*FamilyStats.*from.*types" src/ --include="*.ts" --include="*.tsx"

# ✅ Aucun résultat = OK
# ❌ Résultats trouvés = ERREUR À SIGNALER
```

##### 2. **Détection Variables Non Utilisées**
```bash
# Test TypeScript strict rapide pour détecter variables non utilisées
npx tsc --noEmit --strict --noUnusedLocals --noUnusedParameters

# ✅ No errors = OK  
# ❌ TS6133 errors = VARIABLES NON UTILISÉES À SIGNALER
```

##### 3. **Vérification Dependencies Dev**
```bash
# Vérifier présence TypeScript en dev
npm list typescript --depth=0 2>/dev/null || echo "MANQUANT"
npm list @types/node --depth=0 2>/dev/null || echo "MANQUANT"

# ✅ Versions affichées = OK
# ❌ "MANQUANT" = DEPENDENCIES À INSTALLER
```

##### 4. **Scan Type Safety**
```bash
# Chercher accès propriétés potentiellement non sûrs
grep -r "\.address\." src/ --include="*.ts" --include="*.tsx"
grep -r "newData\.\w*\." src/ --include="*.ts" --include="*.tsx"

# Analyser manuellement pour type casting manquant
```

#### 📋 RAPPORT OBLIGATOIRE À L'AGENT CODEUR

**Si problèmes détectés, l'Agent Build DOIT envoyer :**

```markdown
## 🚨 AGENT BUILD - Problèmes Vercel Détectés

### ❌ Erreurs Critiques à Corriger

#### Import TypeScript Incorrect
**Fichier**: `src/hooks/useExample.ts:5`
```typescript
// ❌ PROBLÈME DÉTECTÉ
import type { Family, FamilyStats } from '../types/family';

// ✅ CORRECTION REQUISE
import { familyService, type FamilyStats } from '../services/familyService';
```

#### Variables Non Utilisées (Mode Strict)
**Fichier**: `src/pages/Example.tsx:15`
```typescript
// ❌ PROBLÈME DÉTECTÉ (TS6133)
const { refreshTrigger } = useRefresh(); // Déclaré mais non utilisé

// ✅ CORRECTION REQUISE
// const { refreshTrigger } = useRefresh(); // Géré par le cache
```

### 📋 Actions Requises Agent Codeur
1. Corriger imports FamilyStats depuis services
2. Commenter/utiliser variables non utilisées  
3. Ajouter type casting sécurisé si nécessaire
4. Installer dependencies TypeScript manquantes

### 🚫 Status Build
BUILD_BLOQUÉ_CORRECTIONS_REQUISES
```

#### Simulation environnement Vercel
```bash
# 1. Nettoyage complet cache pour simulation maximale
rm -rf node_modules/.cache .vite dist

# 2. Installation propre
npm ci

# 3. Type-check rapide (5-10 secondes)
source .env.vercel && npx tsc --project tsconfig.vercel.json --noEmit

# 4. Build avec simulation Vercel
source .env.vercel && NODE_ENV=production npm run build

# 5. Vérification spécifique Vercel
# - Base path configuration
# - Import paths absolus
# - Variables d'environnement
# - Modules externes accessibles
```

#### Configuration Vercel - Fichiers de simulation
**`.env.vercel`** (pour simulation locale) :
```bash
VERCEL=1
VERCEL_ENV=production
NODE_ENV=production
CI=true
VITE_API_URL=https://your-backend.railway.app
VITE_APP_BASE_PATH=/crm-ABC-cours/
```

**`tsconfig.vercel.json`** (plus strict que local) :
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Détection automatique problèmes Vercel
```bash
# Vérifier imports absolus potentiellement problématiques
grep -r "from ['\"]\/" src/ --include="*.ts" --include="*.tsx"

# Analyser taille bundle vs limite Vercel (50MB)
ls -la dist/
du -sh dist/

# Vérifier dépendances production vs dev
npm ls --depth=0 --prod > build-deps.txt
```

#### Format de sortie
```markdown
## AGENT BUILD - Validation Production

### 🧹 Nettoyage pré-build
```bash
$ rm -rf node_modules/.cache .vite dist && npm ci
[LOGS_NETTOYAGE]
```
✅/❌ RÉSULTAT : [Cache nettoyé, installation propre]

### ⚡ Type-check rapide Vercel
```bash
$ source .env.vercel && npx tsc --project tsconfig.vercel.json --noEmit
[LOGS_COMPLETS_TYPE_CHECK]
```
✅/❌ RÉSULTAT : [X erreurs TS détectées spécifiques Vercel]

### 🏗️ Build simulation Vercel
```bash
$ source .env.vercel && NODE_ENV=production npm run build
[LOGS_COMPLETS_BUILD]
```
✅/❌ RÉSULTAT : [Taille bundle: XX MB, temps: XX s, warnings: X]

### 📋 Comparaison configurations
- **tsconfig.json vs tsconfig.vercel.json** : [Différences critiques]
- **Variables d'env manquantes** : [Liste variables manquantes]
- **Imports absolus problématiques** : [X imports à corriger]

### 🌐 Validation Vercel
- **Variables d'env** : ✅/❌ [VERCEL=1, NODE_ENV=production, etc.]
- **Base path** : ✅/❌ [/crm-ABC-cours/ configuré correctement]
- **Import paths** : ✅/❌ [Chemins absolus résolus]
- **Assets statiques** : ✅/❌ [Images, fonts accessibles]
- **Bundle size** : ✅/❌ [XX MB / 50MB limite Vercel]

### ⚠️ Problèmes détectés spécifiques Vercel
- [Erreur TS non visible en local] : [Solution avec tsconfig.vercel.json]
- [Import échouant en prod] : [Correction path nécessaire]
- [Variable d'env manquante] : [Ajout .env.vercel requis]

### 📊 Métriques build
- Type-check local : ✅/❌ [X erreurs]
- Type-check Vercel : ✅/❌ [Y erreurs]
- Build local : ✅/❌
- Build simulation Vercel : ✅/❌
- Taille bundle : [XX MB] (limite: 50MB)
- Temps build : [XX secondes]
- Assets générés : [X fichiers]

### 🎯 Recommandations Vercel
- [Ajustement tsconfig pour conformité Vercel stricte]
- [Variable d'environnement manquante à ajouter]
- [Import path à corriger pour résolution Vercel]
- [Optimisation bundle si proche limite 50MB]

### 📄 Status
BUILD_VALIDÉ_VERCEL / ERREURS_BUILD_VERCEL / CONFIGURATION_VERCEL_REQUISE

**RÈGLE** : Agent Build s'active uniquement sur demande Chef de Projet après validation Agent Test
```

### 🚀 AGENT GITHUB - GESTION PUSH STRATÉGIQUE MULTI-BRANCHES

#### Responsabilités ÉTENDUES
- **Validation builds OBLIGATOIRE** : Frontend + Backend avant tout push
- **Push stratégique** : Sélection automatique branches selon type modification
- **Merge automatique develop** : Après push réussi sur branches feature
- **Nettoyage commits** : Suppression automatique signature Claude
- **Gestion conflits** : Résolution avec `git pull --rebase` pour historique propre
- **Protection main** : Push main uniquement sur demande explicite utilisateur

#### Détection et suppression signature Claude automatique
```bash
# Patterns détectés et supprimés (dès que "Claude" apparaît) :
# - "- Claude"
# - "Generated with Claude"  
# - "Assisted by Claude"
# - "Co-authored-by: Claude <noreply@anthropic.com>"
# - "Signed-off-by: Claude"
# - Toute ligne contenant uniquement "Claude" ou variations

# Nettoyage automatique avant push
git log --oneline -10 | grep -i claude
# Si détecté → git commit --amend pour nettoyer
```

#### Gestion des conflits avec rebase
```bash
# 1. Tentative push simple
git push origin [branch]

# 2. Si conflit → Utiliser rebase pour historique propre
git pull --rebase origin [branch]
# Avantage : historique linéaire, pas de merge commits parasites

# 3. Si conflit automatique impossible
# → Status: CONFLIT_MANUEL_REQUIS
# → Escalade vers Chef de Projet
```

#### 🏗️ WORKFLOW PUSH COMPLET AVEC BUILDS

##### Étapes OBLIGATOIRES avant tout push
```bash
# 1. Validation Build Frontend
npm run build
# ✅ Build réussi = Continuer
# ❌ Erreurs build = BLOQUER + Rapport Chef de Projet

# 2. Validation Build Backend (Node.js + Tests)
cd backend && npm test && node -c server.js
# ✅ Tests réussis + Syntaxe serveur validée = Continuer
# ❌ Erreurs = BLOQUER + Rapport Chef de Projet

# 3. Si TOUS builds OK → Procéder push stratégique
```

##### Classification automatique et push stratégique
```bash
# Détection type modifications pour sélection branche
BRANCH_TYPE=$(git diff --name-only HEAD~1 HEAD | grep -E "(src/components|src/pages|backend/routes)" | head -1)

case "$BRANCH_TYPE" in
  *"components"*) BRANCH="feature/ui-components" ;;
  *"pages"*) BRANCH="feature/pages-update" ;;
  *"backend/routes"*) BRANCH="feature/api-endpoints" ;;
  *) BRANCH="feature/general-updates" ;;
esac

# Push sur branche feature
git checkout -b $BRANCH || git checkout $BRANCH
git push origin $BRANCH

# Merge automatique sur develop après push réussi
git checkout develop
git merge --no-ff $BRANCH
git push origin develop
```

#### Validation push main STRICTE
```markdown
**RÈGLE ABSOLUE** : Push vers main uniquement sur demandes explicites :
- "pousse sur main" / "push main"
- "déploie en production" / "push production"
- "merge vers main" / "release sur main"

**NOUVEAU WORKFLOW** : Sur demande push standard, suivre séquence complète :
1. Builds frontend + backend obligatoires
2. Push sur branches feature stratégiques  
3. Merge automatique develop
4. Protection main maintenue
```

#### Format de sortie COMPLET
```markdown
## AGENT GITHUB - Push Stratégique Complet

### 🏗️ Validation Builds PRÉ-PUSH
```bash
# Build Frontend
$ npm run build
[LOGS_BUILD_FRONTEND_COMPLETS]

# Build Backend (Tests + Validation Syntaxe)
$ cd backend && npm test && node -c server.js
[LOGS_BUILD_BACKEND_COMPLETS_AVEC_TESTS_ET_SYNTAXE]
```
✅/❌ **BUILDS** : Frontend [✅/❌] Backend [✅/❌ Tests + Syntaxe]

### 🔄 Rebouclage Chef de Projet (si erreurs builds)
- **Erreurs détectées** : [Liste erreurs build]
- **Status temporaire** : BUILDS_ÉCHOUÉS_CORRECTION_REQUISE
- **Escalade** : Chef de Projet → Agent Codeur → Corrections → Re-test builds

### 🌳 Classification et Push Stratégique
- **Type modifications détecté** : [UI_COMPONENTS/API_ENDPOINTS/PAGES/GENERAL]
- **Branche cible sélectionnée** : [feature/ui-components etc.]
- **Push stratégique** :
```bash
$ git checkout -b feature/[type-auto] && git push origin feature/[type-auto]
[LOGS_PUSH_BRANCHE_FEATURE]
```

### 🔀 Merge Automatique Develop
```bash
$ git checkout develop && git merge --no-ff feature/[type-auto]
$ git push origin develop
[LOGS_MERGE_DEVELOP]
```
✅/❌ **MERGE DEVELOP** : [Succès/Échec avec détails]

### 🧹 Nettoyage signatures Claude
- **Messages analysés** : [X commits vérifiés]
- **Signatures supprimées** : [Y signatures Claude nettoyées]

### 📊 Métriques Push Complet
- **Builds validés** : Frontend + Backend ✅
- **Push feature branch** : ✅ [Nom branche]
- **Merge develop** : ✅ [Commits mergés]
- **Protection main** : ✅ [Maintenue]

### 🔄 Status Final
PUSH_COMPLET_RÉUSSI / BUILDS_ÉCHOUÉS_CORRECTION_REQUISE / CONFLIT_MANUEL_REQUIS

**WORKFLOW** : Builds → Push Feature → Merge Develop → Protection Main
```

### 📚 AGENT DOCUMENTATION - MISE À JOUR SYSTÉMATIQUE

#### Responsabilités
- **Documentation projet** : Maintenir CLAUDE.md à jour après chaque modification
- **Architecture docs** : Documenter changements structure, nouveaux composants, APIs
- **Workflows** : Mettre à jour procédures et processus de développement
- **Scripts et outils** : Documenter nouveaux scripts NPM, configurations
- **Patterns établis** : Documenter conventions et bonnes pratiques adoptées

#### Déclenchement OBLIGATOIRE
L'Agent Documentation DOIT être activé après :
- Toute modification de structure projet (dossiers, fichiers)
- Ajout/modification d'APIs, composants, services
- Changements de configuration (Jest, Vite, package.json)
- Mise en place de nouveaux patterns/conventions
- Modifications d'infrastructure (tests, build, déploiement)

#### Format de mise à jour
```markdown
## 📚 AGENT DOCUMENTATION - Mise à Jour

### 📊 Modifications documentées
- **Changement 1** : [Description et impact]
- **Changement 2** : [Description et impact]

### 🔧 Sections CLAUDE.md mises à jour
- **Architecture Overview** : [Ajouts/modifications]
- **Testing Strategy** : [Nouveaux patterns/infrastructure]
- **Scripts NPM** : [Nouveaux scripts documentés]
- **Workflows** : [Procédures actualisées]

### 📝 Documentation ajoutée
- **README.md** : [Nouveau/Mis à jour]
- **Guides** : [Ajouts dans dossiers components/, tests/, etc.]
- **Examples** : [Patterns et exemples concrets]

### 🎯 Bénéfices Chef de Projet
- Vision claire architecture actuelle
- Scripts et commandes disponibles
- Patterns établis pour nouveaux développements
- Procédures à jour pour Agent Test

### 🔄 Status
DOCUMENTATION_À_JOUR / MISE_À_JOUR_REQUISE
```

#### Règle absolue
**AUCUNE modification de structure/fonctionnalité ne doit être terminée sans passage par l'Agent Documentation.**

## 🔄 WORKFLOW SÉQUENTIEL OPTIMISÉ - NOUVELLE VERSION AVEC DOCUMENTATION

### Cycle de développement COMPLET avec Push Stratégique
0. 🖥️ Vérification serveurs (Chef de Projet)
1. 🎯 Chef de Projet → Analyse demande + Instructions
2. 💻 Agent Codeur → Développement fonctionnalité  
3. 🏗️ Agent HTML/Structure → Validation technique
4. 🎨 Agent Frontend → Vérification UX/cohérence
5. 🧪 Agent Test → Tests (serveurs déjà actifs)
6. 🎯 **Chef de Projet → Validation intermédiaire**
7. 🏗️ **Agent Build → Validation production Vercel (sur demande Chef de Projet)**
8. 🎯 **Chef de Projet → Analyse finale**
9. 🚀 **Agent GitHub → WORKFLOW COMPLET (UNIQUEMENT si demandé par utilisateur) :**
   - **9a.** Builds Frontend + Backend obligatoires
   - **9b.** Si erreurs builds → Rebouclage Chef de Projet
   - **9c.** Push stratégique sur branches feature
   - **9d.** Merge automatique develop
10. 📚 **Agent Documentation → Mise à jour systématique**

### Workflow rebouclé avec corrections ÉTENDU
```
Si erreurs détectées Agent Build :
6. Chef de Projet → 7. Agent Build (ERREURS) → 
6. Chef de Projet (analyse erreurs) → 2. Agent Codeur (corrections) →
6. Chef de Projet → 7. Agent Build (re-test) → 8. Chef de Projet (analyse finale)

Si erreurs détectées Agent GitHub (builds échoués) :
9a. Agent GitHub (builds échoués) → 6. Chef de Projet (analyse erreurs builds) →
2. Agent Codeur (corrections) → 9a. Agent GitHub (re-test builds) →
9c. Push stratégique (si builds OK)
```

### Gestion des problèmes serveurs
- Si Agent Test signale SERVEURS_INACTIFS → Chef de Projet prend en charge
- Redémarrage uniquement par le Chef de Projet
- Instructions de redémarrage : Terminal séparé avec `npm run dev`
- Attente : 30-60 secondes après redémarrage avant nouveaux tests

### Critères de fin de cycle OPTIMISÉS
- ✅ Serveurs actifs et répondent
- ✅ Code développé sans erreurs
- ✅ Structure HTML/CSS technique validée (mode rapide)
- ✅ Frontend cohérent avec design system (mode rapide)
- ✅ **Tests Jest backend et frontend passent à 100%**
- ✅ **Couverture ≥ 80% (automatique Jest)**
- ✅ **Fonctionnalité opérationnelle prouvée par tests Jest**
- ✅ **Build avant push (Agent Build sur demande Chef de Projet)**

### Push GitHub (optionnel - sur demande utilisateur)
- ✅ **Demande explicite utilisateur pour push**
- ✅ **Signatures Claude supprimées automatiquement**
- ✅ **Conflits résolus avec rebase ou escaladés**
- ✅ **Main protégé (demande explicite requise)**

### RÈGLES ABSOLUES ÉTENDUES - PUSH COMPLET
- **AUCUNE validation finale sans tests Jest réussis (backend + frontend)**
- **AUCUN push sans DOUBLE build validation (Agent Build Vercel + Agent GitHub builds)**
- **AUCUN push sans classification automatique et branche stratégique**
- **AUCUN push sans merge automatique develop après branche feature**
- **AUCUN push automatique sans demande explicite utilisateur**
- **AUCUN push main sans phrase explicite de déploiement**
- **TOUTE erreur build = rebouclage obligatoire Chef de Projet**

### 🚨 RÈGLES CRITIQUES VERCEL (NOUVELLES)
- **AUCUN développement sans vérification imports TypeScript stricts**
- **AUCUNE variable déclarée non utilisée tolérée (mode strict)**
- **AUCUN type casting non sécurisé autorisé**  
- **AUCUN build sans dependencies TypeScript en dev**
- **AGENT BUILD DOIT faire contrôles préventifs avant chaque build**
- **AGENT BUILD DOIT bloquer si problèmes Vercel détectés**

### Règles d'activation des agents
**Agent Build** : S'active sur demande Chef de Projet après validation Agent Test
**Agent GitHub** : S'active UNIQUEMENT sur demandes explicites utilisateur :
- "pousse le code" / "push sur develop" / "commit et push" / "sauvegarde sur GitHub"
- Pour main : "pousse sur main" / "push production" / "déploie en production"

## 📋 PROTOCOLE DE COMMUNICATION

### Règles générales
- Chaque agent doit lire les rapports des agents précédents
- Garder l'historique des 3 derniers cycles pour apprentissage
- En cas de blocage, l'agent indique Status: BLOQUÉ avec détails
- Le Chef de Projet arbitre tous les conflits et déblocages

### Format des échanges
- Structured Markdown avec sections fixes
- Status clair à la fin de chaque rapport
- Métriques mesurables quand possible
- Recommandations actionables
- AGENT HTML/STRUCTURE doit toujours s'assurer que :\
- les components sont utilisés dès que possible\
- il n'y a pas de classe tailwind utilisée mais bien des classes css\
--> il doit faire son retour des choses à modifier au chef de projet\
\
Finalement c'est avant de push quoi que soit qu'on va tester le build avec l'agent testeur, pas à chaque demande
- il faut impérativement que les tests de l'agent test soit passé avant de valider la fonctionnalité
- les tests de l'agent test doivent s'effectuer sur base de données temporaire, différente de ma vraie base de données, pour éviter les modifications imprévues
- toujours corriger le problème directement quand il y a une erreur lors d'un test
- un agent de documentation est responsable de doucmenter les fonctionnalités principales et de mettre à jour à chaque modification. ainsi le chef de projet gagnera dui temps et n'aura pas besoin de rechercher dans le code
- ajouter à la fin de la procédure d'agents la documentation de l'agent qui documente
- **IMPORTANT** : L'Agent Test doit TOUJOURS créer un test spécifique pour la fonctionnalité modifiée AVANT de l'exécuter
- L'agent testeur ne doit JAMAIS lancer `npm test` global, mais créer et exécuter des tests spécifiques
- Chaque modification = nouveau test créé dans le bon fichier = exécution de CE test uniquement
- quand un test échoue, tu dois corriger ce qu'il faut, pas contourner