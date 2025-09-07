const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connecté: ${conn.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on("error", (err) => {
      console.error("Erreur MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB déconnecté");
    });

    // Gestion propre de la fermeture
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🔌 Connexion MongoDB fermée");
      process.exit(0);
    });
  } catch (error) {
    console.error("Erreur de connexion MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
