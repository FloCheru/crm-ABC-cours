const request = require('supertest');
const mongoose = require('mongoose');

// Import du serveur backend et des utilitaires
const Family = require('../backend/models/Family');
const User = require('../backend/models/User');
const testDataFactory = require('../backend/tests/utils/testDataFactory');
const TestSetup = require('../backend/tests/utils/testSetup');

// Import de l'app Express (sans la démarrer sur un port)
let app;

// Setup simple pour charger l'app
function createApp() {
  const express = require('express');
  const cors = require('cors');

  const testApp = express();

  // Middlewares essentiels
  testApp.use(cors());
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: true }));

  // Routes
  const familyRoutes = require('../backend/routes/families');
  testApp.use('/api/families', familyRoutes);

  return testApp;
}

// TESTS E2E
describe('E2E Integration: FamilyService Complete Workflow', () => {
  let testUser;

  beforeAll(async () => {
    // Setup BDD de test
    await TestSetup.beforeAll();

    // Créer l'app Express pour supertest
    app = createApp();

    console.log('🧪 E2E Test Setup: App + MongoDB ready');
  }, 30000);

  afterAll(async () => {
    await TestSetup.afterAll();
  }, 30000);

  beforeEach(async () => {
    // Nettoyage et création d'un utilisateur de test
    await TestSetup.beforeEach();

    const userData = testDataFactory.createTestAdmin();
    testUser = await User.create(userData);
  });

  describe('🔄 Complete Workflow: HTTP → Backend → MongoDB → Response', () => {
    it('should handle getFamilies() end-to-end workflow with supertest', async () => {
      // === ÉTAPE 1: Préparer les données en BDD ===
      const family1Data = testDataFactory.createTestFamilyComplete(testUser._id);
      const family2Data = testDataFactory.createTestFamilyBase(testUser._id, {
        primaryContact: {
          firstName: 'Sophie',
          lastName: 'Martin',
          email: 'sophie.martin@test.com',
          primaryPhone: '0987654321',
          gender: 'Mme'
        }
      });

      const dbFamily1 = await Family.create(family1Data);
      const dbFamily2 = await Family.create(family2Data);

      console.log(`📝 Created test families: ${dbFamily1._id}, ${dbFamily2._id}`);

      // === ÉTAPE 2: Appel HTTP via supertest (simule un appel frontend) ===
      const response = await request(app)
        .get('/api/families')
        .expect(200)
        .expect('Content-Type', /json/);

      const result = response.body;

      // === ÉTAPE 3: Validation du workflow complet ===
      console.log('📊 E2E Result:', { count: result.length, first: result[0]?.primaryContact.firstName });

      // Vérifications structurelles
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      // Vérification des données complètes (toute la chaîne)
      const retrievedFamily1 = result.find(f => f._id.toString() === dbFamily1._id.toString());
      const retrievedFamily2 = result.find(f => f._id.toString() === dbFamily2._id.toString());

      expect(retrievedFamily1).toBeDefined();
      expect(retrievedFamily2).toBeDefined();

      // Validation données famille 1 (complète)
      expect(retrievedFamily1.primaryContact.firstName).toBe('Marie');
      expect(retrievedFamily1.primaryContact.lastName).toBe('Dupont');
      expect(retrievedFamily1.primaryContact.email).toBe('marie@test.com');
      expect(retrievedFamily1.address.city).toBe('Paris');
      expect(retrievedFamily1.students).toHaveLength(1);
      expect(retrievedFamily1.students[0].firstName).toBe('Paul');

      // Validation données famille 2 (base)
      expect(retrievedFamily2.primaryContact.firstName).toBe('Sophie');
      expect(retrievedFamily2.primaryContact.lastName).toBe('Martin');
      expect(retrievedFamily2.students).toEqual([]);

      // Validation structure attendue selon le contrat API
      result.forEach(family => {
        expect(family).toHaveProperty('_id');
        expect(family).toHaveProperty('primaryContact');
        expect(family).toHaveProperty('address');
        expect(family).toHaveProperty('students');
        expect(family).toHaveProperty('createdAt');
        expect(family).toHaveProperty('updatedAt');
      });
    }, 15000);

    it('should handle createFamily() end-to-end workflow with supertest', async () => {
      // === ÉTAPE 1: Données à créer ===
      const newFamilyData = {
        primaryContact: {
          firstName: 'Jean',
          lastName: 'Nouveaux',
          primaryPhone: '0123456789',
          email: 'jean.nouveaux@test.com',
          gender: 'M.'
        },
        address: {
          street: '456 Rue Neuve',
          city: 'Lyon',
          postalCode: '69001'
        },
        demande: {
          beneficiaryType: 'eleves',
          level: '4ème',
          subjects: [{ id: new mongoose.Types.ObjectId() }]
        },
        billingAddress: {
          street: '456 Rue Neuve',
          city: 'Lyon',
          postalCode: '69001'
        },
        status: 'prospect',
        prospectStatus: 'nouveau',
        createdBy: testUser._id
      };

      // === ÉTAPE 2: Appel POST via supertest ===
      const response = await request(app)
        .post('/api/families')
        .send(newFamilyData)
        .expect(201)
        .expect('Content-Type', /json/);

      const result = response.body.family;

      // === ÉTAPE 3: Validation création ===
      expect(result._id).toBeDefined();
      expect(result.primaryContact.firstName).toBe('Jean');
      expect(result.primaryContact.lastName).toBe('Nouveaux');

      // === ÉTAPE 4: Vérification en BDD (round trip complet) ===
      const dbFamily = await Family.findById(result._id);
      expect(dbFamily).toBeDefined();
      expect(dbFamily.primaryContact.firstName).toBe('Jean');
    }, 10000);

    it('should handle deleteFamily() end-to-end workflow with supertest', async () => {
      // === ÉTAPE 1: Créer famille en BDD ===
      const familyData = testDataFactory.createTestFamilyBase(testUser._id);
      const dbFamily = await Family.create(familyData);

      // Vérifier existence
      let familyExists = await Family.findById(dbFamily._id);
      expect(familyExists).toBeDefined();

      // === ÉTAPE 2: Appel DELETE via supertest ===
      await request(app)
        .delete(`/api/families/${dbFamily._id}`)
        .expect(200);

      // === ÉTAPE 3: Vérification suppression en BDD ===
      const deletedFamily = await Family.findById(dbFamily._id);
      expect(deletedFamily).toBeNull();
    }, 10000);
  });

  describe('🔍 Error Handling E2E', () => {
    it('should handle 404 errors correctly with supertest', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/families/${fakeId}`)
        .expect(404);
    });
  });
});