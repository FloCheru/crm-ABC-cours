# Gestion des Rôles et Permissions - ABC Cours CRM

Ce document explique comment utiliser le système de gestion des rôles et permissions basé sur les **best practices** validées par React-admin et React Router.

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Rôles disponibles](#rôles-disponibles)
3. [Utilisation dans les routes](#utilisation-dans-les-routes)
4. [Utilisation dans les composants](#utilisation-dans-les-composants)
5. [Navigation dynamique](#navigation-dynamique)
6. [Ajouter de nouvelles permissions](#ajouter-de-nouvelles-permissions)

---

## 🏗️ Architecture

### Fichiers créés

```
frontend/src/
├── types/
│   └── auth.types.ts          # Types TypeScript pour User et UserRole
├── services/
│   └── auth.service.ts        # Service centralisé pour les permissions
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx # Composant pour protéger les routes
│   └── layout/
│       ├── Navbar.tsx         # Navigation dynamique selon le rôle
│       └── Navbar.css         # Styles de la navbar
└── config/
    └── navigation.config.tsx  # Configuration de la navigation par rôle
```

---

## 👥 Rôles disponibles

### Admin

- **Accès complet** à toutes les fonctionnalités
- Pages accessibles : Dashboard, Professeurs, Élèves, Paramètres, Coupons, Prospects, Clients, NDRs
- Actions : Créer, Modifier, Supprimer (tous les éléments)

### Professeur

- **Accès limité** à ses propres données
- Pages accessibles : Mon profil, Mes élèves, Planning
- Actions : Voir et modifier uniquement ses propres données

---

## 🛣️ Utilisation dans les routes

### Protéger une route (simple authentification)

```tsx
import { ProtectedRoute } from "./components/ProtectedRoute";

<Route
  path="/admin/coupons"
  element={
    <ProtectedRoute>
      <CouponsList />
    </ProtectedRoute>
  }
/>;
```

### Protéger une route par rôle

```tsx
import { RoleBasedProtectedRoute } from "./components/auth/ProtectedRoute";

// Admin uniquement
<Route
  path="/professeurs"
  element={
    <RoleBasedProtectedRoute allowedRoles={['admin']}>
      <ProfesseursPage />
    </RoleBasedProtectedRoute>
  }
/>

// Professeur uniquement
<Route
  path="/mon-profil"
  element={
    <RoleBasedProtectedRoute allowedRoles={['professeur']}>
      <ProfilPage />
    </RoleBasedProtectedRoute>
  }
/>

// Admin ET Professeur
<Route
  path="/planning"
  element={
    <RoleBasedProtectedRoute allowedRoles={['admin', 'professeur']}>
      <PlanningPage />
    </RoleBasedProtectedRoute>
  }
/>
```

---

## 🎨 Utilisation dans les composants

### Hook useAuthPermissions

```tsx
import { useAuthPermissions } from "../services/auth.service";

export const MyComponent = () => {
  const { user, role, isAdmin, isProfesseur, can } = useAuthPermissions();

  return (
    <div>
      <h1>
        Bonjour {user?.firstName} {user?.lastName}
      </h1>

      {/* Affichage conditionnel basé sur le rôle */}
      {isAdmin && <button onClick={handleDelete}>Supprimer</button>}

      {/* Affichage conditionnel basé sur une permission spécifique */}
      {can("editProfesseur") && <button onClick={handleEdit}>Modifier</button>}

      {/* Affichage pour les professeurs */}
      {isProfesseur && (
        <div>
          <h2>Mes élèves</h2>
          {/* ... */}
        </div>
      )}
    </div>
  );
};
```

### Exemple concret : ProfesseurDetails

```tsx
import { useAuthPermissions } from "../../services/auth.service";

export const ProfesseurDetails = () => {
  const { isAdmin, can } = useAuthPermissions();
  const [teacher, setTeacher] = useState(null);

  return (
    <div>
      {/* Informations toujours visibles */}
      <h1>
        {teacher.firstName} {teacher.lastName}
      </h1>
      <p>Email: {teacher.email}</p>

      {/* Boutons d'édition (admin uniquement) */}
      {can("editProfesseur") && <button onClick={handleEdit}>Modifier</button>}

      {/* Bouton de suppression (admin uniquement) */}
      {can("deleteProfesseur") && (
        <button onClick={handleDelete}>Supprimer</button>
      )}

      {/* Section salaire (admin uniquement) */}
      {isAdmin && (
        <div>
          <h3>Informations financières</h3>
          <p>Salaire: {teacher.salary}€</p>
        </div>
      )}
    </div>
  );
};
```

---

## 🧭 Navigation dynamique

La navbar affiche automatiquement les liens selon le rôle de l'utilisateur.

### Utilisation

```tsx
import { Navbar } from "./components/layout/Navbar";

function App() {
  return (
    <>
      <Navbar />
      {/* ... routes ... */}
    </>
  );
}
```

La configuration se trouve dans `frontend/src/config/navigation.config.tsx` :

```tsx
export const navigationItems: NavItem[] = [
  // Admin uniquement
  {
    label: "Dashboard",
    path: "/",
    icon: Home,
    roles: ["admin"],
  },
  {
    label: "Professeurs",
    path: "/professeurs",
    icon: Users,
    roles: ["admin"],
  },

  // Professeur uniquement
  {
    label: "Mon profil",
    path: "/mon-profil",
    icon: Users,
    roles: ["professeur"],
  },
];
```

---

## ➕ Ajouter de nouvelles permissions

### 1. Ajouter une permission dans le service

Éditez `frontend/src/services/auth.service.ts` :

```tsx
const PERMISSIONS = {
  admin: {
    pages: ["dashboard", "professeurs", "eleves" /* ... */],
    can: {
      createProfesseur: true,
      editProfesseur: true,
      // ✅ Ajoutez votre nouvelle permission ici
      manageSalaries: true,
      exportData: true,
    },
  },
  professeur: {
    pages: ["mon-profil", "mes-eleves", "planning"],
    can: {
      editOwnProfile: true,
      viewOwnEleves: true,
      // ✅ Permissions spécifiques au professeur
      requestLeave: true,
    },
  },
};
```

### 2. Utiliser la nouvelle permission

```tsx
import { useAuthPermissions } from "../services/auth.service";

export const SalaryComponent = () => {
  const { can } = useAuthPermissions();

  if (!can("manageSalaries")) {
    return <p>Vous n'avez pas accès à cette fonctionnalité</p>;
  }

  return (
    <div>
      {/* Contenu accessible uniquement aux admins avec permission manageSalaries */}
    </div>
  );
};
```

---

## 🔐 Sécurité

### Important

- ✅ Le backend **doit toujours** valider les permissions
- ✅ Le frontend ne fait que masquer l'UI, pas sécuriser les données
- ✅ Le backend filtre automatiquement les données selon le rôle (ex: un professeur ne reçoit que ses élèves)

### Exemple de service backend

```typescript
// backend - Service professeur
async getEleves(userId: string, userRole: string) {
  if (userRole === 'admin') {
    // Admin voit tous les élèves
    return this.eleveModel.find();
  } else if (userRole === 'professeur') {
    // Professeur voit uniquement ses élèves
    return this.eleveModel.find({ professeurId: userId });
  }
  throw new UnauthorizedException();
}
```

---

## 📚 Références

Ce système est basé sur les **best practices** confirmées par :

- [React-admin RBAC](https://marmelab.com/react-admin/AuthRBAC.html)
- [React Router Authentication](https://reactrouter.com/en/main/start/overview#authentication)
- [React Design Patterns](https://github.com/PacktPublishing/React-Design-Patterns-and-Best-Practices)

---

## 🎯 Pourquoi cette approche ?

✅ **Simple** : Pas de système RBAC complexe, juste 2 rôles
✅ **Backend-first** : Le filtrage des données est fait côté serveur
✅ **Type-safe** : TypeScript pour éviter les erreurs
✅ **Évolutif** : Facile d'ajouter de nouveaux rôles/permissions
✅ **Conforme aux best practices** : Validé par les docs officielles
✅ **Pas d'over-engineering** : Juste ce qu'il faut, rien de plus

# Retour gpt

⚠️ Points à surveiller / pistes d’amélioration

1. Permissions côté backend

Mentionnée dans la doc, mais à vérifier en pratique.

Il faut que ton API Node/Mongo filtre systématiquement les requêtes selon le rôle :

middleware d’auth (JWT ou session),

vérification du req.user.role avant d’accéder aux données sensibles.

👉 Si ce n’est pas encore codé, il te faudra un roleGuard côté Express/Nest :

function roleGuard(allowedRoles: UserRole[]) {
return (req, res, next) => {
if (!allowedRoles.includes(req.user.role)) {
return res.status(403).json({ message: 'Accès refusé' });
}
next();
};
}

2. Granularité des permissions

Actuellement, chaque rôle a un bloc can général (editProfesseur, viewStats, etc.).
➡️ C’est parfait pour 2 rôles, mais si tu veux plus tard ajouter des variations (ex. “admin régional”), il faudra peut-être extraire les permissions dans un fichier dédié pour éviter la duplication.

3. UX : Redirection post-login

Assure-toi que le système redirige l’utilisateur vers la page adaptée à son rôle :

admin → /professeurs

professeur → /mon-profil

4. Amélioration future possible

Si tu veux aller plus loin :

Ajouter un loader de routes basé sur les permissions (lazy loading React Router v7).

Gérer les rôles dynamiques depuis la BDD (au lieu de coder les permissions en dur).

Ajouter un context global AuthContext si plusieurs providers doivent y accéder (Socket.io, etc.).
