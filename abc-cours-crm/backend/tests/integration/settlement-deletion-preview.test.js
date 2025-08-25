const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../server");
const User = require("../../models/User");
const Family = require("../../models/Family");
const Subject = require("../../models/Subject");
const SettlementNote = require("../../models/SettlementNote");
const CouponSeries = require("../../models/CouponSeries");
const jwt = require("jsonwebtoken");

describe("Settlement Deletion Preview API", () => {
  let mongoServer;
  let adminToken;
  let adminUser;
  let testFamily;
  let testSubject;
  let testNote;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Family.deleteMany({});
    await Subject.deleteMany({});
    await SettlementNote.deleteMany({});
    await CouponSeries.deleteMany({});

    // Create admin user
    adminUser = new User({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });
    await adminUser.save();

    // Generate admin token
    adminToken = jwt.sign(
      { userId: adminUser._id, role: "admin" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    // Create test family
    testFamily = new Family({
      primaryContact: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        primaryPhone: "0123456789",
        gender: "M.",
      },
      address: {
        street: "123 Test St",
        city: "Test City",
        postalCode: "75001",
      },
      status: "client",
      demande: {
        beneficiaryType: "eleves",
        subjects: ["Mathématiques"],
        notes: "Test family for deletion preview",
      },
      createdBy: adminUser._id,
    });
    await testFamily.save();

    // Create test subject
    testSubject = new Subject({
      name: "Mathématiques",
      category: "Sciences",
      description: "Cours de mathématiques",
    });
    await testSubject.save();

    // Create test settlement note
    testNote = new SettlementNote({
      familyId: testFamily._id,
      studentIds: [],
      clientName: "John Doe",
      department: "75",
      paymentMethod: "card",
      subjects: [{
        subjectId: testSubject._id,
        hourlyRate: 50.0,
        quantity: 10,
        professorSalary: 30.0,
      }],
      charges: 5.0,
      createdBy: adminUser._id,
    });
    await testNote.save();
  });

  describe("GET /api/settlement-notes/:id/deletion-preview", () => {
    it("should return deletion preview with calculated totalAmount", async () => {
      const response = await request(app)
        .get(`/api/settlement-notes/${testNote._id}/deletion-preview`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("settlementNote");
      expect(response.body).toHaveProperty("itemsToDelete");
      expect(response.body).toHaveProperty("totalItems");

      // Vérifier la structure settlementNote
      const { settlementNote } = response.body;
      expect(settlementNote).toHaveProperty("clientName", "John Doe");
      expect(settlementNote).toHaveProperty("department", "75");
      expect(settlementNote).toHaveProperty("totalAmount");
      expect(settlementNote).toHaveProperty("status");
      expect(settlementNote).toHaveProperty("createdAt");

      // Vérifier que totalAmount est calculé correctement
      // hourlyRate (50) * quantity (10) = 500
      expect(settlementNote.totalAmount).toBe(500);
      expect(typeof settlementNote.totalAmount).toBe("number");
    });

    it("should handle settlement note without coupon series", async () => {
      const response = await request(app)
        .get(`/api/settlement-notes/${testNote._id}/deletion-preview`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { itemsToDelete, totalItems } = response.body;
      
      // Sans série de coupons
      expect(itemsToDelete.couponSeries.count).toBe(0);
      expect(itemsToDelete.couponSeries.details).toEqual([]);
      expect(itemsToDelete.coupons.count).toBe(0);
      expect(itemsToDelete.coupons.availableCount).toBe(0);
      expect(itemsToDelete.coupons.usedCount).toBe(0);
      expect(totalItems).toBe(0);
    });

    it("should handle settlement note with coupon series", async () => {
      // Créer une série de coupons liée à la note
      const couponSeries = new CouponSeries({
        settlementNoteId: testNote._id,
        familyId: testFamily._id,
        subject: testSubject._id, // ObjectId, pas string
        totalCoupons: 20,
        usedCoupons: 5,
        hourlyRate: 50.0,
        professorSalary: 30.0,
        status: "active",
        createdBy: adminUser._id,
      });
      await couponSeries.save();

      const response = await request(app)
        .get(`/api/settlement-notes/${testNote._id}/deletion-preview`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { itemsToDelete, totalItems } = response.body;
      
      // Avec série de coupons
      expect(itemsToDelete.couponSeries.count).toBe(1);
      expect(itemsToDelete.couponSeries.details).toHaveLength(1);
      expect(itemsToDelete.couponSeries.details[0]).toMatchObject({
        totalCoupons: 20,
        usedCoupons: 0, // Aucun coupon individuel créé donc 0 utilisés
        remainingCoupons: 0, // Aucun coupon individuel créé donc 0 restants
        hourlyRate: 50.0,
        status: "active"
      });
      
      expect(itemsToDelete.coupons.count).toBe(0); // Aucun coupon individuel créé
      expect(itemsToDelete.coupons.availableCount).toBe(0);
      expect(itemsToDelete.coupons.usedCount).toBe(0);
      expect(totalItems).toBe(1); // 1 série + 0 coupons individuels
    });

    it("should return 404 for non-existent settlement note", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/settlement-notes/${nonExistentId}/deletion-preview`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error", "Settlement note not found");
    });

    it("should return 400 for invalid settlement note ID", async () => {
      const response = await request(app)
        .get("/api/settlement-notes/invalid-id/deletion-preview")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Invalid settlement note ID");
    });

    it("should handle settlement note with multiple subjects", async () => {
      // Créer une deuxième matière
      const testSubject2 = new Subject({
        name: "Français",
        category: "Littérature",
        description: "Cours de français",
      });
      await testSubject2.save();

      // Créer une note avec plusieurs matières
      const multiSubjectNote = new SettlementNote({
        familyId: testFamily._id,
        studentIds: [],
        clientName: "Jane Doe",
        department: "69",
        paymentMethod: "check",
        subjects: [
          {
            subjectId: testSubject._id,
            hourlyRate: 40.0,
            quantity: 5,
            professorSalary: 25.0,
          },
          {
            subjectId: testSubject2._id,
            hourlyRate: 35.0,
            quantity: 3,
            professorSalary: 20.0,
          }
        ],
        charges: 7.0,
        createdBy: adminUser._id,
      });
      await multiSubjectNote.save();

      const response = await request(app)
        .get(`/api/settlement-notes/${multiSubjectNote._id}/deletion-preview`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { settlementNote } = response.body;
      
      // Vérifier le calcul du montant total
      // Subject 1: 40 * 5 = 200
      // Subject 2: 35 * 3 = 105  
      // Total: 305
      expect(settlementNote.totalAmount).toBe(305);
    });

    it("should require admin authorization", async () => {
      const response = await request(app)
        .get(`/api/settlement-notes/${testNote._id}/deletion-preview`)
        .expect(401);

      expect(response.body).toHaveProperty("message", "Token d'accès requis");
    });

    it("should handle settlement note with zero values gracefully", async () => {
      // Créer une note avec des valeurs minimales (quantity doit être au moins 1)
      const zeroNote = new SettlementNote({
        familyId: testFamily._id,
        studentIds: [],
        clientName: "Zero Test",
        department: "00",
        paymentMethod: "cash",
        subjects: [{
          subjectId: testSubject._id,
          hourlyRate: 0,
          quantity: 1, // Minimum requis par le modèle
          professorSalary: 0,
        }],
        charges: 0,
        createdBy: adminUser._id,
      });
      await zeroNote.save();

      const response = await request(app)
        .get(`/api/settlement-notes/${zeroNote._id}/deletion-preview`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { settlementNote } = response.body;
      
      expect(settlementNote.totalAmount).toBe(0);
      expect(typeof settlementNote.totalAmount).toBe("number");
    });
  });
});