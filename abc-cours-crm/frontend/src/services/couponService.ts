import { apiClient } from "../utils/apiClient";
import type { Coupon } from "../types/coupon";

// Interface pour typer les réponses API
interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

// Interface pour les réponses avec pagination
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CouponFilters {
  page?: number;
  limit?: number;
  series?: string;
  status?: "available" | "used" | "expired" | "cancelled";
  usedBy?: string;
  sessionDateFrom?: string;
  sessionDateTo?: string;
  sortBy?: "code" | "usedDate" | "sessionDate";
  sortOrder?: "asc" | "desc";
  search?: string; // Pour rechercher par numéro, famille, élève
}

export interface CouponsResponse {
  data: Coupon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseCouponData {
  sessionDate: string;
  sessionDuration: number;
  sessionLocation: "home" | "professor" | "online";
  notes?: string;
}

export const couponService = {
  /**
   * Récupère la liste des coupons avec filtres et pagination
   */
  async getCoupons(filters: CouponFilters = {}): Promise<Coupon[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/coupons?${params.toString()}`);
    
    // L'API retourne un objet paginé, on extrait les données
    const typedResponse = response as ApiResponse<Coupon[]> | ApiResponse<PaginatedResponse<Coupon>>;
    
    if ('data' in typedResponse && Array.isArray(typedResponse.data)) {
      return typedResponse.data;
    } else if ('data' in typedResponse && typedResponse.data && typeof typedResponse.data === 'object' && 'data' in typedResponse.data) {
      const paginatedData = typedResponse.data as PaginatedResponse<Coupon>;
      return paginatedData.data;
    }
    
    return [];
  },

  /**
   * Récupère les détails d'un coupon spécifique
   */
  async getCouponById(couponId: string): Promise<Coupon> {
    const response = await apiClient.get(`/api/coupons/${couponId}`);
    const typedResponse = response as ApiResponse<{ coupon: Coupon }>;
    return typedResponse.data.coupon;
  },

  /**
   * Marque un coupon comme utilisé
   */
  async useCoupon(couponId: string, sessionData: UseCouponData): Promise<Coupon> {
    const response = await apiClient.post(`/api/coupons/${couponId}/use`, sessionData);
    const typedResponse = response as ApiResponse<{ coupon: Coupon }>;
    return typedResponse.data.coupon;
  },

  /**
   * Annule l'utilisation d'un coupon (admin seulement)
   */
  async cancelCouponUsage(couponId: string, reason: string): Promise<Coupon> {
    const response = await apiClient.post(`/api/coupons/${couponId}/cancel-usage`, {
      reason,
    });
    const typedResponse = response as ApiResponse<{ coupon: Coupon }>;
    return typedResponse.data.coupon;
  },

  /**
   * Ajoute une évaluation à un coupon utilisé
   */
  async addRating(
    couponId: string,
    ratingData: {
      ratingType: "student" | "professor";
      score: number;
      comment?: string;
    }
  ): Promise<Coupon> {
    const response = await apiClient.patch(`/api/coupons/${couponId}/rating`, ratingData);
    const typedResponse = response as ApiResponse<{ coupon: Coupon }>;
    return typedResponse.data.coupon;
  },

  /**
   * Récupère les coupons disponibles d'une série spécifique
   */
  async getAvailableCouponsBySeries(seriesId: string): Promise<{
    series: any;
    availableCoupons: Coupon[];
    count: number;
  }> {
    const response = await apiClient.get(`/api/coupons/available/by-series/${seriesId}`);
    const typedResponse = response as ApiResponse<{
      series: any;
      availableCoupons: Coupon[];
      count: number;
    }>;
    return typedResponse.data;
  },

  /**
   * Récupère l'historique d'utilisation par professeur
   */
  async getUsageHistory(
    professorId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    data: Coupon[];
    stats: {
      totalSessions: number;
      totalHours: number;
      averageSessionDuration: number;
      subjectsCount: number;
    };
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(
      `/api/coupons/usage-history/${professorId}?${params.toString()}`
    );
    const typedResponse = response as ApiResponse<{
      data: Coupon[];
      stats: {
        totalSessions: number;
        totalHours: number;
        averageSessionDuration: number;
        subjectsCount: number;
      };
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>;
    return typedResponse.data;
  },
};