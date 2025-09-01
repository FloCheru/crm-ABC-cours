# CLAUDE.md

This file provides guidance to Claude Code when working with this CRM application for ABC Cours.

## Development Commands

### Frontend (React + TypeScript + Vite)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend (Node.js + Express + MongoDB)
- `cd backend && npm run dev` - Start backend dev server
- `cd backend && npm start` - Start backend production
- `cd backend && npm test` - Run Jest tests
- `cd backend && npm run test:watch` - Run tests in watch mode
- `cd backend && npm run test:coverage` - Run tests with coverage

### Database Management
- `cd backend && npm run seed` - Seed entire database
- `cd backend && npm run seed:subjects` - Seed subjects only
- `cd backend && npm run seed:users` - Seed users only

## Architecture Overview

Full-stack CRM application for ABC Cours educational institution management.

### Project Structure
- **Frontend**: React 19 + TypeScript + Vite (root directory)
- **Backend**: Node.js + Express + MongoDB (`/backend` directory)
- **Deployment**: Frontend on Vercel, Backend on Railway

### Core Domains
- **Authentication**: JWT-based auth with role-based access (admin/professor)
- **Family Management**: Students grouped by families with name fallback system
- **Coupon System**: Generate and track educational coupons/vouchers
- **Settlement Notes**: Financial settlement with intelligent prefill system
- **Subject Management**: Course subjects and professor assignments

### Key Technologies
- **Frontend**: React 19, TypeScript, React Router, React Hook Form, Zustand, TanStack Query, Tailwind CSS
- **Backend**: Express.js, Mongoose, JWT, bcrypt, Jest
- **Database**: MongoDB with Mongoose ODM

### Testing Strategy
- **Backend**: Jest with MongoDB Memory Server
- **Frontend**: Jest + React Testing Library + jsdom
- **Structure**: `/backend/tests/` and `/frontend/tests/`
- **Coverage**: `npm run test:coverage`

## Production Deployment

### Architecture
```
Frontend (Vercel) ──→ Backend (Railway) ──→ MongoDB Atlas
```

### Critical Deployment Settings

#### Vercel Configuration (vercel.json)
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
```

#### Environment Variables
**Frontend (Vercel):**
```bash
VITE_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

**Backend (Railway):**
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://crm-abc-cours.vercel.app
PORT=3000
```

#### CORS Configuration (Critical)
```javascript
// backend/server.js - MUST use environment variable
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
```

### Common Deployment Issues & Solutions

1. **"Famille inconnue" Error**: CORS misconfigured or VITE_API_URL missing
2. **Dockerfile Error on Vercel**: Missing vercel.json configuration  
3. **API 404 in Production**: Base path misconfigured
4. **TypeScript Build Failures**: Vercel uses stricter TypeScript rules

## NDR Intelligent Prefill System

Located in `src/services/ndrPrefillService.ts` - automatically generates optimized pricing based on subjects, department, and business rules.

**Key Features:**
- Subject-based pricing (Scientific vs Language vs Other)
- Geographic pricing adjustments (Paris higher rates)
- Margin optimization calculations
- One-click prefill with preview modal

**Usage:**
```typescript
const prefillData = ndrPrefillService.generatePrefillData(subjects, department, clientType);
const preview = ndrPrefillService.calculateQuickPreview(prefillData);
```

## ActionCache System

Le système ActionCache est documenté séparément dans : **`docs/ActionCache-System.md`**

Système avancé de gestion du cache basé sur les actions métier (CREATE_PROSPECT, CREATE_NDR, DELETE_NDR, DELETE_CLIENT, DELETE_PROSPECT) avec invalidation conditionnelle, updates optimistes et rollback automatique.

## Agent Development Methodology

**AGENT MODE OBLIGATOIRE**: ALL code modifications MUST use the agent workflow system.

### Agent Workflow Rules
1. **ALWAYS** use Task tool with subagent_type="general-purpose"
2. Chef de Projet analyzes and distributes work
3. Specialized agents execute their tasks
4. Full validation before user presentation

### RÈGLE CRITIQUE : ANNONCE DU PLAN OBLIGATOIRE

**AVANT TOUTE MODIFICATION** : 
1. **TOUJOURS annoncer le PLAN COMPLET** avec :
   - Liste explicite des fichiers qui seront modifiés
   - Description précise des modifications prévues
   - Lignes concernées dans chaque fichier
2. **ATTENDRE LA VALIDATION** de l'utilisateur avant toute action
3. **NE JAMAIS MODIFIER** directement sans plan validé

Format obligatoire du plan :
```
📋 PLAN DE MODIFICATION

Fichiers à modifier :
1. path/to/file1.tsx (lignes X-Y)
   - Description de la modification
2. path/to/file2.css (nouveau fichier ou lignes A-B)
   - Description de la modification

Actions prévues :
- Étape 1 : ...
- Étape 2 : ...

