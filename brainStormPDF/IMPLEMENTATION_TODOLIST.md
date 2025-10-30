# 📋 Todo List - Implémentation Système PDF avec Fiche de Paie

**Date de début** : 30 octobre 2025
**Objectif** : Implémenter la solution technique validée dans TECHNICAL_DECISIONS.md
**Priorité 1** : Fiche de paie (professeurs)

---

## 📊 Vue d'ensemble de l'avancement

- [x] **Phase 1** : Setup infrastructure (30 min) ✅
- [x] **Phase 2** : Extraction du bon code (45 min) ✅
- [x] **Phase 3** : Chiffrement & Stockage (1h) ✅
- [x] **Phase 4** : Templates Handlebars (1h30) ✅
- [x] **Phase 5** : Service PDF principal (1h) ✅
- [x] **Phase 6** : Routes API (45 min) ✅
- [x] **Phase 7** : Service frontend (30 min) ✅
- [x] **Phase 8** : Migration ancien système NDR (2h) ✅
- [ ] **Phase 9** : Tests & Validation (1h)

**Progression totale** : 8/9 phases complétées (89%)

---

## 🔧 Phase 1 : Setup infrastructure (30 min)

### 1.1 Installation dépendances
- [x] Installer Handlebars : `cd backend && pnpm install handlebars`
- [x] Vérifier que Puppeteer est installé (normalement déjà présent)

### 1.2 Création structure de dossiers
- [x] Créer `backend/services/pdf/`
- [x] Créer `backend/services/pdf/templates/`
- [x] Créer `backend/models/` (déjà existant)

### 1.3 Génération clés de chiffrement
- [x] Générer clé DEV AES-256
- [x] Générer clé PROD AES-256 (différente pour isolation sécurité)

### 1.4 Configuration .env
- [x] Modifier `backend/.env.example` : ajouter `PDF_ENCRYPTION_KEY=your_32_byte_hex_key_here`
- [x] Ajouter clé DEV dans `backend/.env.development`
- [x] Ajouter clé PROD dans `backend/.env.production`
- [x] Vérifier que `.env` est dans `.gitignore`

**✅ Phase 1 terminée le : 30 octobre 2025**

---

## 🧹 Phase 2 : Extraction du bon code (45 min)

### 2.1 Extraire BrowserPool
- [x] Créer fichier `backend/services/pdf/browserPool.js`
- [x] Copier classe `BrowserPool` depuis `pdfGenerationService.js` (lignes 7-59)
- [x] Ajouter export : `module.exports = new BrowserPool(3);`
- [x] Ajouter cleanup handlers (SIGINT/SIGTERM)

### 2.2 Extraire PDFCache
- [x] Créer fichier `backend/services/pdf/pdf.cache.js`
- [x] Copier classe `PDFCache` depuis `pdfGenerationService.js` (lignes 62-102)
- [x] Modifier `generateKey(type, userId, version)` pour nouvelle signature
- [x] Ajouter export : `module.exports = new PDFCache(10);`

### 2.3 Extraire renderer Puppeteer
- [x] Créer fichier `backend/services/pdf/pdf.renderer.js`
- [x] Copier fonction `generatePDFFromHTML` depuis `pdfGenerationService.js` (lignes 427-485)
- [x] Modifier pour accepter `browserPool` en paramètre
- [x] Ajouter export : `module.exports = { generatePDFFromHTML };`

**✅ Phase 2 terminée le : 30 octobre 2025**

---

## 🔒 Phase 3 : Chiffrement & Stockage (1h)

### 3.1 Créer module de chiffrement
- [x] Créer fichier `backend/services/pdf/pdf.encryption.js`
- [x] Implémenter fonction `encryptPDF(pdfBuffer)` avec AES-256-CBC
- [x] Implémenter fonction `decryptPDF(encryptedBuffer, ivHex)`
- [x] Ajouter validation de la clé de chiffrement

### 3.2 Créer module de stockage GridFS
- [x] Créer fichier `backend/services/pdf/pdf.storage.js`
- [x] Implémenter `savePDF(encryptedBuffer, metadata)` avec GridFSBucket
- [x] Implémenter `getPDF(fileId)` retournant buffer + métadonnées
- [x] Implémenter `deletePDF(fileId)` pour suppression GridFS
- [x] Implémenter `listUserPDFs(userId, type)` pour listing
- [x] Ajouter fonction `initGridFS()` pour initialisation

