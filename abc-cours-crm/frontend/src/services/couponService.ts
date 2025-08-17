import { apiClient } from "../utils/apiClient";
import type { Coupon } from "../types/coupon";

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
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  },

  /**
   * Récupère les détails d'un coupon spécifique
   */
  async getCouponById(couponId: string): Promise<Coupon> {
    const response = await apiClient.get(`/api/coupons/${couponId}`);
    return response.data.coupon;
  },

  /**
   * Marque un coupon comme utilisé
   */
  async useCoupon(couponId: string, sessionData: UseCouponData): Promise<Coupon> {
    const response = await apiClient.post(`/api/coupons/${couponId}/use`, sessionData);
    return response.data.coupon;
  },

  /**
   * Annule l'utilisation d'un coupon (admin seulement)
   */
  async cancelCouponUsage(couponId: string, reason: string): Promise<Coupon> {
    const response = await apiClient.post(`/api/coupons/${couponId}/cancel-usage`, {
      reason,
    });
    return response.data.coupon;
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
    return response.data.coupon;
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
    return response.data;
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
    return response.data;
  },
};