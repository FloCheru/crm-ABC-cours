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
- **Settlement Notes**: Financial settlement and billing management
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
- **Test Files**: Located in `/backend/tests/`
- **Coverage**: Use `npm run test:coverage` to generate reports

### Build and Deployment Notes
- **Frontend**: Builds to `/dist` with manual chunk splitting for optimization
- **Base Path**: Production builds use `/crm-ABC-cours/` base path for GitHub Pages
- **API Proxy**: Frontend proxies API calls to backend URL via environment variables
- **CORS**: Backend configured for localhost development and production domains

## Working Mode
**PLAN MODE IS ACTIVE**: Always work in plan mode and ask for confirmation before implementing any changes. Present detailed plans for approval before proceeding with implementation.

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

### 🧪 AGENT TEST - VERSION FULL AUTO 🤖

#### Responsabilités OBLIGATOIRES - ENHANCED
- Vérifier que les serveurs de développement sont actifs
- **TESTER TOUTE nouvelle route API avec système automatique**
- Tests unitaires (composants React, fonctions utilitaires)
- Tests d'intégration (routes API avec logging automatique)
- Exécuter tous les tests et analyser les résultats
- Tester sur données réelles MongoDB
- Vérifier la couverture de code (minimum 80%)

#### PROTOCOLE FULL AUTO - NOUVEAU SYSTÈME 🚀
- **Vérification automatique** : `/debug/health/detailed` pour status serveurs
- **Tests API automatisés** : Header `x-test-mode: true` + AutoLogger
- **Logs automatiques** : `/debug/logs/30` pour récupération immédiate
- **Diagnostic intelligent** : Analyse automatique logs + réponses HTTP
- **Délai optimisé** : 100ms entre test et lecture logs

#### NOUVEAUX OUTILS AUTOMATIQUES
```bash
# 1. Diagnostic système complet
curl http://localhost:5000/debug/health/detailed

# 2. Test avec logging synchrone forcé
curl -s -w "%{http_code}" -X PATCH http://localhost:5000/api/families/test/prospect-status \
  -H "x-test-mode: true" \
  -H "Content-Type: application/json"

# 3. Récupération automatique logs (après 100ms)
curl http://localhost:5000/debug/logs/30

# 4. Analyse automatique : status HTTP + logs correspondants
```

#### RÈGLE ABSOLUE RENFORCÉE - Tests API
**TOUTE nouvelle route API DOIT être testée avec le système Full Auto**

#### 🔐 AUTHENTIFICATION OBLIGATOIRE POUR LES TESTS
**CRITICAL** : Pour tester complètement les routes protégées, il faut TOUJOURS utiliser un token d'authentification valide :

```bash
# Token d'authentification requis (exemple)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODZkMTk5MWJjODg3M2RiNDc1MjIyZGYiLCJpYXQiOjE3NTU1MTA5NzYsImV4cCI6MTc1NTU5NzM3Nn0.QYh686WKBaPDRRbSsG5nMFjjCPGnCO2ywgok38reMwk"

# Exemple de test API avec authentification
curl -s "http://localhost:3000/api/families" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-test-mode: true"
```

**Comment récupérer le token :**
1. **DevTools Console** : `localStorage.getItem('token')`
2. **Network Tab** : Chercher `Authorization: Bearer [TOKEN]` dans les headers
3. **Application Tab** : Local Storage > `http://localhost:5173` > `token`

**⚠️ SANS TOKEN = TEST INCOMPLET** : Tester sans token ne valide que l'authentification, pas la fonctionnalité réelle de la route.

Workflow automatique :
1. **GET /debug/health/detailed** → Vérification routes chargées + serveur
2. **TEST avec TOKEN + x-test-mode: true** → Logging synchrone forcé avec auth
3. **Attente 100ms** → Garantie écriture logs
4. **GET /debug/logs** → Récupération logs automatique
5. **Analyse intelligente** → Status HTTP + logs correspondants + données réelles

#### Commandes de vérification des services
```bash
# Vérifier backend (tester plusieurs ports possibles)
curl -s http://localhost:3000/health || curl -s http://localhost:5000/health

# Vérifier frontend (tester plusieurs ports possibles)  
curl -s http://localhost:5173 || curl -s http://localhost:5177

# Si services OK → Procéder aux tests
# Si services KO → Status: SERVEURS_INACTIFS
```

