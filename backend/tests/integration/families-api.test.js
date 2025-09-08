// tests/families.test.js - Tests unitaires pour les familles
const request = require("supertest");
const app = require("../../server");
const Family = require("../../models/Family");
const User = require("../../models/User");
const Student = require("../../models/Student");
const { setupTestDB, teardownTestDB, clearTestDB } = require("../setup");

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

  describe("POST /api/families/:id/students", () => {
    let familyId;
    let testFamily;

    beforeEach(async () => {
      // Créer une famille valide avec la nouvelle structure
      const adminUser = await User.findOne({ email: "admin@test.fr" });
      testFamily = new Family({
        address: {
          street: "123 Rue Test",
          city: "Paris",
          postalCode: "75001",
        },
        primaryContact: {
          firstName: "Jean",
          lastName: "Dupont",
          primaryPhone: "0123456789",
          email: "jean@dupont.fr",
          gender: "M.",
        },
        demande: {
          beneficiaryType: "eleves",
          beneficiaryLevel: "6ème",
          subjects: ["Mathématiques"],
        },
        status: "client",
        createdBy: adminUser._id,
      });
      await testFamily.save();
      familyId = testFamily._id;
    });

    it("should add student to existing family", async () => {
      const studentData = {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: "2010-05-15T00:00:00.000Z",
        school: {
          name: "Collège Victor Hugo",
          level: "college",
          grade: "6ème",
        },
        contact: {
          email: "marie@dupont.fr",
          phone: "0123456790",
        },
        courseLocation: {
          type: "domicile",
        },
        availability: "Mercredi après-midi",
        notes: "Élève sérieuse",
        status: "active",
      };

      const response = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(studentData)
        .expect(201);

      expect(response.body).toHaveProperty("message", "Élève ajouté avec succès à la famille");
      expect(response.body.student.firstName).toBe("Marie");
      expect(response.body.student.lastName).toBe("Dupont");
      expect(response.body.student.school.name).toBe("Collège Victor Hugo");
      expect(response.body.student.school.level).toBe("college");
      expect(response.body.student.school.grade).toBe("6ème");
      expect(response.body.student.family).toBe(familyId.toString());

      // Vérifier que l'élève est bien ajouté à la famille
      const updatedFamily = await Family.findById(familyId).populate('students');
      expect(updatedFamily.students).toHaveLength(1);
      expect(updatedFamily.students[0].firstName).toBe("Marie");
    });

    it("should validate required fields", async () => {
      const invalidStudentData = {
        firstName: "Marie",
        // lastName manquant
        dateOfBirth: "2010-05-15T00:00:00.000Z",
      };

      const response = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidStudentData)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Données invalides");
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.some(error => error.msg === "Nom de l'élève requis")).toBe(true);
    });

    it("should validate school level enum", async () => {
      const invalidStudentData = {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: "2010-05-15T00:00:00.000Z",
        school: {
          name: "Collège Victor Hugo",
          level: "invalid_level", // Niveau invalide
          grade: "6ème",
        },
      };

      const response = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidStudentData)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Données invalides");
      expect(response.body.errors.some(error => error.msg === "Niveau scolaire invalide")).toBe(true);
    });

    it("should validate course location type enum", async () => {
      const invalidStudentData = {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: "2010-05-15T00:00:00.000Z",
        school: {
          name: "Collège Victor Hugo",
          level: "college",
          grade: "6ème",
        },
        courseLocation: {
          type: "invalid_type", // Type invalide
        },
      };

      const response = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidStudentData)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Données invalides");
      expect(response.body.errors.some(error => error.msg === "Type de lieu de cours invalide")).toBe(true);
    });

    it("should validate date format", async () => {
      const invalidStudentData = {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: "invalid-date", // Format de date invalide
        school: {
          name: "Collège Victor Hugo",
          level: "college",
          grade: "6ème",
        },
      };

      const response = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidStudentData)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Données invalides");
      expect(response.body.errors.some(error => error.msg === "Date de naissance valide requise")).toBe(true);
    });

    it("should return 404 for non-existent family", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const studentData = {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: "2010-05-15T00:00:00.000Z",
        school: {
          name: "Collège Victor Hugo",
          level: "college",
          grade: "6ème",
        },
      };

      const response = await request(app)
        .post(`/api/families/${fakeId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(studentData)
        .expect(404);

      expect(response.body).toHaveProperty("message", "Famille non trouvée");
    });

    it("should handle multiple students for same family", async () => {
      const student1Data = {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: "2010-05-15T00:00:00.000Z",
        school: {
          name: "Collège Victor Hugo",
          level: "college",
          grade: "6ème",
        },
      };

      const student2Data = {
        firstName: "Pierre",
        lastName: "Dupont",
        dateOfBirth: "2008-03-20T00:00:00.000Z",
        school: {
          name: "Lycée Voltaire",
          level: "lycee",
          grade: "Seconde",
        },
      };

      // Ajouter le premier élève
      const response1 = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(student1Data)
        .expect(201);

      // Ajouter le deuxième élève
      const response2 = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(student2Data)
        .expect(201);

      expect(response1.body.student.firstName).toBe("Marie");
      expect(response2.body.student.firstName).toBe("Pierre");

      // Vérifier que les deux élèves sont bien liés à la famille
      const updatedFamily = await Family.findById(familyId).populate('students');
      expect(updatedFamily.students).toHaveLength(2);
      
      const studentNames = updatedFamily.students.map(s => s.firstName);
      expect(studentNames).toContain("Marie");
      expect(studentNames).toContain("Pierre");
    });

    it("should require admin authorization", async () => {
      // Créer un utilisateur non-admin
      const professorUser = new User({
        email: "prof@test.fr",
        password: "password123",
        role: "professor",
        firstName: "Prof",
        lastName: "Test",
      });
      await professorUser.save();

      // Se connecter avec le professeur
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "prof@test.fr",
        password: "password123",
      });

      const professorToken = loginResponse.body.token;

      const studentData = {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: "2010-05-15T00:00:00.000Z",
        school: {
          name: "Collège Victor Hugo",
          level: "college",
          grade: "6ème",
        },
      };

      // Tenter d'ajouter un élève sans être admin
      const response = await request(app)
        .post(`/api/families/${familyId}/students`)
        .set("Authorization", `Bearer ${professorToken}`)
        .send(studentData)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });
});
