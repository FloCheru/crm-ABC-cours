const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const Family = require("../models/Family");
const User = require("../models/User");
const NDR = require("../models/NDR");
const Subject = require("../models/Subject");

// Import des utilitaires centralisés
const TestSetup = require("./utils/testSetup");
const testDataFactory = require("./utils/testDataFactory");
const CacheManager = require("../cache/cacheManager");

describe("Routes API - Families", () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await TestSetup.beforeAll();
  });

  afterAll(async () => {
    await TestSetup.afterAll();
  });

  beforeEach(async () => {
    await TestSetup.beforeEach();
    testDataFactory.reset();

    // Clear cache before each test
    CacheManager.clear("families");

    // Créer un utilisateur admin de test
    const adminData = testDataFactory.createTestAdmin();
    testUser = await User.create(adminData);

    // Créer le token d'authentification
    authToken = testDataFactory.createAuthToken(testUser);
  });

  describe("GET /api/families", () => {
    it("should return families with correct data format according to dataFlow.md", async () => {
      // Créer des familles de test
      const familiesData = testDataFactory.createMultipleFamilies(
        testUser._id,
        2
      );
      await Family.insertMany(familiesData);

      // Faire la requête GET
      const response = await request(app)
        .get("/api/families")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Vérifications de la structure de réponse
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      // Vérifier la structure de chaque famille selon dataFlow.md
      const family = response.body[0];

      // Champs obligatoires de base
      expect(family).toHaveProperty("_id");
      expect(family).toHaveProperty("primaryContact");
      expect(family).toHaveProperty("address");
      expect(family).toHaveProperty("billingAddress");
      expect(family).toHaveProperty("demande");
      expect(family).toHaveProperty("prospectStatus");
      expect(family).toHaveProperty("createdBy");
      expect(family).toHaveProperty("createdAt");
      expect(family).toHaveProperty("updatedAt");

      // Structure primaryContact
      expect(family.primaryContact).toHaveProperty("firstName");
      expect(family.primaryContact).toHaveProperty("lastName");
      expect(family.primaryContact).toHaveProperty("primaryPhone");
      expect(family.primaryContact).toHaveProperty("email");
      expect(family.primaryContact).toHaveProperty("relation");

      // Structure address
      expect(family.address).toHaveProperty("street");
      expect(family.address).toHaveProperty("city");
      expect(family.address).toHaveProperty("postalCode");

      // Structure billingAddress
      expect(family.billingAddress).toHaveProperty("street");
      expect(family.billingAddress).toHaveProperty("city");
      expect(family.billingAddress).toHaveProperty("postalCode");

      // Structure demande
      expect(family.demande).toHaveProperty("level");
      expect(family.demande).toHaveProperty("subjects");
      expect(Array.isArray(family.demande.subjects)).toBe(true);

      // Structure createdBy (avec populate)
      expect(family.createdBy).toHaveProperty("userId");
      expect(family.createdBy).toHaveProperty("firstName");
      expect(family.createdBy).toHaveProperty("lastName");

      // Vérifier les types de données
      expect(typeof family._id).toBe("string");
      expect(typeof family.primaryContact.firstName).toBe("string");
      expect(typeof family.prospectStatus).toBe("string");
      expect(new Date(family.createdAt)).toBeInstanceOf(Date);
      expect(new Date(family.updatedAt)).toBeInstanceOf(Date);

      // Vérifier les valeurs enum
      expect([
        "en_reflexion",
        "interesse_prof_a_trouver",
        "injoignable",
        "ndr_editee",
        "premier_cours_effectue",
        "rdv_prospect",
        "ne_va_pas_convertir",
      ]).toContain(family.prospectStatus);
    });

    it("should require authentication", async () => {
      // Tenter d'accéder sans token
      await request(app).get("/api/families").expect(401);
    });

    it("should return empty result when no families exist", async () => {
      const response = await request(app)
        .get("/api/families")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe("PATCH /api/families/:id/primary-contact", () => {
    it("should update primary contact successfully", async () => {
      // Créer une famille de test
      const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
      const family = await Family.create(familyData);

      const updateData = {
        firstName: "Jean-Updated",
        lastName: "Martin-Updated",
        primaryPhone: "0987654321",
        email: "jean.updated@test.com",
        relation: "père",
        secondaryPhone: "0123456789",
        birthDate: "1980-05-15",
      };

      const response = await request(app)
        .patch(`/api/families/${family._id}/primary-contact`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Vérifications de la réponse
      expect(response.body).toHaveProperty(
        "message",
        "Contact principal mis à jour avec succès"
      );
      expect(response.body).toHaveProperty("primaryContact");
      expect(response.body.primaryContact.firstName).toBe("Jean-Updated");
      expect(response.body.primaryContact.lastName).toBe("Martin-Updated");
      expect(response.body.primaryContact.primaryPhone).toBe("0987654321");
      expect(response.body.primaryContact.email).toBe("jean.updated@test.com");
      expect(response.body.primaryContact.relation).toBe("père");
    });
  });

  describe("PATCH /api/families/:id/demande", () => {
    it("should update demande successfully", async () => {
      // Créer une famille de test
      const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
      const family = await Family.create(familyData);

      const updateData = {
        level: "Seconde",
        subjects: [
          { id: "60f7b3b3b3b3b3b3b3b3b3b3" },
          { id: "60f7b3b3b3b3b3b3b3b3b3b4" },
        ],
      };

      const response = await request(app)
        .patch(`/api/families/${family._id}/demande`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Vérifications de la réponse
      expect(response.body).toHaveProperty(
        "message",
        "Demande mise à jour avec succès"
      );
      expect(response.body).toHaveProperty("demande");
      expect(response.body.demande.level).toBe("Seconde");
      expect(response.body.demande.subjects).toHaveLength(2);
      expect(response.body.demande.subjects[0].id).toBe(
        "60f7b3b3b3b3b3b3b3b3b3b3"
      );
    });
  });

  describe("PATCH /api/families/:id/address", () => {
    it("should update address successfully", async () => {
      // Créer une famille de test
      const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
      const family = await Family.create(familyData);

      const updateData = {
        street: "456 Avenue des Champs",
        city: "Lyon",
        postalCode: "69001",
      };

      const response = await request(app)
        .patch(`/api/families/${family._id}/address`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Vérifications de la réponse
      expect(response.body).toHaveProperty(
        "message",
        "Adresse mise à jour avec succès"
      );
      expect(response.body).toHaveProperty("address");
      expect(response.body.address.street).toBe("456 Avenue des Champs");
      expect(response.body.address.city).toBe("Lyon");
      expect(response.body.address.postalCode).toBe("69001");
    });
  });

  describe("PATCH /api/families/:id/billing-address", () => {
    it("should update billing address successfully", async () => {
      // Créer une famille de test
      const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
      const family = await Family.create(familyData);

      const updateData = {
        street: "789 Rue de la Facturation",
        city: "Marseille",
        postalCode: "13001",
      };

      const response = await request(app)
        .patch(`/api/families/${family._id}/billing-address`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Vérifications de la réponse
      expect(response.body).toHaveProperty(
        "message",
        "Adresse de facturation mise à jour avec succès"
      );
      expect(response.body).toHaveProperty("billingAddress");
      expect(response.body.billingAddress.street).toBe(
        "789 Rue de la Facturation"
      );
      expect(response.body.billingAddress.city).toBe("Marseille");
      expect(response.body.billingAddress.postalCode).toBe("13001");
    });
  });

  describe("PATCH /api/families/:id/secondary-contact", () => {
    it("should update secondary contact successfully", async () => {
      // Créer une famille de test
      const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
      const family = await Family.create(familyData);

      const updateData = {
        firstName: "Sophie",
        lastName: "Dubois",
        phone: "0145678901",
        email: "sophie.dubois@test.com",
      };

      const response = await request(app)
        .patch(`/api/families/${family._id}/secondary-contact`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Vérifications de la réponse
      expect(response.body).toHaveProperty(
        "message",
        "Contact secondaire mis à jour avec succès"
      );
      expect(response.body).toHaveProperty("secondaryContact");
      expect(response.body.secondaryContact.firstName).toBe("Sophie");
      expect(response.body.secondaryContact.lastName).toBe("Dubois");
      expect(response.body.secondaryContact.phone).toBe("0145678901");
      expect(response.body.secondaryContact.email).toBe(
        "sophie.dubois@test.com"
      );
    });
  });

  describe("PATCH /api/families/:id/company-info", () => {
    it("should update company info successfully", async () => {
      // Créer une famille de test
      const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
      const family = await Family.create(familyData);

      const updateData = {
        urssafNumber: "98765432101",
      };

      const response = await request(app)
        .patch(`/api/families/${family._id}/company-info`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Vérifications de la réponse
      expect(response.body).toHaveProperty(
        "message",
        "Informations entreprise mises à jour avec succès"
      );
      expect(response.body).toHaveProperty("companyInfo");
      expect(response.body.companyInfo.urssafNumber).toBe("98765432101");
    });
  });
});

describe("Routes API - NDR", () => {
  let authToken;
  let testUser;
  let testFamily;
  let testSubject;

  beforeAll(async () => {
    await TestSetup.beforeAll();
  });

  afterAll(async () => {
    await TestSetup.afterAll();
  });

  beforeEach(async () => {
    await TestSetup.beforeEach();
    testDataFactory.reset();

    // Clear cache before each test
    CacheManager.clear("families");
    CacheManager.clear("ndrs");

    // Créer un utilisateur admin de test
    const adminData = testDataFactory.createTestAdmin();
    testUser = await User.create(adminData);

    // Créer le token d'authentification
    authToken = testDataFactory.createAuthToken(testUser);

    // Créer une famille de test
    const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
    testFamily = await Family.create(familyData);

    // Créer une matière de test
    testSubject = await Subject.create({
      name: "Mathématiques",
      description: "Test subject for NDR",
    });
  });

  describe("POST /api/ndrs", () => {
    it("should create NDR successfully with correct data structure", async () => {
      const ndrData = {
        familyId: testFamily._id.toString(),
        beneficiaries: {
          students: [{ id: testFamily.students[0].id }],
          adult: false,
        },
        subjects: [{ id: testSubject._id.toString() }],
        paymentMethod: "card",
        paymentType: "avance",
        hourlyRate: 25,
        quantity: 10,
        charges: 0,
        notes: "Test NDR creation",
        createdBy: {
          userId: testUser._id.toString(),
        },
        status: "brouillon",
      };

      const response = await request(app)
        .post("/api/ndrs")
        .set("Authorization", `Bearer ${authToken}`)
        .send(ndrData)
        .expect(201);

      // Vérifications de la structure de réponse
      expect(response.body).toHaveProperty("message", "NDR créée avec succès");
      expect(response.body).toHaveProperty("ndr");

      const ndr = response.body.ndr;
      expect(ndr).toHaveProperty("_id");
      expect(ndr).toHaveProperty("familyId", testFamily._id.toString());
      expect(ndr).toHaveProperty("beneficiaries");
      expect(ndr).toHaveProperty("subjects");
      expect(ndr).toHaveProperty("paymentMethod", "card");
      expect(ndr).toHaveProperty("paymentType", "avance");
      expect(ndr).toHaveProperty("hourlyRate", 25);
      expect(ndr).toHaveProperty("quantity", 10);
      expect(ndr).toHaveProperty("charges", 0);
      expect(ndr).toHaveProperty("notes", "Test NDR creation");
      expect(ndr).toHaveProperty("createdAt");
      expect(ndr).toHaveProperty("updatedAt");

      // Vérifier la structure des bénéficiaires
      expect(ndr.beneficiaries).toHaveProperty("students");
      expect(ndr.beneficiaries).toHaveProperty("adult", false);
      expect(Array.isArray(ndr.beneficiaries.students)).toBe(true);
      expect(ndr.beneficiaries.students).toHaveLength(1);

      // Vérifier la structure des matières
      expect(Array.isArray(ndr.subjects)).toBe(true);
      expect(ndr.subjects).toHaveLength(1);

      // Vérifier que la NDR est persistée en base
      const savedNDR = await NDR.findById(ndr._id);
      expect(savedNDR).toBeTruthy();
      expect(savedNDR.familyId.toString()).toBe(testFamily._id.toString());
      expect(savedNDR.quantity).toBe(10);
      expect(savedNDR.hourlyRate).toBe(25);

      // Vérifier que les coupons sont correctement créés dans la NDR
      expect(savedNDR).toHaveProperty("coupons");
      expect(Array.isArray(savedNDR.coupons)).toBe(true);
      expect(savedNDR.coupons).toHaveLength(10); // Doit être égal à quantity, pas quantity+1

      // Vérifier la structure des coupons
      savedNDR.coupons.forEach((coupon, index) => {
        expect(coupon).toHaveProperty("code");
        expect(coupon).toHaveProperty("status", "available");
        expect(typeof coupon.code).toBe("string");
        expect(coupon.code).toMatch(/^[A-Z0-9]+$/); // Format code coupon
      });

      // Vérifier l'unicité des codes de coupons
      const codes = savedNDR.coupons.map((c) => c.code);
      const uniqueCodes = [...new Set(codes)];
      expect(uniqueCodes).toHaveLength(codes.length); // Tous les codes doivent être uniques
    });

    it("should require authentication", async () => {
      const ndrData = {
        familyId: testFamily._id.toString(),
        beneficiaries: { students: [], adult: true },
        subjects: [{ id: testSubject._id.toString() }],
        paymentMethod: "card",
        paymentType: "avance",
        hourlyRate: 25,
        quantity: 10,
        charges: 0,
        createdBy: {
          userId: testUser._id.toString(),
        },
        status: "brouillon",
      };

      await request(app).post("/api/ndrs").send(ndrData).expect(401);
    });

    it("should return 400 when required fields are missing", async () => {
      const invalidData = {
        // Missing familyId
        beneficiaries: { students: [], adult: true },
        subjects: [{ id: testSubject._id.toString() }],
      };

      await request(app)
        .post("/api/ndrs")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it("should return 404 when familyId does not exist", async () => {
      const ndrData = {
        familyId: new mongoose.Types.ObjectId().toString(),
        beneficiaries: { students: [], adult: true },
        subjects: [{ id: testSubject._id.toString() }],
        paymentMethod: "card",
        paymentType: "avance",
        hourlyRate: 25,
        quantity: 10,
        charges: 0,
        createdBy: {
          userId: testUser._id.toString(),
        },
        status: "brouillon",
      };

      await request(app)
        .post("/api/ndrs")
        .set("Authorization", `Bearer ${authToken}`)
        .send(ndrData)
        .expect(404);
    });
  });
});
