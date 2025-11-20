# 🔄 PLAN DE CONSOLIDATION : Teacher → Professor

**Date de création**: 2025-11-20
**Date d'achèvement**: 2025-11-20
**Statut**: ✅ COMPLÉTÉ
**Objectif**: Unifier le doublon Teacher/Professor dans le codebase

## 🎯 Résumé des changements effectués

### Phase 1 : Décision ✅
- **Option A choisie** : Backend comme source de vérité (modèle Professor de 15 champs essentiels)
- Supprimer tous les champs non-persistés en backend (gender, birthName, SSN, address détaillée, etc.)

### Phase 2 : Nettoyage Frontend ✅
- ✅ Créé `frontend/src/types/professor.ts` (type unifié basé sur modèle backend réel)
- ✅ Supprimé `frontend/src/types/teacher.ts`
- ✅ Mis à jour imports dans 7 fichiers :
  - `professorService.ts` (complété interface Professor)
  - `ProfesseurDetails.tsx` (complètement rewritten pour backend seulement)
  - `Professeurs.tsx` (interface Teacher locale remplacée)
  - `ProfesseurDetails.tsx` (imports updated)
  - `MaDeclaration.tsx` (imports updated)
  - `AvailabilityForm.tsx` (imports updated)
  - `MonProfil.tsx` (imports updated)
  - `MesChoix.tsx` (imports updated)
  - `usePrefillTest.ts` (TeacherTestData → ProfessorTestData)

### Phase 3 : Backend ✅
- ✅ `backend/models/PDF.js` : Enum 'Teacher' → 'Professor' (2 occurrences)

### Phase 4 : Validation ✅
- ✅ TypeScript compilation : 0 erreurs
- ✅ Aucune référence à "Teacher" restante
- ✅ Aucun import de `types/teacher.ts` restant

---

## 📊 Résumé de la situation

- **Backend**: Cohérent (Model `Professor`)
- **Frontend**: Incohérent (Types `Teacher` + Service `Professor` + interface locale)
- **Schéma**: 30+ champs frontend non présents en backend
- **Fichiers affectés**: ~15-20 fichiers import `teacher.ts` + pages/components

---

## 🎯 Phase 1 : Décision sur le schéma source

### ⚠️ DÉCISION REQUISE (Avant de coder)

Trois options disponibles:

#### **Option A : Backend comme source de vérité**
- [ ] Choisir cette option si données frontend non-critiques
- Réduire `Teacher` type au strict nécessaire (15 champs seulement)
- **Risque**: Perte de gender, SSN, banking details, availability détaillée

#### **Option B : Frontend comme source de vérité**
- [ ] Choisir cette option si tous les champs frontend sont critiques
- Étendre backend `Professor` model pour 30+ champs
- **Risque**: Migration BD importante, plus de complexité backend

#### **Option C : Hybride (RECOMMANDÉ)**
- [ ] Choisir cette option pour équilibre
- **Core backend**: Garder 15 champs essentiels (nom, email, phone, etc.)
- **Extended backend**: Ajouter 5-7 champs critiques manquants:
  - `gender` (string)
  - `birthName` (string)
  - `address` / `city` (full address object, pas juste postalCode)
  - `bankDetails` (nested object pour IBAN/SIRET)
  - `socialSecurityNumber` (optionnel)
- **Frontend**: Utiliser type complet pour validation locale, conversion pour API

---

## 🚀 Phase 2 : Nettoyage Frontend (Pas de changement BD)

### Étape 2.1 - Unifier les définitions de types

- [ ] Lire `frontend/src/types/teacher.ts` (source principale)
- [ ] Lire `frontend/src/services/professorService.ts` (interface incomplète)
- [ ] Lire `frontend/src/pages/professeurs/Professeurs.tsx` (interface locale dupliquée)
- [ ] Créer nouvelle définition unifiée dans `frontend/src/types/professor.ts`
- [ ] Supprimer `frontend/src/types/teacher.ts`
- [ ] Mettre à jour imports dans 15-20 fichiers

