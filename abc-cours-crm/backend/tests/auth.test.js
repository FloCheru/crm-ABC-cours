// tests/auth.test.js
const request = require("supertest");
const app = require("../server"); // Utiliser le serveur principal
const User = require("../models/User");
const { setupTestDB, teardownTestDB, clearTestDB } = require("./setup");

describe("Authentication Tests", () => {
  beforeAll(async () => {
    await setupTestDB();
  }, 30000); // Timeout plus long

  afterAll(async () => {
    await teardownTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const testUser = new User({
        email: "test@admin.fr",
        password: "password123",
        role: "admin",
        firstName: "Test",
        lastName: "Admin",
      });
      await testUser.save();
    });

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@admin.fr",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("test@admin.fr");
    });

    it("should reject invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "wrong@email.fr",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });
});
