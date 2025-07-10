const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import des routes
const authRoutes = require("./routes/auth");
const familyRoutes = require("./routes/families");
const studentRoutes = require("./routes/students");
const professorRoutes = require("./routes/professors");
const assignmentRoutes = require("./routes/assignments");
const subjectRoutes = require("./routes/subjects");

// Import de la configuration de la base de données
const connectDB = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la sécurité
app.use(helmet());

// Configuration CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
});
app.use("/api/", limiter);

// Middleware de logging
app.use(morgan("combined"));

// Middleware pour parser le JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Middleware pour servir les fichiers uploadés
app.use("/uploads", express.static("uploads"));

// Routes de base
app.get("/", (req, res) => {
  res.json({
    message: "API ABC Cours CRM",
    version: "1.0.0",
    status: "running",
  });
});

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/subjects", subjectRoutes);

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Route 404
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Mode: ${process.env.NODE_ENV}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

// Exporter l'app pour les tests
module.exports = app;
