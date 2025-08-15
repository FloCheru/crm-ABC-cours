import type { CouponSeries, CreateCouponSeriesData } from "../types/coupon";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api";

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
    const headers = this.getAuthHeaders();

    // Mapper les données du format frontend vers le format API
    const apiData = {
      family: data.familyId,
      student: data.studentId,
      professor: data.professorId || null, // null pour auto-assignation
      subject: data.subject,
      totalCoupons: data.totalCoupons,
      hourlyRate: data.hourlyRate,
      expirationMonths: 12, // Valeur par défaut
      notes: data.notes || "",
      autoAssignTeacher: data.autoAssignTeacher,
      sendNotification: data.sendNotification,
    };

    console.log("🔍 Création série - Headers:", headers);
    console.log("🔍 Création série - Données originales:", data);
    console.log("🔍 Création série - Données mappées:", apiData);

    const response = await fetch(`${API_BASE_URL}/coupon-series`, {
      method: "POST",
      headers,
      body: JSON.stringify(apiData),
    });

    console.log("🔍 Création série - Status:", response.status);
    console.log(
      "🔍 Création série - Headers réponse:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("🔍 Création série - Erreur API:", error);
      console.error(
        "🔍 Création série - Détails de validation:",
        error.details
      );

      // Construire un message d'erreur plus détaillé
      let errorMessage =
        error.message || "Erreur lors de la création de la série de coupons";

      if (error.details && Array.isArray(error.details)) {
        const validationErrors = error.details
          .map(
            (detail: { path: string; msg: string }) =>
              `${detail.path}: ${detail.msg}`
          )
          .join(", ");
        errorMessage = `Erreurs de validation: ${validationErrors}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("🔍 Création série - Succès:", result);
    return result;
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
