const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const path = require("path");

// Configuration d'environnement propre
const envFile = process.env.NODE_ENV === "production" 
  ? ".env.production" 
  : ".env.development";

require("dotenv").config({ path: path.join(__dirname, "..", envFile) });

const users = [
  {
    email: "admin@abc-cours.com",
    password: "admin123",
    firstName: "Admin",
    lastName: "ABC Cours",
    role: "admin",
    isActive: true,
  },
  {
    email: "prof@abc-cours.com",
    password: "prof123",
    firstName: "Jean",
    lastName: "Dupont",
    role: "professor",
    isActive: true,
  },
  {
    email: "prof2@abc-cours.com",
    password: "prof123",
    firstName: "Marie",
    lastName: "Martin",
    role: "professor",
    isActive: true,
  },
];

const seedUsers = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connecté à MongoDB");

    // Supprimer tous les utilisateurs existants
    await User.deleteMany({});
    console.log("🗑️  Anciens utilisateurs supprimés");

    // Créer les nouveaux utilisateurs avec mot de passe hashé
    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      await user.save();
      createdUsers.push(user);
    }

    console.log(`${createdUsers.length} utilisateurs créés`);

    // Afficher les utilisateurs créés
    console.log("\n👥 Utilisateurs créés :");
    createdUsers.forEach((user) => {
      console.log(
        `  - ${user.email} (${user.role}) - Mot de passe: ${
          users.find((u) => u.email === user.email)?.password
        }`
      );
    });

    console.log("\n🎉 Seeding terminé avec succès !");
    console.log("\n🔑 Vous pouvez maintenant vous connecter avec :");
    console.log("   - admin@abc-cours.com / admin123");
    console.log("   - prof@abc-cours.com / prof123");
    console.log("   - famille@abc-cours.com / famille123");
  } catch (error) {
    console.error("Erreur lors du seeding:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnecté de MongoDB");
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
