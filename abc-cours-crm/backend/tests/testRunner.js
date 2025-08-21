const logger = require("../utils/autoLogger");

// Agent Test automatisé avec système de logs intelligent
class AutomatedTestRunner {
  constructor() {
    this.baseUrl = process.env.VITE_API_URL || "http://localhost:3000";
    this.testResults = [];
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async testRouteAutomatically(route, method = "GET", data = null) {
    console.log(`🧪 Testing ${method} ${route}...`);

    try {
      // 1. Diagnostic système
      const healthCheck = await this.checkSystemHealth();

      // 2. Test avec header spécial pour logging synchrone
      const testResult = await this.executeTest(route, method, data);

      // 3. Délai de sécurité pour garantir écriture logs
      await this.delay(100);

      // 4. Récupération logs automatique
      const logs = await this.getRecentLogs(30);

      // 5. Analyse automatique
      const analysis = this.analyzeResults(testResult, logs);

      const result = {
        route,
        method,
        timestamp: new Date().toISOString(),
        healthCheck,
        testResult,
        logs: logs.slice(-10), // 10 dernières lignes pour rapport
        analysis,
        success: analysis.success,
      };

      this.testResults.push(result);
      return result;
    } catch (error) {
      const errorResult = {
        route,
        method,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false,
      };

      this.testResults.push(errorResult);
      return errorResult;
    }
  }

  async checkSystemHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/debug/health/detailed`);
      return await response.json();
    } catch (error) {
      return { error: "Backend inaccessible", message: error.message };
    }
  }

  async executeTest(route, method, data) {
    const url = `${this.baseUrl}${route}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-test-mode": "true", // Force logging synchrone
      },
    };

    if (data && (method === "POST" || method === "PATCH" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.text();

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
        url: url,
      };
    } catch (error) {
      return {
        error: error.message,
        url: url,
      };
    }
  }

  async getRecentLogs(lines = 30) {
    try {
      const response = await fetch(`${this.baseUrl}/debug/logs/${lines}`);
      const data = await response.json();
      return data.logs || [];
    } catch (error) {
      return [`Error fetching logs: ${error.message}`];
    }
  }

  analyzeResults(testResult, logs) {
    const status = testResult.status;
    const isSuccess = status >= 200 && status < 300;

    // Rechercher dans les logs si la requête apparaît
    const requestFound = logs.some(
      (log) =>
        log.includes(testResult.url) ||
        log.includes("PATCH") ||
        log.includes("POST") ||
        log.includes("GET")
    );

    // Détecter erreurs dans les logs
    const hasErrors = logs.some(
      (log) =>
        log.includes("ERROR") || log.includes("404") || log.includes("500")
    );

    return {
      success: isSuccess,
      statusCode: status,
      requestFound,
      hasErrors,
      diagnosis: this.getDiagnosis(status, requestFound, hasErrors),
      recommendation: this.getRecommendation(status, requestFound, hasErrors),
    };
  }

  getDiagnosis(status, requestFound, hasErrors) {
    if (status >= 200 && status < 300) {
      return "✅ Test réussi - Route fonctionne correctement";
    }

    if (status === 404) {
      return "❌ Route non trouvée - Vérifier définition route côté serveur";
    }

    if (status === 401) {
      return "⚠️ Authentification requise - Token JWT manquant ou invalide";
    }

    if (status === 500) {
      return "❌ Erreur serveur interne - Vérifier logs backend pour détails";
    }

    if (!requestFound) {
      return "🔍 Requête non trouvée dans logs - Possible problème réseau";
    }

    return `⚠️ Status HTTP ${status} - Analyser réponse détaillée`;
  }

  getRecommendation(status, requestFound, hasErrors) {
    if (status >= 200 && status < 300) {
      return "Aucune action requise";
    }

    if (status === 404) {
      return "Vérifier que la route est bien définie dans le fichier de routes correspondant";
    }

    if (status === 401) {
      return "Ajouter token JWT valide dans header Authorization ou implémenter authentification";
    }

    if (status === 500 && hasErrors) {
      return "Analyser logs d'erreur pour identifier cause exacte du problème serveur";
    }

    return "Analyser réponse détaillée et logs pour diagnostic complet";
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter((r) => r.success).length;
    const failedTests = totalTests - successfulTests;

    return {
      summary: {
        total: totalTests,
        successful: successfulTests,
        failed: failedTests,
        successRate:
          totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0,
      },
      details: this.testResults,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = AutomatedTestRunner;
