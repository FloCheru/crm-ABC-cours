// Test spécifique pour vérifier le populate des données famille dans les séries de coupons
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const CouponSeries = require('../../models/CouponSeries');
const Family = require('../../models/Family');
const Student = require('../../models/Student');
const User = require('../../models/User');
const Subject = require('../../models/Subject');

let mongoServer;
let adminToken;

describe('Coupon Series Family Populate', () => {
  beforeAll(async () => {
    // Fermer toute connexion existante
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Démarrer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Se connecter à la base de données de test
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Nettoyer la base de données
    await Promise.all([
      CouponSeries.deleteMany({}),
      Family.deleteMany({}),
      Student.deleteMany({}),
      User.deleteMany({}),
      Subject.deleteMany({})
    ]);

    // Créer un utilisateur admin
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    // Obtenir le token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    adminToken = loginRes.body.token;

    // Créer une famille de test avec primaryContact
    const family = await Family.create({
      primaryContact: {
        gender: 'M.',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@test.com',
        primaryPhone: '0123456789'
      },
      address: {
        street: '123 Rue Test',
        city: 'Paris',
        postalCode: '75001'
      },
      demande: {
        beneficiaryType: 'eleves'
      },
      status: 'client',
      createdBy: adminUser._id,
      students: []
    });

    // Créer un étudiant
    const student = await Student.create({
      firstName: 'Pierre',
      lastName: 'Dupont',
      family: family._id,
      dateOfBirth: new Date('2005-01-15'),
      school: {
        name: 'Lycée Test',
        level: 'lycee',
        grade: 'Terminale'
      }
    });

    // Ajouter l'étudiant à la famille
    family.students.push(student._id);
    await family.save();

    // Créer une matière
    const subject = await Subject.create({
      name: 'Mathématiques',
      category: 'Scientifique'
    });

    // Créer une série de coupons
    await CouponSeries.create({
      settlementNoteId: new mongoose.Types.ObjectId(),
      familyId: family._id,
      studentId: student._id,
      subject: subject._id,
      totalCoupons: 10,
      usedCoupons: 0,
      status: 'active',
      hourlyRate: 50,
      professorSalary: 40,
      createdBy: adminUser._id
    });
  });

  it('should populate family data with primaryContact correctly', async () => {
    // Faire une requête GET pour récupérer les séries
    const response = await request(app)
      .get('/api/coupon-series')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log('Response body:', JSON.stringify(response.body, null, 2));

    // Vérifier la structure de la réponse
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    const series = response.body.data[0];
    
    // Vérifier que familyId est bien populée
    expect(series.familyId).toBeDefined();
    expect(typeof series.familyId).toBe('object');
    
    // Vérifier que primaryContact existe et contient les bonnes données
    expect(series.familyId.primaryContact).toBeDefined();
    expect(series.familyId.primaryContact.firstName).toBe('Jean');
    expect(series.familyId.primaryContact.lastName).toBe('Dupont');
    expect(series.familyId.primaryContact.email).toBe('jean.dupont@test.com');

    // Vérifier que studentId est bien populée
    expect(series.studentId).toBeDefined();
    expect(typeof series.studentId).toBe('object');
    expect(series.studentId.firstName).toBe('Pierre');
    expect(series.studentId.lastName).toBe('Dupont');
  });

  it('should display correct family name in series list', async () => {
    const response = await request(app)
      .get('/api/coupon-series')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const series = response.body.data[0];
    
    // Simuler la construction du nom comme dans le frontend
    const familyName = series.familyId && series.familyId.primaryContact
      ? `${series.familyId.primaryContact.firstName} ${series.familyId.primaryContact.lastName}`
      : 'Famille inconnue';
    
    // Vérifier que le nom peut être construit correctement
    expect(familyName).toBe('Jean Dupont');
    expect(familyName).not.toBe('Famille inconnue');
  });
});