### 3.3 Créer modèle PDF
- [x] Créer fichier `backend/models/PDF.js`
- [x] Définir schéma Mongoose avec métadonnées + référence GridFS
- [x] Ajouter index composés sur `userId`, `type`, `createdAt`
- [x] Ajouter méthodes `logAccess()` et `softDelete()`
- [x] Exporter modèle

**✅ Phase 3 terminée le : 30 octobre 2025**

---

## 📝 Phase 4 : Templates Handlebars (1h30)

### 4.1 Template fiche de paie
- [x] Créer fichier `backend/services/pdf/templates/fiche_paie.hbs`
- [x] Implémenter structure HTML avec CSS inline
- [x] Ajouter section "EMPLOYEUR" (ABC COURS, SIRET, NAF, URSSAF)
- [x] Ajouter section "SALARIÉ" (nom, adresse, SS, matricule)
- [x] Ajouter informations période (période, date paiement, heures)
- [x] Créer tableau des cotisations avec colonnes :
  - [x] Libellé (cotisation)
  - [x] Base
  - [x] Taux
  - [x] Part salariale
  - [x] Part patronale
- [x] Ajouter sections CSG, CRDS, Assurance maladie, Retraite, Chômage
- [x] Totaux (brut, cotisations, net à payer)

### 4.2 Styles CSS
- [x] Styles inline pour portabilité PDF
- [x] Bordures bleues (#2563eb) pour sections importantes
- [x] Backgrounds gris (#f3f4f6) pour informations période
- [x] Tableau avec lignes alternées pour lisibilité
- [x] Net à payer en vert (#059669) pour visibilité
- [x] Section signatures (employeur + salarié)
- [x] Footer avec mentions légales

**Note**: Template compilé et mis en cache automatiquement dans pdfService.js

**✅ Phase 4 terminée le : 30 octobre 2025**

---

## 🔧 Phase 5 : Service PDF principal (1h)

### 5.1 Créer service orchestrateur
- [x] Créer fichier `backend/services/pdf/pdfService.js`
- [x] Implémenter `getCompiledTemplate(templateName)` avec cache Map
- [x] Implémenter `generatePDF(type, data, userId, userModel, version)` :
  - [x] Vérifier cache LRU
  - [x] Compiler template Handlebars
  - [x] Générer PDF avec Puppeteer (browserPool)
  - [x] Chiffrer avec AES-256-CBC
  - [x] Stocker dans GridFS (encrypted)
  - [x] Créer métadonnées MongoDB
  - [x] Mettre en cache
- [x] Implémenter `retrievePDF(pdfId, requesterId, requesterModel)` :
  - [x] Vérifier permissions (Professor = own only, Admin = all)
  - [x] Récupérer depuis GridFS
  - [x] Déchiffrer
  - [x] Logger accès
- [x] Implémenter `listPDFs(userId, type)` avec filtres
- [x] Implémenter `removePDF(pdfId)` (soft delete)
- [x] Implémenter `hardDeletePDF(pdfId)` (admin only)
- [x] Implémenter `invalidateTemplateCache(templateName)`
- [x] Ajouter helper `extractMetadata(type, data)` pour métadonnées

**✅ Phase 5 terminée le : 30 octobre 2025**

---

## 🛣️ Phase 6 : Routes API (45 min)

### 6.1 Créer routes génériques
- [x] Créer fichier `backend/routes/pdfRoutes.js`
- [x] Importer middleware `protect` et `authorize`
- [x] Implémenter `POST /api/pdfs/generate` :
  - [x] Validation type (fiche_paie, NDR, convention, facture)
  - [x] Vérification permissions (Professor = own, Admin = all)
  - [x] Appel `pdfService.generatePDF()`
  - [x] Retour JSON avec pdfId + gridFsFileId
- [x] Implémenter `GET /api/pdfs/:pdfId` :
  - [x] Vérification permissions
  - [x] Headers PDF (Content-Type, Content-Disposition)
  - [x] Envoi du buffer déchiffré
- [x] Implémenter `GET /api/pdfs/list/:userId?` :
  - [x] Query param `?type=` pour filtrer
  - [x] Liste des PDFs avec métadonnées
- [x] Implémenter `DELETE /api/pdfs/:pdfId` (soft delete)
- [x] Implémenter `DELETE /api/pdfs/:pdfId/hard` (admin only)
- [x] Implémenter `POST /api/pdfs/template/invalidate` (admin only)

### 6.2 Enregistrer routes dans server.js
- [x] Modifier `backend/server.js`
- [x] Importer `const pdfRoutes = require('./routes/pdfRoutes');`
- [x] Ajouter `app.use('/api/pdfs', pdfRoutes);`
- [x] Initialiser GridFS avec `initGridFS()` après connexion MongoDB

**✅ Phase 6 terminée le : 30 octobre 2025**

---

## 💻 Phase 7 : Service frontend (30 min)

### 7.1 Créer service PDF TypeScript
- [x] Créer fichier `frontend/src/services/pdfService.ts`
- [x] Définir types :
  - [x] `PDFType = 'fiche_paie' | 'NDR' | 'convention' | 'facture'`
  - [x] `PDFMetadata` (métadonnées complètes)
  - [x] `GeneratePDFRequest` (paramètres de génération)
  - [x] `GeneratePDFResponse`, `ListPDFsResponse`
- [x] Implémenter `generatePDF(request)` générique
- [x] Implémenter `downloadPDF(pdfId, filename)` avec téléchargement auto
- [x] Implémenter `getPDFBlob(pdfId)` pour viewer PDF inline
- [x] Implémenter `listPDFs(userId?, type?)` avec filtres
- [x] Implémenter `deletePDF(pdfId)` (soft delete)
- [x] Implémenter `hardDeletePDF(pdfId)` (admin only)
- [x] Implémenter `invalidateTemplateCache(templateName)` (admin only)
- [x] Helpers spécifiques :
  - [x] `generatePayslip(professorId, payrollData)` pour fiches de paie
  - [x] `getPayslips(professorId)` pour lister fiches de paie
- [x] Gérer erreurs avec try/catch et messages explicites
- [x] Exporter singleton

**✅ Phase 7 terminée le : 30 octobre 2025**

---

## 🔄 Phase 8 : Migration ancien système NDR (2h)

### 8.1 Créer template NDR
- [x] Créer `backend/services/pdf/templates/ndr.hbs`
- [x] Sections : en-tête ABC Cours, informations client, bénéficiaires
- [x] Tableau des prestations (matières, tarifs, quantités)
- [x] Section coupons avec grille 4 colonnes
- [x] Modalités de paiement et échéances
- [x] Notes et signatures

### 8.2 Adapter pdfService pour NDR
- [x] Modifier `extractMetadata()` pour type 'NDR'
- [x] Ajouter métadonnées : ndrId, familyId, totalAmount, couponCount

### 8.3 Modifier modèle NDR
- [x] Ajouter champ `pdfId` dans `backend/models/NDR.js`
- [x] Référence vers collection `PDF`

### 8.4 Intégrer génération PDF dans NdrService
- [x] Importer `pdfService` dans `ndrService.js`
- [x] Générer automatiquement PDF lors de création NDR
- [x] Préparer données template (company, client, subjects, coupons)
- [x] Appeler `pdfService.generatePDF('NDR', ...)`
- [x] Mettre à jour NDR avec `pdfId`
- [x] Ajouter helper `getPaymentMethodLabel()`

### 8.5 Supprimer ancien système
- [x] Supprimer `backend/services/pdfGenerationService.js` (669 lignes)
- [x] Supprimer `backend/routes/pdf.js` (515 lignes)
- [x] Supprimer `backend/templates/ndr-template.html`
- [x] Supprimer dossier `backend/uploads/pdfs/`

### 8.6 Commit et push
- [x] Commit avec message détaillé
- [x] Push sur develop

**✅ Phase 8 terminée le : 30 octobre 2025**

**Résultat** : -852 lignes de code, système unifié et sécurisé

---

## ✅ Phase 9 : Tests & Validation (1h)

### 9.1 Tests manuels

#### Test 1 : Génération fiche de paie
- [ ] Préparer données JSON de test (basées sur capture fournie)
- [ ] Appeler `POST /api/pdf/fiche_paie/:professorId/generate`
- [ ] Vérifier réponse JSON avec `pdfId`
- [ ] Vérifier que PDF est créé dans GridFS

#### Test 2 : Téléchargement PDF
- [ ] Appeler `GET /api/pdf/:pdfId/download`
- [ ] Vérifier que le PDF se télécharge
- [ ] Ouvrir le PDF et vérifier le rendu visuel
- [ ] Comparer avec la capture fournie

#### Test 3 : Chiffrement
- [ ] Vérifier dans MongoDB Compass que les fichiers GridFS sont chiffrés
- [ ] Essayer de lire le contenu brut (doit être illisible)
- [ ] Vérifier que le déchiffrement fonctionne

#### Test 4 : Cache
- [ ] Générer le même PDF 2 fois
- [ ] Vérifier que la 2e génération est instantanée (cache hit)
- [ ] Vérifier les logs du cache

#### Test 5 : Permissions
- [ ] Tester téléchargement avec mauvais userId (doit échouer 403)
- [ ] Tester génération sans token (doit échouer 401)
- [ ] Tester téléchargement en tant qu'admin (doit fonctionner)

#### Test 6 : Génération NDR (nouveau système migré)
- [ ] Créer une nouvelle NDR via `POST /api/ndrs`
- [ ] Vérifier que le PDF est généré automatiquement
- [ ] Vérifier que `pdfId` est présent dans la réponse NDR
- [ ] Télécharger le PDF via `GET /api/pdfs/:pdfId`
- [ ] Vérifier le rendu : logo ABC Cours, sections complètes, coupons en grille
- [ ] Vérifier dans MongoDB que le PDF est chiffré dans GridFS

### 9.2 Tests unitaires (optionnel)
- [ ] Créer `backend/tests/unit/pdf.encryption.test.js`
- [ ] Créer `backend/tests/unit/pdf.cache.test.js`
- [ ] Créer `backend/tests/integration/pdf.service.test.js`
- [ ] Lancer les tests : `npm test`

### 9.3 Tests de performance
- [ ] Mesurer temps de génération 1er PDF (attendu : 3-4 sec)
- [ ] Mesurer temps de génération PDFs suivants (attendu : <1 sec)
- [ ] Vérifier RAM stable autour de 300 MB

**✅ Phase 9 terminée le : ___________**

---

## 📊 Métriques de succès

### Performance
- [ ] Premier PDF généré en moins de 4 secondes
- [ ] PDFs suivants générés en moins de 1 seconde (cache)
- [ ] RAM serveur stable à ~300 MB
- [ ] CPU < 60% pendant génération

### Sécurité
- [ ] PDFs chiffrés en base (vérifier manuellement)
- [ ] Clé de chiffrement dans `.env` (jamais commitée)
- [ ] Permissions vérifiées (403 si non autorisé)
- [ ] Audit logs fonctionnels

### Qualité
- [ ] PDF rendu identique à la capture fournie
- [ ] Tableaux alignés correctement
- [ ] Polices lisibles
- [ ] Pas d'erreurs dans les logs

---

## 🐛 Problèmes rencontrés

### Problème 1
**Date** : __________
**Description** :

**Solution** :

---

### Problème 2
**Date** : __________
**Description** :

**Solution** :

---

## 📝 Notes importantes

### Clés de chiffrement générées
```
# DEV
PDF_ENCRYPTION_KEY=3b1737fdce35f65225855c07ce8b961e893036b222784177245ed1a7d459a954

# PROD
PDF_ENCRYPTION_KEY=23b3bc57845c92275bdd835e2fb8f0dc77152ee987805df34ce8fa3eee7bab9f
```
⚠️ **BACKUP** : Sauvegarder ces clés en lieu sûr (sans elles, les PDFs sont irrécupérables)
⚠️ **SÉCURITÉ** : Clés différentes DEV/PROD pour isolation de sécurité (compromission DEV ≠ compromission PROD)

### Commandes utiles

```bash
# Générer clé de chiffrement
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Installer dépendances
cd backend && npm install handlebars

# Lancer serveur backend
cd backend && npm run dev

# Lancer tests
cd backend && npm test

# Vérifier structure GridFS
mongo
> use abc-cours
> db.fs.files.find().pretty()
```

### URLs importantes

- **Backend** : http://localhost:3000
- **Frontend** : http://localhost:5173
- **API PDF** : http://localhost:3000/api/pdf

---

## 🎯 Prochaines étapes (après Phase 9)

- [ ] Implémenter template Convention (professeurs)
- [ ] Implémenter template Facture (clients)
- [ ] Migrer ancien système NDR vers nouveau système
- [ ] Ajouter queue BullMQ si volume dépasse 100 PDFs/h
- [ ] Ajouter monitoring RAM/CPU en production
- [ ] Créer dashboard admin pour voir PDFs générés

---

**Dernière mise à jour** : 30 octobre 2025
**Temps estimé total** : 6-8 heures
**Temps réel passé** : __________ heures
