const express = require("express");
const UserService = require("../services/userService");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

// @route   GET /api/users/admins
// @desc    Récupérer tous les utilisateurs admin
// @access  Private
router.get("/admins", async (req, res) => {
  try {
    const adminUsers = await UserService.getAdminUsers();
    res.json(adminUsers);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs admin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;