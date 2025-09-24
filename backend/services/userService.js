const User = require("../models/User");

class UserService {
  /**
   * Vérifie si un email est unique dans la base de données
   * @param {string} email - L'email à vérifier
   * @returns {Promise<boolean>} - true si l'email est unique, false sinon
   */
  static async checkEmailUniqueness(email) {
    try {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim()
      });

      return !existingUser; // Retourne true si aucun utilisateur trouvé (email unique)
    } catch (error) {
      console.error("Erreur lors de la vérification de l'unicité de l'email:", error);
      throw new Error("Erreur lors de la vérification de l'email");
    }
  }
}

module.exports = UserService;