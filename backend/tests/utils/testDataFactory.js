const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

/**
 * Factory pour créer des données de test réutilisables
 * Utilisé par tous les fichiers de test pour assurer la cohérence
 */
class TestDataFactory {
  constructor() {
    // Plus besoin de counter car les données sont nettoyées à chaque test
  }

  // ================================
  // USERS
  // ================================

  /**
   * Crée un utilisateur admin de test
   * @param {Object} overrides - Propriétés à surcharger
   * @returns {Object} Données utilisateur
   */
  createTestAdmin(overrides = {}) {
    const defaultAdmin = {
      email: "admin@abc-cours.com",
      password: "password123",
      role: "admin",
      firstName: "Admin",
      lastName: "Test",
      isActive: true,
    };
    return { ...defaultAdmin, ...overrides };
  }

  /**
   * Crée un token JWT pour l'authentification
   * @param {Object} user - Utilisateur pour lequel créer le token
   * @returns {string} Token JWT
   */
  createAuthToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  }

  // ================================
  // FAMILIES
  // ================================

  /**
   * Crée une famille de test de base avec les champs requis
   * @param {string} adminId - ID de l'admin créateur
   * @param {Object} overrides - Propriétés à surcharger
   * @returns {Object} Données famille
   */
  createTestFamilyBase(adminId, overrides = {}) {
    const defaultFamily = {
      primaryContact: {
        firstName: "Marie",
        lastName: "Dupont",
        primaryPhone: "0123456789",
        email: "marie@test.com",
        gender: "Mme",
      },
      address: {
        street: "123 Rue Test",
        city: "Paris",
        postalCode: "75001",
      },
      billingAddress: {
        street: "456 Rue Facturation",
        city: "Lyon",
        postalCode: "69001",
      },
      demande: {
        grade: "3ème",
        subjects: [{ id: new mongoose.Types.ObjectId() }],
        beneficiaryType: "eleves",
        beneficiaryGrade: "3ème",
      },
      status: "prospect",
      prospectStatus: "en_reflexion",
      createdBy: {
        userId: adminId,
      },
    };

    return this.deepMerge(defaultFamily, overrides);
  }

  /**
   * Crée une famille complète avec tous les champs optionnels
   * @param {string} adminId - ID de l'admin créateur
   * @param {Object} overrides - Propriétés à surcharger
   * @returns {Object} Données famille complète
   */
  createTestFamilyComplete(adminId, overrides = {}) {
    const baseFamily = this.createTestFamilyBase(adminId);
    const completeFamily = {
      ...baseFamily,
      secondaryContact: {
        firstName: "Pierre",
        lastName: "Dupont",
        phone: "0987654321",
        email: "pierre@test.com",
        relationship: "Père",
      },
      companyInfo: {
        urssafNumber: "12345678901",
      },
      students: [
        {
          id: new mongoose.Types.ObjectId(),
          firstName: "Paul",
          lastName: "Dupont",
          birthDate: new Date("2008-05-15"),
          school: {
            name: "Collège Victor Hugo",
            grade: "3ème",
          },
          contact: {
            phone: "0123456789",
            email: "paul@test.com",
          },
          address: {
            street: "123 Rue Test",
            city: "Paris",
            postalCode: "75001",
          },
          availability: "Mercredi après-midi",
          notes: "Bon élève en maths",
        },
      ],
    };

    return this.deepMerge(completeFamily, overrides);
  }

  /**
   * Crée plusieurs familles de test
   * @param {string} adminId - ID de l'admin créateur
   * @param {number} count - Nombre de familles à créer
   * @param {Object} baseOverrides - Propriétés de base à surcharger
   * @returns {Array} Tableau de données familles
   */
  createMultipleFamilies(adminId, count = 3, baseOverrides = {}) {
    return Array.from({ length: count }, (_, index) => {
      const specificOverrides = {
        primaryContact: {
          firstName: `Famille${index + 1}`,
          email: `famille${index + 1}@test.com`,
        },
        address: {
          street: `${index + 100} Rue Test`, // Éviter conflits avec l'adresse de base
        },
      };
      return this.createTestFamilyBase(
        adminId,
        this.deepMerge(baseOverrides, specificOverrides)
      );
    });
  }

  // ================================
  // RDV
  // ================================

  /**
   * Crée un RDV de test
   * @param {Object} family - Famille liée au RDV
   * @param {Object} admin - Admin créateur du RDV
   * @param {Object} overrides - Propriétés à surcharger
   * @returns {Object} Données RDV
   */
  createTestRDV(family, admin, overrides = {}) {
    const defaultRDV = {
      family: { id: family._id },
      admins: [{ id: admin._id }],
      date: new Date("2025-12-25T14:30:00.000Z"),
      type: "physique",
      status: "planned",
    };
    return { ...defaultRDV, ...overrides };
  }

  // ================================
  // SUBJECTS
  // ================================

  /**
   * Crée des matières de test
   * @param {Array<string>} names - Noms des matières
   * @returns {Array} Tableau de données matières
   */
  createTestSubjects(names = ["Mathématiques", "Français", "Anglais"]) {
    return names.map((name) => ({ name }));
  }

  // ================================
  // UTILITIES
  // ================================

  /**
   * Fusion profonde d'objets pour les overrides
   * @param {Object} target - Objet cible
   * @param {Object} source - Objet source
   * @returns {Object} Objet fusionné
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        !(source[key] instanceof Date)
      ) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Réinitialise la factory (pour compatibilité, mais plus besoin)
   */
  reset() {
    // Plus besoin de reset car pas de state
  }

  // ================================
  // VALIDATION HELPERS
  // ================================

  /**
   * Valide la structure d'une famille selon dataFlow.md
   * @param {Object} family - Famille à valider
   * @returns {boolean} True si la structure est valide
   */
  validateFamilyStructure(family) {
    const requiredFields = [
      "_id",
      "primaryContact",
      "address",
      "billingAddress",
      "demande",
      "status",
      "prospectStatus",
      "createdBy",
      "createdAt",
      "updatedAt",
    ];

    const primaryContactFields = [
      "firstName",
      "lastName",
      "primaryPhone",
      "email",
      "gender",
    ];

    const addressFields = ["street", "city", "postalCode"];

    // Vérifier les champs principaux
    for (const field of requiredFields) {
      if (!family.hasOwnProperty(field)) {
        console.error(`Champ manquant: ${field}`);
        return false;
      }
    }

    // Vérifier primaryContact
    for (const field of primaryContactFields) {
      if (!family.primaryContact.hasOwnProperty(field)) {
        console.error(`Champ primaryContact manquant: ${field}`);
        return false;
      }
    }

    // Vérifier address et billingAddress
    for (const field of addressFields) {
      if (!family.address.hasOwnProperty(field)) {
        console.error(`Champ address manquant: ${field}`);
        return false;
      }
      if (!family.billingAddress.hasOwnProperty(field)) {
        console.error(`Champ billingAddress manquant: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Valide les valeurs enum
   * @param {Object} family - Famille à valider
   * @returns {boolean} True si les enums sont valides
   */
  validateFamilyEnums(family) {
    const validStatuses = ["prospect", "client", "ancien_client"];
    const validProspectStatuses = [
      "en_reflexion",
      "interesse_prof_a_trouver",
      "injoignable",
      "ndr_editee",
      "premier_cours_effectue",
      "rdv_prospect",
      "ne_va_pas_convertir",
    ];

    if (!validStatuses.includes(family.status)) {
      console.error(`Status invalide: ${family.status}`);
      return false;
    }

    if (!validProspectStatuses.includes(family.prospectStatus)) {
      console.error(`ProspectStatus invalide: ${family.prospectStatus}`);
      return false;
    }

    return true;
  }
}

// Export d'une instance singleton
module.exports = new TestDataFactory();
