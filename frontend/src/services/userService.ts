import { apiClient } from "../utils";

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

class UserService {
  async getAdminUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get("/api/users/admins");

      // Si c'est directement un tableau
      if (Array.isArray(response)) {
        return response as User[];
      }

      // Fallback
      return [];
    } catch (error) {
      console.error("Erreur lors de la récupération des admins:", error);
      throw error;
    }
  }
}

export const userService = new UserService();