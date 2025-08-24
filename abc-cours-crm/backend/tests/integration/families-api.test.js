// tests/families.test.js - Tests unitaires pour les familles
const request = require("supertest");
const app = require("../server");
const Family = require("../models/Family");
const User = require("../models/User");
const { setupTestDB, teardownTestDB, clearTestDB } = require("./setup");

describe("Families API Tests", () => {
  let authToken;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Créer un utilisateur admin pour l'authentification
    const adminUser = new User({
      email: "admin@test.fr",
      password: "password123",
      role: "admin",
      firstName: "Admin",
      lastName: "Test",
    });
    await adminUser.save();

    // Se connecter pour obtenir le token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@test.fr",
      password: "password123",
    });

    authToken = loginResponse.body.token;
  });

  describe("GET /api/families", () => {
    beforeEach(async () => {
      // Créer des familles de test avec la bonne structure
      const families = [
        {
          name: "Dupont",
          address: {
            street: "123 Rue de la Paix",
            city: "Paris",
            postalCode: "75001",
          },
          contact: {
            primaryPhone: "0123456789",
            email: "dupont@email.fr",
          },
          parents: [
            {
              firstName: "Jean",
              lastName: "Dupont",
              phone: "0123456789",
              email: "jean@dupont.fr",
              isPrimaryContact: true,
            },
          ],
        },
        {
          name: "Martin",
          address: {
            street: "456 Avenue des Champs",
            city: "Lyon",
            postalCode: "69001",
          },
          contact: {
            primaryPhone: "0987654321",
            email: "martin@email.fr",
          },
          parents: [
            {
              firstName: "Marie",
              lastName: "Martin",
              phone: "0987654321",
              email: "marie@martin.fr",
              isPrimaryContact: true,
            },
          ],
        },
      ];

      await Family.insertMany(families);
    });

    it("should get all families", async () => {
      const response = await request(app)
        .get("/api/families")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("families");
      expect(response.body.families).toHaveLength(2);
      // Vérifier que les deux familles sont présentes (ordre peut varier)
      const familyNames = response.body.families.map((f) => f.name);
      expect(familyNames).toContain("Dupont");
      expect(familyNames).toContain("Martin");
    });

    it("should get families with pagination", async () => {
      const response = await request(app)
        .get("/api/families?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("families");
      expect(response.body.families).toHaveLength(1);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination.total).toBe(2);
    });

    it("should search families by name", async () => {
      const response = await request(app)
        .get("/api/families?search=Dupont")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.families).toHaveLength(1);
      expect(response.body.families[0].name).toBe("Dupont");
    });
  });

  describe("GET /api/families/:id", () => {
    let familyId;

    beforeEach(async () => {
      const family = new Family({
        name: "Test Family",
        address: {
          street: "Test Street",
          city: "Test City",
          postalCode: "12345",
        },
        contact: {
          primaryPhone: "0123456789",
          email: "test@family.fr",
        },
        parents: [
          {
            firstName: "Test",
            lastName: "Parent",
            phone: "0123456789",
            email: "test@parent.fr",
            isPrimaryContact: true,
          },
        ],
      });
      await family.save();
      familyId = family._id;
    });

    it("should get family by id", async () => {
      // Vérifier que la famille existe bien
      const familyExists = await Family.findById(familyId);
      expect(familyExists).toBeTruthy();

      const response = await request(app)
        .get(`/api/families/${familyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.family.name).toBe("Test Family");
      expect(response.body.family.contact.email).toBe("test@family.fr");
    });

    it("should return 404 for non-existent family", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/families/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/families", () => {
    it("should create a new family", async () => {
      const newFamily = {
        address: {
          street: "New Street",
          city: "New City",
          postalCode: "54321",
        },
        primaryContact: {
          firstName: "New",
          lastName: "Parent",
          primaryPhone: "0123456789",
          email: "new@family.fr",
        },
        status: "prospect",
      };

      const response = await request(app)
        .post("/api/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newFamily)
        .expect(201);

      expect(response.body.family.primaryContact.firstName).toBe("New");
      expect(response.body.family.primaryContact.lastName).toBe("Parent");
      expect(response.body.family.primaryContact.email).toBe("new@family.fr");
      expect(response.body.family).toHaveProperty("_id");
    });

    it("should validate required fields", async () => {
      const invalidFamily = {
        name: "Test Family",
        // Adresse et contact manquants
      };

      const response = await request(app)
        .post("/api/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidFamily)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should validate email format", async () => {
      const invalidFamily = {
        address: {
          street: "Test Street",
          city: "Test City",
          postalCode: "12345",
        },
        primaryContact: {
          firstName: "Test",
          lastName: "Parent", 
          primaryPhone: "0123456789",
          email: "invalid-email",
        },
      };

      const response = await request(app)
        .post("/api/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidFamily)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/families/:id", () => {
    let familyId;

    beforeEach(async () => {
      const family = new Family({
        name: "Original Family",
        address: {
          street: "Original Street",
          city: "Original City",
          postalCode: "12345",
        },
        contact: {
          primaryPhone: "0123456789",
          email: "original@family.fr",
        },
        parents: [
          {
            firstName: "Original",
            lastName: "Parent",
            phone: "0123456789",
            email: "original@parent.fr",
            isPrimaryContact: true,
          },
        ],
      });
      await family.save();
      familyId = family._id;
    });

    it("should update family", async () => {
      const updates = {
        name: "Updated Family",
        "contact.primaryPhone": "0987654321",
      };

      const response = await request(app)
        .put(`/api/families/${familyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.family.name).toBe("Updated Family");
      expect(response.body.family.contact.primaryPhone).toBe("0987654321");
      expect(response.body.family.contact.email).toBe("original@family.fr"); // inchangé
    });

    it("should return 404 for non-existent family", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .put(`/api/families/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated" })
        .expect(404);
    });
  });

  describe("DELETE /api/families/:id", () => {
    let familyId;

    beforeEach(async () => {
      const family = new Family({
        name: "To Delete",
        address: {
          street: "Delete Street",
          city: "Delete City",
          postalCode: "12345",
        },
        contact: {
          primaryPhone: "0123456789",
          email: "delete@family.fr",
        },
        parents: [
          {
            firstName: "Delete",
            lastName: "Parent",
            phone: "0123456789",
            email: "delete@parent.fr",
            isPrimaryContact: true,
          },
        ],
      });
      await family.save();
      familyId = family._id;
    });

    it("should delete family", async () => {
      await request(app)
        .delete(`/api/families/${familyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que la famille a été supprimée
      const response = await request(app)
        .get(`/api/families/${familyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 404 for non-existent family", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      await request(app)
        .delete(`/api/families/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
