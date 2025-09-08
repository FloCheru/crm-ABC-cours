// Test spécifique pour vérifier la suppression en cascade des prospects
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Family = require('../../models/Family');
const Student = require('../../models/Student');
const CouponSeries = require('../../models/CouponSeries');
const Coupon = require('../../models/Coupon');
const SettlementNote = require('../../models/SettlementNote');
const User = require('../../models/User');
const Subject = require('../../models/Subject');

let mongoServer;
let adminToken;
let testFamily;
let testStudent;
let testCouponSeries;
let testCoupon;
let testSettlementNote;

describe('Prospect Deletion with Cascade', () => {
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
      Family.deleteMany({}),
      Student.deleteMany({}),
      CouponSeries.deleteMany({}),
      Coupon.deleteMany({}),
      SettlementNote.deleteMany({}),
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

    // Créer une famille prospect avec tous les éléments liés
    testFamily = await Family.create({
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
      status: 'prospect',
      prospectStatus: 'en_reflexion',
      createdBy: adminUser._id,
      students: []
    });

    // Créer un étudiant lié
    testStudent = await Student.create({
      firstName: 'Pierre',
      lastName: 'Dupont',
      family: testFamily._id,
      dateOfBirth: new Date('2005-01-15'),
      school: {
        name: 'Lycée Test',
        level: 'lycee',
        grade: 'Terminale'
      }
    });

    // Ajouter l'étudiant à la famille
    testFamily.students.push(testStudent._id);
    await testFamily.save();

    // Créer une matière
    const subject = await Subject.create({
      name: 'Mathématiques',
      category: 'Scientifique'
    });

    // Créer une série de coupons liée
    testCouponSeries = await CouponSeries.create({
      settlementNoteId: new mongoose.Types.ObjectId(),
      familyId: testFamily._id,
      studentId: testStudent._id,
      subject: subject._id,
      totalCoupons: 5,
      usedCoupons: 0,
      status: 'active',
      hourlyRate: 50,
      professorSalary: 40,
      createdBy: adminUser._id
    });

    // Créer des coupons individuels liés
    testCoupon = await Coupon.create({
      couponSeriesId: testCouponSeries._id,
      familyId: testFamily._id,
      code: 'TEST-001',
      status: 'available'
    });

    // Créer une note de règlement liée
    testSettlementNote = await SettlementNote.create({
      familyId: testFamily._id,
      studentIds: [testStudent._id],
      clientName: 'Jean Dupont',
      department: 'Paris',
      paymentMethod: 'transfer',
      subjects: [{
        subjectId: subject._id,
        hourlyRate: 50,
        quantity: 10,
        professorSalary: 40
      }],
      charges: 5.50,
      notes: 'Test NDR',
      createdBy: adminUser._id
    });

    // Ajouter la NDR à la famille
    testFamily.settlementNotes.push(testSettlementNote._id);
    await testFamily.save();
  });

  it('should delete prospect with complete cascade deletion', async () => {
    // Vérifier que tous les éléments existent avant suppression
    const familyExists = await Family.findById(testFamily._id);
    const studentExists = await Student.findById(testStudent._id);
    const seriesExists = await CouponSeries.findById(testCouponSeries._id);
    const couponExists = await Coupon.findById(testCoupon._id);
    const ndrExists = await SettlementNote.findById(testSettlementNote._id);

    expect(familyExists).toBeTruthy();
    expect(studentExists).toBeTruthy();
    expect(seriesExists).toBeTruthy();
    expect(couponExists).toBeTruthy();
    expect(ndrExists).toBeTruthy();

    console.log('✅ Tous les éléments liés existent avant suppression');

    // Effectuer la suppression
    const response = await request(app)
      .delete(`/api/families/${testFamily._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log('📝 Réponse de suppression:', JSON.stringify(response.body, null, 2));

    // Vérifier la réponse
    expect(response.body.message).toContain('supprimés avec succès');
    expect(response.body.deletedItems).toBeDefined();
    expect(response.body.deletedItems.students).toBe(1);
    expect(response.body.deletedItems.couponSeries).toBe(1);
    expect(response.body.deletedItems.coupons).toBe(1);
    expect(response.body.deletedItems.settlementNotes).toBe(1);

    // Vérifier que tous les éléments ont été supprimés de la base de données
    const familyAfter = await Family.findById(testFamily._id);
    const studentAfter = await Student.findById(testStudent._id);
    const seriesAfter = await CouponSeries.findById(testCouponSeries._id);
    const couponAfter = await Coupon.findById(testCoupon._id);
    const ndrAfter = await SettlementNote.findById(testSettlementNote._id);

    expect(familyAfter).toBeNull();
    expect(studentAfter).toBeNull();
    expect(seriesAfter).toBeNull();
    expect(couponAfter).toBeNull();
    expect(ndrAfter).toBeNull();

    console.log('✅ Suppression en cascade complète validée');
  });

  it('should return 404 for non-existent family', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    
    const response = await request(app)
      .delete(`/api/families/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body.message).toBe('Famille non trouvée');
  });

  it('should require admin authorization', async () => {
    // Tester sans token
    await request(app)
      .delete(`/api/families/${testFamily._id}`)
      .expect(401);

    // Créer un utilisateur non-admin
    const user = await User.create({
      firstName: 'User',
      lastName: 'Test',
      email: 'user@test.com',
      password: 'password123',
      role: 'professor'
    });

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123'
      });

    // Tester avec token non-admin
    await request(app)
      .delete(`/api/families/${testFamily._id}`)
      .set('Authorization', `Bearer ${userLoginRes.body.token}`)
      .expect(403);
  });
});