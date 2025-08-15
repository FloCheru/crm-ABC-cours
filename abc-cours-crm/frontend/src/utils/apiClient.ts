import { logger } from './logger';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || "http://localhost:3000") {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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
      logger.debug(
        "Headers:",
        Object.fromEntries(response.headers.entries())
      );
      logger.debug("=== FIN DÉBOGAGE RÉPONSE HTTP ===");

      if (!response.ok) {
        // LOGS DE DÉBOGAGE - Erreur HTTP
        logger.error("=== ERREUR HTTP DÉTECTÉE ===");
        logger.error("Status:", response.status);
        logger.error("Status Text:", response.statusText);

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

    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
