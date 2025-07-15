const mongoose = require("mongoose");
const Subject = require("../models/Subject");
require("dotenv").config({ path: ".env.development" });

const createSubjects = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    // Liste des matières à créer
    const subjects = [
      {
        name: "Mathématiques",
        description: "Cours de mathématiques pour tous niveaux",
        category: "Scientifique",
        isActive: true,
      },
      {
        name: "Français",
        description: "Cours de français et littérature",
        category: "Littéraire",
        isActive: true,
      },
      {
        name: "Anglais",
        description: "Cours d'anglais conversationnel et académique",
        category: "Langues",
        isActive: true,
      },
      {
        name: "Physique",
        description: "Cours de physique pour lycée et supérieur",
        category: "Scientifique",
        isActive: true,
      },
      {
        name: "Chimie",
        description: "Cours de chimie générale et organique",
        category: "Scientifique",
        isActive: true,
      },
      {
        name: "Histoire",
        description: "Cours d'histoire et géographie",
        category: "Littéraire",
        isActive: true,
      },
      {
        name: "Philosophie",
        description: "Cours de philosophie pour terminale",
        category: "Littéraire",
        isActive: true,
      },
      {
        name: "SVT",
        description: "Sciences de la Vie et de la Terre",
        category: "Scientifique",
        isActive: true,
      },
      {
        name: "Économie",
        description: "Cours d'économie et sciences sociales",
        category: "Autre",
        isActive: true,
      },
      {
        name: "Informatique",
        description: "Programmation et bureautique",
        category: "Scientifique",
        isActive: true,
      },
      {
        name: "Espagnol",
        description: "Cours d'espagnol conversationnel",
        category: "Langues",
        isActive: true,
      },
      {
        name: "Allemand",
        description: "Cours d'allemand pour débutants et confirmés",
        category: "Langues",
        isActive: true,
      },
      {
        name: "Arts plastiques",
        description: "Cours de dessin et peinture",
        category: "Arts",
        isActive: true,
      },
      {
        name: "Musique",
        description: "Cours de piano, guitare et théorie musicale",
        category: "Arts",
        isActive: true,
      },
      {
        name: "Sport",
        description: "Cours de fitness et préparation physique",
        category: "Sport",
        isActive: true,
      },
    ];

    // Vérifier et créer chaque matière
    for (const subjectData of subjects) {
      const existingSubject = await Subject.findOne({ name: subjectData.name });

      if (existingSubject) {
        console.log(`⚠️ La matière "${subjectData.name}" existe déjà`);
      } else {
        const subject = new Subject(subjectData);
        await subject.save();
        console.log(`✅ Matière créée : ${subjectData.name}`);
      }
    }

    // Afficher le résumé
    const totalSubjects = await Subject.countDocuments();
    console.log(`\n📊 Résumé : ${totalSubjects} matières au total`);
  } catch (error) {
    console.error("❌ Erreur lors de la création des matières:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnecté de MongoDB");
  }
};

// Exécuter le script
createSubjects();
