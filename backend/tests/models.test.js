const mongoose = require("mongoose");
const RDV = require("../models/RDV");
const User = require("../models/User");
const Family = require("../models/Family");
const Subject = require("../models/Subject");

// Import des utilitaires centralisés
const TestSetup = require("./utils/testSetup");
const testDataFactory = require("./utils/testDataFactory");

// Helpers pour créer des données de test (wrapper pour compatibilité)
const TestDataHelpers = {
  // Créer un admin de test
  async createAdmin(overrides = {}) {
    const adminData = testDataFactory.createTestAdmin(overrides);
    return User.create(adminData);
  },

  // Créer une famille de test
  async createFamily(admin, overrides = {}) {
    const familyData = testDataFactory.createTestFamilyBase(admin._id, overrides);
    return Family.create(familyData);
  },

  // Créer un RDV de test
  async createRDV(family, admin, overrides = {}) {
    const rdvData = testDataFactory.createTestRDV(family, admin, overrides);
    return RDV.create(rdvData);
  },

  // Réinitialiser le compteur entre les tests
  reset() {
    testDataFactory.reset();
  },
};

describe("Models Tests", () => {
  beforeAll(async () => {
    await TestSetup.beforeAll();
  });

  afterAll(async () => {
    await TestSetup.afterAll();
  });

  beforeEach(async () => {
    await TestSetup.beforeEach();
    // Réinitialiser le compteur
    TestDataHelpers.reset();
  });

  describe("RDV Model", () => {
    describe("Structure et Format des Données", () => {
      test("devrait créer un RDV avec la structure correcte selon dataFlow.md", async () => {
        // Créer les données de test avec les helpers
        const admin = await TestDataHelpers.createAdmin({
          firstName: "Jean",
          lastName: "Admin",
        });

        const family = await TestDataHelpers.createFamily(admin, {
          primaryContact: {
            firstName: "Marie",
            lastName: "Dupont",
            primaryPhone: "0123456789",
            email: "marie.dupont@email.com",
            gender: "Mme",
          },
        });

        const rdv = await TestDataHelpers.createRDV(family, admin, {
          notes: "Premier rendez-vous",
        });

        // Vérifications de structure selon dataFlow.md
        expect(rdv).toHaveProperty("_id");
        expect(rdv).toHaveProperty("family");
        expect(rdv.family).toHaveProperty("id", family._id);
        expect(rdv).toHaveProperty("admins");
        expect(rdv.admins).toHaveLength(1);
        expect(rdv.admins[0]).toHaveProperty("id", admin._id);
        expect(rdv).toHaveProperty("date");
        expect(rdv).toHaveProperty("type", "physique");
        expect(rdv).toHaveProperty("notes", "Premier rendez-vous");
        expect(rdv).toHaveProperty("status", "planned");
        expect(rdv).toHaveProperty("createdAt");
        expect(rdv).toHaveProperty("updatedAt");
        expect(rdv).toHaveProperty("__v"); // Version mongoose
      });

      test("devrait récupérer les RDV avec le bon format et populate", async () => {
        // Créer les données de test
        const admin = await TestDataHelpers.createAdmin({
          firstName: "Pierre",
          lastName: "Administrateur",
        });

        const family = await TestDataHelpers.createFamily(admin, {
          primaryContact: {
            firstName: "Sophie",
            lastName: "Martin",
            primaryPhone: "0987654321",
            email: "sophie.martin@email.com",
            gender: "Mme",
          },
          address: {
            city: "Lyon",
            postalCode: "69000",
          },
          demande: {
            beneficiaryLevel: "6ème",
          },
        });

        const rdv = await TestDataHelpers.createRDV(family, admin, {
          date: new Date("2025-11-15T10:00:00.000Z"),
          type: "visio",
          notes: "Rendez-vous de suivi",
        });

        // Récupérer avec populate (comme dans le formattage backend)
        const rdvWithPopulate = await RDV.findById(rdv._id)
          .populate(
            "family.id",
            "primaryContact.firstName primaryContact.lastName"
          )
          .populate("admins.id", "firstName lastName");

        // V�rifications du format avec populate
        expect(rdvWithPopulate.family.id).toHaveProperty("primaryContact");
        expect(rdvWithPopulate.family.id.primaryContact).toHaveProperty(
          "firstName",
          "Sophie"
        );
        expect(rdvWithPopulate.family.id.primaryContact).toHaveProperty(
          "lastName",
          "Martin"
        );

        expect(rdvWithPopulate.admins[0].id).toHaveProperty(
          "firstName",
          "Pierre"
        );
        expect(rdvWithPopulate.admins[0].id).toHaveProperty(
          "lastName",
          "Administrateur"
        );
      });

      test("devrait valider les enum values correctement", async () => {
        const admin = await TestDataHelpers.createAdmin();
        const family = await TestDataHelpers.createFamily(admin, {
          primaryContact: {
            firstName: "Test",
            lastName: "User",
            gender: "M.",
          },
          address: {
            city: "Marseille",
            postalCode: "13000",
          },
          demande: {
            beneficiaryType: "adulte",
            beneficiaryLevel: "Terminale",
          },
        });

        // Test enum type valide
        const rdvPhysique = await TestDataHelpers.createRDV(family, admin, {
          date: new Date("2025-12-01T09:00:00.000Z"),
          type: "physique",
        });
        expect(rdvPhysique.type).toBe("physique");

        const rdvVisio = await TestDataHelpers.createRDV(family, admin, {
          date: new Date("2025-12-02T09:00:00.000Z"),
          type: "visio",
          status: "done",
        });
        expect(rdvVisio.type).toBe("visio");
        expect(rdvVisio.status).toBe("done");

        // Test enum type invalide
        await expect(
          TestDataHelpers.createRDV(family, admin, {
            date: new Date("2025-12-03T09:00:00.000Z"),
            type: "invalide",
          })
        ).rejects.toThrow();
      });
    });

    describe("Méthodes et Fonctionnalités", () => {
      test("devrait formater la date correctement avec getFormattedDateTime", async () => {
        const admin = await TestDataHelpers.createAdmin();
        const family = await TestDataHelpers.createFamily(admin, {
          demande: {
            beneficiaryLevel: "CM2",
          },
        });

        const testDate = new Date("2025-12-25T14:30:00.000Z");
        const rdv = await TestDataHelpers.createRDV(family, admin, {
          date: testDate,
        });

        const formattedDate = rdv.getFormattedDateTime();

        // V�rifier que le format contient les �l�ments attendus
        expect(typeof formattedDate).toBe("string");
        expect(formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Format DD/MM/YYYY
        expect(formattedDate).toMatch(/\d{2}:\d{2}/); // Format HH:MM
      });

      test("devrait emp�cher la cr�ation de RDV dans le pass�", async () => {
        const admin = await TestDataHelpers.createAdmin();
        const family = await TestDataHelpers.createFamily(admin, {
          demande: {
            beneficiaryLevel: "3ème",
          },
        });

        const pastDate = new Date("2020-01-01T10:00:00.000Z");

        await expect(
          TestDataHelpers.createRDV(family, admin, {
            date: pastDate,
          })
        ).rejects.toThrow(
          "Impossible de planifier un rendez-vous dans le passé"
        );
      });

      test("devrait permettre la cr�ation de RDV dans le pass� si status = done", async () => {
        const admin = await TestDataHelpers.createAdmin();
        const family = await TestDataHelpers.createFamily(admin, {
          demande: {
            beneficiaryLevel: "Première",
          },
        });

        const pastDate = new Date("2020-01-01T10:00:00.000Z");

        const rdv = await TestDataHelpers.createRDV(family, admin, {
          date: pastDate,
          status: "done",
        });

        expect(rdv).toBeDefined();
        expect(rdv.status).toBe("done");
      });

      test("devrait mettre � jour updatedAt automatiquement", async () => {
        const admin = await TestDataHelpers.createAdmin();
        const family = await TestDataHelpers.createFamily(admin, {
          demande: {
            beneficiaryLevel: "Seconde",
          },
        });

        const rdv = await TestDataHelpers.createRDV(family, admin, {
          date: new Date("2025-12-01T10:00:00.000Z"),
        });

        const originalUpdatedAt = rdv.updatedAt;

        // Attendre 1ms pour �tre s�r que la date change
        await new Promise((resolve) => setTimeout(resolve, 1));

        rdv.notes = "Notes mises � jour";
        await rdv.save();

        expect(rdv.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime()
        );
      });
    });
  });

  describe("Subject Model", () => {
    describe("Méthodes statiques", () => {
      beforeEach(async () => {
        // Créer des matières de test
        await Subject.create({ name: "Mathématiques" });
        await Subject.create({ name: "Français" });
        await Subject.create({ name: "Anglais" });
        await Subject.create({ name: "Physique-Chimie" });
        await Subject.create({ name: "Histoire-Géographie" });
      });

      test("devrait récupérer toutes les matières triées par nom avec getAllSubjects", async () => {
        const subjects = await Subject.getAllSubjects();

        expect(subjects).toHaveLength(5);
        expect(subjects[0].name).toBe("Anglais");
        expect(subjects[1].name).toBe("Français");
        expect(subjects[2].name).toBe("Histoire-Géographie");
        expect(subjects[3].name).toBe("Mathématiques");
        expect(subjects[4].name).toBe("Physique-Chimie");

        // Vérifier la structure des données
        subjects.forEach((subject) => {
          expect(subject).toHaveProperty("_id");
          expect(subject).toHaveProperty("name");
          expect(subject).toHaveProperty("createdAt");
          expect(subject).toHaveProperty("updatedAt");
        });
      });

      test("devrait rechercher des matières avec search (case insensitive)", async () => {
        // Recherche exacte
        const mathResults = await Subject.search("Mathématiques");
        expect(mathResults).toHaveLength(1);
        expect(mathResults[0].name).toBe("Mathématiques");

        // Recherche partielle case insensitive
        const frenchResults = await Subject.search("franç");
        expect(frenchResults).toHaveLength(1);
        expect(frenchResults[0].name).toBe("Français");

        // Recherche avec trait d'union
        const physicsResults = await Subject.search("physique");
        expect(physicsResults).toHaveLength(1);
        expect(physicsResults[0].name).toBe("Physique-Chimie");

        // Recherche sans résultat
        const noResults = await Subject.search("Informatique");
        expect(noResults).toHaveLength(0);

        // Recherche vide
        const emptyResults = await Subject.search("");
        expect(emptyResults).toHaveLength(5); // Retourne tout
      });

      test("devrait maintenir l'ordre alphabétique dans les résultats de recherche", async () => {
        // Ajouter une matière qui commence par 'A' pour tester l'ordre
        await Subject.create({ name: "Arts plastiques" });

        const results = await Subject.search("a");

        expect(results).toHaveLength(2); // "Anglais" et "Arts plastiques"
        expect(results[0].name).toBe("Anglais");
        expect(results[1].name).toBe("Arts plastiques");
      });
    });
  });
});
