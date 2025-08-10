# StatusBadge Component

Un composant de badge de statut conforme au design system de l'application.

## 🎨 Variants disponibles

| Variant      | Couleur de fond            | Couleur du texte       | Utilisation              |
| ------------ | -------------------------- | ---------------------- | ------------------------ |
| `active`     | `#d1fae5` (vert clair)     | `var(--success)`       | Statut actif/en cours    |
| `terminee`   | `var(--surface-secondary)` | `var(--text-tertiary)` | Statut terminé/complété  |
| `bloquee`    | `#fee2e2` (rouge clair)    | `var(--error)`         | Statut bloqué/arrêté     |
| `disponible` | `#dbeafe` (bleu clair)     | `var(--primary)`       | Statut disponible/ouvert |
| `utilise`    | `#d1fae5` (vert clair)     | `var(--success)`       | Statut utilisé/consommé  |

## 📖 Utilisation

```tsx
import { StatusBadge } from "../../../components";

// Utilisation basique
<StatusBadge variant="active">Active</StatusBadge>

// Avec texte personnalisé
<StatusBadge variant="disponible">Disponible</StatusBadge>

// Avec classe CSS personnalisée
<StatusBadge variant="bloquee" className="custom-class">
  Bloquée
</StatusBadge>
```

## 🔧 Props

| Prop        | Type                 | Requis | Description                                          |
| ----------- | -------------------- | ------ | ---------------------------------------------------- |
| `variant`   | `StatusBadgeVariant` | ✅     | Le type de badge à afficher                          |
| `children`  | `React.ReactNode`    | ❌     | Le contenu du badge (texte par défaut si non fourni) |
| `className` | `string`             | ❌     | Classes CSS additionnelles                           |

## 🎯 Cas d'usage

- **Statuts de coupons** : Active, Terminée, Bloquée
- **Statuts de paiements** : En attente, Payé, Annulé
- **Statuts de cours** : Disponible, Réservé, Terminé
- **Statuts généraux** : Actif, Inactif, En maintenance

## 🎨 Design System

Le composant respecte strictement les variables définies dans le design system :

- Forme arrondie (border-radius: 9999px)
- Padding uniforme (var(--spacing-xs) var(--spacing-md))
- Typographie cohérente (var(--font-size-small), var(--font-weight-medium))
- Couleurs sémantiques pour chaque statut (var(--success), var(--error), var(--primary), etc.)
