/**
 * Test NDR Création - Support Famille Seule
 * Vérification des corrections pour les NDR sans élèves (studentIds vide)
 */

const request = require("supertest");
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require("../../server");
const Family = require('../../models/Family');
const Student = require('../../models/Student');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const SettlementNote = require('../../models/SettlementNote');
const CouponSeries = require('../../models/CouponSeries');

let mongoServer;
let adminToken;
let testFamily;
let testSubject;

describe('NDR Création - Support Famille Seule', () => {
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
      User.deleteMany({}),
      Subject.deleteMany({}),
      SettlementNote.deleteMany({}),
      CouponSeries.deleteMany({})
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
        beneficiaryType: 'adulte',  // Pour famille seule (adulte)
        subjects: ['Mathématiques']
      },
      status: 'prospect',
      createdBy: adminUser._id,
      students: []
    });

    // Créer une matière de test
    testSubject = await Subject.create({
      name: 'Mathématiques',
      category: 'Scientifique'
    });
  });

  test('1. Création NDR avec studentIds vide - famille seule', async () => {
    const ndrData = {
      familyId: testFamily._id.toString(),
      studentIds: [], // Famille seule, pas d'élèves
      clientName: "Test Client Famille",
      department: "75",
      paymentMethod: "card",
      paymentType: "immediate_advance", // Obligatoire
      subjects: [
        {
          subjectId: testSubject._id.toString(),
          hourlyRate: 25.50,
          quantity: 10,
          professorSalary: 18.00
        }
      ],
      charges: 3.50,
      notes: "NDR famille seule de test"
    };

    console.log('🔍 Données NDR envoyées:', {
      familyId: ndrData.familyId,
      studentIds: ndrData.studentIds,
      hasPaymentType: !!ndrData.paymentType
    });

    const response = await request(app)
      .post("/api/settlement-notes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(ndrData)
      .expect(201);

    // Vérifications
    expect(response.body.message).toContain("Note de règlement créée avec succès");
    expect(response.body.settlementNote).toBeDefined();
    expect(response.body.settlementNote.studentIds).toEqual([]);
    expect(response.body.settlementNote.familyId).toBe(testFamily._id.toString());
    
    // Vérifier génération automatique des coupons
    expect(response.body.couponSeries).toBeDefined();
    expect(response.body.couponSeries.totalCoupons).toBeGreaterThan(0);
    
    console.log('✅ Test 1 : NDR famille seule créée avec succès');
    console.log(`Coupons générés: ${response.body.couponSeries.totalCoupons}`);
    console.log(`StudentIds: ${JSON.stringify(response.body.settlementNote.studentIds)}`);
  });

  test('2. Validation paymentType obligatoire', async () => {
    const ndrData = {
      familyId: testFamily._id.toString(),
      studentIds: [],
      clientName: "Test Sans PaymentType",
      department: "75", 
      paymentMethod: "card",
      // paymentType manquant - doit échouer
      subjects: [
        {
          subjectId: testSubject._id.toString(),
          hourlyRate: 25.50,
          quantity: 10,
          professorSalary: 18.00
        }
      ],
      charges: 3.50
    };

    const response = await request(app)
      .post("/api/settlement-notes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(ndrData)
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toBeDefined();
    
    // Vérifier que l'erreur concerne bien paymentType
    const paymentTypeError = response.body.details.find(detail => 
      detail.path === 'paymentType'
    );
    expect(paymentTypeError).toBeDefined();
    
    console.log('✅ Test 2 : Validation paymentType fonctionne');
    console.log('Erreur paymentType:', paymentTypeError?.msg || 'Non trouvée');
  });

  test('3. Vérification statut famille prospect -> client', async () => {
    // Vérifier statut initial
    expect(testFamily.status).toBe('prospect');
    
    const ndrData = {
      familyId: testFamily._id.toString(),
      studentIds: [],
      clientName: "Test Changement Statut",
      department: "75",
      paymentMethod: "card",
      paymentType: "immediate_advance",
      subjects: [
        {
          subjectId: testSubject._id.toString(),
          hourlyRate: 25.50,
          quantity: 10,
          professorSalary: 18.00
        }
      ],
      charges: 3.50
    };

    await request(app)
      .post("/api/settlement-notes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(ndrData)
      .expect(201);

    // Vérifier que le statut a changé
    const updatedFamily = await Family.findById(testFamily._id);
    expect(updatedFamily.status).toBe('client');
    
    console.log('✅ Test 3 : Statut famille prospect -> client OK');
  });

  test('4. Vérification génération coupons pour famille seule', async () => {
    const ndrData = {
      familyId: testFamily._id.toString(),
      studentIds: [], // Famille seule
      clientName: "Test Coupons Famille",
      department: "75",
      paymentMethod: "card",
      paymentType: "immediate_advance",
      subjects: [
        {
          subjectId: testSubject._id.toString(),
          hourlyRate: 25.50,
          quantity: 8, // 8 heures
          professorSalary: 18.00
        }
      ],
      charges: 3.50
    };

    const response = await request(app)
      .post("/api/settlement-notes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(ndrData)
      .expect(201);

    // Vérifier que les coupons sont générés selon la quantité
    // Pour famille seule: quantity * beneficiaryCount (1)
    const expectedCoupons = 8 * 1; // 8 coupons
    expect(response.body.couponSeries.totalCoupons).toBe(expectedCoupons);
    
    // Vérifier que la série de coupons contient les bonnes données
    const couponSeries = await CouponSeries.findById(response.body.couponSeries.id);
    expect(couponSeries.studentId).toBeNull(); // Pas d'élève pour famille seule
    expect(couponSeries.studentIds).toEqual([]);
    expect(couponSeries.familyId.toString()).toBe(testFamily._id.toString());
    
    console.log('✅ Test 4 : Génération coupons famille seule correct');
    console.log(`Coupons générés: ${response.body.couponSeries.totalCoupons} (attendus: ${expectedCoupons})`);
  });

  test('5. Comparaison famille seule vs avec élèves', async () => {
    // Créer un élève pour test comparatif
    const student1 = await Student.create({
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

    const student2 = await Student.create({
      firstName: 'Marie',
      lastName: 'Dupont', 
      family: testFamily._id,
      dateOfBirth: new Date('2007-03-20'),
      school: {
        name: 'Collège Test',
        level: 'college',
        grade: '3ème'
      }
    });

    // NDR famille seule
    const ndrFamille = {
      familyId: testFamily._id.toString(),
      studentIds: [],
      clientName: "Test Famille Seule",
      department: "75",
      paymentMethod: "card",
      paymentType: "immediate_advance",
      subjects: [
        {
          subjectId: testSubject._id.toString(),
          hourlyRate: 25.50,
          quantity: 10,
          professorSalary: 18.00
        }
      ],
      charges: 3.50
    };

    // NDR avec 2 élèves
    const ndrEleves = {
      ...ndrFamille,
      clientName: "Test 2 Élèves",
      studentIds: [
        student1._id.toString(),
        student2._id.toString()
      ]
    };

    const [responseFamille, responseEleves] = await Promise.all([
      request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(ndrFamille)
        .expect(201),
      request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(ndrEleves)
        .expect(201)
    ]);

    // Vérifier que famille = 1 bénéficiaire, élèves = 2 bénéficiaires
    const couponsFamille = responseFamille.body.couponSeries.totalCoupons;
    const couponsEleves = responseEleves.body.couponSeries.totalCoupons;
    
    expect(couponsEleves).toBe(couponsFamille * 2); // 2x plus de coupons pour 2 élèves
    
    console.log('✅ Test 5 : Calcul coupons famille vs élèves correct');
    console.log(`Famille seule: ${couponsFamille} coupons`);
    console.log(`2 Élèves: ${couponsEleves} coupons`);
    console.log(`Ratio: ${couponsEleves / couponsFamille}x`);
  });
});