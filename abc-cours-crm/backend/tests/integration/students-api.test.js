// tests/students.test.js - Tests unitaires pour les élèves
const request = require("supertest");
const app = require("../../server");
const Student = require("../../models/Student");
const Family = require("../../models/Family");
const User = require("../../models/User");
const { setupTestDB, teardownTestDB, clearTestDB } = require("../setup");

describe("Students API Tests", () => {
  let testFamily;
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

    // Créer une famille de test pour les élèves
    testFamily = new Family({
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
    await testFamily.save();
  });

  describe("GET /api/students", () => {
    beforeEach(async () => {
      // Créer des élèves de test
      const students = [
        {
          firstName: "Jean",
          lastName: "Dupont",
          contact: {
            email: "jean@student.fr",
            phone: "0123456789",
          },
          dateOfBirth: new Date("2010-05-15"),
          family: testFamily._id,
          school: {
            name: "Collège Jean Moulin",
            level: "collège",
            grade: "4ème",
          },
        },
        {
          firstName: "Marie",
          lastName: "Martin",
          contact: {
            email: "marie@student.fr",
            phone: "0987654321",
          },
          dateOfBirth: new Date("2012-08-20"),
          family: testFamily._id,
          school: {
            name: "École Primaire Victor Hugo",
            level: "primaire",
            grade: "CM2",
          },
        },
      ];

      await Student.insertMany(students);
    });

    it("should get all students", async () => {
      const response = await request(app)
        .get("/api/students")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("students");
      expect(response.body.students).toHaveLength(2);
      // Vérifier que les deux élèves sont présents (ordre peut varier)
      const studentNames = response.body.students.map((s) => s.firstName);
      expect(studentNames).toContain("Jean");
      expect(studentNames).toContain("Marie");
    });

    it("should get students with pagination", async () => {
      const response = await request(app)
        .get("/api/students?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("students");
      expect(response.body.students).toHaveLength(1);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination.total).toBe(2);
    });

    it("should search students by name", async () => {
      const response = await request(app)
        .get("/api/students?search=Jean")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.students).toHaveLength(1);
      expect(response.body.students[0].firstName).toBe("Jean");
    });

    it("should filter students by level", async () => {
      const response = await request(app)
        .get("/api/students?level=" + encodeURIComponent("collège"))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.students).toHaveLength(1);
      expect(response.body.students[0].school.level).toBe("collège");
    });
  });

  describe("GET /api/students/:id", () => {
    let studentId;

    beforeEach(async () => {
      const student = new Student({
        firstName: "Test Student",
        lastName: "Test",
        contact: {
          email: "test@student.fr",
          phone: "0123456789",
        },
        dateOfBirth: new Date("2010-01-01"),
        family: testFamily._id,
        school: {
          name: "Collège Test",
          level: "collège",
          grade: "4ème",
        },
      });
      await student.save();
      studentId = student._id;
    });

    it("should get student by id", async () => {
      const response = await request(app)
        .get(`/api/students/${studentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.student.firstName).toBe("Test Student");
      expect(response.body.student.contact.email).toBe("test@student.fr");
      expect(response.body.student.family._id).toBe(testFamily._id.toString());
    });

    it("should return 404 for non-existent student", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/students/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/students", () => {
    it("should create a new student", async () => {
      const newStudent = {
        firstName: "New Student",
        lastName: "New",
        contact: {
          email: "new@student.fr",
          phone: "0123456789",
        },
        dateOfBirth: "2010-01-01",
        family: testFamily._id,
        school: {
          name: "Collège Test",
          level: "collège",
          grade: "3ème",
        },
      };

      const response = await request(app)
        .post("/api/students")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newStudent)
        .expect(201);

      expect(response.body.student.firstName).toBe("New Student");
      expect(response.body.student.contact.email).toBe("new@student.fr");
      expect(response.body.student).toHaveProperty("_id");
    });

    it("should validate required fields", async () => {
      const invalidStudent = {
        email: "invalid@student.fr",
        // firstName et lastName manquants
      };

      const response = await request(app)
        .post("/api/students")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidStudent)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should validate email format", async () => {
      const invalidStudent = {
        firstName: "Test",
        lastName: "Student",
        email: "invalid-email",
        phone: "0123456789",
        family: testFamily._id,
      };

      const response = await request(app)
        .post("/api/students")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidStudent)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should validate family exists", async () => {
      const invalidStudent = {
        firstName: "Test",
        lastName: "Student",
        email: "test@student.fr",
        phone: "0123456789",
        family: "507f1f77bcf86cd799439011", // ID inexistant
      };

      const response = await request(app)
        .post("/api/students")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidStudent)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/students/:id", () => {
    let studentId;

    beforeEach(async () => {
      const student = new Student({
        firstName: "Original Student",
        lastName: "Original",
        contact: {
          email: "original@student.fr",
          phone: "0123456789",
        },
        dateOfBirth: new Date("2010-01-01"),
        family: testFamily._id,
        school: {
          name: "Collège Original",
          level: "collège",
          grade: "4ème",
        },
      });
      await student.save();
      studentId = student._id;
    });

    it("should update student", async () => {
      const updates = {
        firstName: "Updated Student",
        "school.level": "lycée",
        "school.grade": "2nde",
      };

      const response = await request(app)
        .put(`/api/students/${studentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.student.firstName).toBe("Updated Student");
      expect(response.body.student.school.level).toBe("lycée");
      expect(
        response.body.student.subjects.some((s) => s.name === "Physique")
      ).toBe(true);
      expect(response.body.student.contact.email).toBe("original@student.fr"); // inchangé
    });

    it("should return 404 for non-existent student", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .put(`/api/students/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ firstName: "Updated" })
        .expect(404);
    });
  });

  describe("DELETE /api/students/:id", () => {
    let studentId;

    beforeEach(async () => {
      const student = new Student({
        firstName: "To Delete",
        lastName: "Student",
        contact: {
          email: "delete@student.fr",
          phone: "0123456789",
        },
        dateOfBirth: new Date("2010-01-01"),
        family: testFamily._id,
        school: {
          name: "Collège Delete",
          level: "collège",
          grade: "4ème",
        },
      });
      await student.save();
      studentId = student._id;
    });

    it("should delete student", async () => {
      await request(app)
        .delete(`/api/students/${studentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que l'élève a été supprimé
      const response = await request(app)
        .get(`/api/students/${studentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 404 for non-existent student", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      await request(app)
        .delete(`/api/students/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("GET /api/students/family/:familyId", () => {
    beforeEach(async () => {
      // Créer des élèves pour la même famille
      const students = [
        {
          firstName: "Child 1",
          lastName: "Family",
          contact: {
            email: "child1@family.fr",
          },
          dateOfBirth: new Date("2010-01-01"),
          family: testFamily._id,
          school: {
            name: "Collège Family",
            level: "collège",
            grade: "4ème",
          },
        },
        {
          firstName: "Child 2",
          lastName: "Family",
          contact: {
            email: "child2@family.fr",
          },
          dateOfBirth: new Date("2012-01-01"),
          family: testFamily._id,
          school: {
            name: "Collège Family",
            level: "collège",
            grade: "6ème",
          },
        },
      ];

      await Student.insertMany(students);
    });

    it("should get students by family id", async () => {
      const response = await request(app)
        .get(`/api/students/family/${testFamily._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.students).toHaveLength(2);
      expect(response.body.students[0].family._id).toBe(
        testFamily._id.toString()
      );
      expect(response.body.students[1].family._id).toBe(
        testFamily._id.toString()
      );
    });
  });
});
