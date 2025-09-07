const request = require("supertest");
const app = require("../../integration/app.test");
const User = require("../../../models/User");
const Family = require("../../../models/Family");
const Student = require("../../../models/Student");
const Professor = require("../../../models/Professor");
const CouponSeries = require("../../../models/CouponSeries");
const Coupon = require("../../../models/Coupon");
const { setupTestDB, teardownTestDB, clearTestDB } = require("../../setup");

describe("Coupon Series Tests", () => {
  let adminToken;
  let adminUser;
  let family;
  let student;
  let professor;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Créer un admin de test
    adminUser = new User({
      email: "admin@test.fr",
      password: "password123",
      role: "admin",
      firstName: "Admin",
      lastName: "Test",
    });
    await adminUser.save();

    // Récupérer le token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@test.fr",
      password: "password123",
    });

    adminToken = loginResponse.body.token;

    // Créer les entités de test
    family = new Family({
      familyName: "Famille Test",
      createdBy: adminUser._id,
    });
    await family.save();

    student = new Student({
      family: family._id,
      firstName: "Jean",
      lastName: "Test",
      subjects: [{ name: "Mathématiques", level: "lycée" }],
    });
    await student.save();

    professor = new Professor({
      personalInfo: {
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie@test.fr",
      },
      employmentStatus: "employee",
      professional: {
        subjects: [
          {
            name: "Mathématiques",
            levels: ["lycée"],
            hourlyRate: 25,
          },
        ],
      },
      status: "active",
      createdBy: adminUser._id,
    });
    await professor.save();
  });

  describe("POST /api/coupon-series", () => {
    const validSeriesData = {
      subject: "Mathématiques",
      totalCoupons: 10,
      hourlyRate: 25,
      expirationMonths: 12,
      notes: "Cours de mathématiques niveau lycée",
    };

    it("should create a coupon series with valid data", async () => {
      const seriesData = {
        ...validSeriesData,
        family: family._id,
        student: student._id,
        professor: professor._id,
      };

      const response = await request(app)
        .post("/api/coupon-series")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(seriesData);

      expect(response.status).toBe(201);
      expect(response.body.series.totalCoupons).toBe(10);
      expect(response.body.series.totalAmount).toBe(250); // 10 * 25
      expect(response.body.couponsCreated).toBe(10);

      // Vérifier que les coupons individuels ont été créés
      const coupons = await Coupon.find({ series: response.body.series._id });
      expect(coupons).toHaveLength(10);
      expect(coupons.every((c) => c.status === "available")).toBe(true);
    });

    it("should reject if student does not belong to family", async () => {
      // Créer un autre étudiant dans une autre famille
      const otherFamily = new Family({
        familyName: "Autre Famille",
        createdBy: adminUser._id,
      });
      await otherFamily.save();

      const otherStudent = new Student({
        family: otherFamily._id,
        firstName: "Pierre",
        lastName: "Autre",
      });
      await otherStudent.save();

      const seriesData = {
        ...validSeriesData,
        family: family._id,
        student: otherStudent._id, // Étudiant d'une autre famille
        professor: professor._id,
      };

      const response = await request(app)
        .post("/api/coupon-series")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(seriesData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Student does not belong to this family"
      );
    });

    it("should reject if professor does not teach the subject", async () => {
      const seriesData = {
        ...validSeriesData,
        family: family._id,
        student: student._id,
        professor: professor._id,
        subject: "Français", // Matière non enseignée par ce prof
      };

      const response = await request(app)
        .post("/api/coupon-series")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(seriesData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Professor does not teach this subject");
    });

    it("should calculate expiration date correctly", async () => {
      const seriesData = {
        ...validSeriesData,
        family: family._id,
        student: student._id,
        professor: professor._id,
        expirationMonths: 6,
      };

      const response = await request(app)
        .post("/api/coupon-series")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(seriesData);

      expect(response.status).toBe(201);

      const expirationDate = new Date(response.body.series.expirationDate);
      const expectedDate = new Date();
      expectedDate.setMonth(expectedDate.getMonth() + 6);

      // Vérifier que la date d'expiration est dans le bon mois
      expect(expirationDate.getMonth()).toBe(expectedDate.getMonth());
    });

    it("should require admin role", async () => {
      // Créer un utilisateur professeur
      const profUser = new User({
        email: "prof@test.fr",
        password: "password123",
        role: "professor",
        firstName: "Prof",
        lastName: "Test",
      });
      await profUser.save();

      const profLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "prof@test.fr",
          password: "password123",
        });

      const seriesData = {
        ...validSeriesData,
        family: family._id,
        student: student._id,
        professor: professor._id,
      };

      const response = await request(app)
        .post("/api/coupon-series")
        .set("Authorization", `Bearer ${profLoginResponse.body.token}`)
        .send(seriesData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Insufficient permissions");
    });
  });

  describe("GET /api/coupon-series", () => {
    beforeEach(async () => {
      // Créer quelques séries de test
      const series1 = new CouponSeries({
        family: family._id,
        student: student._id,
        professor: professor._id,
        subject: "Mathématiques",
        totalCoupons: 10,
        usedCoupons: 3,
        hourlyRate: 25,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
        status: "active",
        paymentStatus: "paid",
        createdBy: adminUser._id,
      });
      await series1.save();

      const series2 = new CouponSeries({
        family: family._id,
        student: student._id,
        professor: professor._id,
        subject: "Mathématiques",
        totalCoupons: 5,
        usedCoupons: 5,
        hourlyRate: 25,
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Dans 60 jours
        status: "completed",
        paymentStatus: "paid",
        createdBy: adminUser._id,
      });
      await series2.save();
    });

    it("should return paginated list of series", async () => {
      const response = await request(app)
        .get("/api/coupon-series")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.data[0]).toHaveProperty("remainingCoupons");
      expect(response.body.data[0]).toHaveProperty("usagePercentage");
    });

    it("should filter by status", async () => {
      const response = await request(app)
        .get("/api/coupon-series?status=active")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe("active");
    });

    it("should filter by family", async () => {
      const response = await request(app)
        .get(`/api/coupon-series?family=${family._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/coupon-series/:id", () => {
    let seriesId;

    beforeEach(async () => {
      const series = new CouponSeries({
        family: family._id,
        student: student._id,
        professor: professor._id,
        subject: "Mathématiques",
        totalCoupons: 5,
        usedCoupons: 2,
        hourlyRate: 25,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active",
        createdBy: adminUser._id,
      });
      await series.save();
      seriesId = series._id;

      // Créer quelques coupons
      const coupons = [];
      for (let i = 1; i <= 5; i++) {
        coupons.push({
          series: seriesId,
          couponNumber: i,
          status: i <= 2 ? "used" : "available",
        });
      }
      await Coupon.insertMany(coupons);
    });

    it("should return detailed series with coupons and stats", async () => {
      const response = await request(app)
        .get(`/api/coupon-series/${seriesId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.series.totalCoupons).toBe(5);
      expect(response.body.series.usedCoupons).toBe(2);
      expect(response.body.series.remainingCoupons).toBe(3);
      expect(response.body.coupons).toHaveLength(5);
      expect(response.body.stats).toHaveProperty("totalAmountUsed");
      expect(response.body.stats).toHaveProperty("remainingValue");
    });

    it("should return 404 for non-existent series", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/coupon-series/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/coupon-series/:id/status", () => {
    let seriesId;

    beforeEach(async () => {
      const series = new CouponSeries({
        family: family._id,
        student: student._id,
        professor: professor._id,
        subject: "Mathématiques",
        totalCoupons: 5,
        hourlyRate: 25,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active",
        createdBy: adminUser._id,
      });
      await series.save();
      seriesId = series._id;
    });

    it("should update series status", async () => {
      const response = await request(app)
        .patch(`/api/coupon-series/${seriesId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "suspended",
          reason: "Test suspension",
        });

      expect(response.status).toBe(200);
      expect(response.body.series.status).toBe("suspended");

      // Vérifier en base
      const updatedSeries = await CouponSeries.findById(seriesId);
      expect(updatedSeries.status).toBe("suspended");
      expect(updatedSeries.notes).toContain("Test suspension");
    });

    it("should reject invalid status", async () => {
      const response = await request(app)
        .patch(`/api/coupon-series/${seriesId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "invalid_status",
        });

      expect(response.status).toBe(400);
    });
  });
});
