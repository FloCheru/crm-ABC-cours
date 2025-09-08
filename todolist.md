# 📋 TODOLIST - Gestion du clic sur les lignes RDV

## 🎯 OBJECTIF PRINCIPAL

Implémenter la gestion du clic sur les lignes RDV avec Modal unifiée et intégration ActionCache complète

## ✅ TÂCHES COMPLÉTÉES

- [x] Analyser les composants RDV existants
- [x] Identifier la logique de clic élèves comme modèle
- [x] Définir l'approche Modal unifiée

## 🚧 TÂCHES EN COURS

- [ ] **[EN COURS]** Unifier handleViewStudent et handleViewRdv en handleViewData

## 📝 TÂCHES À FAIRE

### Phase 1 : Modal unifiée (ProspectDetails.tsx)

- [ ] Remplacer selectedStudentForView par selectedDataForView
- [ ] Créer handleViewData unifié
- [ ] Mettre à jour onRowClick élèves
- [ ] Ajouter onRowClick RDV
- [ ] Modifier la Modal existante (supprimer loadRdvs inutile)

### Phase 2 : Intégration ActionCache pour RDV

- [ ] Ajouter UPDATE_RDV dans types/actionCache.ts
- [ ] Ajouter UPDATE_RDV dans useActionCache.ts (mapping)
- [ ] Créer updateRdv avec ActionCache dans rdvService.ts
- [ ] Ajouter optimistic update pour RDV dans useFamiliesStore.ts
- [ ] Vérifier que Modal.tsx gère automatiquement type="rdv"

### Phase 3 : Tests et validation

- [ ] Tester le clic sur ligne élève (doit encore fonctionner)
- [ ] Tester le clic sur ligne RDV (nouveau)
- [ ] Tester la modification RDV avec persistance
- [ ] Vérifier les optimistic updates RDV
- [ ] Validation finale avec logs

### Phase 4 : Amélioration interface grade

    - [ ] Remplacer le champ texte grade par un composant Select.tsx en mode edit

- [ ] Intégrer la liste complète des choix de grades
- [ ] Tester le nouveau Select pour grade

## 📊 PROGRESSION

**Phase 1** : 0/5 ⏳  
**Phase 2** : 0/5 ⏳  
**Phase 3** : 0/5 ⏳

**GLOBAL** : 0/15 (0%) 🔴

---

_Dernière mise à jour : 2025-09-06 10:21_
