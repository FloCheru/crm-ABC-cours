import { apiClient } from "../utils";
import type { Family, Student } from "../types/family";
import type { ProspectStatus } from "../components/StatusDot";

export interface FamilyStats {
  total: number;
  prospects: number;
  clients: number;
}

interface FamiliesResponse {
  families: Family[];
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface FamilyResponse {
  family: Family;
}

interface StudentResponse {
  student: Student;
}

export interface AddStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO string format
  school: {
    name: string;
    level: "primaire" | "college" | "lycee" | "superieur";
    grade: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  courseLocation?: {
    type: "domicile" | "professeur" | "autre";
    address?: {
      street: string;
      city: string;
      postalCode: string;
    };
    otherDetails?: string;
  };
  availability?: string;
  comments?: string;
  medicalInfo?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
  };
  status?: "active" | "inactive" | "graduated";
  notes?: string;
}

class FamilyService {
  async getFamilies(): Promise<Family[]> {
    const response = (await apiClient.get("/api/families")) as FamiliesResponse;
    return response.families || [];
  }

  async getFamily(id: string): Promise<Family> {
    const response = (await apiClient.get(
      `/api/families/${id}`
    )) as FamilyResponse;
    return response.family;
  }

  async createFamily(
    familyData: Omit<Family, "_id" | "createdAt" | "updatedAt">
  ): Promise<Family> {
    const response = (await apiClient.post(
      "/api/families",
      familyData
    )) as FamilyResponse;
    return response.family;
  }

  async updateFamily(id: string, familyData: Partial<Family>): Promise<Family> {
    const response = (await apiClient.put(
      `/api/families/${id}`,
      familyData
    )) as FamilyResponse;
    return response.family;
  }

  async getDeletionPreview(id: string): Promise<any> {
    const response = await apiClient.get(`/api/families/${id}/deletion-preview`);
    return response;
  }

  async deleteFamily(id: string): Promise<void> {
    // Validation de l'ID avant suppression
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID de famille invalide pour la suppression');
    }

    // Validation format ObjectId MongoDB (24 caractères hexadécimaux)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
      throw new Error('Format d\'ID de famille invalide (doit être un ObjectId MongoDB valide)');
    }

    try {
      console.log(`🗑️ Suppression famille ID: ${id}`);
      await apiClient.delete(`/api/families/${id}`);
      console.log(`✅ Famille ${id} supprimée avec succès`);
    } catch (error: any) {
      console.error(`❌ Erreur lors de la suppression de la famille ${id}:`, error);
      
      if (error.response?.status === 404) {
        throw new Error(`Cette famille n'existe plus ou a déjà été supprimée. Veuillez rafraîchir la page.`);
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions pour supprimer cette famille.');
      } else if (error.response?.status >= 500) {
        throw new Error('Erreur serveur lors de la suppression. Veuillez réessayer plus tard.');
      } else {
        throw new Error(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
      }
    }
  }

  async updateStatus(
    id: string,
    status: "prospect" | "client"
  ): Promise<Family> {
    const response = (await apiClient.patch(`/api/families/${id}/status`, {
      status,
    })) as FamilyResponse;
    return response.family;
  }

  async updateProspectStatus(
    id: string,
    prospectStatus: ProspectStatus | null
  ): Promise<Family> {
    const response = (await apiClient.patch(`/api/families/${id}/prospect-status`, {
      prospectStatus,
    })) as FamilyResponse;
    return response.family;
  }

  async updateNextActionDate(
    id: string,
    nextActionDate: Date | null
  ): Promise<Family> {
    const response = (await apiClient.patch(`/api/families/${id}/next-action-date`, {
      nextActionDate: nextActionDate ? nextActionDate.toISOString() : null,
    })) as FamilyResponse;
    return response.family;
  }

  async updateFamilyStatus(id: string, status: 'client' | 'prospect'): Promise<Family> {
    const response = (await apiClient.patch(`/api/families/${id}/status`, {
      status,
    })) as FamilyResponse;
    return response.family;
  }

  async getFamilyStats(): Promise<FamilyStats> {
    const response = (await apiClient.get(
      "/api/families/stats"
    )) as FamilyStats;
    return response;
  }

  async addStudent(familyId: string, studentData: AddStudentData): Promise<Student> {
    const response = (await apiClient.post(
      `/api/families/${familyId}/students`,
      studentData
    )) as StudentResponse;
    return response.student;
  }
}

export const familyService = new FamilyService();
