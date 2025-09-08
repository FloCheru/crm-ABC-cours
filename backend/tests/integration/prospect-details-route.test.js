/**
 * Test de l'API route pour récupérer les détails d'un prospect
 * Vérifie que GET /api/families/:id fonctionne correctement
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Family = require('../../models/Family');
const { getTestAuthToken } = require('../fixtures/auth.fixture');

let mongoServer;
let authToken;

beforeAll(async () => {
  // Configuration MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Obtenir un token d'authentification valide
  authToken = await getTestAuthToken();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Nettoyer les collections avant chaque test
  await Family.deleteMany({});
});

describe('GET /api/families/:id - Détails Prospect', () => {
  
  test('devrait retourner les détails d\'un prospect existant', async () => {
    // Créer un prospect de test
    const prospectData = {
      primaryContact: {
        firstName: 'Jean',
        lastName: 'Dupont',
        primaryPhone: '0123456789',
        email: 'jean.dupont@email.com'
      },
      address: {
        street: '123 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      },
      status: 'prospect',
      prospectStatus: 'interested',
      demande: {
        beneficiaryType: 'student',
        subjects: ['mathematics', 'physics']
      },
      students: [{
        firstName: 'Marie',
        lastName: 'Dupont',
        age: 16,
        school: { name: 'Lycée Henri IV', grade: 'Terminale S' }
      }],
      plannedTeacher: 'Prof. Martin',
      nextActionReminderSubject: 'Rappel de suivi',
      nextActionDate: new Date('2025-09-01')
    };

    const prospect = await Family.create(prospectData);

    // Test de la route API
    const response = await request(app)
      .get(`/api/families/${prospect._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Vérifications de base
    expect(response.body).toHaveProperty('family');
    expect(response.body.family).toHaveProperty('_id');
    expect(response.body.family._id).toBe(prospect._id.toString());

    // Vérifications des données
    expect(response.body.family.primaryContact.firstName).toBe('Jean');
    expect(response.body.family.primaryContact.lastName).toBe('Dupont');
    expect(response.body.family.primaryContact.primaryPhone).toBe('0123456789');
    expect(response.body.family.address.city).toBe('Paris');
    expect(response.body.family.address.postalCode).toBe('75001');
    expect(response.body.family.status).toBe('prospect');
    expect(response.body.family.prospectStatus).toBe('interested');

    // Vérifications des matières
    expect(response.body.family.demande.subjects).toEqual(['mathematics', 'physics']);

    // Vérifications des élèves
    expect(response.body.family.students).toHaveLength(1);
    expect(response.body.family.students[0].firstName).toBe('Marie');
    expect(response.body.family.students[0].age).toBe(16);

    console.log('✅ API GET /api/families/:id retourne les détails complets');
  });

  test('devrait retourner 404 pour un prospect inexistant', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/families/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Famille non trouvée');

    console.log('✅ API retourne 404 pour prospect inexistant');
  });

  test('devrait retourner 400 pour un ID invalide', async () => {
    const response = await request(app)
      .get('/api/families/invalid-id')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('error');

    console.log('✅ API retourne 400 pour ID invalide');
  });

  test('devrait requérir une authentification', async () => {
    const prospectData = {
      primaryContact: { firstName: 'Test', lastName: 'User' },
      address: { street: 'Test', city: 'Test', postalCode: '12345', country: 'Test' },
      status: 'prospect'
    };

    const prospect = await Family.create(prospectData);

    // Test sans token d'authentification
    const response = await request(app)
      .get(`/api/families/${prospect._id}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');

    console.log('✅ API requiert authentification pour accès détails');
  });

  test('devrait inclure les champs de suivi (rappel, date)', async () => {
    const prospectData = {
      primaryContact: { firstName: 'Test', lastName: 'User' },
      address: { street: 'Test', city: 'Test', postalCode: '12345', country: 'Test' },
      status: 'prospect',
      nextActionReminderSubject: 'Rappel important',
      nextActionDate: new Date('2025-10-15')
    };

    const prospect = await Family.create(prospectData);

    const response = await request(app)
      .get(`/api/families/${prospect._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.family.nextActionReminderSubject).toBe('Rappel important');
    expect(response.body.family.nextActionDate).toBeDefined();

    console.log('✅ API inclut les champs de suivi (rappel, date)');
  });

});

console.log('🧪 Tests API détails prospect - 5 cas de test pour route GET /api/families/:id');