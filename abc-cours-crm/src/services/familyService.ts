import { apiClient } from "../utils/apiClient";

export interface Family {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  contact: {
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
  };
  parents: Array<{
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    profession?: string;
    isPrimaryContact: boolean;
  }>;
  financialInfo: {
    paymentMethod: "check" | "transfer" | "card";
    billingAddress?: {
      street: string;
      city: string;
      postalCode: string;
    };
    notes?: string;
  };
  status: "prospect" | "client";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyStats {
  total: number;
  prospects: number;
  clients: number;
}

class FamilyService {
  async getFamilies(): Promise<Family[]> {
    const response = await apiClient.get("/api/families");
    return response.data;
  }

  async getFamily(id: string): Promise<Family> {
    const response = await apiClient.get(`/api/families/${id}`);
    return response.data;
  }

  async createFamily(
    familyData: Omit<Family, "_id" | "createdAt" | "updatedAt">
  ): Promise<Family> {
    const response = await apiClient.post("/api/families", familyData);
    return response.data;
  }

  async updateFamily(id: string, familyData: Partial<Family>): Promise<Family> {
    const response = await apiClient.put(`/api/families/${id}`, familyData);
    return response.data;
  }

  async deleteFamily(id: string): Promise<void> {
    await apiClient.delete(`/api/families/${id}`);
  }

  async updateStatus(
    id: string,
    status: "prospect" | "client"
  ): Promise<Family> {
    const response = await apiClient.patch(`/api/families/${id}/status`, {
      status,
    });
    return response.data;
  }

  async getFamilyStats(): Promise<FamilyStats> {
    const response = await apiClient.get("/api/families/stats");
    return response.data;
  }
}

export const familyService = new FamilyService();
