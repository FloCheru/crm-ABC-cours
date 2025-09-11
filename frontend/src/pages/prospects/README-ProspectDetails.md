Pour ProspectDetails

# Data reçue

## Props depuis React Router

**useParams()**

- prospectId → string (ID du prospect à afficher)

**useNavigate()**

- navigate → function (navigation programmatique)

## Données depuis les services API

**useFamiliesGlobal()**

- prospects → Family[] (liste globale des prospects)
- loading → boolean (état de chargement)
- error → string | null (erreurs éventuelles)
- updateProspectOptimistic() → function (mise à jour optimiste)
- removeProspectOptimistic() → function (suppression optimiste)

**familyService**

- getFamily(prospectId) → Promise<Family> (détails du prospect)
- updateFamily(familyId, data) → Promise<Family> (mise à jour prospect)
- updateProspectStatus(prospectId, status) → Promise<Family> (changement statut)
- removeStudentFromFamily(familyId, studentId) → Promise<void> (suppression élève)
- updateReminderSubject(familyId, subjectId) → Promise<Family> (matière rappel)
- updateNextActionDate(familyId, date) → Promise<Family> (prochaine action)

**rdvService**

- getRdvsByFamilyId(familyId) → Promise<RendezVous[]> (RDV du prospect)
- deleteRdv(rdvId) → Promise<void> (suppression RDV)

**subjectService**

- getSubjects() → Promise<Subject[]> (liste des matières)

**adminService**

- getAdmins() → Promise<Admin[]> (liste des admins)

## État global et local

**ActionCacheService**

- Mises à jour optimistes ← executeAction()
- Synchronisation données ← cache automatique

**useState local**

- prospect → Family | null (prospect actuel)
- students → Student[] (élèves du prospect)
- prospectRdvs → RendezVous[] (RDV du prospect)
- subjects → Subject[] (matières disponibles)
- admins → Admin[] (admins disponibles)
- showAddStudentModal → boolean (modal ajout élève)
- selectedDataForView → {data, type} | null (modal visualisation)
- editingRdv → RendezVous | null (RDV en cours d'édition)
- showRdvModal → boolean (modal RDV)
- deletionPreview → object | null (prévisualisation suppression)

# Data envoyée

## Vers Modals

**Modal RDV**

- type: "rdv" → Modal component
- data: { familyId: prospect.\_id } (CREATE mode) → Modal component
- data: editingRdv (UPDATE mode) → Modal component
- isOpen: showRdvModal → Modal component

**Modal Student**

- type: "student" → Modal component
- data: { familyId: prospect.\_id } → Modal component
- isOpen: showAddStudentModal → Modal component

**Modal View**

- data: selectedDataForView.data → Modal component
- type: selectedDataForView.type → Modal component
- mode: "view" → Modal component

## Vers API Services

**familyService**

- familyId + updateData → familyService.updateFamily()
- prospectId + newStatus → familyService.updateProspectStatus()
- familyId + studentId → familyService.removeStudentFromFamily()
- familyId + subjectId → familyService.updateReminderSubject()
- familyId + dateValue → familyService.updateNextActionDate()

**rdvService**

- rdvId → rdvService.deleteRdv()

**subjectService**

- (Aucun paramètre) → subjectService.getSubjects()

## Navigation

**React Router**

- navigate() → Navigation programmatique vers autres pages

## FLUX BIDIRECTIONNELS

**ActionCacheService**

- ENVOIE : Actions + données → ActionCacheService.executeAction()
- REÇOIT : Mises à jour optimistes ← ActionCacheService

**Components internes**

- Table ← prospectRdvs.map() (données) | onRowClick() → (événements)
- StatusBanner ← prospect.status (données) | onStatusChange() → (événements)
- DataCard ← prospect.\* (données) | onSave() → (événements)

# Configuration et constantes

**PROSPECT_STATUS_MAP**

- Mapping statuts → labels et couleurs

**Table columns configurations**

- Configuration colonnes tables élèves et RDV

# Affichage

# Intéractions

## Modification des champs

### Boutons utilisés

- crayon sur DataCard Informations personnelles
- crayon sur DataCard Demande de cours
- crayon sur DataCard Suivi

### Actions déclenchées

- DataCard passe en mode Edit --> Les champs sont modifiables
- Clique sur annuler --> DataCard en mode Read avec anciens champs
- Clic sur sauvegarder --> DataCard en mode View avec nouveaux champs
