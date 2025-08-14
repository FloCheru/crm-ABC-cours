class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = "http://localhost:3000") {
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
    console.log("🔍 API Request Debug:");
    console.log("🔍 URL:", url);
    console.log("🔍 Token présent:", !!token);
    console.log(
      "🔍 Token (premiers caractères):",
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

      // 🔍 LOGS DE DÉBOGAGE - Réponse HTTP
      console.log("🔍 === DÉBOGAGE RÉPONSE HTTP ===");
      console.log("🔍 Status:", response.status);
      console.log("🔍 Status Text:", response.statusText);
      console.log(
        "🔍 Headers:",
        Object.fromEntries(response.headers.entries())
      );
      console.log("🔍 === FIN DÉBOGAGE RÉPONSE HTTP ===");

      if (!response.ok) {
        // 🔍 LOGS DE DÉBOGAGE - Erreur HTTP
        console.log("❌ === ERREUR HTTP DÉTECTÉE ===");
        console.log("❌ Status:", response.status);
        console.log("❌ Status Text:", response.statusText);

        // Essayer de récupérer le corps de la réponse pour plus de détails
        try {
          const errorBody = await response.text();
          console.log("❌ Corps de l'erreur:", errorBody);
        } catch (parseError) {
          console.log(
            "❌ Impossible de parser le corps de l'erreur:",
            parseError
          );
        }
        console.log("❌ === FIN ERREUR HTTP ===");

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
      console.log("🔍 Réponse parsée:", responseData);
      return responseData;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    // 🔍 LOGS DE DÉBOGAGE - ApiClient POST
    console.log("🔍 === DÉBOGAGE APICLIENT POST ===");
    console.log("🔍 Endpoint:", endpoint);
    console.log("🔍 Données reçues:", data);
    console.log("🔍 Type des données:", typeof data);
    console.log(
      "🔍 Données JSON stringifiées:",
      data ? JSON.stringify(data) : "undefined"
    );
    console.log("🔍 === FIN DÉBOGAGE APICLIENT POST ===");

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