#### Types de tests à implémenter
- **API** : Status codes, structure réponses, gestion erreurs (avec curl/fetch) - **LOGS OBLIGATOIRES**
- **React** : Rendu composants, interactions utilisateur, états (avec Jest)
- **Intégration** : Flux complets frontend ↔ backend (URLs directes)

#### Format de sortie STRICT - LOGS OBLIGATOIRES
```markdown
## AGENT TEST - Résultats avec PREUVES

### 🔍 Vérification services
- Backend : ✅ Actif sur port XXXX / ❌ Inactif
- Frontend : ✅ Actif sur port XXXX / ❌ Inactif

### ✅ Tests API exécutés (LOGS OBLIGATOIRES)
#### Tests Backend - Avec logs curl complets et AUTHENTIFICATION
```bash
# Test 1 : Route [NOM] - AVEC TOKEN OBLIGATOIRE
$ curl -v -X [METHOD] http://localhost:[PORT]/api/[ROUTE] \
  -H "Authorization: Bearer [TOKEN_VALIDE]" \
  -H "Content-Type: application/json" \
  -H "x-test-mode: true" \
  -d '{"data": "test"}'

< HTTP/1.1 [STATUS] [MESSAGE]
< Content-Type: application/json
[RESPONSE_BODY]

✅/❌ RÉSULTAT : [Description avec données réelles]
```

#### Tests Frontend (Jest)
- [Composant] : npm test [fichier] - ✅/❌

#### Tests Intégration
- [Flux] : Accès URL testé avec curl - ✅/❌

### 📊 Métriques
- Services actifs : X/2
- Tests Jest passés : X/Y  
- Tests API curl exécutés : X/Y (**AVEC LOGS**)
- Couverture de code : X%

### ⚠️ Erreurs détectées avec PREUVES
- [Test échoué] : [Log curl complet montrant l'erreur]
- [Status HTTP] : [404/500/etc. avec détails]

### 🎯 Recommandations basées sur les tests réels
- [Correction nécessaire basée sur logs]
- [Route à corriger - preuve 404]

### 🔄 Status
TESTS_VALIDÉS_AVEC_PREUVES / CORRECTIONS_NÉCESSAIRES / TESTS_INCOMPLETS / SERVEURS_INACTIFS

**INTERDICTION** : Status "VALIDÉ" sans logs curl pour nouvelles routes API
**INTERDICTION** : Tester une route protégée sans token d'authentification valide
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

### 🚀 AGENT GITHUB - GESTION COMMITS ET PUSH

#### Responsabilités
- **Push contrôlé** : Toutes branches sauf main (validation requise)
- **Nettoyage commits** : Suppression automatique signature Claude
- **Gestion conflits** : Résolution avec `git pull --rebase` pour historique propre
- **Validation main** : Push main uniquement sur demande explicite utilisateur
- **Historique propre** : Messages commits sans signature technique

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

#### Validation push main STRICTE
```markdown
**RÈGLE ABSOLUE** : Push vers main uniquement sur demandes explicites :
- "pousse sur main" / "push main"
- "déploie en production" / "push production"
- "merge vers main" / "release sur main"

**PROTECTION** : JAMAIS de push main automatique, même après validation complète.
**ACTIVATION** : Agent GitHub s'active UNIQUEMENT sur demandes explicites push :
- "pousse le code" / "push sur develop"
- "commit et push" / "sauvegarde sur GitHub"
```

#### Format de sortie
```markdown
## AGENT GITHUB - Gestion Push

### 🔍 Analyse pré-push
```bash
$ git status --porcelain --branch
[STATUS_COMPLET_AVEC_BRANCH_TRACKING]
$ git log --oneline -5
[COMMITS_RÉCENTS_À_POUSSER]
```

### 🧹 Nettoyage signatures Claude
- **Messages analysés** : [X commits vérifiés]
- **Signatures détectées** : [Y signatures Claude trouvées]
- **Nettoyage effectué** :
```bash
# Avant
commit abc123: "Fix TypeScript errors - Claude"
commit def456: "Add component Co-authored-by: Claude <noreply@anthropic.com>"

# Après nettoyage automatique
commit abc123: "Fix TypeScript errors"
commit def456: "Add component"
```

