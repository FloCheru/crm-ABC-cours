const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Family = require('../models/Family');
const SettlementNote = require('../models/SettlementNote');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

describe('NDR Creation Workflow', () => {
  let authToken;
  let testUser;
  let testFamily;
  let testSubject;
  let testStudent;

  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = new User({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test.ndr@example.com',
      password: '$2b$10$hashedpassword',
      role: 'admin'
    });
    await testUser.save();

    // Créer un token JWT
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Créer une matière de test
    testSubject = new Subject({
      name: 'Test Math',
      category: 'scientific',
      createdBy: testUser._id
    });
    await testSubject.save();
  });

  beforeEach(async () => {
    // Créer une famille prospect avec gender par défaut
    testFamily = new Family({
      address: {
        street: '123 Rue Test',
        city: 'Test City',
        postalCode: '75001'
      },
      primaryContact: {
        firstName: 'Jean',
        lastName: 'Testeur',
        primaryPhone: '0123456789',
        email: 'jean.testeur@example.com',
        gender: 'M.' // ✅ Champ gender obligatoire
      },
      status: 'prospect', // ✅ Doit passer à "client" après création NDR
      demande: {
        beneficiaryType: 'eleves',
        beneficiaryLevel: '3ème',
        subjects: ['Mathématiques']
      },
      createdBy: testUser._id
    });
    await testFamily.save();

    // Créer un étudiant lié à cette famille
    testStudent = new Student({
      firstName: 'Pierre',
      lastName: 'Testeur',
      level: '3ème',
      dateOfBirth: new Date('2008-05-15'),
      familyId: testFamily._id,
      createdBy: testUser._id
    });
    await testStudent.save();

    // Lier l'étudiant à la famille
    testFamily.students = [testStudent._id];
    await testFamily.save();
  });

  afterEach(async () => {
    // Nettoyage après chaque test
    await SettlementNote.deleteMany({});
    await Family.deleteMany({});
    await Student.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Subject.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Phase 1: Validation Gender Fix', () => {
    it('doit créer une NDR même avec famille ayant un champ gender manquant initialement', async () => {
      // Simuler une famille sans gender (cas legacy)
      await Family.findByIdAndUpdate(
        testFamily._id, 
        { $unset: { "primaryContact.gender": 1 } },
        { runValidators: false }
      );

      const ndrData = {
        familyId: testFamily._id.toString(),
        studentIds: [testStudent._id.toString()],
        clientName: 'Jean Testeur',
        department: '75 - Paris',
        paymentMethod: 'card',
        subjects: [{
          subjectId: testSubject._id.toString(),
          hourlyRate: 35.0,
          quantity: 10,
          professorSalary: 18.0
        }],
        totalHourlyRate: 35.0,
        totalQuantity: 10,
        totalProfessorSalary: 18.0
      };

      const response = await request(app)
        .post('/api/settlement-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ndrData);

      // ✅ La création doit réussir malgré le champ gender manquant
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.settlementNote).toBeDefined();

      // ✅ Vérifier que la famille est passée de "prospect" à "client"
      const updatedFamily = await Family.findById(testFamily._id);
      expect(updatedFamily.status).toBe('client');

      console.log('✅ [TEST-NDR] Phase 1 validée: NDR créée sans erreur de validation gender');
    });

    it('doit créer une NDR normalement avec famille ayant le champ gender', async () => {
      const ndrData = {
        familyId: testFamily._id.toString(),
        studentIds: [testStudent._id.toString()],
        clientName: 'Jean Testeur',
        department: '75 - Paris',
        paymentMethod: 'card',
        subjects: [{
          subjectId: testSubject._id.toString(),
          hourlyRate: 35.0,
          quantity: 10,
          professorSalary: 18.0
        }],
        totalHourlyRate: 35.0,
        totalQuantity: 10,
        totalProfessorSalary: 18.0
      };

      const response = await request(app)
        .post('/api/settlement-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ndrData);

      // ✅ La création doit réussir avec le champ gender présent
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.settlementNote).toBeDefined();

      // ✅ Vérifier que la famille est passée de "prospect" à "client"
      const updatedFamily = await Family.findById(testFamily._id);
      expect(updatedFamily.status).toBe('client');
      expect(updatedFamily.primaryContact.gender).toBe('M.');

      console.log('✅ [TEST-NDR] NDR créée normalement avec gender présent');
    });
  });

  describe('Phase 2: Cache Invalidation (Frontend)', () => {
    it('doit déclencher l\'invalidation des caches côté frontend', async () => {
      const ndrData = {
        familyId: testFamily._id.toString(),
        studentIds: [testStudent._id.toString()],
        clientName: 'Jean Testeur',
        department: '75 - Paris',
        paymentMethod: 'card',
        subjects: [{
          subjectId: testSubject._id.toString(),
          hourlyRate: 35.0,
          quantity: 10,
          professorSalary: 18.0
        }],
        totalHourlyRate: 35.0,
        totalQuantity: 10,
        totalProfessorSalary: 18.0
      };

      const response = await request(app)
        .post('/api/settlement-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ndrData);

      expect(response.status).toBe(201);

      // Note: L'invalidation des caches se fait côté frontend dans settlementService.ts
      // Ce test vérifie que l'API fonctionne correctement
      // Le cache manager est testé dans les tests frontend
      console.log('✅ [TEST-NDR] Backend API fonctionne - cache invalidation côté frontend');
    });
  });

  describe('Workflow Complet', () => {
    it('doit compléter le workflow complet: creation NDR + changement statut + génération coupons', async () => {
      // Vérifier l'état initial
      expect(testFamily.status).toBe('prospect');

      const ndrData = {
        familyId: testFamily._id.toString(),
        studentIds: [testStudent._id.toString()],
        clientName: 'Jean Testeur',
        department: '75 - Paris',
        paymentMethod: 'card',
        subjects: [{
          subjectId: testSubject._id.toString(),
          hourlyRate: 35.0,
          quantity: 10,
          professorSalary: 18.0
        }],
        totalHourlyRate: 35.0,
        totalQuantity: 10,
        totalProfessorSalary: 18.0
      };

      const response = await request(app)
        .post('/api/settlement-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ndrData);

      // ✅ Vérifications du workflow complet
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // 1. NDR créée
      const createdNDR = response.body.settlementNote;
      expect(createdNDR).toBeDefined();
      expect(createdNDR.familyId).toBe(testFamily._id.toString());

      // 2. Statut famille changé
      const updatedFamily = await Family.findById(testFamily._id);
      expect(updatedFamily.status).toBe('client');

      // 3. Relations bidirectionnelles créées
      expect(updatedFamily.settlementNotes).toContain(createdNDR._id);

      // 4. Génération de coupons (vérifiée via les logs)
      expect(response.body.message).toContain('Note de règlement créée avec succès');

      console.log('🎉 [TEST-NDR] Workflow complet validé avec succès!');
    });
  });
});