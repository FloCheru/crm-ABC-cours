# Page Prospects - Documentation ActionCache

## Vue d'ensemble
Tous les champs modifiables utilisent ActionCache avec updates optimistes et cache conservé (pas de rechargement).

## Actions ActionCache par fonctionnalité

### 🔄 Action UPDATE_REMINDER
**Champs concernés** : Objet du rappel, Date de rappel (RRR)

#### Depuis Tableau Prospects :
- **Objet du rappel** → ReminderSubjectDropdown
- **Date de rappel** → Colonne "RRR" (DatePicker)

#### Depuis ProspectDetails :
- **Objet du rappel** → Section "Suivi" → "Objet de rappel"  
- **Date de rappel** → Section "Suivi" → "Date de rappel"

**Services** : `familyService.updateReminderSubject()` / `familyService.updateNextActionDate()`

**Flux ActionCache** :
```
Modification → ActionCacheService.executeAction('UPDATE_REMINDER') → Update optimiste → API → Cache conservé
```

**Données optimistes** : `{ familyId, reminderData: { nextActionReminderSubject | nextActionDate }, previousData }`

---

### 👤 Action UPDATE_PROSPECT_STATUS
**Champs concernés** : Statut prospect

#### Depuis Tableau Prospects :
- **Statut** → StatusDot (point coloré cliquable)

#### Depuis ProspectDetails :
- **Statut** → Section "Suivi" → "Statut prospect" (select dropdown)

**Service** : `familyService.updateProspectStatus()`

**Flux ActionCache** :
```
Modification → ActionCacheService.executeAction('UPDATE_PROSPECT_STATUS') → Update optimiste → API → Cache conservé
```

**Données optimistes** : `{ prospectId, newStatus, oldStatus }`

---

### 📝 Action UPDATE_FAMILY
**Champs concernés** : Informations personnelles, Demande de cours

#### Depuis ProspectDetails uniquement :
- **Section "Informations personnelles"** → Prénom, nom, téléphones, email, adresse
- **Section "Demande de cours"** → Matières, niveau, fréquence, département, disponibilités

**Service** : `familyService.updateFamily()`

**Flux ActionCache** :
```
Modification → ActionCacheService.executeAction('UPDATE_FAMILY') → Update optimiste → API → Cache conservé
```

**Données optimistes** : `{ familyId, updates, previousData }`

---

## Comportement unifié

### Flux optimisé (toutes actions)
```
Modification → Update optimiste → API call → Succès → Cache conservé ✅
                                        → Erreur → Rollback optimiste ↩️
```

### Caractéristiques communes
1. **Mise à jour optimiste** : Interface mise à jour immédiatement
2. **Appel API** : Envoi de la modification au backend
3. **Succès** : Updates optimistes conservés (pas d'invalidation)
4. **Échec** : Rollback automatique vers l'état précédent
5. **Stores affectés** : `families` (useFamiliesStore)

### Performance
- **Pas de rechargement** : Aucun `refetchProspect()` ou rechargement de page
- **Updates instantanés** : Modification visible en 0ms
- **Cache intelligent** : Données conservées après succès API
- **Rollback automatique** : Retour à l'état précédent en cas d'erreur