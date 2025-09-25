import { apiClient } from "../utils";
import type { Family, Student, CreateFamilyData } from "../types/family";
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
    level: "primaire" | "collège" | "lycée" | "supérieur";
    grade: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  courseLocation?: {
    type: "domicile" | "professeur" | "autre";
    usesFamilyAddress?: boolean;
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
    return await apiClient.get("/api/families");
  }

  async getFamily(id: string): Promise<Family> {
    const response = (await apiClient.get(`/api/families/${id}`)) as FamilyResponse;
    return response.family;
  }

  async createFamily(familyData: CreateFamilyData): Promise<Family> {
    const response = (await apiClient.post(
      "/api/families",
      familyData
    )) as FamilyResponse;
    return response.family;
  }

  // Note: updateFamily() avec PUT supprimée - utiliser la version PATCH ci-dessous

  async getDeletionPreview(id: string): Promise<any> {
    const response = await apiClient.get(
      `/api/families/${id}/deletion-preview`
    );
    return response;
  }

  async deleteFamily(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/families/${id}`);
    } catch (error: any) {
      console.error(
        `❌ Erreur lors de la suppression de la famille ${id}:`,
        error
      );

      if (error.response?.status === 404) {
        throw new Error(
          `Cette famille n'existe plus ou a déjà été supprimée. Veuillez rafraîchir la page.`
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          "Vous n'avez pas les permissions pour supprimer cette famille."
        );
      } else if (error.response?.status >= 500) {
        throw new Error(
          "Erreur serveur lors de la suppression. Veuillez réessayer plus tard."
        );
      } else {
        throw new Error(
          `Erreur lors de la suppression: ${error.message || "Erreur inconnue"}`
        );
      }
    }
  }

  // Note: updateReminderSubject supprimée - utiliser updateFamily() avec nextActionReminderSubject

  async getFamilyStats(): Promise<FamilyStats> {
    const response = (await apiClient.get(
      "/api/families/stats"
    )) as FamilyStats;
    return response;
  }

  async addStudent(
    familyId: string,
    studentData: AddStudentData
  ): Promise<Student> {
    const response = (await apiClient.post(
      `/api/families/${familyId}/students`,
      studentData
    )) as StudentResponse;
    return response.student;
  }

  async updateStudent(
    familyId: string,
    studentId: string,
    studentData: AddStudentData
  ): Promise<Student> {
    const response = (await apiClient.put(
      `/api/students/${studentId}`,
      studentData
    )) as StudentResponse;
    return response.student;
  }

  async removeStudent(familyId: string, studentId: string): Promise<void> {
    await apiClient.delete(`/api/families/${familyId}/students/${studentId}`);
    console.log(`✅ Étudiant ${studentId} retiré de la famille ${familyId}`);
  }

  async updateFamily(
    familyId: string,
    updateData: {
      prospectStatus?: string | null;
      nextAction?: string;
      nextActionDate?: Date | null;
      notes?: string;
    }
  ): Promise<Family> {
    // Convertir Date en ISO string pour l'API
    const apiData = {
      ...updateData,
      nextActionDate: updateData.nextActionDate
        ? updateData.nextActionDate.toISOString()
        : updateData.nextActionDate, // preserve null/undefined
    };

    const response = (await apiClient.patch(
      `/api/families/${familyId}`,
      apiData
    )) as FamilyResponse;
    return response.family;
  }

  async updatePrimaryContact(
    familyId: string,
    contactData: {
      firstName: string;
      lastName: string;
      primaryPhone: string;
      email: string;
      gender: string;
      secondaryPhone?: string | null;
      birthDate?: Date | null;
      address?: {
        street: string;
        city: string;
        postalCode: string;
      };
    }
  ): Promise<Family> {
    // Convertir Date en ISO string pour l'API
    const apiData = {
      ...contactData,
      birthDate: contactData.birthDate
        ? contactData.birthDate.toISOString()
        : contactData.birthDate,
    };

    const response = (await apiClient.patch(
      `/api/families/${familyId}/primary-contact`,
      apiData
    )) as FamilyResponse;
    return response.family;
  }

  async updateDemande(
    familyId: string,
    demandeData: {
      level: string;
      subjects: string[];
    }
  ): Promise<Family> {
    const response = (await apiClient.patch(
      `/api/families/${familyId}/demande`,
      demandeData
    )) as FamilyResponse;
    return response.family;
  }
}

export const familyService = new FamilyService();
