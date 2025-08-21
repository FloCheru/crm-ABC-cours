const express = require("express");
const router = express.Router();
const logger = require("../utils/autoLogger");

// Route pour récupérer les logs récents
router.get("/logs/:lines?", (req, res) => {
  try {
    const lines = parseInt(req.params.lines) || 50;
    const logs = logger.getRecentLogs(lines);
    res.json({
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des logs",
      message: error.message,
    });
  }
});

// Route de santé détaillée pour Agent Test
router.get("/health/detailed", (req, res) => {
  try {
    // Récupérer toutes les routes enregistrées
    const routes = [];
    req.app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // Route directe
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods),
        });
      } else if (middleware.name === "router") {
        // Router (comme nos routes API)
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods),
            });
          }
        });
      }
    });

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 3000,
      routes: routes,
      routeCount: routes.length,
      recentLogs: logger.getRecentLogs(10),
      logFile: "backend/logs/server.log",
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des informations de santé",
      message: error.message,
    });
  }
});

// Route pour nettoyer les logs (rotation)
router.post("/logs/rotate", (req, res) => {
  try {
    logger.rotateLogs();
    res.json({
      message: "Logs nettoyés avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors du nettoyage des logs",
      message: error.message,
    });
  }
});

// Route de test pour Agent Test
router.get("/test/ping", (req, res) => {
  const isTestRequest = req.headers["x-test-mode"] === "true";
  logger.info("Route de test ping appelée", isTestRequest);

  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    testMode: isTestRequest,
  });
});

module.exports = router;
