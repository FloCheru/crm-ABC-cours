# Phase 1: Fix Detail Pages - localStorage → URL Params

## 🎯 Objectif
Migrer 4 detail pages de localStorage vers URL params pour persistance au reload et multi-onglets safety.

## 📋 Pages à migrer

### 1. ClientDetails
**File:** `frontend/src/pages/clients/ClientDetails.tsx`

**Actuellement:**
```typescript
const clientId = localStorage.getItem("clientId");
```

**À faire:**
1. Ajouter `useParams<{ clientId: string }>()`
2. Extraire ID: `const { clientId } = useParams()`
3. Supprimer localStorage.getItem("clientId")

**Route à ajouter dans main.tsx:**
```typescript
<Route path="/admin/clients/:clientId" element={<ClientDetails />} />
```

**Navigation à mettre à jour dans Clients.tsx:**
- Ligne 187-188: `navigate(\`/admin/clients/${row._id}\`)` au lieu de localStorage + navigate

---

### 2. ProspectDetails
**File:** `frontend/src/pages/prospects/ProspectDetails.tsx`

**Actuellement:**
```typescript
const prospectId = localStorage.getItem("prospectId");
```

**À faire:**
1. Ajouter `useParams<{ prospectId: string }>()`
2. Extraire ID: `const { prospectId } = useParams()`
3. Supprimer localStorage.getItem("prospectId")

**Route à ajouter dans main.tsx:**
```typescript
<Route path="/admin/prospects/:prospectId" element={<ProspectDetails />} />
```

**Navigation à mettre à jour dans Dashboard.tsx:**
- Ligne 130-131: `navigate(\`/admin/prospects/${prospectId}\`)` au lieu de localStorage + navigate

---

### 3. ProfesseurDetails
**File:** `frontend/src/pages/professeurs/ProfesseurDetails.tsx`

**Actuellement:**
```typescript
const useProfessorId = () => localStorage.getItem("professorId");
```

**À faire:**
1. Supprimer le hook personnalisé
2. Ajouter `useParams<{ professorId: string }>()`
3. Extraire ID: `const { professorId } = useParams()`

**Route à ajouter dans main.tsx:**
```typescript
<Route path="/admin/professeur-details/:professorId" element={<ProfesseurDetails />} />
```

**Navigation à mettre à jour dans Professeurs.tsx:**
- Mettre à jour pour: `navigate(\`/admin/professeur-details/${professorId}\`)`

---

### 4. ProfesseurDocuments
**File:** `frontend/src/pages/professeurs/ProfesseurDocuments.tsx`

**Actuellement:**
```typescript
const professorId = localStorage.getItem('professorId');
```

**À faire:**
1. Ajouter `useParams<{ professorId: string }>()`
2. Extraire ID: `const { professorId } = useParams()`
3. Supprimer localStorage.getItem('professorId')

**Route à ajouter dans main.tsx:**
```typescript
<Route path="/admin/professeur-details/:professorId/documents" element={<ProfesseurDocuments />} />
```

---

## 📝 Étapes d'implémentation

### Étape 1: Mettre à jour main.tsx (routes)
- Ajouter 4 routes avec :id params
- Format: `/admin/{resource}/:id`

### Étape 2: Mettre à jour les 4 detail pages
- Remplacer localStorage.getItem() par useParams()
- Ajouter import useParams

### Étape 3: Mettre à jour les navigations sources
- Clients.tsx line 187-188 (Clients list → ClientDetails)
- Dashboard.tsx line 130-131 (Dashboard → ProspectDetails)
- Professeurs.tsx (Professeurs list → ProfesseurDetails)
- ProfesseurDetails.tsx → ProfesseurDocuments (route interne)

### Étape 4: Vérifier et tester
- [ ] ClientDetails charge correctement avec URL `:clientId`
- [ ] Page se recharge correctement (ID persiste via URL)
- [ ] Multi-onglets: chaque onglet a son propre ID
- [ ] Répéter pour les 3 autres pages

---

## ✅ Bénéfices

- ✅ **Persistance au reload:** URL = source of truth
- ✅ **Multi-onglets safe:** Chaque onglet a sa propre URL
- ✅ **Shareable:** URLs peuvent être partagées/bookmarkées
- ✅ **Officiel:** Pattern React Router recommandé

---

## 🔄 Status: En attente d'exécution

