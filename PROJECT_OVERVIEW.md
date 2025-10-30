# ABC Cours CRM - Vue d'ensemble du projet

## 🎯 Objectif de l'application

ABC Cours CRM est une plateforme de gestion pour une entreprise de cours privés et de prospection. Elle permet de :
- **Gérer les professeurs** (création, modification, suppression, activation/désactivation)
- **Organiser les rendez-vous (RDV)** avec les familles et prospects
- **Gérer les familles et les élèves** associés
- **Gérer les prospects et clients** en pipeline commercial
- **Administrer les coupons** et promotions
- **Suivre les finances** (salaires professeurs, paiements, NDR - Notes De Remise)
- **Offrir un portail professeur** pour que les professeurs voient leurs informations et leurs élèves

---

## 📊 Architecture globale

```
abc-cours-crm (Monorepo)
├── frontend/                 # Application React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/           # Pages par fonctionnalité
│   │   ├── components/      # Composants réutilisables
│   │   ├── services/        # Services API (jamais appels directs dans les pages)
│   │   ├── types/           # Types TypeScript
│   │   ├── hooks/           # Hooks personnalisés
│   │   ├── contexts/        # Contextes React (authentification, simulation...)
│   │   └── config/          # Configuration (navigation, etc)
│   └── package.json
├── backend/                  # API Node.js + Express + MongoDB
│   ├── models/              # Modèles MongoDB
│   ├── routes/              # Routes API
│   ├── services/            # Logique métier
│   ├── middleware/          # Middleware Express
│   └── server.js
└── package.json (workspace root)
```

---

## 👥 Utilisateurs et rôles

### Admin
- **Accès complet** à toutes les fonctionnalités
- Pages accessibles : Dashboard, Professeurs, Élèves, Paramètres, Coupons, Prospects, Clients, NDRs, Statistiques
- Actions : Créer, Modifier, Supprimer tous les éléments
- Peut **simuler l'accès professeur** pour vérifier ce que voit un professeur spécifique
- Gestion des salaires et des données financières

### Professeur
- **Accès limité** à ses propres données
- Pages accessibles : Mon profil, Mes élèves, Planning
- Actions : Voir et modifier uniquement ses propres données
- Accès aux coupons/promotions
- Visualisation de ses informations de salaire (lecture seule)

---

## 🔐 Système d'authentification et d'autorisation

### Authentification
- Système existant basé sur **authService** (Zustand pour le state management)
- JWT ou sessions (infrastructure existante)
- Utilisateurs stockés en MongoDB

### Autorisation (RBAC - Role Based Access Control)
- **ProtectedRoute** : Protège les routes selon l'authentification
- **RoleBasedProtectedRoute** : Protège les routes selon le rôle (`admin` ou `professeur`)
- Hook **useAuthPermissions()** : Accès aux permissions dans les composants
- Configuration centralisée des permissions dans `auth.service.ts`

### Sécurité
- ✅ Frontend : Masque l'UI selon les permissions (UX)
- ✅ Backend : **Doit toujours** valider les permissions et filtrer les données
- Exemple : Un professeur ne reçoit que ses élèves via l'API

---

## 📋 Entités principales

### 1. Professeur (Teacher)
```typescript
{
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  // + autres champs selon modèle MongoDB
}
```
- Pages : `/admin/professeurs`, `/admin/professeurs/:id`, `/professor/profil`
- Actions admin : Ajouter, modifier, supprimer, désactiver, renvoyer mot de passe
- Portail professeur : Voir/modifier profil

### 2. Famille (Family)
- Données de contact principales pour les élèves
- Gestion à travers un modal de création/édition
- Liée aux élèves et aux RDV

### 3. Élève (Student)
- Lié à une famille
- Assigné à un ou plusieurs professeurs
- Historique des cours et progression

### 4. RDV (Rendez-vous)
- Gestion des rendez-vous avec familles/prospects
- Statuts, dates, type de RDV
- Historique des interactions

