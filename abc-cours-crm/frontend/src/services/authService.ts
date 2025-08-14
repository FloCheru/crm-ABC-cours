// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
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

    // Stocker le token dans localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  }

  async logout(): Promise<void> {
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
    const token = this.getToken();
    if (!token) {
      throw new Error("Aucun token disponible");
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors du renouvellement du token");
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
  }
}

export const authService = new AuthService();
