# PageHeader Component

Composant unifié pour l'affichage des en-têtes de pages dans le CRM ABC Cours.

## Description

Le composant `PageHeader` centralise l'affichage du titre, breadcrumb, description et bouton retour selon les patterns existants du projet. Il assure une cohérence visuelle entre toutes les pages de l'application.

## Props

| Prop          | Type               | Obligatoire | Description                                            |
| ------------- | ------------------ | ----------- | ------------------------------------------------------ |
| `title`       | `string`           | Oui         | Titre principal de la page                             |
| `breadcrumb`  | `BreadcrumbItem[]` | Non         | Éléments du breadcrumb pour la navigation hiérarchique |
| `description` | `string`           | Non         | Description optionnelle sous le titre                  |
| `backButton`  | `BackButtonConfig` | Non         | Configuration du bouton retour                         |
| `className`   | `string`           | Non         | Classes CSS supplémentaires                            |

### Types

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BackButtonConfig {
  label: string;
  href: string;
}
```

## Exemples d'utilisation

### Page simple sans breadcrumb

```tsx
<PageHeader title="Gestion des Prospects" />
```

### Page avec breadcrumb et description

```tsx
<PageHeader
  title="Détails du Prospect"
  breadcrumb={[
    { label: "Prospects", href: "/prospects" },
    { label: "Détails" },
  ]}
  description="Créé le 15/01/2024 • Modifié le 20/01/2024"
  backButton={{ label: "Retour", href: "/prospects" }}
/>
```

### Page avec bouton retour uniquement

```tsx
<PageHeader
  title="Créer NDR"
  backButton={{ label: "Annuler", href: "/admin/dashboard" }}
/>
```

## Pages utilisant PageHeader

### Pages SANS breadcrumb

| Page                      | Titre                 | Configuration                                  |
| ------------------------- | --------------------- | ---------------------------------------------- |
| `Prospects.tsx`           | Gestion des Prospects | `<PageHeader title="Gestion des Prospects" />` |
| `Clients.tsx`             | Gestion des Clients   | `<PageHeader title="Gestion des Clients" />`   |
| `SettlementDashboard.tsx` | Tableau de bord       | `<PageHeader title="Tableau de bord" />`       |

### Pages AVEC breadcrumb

| Page                     | Breadcrumb                               | Description                 | Bouton Retour          |
| ------------------------ | ---------------------------------------- | --------------------------- | ---------------------- |
| `ProspectDetails.tsx`    | `[Prospects > Détails]`                  | Dates création/modification | ← Retour aux prospects |
| `ClientDetails.tsx`      | `[Clients > Détails]`                    | Client depuis {date}        | ← Retour aux clients   |
| `Admin.tsx`              | `[Admin > Liste des séries de coupons]`  | -                           | ← Retour admin         |
| `CouponsList.tsx`        | `[Admin > Liste des coupons]`            | -                           | ← Retour aux séries    |
| `CouponSeriesCreate.tsx` | `[Admin > Liste des séries > Création]`  | -                           | ← Retour aux séries    |
| `SeriesDetails.tsx`      | `[Admin > Liste des séries > Série n°X]` | Créé/Modifié le {date}      | ← Retour aux séries    |
| `SettlementDetails.tsx`  | `[Dashboard > NDR n°X]`                  | Créé/Modifié le {date}      | ← Retour au dashboard  |
| `NDRCreationWizard.tsx`  | `[Dashboard > Créer NDR]`                | -                           | ← Retour au dashboard  |
| `TemplatePreview.tsx`    | `[Admin > Template]`                     | Description du template     | ← Retour admin         |
| `UnderDevelopment.tsx`   | Breadcrumb dynamique                     | Description de l'état       | ← Retour calculé       |

## Styles CSS

Le composant utilise les classes suivantes :

- `.page-header` : Container principal
- `.page-header__content` : Container du titre et description
- `.page-header__title` : Titre principal (h1)
- `.page-header__description` : Description optionnelle
- `.page-header__actions` : Container du bouton retour

## Responsive

- **Desktop** : Titre et bouton retour sur la même ligne
- **Mobile** : Titre et bouton retour empilés verticalement

## Intégration

Le composant utilise les composants existants :

- `Breadcrumb` : Pour la navigation hiérarchique
- `Container` : Pour la mise en page et l'alignement
- `Button` : Pour le bouton retour

## Cohérence avec le Design System

- Respecte les variables CSS du design system
- Utilise les patterns de mise en page existants
- S'intègre parfaitement avec `Navbar` et `Container`