### 5. Prospect / Client
- Pipeline commercial
- Différenciation entre prospect (non client) et client (qui a acheté)

### 6. Coupon
- Codes de promotion
- Gestion de validité, montants
- Utilisation par les clients

### 7. NDR (Note De Remise)
- Documents financiers
- Suivi des paiements/remises

---

## 🎨 Système de composants et design

### Composants UI réutilisables
- **Modal** : Système unifié de modales pour création/édition
- **ModalWrapper** : Wrapper pour les formulaires dans modales
- **Button** : Avec variantes (primary, success, error, outline)
- **Navbar** : Affichage dynamique selon le rôle et état de simulation
- **SimulationBanner** : Bandeau sticky quand l'admin simule un professeur

### Icônes
- Utilisé **lucide-react** (Eye, KeyRound, UserRound, Delete, etc.)
- 16px par défaut, adaptable selon besoin

### Design tokens
```
Couleurs:
- primary: #2354a2 (bleu)
- success: #059669 (vert)
- error: #dc2626 (rouge)
- info: couleur secondaire
- secondary: autre accent

Espacement:
- gap-sm: 8px
- gap-md: 16px
- gap-lg: 24px

Tailles icônes:
- w-4 h-4: 16px
- w-6 h-6: 24px
```

---

## 🔄 Flux de simulation (Admin voit l'interface professeur)

### Cas d'usage
L'admin veut vérifier ce qu'un professeur voit dans son portail.

### Implémentation
1. Admin sur `/admin/professeurs/:id` clique "Voir comme professeur"
2. Contexte **ProfessorViewContext** stocke `professorId` dans localStorage
3. Redirection vers `/professor/profil`
4. **SimulationBanner** s'affiche en bleu en haut
5. **Navbar** affiche les liens professeur au lieu des liens admin
6. **ProtectedRoute** autorise l'admin simulé à accéder les routes professeur
7. Clic "Retour à la vue admin" → Réinitialise contexte → Retour `/admin/professeurs`

### Fichiers impliqués
- `contexts/ProfessorViewContext.tsx` : Gestion d'état avec localStorage
- `components/layout/SimulationBanner.tsx` : Bandeau bleu
- `hooks/useProfessorId.ts` : Retourne le bon ID selon simulation
- `components/auth/ProtectedRoute.tsx` : Autorise admin en simulation

---

## 📝 Services API (ne JAMAIS appeler directement dans les pages)

Tous les appels API doivent passer par des services :

```
services/
├── auth.service.ts         # Authentification, permissions
├── teacher.service.ts      # Opérations sur professeurs
├── student.service.ts      # Opérations sur élèves
├── family.service.ts       # Opérations sur familles
├── rdv.service.ts          # Opérations sur RDV
├── coupon.service.ts       # Opérations sur coupons
└── ...
```

**Règle d'or** : Les pages/composants importent les services et les utilisent, jamais les appels fetch/axios directs.

---

## 🚀 Technologie et dépendances principales

### Frontend
- **React 18** : UI library
- **TypeScript** : Typage statique
- **Vite** : Bundler / dev server
- **Zustand** : State management (pour authService)
- **React Router** : Navigation
- **Tailwind CSS** : Styling
- **Lucide React** : Icons
- **Sonner** : Toast notifications
- **shadcn/ui** : Composants UI (optionnel)

### Backend
- **Node.js 18+** : Runtime
- **Express** : Framework HTTP
- **MongoDB** : Base de données
- **Jest** : Testing
- **Docker** : Tests (docker:test:up/down)

### DevDeps (root)
- **TypeScript** : Configuration globale
- **Concurrently** : Dev en parallèle (frontend + backend)
- **pnpm** : Package manager (frontend utilise pnpm-lock.yaml)

---

## 📦 Commands disponibles

### Root level
```bash
npm run dev                    # Lance frontend + backend en parallèle
npm run install:all           # Installe tous les dépendances
npm run build                 # Build frontend
npm run test                  # Lance tests backend avec docker
npm run lint                  # Lint frontend
```

