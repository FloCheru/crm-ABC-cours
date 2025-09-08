const mongoose = require("mongoose");
const Subject = require("../models/Subject");
require("dotenv").config();

const subjects = [
  {
    name: "Mathématiques",
    description: "Algèbre, géométrie, arithmétique et calcul",
    category: "Scientifique",
    isActive: true,
  },
  {
    name: "Physique",
    description: "Mécanique, électricité, optique et thermodynamique",
    category: "Scientifique",
    isActive: true,
  },
  {
    name: "Chimie",
    description: "Chimie générale, organique et inorganique",
    category: "Scientifique",
    isActive: true,
  },
  {
    name: "SVT",
    description: "Sciences de la Vie et de la Terre",
    category: "Scientifique",
    isActive: true,
  },
  {
    name: "Français",
    description: "Grammaire, conjugaison, littérature et expression écrite",
    category: "Littéraire",
    isActive: true,
  },
  {
    name: "Histoire",
    description: "Histoire de France et du monde",
    category: "Littéraire",
    isActive: true,
  },
  {
    name: "Géographie",
    description: "Géographie physique, humaine et économique",
    category: "Littéraire",
    isActive: true,
  },
  {
    name: "Philosophie",
    description: "Réflexion philosophique et méthodologie",
    category: "Littéraire",
    isActive: true,
  },
  {
    name: "Anglais",
    description: "Grammaire, vocabulaire et expression orale",
    category: "Langues",
    isActive: true,
  },
  {
    name: "Espagnol",
    description: "Grammaire, vocabulaire et expression orale",
    category: "Langues",
    isActive: true,
  },
  {
    name: "Allemand",
    description: "Grammaire, vocabulaire et expression orale",
    category: "Langues",
    isActive: true,
  },
  {
    name: "Italien",
    description: "Grammaire, vocabulaire et expression orale",
    category: "Langues",
    isActive: true,
  },
  {
    name: "Arts Plastiques",
    description: "Dessin, peinture et techniques artistiques",
    category: "Arts",
    isActive: true,
  },
  {
    name: "Musique",
    description: "Théorie musicale et pratique instrumentale",
    category: "Arts",
    isActive: true,
  },
  {
    name: "Théâtre",
    description: "Expression théâtrale et mise en scène",
    category: "Arts",
    isActive: true,
  },
  {
    name: "Sport",
    description: "Activités physiques et sportives",
    category: "Sport",
    isActive: true,
  },
  {
    name: "Informatique",
    description: "Programmation et bureautique",
    category: "Scientifique",
    isActive: true,
  },
  {
    name: "Économie",
    description: "Sciences économiques et sociales",
    category: "Littéraire",
    isActive: true,
  },
];

const seedSubjects = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connecté à MongoDB");

    // Supprimer toutes les matières existantes
    await Subject.deleteMany({});
    console.log("🗑️  Anciennes matières supprimées");

    // Insérer les nouvelles matières
    const insertedSubjects = await Subject.insertMany(subjects);
    console.log(`${insertedSubjects.length} matières ajoutées`);

    // Afficher les matières ajoutées
    console.log("\n📚 Matières ajoutées :");
    insertedSubjects.forEach((subject) => {
      console.log(`  - ${subject.name} (${subject.category})`);
    });

    console.log("\n🎉 Seeding terminé avec succès !");
  } catch (error) {
    console.error("Erreur lors du seeding:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnecté de MongoDB");
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  seedSubjects();
}

module.exports = seedSubjects;
