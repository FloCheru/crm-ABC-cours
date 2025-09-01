const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api";

export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

export interface AdminListResponse {
  message: string;
  admins: Admin[];
}

class AdminService {
  async getAdmins(): Promise<Admin[]> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token d'authentification requis");
    }

    const response = await fetch(`${API_BASE_URL}/auth/admins`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de la récupération des administrateurs");
    }

    const data: AdminListResponse = await response.json();
    return data.admins;
  }
}

export const adminService = new AdminService();