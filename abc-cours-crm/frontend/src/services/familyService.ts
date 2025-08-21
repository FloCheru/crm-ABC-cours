import { apiClient } from "../utils";
import type { Family } from "../types/family";
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

  async deleteFamily(id: string): Promise<void> {
    await apiClient.delete(`/api/families/${id}`);
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

  async getFamilyStats(): Promise<FamilyStats> {
    const response = (await apiClient.get(
      "/api/families/stats"
    )) as FamilyStats;
    return response;
  }
}

export const familyService = new FamilyService();
