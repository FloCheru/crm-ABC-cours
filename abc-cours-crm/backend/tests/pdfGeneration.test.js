const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const PaymentNote = require("../models/PaymentNote");
const Family = require("../models/Family");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Professor = require("../models/Professor");
const User = require("../models/User");
const CouponSeries = require("../models/CouponSeries");
const pdfService = require("../services/pdfService");
const { setupTestDB, teardownTestDB, clearTestDB } = require("./setup");

describe("PDF Generation", () => {
  let token;
  let testPaymentNote;
  let testCouponSeries;

  beforeAll(async () => {
    await setupTestDB();
    // Créer un utilisateur de test
    const testUser = new User({
      firstName: "Test",
      lastName: "Admin",
      email: "testadmin@example.com",
      password: "password123",
      role: "admin",
    });
    await testUser.save();

    // Créer une famille de test
    const testFamily = new Family({
      name: "Famille Test",
      address: {
        street: "123 Rue Test",
        city: "Ville Test",
        postalCode: "12345",
      },
      contact: {
        primaryPhone: "0123456789",
        email: "famille@test.com",
      },
    });
    await testFamily.save();

    // Créer un élève de test
    const testStudent = new Student({
      firstName: "Élève",
      lastName: "Test",
      dateOfBirth: new Date("2010-01-01"),
      family: testFamily._id,
      school: {
        name: "École Test",
        level: "collège",
        grade: "6ème",
      },
    });
    await testStudent.save();

    // Créer une matière de test
    const testSubject = new Subject({
      name: "Mathématiques",
      description: "Cours de mathématiques",
      category: "Scientifique",
    });
    await testSubject.save();

    // Créer un professeur de test
    const testProfessor = new Professor({
      user: testUser._id,
      subjects: [
        {
          name: "Mathématiques",
          levels: ["collège", "lycée"],
          experience: 5,
        },
      ],
      hourlyRate: 25,
      status: "active",
    });
    await testProfessor.save();

    // Créer une série de coupons de test
    testCouponSeries = new CouponSeries({
      family: testFamily._id,
      student: testStudent._id,
      subject: testSubject._id,
      professor: testProfessor._id,
      totalCoupons: 10,
      hourlyRate: 25,
      totalAmount: 250,
      expirationDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
      createdBy: testUser._id,
    });
    await testCouponSeries.save();

    // Créer une note de règlement de test
    testPaymentNote = new PaymentNote({
      family: testFamily._id,
      student: testStudent._id,
      subject: testSubject._id,
      studentLevel: "collège",
      couponSeries: testCouponSeries._id,
      professor: testProfessor._id,
      amount: 250,
      paymentMethod: "transfer",
      notes: "Note de test pour PDF",
      paymentReference: "REF123",
      createdBy: testUser._id,
    });
    await testPaymentNote.save();

    // Obtenir un token d'authentification
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "testadmin@example.com",
      password: "password123",
    });

    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("GET /api/payment-notes/:id/pdf", () => {
    it("should generate PDF for a payment note", async () => {
      const response = await request(app)
        .get(`/api/payment-notes/${testPaymentNote._id}/pdf`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("application/pdf");
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.headers["content-disposition"]).toContain(".pdf");
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return 404 for non-existent payment note", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/payment-notes/${fakeId}/pdf`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const response = await request(app).get(
        `/api/payment-notes/${testPaymentNote._id}/pdf`
      );

      expect(response.status).toBe(401);
    });
  });

  describe("PDF Service", () => {
    it("should generate note number correctly", async () => {
      const noteNumber = pdfService.generateNoteNumber(new Date());
      expect(noteNumber).toMatch(/^\d{4}-\d{2}-\d{3}$/);
    });

    it("should format payment method correctly", () => {
      expect(pdfService.getPaymentMethodLabel("transfer")).toBe("Virement");
      expect(pdfService.getPaymentMethodLabel("check")).toBe("Chèque");
      expect(pdfService.getPaymentMethodLabel("card")).toBe("Carte bancaire");
      expect(pdfService.getPaymentMethodLabel("cash")).toBe("Espèces");
    });

    it("should format student level correctly", () => {
      expect(pdfService.getLevelLabel("collège")).toBe("Collège");
      expect(pdfService.getLevelLabel("lycée")).toBe("Lycée");
      expect(pdfService.getLevelLabel("primaire")).toBe("Primaire");
      expect(pdfService.getLevelLabel("supérieur")).toBe("Supérieur");
    });
  });
});
