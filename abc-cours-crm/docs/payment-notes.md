# Notes de Règlement - Documentation

## Vue d'ensemble

La fonctionnalité des Notes de Règlement permet de gérer les paiements liés aux séries de coupons dans le système ABC Cours CRM. Elle permet de créer, consulter et gérer le statut des paiements pour les cours dispensés.

## Fonctionnalités

### 1. Création de Notes de Règlement

Chaque note de règlement contient les informations suivantes :

- **Date de saisie** : Date automatique de création de la note
- **Famille** : Famille concernée par le paiement
- **Élève** : Élève bénéficiaire du cours
- **Matière** : Matière enseignée
- **Niveau de l'élève** : Niveau scolaire (primaire, collège, lycée, supérieur)
- **Série de coupons** : Série de coupons concernée
- **Professeur** : Professeur qui dispense le cours
- **Montant** : Montant du règlement
- **Méthode de paiement** : Chèque, virement, carte bancaire, espèces
- **Notes** : Commentaires additionnels
- **Référence de paiement** : Numéro de chèque, référence virement, etc.

### 2. Gestion des Statuts

Les notes de règlement peuvent avoir trois statuts :

- **En attente** : Paiement non effectué
- **Payé** : Paiement reçu et confirmé
- **Annulé** : Note de règlement annulée

### 3. Actions Disponibles

- **Créer** : Nouvelle note de règlement
- **Consulter** : Voir les détails d'une note
- **Marquer comme payé** : Confirmer la réception du paiement
- **Annuler** : Annuler une note de règlement
- **Filtrer** : Par famille, élève, statut, etc.

## Structure Technique

### Modèle de Données (Backend)

```javascript
// backend/models/PaymentNote.js
{
  entryDate: Date,           // Date de saisie
  family: ObjectId,          // Référence vers Family
  student: ObjectId,         // Référence vers Student
  subject: ObjectId,         // Référence vers Subject
  studentLevel: String,      // Niveau de l'élève
  couponSeries: ObjectId,    // Référence vers CouponSeries
  professor: ObjectId,       // Référence vers Professor
  amount: Number,            // Montant du règlement
  paymentMethod: String,     // Méthode de paiement
  status: String,            // Statut du paiement
  paymentDate: Date,         // Date de paiement
  notes: String,             // Notes additionnelles
  paymentReference: String,  // Référence du paiement
  createdBy: ObjectId        // Utilisateur créateur
}
```

### API Endpoints

#### Notes de Règlement

- `GET /api/payment-notes` - Récupérer toutes les notes
- `GET /api/payment-notes/:id` - Récupérer une note spécifique
- `POST /api/payment-notes` - Créer une nouvelle note
- `PUT /api/payment-notes/:id` - Mettre à jour une note
- `DELETE /api/payment-notes/:id` - Supprimer une note
- `PATCH /api/payment-notes/:id/mark-paid` - Marquer comme payé
- `PATCH /api/payment-notes/:id/cancel` - Annuler une note

#### Filtres

- `GET /api/payment-notes/families/:familyId` - Notes par famille
- `GET /api/payment-notes/students/:studentId` - Notes par élève

#### Données Associées

- `GET /api/students/families/:familyId` - Élèves d'une famille
- `GET /api/professors/subject/:subjectId` - Professeurs par matière
- `GET /api/coupon-series/student/:studentId/subject/:subjectId` - Séries par élève et matière

### Interface Utilisateur (Frontend)

#### Composants Principaux

- `PaymentNotes.tsx` - Page principale
- `PaymentNotes.css` - Styles de la page

#### Services

- `paymentNoteService.ts` - Service pour les appels API

#### Types TypeScript

- `paymentNote.ts` - Types et interfaces

## Utilisation

### 1. Accès à la Page

La page des notes de règlement est accessible via l'URL :

```
/admin/payment-notes
```

### 2. Création d'une Note

1. **Sélectionner la famille** : Choisir la famille concernée
2. **Sélectionner l'élève** : L'élève doit appartenir à la famille sélectionnée
3. **Choisir la matière** : Sélectionner la matière enseignée
4. **Sélectionner la série de coupons** : Choisir parmi les séries disponibles pour l'élève et la matière
5. **Choisir le professeur** : Sélectionner parmi les professeurs qui enseignent cette matière
6. **Saisir le montant** : Montant du règlement
7. **Choisir la méthode de paiement** : Chèque, virement, carte, espèces
8. **Ajouter des notes** : Commentaires optionnels
9. **Soumettre** : Créer la note de règlement

### 3. Gestion des Statuts

- **Marquer comme payé** : Cliquer sur le bouton "Marquer payé" pour confirmer la réception
- **Annuler** : Cliquer sur "Annuler" pour annuler une note en attente

## Validation des Données

### Règles de Validation

1. **Famille** : Doit exister dans la base de données
2. **Élève** : Doit exister et appartenir à la famille sélectionnée
3. **Matière** : Doit exister et être active
4. **Série de coupons** : Doit exister et être liée à l'élève et la matière
5. **Professeur** : Doit exister, être actif et enseigner la matière sélectionnée
6. **Montant** : Doit être positif
7. **Méthode de paiement** : Doit être une des valeurs autorisées

### Contrôles Automatiques

- **Cohérence famille-élève** : L'élève sélectionné doit appartenir à la famille
- **Cohérence matière-professeur** : Le professeur doit enseigner la matière
- **Cohérence série-élève-matière** : La série doit être liée à l'élève et la matière

## Tests

### Tests Backend

Le fichier `backend/tests/paymentNotes.test.js` contient les tests unitaires pour :

- Création de notes de règlement
- Récupération de notes
- Mise à jour des statuts
- Validation des données
- Gestion des erreurs

### Exécution des Tests

```bash
cd backend
npm test paymentNotes.test.js
```

## Sécurité

### Authentification

Toutes les routes nécessitent une authentification via JWT token.

### Autorisation

Seuls les utilisateurs authentifiés peuvent accéder aux fonctionnalités.

### Validation

Validation côté serveur de toutes les données entrantes.

## Maintenance

### Logs

Les erreurs sont loggées avec des messages descriptifs pour faciliter le débogage.

### Performance

- Indexation des champs fréquemment utilisés
- Pagination pour les grandes listes
- Population sélective des données associées

### Sauvegarde

Les notes de règlement sont sauvegardées avec les autres données de l'application.

## Évolutions Futures

### Fonctionnalités Prévues

1. **Export PDF** : Génération de factures en PDF
2. **Notifications** : Notifications automatiques pour les paiements en retard
3. **Rapports** : Rapports de trésorerie et statistiques
4. **Intégration bancaire** : Connexion directe avec les comptes bancaires
5. **Multi-devises** : Support de différentes devises

### Améliorations Techniques

1. **Cache** : Mise en cache des données fréquemment utilisées
2. **Webhooks** : Notifications en temps réel
3. **API GraphQL** : Alternative à l'API REST
4. **Microservices** : Séparation en services indépendants
