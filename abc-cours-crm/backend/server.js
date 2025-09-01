const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");

// Configuration d'environnement propre
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: path.join(__dirname, envFile) });

// Import du logger automatique
const logger = require("./utils/autoLogger");

// Redirection des console.error vers AutoLogger
const originalConsoleError = console.error;
console.error = (...args) => {
  // Garder l'affichage console original
  originalConsoleError(...args);
  // Ajouter au fichier de log via AutoLogger
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  logger.error(message, true); // forceSync = true for errors
};

// Debug avec logger
logger.info(`🔍 Environnement chargé: ${envFile}`);
logger.info(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`🔍 MONGODB_URI défini: ${!!process.env.MONGODB_URI}`);

// Import des routes
const authRoutes = require("./routes/auth");
const familyRoutes = require("./routes/families");
const studentRoutes = require("./routes/students");
const professorRoutes = require("./routes/professors");
const assignmentRoutes = require("./routes/assignments");
const subjectRoutes = require("./routes/subjects");
const couponRoutes = require("./routes/coupons");
const couponSeriesRoutes = require("./routes/couponSeries");
const settlementNotesRoutes = require("./routes/settlementNotes");
const pdfRoutes = require("./routes/pdf");
const rdvRoutes = require("./routes/rdv");
const debugRoutes = require("./routes/debug");

// Import de la configuration de la base de données
const connectDB = require("./config/database");

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
logger.info(`🔍 CORS Origins autorisées: ${JSON.stringify(allowedOrigins)}`);
logger.info(`🔍 FRONTEND_URL: ${process.env.FRONTEND_URL}`);

app.use(
  cors({
    origin: function(origin, callback) {
      // Permettre les requêtes sans origine (ex: Postman, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`⚠️ CORS bloqué pour l'origine: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, //Auth/cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Configuration Trust Proxy pour Railway/Heroku
// CRITIQUE: Nécessaire pour le bon fonctionnement du rate limiting en production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust premier proxy (Railway/Heroku)
  logger.info('🔧 Trust proxy activé pour la production');
}

// Rate limiting - Configuration adaptée pour le développement
const isDevelopment = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 1000 requêtes en dev, 100 en prod
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    retryAfter: '15 minutes'
  }
});
app.use("/api/", limiter);

// Middleware de logging Morgan intégré avec AutoLogger
const customMorganStream = {
  write: (message) => {
    // Retirer le \n final de Morgan pour éviter les doubles retours à la ligne
    const cleanMessage = message.replace(/\n$/, '');
    logger.info(cleanMessage);
  }
};

// Morgan avec écriture via AutoLogger
app.use(morgan("combined")); // Console
app.use(morgan("combined", { stream: customMorganStream })); // Fichier via AutoLogger

// Middleware pour parser le JSON avec UTF-8
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
app.use(cookieParser());

// Middleware de logging automatique des requêtes
app.use((req, res, next) => {
  const isTestRequest = req.headers["x-test-mode"] === "true";
  logger.info(`${req.method} ${req.path}`, isTestRequest);
  next();
});

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
app.use("/api/students", studentRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/coupon-series", couponSeriesRoutes);
app.use("/api/settlement-notes", settlementNotesRoutes);
app.use("/api", pdfRoutes);
app.use("/api/rdv", rdvRoutes);
app.use("/debug", debugRoutes);

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  const isTestRequest = req.headers["x-test-mode"] === "true";
  logger.error(`${req.method} ${req.path} - ${err.message}`, isTestRequest);

  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Route 404
app.use("*", (req, res) => {
  const isTestRequest = req.headers["x-test-mode"] === "true";
  logger.warn(
    `404 - Route non trouvée: ${req.method} ${req.path}`,
    isTestRequest
  );
  res.status(404).json({ message: "Route non trouvée" });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
      logger.info(`📊 Mode: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🌐 URL: http://localhost:${PORT}`);
      logger.info(`✅ Backend prêt pour les tests`);
      logger.info(`🎯 Environnement: ${envFile}`);
      logger.info(`📝 Logs automatiques activés: backend/logs/server.log`);
    });
  } catch (error) {
    logger.error(`Erreur lors du démarrage du serveur: ${error.message}`);
    process.exit(1);
  }
};

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

// Exporter l'app pour les tests
module.exports = app;
