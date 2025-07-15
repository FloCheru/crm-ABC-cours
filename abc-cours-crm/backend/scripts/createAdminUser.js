const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config({ path: ".env.development" });

const createAdminUser = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: "admin@abc-cours.fr" });
    if (existingAdmin) {
      console.log("⚠️ L'utilisateur admin existe déjà");
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash("admin123", 12);

    // Créer l'utilisateur admin
    const adminUser = new User({
      firstName: "Admin",
      lastName: "ABC Cours",
      email: "admin@abc-cours.fr",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      phone: "0123456789",
    });

    await adminUser.save();
    console.log("✅ Utilisateur admin créé avec succès");
    console.log("📧 Email: admin@abc-cours.fr");
    console.log("🔑 Mot de passe: admin123");
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnecté de MongoDB");
  }
};

// Exécuter le script
createAdminUser();
