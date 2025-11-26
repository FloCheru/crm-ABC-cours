const mongoose = require("mongoose");
const FamilyService = require("../services/familyService");
const Family = require("../models/Family");
const Admin = require("../models/Admin");
const Professor = require("../models/Professor");
const RendezVous = require("../models/RDV");

// Import des utilitaires centralisés
const TestSetup = require("./utils/testSetup");
const testDataFactory = require("./utils/testDataFactory");
const CacheManager = require("../cache/cacheManager");

describe("FamilyService", () => {
  beforeAll(async () => {
    await TestSetup.beforeAll();
  });

  afterAll(async () => {
    await TestSetup.afterAll();
  });

  beforeEach(async () => {
    await TestSetup.beforeEach();
    testDataFactory.reset();

    // Clear cache before each test
    CacheManager.clear("families");
  });

  describe("getFamilies", () => {
    it("should return families with correct dataFlow.md structure", async () => {
      // Créer un utilisateur de test
      const userData = testDataFactory.createTestAdmin();
      const user = await Admin.create(userData);

      // Créer une famille complète de test
      const familyData = testDataFactory.createTestFamilyComplete(user._id);
      await Family.create(familyData);

      // Appeler getFamilies
      const result = await FamilyService.getFamilies(10);

      // Vérifications
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      const family = result[0];

      // Vérifier la structure selon dataFlow.md
      expect(family).toHaveProperty("id");
      expect(family).toHaveProperty("address");
      expect(family).toHaveProperty("primaryContact");
      expect(family).toHaveProperty("students");
      expect(family).toHaveProperty("rdvs");
      expect(family).toHaveProperty("createdBy");
      expect(family).toHaveProperty("createdAt");
      expect(family).toHaveProperty("updatedAt");

      // Vérifier que l'ID est présent (MongoDB retourne _id)
      expect(family._id).toBeDefined();

      // Vérifier la structure address
      expect(family.address).toEqual({
        street: "123 Rue Test",
        city: "Paris",
        postalCode: "75001",
      });

      // Vérifier la structure primaryContact
      expect(family.primaryContact).toEqual(
        expect.objectContaining({
          firstName: "Marie",
          lastName: "Dupont",
          primaryPhone: "0123456789",
          email: "marie@test.com",
          gender: "Mme",
        })
      );

      // Vérifier la structure createdBy (avec données User peuplées)
      expect(family.createdBy).toEqual({
        userId: user._id,
        firstName: "Admin",
        lastName: "Test",
      });

      // Vérifier la structure students
      expect(Array.isArray(family.students)).toBe(true);
      expect(family.students).toHaveLength(1);
      expect(family.students[0]).toEqual(
        expect.objectContaining({
          id: expect.any(mongoose.Types.ObjectId),
          firstName: "Paul",
          lastName: "Dupont",
          birthDate: expect.any(Date),
          school: {
            name: "Collège Victor Hugo",
            grade: "3ème",
          },
          contact: {
            phone: "0123456789",
            email: "paul@test.com",
          },
        })
      );

      // Vérifier que rdvs est un array (vide dans ce test)
      expect(Array.isArray(family.rdvs)).toBe(true);
      expect(family.rdvs).toHaveLength(0);
    });

    it("should handle families without optional fields", async () => {
      // Clear cache before this test to ensure clean state
      CacheManager.clear("families");

      // Créer un utilisateur de test
      const userData = testDataFactory.createTestAdmin();
      const user = await Admin.create(userData);

      // Créer une famille avec seulement les champs obligatoires
      const familyData = testDataFactory.createTestFamilyBase(user._id);
      await Family.create(familyData);

      const result = await FamilyService.getFamilies();
      const family = result[0];

      // Vérifier que les champs optionnels sont gérés correctement
      expect(family.students).toEqual([]);
      expect(family.rdvs).toEqual([]);
      expect(family.secondaryContact).toBeUndefined();
      // billingAddress est maintenant requis donc il sera présent
      expect(family.billingAddress).toBeDefined();
      expect(family.companyInfo).toBeUndefined();
    });

    it("should respect the limit parameter", async () => {
      // Clear cache before this test to ensure clean state
      CacheManager.clear("families");

      // Créer un utilisateur de test
      const userData = testDataFactory.createTestAdmin();
      const user = await Admin.create(userData);

      // Créer 5 familles de test
      const familiesData = testDataFactory.createMultipleFamilies(user._id, 5);
      await Family.insertMany(familiesData);

      // Tester la limite
      const result = await FamilyService.getFamilies(3);
      expect(result).toHaveLength(3);
    });

    it("should sort families by createdAt desc (most recent first)", async () => {
      // Clear cache before this test to ensure clean state
      CacheManager.clear("families");

      // Créer un utilisateur de test
      const userData = testDataFactory.createTestAdmin();
      const user = await Admin.create(userData);

      // Créer des familles avec des dates différentes
      const now = new Date();
      const family1Data = testDataFactory.createTestFamilyBase(user._id, {
        primaryContact: {
          firstName: "First",
          email: "first@test.com",
        },
        createdAt: new Date(now.getTime() - 2000), // Plus ancien
      });

      const family2Data = testDataFactory.createTestFamilyBase(user._id, {
        primaryContact: {
          firstName: "Second",
          email: "second@test.com",
        },
        createdAt: new Date(now.getTime() - 1000), // Plus récent
      });

      await Family.create(family1Data);
      await Family.create(family2Data);

      const result = await FamilyService.getFamilies();

      // Le plus récent doit être en premier
      expect(result[0].primaryContact.firstName).toBe("Second");
      expect(result[1].primaryContact.firstName).toBe("First");
    });
  });

  describe("Update family Methods", () => {
    let testUser;
    let testFamily;

    beforeEach(async () => {
      // Créer un utilisateur de test
      const userData = testDataFactory.createTestAdmin();
      testUser = await Admin.create(userData);

      // Créer une famille de test
      const familyData = testDataFactory.createTestFamilyComplete(testUser._id);
      testFamily = await Family.create(familyData);
    });

    describe("updatePrimaryContact()", () => {
      it("should update primary contact successfully with valid data", async () => {
        // Arrange
        const updateData = {
          firstName: "Jean-Updated",
          lastName: "Martin-Updated",
          primaryPhone: "0987654321",
          email: "jean.updated@test.com",
          gender: "M.",
          secondaryPhone: "0123456789",
          birthDate: "1980-05-15",
        };

        // Act
        const result = await FamilyService.updatePrimaryContact(
          testFamily._id,
          updateData
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.primaryContact.firstName).toBe("Jean-Updated");
        expect(result.primaryContact.lastName).toBe("Martin-Updated");
        expect(result.primaryContact.primaryPhone).toBe("0987654321");
        expect(result.primaryContact.email).toBe("jean.updated@test.com");
        expect(result.primaryContact.gender).toBe("M.");
      });

      it("should return null if family not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = {
          firstName: "Test",
          lastName: "Test",
          primaryPhone: "0123456789",
          email: "test@test.com",
          gender: "M.",
        };

        // Act
        const result = await FamilyService.updatePrimaryContact(
          nonExistentId,
          updateData
        );

        // Assert
        expect(result).toBeNull();
      });

      it("should throw ValidationError for invalid gender", async () => {
        // Arrange
        const updateData = {
          firstName: "Test",
          lastName: "Test",
          primaryPhone: "0123456789",
          email: "test@test.com",
          gender: "Invalid", // Valeur invalide
        };

        // Act & Assert
        await expect(
          FamilyService.updatePrimaryContact(testFamily._id, updateData)
        ).rejects.toThrow(
          "Données invalides: Civilité invalide. Valeurs autorisées: M., Mme"
        );
      });

      it("should throw CastError for invalid family ID", async () => {
        // Arrange
        const invalidId = "invalid-id";
        const updateData = { firstName: "Test" };

        // Act & Assert
        await expect(
          FamilyService.updatePrimaryContact(invalidId, updateData)
        ).rejects.toThrow("ID famille invalide");
      });
    });

    describe("updateDemande()", () => {
      it("should update demande successfully with valid data", async () => {
        // Arrange
        const updateData = {
          grade: "Seconde",
          subjects: [
            { id: "60f7b3b3b3b3b3b3b3b3b3b3" },
            { id: "60f7b3b3b3b3b3b3b3b3b3b4" },
          ],
        };

        // Act
        const result = await FamilyService.updateDemande(
          testFamily._id,
          updateData
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.demande.grade).toBe("Seconde");
        expect(result.demande.subjects).toHaveLength(2);
        expect(result.demande.subjects[0].id).toBe("60f7b3b3b3b3b3b3b3b3b3b3");
      });

      it("should return null if family not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = { grade: "Terminale" };

        // Act
        const result = await FamilyService.updateDemande(
          nonExistentId,
          updateData
        );

        // Assert
        expect(result).toBeNull();
      });

      it("should throw ValidationError for invalid grade", async () => {
        // Arrange
        const updateData = {
          grade: "InvalidGrade", // Niveau invalide
          subjects: [{ id: "60f7b3b3b3b3b3b3b3b3b3b3" }],
        };

        // Act & Assert
        await expect(
          FamilyService.updateDemande(testFamily._id, updateData)
        ).rejects.toThrow(
          "Données invalides: Niveau invalide. Valeurs autorisées: CP, CE1, CE2, CM1, CM2, 6ème, 5ème, 4ème, 3ème, Seconde, Première, Terminale"
        );
      });

      it("should throw ValidationError for missing subject id", async () => {
        // Arrange
        const updateData = {
          grade: "Terminale",
          subjects: [{ id: "" }], // ID vide
        };

        // Act & Assert
        await expect(
          FamilyService.updateDemande(testFamily._id, updateData)
        ).rejects.toThrow(
          "Données invalides: ID de la matière requis dans la demande"
        );
      });

      it("should throw CastError for invalid family ID", async () => {
        // Arrange
        const invalidId = "invalid-id";
        const updateData = { grade: "Terminale" };

        // Act & Assert
        await expect(
          FamilyService.updateDemande(invalidId, updateData)
        ).rejects.toThrow("ID famille invalide");
      });
    });

    describe("updateAddress()", () => {
      it("should update address successfully with valid data", async () => {
        // Arrange
        const updateData = {
          street: "456 Avenue des Champs",
          city: "Lyon",
          postalCode: "69001",
        };

        // Act
        const result = await FamilyService.updateAddress(
          testFamily._id,
          updateData
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.address.street).toBe("456 Avenue des Champs");
        expect(result.address.city).toBe("Lyon");
        expect(result.address.postalCode).toBe("69001");
      });

      it("should return null if family not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = {
          street: "Test Street",
          city: "Test City",
          postalCode: "12345",
        };

        // Act
        const result = await FamilyService.updateAddress(
          nonExistentId,
          updateData
        );

        // Assert
        expect(result).toBeNull();
      });

      it("should throw ValidationError for missing required fields", async () => {
        // Arrange
        const updateData = {
          street: "456 Avenue des Champs",
          // city manquant
          postalCode: "69001",
        };

        // Act & Assert
        await expect(
          FamilyService.updateAddress(testFamily._id, updateData)
        ).rejects.toThrow("Données invalides: Ville requise");
      });

      it("should throw CastError for invalid family ID", async () => {
        // Arrange
        const invalidId = "invalid-id";
        const updateData = {
          street: "Test Street",
          city: "Test City",
          postalCode: "12345",
        };

        // Act & Assert
        await expect(
          FamilyService.updateAddress(invalidId, updateData)
        ).rejects.toThrow("ID famille invalide");
      });
    });

    describe("updateBillingAddress()", () => {
      it("should update billing address successfully with valid data", async () => {
        // Arrange
        const updateData = {
          street: "789 Rue de la Facturation",
          city: "Marseille",
          postalCode: "13001",
        };

        // Act
        const result = await FamilyService.updateBillingAddress(
          testFamily._id,
          updateData
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.billingAddress.street).toBe("789 Rue de la Facturation");
        expect(result.billingAddress.city).toBe("Marseille");
        expect(result.billingAddress.postalCode).toBe("13001");
      });

      it("should return null if family not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = {
          street: "Test Street",
          city: "Test City",
          postalCode: "12345",
        };

        // Act
        const result = await FamilyService.updateBillingAddress(
          nonExistentId,
          updateData
        );

        // Assert
        expect(result).toBeNull();
      });

      it("should throw ValidationError for missing required fields", async () => {
        // Arrange
        const updateData = {
          street: "789 Rue de la Facturation",
          city: "Marseille",
          // postalCode manquant
        };

        // Act & Assert
        await expect(
          FamilyService.updateBillingAddress(testFamily._id, updateData)
        ).rejects.toThrow(
          "Données invalides: Code postal de l'adresse de facturation requise"
        );
      });

      it("should throw CastError for invalid family ID", async () => {
        // Arrange
        const invalidId = "invalid-id";
        const updateData = {
          street: "Test Street",
          city: "Test City",
          postalCode: "12345",
        };

        // Act & Assert
        await expect(
          FamilyService.updateBillingAddress(invalidId, updateData)
        ).rejects.toThrow("ID famille invalide");
      });
    });

    describe("updateSecondaryContact()", () => {
      it("should update secondary contact successfully with valid data", async () => {
        // Arrange
        const updateData = {
          firstName: "Sophie",
          lastName: "Dubois",
          phone: "0145678901",
          email: "sophie.dubois@test.com",
        };

        // Act
        const result = await FamilyService.updateSecondaryContact(
          testFamily._id,
          updateData
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.secondaryContact.firstName).toBe("Sophie");
        expect(result.secondaryContact.lastName).toBe("Dubois");
        expect(result.secondaryContact.phone).toBe("0145678901");
        expect(result.secondaryContact.email).toBe("sophie.dubois@test.com");
      });

      it("should return null if family not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = {
          firstName: "Test",
          lastName: "Test",
          phone: "0123456789",
          email: "test@test.com",
        };

        // Act
        const result = await FamilyService.updateSecondaryContact(
          nonExistentId,
          updateData
        );

        // Assert
        expect(result).toBeNull();
      });

      it("should throw ValidationError for incomplete contact data", async () => {
        // Arrange
        const updateData = {
          firstName: "Sophie",
          lastName: "Dubois",
          // phone et email manquants selon la validation métier
        };

        // Act & Assert
        await expect(
          FamilyService.updateSecondaryContact(testFamily._id, updateData)
        ).rejects.toThrow("Données invalides");
      });

      it("should throw CastError for invalid family ID", async () => {
        // Arrange
        const invalidId = "invalid-id";
        const updateData = {
          firstName: "Test",
          lastName: "Test",
          phone: "123",
          email: "test@test.com",
        };

        // Act & Assert
        await expect(
          FamilyService.updateSecondaryContact(invalidId, updateData)
        ).rejects.toThrow("ID famille invalide");
      });
    });

    describe("updateCompanyInfo()", () => {
      it("should update company info successfully with valid data", async () => {
        // Arrange
        const updateData = {
          urssafNumber: "98765432101",
          siretNumber: "12345678901234",
          ceNumber: "1234567890",
        };

        // Act
        const result = await FamilyService.updateCompanyInfo(
          testFamily._id,
          updateData
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.companyInfo.urssafNumber).toBe("98765432101");
        expect(result.companyInfo.siretNumber).toBe("12345678901234");
        expect(result.companyInfo.ceNumber).toBe("1234567890");
      });

      it("should return null if family not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = { urssafNumber: "123" };

        // Act
        const result = await FamilyService.updateCompanyInfo(
          nonExistentId,
          updateData
        );

        // Assert
        expect(result).toBeNull();
      });

      it("should accept empty/optional fields", async () => {
        // Arrange
        const updateData = {
          urssafNumber: "", // Champ optionnel, peut être vide
        };

        // Act
        const result = await FamilyService.updateCompanyInfo(
          testFamily._id,
          updateData
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.companyInfo.urssafNumber).toBe("");
      });

      it("should throw CastError for invalid family ID", async () => {
        // Arrange
        const invalidId = "invalid-id";
        const updateData = { urssafNumber: "123" };

        // Act & Assert
        await expect(
          FamilyService.updateCompanyInfo(invalidId, updateData)
        ).rejects.toThrow("ID famille invalide");
      });
    });
  });

  describe("Create/Delete family Methods", () => {
    let testUser;

    beforeEach(async () => {
      // Créer un utilisateur de test
      const userData = testDataFactory.createTestAdmin();
      testUser = await Admin.create(userData);
    });

    describe("createFamily()", () => {
      it("should create family successfully and invalidate cache", async () => {
        // Arrange
        const familyData = testDataFactory.createTestFamilyComplete(
          testUser._id
        );

        // Act
        const result = await FamilyService.createFamily(familyData);

        // Assert
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.primaryContact.firstName).toBe(
          familyData.primaryContact.firstName
        );
        expect(result.primaryContact.lastName).toBe(
          familyData.primaryContact.lastName
        );
        expect(result.createdBy.userId.toString()).toBe(
          testUser._id.toString()
        );

        // Verify family exists in DB
        const dbFamily = await Family.findById(result._id);
        expect(dbFamily).toBeDefined();
      });

      it("should throw ValidationError for invalid data", async () => {
        // Arrange
        const invalidFamilyData = {
          // Missing required fields
          primaryContact: {
            firstName: "Test",
            // lastName missing
          },
        };

        // Act & Assert
        await expect(
          FamilyService.createFamily(invalidFamilyData)
        ).rejects.toThrow();
      });
    });

    describe("deleteFamily()", () => {
      let testFamily;

      beforeEach(async () => {
        // Créer une famille de test
        const familyData = testDataFactory.createTestFamilyComplete(
          testUser._id
        );
        testFamily = await Family.create(familyData);
      });

      it("should delete family successfully and invalidate cache", async () => {
        // Act
        const result = await FamilyService.deleteFamily(testFamily._id);

        // Assert
        expect(result).toBeDefined();
        expect(result.message).toBe(
          "Famille et tous les éléments liés supprimés avec succès"
        );
        expect(result.deletedItems).toBeDefined();
        expect(result.deletedItems.students).toBeGreaterThanOrEqual(0);
        expect(result.deletedItems.settlementNotes).toBeGreaterThanOrEqual(0);
        expect(result.deletedItems.rdvs).toBeGreaterThanOrEqual(0);

        // Verify family is deleted from DB
        const dbFamily = await Family.findById(testFamily._id);
        expect(dbFamily).toBeNull();
      });

      it("should return null when family not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();

        // Act
        const result = await FamilyService.deleteFamily(nonExistentId);

        // Assert
        expect(result).toBeNull();
      });

      it("should throw CastError for invalid family ID", async () => {
        // Arrange
        const invalidId = "invalid-id";

        // Act & Assert
        await expect(FamilyService.deleteFamily(invalidId)).rejects.toThrow();
      });
    });
  });
});

//ajouter tests pour mise à jour de createdAt à chaque création/modification