### Frontend
```bash
cd frontend && npm run dev    # Dev mode
cd frontend && npm run build  # Build production
```

### Backend
```bash
cd backend && npm run dev     # Dev mode
cd backend && npm start       # Production
cd backend && npm test        # Tests
```

---

## 🗂️ Structure des pages frontend

### Pages Admin
- `/` (Dashboard)
- `/admin/professeurs` : Liste et gestion des professeurs
- `/admin/professeurs/:id` : Détails d'un professeur
- `/admin/professeur-details` : Alias pour détails
- `/admin/dashboard` : Dashboard admin (nouveau)

### Pages Professeur
- `/professor/profil` : Profil du professeur
- `/professor/eleves` : Liste des élèves du professeur (détails + documents)
- `/professor/planning` : Planning/emploi du temps
- `/professor/coupon` : Voir les coupons
- `/professor/fiche-paie` : Visualiser sa fiche de paie

### Pages Communes
- `/login` : Connexion
- `/unauthorized` : Page d'erreur 403 (rôle non autorisé)

---

## 🐛 Points importants à connaître

### 1. Race conditions (simulation)
L'état `isSimulatingProfessor` est chargé du localStorage synchronement dans `useState` pour éviter les race conditions avec `ProtectedRoute`.

### 2. Nomenclature
- `teacher` = `professeur` (utilisé de manière interchangeable dans le code)
- Renommage global en cours : `teacherId` → `professorId`

### 3. Validation permissions
- ✅ Frontend : Cache/masque UI
- ✅ Backend : **Doit filtrer les données** selon `req.user.role`

### 4. localStorage
- Clé : `professorId` (quand admin simule un professeur)
- Clé : `authToken` ou autre (gestion auth existante)

---

## 📚 Derniers changements (10/2025)

### Nouvelles fonctionnalités
1. **Système de Modal** : Création/édition unifiée pour familles et prospects
2. **Portail Professeur** : Interface complète pour les professeurs
3. **Mode Simulation** : Admin peut voir l'interface d'un professeur
4. **AdminLayout** : Layout unifié pour les routes admin
5. **Gestion RDV améliorée** : Backend + Frontend
6. **Boutons d'action** : Tableau professeurs avec actions rapides

### Fichiers clés créés récemment
- `contexts/ProfessorViewContext.tsx`
- `components/layout/SimulationBanner.tsx`
- `hooks/useProfessorId.ts`
- `pages/admin/Dashboard.tsx`
- `pages/professeurs/ProfesseurDetails.tsx`
- `components/modal/Modal.tsx`

---

## 🎯 Points d'extension future

1. **Ajouter un 3e rôle** : Admin régional (avec permissions limitées)
2. **Lazy loading de routes** : Basé sur permissions (React Router v7)
3. **Permissions dynamiques** : Charger depuis la BDD au lieu de coder en dur
4. **AuthContext global** : Pour Socket.io ou autres services
5. **Amélioration UX** : Redirection post-login selon le rôle
6. **Backend : Middleware roleGuard** : Pour sécuriser toutes les API

---

## 📖 Comment utiliser ce document

Ce fichier sert de **contexte global** pour :
- Expliquer l'application à une IA
- Onboarder de nouveaux développeurs
- Documenter l'architecture et les conventions
- Servir de référence pour les futures modifications

**Consulter aussi** :
- `EDIT_GUIDE.md` : Détails des modifications récentes
- `frontend/ROLE_BASED_ACCESS_CONTROL.md` : Système de permissions détaillé
- `frontend/IMPLEMENTATION_SUMMARY.md` : Résumé des implémentations

---

**Dernière mise à jour** : 30 octobre 2025
**Stack** : React + TypeScript + Vite | Node.js + Express | MongoDB
**Rôles** : Admin (accès complet) | Professeur (accès limité)
**Phase** : Développement actif
