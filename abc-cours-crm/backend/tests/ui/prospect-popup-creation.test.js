/**
 * Tests spécifiques pour la création de prospect depuis la popup
 * À exécuter après modifications de la fonctionnalité popup
 * Commande : npm test prospect-popup-creation.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app.test');
const Family = require('../models/Family');
const User = require('../models/User');
const Subject = require('../models/Subject');

describe('🖥️ TESTS POPUP CRÉATION PROSPECT', () => {
  let mongoServer;
  let adminToken;
  let testUserId;

  // ========== SETUP/TEARDOWN ==========
  beforeAll(async () => {
    // Configuration JWT pour les tests
    process.env.JWT_SECRET = 'test_secret_key_for_testing';
    
    // Démarrer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connecter Mongoose à la base temporaire
    await mongoose.connect(mongoUri);
    
    console.log('📊 Base de données temporaire initialisée pour tests popup');
    
    // Créer utilisateur admin test
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const adminUser = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test.admin@popup.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    testUserId = adminUser._id;
    
    // Générer token admin
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { userId: testUserId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🔑 Utilisateur admin test créé pour popup');
    
    // Créer quelques matières de test
    const subjects = [
      { name: 'Mathématiques', isActive: true },
      { name: 'Français', isActive: true },
      { name: 'Anglais', isActive: true },
      { name: 'Physique', isActive: true },
    ];
    
    await Subject.create(subjects);
    console.log('📚 Matières fixtures créées pour popup');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log('🗑️ Base de données temporaire nettoyée');
  });

  beforeEach(async () => {
    // Nettoyer les familles avant chaque test
    await Family.deleteMany({});
  });

  // ========== TESTS CRÉATION POPUP ==========
  describe('Création prospect depuis popup', () => {
    
    test('✅ Création prospect complet - Bénéficiaire adulte', async () => {
      const prospectData = {
        address: { 
          street: '123 Rue Popup Test', 
          city: 'Lyon', 
          postalCode: '69000' 
        },
        primaryContact: { 
          firstName: 'Marie', 
          lastName: 'TestPopup',
          primaryPhone: '0472123456',
          email: 'marie.popup@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais', 'Français'],
          notes: 'Test création depuis popup'
        },
        plannedTeacher: 'Prof. Langues',
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      // Vérifications spécifiques popup
      expect(response.body.family).toBeDefined();
      expect(response.body.family.status).toBe('prospect');
      expect(response.body.family.primaryContact.firstName).toBe('Marie');
      expect(response.body.family.primaryContact.lastName).toBe('TestPopup');
      expect(response.body.family.demande.beneficiaryType).toBe('adulte');
      expect(response.body.family.demande.subjects).toEqual(['Anglais', 'Français']);
      expect(response.body.family.demande.notes).toBe('Test création depuis popup');
      expect(response.body.family.plannedTeacher).toBe('Prof. Langues');
      
      // Vérifier que le nom est généré correctement
      expect(response.body.family.name).toBe('Marie TestPopup');
    });

    test('✅ Création prospect - Bénéficiaire élèves', async () => {
      const prospectData = {
        address: { 
          street: '456 Avenue Popup', 
          city: 'Marseille', 
          postalCode: '13000' 
        },
        primaryContact: { 
          firstName: 'Pierre', 
          lastName: 'ParentTest',
          primaryPhone: '0491234567',
          email: 'pierre.parent@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Mathématiques', 'Physique'],
          notes: 'Enfants niveau collège'
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      expect(response.body.family.demande.beneficiaryType).toBe('eleves');
      expect(response.body.family.demande.subjects).toEqual(['Mathématiques', 'Physique']);
      expect(response.body.family.demande.notes).toBe('Enfants niveau collège');
    });

    test('✅ Vérification présence dans liste prospects après création', async () => {
      // Créer un prospect
      const prospectData = {
        address: { street: '789 Rue Vérification', city: 'Nice', postalCode: '06000' },
        primaryContact: { 
          firstName: 'Sophie', 
          lastName: 'Vérification',
          primaryPhone: '0493567890',
          email: 'sophie.verif@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais']
        },
        createdBy: testUserId,
      };

      const createResponse = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      const createdProspectId = createResponse.body.family._id;

      // Vérifier que le prospect apparaît dans la liste des prospects
      const listResponse = await request(app)
        .get('/api/families?status=prospect')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .expect(200);

      const foundProspect = listResponse.body.families.find(
        f => f._id === createdProspectId
      );

      expect(foundProspect).toBeDefined();
      expect(foundProspect.primaryContact.firstName).toBe('Sophie');
      expect(foundProspect.status).toBe('prospect');
    });

  });

  // ========== TESTS VALIDATION ==========
  describe('Validation des champs obligatoires', () => {

    test('❌ Erreur sans primaryContact', async () => {
      const invalidData = {
        address: { street: '1 Rue Test', city: 'Test', postalCode: '12345' },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Test']
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    test('❌ Erreur sans address', async () => {
      const invalidData = {
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User',
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Test']
        },
        createdBy: testUserId,
      };

      await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidData)
        .expect(400);
    });

    test('❌ Erreur sans beneficiaryType', async () => {
      const invalidData = {
        address: { street: '1 Rue Test', city: 'Test', postalCode: '12345' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User',
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        demande: {
          // beneficiaryType manquant !
          subjects: ['Test']
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toMatch(/beneficiaryType|Type de bénéficiaire requis/);
    });

    test('❌ Erreur email invalide', async () => {
      const invalidData = {
        address: { street: '1 Rue Test', city: 'Test', postalCode: '12345' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User',
          primaryPhone: '0123456789',
          email: 'email-invalide', // Format incorrect
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Test']
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toMatch(/email|Données invalides/);
    });

    test('❌ Erreur sans demande', async () => {
      const invalidData = {
        address: { street: '1 Rue Test', city: 'Test', postalCode: '12345' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User',
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        // demande manquante !
        createdBy: testUserId,
      };

      await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidData)
        .expect(400);
    });

  });

  // ========== TESTS INTÉGRATION ==========
  describe('Tests d\'intégration cache et workflow', () => {

    test('✅ Cache invalidation après création', async () => {
      // Compter les prospects avant
      const beforeResponse = await request(app)
        .get('/api/families?status=prospect&limit=1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .expect(200);

      const countBefore = beforeResponse.body.families.length;

      // Créer un nouveau prospect
      const newProspectData = {
        address: { street: '321 Rue Cache', city: 'Toulouse', postalCode: '31000' },
        primaryContact: { 
          firstName: 'Cache', 
          lastName: 'TestIntégration',
          primaryPhone: '0561987654',
          email: 'cache@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Histoire']
        },
        createdBy: testUserId,
      };

      await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(newProspectData)
        .expect(201);

      // Vérifier que le cache est invalidé (nouveau prospect dans la liste)
      const afterResponse = await request(app)
        .get('/api/families?status=prospect&limit=1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .expect(200);

      const countAfter = afterResponse.body.families.length;
      expect(countAfter).toBe(countBefore + 1);
    });

    test('✅ Validation workflow: prospect créé ne devient pas client automatiquement', async () => {
      const prospectData = {
        address: { street: '999 Rue Workflow', city: 'Bordeaux', postalCode: '33000' },
        primaryContact: { 
          firstName: 'Workflow', 
          lastName: 'Test',
          primaryPhone: '0556123456',
          email: 'workflow@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Mathématiques']
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      // Vérifier que le prospect reste prospect (ne devient pas client)
      expect(response.body.family.status).toBe('prospect');
      
      // Vérifier qu'il n'apparaît pas dans les clients
      const clientsResponse = await request(app)
        .get('/api/families?status=client')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .expect(200);

      const isInClients = clientsResponse.body.families.some(
        f => f._id === response.body.family._id
      );
      expect(isInClients).toBe(false);
    });

  });

  // ========== TESTS PERFORMANCE ==========
  describe('Tests de performance popup', () => {

    test('✅ Création rapide prospect (< 2 secondes)', async () => {
      const startTime = Date.now();

      const prospectData = {
        address: { street: '555 Rue Performance', city: 'Nantes', postalCode: '44000' },
        primaryContact: { 
          firstName: 'Performance', 
          lastName: 'Test',
          primaryPhone: '0240123456',
          email: 'performance@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais']
        },
        createdBy: testUserId,
      };

      await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      const duration = Date.now() - startTime;
      console.log(`⚡ Création prospect en ${duration}ms`);
      
      expect(duration).toBeLessThan(2000); // Moins de 2 secondes
    });

  });

});

// ========== RÉSUMÉ FINAL ==========
afterAll(() => {
  console.log(`
  📊 RÉSUMÉ TESTS POPUP CRÉATION PROSPECT
  =====================================
  ✅ Tests création popup complets
  ✅ Tests validation champs obligatoires
  ✅ Tests intégration cache et workflow
  ✅ Tests performance création
  
  🖥️ POPUP TESTÉE:
  - Création prospect bénéficiaire adulte
  - Création prospect bénéficiaire élèves
  - Validation tous champs obligatoires
  - Gestion erreurs email et données
  - Vérification présence dans liste
  - Cache invalidation automatique
  - Workflow prospect → (NDR) → client respecté
  
  🔄 PRÊT POUR VALIDATION UI FINALE
  `);
});