const request = require('supertest');
const app = require('../../server');
const mongoose = require('mongoose');
const Family = require('../../models/Family');
const Student = require('../../models/Student');
const CouponSeries = require('../../models/CouponSeries');
const Coupon = require('../../models/Coupon');
const SettlementNote = require('../../models/SettlementNote');
const User = require('../../models/User');
const { setupTestDB, teardownTestDB, clearTestDB } = require('../setup');

describe('Deletion Preview Modal Integration', () => {
  let authToken;
  let testFamilyId;
  let testStudentId;
  let testSeriesId;
  let testCouponId;
  let testNoteId;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Créer un utilisateur admin pour l'authentification
    const adminUser = new User({
      email: 'admin@test.fr',
      password: 'password123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Test'
    });
    await adminUser.save();

    // Se connecter pour obtenir le token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.fr',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
    // Créer une famille de test complète avec tous les éléments associés
    const testFamily = new Family({
      name: 'Famille Deletion Test',
      primaryContact: {
        firstName: 'Jean',
        lastName: 'Test',
        email: 'jean.test@email.com',
        phone: '0123456789'
      },
      address: {
        street: '123 Rue Test',
        city: 'Ville Test',
        postalCode: '12345'
      },
      status: 'prospect',
      prospectStatus: 'interested'
    });
    await testFamily.save();
    testFamilyId = testFamily._id.toString();

    // Créer un étudiant
    const testStudent = new Student({
      firstName: 'Pierre',
      lastName: 'Test',
      dateOfBirth: new Date('2010-05-15'),
      grade: '6ème',
      school: 'Collège Test',
      family: testFamily._id
    });
    await testStudent.save();
    testStudentId = testStudent._id.toString();

    // Créer une série de coupons
    const testSeries = new CouponSeries({
      familyId: testFamily._id,
      studentId: testStudent._id,
      subject: 'Mathématiques',
      totalCoupons: 10,
      usedCoupons: 3,
      remainingCoupons: 7,
      hourlyRate: 25,
      status: 'active'
    });
    await testSeries.save();
    testSeriesId = testSeries._id.toString();

    // Créer des coupons individuels
    const testCoupon = new Coupon({
      familyId: testFamily._id,
      studentId: testStudent._id,
      subject: 'Français',
      hourlyRate: 30,
      status: 'available'
    });
    await testCoupon.save();
    testCouponId = testCoupon._id.toString();

    // Créer une note de règlement
    const testNote = new SettlementNote({
      familyId: testFamily._id,
      clientName: 'Famille Test',
      totalHours: 12,
      totalAmount: 360,
      status: 'pending',
      date: new Date()
    });
    await testNote.save();
    testNoteId = testNote._id.toString();
  });

  afterEach(async () => {
    // Nettoyer toutes les collections
    await Family.deleteMany({});
    await Student.deleteMany({});
    await CouponSeries.deleteMany({});
    await Coupon.deleteMany({});
    await SettlementNote.deleteMany({});
  });

  describe('GET /api/families/:id/deletion-preview', () => {
    it('should return comprehensive deletion preview data', async () => {
      const response = await request(app)
        .get(`/api/families/${testFamilyId}/deletion-preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('family');
      expect(response.body).toHaveProperty('itemsToDelete');
      expect(response.body).toHaveProperty('totalItems');

      // Vérifier les données de la famille
      expect(response.body.family.name).toBe('Famille Deletion Test');
      expect(response.body.family.status).toBe('prospect');
      expect(response.body.family.prospectStatus).toBe('interested');

      // Vérifier les éléments à supprimer
      const items = response.body.itemsToDelete;
      
      // Étudiants
      expect(items.students.count).toBe(1);
      expect(items.students.details).toHaveLength(1);
      expect(items.students.details[0].name).toBe('Pierre Test');
      expect(items.students.details[0].grade).toBe('6ème');

      // Séries de coupons
      expect(items.couponSeries.count).toBe(1);
      expect(items.couponSeries.details).toHaveLength(1);
      expect(items.couponSeries.details[0].subject).toBe('Mathématiques');
      expect(items.couponSeries.details[0].totalCoupons).toBe(10);
      expect(items.couponSeries.details[0].remainingCoupons).toBe(7);

      // Coupons individuels
      expect(items.coupons.count).toBe(1);
      expect(items.coupons.availableCount).toBe(1);
      expect(items.coupons.usedCount).toBe(0);

      // Notes de règlement
      expect(items.settlementNotes.count).toBe(1);
      expect(items.settlementNotes.details).toHaveLength(1);
      expect(items.settlementNotes.details[0].clientName).toBe('Famille Test');
      expect(items.settlementNotes.details[0].totalAmount).toBe(360);

      // Total des éléments
      expect(response.body.totalItems).toBe(4); // 1 étudiant + 1 série + 1 coupon + 1 note
    });

    it('should handle family with no associated items', async () => {
      // Créer une famille sans éléments associés
      const emptyFamily = new Family({
        name: 'Famille Vide',
        primaryContact: {
          firstName: 'Marie',
          lastName: 'Vide',
          email: 'marie.vide@email.com',
          phone: '0987654321'
        },
        address: {
          street: '456 Rue Vide',
          city: 'Ville Vide',
          postalCode: '54321'
        },
        status: 'client'
      });
      await emptyFamily.save();

      const response = await request(app)
        .get(`/api/families/${emptyFamily._id}/deletion-preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.family.name).toBe('Famille Vide');
      expect(response.body.totalItems).toBe(0);
      expect(response.body.itemsToDelete.students.count).toBe(0);
      expect(response.body.itemsToDelete.couponSeries.count).toBe(0);
      expect(response.body.itemsToDelete.coupons.count).toBe(0);
      expect(response.body.itemsToDelete.settlementNotes.count).toBe(0);
    });

    it('should return 404 for non-existent family', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/families/${fakeId}/deletion-preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Famille non trouvée');
    });
  });

  describe('Complete deletion workflow after preview', () => {
    it('should delete all items shown in preview', async () => {
      // 1. Obtenir l'aperçu de suppression
      const previewResponse = await request(app)
        .get(`/api/families/${testFamilyId}/deletion-preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const totalItemsFromPreview = previewResponse.body.totalItems;
      expect(totalItemsFromPreview).toBe(4);

      // 2. Vérifier que tous les éléments existent avant suppression
      const familyBefore = await Family.findById(testFamilyId);
      const studentsBefore = await Student.find({ family: testFamilyId });
      const seriesBefore = await CouponSeries.find({ familyId: testFamilyId });
      const couponsBefore = await Coupon.find({ familyId: testFamilyId });
      const notesBefore = await SettlementNote.find({ familyId: testFamilyId });

      expect(familyBefore).toBeTruthy();
      expect(studentsBefore).toHaveLength(1);
      expect(seriesBefore).toHaveLength(1);
      expect(couponsBefore).toHaveLength(1);
      expect(notesBefore).toHaveLength(1);

      // 3. Effectuer la suppression
      await request(app)
        .delete(`/api/families/${testFamilyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 4. Vérifier que tous les éléments ont été supprimés
      const familyAfter = await Family.findById(testFamilyId);
      const studentsAfter = await Student.find({ family: testFamilyId });
      const seriesAfter = await CouponSeries.find({ familyId: testFamilyId });
      const couponsAfter = await Coupon.find({ familyId: testFamilyId });
      const notesAfter = await SettlementNote.find({ familyId: testFamilyId });

      expect(familyAfter).toBeNull();
      expect(studentsAfter).toHaveLength(0);
      expect(seriesAfter).toHaveLength(0);
      expect(couponsAfter).toHaveLength(0);
      expect(notesAfter).toHaveLength(0);
    });
  });
});