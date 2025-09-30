const request = require("supertest");
const mongoose = require("mongoose");

// Import du serveur backend et des utilitaires
const NDR = require("../../../backend/models/NDR");
const User = require("../../../backend/models/User");
const Family = require("../../../backend/models/Family");
const Subject = require("../../../backend/models/Subject");
const testDataFactory = require("../../../backend/tests/utils/testDataFactory");
const TestSetup = require("../../../backend/tests/utils/testSetup");

// Import de l'app Express (sans la démarrer sur un port)
let app;

// Setup simple pour charger l'app
function createApp() {
  const express = require("express");
  const cors = require("cors");

  const testApp = express();

  // Middlewares essentiels
  testApp.use(cors());
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: true }));

  // Créer une version des routes sans auth middleware
  const testNdrRouter = express.Router();

  // Import direct du service pour bypasser l'auth
  const { NdrService } = require("../../../backend/services/ndrService");

  // Route POST /api/ndrs (sans auth)
  testNdrRouter.post("/", async (req, res) => {
    try {
      const ndr = await NdrService.createNDR(req.body);
      res.status(201).json({ ndr });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  testApp.use("/api/ndrs", testNdrRouter);

  return testApp;
}

// TESTS E2E
describe("E2E Integration: NdrService - Create NDR Workflow", () => {
  let testUser;
  let testFamily;
  let testSubject;

  beforeAll(async () => {
    // Setup BDD de test
    await TestSetup.beforeAll();

    // Créer l'app Express pour supertest
    app = createApp();

    console.log("🧪 E2E Test Setup: App + MongoDB ready");
  }, 30000);

  afterAll(async () => {
    await TestSetup.afterAll();
  }, 30000);

  beforeEach(async () => {
    // Nettoyage et création d'un utilisateur de test
    await TestSetup.beforeEach();

    const userData = testDataFactory.createTestAdmin();
    testUser = await User.create(userData);

    // Créer une famille de test avec étudiants
    const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
    testFamily = await Family.create(familyData);

    // Créer une matière de test
    testSubject = await Subject.create({
      name: "Mathématiques",
      category: "Scientifique",
      description: "Cours de mathématiques",
    });
  });

  describe("🔄 Complete Workflow: HTTP → Backend → MongoDB → Response", () => {
    it("should handle createNDR() end-to-end workflow with supertest", async () => {
      // === ÉTAPE 1: Données à créer ===
      const newNdrData = {
        familyId: testFamily._id,
        beneficiaries: {
          students: [{ id: testFamily.students[0].id }],
          adult: false,
        },
        paymentMethod: "card",
        paymentType: "avance",
        deadlines: {
          deadlinesNumber: 3,
          deadlinesDay: 15,
        },
        subjects: [{ id: testSubject._id }],
        hourlyRate: 35,
        quantity: 10,
        charges: 50,
        status: "pending",
        notes: "Test NDR creation",
        createdBy: {
          userId: testUser._id,
        },
      };

      console.log(
        `📝 Creating NDR for family: ${testFamily._id}, subject: ${testSubject._id}`
      );

      // === ÉTAPE 2: Appel POST via supertest ===
      const response = await request(app).post("/api/ndrs").send(newNdrData);

      if (response.status !== 201) {
        console.log("🚨 Error response:", response.status, response.body);
      }

      expect(response.status).toBe(201);
      expect(response.headers["content-type"]).toMatch(/json/);

      const result = response.body.ndr;

      // === ÉTAPE 3: Validation création ===
      expect(result._id).toBeDefined();
      expect(result.familyId).toBe(testFamily._id.toString());
      expect(result.beneficiaries.students).toHaveLength(1);
      expect(result.beneficiaries.adult).toBe(false);
      expect(result.paymentMethod).toBe("card");
      expect(result.paymentType).toBe("avance");
      expect(result.deadlines.deadlinesNumber).toBe(3);
      expect(result.deadlines.deadlinesDay).toBe(15);
      expect(result.subjects).toHaveLength(1);
      expect(result.subjects[0].id).toBe(testSubject._id.toString());
      expect(result.hourlyRate).toBe(35);
      expect(result.quantity).toBe(10);
      expect(result.charges).toBe(50);
      expect(result.status).toBe("pending");
      expect(result.notes).toBe("Test NDR creation");
      expect(result.createdBy.userId).toBe(testUser._id.toString());

      // === ÉTAPE 4: Vérification en BDD (round trip complet) ===
      const dbNdr = await NDR.findById(result._id);
      expect(dbNdr).toBeDefined();
      expect(dbNdr.familyId.toString()).toBe(testFamily._id.toString());
      expect(dbNdr.paymentMethod).toBe("card");
      expect(dbNdr.hourlyRate).toBe(35);
      expect(dbNdr.quantity).toBe(10);
      expect(dbNdr.status).toBe("pending");

      // Validation structure complète selon le contrat API
      expect(result).toHaveProperty("_id");
      expect(result).toHaveProperty("familyId");
      expect(result).toHaveProperty("beneficiaries");
      expect(result).toHaveProperty("paymentMethod");
      expect(result).toHaveProperty("subjects");
      expect(result).toHaveProperty("hourlyRate");
      expect(result).toHaveProperty("quantity");
      expect(result).toHaveProperty("charges");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("createdBy");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");

      console.log("✅ NDR created successfully with ID:", result._id);
    }, 15000);

    it("should handle createNDR() with minimal data", async () => {
      // === ÉTAPE 1: Données minimales ===
      const minimalNdrData = {
        familyId: testFamily._id,
        beneficiaries: {
          students: [],
          adult: true,
        },
        paymentMethod: "CESU",
        paymentType: "credit",
        subjects: [{ id: testSubject._id }],
        hourlyRate: 25,
        quantity: 5,
        charges: 0,
        status: "pending",
        createdBy: {
          userId: testUser._id,
        },
      };

      // === ÉTAPE 2: Appel POST via supertest ===
      const response = await request(app)
        .post("/api/ndrs")
        .send(minimalNdrData);

      if (response.status !== 201) {
        console.log("🚨 Minimal data error:", response.status, response.body);
      }

      expect(response.status).toBe(201);
      expect(response.headers["content-type"]).toMatch(/json/);

      const result = response.body.ndr;

      // === ÉTAPE 3: Validation création avec données minimales ===
      expect(result._id).toBeDefined();
      expect(result.familyId).toBe(testFamily._id.toString());
      expect(result.beneficiaries.students).toHaveLength(0);
      expect(result.beneficiaries.adult).toBe(true);
      expect(result.paymentMethod).toBe("CESU");
      expect(result.paymentType).toBe("credit");
      expect(result.charges).toBe(0);
      expect(result.notes).toBeUndefined();
      expect(result.deadlines).toBeUndefined();

      console.log("✅ Minimal NDR created successfully");
    }, 10000);
  });

  describe("🔍 Error Handling E2E", () => {
    it("should handle validation errors correctly", async () => {
      // Données invalides - sans familyId requis
      const invalidNdrData = {
        paymentMethod: "card",
        paymentType: "avance",
        subjects: [{ id: testSubject._id }],
        hourlyRate: 35,
        quantity: 10,
        charges: 50,
      };

      await request(app).post("/api/ndrs").send(invalidNdrData).expect(400);
    });

    it("should handle invalid payment method", async () => {
      const invalidNdrData = {
        familyId: testFamily._id,
        beneficiaries: {
          students: [],
          adult: false,
        },
        paymentMethod: "invalid_method",
        paymentType: "avance",
        subjects: [{ id: testSubject._id }],
        hourlyRate: 35,
        quantity: 10,
        charges: 50,
        status: "pending",
      };

      await request(app).post("/api/ndrs").send(invalidNdrData).expect(400);
    });
  });
});
