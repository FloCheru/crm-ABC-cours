const Professor = require("../models/Professor");
const Admin = require("../models/Admin");

class UserService {
  /**
   * Vérifie si un email est unique dans la base de données
   * @param {string} email - L'email à vérifier
   * @returns {Promise<boolean>} - true si l'email est unique, false sinon
   */
  static async checkEmailUniqueness(email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Vérifier dans Professor et Admin
      const existingProfessor = await Professor.findOne({ email: normalizedEmail });
      const existingAdmin = await Admin.findOne({ email: normalizedEmail });

      return !existingProfessor && !existingAdmin; // Retourne true si aucun utilisateur trouvé (email unique)
    } catch (error) {
      console.error("Erreur lors de la vérification de l'unicité de l'email:", error);
      throw new Error("Erreur lors de la vérification de l'email");
    }
  }

  /**
   * Récupère tous les utilisateurs ayant le rôle admin
   * @returns {Promise<Array>} - Liste des utilisateurs admin
   */
  static async getAdminUsers() {
    try {
      const adminUsers = await Admin.find({})
        .select("_id email firstName lastName role createdAt")
        .sort({ createdAt: -1 });

      return adminUsers;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs admin:", error);
      throw new Error("Erreur lors de la récupération des utilisateurs admin");
    }
  }

  /**
   * Génère un mot de passe temporaire pour la première connexion
   * Format: Abc123456 (mélange de majuscules, minuscules, chiffres)
   * @returns {string} - Mot de passe temporaire (8 caractères)
   */
  static generateTemporaryPassword() {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";

    let password = "";
    // Au moins 1 majuscule
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    // Au moins 1 minuscule
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    // Au moins 1 chiffre
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));

    // Compléter avec 5 caractères aléatoires
    const allChars = uppercase + lowercase + numbers;
    for (let i = 0; i < 5; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Mélanger les caractères
    return password.split("").sort(() => Math.random() - 0.5).join("");
  }
}

module.exports = UserService;