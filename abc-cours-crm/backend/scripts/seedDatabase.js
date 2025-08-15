const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import des modèles
const User = require("../models/User");
const Family = require("../models/Family");
const Student = require("../models/Student");
const Professor = require("../models/Professor");
const Assignment = require("../models/Assignment");

// Configuration de la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connecté pour le seeding");
  } catch (error) {
    console.error("Erreur de connexion MongoDB:", error);
    process.exit(1);
  }
};

// Données de test
const seedData = async () => {
  try {
    console.log("🗑️  Nettoyage de la base de données...");
    await User.deleteMany({});
    await Family.deleteMany({});
    await Student.deleteMany({});
    await Professor.deleteMany({});
    await Assignment.deleteMany({});

    console.log("👥 Création des utilisateurs...");

    // Créer un admin
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await User.create({
      email: "admin@abc-cours.fr",
      password: adminPassword,
      role: "admin",
      firstName: "Admin",
      lastName: "ABC Cours",
      phone: "0123456789",
    });

    // Créer un professeur
    const profPassword = await bcrypt.hash("prof123", 12);
    const prof = await User.create({
      email: "prof@abc-cours.fr",
      password: profPassword,
      role: "professor",
      firstName: "Marie",
      lastName: "Dubois",
      phone: "0123456790",
    });

    console.log("👨‍👩‍👧‍👦 Création des familles...");

    const family1 = await Family.create({
      name: "Famille Martin",
      address: {
        street: "123 Rue de la Paix",
        city: "Paris",
        postalCode: "75001",
      },
      contact: {
        primaryPhone: "0123456791",
        email: "martin@email.com",
      },
      parents: [
        {
          firstName: "Jean",
          lastName: "Martin",
          phone: "0123456791",
          email: "jean.martin@email.com",
          profession: "Ingénieur",
          isPrimaryContact: true,
        },
        {
          firstName: "Marie",
          lastName: "Martin",
          phone: "0123456792",
          email: "marie.martin@email.com",
          profession: "Médecin",
        },
      ],
      notes: "Famille très impliquée dans la scolarité",
    });

    const family2 = await Family.create({
      name: "Famille Bernard",
      address: {
        street: "456 Avenue des Champs",
        city: "Paris",
        postalCode: "75008",
      },
      contact: {
        primaryPhone: "0123456793",
        email: "bernard@email.com",
      },
      parents: [
        {
          firstName: "Sophie",
          lastName: "Bernard",
          phone: "0123456793",
          email: "sophie.bernard@email.com",
          profession: "Avocate",
          isPrimaryContact: true,
        },
        {
          firstName: "Pierre",
          lastName: "Bernard",
          phone: "0123456794",
          email: "pierre.bernard@email.com",
          profession: "Architecte",
        },
      ],
      notes: "Préfère les cours en soirée",
    });

    console.log("👨‍🎓 Création des élèves...");

    const student1 = await Student.create({
      firstName: "Lucas",
      lastName: "Martin",
      dateOfBirth: new Date("2010-05-15"),
      family: family1._id,
      school: {
        name: "École Élémentaire Victor Hugo",
        level: "primaire",
        grade: "CM2",
      },
      subjects: [
        {
          name: "Mathématiques",
          level: "intermédiaire",
          notes: "Très motivé, progresse bien",
        },
        {
          name: "Français",
          level: "intermédiaire",
          notes: "Bonne compréhension",
        },
      ],
      notes: "Très motivé, progresse bien en maths",
      status: "active",
    });

    const student2 = await Student.create({
      firstName: "Emma",
      lastName: "Bernard",
      dateOfBirth: new Date("2009-08-22"),
      family: family2._id,
      school: {
        name: "Collège Jean Moulin",
        level: "collège",
        grade: "6ème",
      },
      subjects: [
        {
          name: "Mathématiques",
          level: "débutant",
          notes: "Besoin d'aide en algèbre",
        },
        {
          name: "Anglais",
          level: "avancé",
          notes: "Excellente compréhension",
        },
      ],
      notes: "Excellente en anglais, besoin d'aide en maths",
      status: "active",
    });

    console.log("👨‍🏫 Création des professeurs...");

    const professor1 = await Professor.create({
      user: prof._id,
      subjects: [
        {
          name: "Mathématiques",
          levels: ["primaire", "collège", "lycée"],
          experience: 8,
        },
        {
          name: "Physique",
          levels: ["collège", "lycée"],
          experience: 6,
        },
      ],
      availability: [
        {
          day: "monday",
          timeSlots: [
            { start: "14:00", end: "16:00" },
            { start: "18:00", end: "20:00" },
          ],
        },
        {
          day: "wednesday",
          timeSlots: [
            { start: "10:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
        },
        {
          day: "saturday",
          timeSlots: [{ start: "09:00", end: "12:00" }],
        },
      ],
      hourlyRate: 35,
      status: "active",
      documents: [],
      education: [
        {
          degree: "Master en Mathématiques",
          institution: "Université Paris-Sorbonne",
          year: 2015,
          description: "Spécialisation en algèbre et géométrie",
        },
      ],
      experience: [
        {
          position: "Professeur de mathématiques",
          company: "Lycée Victor Hugo",
          startDate: new Date("2016-09-01"),
          endDate: new Date("2023-06-30"),
          description: "Enseignement des mathématiques niveau lycée",
        },
      ],
      notes: "Professeur expérimenté, très pédagogue",
    });

    const professor2 = await Professor.create({
      user: await User.create({
        email: "prof2@abc-cours.fr",
        password: await bcrypt.hash("prof123", 12),
        role: "professor",
        firstName: "Pierre",
        lastName: "Durand",
        phone: "0123456795",
      }),
      subjects: [
        {
          name: "Français",
          levels: ["primaire", "collège", "lycée"],
          experience: 5,
        },
        {
          name: "Histoire",
          levels: ["collège", "lycée"],
          experience: 4,
        },
      ],
      availability: [
        {
          day: "tuesday",
          timeSlots: [
            { start: "16:00", end: "18:00" },
            { start: "19:00", end: "21:00" },
          ],
        },
        {
          day: "thursday",
          timeSlots: [
            { start: "14:00", end: "16:00" },
            { start: "17:00", end: "19:00" },
          ],
        },
        {
          day: "friday",
          timeSlots: [{ start: "16:00", end: "18:00" }],
        },
      ],
      hourlyRate: 30,
      status: "active",
      documents: [],
      education: [
        {
          degree: "Master en Lettres Modernes",
          institution: "Université Paris-Diderot",
          year: 2018,
          description: "Spécialisation en littérature française",
        },
      ],
      experience: [
        {
          position: "Professeur de français",
          company: "Collège Jean Moulin",
          startDate: new Date("2019-09-01"),
          endDate: new Date("2023-06-30"),
          description: "Enseignement du français niveau collège",
        },
      ],
      notes: "Spécialiste en littérature française",
    });

    console.log("📅 Création des assignations...");

    await Assignment.create({
      student: student1._id,
      professor: professor1._id,
      subject: "Mathématiques",
      schedule: {
        day: "monday",
        startTime: "14:00",
        endTime: "15:00",
        duration: 60,
      },
      location: {
        type: "home",
        address: "123 Rue de la Paix, 75001 Paris",
      },
      status: "confirmed",
      payment: {
        amount: 35,
        method: "transfer",
        status: "pending",
        dueDate: new Date("2024-02-15"),
      },
      notes: {
        professor: "Cours de soutien en mathématiques",
        student: "Très motivé",
        admin: "Assignation créée automatiquement",
      },
    });

    await Assignment.create({
      student: student2._id,
      professor: professor2._id,
      subject: "Français",
      schedule: {
        day: "tuesday",
        startTime: "16:00",
        endTime: "17:00",
        duration: 60,
      },
      location: {
        type: "home",
        address: "456 Avenue des Champs, 75008 Paris",
      },
      status: "confirmed",
      payment: {
        amount: 30,
        method: "transfer",
        status: "pending",
        dueDate: new Date("2024-02-20"),
      },
      notes: {
        professor: "Amélioration de la rédaction",
        student: "Excellente en anglais",
        admin: "Assignation créée automatiquement",
      },
    });

    console.log("Base de données peuplée avec succès !");
    console.log("\n📊 Résumé :");
    console.log(`- ${await User.countDocuments()} utilisateurs`);
    console.log(`- ${await Family.countDocuments()} familles`);
    console.log(`- ${await Student.countDocuments()} élèves`);
    console.log(`- ${await Professor.countDocuments()} professeurs`);
    console.log(`- ${await Assignment.countDocuments()} assignations`);

    console.log("\n🔑 Comptes de test :");
    console.log("Admin: admin@abc-cours.fr / admin123");
    console.log("Professeur: prof@abc-cours.fr / prof123");

    process.exit(0);
  } catch (error) {
    console.error("Erreur lors du seeding:", error);
    process.exit(1);
  }
};

// Exécution
connectDB().then(() => {
  seedData();
});
