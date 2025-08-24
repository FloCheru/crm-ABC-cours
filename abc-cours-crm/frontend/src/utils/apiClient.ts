import { logger } from "./logger";

// Type pour éviter l'import circulaire
type LogoutFunction = () => void;

// Interface pour la configuration de retry
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

// Configuration par défaut pour les retry
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 seconde
  maxDelay: 30000, // 30 secondes max
  retryableStatuses: [429, 500, 502, 503, 504], // Codes d'erreur à retry
};

class ApiClient {
  private baseURL: string;
  private logoutCallback: LogoutFunction | null = null;
  private retryConfig: RetryConfig;

  constructor(
    baseURL: string = import.meta.env.VITE_API_URL || "http://localhost:3000",
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    this.baseURL = baseURL;
    this.retryConfig = retryConfig;
  }

  // Méthode pour enregistrer le callback de logout
  setLogoutCallback(callback: LogoutFunction) {
    this.logoutCallback = callback;
  }

  // Calculer le délai d'attente avec exponential backoff
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * delay; // Ajouter un peu d'aléatoire
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  // Vérifier si le statut est retryable
  private isRetryableStatus(status: number): boolean {
    return this.retryConfig.retryableStatuses.includes(status);
  }

  // Fonction d'attente
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Méthode pour récupérer le token
  getToken(): string | null {
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Récupérer le token d'authentification depuis localStorage
    const token = localStorage.getItem("token");

    // Debug: afficher le token et l'URL
    logger.debug("API Request Debug:");
    logger.debug("URL:", url);
    logger.debug("Token présent:", !!token);
    logger.debug(
      "Token (premiers caractères):",
      token ? token.substring(0, 20) + "..." : "null"
    );

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // LOGS DE DÉBOGAGE - Réponse HTTP
      logger.debug("=== DÉBOGAGE RÉPONSE HTTP ===");
      logger.debug("Status:", response.status);
      logger.debug("Status Text:", response.statusText);
      logger.debug("Headers:", Array.from(response.headers.entries()));
      logger.debug("=== FIN DÉBOGAGE RÉPONSE HTTP ===");

      if (!response.ok) {
        // LOGS DE DÉBOGAGE - Erreur HTTP
        logger.error("=== ERREUR HTTP DÉTECTÉE ===");
        logger.error("Status:", response.status);
        logger.error("Status Text:", response.statusText);

        // Gestion spécifique de l'expiration du token
        if (response.status === 401 || response.status === 403) {
          logger.warn("Token expiré ou invalide, déconnexion automatique");

          // Appeler le callback de logout s'il est défini
          if (this.logoutCallback) {
            this.logoutCallback();
          }

          // Rediriger vers la page de connexion après un court délai
          setTimeout(() => {
            // Utiliser l'API History pour éviter les problèmes de contexte React
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }, 100);
        }

        // Essayer de récupérer le corps de la réponse pour plus de détails
        try {
          const errorBody = await response.text();
          logger.error("Corps de l'erreur:", errorBody);
        } catch (parseError) {
          logger.error(
            "Impossible de parser le corps de l'erreur:",
            parseError
          );
        }
        logger.error("=== FIN ERREUR HTTP ===");

        // Vérifier si on peut retry cette erreur
        if (this.isRetryableStatus(response.status) && attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          logger.warn(`Tentative ${attempt + 1}/${this.retryConfig.maxRetries} - Retry dans ${Math.round(delay)}ms`);
          
          await this.sleep(delay);
          return this.request<T>(endpoint, options, attempt + 1);
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Si la réponse est vide, retourner un objet vide
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        return {} as T;
      }

      const responseData = await response.json();
      logger.debug("Réponse parsée:", responseData);
      return responseData;
    } catch (error) {
      logger.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    // LOGS DE DÉBOGAGE - ApiClient POST
    logger.debug("=== DÉBOGAGE APICLIENT POST ===");
    logger.debug("Endpoint:", endpoint);
    logger.debug("Données reçues:", data);
    logger.debug("Type des données:", typeof data);
    logger.debug(
      "Données JSON stringifiées:",
      data ? JSON.stringify(data) : "undefined"
    );
    logger.debug("=== FIN DÉBOGAGE APICLIENT POST ===");

    const config: RequestInit = {
      method: "POST",
    };
    if (data) {
      config.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, config);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const config: RequestInit = {
      method: "PUT",
    };
    if (data) {
      config.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, config);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const config: RequestInit = {
      method: "PATCH",
    };
    if (data) {
      config.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, config);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