Validation requise avant exécution.
```

### Agent Roles

#### 🎯 Chef de Projet
- Analyzes requests and coordinates workflow
- Controls agent reports strictly
- **Assumes servers are always running locally (Backend: 3000, Frontend: 5173)**

#### 💻 Agent Codeur  
- Develops backend + frontend functionality
- Follows TypeScript strict mode rules
- **Critical Vercel Rules:**
  - No unused variables (strict mode)
  - Secure type casting only
  - Import types from services, not types/
  - TypeScript dependencies in devDependencies

#### 🏗️ Agent HTML/Structure
- Validates HTML structure and CSS layouts
- Checks modal scrolling, flexbox, grid positioning
- Ensures semantic HTML and accessibility
- **CRITICAL CSS RULES:**
  - NO individual CSS files per page component (like ProspectDetails.css)
  - Styles ONLY in index.css or shared components (Table, Breadcrumb, Container, etc.)
  - ALWAYS remove Tailwind classes when found
  - Use semantic HTML with minimal custom classes

#### 🎨 Agent Frontend
- Verifies UX consistency and design system coherence
- Validates user interactions and navigation flows
- Ensures visual consistency across components

#### 🧪 Agent Test
- **MUST create specific tests for each new feature**
- Uses MongoDB Memory Server for backend tests
- Places tests in `/backend/tests/` or `/frontend/tests/`
- **Never runs `npm test` without creating feature-specific tests**

#### 🏗️ Agent Build (Production Validation)
- Simulates Vercel environment with strict TypeScript
- **Pre-build Audits:**
  - TypeScript import validation
  - Unused variables detection  
  - Environment variables check
  - CORS configuration validation
- Blocks deployment if critical issues detected

#### 🚀 Agent GitHub (Push Management)
- **Double build validation**: Frontend + Backend before push
- Strategic branch selection based on modifications
- Automatic merge to develop after feature push
- **Main branch protection**: Explicit user request required
- Automatic Claude signature cleanup

#### 📚 Agent Documentation
- Updates CLAUDE.md after each modification
- Documents new components, APIs, and workflows
- **Activated after every structural change**

## Development Workflow

### Standard Sequence
1. 🎯 Chef de Projet → Request analysis
2. 💻 Agent Codeur → Development  
3. 🏗️ Agent HTML/Structure → Technical validation
4. 🎨 Agent Frontend → UX verification
5. 🧪 Agent Test → Feature-specific testing
6. 🎯 Chef de Projet → Intermediate validation
7. 🏗️ Agent Build → Production validation (on demand)
8. 🚀 Agent GitHub → Push workflow (on user request)
9. 📚 Agent Documentation → Update documentation

### Critical Rules
- **RÈGLE ABSOLUE : NE MODIFIER QUE CE QUI EST EXPLICITEMENT DEMANDÉ**
  - Ne jamais ajouter de classes CSS non demandées
  - Ne jamais modifier des structures existantes sans permission
  - Ne jamais faire d'améliorations ou optimisations non demandées
  - Respecter strictement la demande utilisateur - rien de plus, rien de moins
- **No final validation without Jest tests passing 100%**
- **No push without double build validation**  
- **No push main without explicit deployment request**
- **All builds must pass before any push**
- **Tests must use temporary database (MongoDB Memory Server)**
- **Agent Test must create tests BEFORE executing them**
- **When test fails, fix immediately - never bypass**

### Server Management
- **Servers are always running locally by the user**
- Backend auto-restarts on modifications with nodemon
- No need to verify server status - assume they're running
- Use curl for API testing when needed

### Push Strategy
**Standard push**: Feature branches → develop (automatic merge)
**Production push**: Requires explicit phrases like "push main" or "deploy production"

## Communication Protocol

- Structured Markdown reports with clear status
- Each agent reads previous agent reports
- Escalation to Chef de Projet for conflicts
- All modifications require documentation update

### Standard Reporting Format

**OBLIGATOIRE**: Every feature completion must include a detailed final report in this format:

#### 📊 BILAN COMPLET - [Feature Name]

**✅ RÉSULTATS DES TESTS**
- **X/X tests passés (100% de réussite)** or detailed breakdown

| Test | Statut | Description |
|------|--------|-------------|
| Test Name | ✅ PASS/❌ FAIL | Brief description |

**🔧 MODIFICATIONS TECHNIQUES**
- List all modified files with line numbers
- Show key code changes with snippets
- Document new functions/components added

**📋 DONNÉES DE TEST VALIDÉES**  
- Sample data used in tests
- Expected vs actual results
- Edge cases covered

**💡 FONCTIONNALITÉS IMPLÉMENTÉES**
1. Numbered list of new features
2. Technical details and constraints
3. Integration points and dependencies

**Final Status**: Clear statement of functionality status

This format ensures consistent, comprehensive documentation of all development work.

---

**Working Mode**: Agent system mandatory for all code changes. Servers managed locally by user (always running). No Claude signatures in commits.

## RÈGLES CRITIQUES - BASE DE DONNÉES

### ⚠️ INTERDICTIONS ABSOLUES
- **JAMAIS** lancer de scripts de seed sans autorisation explicite de l'utilisateur
- **JAMAIS** exécuter `npm run seed`, `npm run seed:users`, `npm run seed:subjects` sans demande claire
- **JAMAIS** modifier/supprimer des utilisateurs existants sans permission
- **JAMAIS** toucher à la base de données sans accord préalable

### Protocole obligatoire avant manipulation DB
1. **TOUJOURS DEMANDER** avant tout script qui modifie la base
2. **EXPLIQUER** clairement ce que le script va faire
3. **ATTENDRE** la validation explicite de l'utilisateur
4. En cas de doute : **NE PAS EXÉCUTER**

**Rationale**: Les scripts de seed écrasent les données existantes et peuvent détruire des utilisateurs/données importantes du projet.