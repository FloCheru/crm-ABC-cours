const mongoose = require("mongoose");

// Configuration MongoDB pour les tests
const MONGODB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/abc-cours-test";

/**
 * Configuration centralisée pour les tests MongoDB
 */
class TestSetup {
  /**
   * Initialise la connexion MongoDB pour les tests
   */
  static async setupDatabase() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
  }

  /**
   * Ferme la connexion MongoDB
   */
  static async teardownDatabase() {
    await mongoose.connection.close();
  }

  /**
   * Nettoie toutes les collections de test
   * @param {Array<string>} collections - Noms des collections à nettoyer
   */
  static async cleanupCollections(collections = []) {
    const defaultCollections = [
      "families",
      "users",
      "rdvs",
      "subjects",
      "ndrs"
    ];

    const collectionsToClean = collections.length > 0 ? collections : defaultCollections;

    for (const collectionName of collectionsToClean) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        await collection.deleteMany({});
      } catch (error) {
        // Collection n'existe pas encore, ignorer l'erreur
        if (error.code !== 26) {
          console.warn(`Erreur lors du nettoyage de ${collectionName}:`, error.message);
        }
      }
    }
  }

  /**
   * Configuration standard beforeAll pour les tests
   */
  static async beforeAll() {
    await this.setupDatabase();
  }

  /**
   * Configuration standard afterAll pour les tests
   */
  static async afterAll() {
    await this.teardownDatabase();
  }

  /**
   * Configuration standard beforeEach pour les tests
   * @param {Array<string>} collections - Collections à nettoyer
   */
  static async beforeEach(collections = []) {
    await this.cleanupCollections(collections);
  }

  /**
   * Obtient l'URI de la base de test
   */
  static getTestDbUri() {
    return MONGODB_URI;
  }

  /**
   * Vérifie si la connexion est active
   */
  static isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = TestSetup;