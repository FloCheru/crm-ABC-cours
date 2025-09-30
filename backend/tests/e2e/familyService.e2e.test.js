const request = require("supertest");
const mongoose = require("mongoose");

// Import du serveur backend et des utilitaires
const Family = require("../../models/Family");
const User = require("../../models/User");
const testDataFactory = require("../utils/testDataFactory");
const TestSetup = require("../utils/testSetup");

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

  // Routes avec auth bypassé pour tests E2E
  const familyRoutes = require("../../routes/families");

  // Créer une version des routes sans auth middleware
  const testFamilyRouter = express.Router();

  // Import direct du service pour bypasser l'auth
  const FamilyService = require("../../services/familyService");

  // Route GET /api/families (sans auth)
  testFamilyRouter.get("/", async (req, res) => {
    try {
      const families = await FamilyService.getFamilies();
      res.json(families);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Route POST /api/families (sans auth)
  testFamilyRouter.post("/", async (req, res) => {
    try {
      const family = await FamilyService.createFamily(req.body);
      const formattedFamily = await FamilyService.formatFamilyForCache(
        family.toObject()
      );
      res.status(201).json({ family: formattedFamily });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Route DELETE /api/families/:id (sans auth)
  testFamilyRouter.delete("/:id", async (req, res) => {
    try {
      await FamilyService.deleteFamily(req.params.id);
      res.json({ message: "Famille supprimée" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Route GET /api/families/:id (sans auth)
  testFamilyRouter.get("/:id", async (req, res) => {
    try {
      const family = await FamilyService.getFamilyById(req.params.id);
      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }
      res.json({ family });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  testApp.use("/api/families", testFamilyRouter);

  return testApp;
}

// TESTS E2E
describe("E2E Integration: FamilyService Complete Workflow", () => {
  let testUser;

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
  });

  describe("🔄 Complete Workflow: HTTP → Backend → MongoDB → Response", () => {
    it("should handle getFamilies() end-to-end workflow with supertest", async () => {
      // === ÉTAPE 1: Préparer les données en BDD ===
      const family1Data = testDataFactory.createTestFamilyComplete(
        testUser._id
      );
      const family2Data = testDataFactory.createTestFamilyBase(testUser._id, {
        primaryContact: {
          firstName: "Sophie",
          lastName: "Martin",
          email: "sophie.martin@test.com",
          primaryPhone: "0987654321",
          gender: "Mme",
        },
      });

      const dbFamily1 = await Family.create(family1Data);
      const dbFamily2 = await Family.create(family2Data);

      console.log(
        `📝 Created test families: ${dbFamily1._id}, ${dbFamily2._id}`
      );

      // === ÉTAPE 2: Appel HTTP via supertest (simule un appel frontend) ===
      const response = await request(app)
        .get("/api/families")
        .expect(200)
        .expect("Content-Type", /json/);

      const result = response.body;

      // === ÉTAPE 3: Validation du workflow complet ===
      console.log("📊 E2E Result:", {
        count: result.length,
        first: result[0]?.primaryContact.firstName,
      });

      // Vérifications structurelles
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      // Vérification des données complètes (toute la chaîne)
      const retrievedFamily1 = result.find(
        (f) => f._id.toString() === dbFamily1._id.toString()
      );
      const retrievedFamily2 = result.find(
        (f) => f._id.toString() === dbFamily2._id.toString()
      );

      expect(retrievedFamily1).toBeDefined();
      expect(retrievedFamily2).toBeDefined();

      // Validation données famille 1 (complète)
      expect(retrievedFamily1.primaryContact.firstName).toBe("Marie");
      expect(retrievedFamily1.primaryContact.lastName).toBe("Dupont");
      expect(retrievedFamily1.primaryContact.email).toBe("marie@test.com");
      expect(retrievedFamily1.address.city).toBe("Paris");
      expect(retrievedFamily1.students).toHaveLength(1);
      expect(retrievedFamily1.students[0].firstName).toBe("Paul");

      // Validation données famille 2 (base)
      expect(retrievedFamily2.primaryContact.firstName).toBe("Sophie");
      expect(retrievedFamily2.primaryContact.lastName).toBe("Martin");
      expect(retrievedFamily2.students).toEqual([]);

      // Validation structure attendue selon le contrat API
      result.forEach((family) => {
        expect(family).toHaveProperty("_id");
        expect(family).toHaveProperty("primaryContact");
        expect(family).toHaveProperty("address");
        expect(family).toHaveProperty("students");
        expect(family).toHaveProperty("createdAt");
        expect(family).toHaveProperty("updatedAt");
      });
    }, 15000);

    it("should handle createFamily() end-to-end workflow with supertest", async () => {
      // === ÉTAPE 1: Données à créer ===
      const newFamilyData = {
        primaryContact: {
          firstName: "Jean",
          lastName: "Nouveaux",
          primaryPhone: "0123456789",
          email: "jean.nouveaux@test.com",
          gender: "M.",
        },
        address: {
          street: "456 Rue Neuve",
          city: "Lyon",
          postalCode: "69001",
        },
        demande: {
          beneficiaryType: "eleves",
          level: "4ème",
          subjects: [{ id: new mongoose.Types.ObjectId() }],
        },
        billingAddress: {
          street: "456 Rue Neuve",
          city: "Lyon",
          postalCode: "69001",
        },
        status: "prospect",
        prospectStatus: "en_reflexion",
        createdBy: { userId: testUser._id },
      };

      // === ÉTAPE 2: Appel POST via supertest ===
      const response = await request(app)
        .post("/api/families")
        .send(newFamilyData)
        .expect(201)
        .expect("Content-Type", /json/);

      const result = response.body.family;

      // === ÉTAPE 3: Validation création ===
      expect(result._id).toBeDefined();
      expect(result.primaryContact.firstName).toBe("Jean");
      expect(result.primaryContact.lastName).toBe("Nouveaux");

      // === ÉTAPE 4: Vérification en BDD (round trip complet) ===
      const dbFamily = await Family.findById(result._id);
      expect(dbFamily).toBeDefined();
      expect(dbFamily.primaryContact.firstName).toBe("Jean");
    }, 10000);

    it("should handle deleteFamily() end-to-end workflow with supertest", async () => {
      // === ÉTAPE 1: Créer famille en BDD ===
      const familyData = testDataFactory.createTestFamilyBase(testUser._id);
      const dbFamily = await Family.create(familyData);

      // Vérifier existence
      let familyExists = await Family.findById(dbFamily._id);
      expect(familyExists).toBeDefined();

      // === ÉTAPE 2: Appel DELETE via supertest ===
      await request(app).delete(`/api/families/${dbFamily._id}`).expect(200);

      // === ÉTAPE 3: Vérification suppression en BDD ===
      const deletedFamily = await Family.findById(dbFamily._id);
      expect(deletedFamily).toBeNull();
    }, 10000);
  });

  describe("🧪 Test Prospect Creation via Button", () => {
    it("should create test prospect with predefined data via FamilyService.createFamily()", async () => {
      // === ÉTAPE 1: Récupérer subjects via service (comme le frontend) ===
      const familyService = require("../../../frontend/src/services/familyService");
      const subjectService = require("../../../frontend/src/services/subjectService");

      // Créer quelques subjects de test
      const Subject = require("../../models/Subject");
      await Subject.insertMany([
        { name: "Mathématiques" },
        { name: "Français" },
        { name: "Anglais" },
      ]);

      // Récupérer via le service (comme le frontend)
      const subjects = await subjectService.getSubjects();
      const subjectIds = subjects.slice(0, 2).map((s) => ({ id: s._id })); // 2 premiers IDs

      // === ÉTAPE 2: Données exactes du bouton "Prospect test" ===
      const testProspectData = {
        primaryContact: {
          firstName: "Jean",
          lastName: "Dupont",
          primaryPhone: "0123456789",
          email: "jean.dupont@email.com",
          gender: "M.",
          relationship: "père",
        },
        address: {
          street: "123 Rue de la Paix",
          city: "Paris",
          postalCode: "75001",
        },
        demande: {
          beneficiaryType: "eleves",
          level: "5ème",
          subjects: subjectIds,
          notes: "Prospect créé automatiquement pour les tests",
        },
        billingAddress: {
          street: "123 Rue de la Paix",
          city: "Paris",
          postalCode: "75001",
        },
        ndr: [],
        status: "prospect",
        prospectStatus: "en_reflexion",
        notes: "⚡ Prospect de test généré automatiquement",
        createdBy: { userId: testUser._id },
      };

      // === ÉTAPE 3: Appel direct du service (comme le bouton "Prospect test") ===
      const result = await familyService.createFamily(testProspectData);

      // === ÉTAPE 4: Validation du retour du service (doit être formaté) ===
      expect(result._id).toBeDefined();
      expect(result.primaryContact.firstName).toBe("Jean");
      expect(result.primaryContact.lastName).toBe("Dupont");
      expect(result.primaryContact.email).toBe("jean.dupont@email.com");
      expect(result.primaryContact.gender).toBe("M.");
      expect(result.address.street).toBe("123 Rue de la Paix");
      expect(result.address.city).toBe("Paris");
      expect(result.address.postalCode).toBe("75001");
      expect(result.billingAddress.street).toBe("123 Rue de la Paix");
      expect(result.demande.level).toBe("5ème");
      expect(result.demande.beneficiaryType).toBe("eleves");
      expect(result.status).toBe("prospect");
      expect(result.prospectStatus).toBe("en_reflexion");
      expect(result.notes).toBe("⚡ Prospect de test généré automatiquement");

      // === ÉTAPE 5: Vérification persistence en BDD (round trip) ===
      const dbFamily = await Family.findById(result._id);
      expect(dbFamily).toBeDefined();
      expect(dbFamily.primaryContact.firstName).toBe("Jean");
      expect(dbFamily.notes).toBe("⚡ Prospect de test généré automatiquement");
      expect(dbFamily.status).toBe("prospect");
      expect(dbFamily.prospectStatus).toBe("en_reflexion");

      console.log("✅ Test prospect created successfully with ID:", result._id);
    }, 15000);
  });

  describe("🔍 Error Handling E2E", () => {
    it("should handle 404 errors correctly with supertest", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app).get(`/api/families/${fakeId}`).expect(404);
    });
  });
});
