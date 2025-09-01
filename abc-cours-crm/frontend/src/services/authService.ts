// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log(credentials);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      credentials: "include", // Envoie/reçoit les cookies
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur de connexion");
    }

    const data = await response.json();

    // Stocker seulement l'access token dans localStorage
    // Le refresh token est automatiquement stocké en cookie httpOnly
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  }

  async logout(): Promise<void> {
    // Appeler l'endpoint de logout pour supprimer le refresh token côté serveur
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // Envoie les cookies pour suppression
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
    } catch (error) {
      console.warn("Erreur lors du logout côté serveur:", error);
    }

    // Nettoyer le localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  getUser(): AuthResponse["user"] | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async refreshToken(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // Utilise le refresh token en cookie
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors du renouvellement du token");
    }

    const data = await response.json();
    // Stocker le nouveau access token
    localStorage.setItem("token", data.accessToken);
  }

  async extendSession(): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) {
        console.warn("Pas de token pour étendre la session");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/extend-session`, {
        method: "POST",
        credentials: "include", // Utilise le refresh token en cookie
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn("Impossible d'étendre la session:", response.status);
        return;
      }

      const data = await response.json();
      console.log("Session étendue jusqu'à:", data.expiresAt);
    } catch (error) {
      console.warn("Erreur lors de l'extension de session:", error);
    }
  }
}

export const authService = new AuthService();
