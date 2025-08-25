const request = require("supertest");
const app = require("../../server");
const User = require("../../models/User");
const Family = require("../../models/Family");
const Student = require("../../models/Student");
const Subject = require("../../models/Subject");
const SettlementNote = require("../../models/SettlementNote");
const { setupTestDB, teardownTestDB, clearTestDB } = require("../setup");

describe("Settlement Notes API Tests - Multiple Students and Subjects", () => {
  let authToken;
  let userId;
  let familyId;
  let studentIds = [];
  let subjectIds = [];

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    // Create test user
    const testUser = new User({
      firstName: "Test",
      lastName: "Admin",
      email: "test@admin.com",
      password: "hashedPassword",
      role: "admin",
    });
    const savedUser = await testUser.save();
    userId = savedUser._id;

    // Login to get auth token
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@admin.com",
        password: "hashedPassword",
      });
    authToken = loginResponse.body.token;

    // Create test family
    const testFamily = new Family({
      primaryContact: {
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@example.com",
        primaryPhone: "0123456789",
      },
      address: {
        street: "123 rue de la Paix",
        city: "Paris",
        postalCode: "75001",
        country: "France",
      },
      status: "prospect",
      createdBy: userId,
    });
    const savedFamily = await testFamily.save();
    familyId = savedFamily._id;

    // Create test students
    const student1 = new Student({
      firstName: "Pierre",
      lastName: "Dupont",
      familyId: familyId,
      level: "Terminale S",
      createdBy: userId,
    });
    const student2 = new Student({
      firstName: "Marie",
      lastName: "Dupont",
      familyId: familyId,
      level: "1ère ES",
      createdBy: userId,
    });
    const savedStudent1 = await student1.save();
    const savedStudent2 = await student2.save();
    studentIds = [savedStudent1._id, savedStudent2._id];

    // Create test subjects
    const subject1 = new Subject({
      name: "Mathématiques",
      category: "Sciences",
      createdBy: userId,
    });
    const subject2 = new Subject({
      name: "Physique",
      category: "Sciences",
      createdBy: userId,
    });
    const savedSubject1 = await subject1.save();
    const savedSubject2 = await subject2.save();
    subjectIds = [savedSubject1._id, savedSubject2._id];
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Family.deleteMany({});
    await Student.deleteMany({});
    await Subject.deleteMany({});
    await SettlementNote.deleteMany({});
  });

  describe("POST /api/settlement-notes - Multiple Selection", () => {
    it("should create a settlement note with multiple students and subjects", async () => {
      const settlementData = {
        familyId: familyId,
        studentIds: studentIds, // Multiple students
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        subjects: [ // Multiple subjects
          {
            subjectId: subjectIds[0],
            hourlyRate: 30.0,
            quantity: 10,
            professorSalary: 20.0,
          },
          {
            subjectId: subjectIds[1],
            hourlyRate: 35.0,
            quantity: 8,
            professorSalary: 25.0,
          }
        ],
        charges: 2.0,
        notes: "Note de test avec plusieurs élèves et matières",
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Note de règlement créée avec succès");
      expect(response.body.settlementNote).toBeDefined();

      const settlementNote = response.body.settlementNote;
      
      // Vérifier les élèves multiples
      expect(settlementNote.studentIds).toHaveLength(2);
      expect(settlementNote.studentIds).toEqual(
        expect.arrayContaining([
          studentIds[0].toString(),
          studentIds[1].toString()
        ])
      );

      // Vérifier les matières multiples
      expect(settlementNote.subjects).toHaveLength(2);
      expect(settlementNote.subjects[0].subjectId).toBe(subjectIds[0].toString());
      expect(settlementNote.subjects[0].hourlyRate).toBe(30.0);
      expect(settlementNote.subjects[0].quantity).toBe(10);
      expect(settlementNote.subjects[0].professorSalary).toBe(20.0);

      expect(settlementNote.subjects[1].subjectId).toBe(subjectIds[1].toString());
      expect(settlementNote.subjects[1].hourlyRate).toBe(35.0);
      expect(settlementNote.subjects[1].quantity).toBe(8);
      expect(settlementNote.subjects[1].professorSalary).toBe(25.0);

      // Vérifier les calculs automatiques
      expect(settlementNote.totalHourlyRate).toBe(65.0); // 30 + 35
      expect(settlementNote.totalQuantity).toBe(18); // 10 + 8
      expect(settlementNote.totalProfessorSalary).toBe(45.0); // 20 + 25
      expect(settlementNote.salaryToPay).toBe(400.0); // (20*10) + (25*8)
      expect(settlementNote.chargesToPay).toBe(36.0); // 2 * 18
      expect(settlementNote.marginAmount).toBe(644.0); // (30*10 + 35*8) - 400 - 36 = 630 - 400 - 36
    });

    it("should validate that at least one student is required", async () => {
      const settlementData = {
        familyId: familyId,
        studentIds: [], // Tableau vide
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        subjects: [
          {
            subjectId: subjectIds[0],
            hourlyRate: 30.0,
            quantity: 10,
            professorSalary: 20.0,
          }
        ],
        charges: 2.0,
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should validate that at least one subject is required", async () => {
      const settlementData = {
        familyId: familyId,
        studentIds: [studentIds[0]],
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        subjects: [], // Tableau vide
        charges: 2.0,
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should validate all subject fields are required", async () => {
      const settlementData = {
        familyId: familyId,
        studentIds: [studentIds[0]],
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        subjects: [
          {
            subjectId: subjectIds[0],
            // hourlyRate manquant
            quantity: 10,
            professorSalary: 20.0,
          }
        ],
        charges: 2.0,
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should verify that all subjects exist", async () => {
      const fakeSubjectId = "507f1f77bcf86cd799439011";
      
      const settlementData = {
        familyId: familyId,
        studentIds: [studentIds[0]],
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        subjects: [
          {
            subjectId: fakeSubjectId, // ID qui n'existe pas
            hourlyRate: 30.0,
            quantity: 10,
            professorSalary: 20.0,
          }
        ],
        charges: 2.0,
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Une ou plusieurs matières introuvables");
    });

    it("should create settlement note with single student and single subject (backward compatibility)", async () => {
      const settlementData = {
        familyId: familyId,
        studentIds: [studentIds[0]], // Un seul élève
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        subjects: [ // Une seule matière
          {
            subjectId: subjectIds[0],
            hourlyRate: 30.0,
            quantity: 10,
            professorSalary: 20.0,
          }
        ],
        charges: 2.0,
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData);

      expect(response.status).toBe(201);
      expect(response.body.settlementNote.studentIds).toHaveLength(1);
      expect(response.body.settlementNote.subjects).toHaveLength(1);
    });
  });
});