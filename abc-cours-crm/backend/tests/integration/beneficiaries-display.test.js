const request = require("supertest");
const app = require("../../server");
const { setupTestDB, teardownTestDB, clearTestDB } = require("../setup");
const CouponSeries = require("../../models/CouponSeries");
const Family = require("../../models/Family");
const Student = require("../../models/Student");
const Subject = require("../../models/Subject");
const User = require("../../models/User");
const SettlementNote = require("../../models/SettlementNote");

describe("Bénéficiaires Display Integration Tests", () => {
  let testUser, testFamily, testStudent1, testStudent2, testSubject, testSettlementNote;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Créer utilisateur de test
    testUser = await User.create({
      firstName: "Test",
      lastName: "Admin",
      email: "admin@test.com",
      password: "hashedpassword123",
      role: "admin"
    });

    // Créer famille de test
    testFamily = await Family.create({
      address: {
        street: "123 Test St",
        city: "Test City",
        postalCode: "12345"
      },
      primaryContact: {
        firstName: "Jean",
        lastName: "Dupont",
        primaryPhone: "0123456789",
        email: "jean.dupont@test.com",
        gender: "M."
      },
      demande: {
        beneficiaryType: "eleves",
        beneficiaryLevel: "6ème"
      },
      createdBy: testUser._id
    });

    // Créer élèves de test
    testStudent1 = await Student.create({
      firstName: "Marie",
      lastName: "Dupont",
      level: "6ème",
      familyId: testFamily._id,
      family: testFamily._id,
      dateOfBirth: new Date("2012-05-15"),
      school: {
        name: "Collège Test",
        grade: "6ème",
        level: "college"
      }
    });

    testStudent2 = await Student.create({
      firstName: "Pierre",
      lastName: "Dupont",
      level: "5ème",
      familyId: testFamily._id,
      family: testFamily._id,
      dateOfBirth: new Date("2011-03-22"),
      school: {
        name: "Collège Test",
        grade: "5ème",
        level: "Collège"
      }
    });

    // Créer matière de test
    testSubject = await Subject.create({
      name: "Mathématiques",
      category: "Sciences"
    });

    // Créer note de règlement de test
    testSettlementNote = await SettlementNote.create({
      familyId: testFamily._id,
      studentIds: [testStudent1._id, testStudent2._id],
      clientName: "Jean Dupont",
      department: "75",
      paymentMethod: "card",
      subjects: [{
        subjectId: testSubject._id,
        hourlyRate: 30,
        quantity: 10,
        professorSalary: 20
      }],
      charges: 5,
      createdBy: testUser._id
    });
  });

  describe("Nouvelle structure de bénéficiaires", () => {
    test("Devrait créer une série avec beneficiaryType 'student' et un seul élève", async () => {
      const seriesData = {
        settlementNoteId: testSettlementNote._id,
        familyId: testFamily._id,
        studentIds: [testStudent1._id],
        beneficiaryType: "student",
        totalCoupons: 10,
        hourlyRate: 30,
        professorSalary: 20,
        subject: testSubject._id,
        createdBy: testUser._id
      };

      const series = await CouponSeries.create(seriesData);
      
      // Populate pour tester l'affichage
      const populatedSeries = await CouponSeries.findById(series._id)
        .populate("familyId", "primaryContact.firstName primaryContact.lastName demande.beneficiaryType")
        .populate("studentIds", "firstName lastName level")
        .populate("subject", "name");

      expect(populatedSeries.beneficiaryType).toBe("student");
      expect(populatedSeries.studentIds).toHaveLength(1);
      expect(populatedSeries.studentIds[0].firstName).toBe("Marie");
    });

    test("Devrait créer une série avec beneficiaryType 'adult'", async () => {
      const seriesData = {
        settlementNoteId: testSettlementNote._id,
        familyId: testFamily._id,
        studentIds: [],
        beneficiaryType: "adult",
        adultBeneficiary: {
          isContact: true
        },
        totalCoupons: 5,
        hourlyRate: 35,
        professorSalary: 25,
        subject: testSubject._id,
        createdBy: testUser._id
      };

      const series = await CouponSeries.create(seriesData);
      
      const populatedSeries = await CouponSeries.findById(series._id)
        .populate("familyId", "primaryContact.firstName primaryContact.lastName demande.beneficiaryType")
        .populate("studentIds", "firstName lastName level");

      expect(populatedSeries.beneficiaryType).toBe("adult");
      expect(populatedSeries.studentIds).toHaveLength(0);
      expect(populatedSeries.adultBeneficiary.isContact).toBe(true);
      expect(populatedSeries.familyId.primaryContact.firstName).toBe("Jean");
    });

    test("Devrait créer une série avec beneficiaryType 'mixed'", async () => {
      const seriesData = {
        settlementNoteId: testSettlementNote._id,
        familyId: testFamily._id,
        studentIds: [testStudent1._id, testStudent2._id],
        beneficiaryType: "mixed",
        adultBeneficiary: {
          isContact: true
        },
        totalCoupons: 15,
        hourlyRate: 32,
        professorSalary: 22,
        subject: testSubject._id,
        createdBy: testUser._id
      };

      const series = await CouponSeries.create(seriesData);
      
      const populatedSeries = await CouponSeries.findById(series._id)
        .populate("familyId", "primaryContact.firstName primaryContact.lastName")
        .populate("studentIds", "firstName lastName level");

      expect(populatedSeries.beneficiaryType).toBe("mixed");
      expect(populatedSeries.studentIds).toHaveLength(2);
      expect(populatedSeries.adultBeneficiary.isContact).toBe(true);
    });

    test("Devrait gérer la rétrocompatibilité avec studentId", async () => {
      // Test avec l'ancien format pour vérifier la compatibilité
      const seriesData = {
        settlementNoteId: testSettlementNote._id,
        familyId: testFamily._id,
        studentId: testStudent1._id, // Ancien format
        totalCoupons: 8,
        hourlyRate: 28,
        professorSalary: 18,
        subject: testSubject._id,
        createdBy: testUser._id
        // beneficiaryType sera "student" par défaut
      };

      const series = await CouponSeries.create(seriesData);
      
      const populatedSeries = await CouponSeries.findById(series._id)
        .populate("studentId", "firstName lastName level")
        .populate("studentIds", "firstName lastName level");

      expect(populatedSeries.beneficiaryType).toBe("student"); // Valeur par défaut
      expect(populatedSeries.studentId.firstName).toBe("Marie");
      expect(populatedSeries.studentIds).toHaveLength(0); // Pas de nouveaux étudiants
    });
  });

  describe("API Routes avec nouvelles données", () => {
    test("GET /api/coupon-series/:id devrait retourner les données de bénéficiaires", async () => {
      const seriesData = {
        settlementNoteId: testSettlementNote._id,
        familyId: testFamily._id,
        studentIds: [testStudent1._id, testStudent2._id],
        beneficiaryType: "student",
        totalCoupons: 12,
        hourlyRate: 30,
        professorSalary: 20,
        subject: testSubject._id,
        createdBy: testUser._id
      };

      const series = await CouponSeries.create(seriesData);

      const response = await request(app)
        .get(`/api/coupon-series/${series._id}`)
        .set('Authorization', `Bearer ${testUser._id}`); // Simulation de token

      expect(response.status).toBe(200);
      expect(response.body.series).toBeDefined();
      expect(response.body.series.beneficiaryType).toBe("student");
      expect(response.body.series.studentIds).toHaveLength(2);
    });
  });
});