const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Configuration d'environnement propre
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: path.join(__dirname, envFile) });

// Debug avec console standard
console.log(`🔍 Environnement chargé: ${envFile}`);
console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔍 MONGODB_URI défini: ${!!process.env.MONGODB_URI}`);

// Import du cache manager
const CacheManager = require("./cache/cacheManager");

// Import des routes
const authRoutes = require("./routes/auth");
const familyRoutes = require("./routes/families");
// const studentRoutes = require("./routes/students"); // Supprimé
const professorRoutes = require("./routes/professors");

const subjectRoutes = require("./routes/subjects");
// const couponRoutes = require("./routes/coupons"); // Supprimé
// const settlementNotesRoutes = require("./routes/settlementNotes"); // Supprimé
// const pdfRoutes = require("./routes/pdf"); // Supprimé (ancien système NDR)
const pdfRoutes = require("./routes/pdfRoutes"); // Nouveau système générique
const ndrRoutes = require("./routes/ndr");
const rdvRoutes = require("./routes/rdv");
// const debugRoutes = require("./routes/debug"); // Supprimé

// Import de la configuration de la base de données
const connectDB = require("./config/database");

// Import du storage PDF pour initialiser GridFS
const { initGridFS } = require("./services/pdf/pdf.storage");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la sécurité
app.use(helmet());

// Configuration CORS
const allowedOrigins = [
  "http://localhost:5173", // local
  "http://localhost:5174", // local Vite (port par défaut)
  "http://localhost:5178", // local Vite (port alternatif)
  "http://localhost:5177", // local Vite (port alternatif)
  "https://crm-abc-cours.vercel.app", // Production Vercel (hardcodé pour sécurité)
  "https://flocheru.github.io", // GitHub Pages
  process.env.CORS_ORIGIN, // Variable d'environnement
  process.env.FRONTEND_URL, // Backup Railway
].filter(Boolean);

// Log des origines autorisées pour debug
console.log(`🔍 CORS Origins autorisées: ${JSON.stringify(allowedOrigins)}`);
console.log(`🔍 FRONTEND_URL: ${process.env.FRONTEND_URL}`);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permettre les requêtes sans origine (ex: Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS bloqué pour l'origine: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, //Auth/cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Configuration Trust Proxy pour Railway/Heroku
// CRITIQUE: Nécessaire pour le bon fonctionnement du rate limiting en production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // Trust premier proxy (Railway/Heroku)
  console.log("🔧 Trust proxy activé pour la production");
}

// Rate limiting - Configuration adaptée pour le développement
const isDevelopment = process.env.NODE_ENV !== "production";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 1000 requêtes en dev, 100 en prod
  message: {
    error: "Trop de requêtes, veuillez réessayer plus tard",
    retryAfter: "15 minutes",
  },
});
app.use("/api/", limiter);

// Morgan logging
app.use(morgan("combined")); // Console

// Middleware pour parser le JSON avec UTF-8
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
app.use(cookieParser());


// Middleware pour servir les fichiers uploadés
app.use("/uploads", express.static("uploads"));

// Routes de base
app.get("/", (req, res) => {
  res.json({
    message: "API ABC Cours CRM",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
  });
});

// Route de santé pour Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/users", require("./routes/users"));
// app.use("/api/students", studentRoutes); // Supprimé
app.use("/api/professors", professorRoutes);

app.use("/api/subjects", subjectRoutes);
// app.use("/api/coupons", couponRoutes); // Supprimé
// app.use("/api/settlement-notes", settlementNotesRoutes); // Supprimé
app.use("/api/pdfs", pdfRoutes); // Nouveau système générique de PDFs
app.use("/api/ndrs", ndrRoutes);
app.use("/api/rdv", rdvRoutes);
// app.use("/debug", debugRoutes); // Supprimé

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(`${req.method} ${req.path} - ${err.message}`);

  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Route 404
app.use("*", (req, res) => {
  console.warn(`404 - Route non trouvée: ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route non trouvée" });
});

// Variable globale pour stocker le serveur
let server;


// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();

    // Initialiser GridFS après connexion MongoDB
    initGridFS();
    console.log('✅ GridFS initialisé pour le stockage des PDFs');

    server = app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`✅ Backend prêt pour les tests`);
      console.log(`🎯 Environnement: ${envFile}`);
    });
  } catch (error) {
    console.error(`Erreur lors du démarrage du serveur: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Signal ${signal} reçu. Arrêt propre du serveur...`);

  if (server) {
    server.close(() => {
      console.log("✅ Serveur HTTP fermé");

      // Fermer la connexion MongoDB
      mongoose.connection.close(false, () => {
        console.log("✅ Connexion MongoDB fermée");
        console.log("👋 Processus terminé proprement");
        process.exit(0);
      });
    });

    // Forcer la fermeture après 10 secondes
    setTimeout(() => {
      console.error("⚠️ Fermeture forcée après timeout");
      process.exit(1);
    }, 10000);
  }
};

// Écouter les signaux de terminaison
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

// Exporter l'app pour les tests
module.exports = app;
