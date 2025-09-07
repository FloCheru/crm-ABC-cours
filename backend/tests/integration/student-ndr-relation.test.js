const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const Student = require("../../models/Student");
const Family = require("../../models/Family");
const SettlementNote = require("../../models/SettlementNote");
const Subject = require("../../models/Subject");
const User = require("../../models/User");
const { setupTestDB, teardownTestDB, clearTestDB } = require("../setup");

describe("🔗 Relation bidirectionnelle Student ↔ NDR", () => {
  let adminToken;
  let testFamily;
  let testStudents;
  let testSubjects;
  let testUser;

  beforeAll(async () => {
    await setupTestDB();
    console.log("🧪 Base de données test initialisée");
  });

  beforeEach(async () => {
    await clearTestDB();

    // Créer un utilisateur admin pour les tests
    testUser = new User({
      firstName: "Admin",
      lastName: "Test",  
      email: "admin@test.com",
      password: "password123",
      role: "admin"
    });
    await testUser.save();

    // Se connecter pour obtenir le token
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        password: "password123"
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toBeDefined();
    
    adminToken = loginResponse.body.accessToken; // Utiliser accessToken au lieu de token
    console.log("🧪 Token reçu:", adminToken ? "✅" : "❌");

    // Créer les matières de test
    testSubjects = await Subject.create([
      {
        name: "Mathématiques",
        category: "scientific",
        description: "Cours de mathématiques"
      },
      {
        name: "Français",
        category: "language",
        description: "Cours de français"
      }
    ]);

    // Créer une famille de test
    testFamily = await Family.create({
      primaryContact: {
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@test.com",
        primaryPhone: "0123456789",
        gender: "M."
      },
      address: {
        street: "123 Rue de la Paix",
        city: "Paris",
        postalCode: "75001"
      },
      demande: {
        beneficiaryType: "eleves",
        beneficiaryLevel: "4ème"
      },
      status: "prospect",
      createdBy: testUser._id
    });

    // Créer des étudiants de test
    testStudents = await Student.create([
      {
        firstName: "Pierre",
        lastName: "Dupont",
        dateOfBirth: new Date("2005-03-15"),
        family: testFamily._id,
        school: {
          name: "Collège Victor Hugo",
          level: "college",
          grade: "4ème"
        },
        status: "active"
      },
      {
        firstName: "Marie",
        lastName: "Dupont",
        dateOfBirth: new Date("2007-08-20"),
        family: testFamily._id,
        school: {
          name: "École Primaire",
          level: "primaire",
          grade: "CM2"
        },
        status: "active"
      }
    ]);

    console.log("🧪 Données de test créées:", {
      familyId: testFamily._id,
      studentIds: testStudents.map(s => s._id),
      subjectIds: testSubjects.map(s => s._id)
    });
  });

  afterAll(async () => {
    await teardownTestDB();
    console.log("🧪 Base de données test fermée");
  });

  describe("✅ Création NDR → Mise à jour Student.settlementNoteIds", () => {
    test("Doit ajouter l'ID de la NDR aux étudiants lors de la création", async () => {
      // Créer une NDR avec les étudiants
      const ndrData = {
        familyId: testFamily._id,
        studentIds: testStudents.map(s => s._id),
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        paymentType: "immediate_advance",
        subjects: [
          {
            subjectId: testSubjects[0]._id,
            hourlyRate: 30,
            quantity: 10,
            professorSalary: 20
          }
        ],
        charges: 50
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(ndrData);

      expect(response.status).toBe(201);
      expect(response.body.settlementNote).toBeDefined();
      
      const ndrId = response.body.settlementNote._id;

      // Vérifier que les étudiants ont bien été mis à jour
      const updatedStudents = await Student.find({
        _id: { $in: testStudents.map(s => s._id) }
      }).lean();

      // Chaque étudiant doit avoir l'ID de la NDR dans settlementNoteIds
      updatedStudents.forEach(student => {
        expect(student.settlementNoteIds).toBeDefined();
        expect(student.settlementNoteIds.map(id => id.toString())).toContain(ndrId);
        console.log(`✅ Étudiant ${student.firstName}: settlementNoteIds = ${student.settlementNoteIds}`);
      });

      console.log("✅ Test création NDR → mise à jour étudiants: SUCCÈS");
    });

    test("Doit fonctionner même avec un tableau d'étudiants vide", async () => {
      // Créer une NDR sans étudiants (famille seule)
      const ndrData = {
        familyId: testFamily._id,
        studentIds: [], // Pas d'étudiants
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        paymentType: "immediate_advance",
        subjects: [
          {
            subjectId: testSubjects[0]._id,
            hourlyRate: 30,
            quantity: 10,
            professorSalary: 20
          }
        ],
        charges: 50
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(ndrData);

      expect(response.status).toBe(201);
      
      // Vérifier que les étudiants n'ont pas été modifiés
      const unchangedStudents = await Student.find({
        _id: { $in: testStudents.map(s => s._id) }
      }).lean();

      unchangedStudents.forEach(student => {
        expect(student.settlementNoteIds).toHaveLength(0);
      });

      console.log("✅ Test NDR famille seule: SUCCÈS");
    });

    test("Doit gérer les étudiants inexistants sans échouer", async () => {
      const fakeStudentId = new mongoose.Types.ObjectId();
      
      const ndrData = {
        familyId: testFamily._id,
        studentIds: [testStudents[0]._id, fakeStudentId], // Un étudiant réel + un fake
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        paymentType: "immediate_advance",
        subjects: [
          {
            subjectId: testSubjects[0]._id,
            hourlyRate: 30,
            quantity: 10,
            professorSalary: 20
          }
        ],
        charges: 50
      };

      const response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(ndrData);

      expect(response.status).toBe(201);
      
      const ndrId = response.body.settlementNote._id;

      // Vérifier que seul l'étudiant réel a été mis à jour
      const realStudent = await Student.findById(testStudents[0]._id).lean();
      expect(realStudent.settlementNoteIds.map(id => id.toString())).toContain(ndrId);
      
      // L'étudiant fake n'existe pas, donc pas d'erreur mais pas de mise à jour non plus
      const fakeStudent = await Student.findById(fakeStudentId).lean();
      expect(fakeStudent).toBeNull();

      console.log("✅ Test étudiants inexistants: SUCCÈS");
    });
  });

  describe("🗑️ Suppression NDR → Nettoyage Student.settlementNoteIds", () => {
    let createdNDR;

    beforeEach(async () => {
      // Créer une NDR pour les tests de suppression
      const ndrData = {
        familyId: testFamily._id,
        studentIds: testStudents.map(s => s._id),
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "card",
        paymentType: "immediate_advance",
        subjects: [
          {
            subjectId: testSubjects[0]._id,
            hourlyRate: 30,
            quantity: 10,
            professorSalary: 20
          }
        ],
        charges: 50,
        createdBy: testUser._id
      };

      createdNDR = await SettlementNote.create(ndrData);

      // Mettre à jour manuellement les étudiants pour simuler la relation
      await Student.updateMany(
        { _id: { $in: testStudents.map(s => s._id) } },
        { $push: { settlementNoteIds: createdNDR._id } }
      );

      console.log("🧪 NDR créée pour test suppression:", createdNDR._id);
    });

    test("Doit nettoyer les références dans les étudiants lors de la suppression", async () => {
      // Vérifier que les étudiants ont bien l'ID de la NDR avant suppression
      const studentsBeforeDelete = await Student.find({
        _id: { $in: testStudents.map(s => s._id) }
      }).lean();

      studentsBeforeDelete.forEach(student => {
        expect(student.settlementNoteIds.map(id => id.toString())).toContain(createdNDR._id.toString());
      });

      // Supprimer la NDR
      const response = await request(app)
        .delete(`/api/settlement-notes/${createdNDR._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Vérifier que les références ont été nettoyées
      const studentsAfterDelete = await Student.find({
        _id: { $in: testStudents.map(s => s._id) }
      }).lean();

      studentsAfterDelete.forEach(student => {
        expect(student.settlementNoteIds.map(id => id.toString())).not.toContain(createdNDR._id.toString());
        console.log(`✅ Étudiant ${student.firstName}: settlementNoteIds nettoyées = ${student.settlementNoteIds}`);
      });

      // Vérifier que la NDR a bien été supprimée
      const deletedNDR = await SettlementNote.findById(createdNDR._id);
      expect(deletedNDR).toBeNull();

      console.log("✅ Test suppression NDR → nettoyage étudiants: SUCCÈS");
    });

    test("Doit préserver les autres références NDR lors de la suppression", async () => {
      // Créer une deuxième NDR
      const ndr2Data = {
        familyId: testFamily._id,
        studentIds: [testStudents[0]._id], // Seulement le premier étudiant
        clientName: "Jean Dupont",
        department: "75",
        paymentMethod: "check",
        paymentType: "immediate_advance",
        subjects: [
          {
            subjectId: testSubjects[1]._id,
            hourlyRate: 25,
            quantity: 8,
            professorSalary: 18
          }
        ],
        charges: 40,
        createdBy: testUser._id
      };

      const createdNDR2 = await SettlementNote.create(ndr2Data);

      // Mettre à jour le premier étudiant avec la deuxième NDR
      await Student.findByIdAndUpdate(
        testStudents[0]._id,
        { $push: { settlementNoteIds: createdNDR2._id } }
      );

      // Vérifier que le premier étudiant a les deux NDR
      const studentBefore = await Student.findById(testStudents[0]._id).lean();
      expect(studentBefore.settlementNoteIds.map(id => id.toString())).toContain(createdNDR._id.toString());
      expect(studentBefore.settlementNoteIds.map(id => id.toString())).toContain(createdNDR2._id.toString());

      // Supprimer la première NDR
      const response = await request(app)
        .delete(`/api/settlement-notes/${createdNDR._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Vérifier que seule la première référence a été supprimée
      const studentAfter = await Student.findById(testStudents[0]._id).lean();
      expect(studentAfter.settlementNoteIds.map(id => id.toString())).not.toContain(createdNDR._id.toString());
      expect(studentAfter.settlementNoteIds.map(id => id.toString())).toContain(createdNDR2._id.toString()); // Préservée

      console.log("✅ Test préservation autres références: SUCCÈS");
    });
  });

  describe("🔄 Cohérence des données", () => {
    test("Doit maintenir la cohérence après opérations multiples", async () => {
      console.log("🧪 Test cohérence - Création de 2 NDR...");

      // Créer la première NDR avec les deux étudiants
      const ndr1Response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          familyId: testFamily._id,
          studentIds: [testStudents[0]._id, testStudents[1]._id],
          clientName: "Jean Dupont",
          department: "75",
          paymentMethod: "card",
          paymentType: "immediate_advance",
          subjects: [{ subjectId: testSubjects[0]._id, hourlyRate: 30, quantity: 10, professorSalary: 20 }],
          charges: 50
        });

      expect(ndr1Response.status).toBe(201);
      const ndr1Id = ndr1Response.body.settlementNote._id;

      // Attendre pour éviter la concurrence
      await new Promise(resolve => setTimeout(resolve, 500));

      // Créer une deuxième NDR avec seulement le premier étudiant
      const ndr2Response = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          familyId: testFamily._id,
          studentIds: [testStudents[0]._id], // Seulement le premier
          clientName: "Jean Dupont 2",
          department: "75",
          paymentMethod: "check",
          paymentType: "immediate_advance",
          subjects: [{ subjectId: testSubjects[1]._id, hourlyRate: 25, quantity: 5, professorSalary: 18 }],
          charges: 30
        });

      expect(ndr2Response.status).toBe(201);
      const ndr2Id = ndr2Response.body.settlementNote._id;

      console.log("🧪 NDR créées:", { ndr1Id, ndr2Id });

      // Vérifier la cohérence des références
      const student1 = await Student.findById(testStudents[0]._id).lean();
      const student2 = await Student.findById(testStudents[1]._id).lean();

      // Étudiant 1 doit avoir NDR1 et NDR2
      expect(student1.settlementNoteIds).toHaveLength(2);
      expect(student1.settlementNoteIds.map(id => id.toString())).toContain(ndr1Id);
      expect(student1.settlementNoteIds.map(id => id.toString())).toContain(ndr2Id);

      // Étudiant 2 doit avoir seulement NDR1
      expect(student2.settlementNoteIds).toHaveLength(1);
      expect(student2.settlementNoteIds.map(id => id.toString())).toContain(ndr1Id);
      expect(student2.settlementNoteIds.map(id => id.toString())).not.toContain(ndr2Id);

      console.log("✅ Cohérence après créations multiples vérifiée");

      // Supprimer NDR2
      console.log("🧪 Suppression NDR2...");
      const deleteResponse = await request(app)
        .delete(`/api/settlement-notes/${ndr2Id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);

      // Vérifier que seule la référence NDR2 a été supprimée
      const student1After = await Student.findById(testStudents[0]._id).lean();
      const student2After = await Student.findById(testStudents[1]._id).lean();

      // Étudiant 1 ne doit plus avoir que NDR1
      expect(student1After.settlementNoteIds).toHaveLength(1);
      expect(student1After.settlementNoteIds.map(id => id.toString())).toContain(ndr1Id);
      expect(student1After.settlementNoteIds.map(id => id.toString())).not.toContain(ndr2Id);

      // Étudiant 2 doit toujours avoir seulement NDR1
      expect(student2After.settlementNoteIds).toHaveLength(1);
      expect(student2After.settlementNoteIds.map(id => id.toString())).toContain(ndr1Id);

      console.log("✅ Test cohérence après opérations multiples: SUCCÈS");
    });

    test("Doit valider l'index MongoDB sur settlementNoteIds", async () => {
      // Créer une NDR
      const ndrResponse = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          familyId: testFamily._id,
          studentIds: testStudents.map(s => s._id),
          clientName: "Jean Dupont",
          department: "75",
          paymentMethod: "card",
          paymentType: "immediate_advance",
          subjects: [{ subjectId: testSubjects[0]._id, hourlyRate: 30, quantity: 10, professorSalary: 20 }],
          charges: 50
        });

      const ndrId = ndrResponse.body.settlementNote._id;

      // Tester une requête qui utilise l'index settlementNoteIds
      const studentsWithNDR = await Student.find({
        settlementNoteIds: ndrId
      }).lean();

      expect(studentsWithNDR).toHaveLength(2);
      expect(studentsWithNDR.map(s => s._id.toString()).sort()).toEqual(
        testStudents.map(s => s._id.toString()).sort()
      );

      // Vérifier que les index existent
      const indexes = await Student.collection.getIndexes();
      const hasSettlementNoteIndex = Object.keys(indexes).some(indexName => 
        indexes[indexName].some(field => field[0] === 'settlementNoteIds')
      );

      expect(hasSettlementNoteIndex).toBe(true);

      console.log("✅ Test validation index MongoDB: SUCCÈS");
    });
  });

  describe("🔍 Population et références", () => {
    test("Doit pouvoir faire un populate des NDR depuis un étudiant", async () => {
      // Créer une NDR
      const ndrResponse = await request(app)
        .post("/api/settlement-notes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          familyId: testFamily._id,
          studentIds: [testStudents[0]._id],
          clientName: "Jean Dupont",
          department: "75",
          paymentMethod: "card",
          paymentType: "immediate_advance",
          subjects: [{ subjectId: testSubjects[0]._id, hourlyRate: 30, quantity: 10, professorSalary: 20 }],
          charges: 50
        });

      const ndrId = ndrResponse.body.settlementNote._id;

      // Récupérer l'étudiant avec populate des NDR
      const studentWithNDR = await Student.findById(testStudents[0]._id)
        .populate('settlementNoteIds')
        .lean();

      expect(studentWithNDR.settlementNoteIds).toHaveLength(1);
      expect(studentWithNDR.settlementNoteIds[0]._id.toString()).toBe(ndrId);
      expect(studentWithNDR.settlementNoteIds[0].clientName).toBe("Jean Dupont");
      expect(studentWithNDR.settlementNoteIds[0].department).toBe("75");

      console.log("✅ Test populate NDR depuis étudiant: SUCCÈS");
    });

    test("Doit gérer les références orphelines gracieusement", async () => {
      // Créer manuellement une référence vers une NDR inexistante
      const fakeNDRId = new mongoose.Types.ObjectId();
      
      await Student.findByIdAndUpdate(
        testStudents[0]._id,
        { $push: { settlementNoteIds: fakeNDRId } }
      );

      // Récupérer l'étudiant sans populate pour voir les IDs bruts
      const studentRaw = await Student.findById(testStudents[0]._id).lean();
      expect(studentRaw.settlementNoteIds).toHaveLength(1);
      expect(studentRaw.settlementNoteIds[0].toString()).toBe(fakeNDRId.toString());

      // Récupérer l'étudiant avec populate - Mongoose filtre automatiquement les références null
      const studentWithFakeRef = await Student.findById(testStudents[0]._id)
        .populate('settlementNoteIds')
        .lean();

      // Mongoose filtre automatiquement les références orphelines
      expect(studentWithFakeRef.settlementNoteIds).toHaveLength(0);

      console.log("✅ Test références orphelines: SUCCÈS");
    });
  });
});