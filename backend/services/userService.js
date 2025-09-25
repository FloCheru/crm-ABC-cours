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

  /**
   * Récupère tous les utilisateurs ayant le rôle admin
   * @returns {Promise<Array>} - Liste des utilisateurs admin
   */
  static async getAdminUsers() {
    try {
      const adminUsers = await User.find({ role: "admin" })
        .select("_id email firstName lastName role createdAt")
        .sort({ createdAt: -1 });

      return adminUsers;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs admin:", error);
      throw new Error("Erreur lors de la récupération des utilisateurs admin");
    }
  }
}

module.exports = UserService;