**Fichiers à mettre à jour (imports)**:
- [ ] `frontend/src/pages/professeurs/Professeurs.tsx` - Supprimer interface locale
- [ ] `frontend/src/pages/professeurs/ProfesseurDetails.tsx`
- [ ] `frontend/src/pages/professor/MonProfil.tsx`
- [ ] `frontend/src/pages/professor/MaDeclaration.tsx`
- [ ] `frontend/src/pages/professor/MesChoix.tsx`
- [ ] `frontend/src/pages/professor/MesRendezVous.tsx`
- [ ] `frontend/src/pages/professor/MesCoupons.tsx`
- [ ] `frontend/src/pages/professor/FichePaie.tsx`
- [ ] `frontend/src/pages/professor/MesEleves.tsx`
- [ ] `frontend/src/components/professor/AvailabilityForm.tsx`
- [ ] `frontend/src/components/professor/SubjectLevelsSelector.tsx`
- [ ] `frontend/src/hooks/usePrefillTest.ts` - Renommer `TeacherTestData` → `ProfessorTestData`
- [ ] `frontend/src/utils/professorSimulation.ts` (si applicable)
- [ ] Tout autre fichier avec `from '../../types/teacher'`

### Étape 2.2 - Compléter l'interface du service

- [ ] Lire `frontend/src/services/professorService.ts` (actuellement incomplète: "// ... autres champs")
- [ ] Enrichir interface `Professor` avec TOUS les champs retournés par l'API
- [ ] Documenter la structure exacte attendue de chaque endpoint
- [ ] Aligner avec la vraie réponse de `GET /api/professors`

### Étape 2.3 - Supprimer les doublons locaux

- [ ] Dans `frontend/src/pages/professeurs/Professeurs.tsx`:
  - Supprimer interface `Teacher` locale (lignes ~19-35)
  - Importer depuis `types/professor` à la place
  - Utiliser type centralisé avec imports TypeScript

### Étape 2.4 - Normaliser les formats de données

**Disponibilité**:
- [ ] Standardiser jour names: Choisir français (lundi/mardi) OU anglais (monday/tuesday)
- [ ] Format backend: `{day: string, timeSlots: [{start: "HH:mm", end: "HH:mm"}]}`
- [ ] Frontend `WeeklySchedule`: `{lundi: {enabled, timeSlots}, mardi: {...}}`
- [ ] Créer fonctions de conversion si nécessaire:
  - [ ] `convertBackendAvailability()` - backend format → frontend format
  - [ ] `convertFrontendAvailability()` - frontend format → backend format

**Statut**:
- [ ] Décider: `status` enum (active/inactive/pending/suspended) vs `isActive` boolean
- [ ] Backend utilise `status` enum (source de vérité)
- [ ] Frontend peut utiliser `isActive` boolean mais faire conversion
- [ ] Ajouter helper: `statusToIsActive(status) / isActiveToStatus(isActive)`

**Sujets d'enseignement**:
- [ ] Backend: Array de ObjectId références
- [ ] Frontend: Array de `TeachingSubject` {subjectId, subjectName, grades, levels}
- [ ] Créer conversion si structure différente

---

## 🔧 Phase 3 : Préparation Backend

### Étape 3.1 - Audit des routes API

- [ ] Lire `backend/routes/professors.js` complètement
- [ ] Documenter quels champs sont RÉELLEMENT retournés par `GET /api/professors`
- [ ] Documenter quels champs sont RÉELLEMENT retournés par `GET /api/professors/:id`
- [ ] Vérifier si `lastCouponDate` existe quelque part (utilisé en frontend, absent en backend)
- [ ] Vérifier structure de `availability` retournée
- [ ] Vérifier structure de `subjects` retournée

### Étape 3.2 - Audit du modèle Professor

- [ ] Lire `backend/models/Professor.js` complètement
- [ ] Lister tous les champs du schéma actuellement
- [ ] Identifier champs utilisés vs inutilisés
- [ ] Identifier champs attendus par frontend vs manquants en backend

### Étape 3.3 - Décision selon Option choisie (Phase 1)

**Si Option A (Backend comme vérité)**:
- [ ] Documenter que ces champs frontend ne sont PAS en backend:
  - gender, birthName, SSN, birthCountry, secondaryPhone, full address, etc.
- [ ] Réduire `teacher.ts` → types essentiels seulement
- [ ] Ajouter commentaires: "Champ non-persisté en BD"

**Si Option B (Frontend comme vérité)**:
- [ ] Planifier migration BD pour ajouter:
  - [ ] gender (String)
  - [ ] birthName (String)
  - [ ] address object (street, complement, city, inseeCity, distributionOffice)
  - [ ] bankDetails object (siret, bankName, iban, bic)
  - [ ] socialSecurityNumber (String)
  - [ ] certifications, miscellaneous, disabilityKnowledge arrays
  - [ ] currentSituation array
  - [ ] Autres champs critiques manquants
- [ ] Créer migration mongoose

**Si Option C (Hybride - RECOMMANDÉ)**:
- [ ] Ajouter au modèle Professor:
  - [ ] `gender: {type: String, enum: ["M.", "Mme"], default: "M."}`
  - [ ] `birthName: {type: String}`
  - [ ] `address: {street: String, complement: String, city: String, inseeCity: String}`
  - [ ] `bankDetails: {siret: String, bankName: String, iban: String, bic: String}`
