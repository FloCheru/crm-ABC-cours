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

describe("Payment Notes API", () => {
  let token;
  let testFamily;
  let testStudent;
  let testSubject;
  let testProfessor;
  let testUser;
  let testCouponSeries;

  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = new User({
      firstName: "Test",
      lastName: "Admin",
      email: "testadmin@example.com",
      password: "password123",
      role: "admin",
    });
    await testUser.save();

    // Créer une famille de test
    testFamily = new Family({
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
      parents: [
        {
          firstName: "Parent",
          lastName: "Test",
          phone: "0123456789",
          email: "parent@test.com",
          isPrimaryContact: true,
        },
      ],
    });
    await testFamily.save();

    // Créer un élève de test
    testStudent = new Student({
      firstName: "Élève",
      lastName: "Test",
      dateOfBirth: new Date("2010-01-01"),
      family: testFamily._id,
      school: {
        name: "École Test",
        level: "collège",
        grade: "6ème",
      },
      subjects: [
        {
          name: "Mathématiques",
          level: "intermédiaire",
        },
      ],
    });
    await testStudent.save();

    // Créer une matière de test
    testSubject = new Subject({
      name: "Mathématiques",
      description: "Cours de mathématiques",
      category: "Scientifique",
    });
    await testSubject.save();

    // Créer un professeur de test
    testProfessor = new Professor({
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
      expirationDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 mois
      createdBy: testUser._id,
    });
    await testCouponSeries.save();

    // Obtenir un token d'authentification
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "testadmin@example.com",
      password: "password123",
    });

    token = loginResponse.body.token;
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await PaymentNote.deleteMany({});
    await CouponSeries.deleteMany({});
    await Professor.deleteMany({});
    await Student.deleteMany({});
    await Family.deleteMany({});
    await Subject.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await PaymentNote.deleteMany({});
  });

  describe("POST /api/payment-notes", () => {
    it("should create a new payment note", async () => {
      const paymentNoteData = {
        family: testFamily._id.toString(),
        student: testStudent._id.toString(),
        subject: testSubject._id.toString(),
        studentLevel: "collège",
        couponSeries: testCouponSeries._id.toString(),
        professor: testProfessor._id.toString(),
        amount: 100,
        paymentMethod: "transfer",
        notes: "Note de test",
        paymentReference: "REF123",
      };

      const response = await request(app)
        .post("/api/payment-notes")
        .set("Authorization", `Bearer ${token}`)
        .send(paymentNoteData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.family.name).toBe("Famille Test");
      expect(response.body.student.firstName).toBe("Élève");
      expect(response.body.subject.name).toBe("Mathématiques");
      expect(response.body.amount).toBe(100);
      expect(response.body.status).toBe("pending");
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/payment-notes")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Tous les champs obligatoires");
    });
  });

  describe("GET /api/payment-notes", () => {
    it("should get all payment notes", async () => {
      // Créer une note de règlement de test
      const paymentNote = new PaymentNote({
        family: testFamily._id,
        student: testStudent._id,
        subject: testSubject._id,
        studentLevel: "collège",
        couponSeries: testCouponSeries._id,
        professor: testProfessor._id,
        amount: 100,
        paymentMethod: "transfer",
        createdBy: testUser._id,
      });
      await paymentNote.save();

      const response = await request(app)
        .get("/api/payment-notes")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].amount).toBe(100);
    });
  });

  describe("GET /api/payment-notes/:id", () => {
    it("should get a specific payment note", async () => {
      const paymentNote = new PaymentNote({
        family: testFamily._id,
        student: testStudent._id,
        subject: testSubject._id,
        studentLevel: "collège",
        couponSeries: testCouponSeries._id,
        professor: testProfessor._id,
        amount: 100,
        paymentMethod: "transfer",
        createdBy: testUser._id,
      });
      await paymentNote.save();

      const response = await request(app)
        .get(`/api/payment-notes/${paymentNote._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(paymentNote._id.toString());
    });

    it("should return 404 for non-existent payment note", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/payment-notes/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/payment-notes/:id/mark-paid", () => {
    it("should mark a payment note as paid", async () => {
      const paymentNote = new PaymentNote({
        family: testFamily._id,
        student: testStudent._id,
        subject: testSubject._id,
        studentLevel: "collège",
        couponSeries: testCouponSeries._id,
        professor: testProfessor._id,
        amount: 100,
        paymentMethod: "transfer",
        createdBy: testUser._id,
      });
      await paymentNote.save();

      const response = await request(app)
        .patch(`/api/payment-notes/${paymentNote._id}/mark-paid`)
        .set("Authorization", `Bearer ${token}`)
        .send({ paymentDate: new Date().toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("paid");
      expect(response.body.paymentDate).toBeDefined();
    });
  });

  describe("PATCH /api/payment-notes/:id/cancel", () => {
    it("should cancel a payment note", async () => {
      const paymentNote = new PaymentNote({
        family: testFamily._id,
        student: testStudent._id,
        subject: testSubject._id,
        studentLevel: "collège",
        couponSeries: testCouponSeries._id,
        professor: testProfessor._id,
        amount: 100,
        paymentMethod: "transfer",
        createdBy: testUser._id,
      });
      await paymentNote.save();

      const response = await request(app)
        .patch(`/api/payment-notes/${paymentNote._id}/cancel`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("cancelled");
    });
  });

  describe("GET /api/payment-notes/families/:familyId", () => {
    it("should get payment notes for a specific family", async () => {
      const paymentNote = new PaymentNote({
        family: testFamily._id,
        student: testStudent._id,
        subject: testSubject._id,
        studentLevel: "collège",
        couponSeries: testCouponSeries._id,
        professor: testProfessor._id,
        amount: 100,
        paymentMethod: "transfer",
        createdBy: testUser._id,
      });
      await paymentNote.save();

      const response = await request(app)
        .get(`/api/payment-notes/families/${testFamily._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].family._id).toBe(testFamily._id.toString());
    });
  });

  describe("GET /api/payment-notes/students/:studentId", () => {
    it("should get payment notes for a specific student", async () => {
      const paymentNote = new PaymentNote({
        family: testFamily._id,
        student: testStudent._id,
        subject: testSubject._id,
        studentLevel: "collège",
        couponSeries: testCouponSeries._id,
        professor: testProfessor._id,
        amount: 100,
        paymentMethod: "transfer",
        createdBy: testUser._id,
      });
      await paymentNote.save();

      const response = await request(app)
        .get(`/api/payment-notes/students/${testStudent._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].student._id).toBe(testStudent._id.toString());
    });
  });
});
