import type { CouponSeries, CreateCouponSeriesData } from "../types/coupon";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class CouponSeriesService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async createCouponSeries(
    data: CreateCouponSeriesData
  ): Promise<CouponSeries> {
    const response = await fetch(`${API_BASE_URL}/coupon-series`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la création de la série de coupons"
      );
    }

    return response.json();
  }

  async getCouponSeries(): Promise<CouponSeries[]> {
    const headers = this.getAuthHeaders();
    console.log("🔍 Headers envoyés:", headers);
    console.log("🔍 Token stocké:", localStorage.getItem("token"));

    const response = await fetch(`${API_BASE_URL}/coupon-series`, {
      method: "GET",
      headers,
    });

    console.log("🔍 Status de la réponse:", response.status);
    console.log(
      "🔍 Headers de la réponse:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("🔍 Erreur de l'API:", error);
      throw new Error(
        error.message || "Erreur lors de la récupération des séries de coupons"
      );
    }

    const data = await response.json();
    console.log("🔍 Données reçues:", data);

    // Extraire les données du format de réponse paginée
    return data.data || [];
  }

  async getCouponSeriesById(id: string): Promise<CouponSeries> {
    const response = await fetch(`${API_BASE_URL}/coupon-series/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération de la série de coupons"
      );
    }

    return response.json();
  }

  async updateCouponSeries(
    id: string,
    data: Partial<CreateCouponSeriesData>
  ): Promise<CouponSeries> {
    const response = await fetch(`${API_BASE_URL}/coupon-series/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la mise à jour de la série de coupons"
      );
    }

    return response.json();
  }

  async deleteCouponSeries(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/coupon-series/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la suppression de la série de coupons"
      );
    }
  }

  async getCouponSeriesStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/coupon-series/stats`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des statistiques"
      );
    }

    return response.json();
  }
}

export const couponSeriesService = new CouponSeriesService();
