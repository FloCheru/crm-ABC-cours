// tests/settlementNotes.test.js - Tests unitaires pour les notes de règlement
const request = require("supertest");
const app = require("../server");
const SettlementNote = require("../models/SettlementNote");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Family = require("../models/Family");
const { setupTestDB, teardownTestDB, clearTestDB } = require("./setup");

describe("Settlement Notes API Tests", () => {
  let authToken;
  let adminUser;
  let testSubject;
  let testFamily;

  // Données de test globales
  const validSettlementData = {
    clientName: "Famille Dupont",
    department: "Paris",
    paymentMethod: "card",
    hourlyRate: 45.0,
    quantity: 10,
    professorSalary: 25.0,
    charges: 5.0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours
    notes: "Cours de mathématiques niveau terminale",
  };

  // Fonction helper pour créer les données de test avec les IDs
  let createTestData;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Créer un utilisateur admin pour l'authentification
    adminUser = new User({
      email: "admin@test.fr",
      password: "password123",
      role: "admin",
      firstName: "Admin",
      lastName: "Test",
    });
    await adminUser.save();

    // Créer une famille de test
    testFamily = new Family({
      name: "Famille Dupont",
      address: {
        street: "123 Rue de la Paix",
        city: "Paris",
        postalCode: "75001",
        country: "France",
      },
      contact: {
        email: "dupont@test.fr",
        primaryPhone: "0123456789",
      },
      parents: [
        {
          firstName: "Jean",
          lastName: "Dupont",
          isPrimaryContact: true,
        },
      ],
      settlementNotes: [], // Notes de règlement liées à cette famille
      status: "client",
    });
    await testFamily.save();

    // Créer une matière de test
    testSubject = new Subject({
      name: "Mathématiques",
      description: "Cours de mathématiques niveau lycée",
      category: "Scientifique",
      isActive: true,
    });
    await testSubject.save();

    // Se connecter pour obtenir le token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@test.fr",
      password: "password123",
    });

    authToken = loginResponse.body.token;

    // Définir la fonction helper maintenant que testFamily et testSubject sont créés
    createTestData = (overrides = {}) => {
      console.log("🔍 createTestData appelée avec overrides:", overrides);
      console.log("🔍 testFamily._id:", testFamily._id);
      console.log("🔍 testSubject._id:", testSubject._id);

      const result = {
        ...validSettlementData,
        familyId: testFamily._id.toString(),
        subjectId: testSubject._id.toString(),
        ...overrides,
      };

      console.log("🔍 Résultat createTestData:", result);
      return result;
    };

    console.log(
      "🔍 beforeEach terminé - createTestData définie:",
      typeof createTestData
    );
  });

  describe("POST /api/settlement-notes", () => {
    it("should create a settlement note with all required fields", async () => {
      console.log("🔍 Avant createTestData()");
      const settlementData = createTestData();
      console.log("🔍 Après createTestData()");
      console.log("🔍 Données de test créées:", settlementData);

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      // Vérifier la structure de la réponse
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("settlementNote");
      expect(response.body.message).toBe("Note de règlement créée avec succès");

      const createdNote = response.body.settlementNote;

      // Vérifier tous les champs requis
      expect(createdNote.clientName).toBe(settlementData.clientName);
      expect(createdNote.department).toBe(settlementData.department);
      expect(createdNote.paymentMethod).toBe(settlementData.paymentMethod);
      expect(createdNote.subject._id).toBe(settlementData.subjectId);
      expect(createdNote.hourlyRate).toBe(settlementData.hourlyRate);
      expect(createdNote.quantity).toBe(settlementData.quantity);
      expect(createdNote.professorSalary).toBe(settlementData.professorSalary);
      expect(createdNote.charges).toBe(settlementData.charges);
      expect(createdNote.dueDate).toBe(settlementData.dueDate);
      expect(createdNote.notes).toBe(settlementData.notes);

      // Vérifier les champs calculés automatiquement
      expect(createdNote.salaryToPay).toBe(
        settlementData.professorSalary * settlementData.quantity
      );
      expect(createdNote.chargesToPay).toBe(
        settlementData.charges * settlementData.quantity
      );
      expect(createdNote.marginAmount).toBe(
        settlementData.hourlyRate * settlementData.quantity -
          settlementData.professorSalary * settlementData.quantity -
          settlementData.charges * settlementData.quantity
      );
      expect(createdNote.marginPercentage).toBeGreaterThan(0);
      expect(createdNote.marginPercentage).toBeLessThanOrEqual(100);

      // Vérifier les champs par défaut
      expect(createdNote.status).toBe("pending");
      expect(createdNote.createdBy._id).toBe(adminUser._id.toString());
      expect(createdNote).toHaveProperty("_id");
      expect(createdNote).toHaveProperty("createdAt");
      expect(createdNote).toHaveProperty("updatedAt");
    });

    it("should create settlement note with different payment methods", async () => {
      const paymentMethods = ["card", "check", "transfer", "cash"];

      for (const paymentMethod of paymentMethods) {
        const settlementData = createTestData({ paymentMethod });

        const response = await request(app)
          .post("/api/settlement-notes")
          .set("Authorization", `Bearer ${authToken}`)
          .send(settlementData)
          .expect(201);

        expect(response.body.settlementNote.paymentMethod).toBe(paymentMethod);
      }
    });

    it("should create settlement note with different quantities and rates", async () => {
      const testCases = [
        { quantity: 1, hourlyRate: 30, professorSalary: 20, charges: 3 },
        { quantity: 5, hourlyRate: 50, professorSalary: 30, charges: 7 },
        { quantity: 20, hourlyRate: 40, professorSalary: 25, charges: 5 },
      ];

      for (const testCase of testCases) {
        const settlementData = createTestData(testCase);

        const response = await request(app)
          .post("/api/settlement-notes")
          .set("Authorization", `Bearer ${authToken}`)
          .send(settlementData)
          .expect(201);

        const createdNote = response.body.settlementNote;

        // Vérifier les calculs
        expect(createdNote.salaryToPay).toBe(
          testCase.professorSalary * testCase.quantity
        );
        expect(createdNote.chargesToPay).toBe(
          testCase.charges * testCase.quantity
        );
        expect(createdNote.marginAmount).toBe(
          testCase.hourlyRate * testCase.quantity -
            testCase.professorSalary * testCase.quantity -
            testCase.charges * testCase.quantity
        );
      }
    });

    it("should create settlement note with notes field", async () => {
      const settlementData = createTestData({
        notes: "Cours particulier de mathématiques avec exercices pratiques",
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      expect(response.body.settlementNote.notes).toBe(settlementData.notes);
    });

    it("should create settlement note without notes field", async () => {
      const settlementData = createTestData({
        notes: undefined,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      expect(response.body.settlementNote.notes).toBeUndefined();
    });

    it("should create settlement note with future due date", async () => {
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // +60 jours
      const settlementData = createTestData({
        dueDate: futureDate.toISOString(),
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      expect(new Date(response.body.settlementNote.dueDate)).toEqual(
        futureDate
      );
    });

    it("should create settlement note with past due date", async () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // -10 jours
      const settlementData = createTestData({
        dueDate: pastDate.toISOString(),
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      expect(new Date(response.body.settlementNote.dueDate)).toEqual(pastDate);
    });

    it("should create settlement note with edge case values", async () => {
      const edgeCaseData = createTestData({
        hourlyRate: 0.01,
        quantity: 1,
        professorSalary: 0.01,
        charges: 0.01,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(edgeCaseData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      expect(createdNote.hourlyRate).toBe(0.01);
      expect(createdNote.quantity).toBe(1);
      expect(createdNote.professorSalary).toBe(0.01);
      expect(createdNote.charges).toBe(0.01);
    });

    it("should create settlement note with high values", async () => {
      const highValueData = createTestData({
        hourlyRate: 999.99,
        quantity: 100,
        professorSalary: 500.0,
        charges: 100.0,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(highValueData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      expect(createdNote.hourlyRate).toBe(999.99);
      expect(createdNote.quantity).toBe(100);
      expect(createdNote.professorSalary).toBe(500.0);
      expect(createdNote.charges).toBe(100.0);
    });
  });

  describe("Validation Errors", () => {
    it("should reject settlement note without clientName", async () => {
      const invalidData = createTestData();
      delete invalidData.clientName;

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note without department", async () => {
      const invalidData = createTestData();
      delete invalidData.department;

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note with invalid payment method", async () => {
      const invalidData = createTestData({
        paymentMethod: "invalid_method",
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note with invalid subject ID", async () => {
      const invalidData = createTestData({
        subjectId: "invalid_object_id",
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note with negative hourly rate", async () => {
      const invalidData = createTestData({
        hourlyRate: -10,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note with zero quantity", async () => {
      const invalidData = createTestData({
        quantity: 0,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note with negative professor salary", async () => {
      const invalidData = createTestData({
        professorSalary: -5,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note with negative charges", async () => {
      const invalidData = createTestData({
        charges: -2,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject settlement note with invalid due date", async () => {
      const invalidData = createTestData({
        dueDate: "invalid_date",
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("Authentication and Authorization", () => {
    it("should reject request without authentication token", async () => {
      const settlementData = createTestData();

      await request(app)
        .post("/api/settlement-notes")
        .send(settlementData)
        .expect(401);
    });

    it("should reject request with invalid authentication token", async () => {
      const settlementData = createTestData();

      await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", "Bearer invalid_token")
        .send(settlementData)
        .expect(401);
    });

    it("should accept request with valid authentication token", async () => {
      const settlementData = createTestData();

      await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);
    });
  });

  describe("Database Integration", () => {
    it("should save settlement note to database", async () => {
      const settlementData = createTestData();

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNoteId = response.body.settlementNote._id;

      // Vérifier que la note existe en base
      const savedNote = await SettlementNote.findById(createdNoteId);
      expect(savedNote).toBeTruthy();
      expect(savedNote.clientName).toBe(settlementData.clientName);
      expect(savedNote.department).toBe(settlementData.department);
    });

    it("should populate subject reference correctly", async () => {
      const settlementData = createTestData();

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      expect(createdNote.subject).toHaveProperty("_id");
      expect(createdNote.subject._id).toBe(testSubject._id.toString());
    });

    it("should set createdBy field to authenticated user", async () => {
      const settlementData = createTestData();

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      expect(createdNote.createdBy._id).toBe(adminUser._id.toString());
    });
  });

  describe("Business Logic", () => {
    it("should calculate salaryToPay correctly", async () => {
      const settlementData = createTestData({
        professorSalary: 30.0,
        quantity: 5,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      const expectedSalaryToPay = 30.0 * 5;
      expect(createdNote.salaryToPay).toBe(expectedSalaryToPay);
    });

    it("should calculate chargesToPay correctly", async () => {
      const settlementData = createTestData({
        charges: 8.0,
        quantity: 3,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      const expectedChargesToPay = 8.0 * 3;
      expect(createdNote.chargesToPay).toBe(expectedChargesToPay);
    });

    it("should calculate marginAmount correctly", async () => {
      const settlementData = createTestData({
        hourlyRate: 50.0,
        quantity: 4,
        professorSalary: 25.0,
        charges: 5.0,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      const totalRevenue = 50.0 * 4;
      const totalCosts = 25.0 * 4 + 5.0 * 4;
      const expectedMargin = totalRevenue - totalCosts;
      expect(createdNote.marginAmount).toBe(expectedMargin);
    });

    it("should calculate marginPercentage correctly", async () => {
      const settlementData = createTestData({
        hourlyRate: 100.0,
        quantity: 2,
        professorSalary: 40.0,
        charges: 10.0,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      const totalRevenue = 100.0 * 2;
      const totalCosts = 40.0 * 2 + 10.0 * 2;
      const marginAmount = totalRevenue - totalCosts;
      const expectedPercentage = (marginAmount / totalRevenue) * 100;
      expect(createdNote.marginPercentage).toBe(expectedPercentage);
    });

    it("should handle zero margin correctly", async () => {
      const settlementData = createTestData({
        hourlyRate: 30.0,
        quantity: 1,
        professorSalary: 20.0,
        charges: 10.0,
      });

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      const createdNote = response.body.settlementNote;
      expect(createdNote.marginAmount).toBe(0);
      expect(createdNote.marginPercentage).toBe(0);
    });
  });
});