### 🚀 Push exécuté
```bash
$ git push origin [branch]
[LOGS_COMPLETS_PUSH_AVEC_RÉSULTAT]
```
✅/❌ RÉSULTAT : [Succès avec X commits poussés / Erreur détaillée]

### ⚠️ Conflits gérés
- **Conflit détecté** : [Type conflit avec branche distante]
- **Résolution rebase** :
```bash
$ git pull --rebase origin [branch]
[LOGS_REBASE_ET_RÉSOLUTION]
```
✅/❌ RÉSULTAT : [Rebase réussi / Escalade manuelle requise]

### 🛡️ Protection main
- **Demande explicite push main** : ✅/❌ [Phrases déclenchantes détectées]
- **Branch cible** : [develop/feature/main]
- **Autorisation push** : [AUTORISÉ / MAIN_PROTÉGÉ]

### 📊 Métriques push
- Commits poussés : X
- Signatures Claude nettoyées : X
- Conflits résolus automatiquement : X/Y
- Taille push : [X files, Y MB]
- Branch target : [nom_branche]

### 🔄 Status
PUSH_RÉUSSI / CONFLIT_MANUEL_REQUIS / MAIN_NON_AUTORISÉ / ERREUR_PUSH

**ACTIVATION** : Agent GitHub se déclenche UNIQUEMENT sur demande explicite utilisateur
**PROTECTION** : Push main bloqué sauf phrases explicites de déploiement
```

## 🔄 WORKFLOW SÉQUENTIEL OPTIMISÉ - NOUVELLE VERSION

### Cycle de développement avec Agent Build et Agent GitHub
0. 🖥️ Vérification serveurs (Chef de Projet)
1. 🎯 Chef de Projet → Analyse demande + Instructions
2. 💻 Agent Codeur → Développement fonctionnalité  
3. 🏗️ Agent HTML/Structure → Validation technique
4. 🎨 Agent Frontend → Vérification UX/cohérence
5. 🧪 Agent Test → Tests (serveurs déjà actifs)
6. 🎯 **Chef de Projet → Validation intermédiaire**
7. 🏗️ **Agent Build → Validation production Vercel (sur demande Chef de Projet)**
8. 🎯 **Chef de Projet → Analyse finale**
9. 🚀 **Agent GitHub → Push (UNIQUEMENT si demandé par utilisateur)**

### Workflow rebouclé avec corrections
```
Si erreurs détectées Agent Build :
6. Chef de Projet → 7. Agent Build (ERREURS) → 
6. Chef de Projet (analyse erreurs) → 2. Agent Codeur (corrections) →
6. Chef de Projet → 7. Agent Build (re-test) → 8. Chef de Projet (analyse finale)
```

### Gestion des problèmes serveurs
- Si Agent Test signale SERVEURS_INACTIFS → Chef de Projet prend en charge
- Redémarrage uniquement par le Chef de Projet
- Instructions de redémarrage : Terminal séparé avec `npm run dev`
- Attente : 30-60 secondes après redémarrage avant nouveaux tests

### Critères de fin de cycle STRICTS - VERSION ÉTENDUE
- ✅ Serveurs actifs et répondent
- ✅ Code développé sans erreurs
- ✅ Structure HTML/CSS technique validée
- ✅ Frontend cohérent avec design system
- ✅ Tests passent à 100% **AVEC LOGS CURL POUR ROUTES API**
- ✅ **Type-check réussi (rapide)**
- ✅ **Build simulation Vercel réussi**
- ✅ **Pas de différences tsconfig critiques**
- ✅ Couverture ≥ 80%
- ✅ Fonctionnalité opérationnelle **PROUVÉE PAR TESTS RÉELS**
- ✅ **Routes API testées avec TOKEN d'authentification valide**

### Push GitHub (optionnel - sur demande utilisateur)
- ✅ **Demande explicite utilisateur pour push**
- ✅ **Signatures Claude supprimées automatiquement**
- ✅ **Conflits résolus avec rebase ou escaladés**
- ✅ **Main protégé (demande explicite requise)**

### NOUVELLES RÈGLES ABSOLUES ÉTENDUES
- **AUCUNE validation finale sans logs curl complets pour toute nouvelle route API**
- **AUCUNE validation finale sans token d'authentification pour routes protégées**
- **AUCUNE validation finale sans build simulation Vercel réussi**
- **AUCUN push automatique sans demande explicite utilisateur**
- **AUCUN push main sans phrase explicite de déploiement**

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