- [ ] Créer migration BD pour ces champs
- [ ] Tester migration en développement

### Étape 3.4 - Corriger incohérences identifiées

- [ ] `backend/models/PDF.js`: Enum `['Teacher', 'Admin']` → `['Professor', 'Admin']`
  - [ ] Vérifier si données existantes référencent 'Teacher'
  - [ ] Si oui, créer migration pour mettre à jour

---

## ✅ Phase 4 : Correction des mappings et données

### Étape 4.1 - Corriger mapping en Professeurs.tsx

Actuellement ces champs sont mal mappés:

- [ ] `city`: Toujours vide (API ne le fournit pas)
  - Option A: Laisser vide et documenter
  - Option C: Vérifier si backend doit le fournir

- [ ] `levels`: Toujours vide (API ne le fournit pas)
  - Vérifier structure de `subjects` retournée par API
  - Si `subjects` contient les niveaux, extraire correctement

- [ ] `lastCouponDate`: Jamais fourni par l'API
  - [ ] Rechercher où ce champ devrait venir
  - [ ] Ajouter à l'API si critique, sinon supprimer du frontend

### Étape 4.2 - Utiliser type centralisé

- [ ] Dans `Professeurs.tsx`: Importer `Professor` depuis `types/professor`
- [ ] Enlever interface locale
- [ ] Utiliser type centralisé pour type-safety

---

## 📋 Checklist finale Phase 2+3

### Tests à faire après chaque étape

- [ ] Compilation TypeScript sans erreurs
- [ ] Page Professeurs affiche les données correctement
- [ ] Page Détails professeur charge les données
- [ ] Pages professor/* chargent sans erreurs
- [ ] Formulaires sauvegardent sans erreurs
- [ ] Pas de `any` types créés pour contourner erreurs de type

### Avant de merger

- [ ] Tous les imports résolus
- [ ] Pas d'imports circulaires
- [ ] Pas de fichier `teacher.ts` restant
- [ ] Documentation mise à jour si besoin
- [ ] Tests existants toujours passent

---

## 📁 Fichiers affectés - Recap

### À Créer
- [ ] `frontend/src/types/professor.ts` (nouveau - migration de teacher.ts)

### À Modifier - Frontend
- [ ] `frontend/src/services/professorService.ts` - Interface complète
- [ ] `frontend/src/pages/professeurs/Professeurs.tsx` - Enlever interface locale
- [ ] `frontend/src/pages/professeurs/ProfesseurDetails.tsx` - Import update
- [ ] `frontend/src/pages/professor/MonProfil.tsx` - Import update
- [ ] `frontend/src/pages/professor/MaDeclaration.tsx` - Import update
- [ ] `frontend/src/pages/professor/MesChoix.tsx` - Import update
- [ ] `frontend/src/pages/professor/MesRendezVous.tsx` - Import update
- [ ] `frontend/src/pages/professor/MesCoupons.tsx` - Import update
- [ ] `frontend/src/pages/professor/FichePaie.tsx` - Import update
- [ ] `frontend/src/pages/professor/MesEleves.tsx` - Import update
- [ ] `frontend/src/pages/professor/ProfessorLayout.tsx` - Check imports
- [ ] `frontend/src/components/professor/AvailabilityForm.tsx` - Import update
- [ ] `frontend/src/components/professor/SubjectLevelsSelector.tsx` - Import update
- [ ] `frontend/src/hooks/usePrefillTest.ts` - Rename types
- [ ] `frontend/src/utils/professorSimulation.ts` - Check imports

### À Supprimer
- [ ] `frontend/src/types/teacher.ts` (après migration complète)

### À Modifier - Backend (Dépend de Phase 1 decision)
- [ ] `backend/models/Professor.js` - Ajouter champs si Option B/C
- [ ] `backend/models/PDF.js` - Enum 'Teacher' → 'Professor'
- [ ] `backend/routes/professors.js` - Vérifier retours API
- [ ] Éventuels migrations BD

### Documentation à Mettre à Jour
- [ ] `.claude/EDIT_GUIDE.md` - Ajouter entrée sur cette consolidation

---

## 🎬 Exécution

**Recommandation**: Commencer par Phase 2 (Frontend only)
- Pas de changement BD risqué
- Tester que rien ne break
- PUIS Phase 3 si champs manquent réellement

**Next step**: Valider Phase 1 (choisir A/B/C) → Puis démarrer Phase 2