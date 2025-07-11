const request = require("supertest");
const app = require("../server-test");
const User = require("../models/User");
const Family = require("../models/Family");
const Student = require("../models/Student");
const Professor = require("../models/Professor");
const CouponSeries = require("../models/CouponSeries");
const Coupon = require("../models/Coupon");
const { setupTestDB, teardownTestDB, clearTestDB } = require("./setup");

describe("Individual Coupons Tests", () => {
  let adminToken;
  let professorToken;
  let adminUser;
  let professorUser;
  let family;
  let student;
  let professor;
  let series;
  let coupon;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Créer les utilisateurs
    adminUser = new User({
      email: "admin@test.fr",
      password: "password123",
      role: "admin",
      firstName: "Admin",
      lastName: "Test",
    });
    await adminUser.save();

    professorUser = new User({
      email: "prof@test.fr",
      password: "password123",
      role: "professor",
      firstName: "Prof",
      lastName: "Test",
    });
    await professorUser.save();

    // Récupérer les tokens
    const [adminLogin, profLogin] = await Promise.all([
      request(app).post("/api/auth/login").send({
        email: "admin@test.fr",
        password: "password123",
      }),
      request(app).post("/api/auth/login").send({
        email: "prof@test.fr",
        password: "password123",
      }),
    ]);

    adminToken = adminLogin.body.token;
    professorToken = profLogin.body.token;

    // Créer les entités
    family = new Family({
      familyName: "Famille Test",
      createdBy: adminUser._id,
    });
    await family.save();

    student = new Student({
      family: family._id,
      firstName: "Jean",
      lastName: "Test",
    });
    await student.save();

    professor = new Professor({
      user: professorUser._id,
      personalInfo: {
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie@test.fr",
      },
      employmentStatus: "employee",
      professional: {
        subjects: [{ name: "Mathématiques", levels: ["lycée"] }],
      },
      status: "active",
      createdBy: adminUser._id,
    });
    await professor.save();

    // Créer une série de coupons
    series = new CouponSeries({
      family: family._id,
      student: student._id,
      professor: professor._id,
      subject: "Mathématiques",
      totalCoupons: 3,
      usedCoupons: 0,
      hourlyRate: 25,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "active",
      createdBy: adminUser._id,
    });
    await series.save();

    // Créer un coupon disponible
    coupon = new Coupon({
      series: series._id,
      couponNumber: 1,
      status: "available",
    });
    await coupon.save();
  });

  describe("POST /api/coupons/:id/use", () => {
    const validSessionData = {
      sessionDate: new Date().toISOString(),
      sessionDuration: 60,
      sessionLocation: "home",
      notes: "Cours sur les équations",
    };

    it("should allow assigned professor to mark coupon as used", async () => {
      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send(validSessionData);

      expect(response.status).toBe(200);
      expect(response.body.coupon.status).toBe("used");
      expect(response.body.coupon.sessionDuration).toBe(60);
      expect(response.body.coupon.sessionLocation).toBe("home");

      // Vérifier que la série a été mise à jour
      const updatedSeries = await CouponSeries.findById(series._id);
      expect(updatedSeries.usedCoupons).toBe(1);
    });

    it("should allow admin to mark coupon as used", async () => {
      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validSessionData);

      expect(response.status).toBe(200);
      expect(response.body.coupon.status).toBe("used");
    });

    it("should reject if coupon is not available", async () => {
      // Marquer d'abord le coupon comme utilisé
      coupon.status = "used";
      await coupon.save();

      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send(validSessionData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Coupon is not available for use");
    });

    it("should reject if series is not active", async () => {
      // Suspendre la série
      series.status = "suspended";
      await series.save();

      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send(validSessionData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Coupon series is not active");
    });

    it("should reject if series has expired", async () => {
      // Expirer la série
      series.expirationDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Hier
      await series.save();

      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send(validSessionData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Coupon series has expired");
    });

    it("should reject unauthorized professor", async () => {
      // Créer un autre professeur
      const otherProfUser = new User({
        email: "other@test.fr",
        password: "password123",
        role: "professor",
        firstName: "Other",
        lastName: "Prof",
      });
      await otherProfUser.save();

      const otherProfLogin = await request(app).post("/api/auth/login").send({
        email: "other@test.fr",
        password: "password123",
      });

      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${otherProfLogin.body.token}`)
        .send(validSessionData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "Only the assigned professor or admin can validate this coupon"
      );
    });

    it("should validate session duration range", async () => {
      const invalidSessionData = {
        ...validSessionData,
        sessionDuration: 20, // Trop court
      };

      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send(invalidSessionData);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain(
        "Session duration must be between 30 and 180 minutes"
      );
    });

    it("should validate session location", async () => {
      const invalidSessionData = {
        ...validSessionData,
        sessionLocation: "invalid_location",
      };

      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/use`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send(invalidSessionData);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain(
        "Valid session location required"
      );
    });
  });

  describe("POST /api/coupons/:id/cancel-usage", () => {
    beforeEach(async () => {
      // Marquer le coupon comme utilisé
      await coupon.markAsUsed(
        {
          sessionDate: new Date(),
          sessionDuration: 60,
          sessionLocation: "home",
          notes: "Test session",
        },
        professorUser._id
      );
    });

    it("should allow admin to cancel coupon usage", async () => {
      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/cancel-usage`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Session was cancelled due to student illness",
        });

      expect(response.status).toBe(200);
      expect(response.body.coupon.status).toBe("available");

      // Vérifier que la série a été mise à jour
      const updatedSeries = await CouponSeries.findById(series._id);
      expect(updatedSeries.usedCoupons).toBe(0);

      // Vérifier que la note d'annulation a été ajoutée
      const updatedCoupon = await Coupon.findById(coupon._id);
      expect(updatedCoupon.notes).toContain("Usage cancelled");
      expect(updatedCoupon.notes).toContain("student illness");
    });

    it("should reject if coupon is not used", async () => {
      // Remettre le coupon comme disponible
      coupon.status = "available";
      await coupon.save();

      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/cancel-usage`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Test cancellation",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Coupon is not marked as used");
    });

    it("should require admin role", async () => {
      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/cancel-usage`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send({
          reason: "Test cancellation",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Insufficient permissions");
    });

    it("should require reason with minimum length", async () => {
      const response = await request(app)
        .post(`/api/coupons/${coupon._id}/cancel-usage`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Too short",
        });

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain(
        "Reason must be at least 5 characters"
      );
    });
  });

  describe("PATCH /api/coupons/:id/rating", () => {
    beforeEach(async () => {
      // Marquer le coupon comme utilisé
      await coupon.markAsUsed(
        {
          sessionDate: new Date(),
          sessionDuration: 60,
          sessionLocation: "home",
        },
        professorUser._id
      );
    });

    it("should allow professor to add rating", async () => {
      const response = await request(app)
        .patch(`/api/coupons/${coupon._id}/rating`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send({
          ratingType: "professor",
          score: 4,
          comment: "Student was well prepared and engaged",
        });

      expect(response.status).toBe(200);

      const updatedCoupon = await Coupon.findById(coupon._id);
      expect(updatedCoupon.rating.professor.score).toBe(4);
      expect(updatedCoupon.rating.professor.comment).toBe(
        "Student was well prepared and engaged"
      );
    });

    it("should allow admin to add student rating", async () => {
      const response = await request(app)
        .patch(`/api/coupons/${coupon._id}/rating`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ratingType: "student",
          score: 5,
          comment: "Excellent teacher, very clear explanations",
        });

      expect(response.status).toBe(200);

      const updatedCoupon = await Coupon.findById(coupon._id);
      expect(updatedCoupon.rating.student.score).toBe(5);
    });

    it("should reject rating for non-used coupon", async () => {
      // Créer un nouveau coupon disponible
      const newCoupon = new Coupon({
        series: series._id,
        couponNumber: 2,
        status: "available",
      });
      await newCoupon.save();

      const response = await request(app)
        .patch(`/api/coupons/${newCoupon._id}/rating`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send({
          ratingType: "professor",
          score: 4,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Can only rate used coupons");
    });

    it("should validate score range", async () => {
      const response = await request(app)
        .patch(`/api/coupons/${coupon._id}/rating`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send({
          ratingType: "professor",
          score: 6, // Trop élevé
        });

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain(
        "Score must be between 1 and 5"
      );
    });
  });

  describe("GET /api/coupons/available/by-series/:seriesId", () => {
    beforeEach(async () => {
      // Créer plusieurs coupons
      const coupons = [
        { series: series._id, couponNumber: 2, status: "available" },
        { series: series._id, couponNumber: 3, status: "available" },
      ];
      await Coupon.insertMany(coupons);
    });

    it("should return available coupons for active series", async () => {
      const response = await request(app)
        .get(`/api/coupons/available/by-series/${series._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.availableCoupons).toHaveLength(3); // 1 initial + 2 nouveaux
      expect(response.body.series.totalCoupons).toBe(3);
      expect(response.body.series.remainingCoupons).toBe(3);
      expect(response.body.count).toBe(3);
    });

    it("should reject for inactive series", async () => {
      series.status = "suspended";
      await series.save();

      const response = await request(app)
        .get(`/api/coupons/available/by-series/${series._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Series is not active");
    });

    it("should return 404 for non-existent series", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/coupons/available/by-series/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Coupon series not found");
    });
  });

  describe("GET /api/coupons/usage-history/:professorId", () => {
    beforeEach(async () => {
      // Créer plusieurs coupons utilisés
      const usedCoupons = [];
      for (let i = 2; i <= 4; i++) {
        const newCoupon = new Coupon({
          series: series._id,
          couponNumber: i,
          status: "used",
          usedDate: new Date(),
          sessionDate: new Date(),
          sessionDuration: 60,
          sessionLocation: "home",
          usedBy: professorUser._id,
        });
        await newCoupon.save();
        usedCoupons.push(newCoupon);
      }
    });

    it("should return usage history for professor", async () => {
      const response = await request(app)
        .get(`/api/coupons/usage-history/${professorUser._id}`)
        .set("Authorization", `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.stats.totalSessions).toBe(3);
      expect(response.body.stats.totalHours).toBe(3); // 3 sessions × 1 heure
      expect(response.body.stats.averageSessionDuration).toBe(60);
    });

    it("should allow admin to view any professor history", async () => {
      const response = await request(app)
        .get(`/api/coupons/usage-history/${professorUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    it("should reject unauthorized professor accessing other history", async () => {
      // Créer un autre professeur
      const otherProfUser = new User({
        email: "other@test.fr",
        password: "password123",
        role: "professor",
        firstName: "Other",
        lastName: "Prof",
      });
      await otherProfUser.save();

      const otherProfLogin = await request(app).post("/api/auth/login").send({
        email: "other@test.fr",
        password: "password123",
      });

      const response = await request(app)
        .get(`/api/coupons/usage-history/${professorUser._id}`)
        .set("Authorization", `Bearer ${otherProfLogin.body.token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Access denied");
    });

    it("should filter by date range", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .get(`/api/coupons/usage-history/${professorUser._id}`)
        .query({
          startDate: tomorrow.toISOString(),
        })
        .set("Authorization", `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0); // Aucun cours demain
    });
  });

  describe("GET /api/coupons", () => {
    beforeEach(async () => {
      // Créer plusieurs coupons avec différents statuts
      const coupons = [
        { series: series._id, couponNumber: 2, status: "available" },
        {
          series: series._id,
          couponNumber: 3,
          status: "used",
          usedBy: professorUser._id,
          sessionDate: new Date(),
        },
      ];
      await Coupon.insertMany(coupons);
    });

    it("should return paginated list of coupons", async () => {
      const response = await request(app)
        .get("/api/coupons")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3); // 1 initial + 2 nouveaux
      expect(response.body.pagination.total).toBe(3);
    });

    it("should filter by status", async () => {
      const response = await request(app)
        .get("/api/coupons?status=available")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2); // Coupons disponibles
      expect(response.body.data.every((c) => c.status === "available")).toBe(
        true
      );
    });

    it("should filter by series", async () => {
      const response = await request(app)
        .get(`/api/coupons?series=${series._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(
        response.body.data.every((c) => c.series._id === series._id.toString())
      ).toBe(true);
    });
  });

  describe("GET /api/coupons/:id", () => {
    it("should return coupon details with populated series", async () => {
      const response = await request(app)
        .get(`/api/coupons/${coupon._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.coupon._id).toBe(coupon._id.toString());
      expect(response.body.coupon.series).toHaveProperty("family");
      expect(response.body.coupon.series).toHaveProperty("student");
      expect(response.body.coupon.series).toHaveProperty("professor");
    });

    it("should return 404 for non-existent coupon", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/coupons/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Coupon not found");
    });

    it("should reject invalid coupon ID", async () => {
      const response = await request(app)
        .get("/api/coupons/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid coupon ID");
    });
  });
});
