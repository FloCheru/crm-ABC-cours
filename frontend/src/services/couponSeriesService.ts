import type { CouponSeries, CreateCouponSeriesData } from "../types/coupon";
import { apiClient } from "../utils/apiClient";

class CouponSeriesService {
  async createCouponSeries(
    data: CreateCouponSeriesData
  ): Promise<CouponSeries> {
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

    console.log("🔍 Création série - Données originales:", data);
    console.log("🔍 Création série - Données mappées:", apiData);

    try {
      const result = await apiClient.post<CouponSeries>("/api/coupon-series", apiData);
      console.log("🔍 Création série - Succès:", result);
      return result;
    } catch (error) {
      console.error("🔍 Création série - Erreur API:", error);
      throw error;
    }
  }

  async getCouponSeries(): Promise<CouponSeries[]> {
    console.log("🔍 Récupération des séries de coupons...");

    try {
      const data = await apiClient.get<{ data: CouponSeries[] }>("/api/coupon-series");
      console.log("🔍 Données reçues:", data);

      // Extraire les données du format de réponse paginée
      return data.data || [];
    } catch (error) {
      console.error("🔍 Erreur de l'API:", error);
      throw error;
    }
  }

  async getCouponSeriesById(id: string): Promise<CouponSeries> {
    try {
      const data = await apiClient.get<{ series: CouponSeries } | CouponSeries>(`/api/coupon-series/${id}`);
      console.log("🔍 Données série reçues:", data);
      
      // Le backend peut retourner { series: {...} } ou directement les données
      return (data as any).series || data;
    } catch (error) {
      console.error("🔍 Erreur lors de la récupération de la série:", error);
      throw error;
    }
  }

  async updateCouponSeries(
    id: string,
    data: Partial<CreateCouponSeriesData>
  ): Promise<CouponSeries> {
    try {
      return await apiClient.put<CouponSeries>(`/api/coupon-series/${id}`, data);
    } catch (error) {
      console.error("🔍 Erreur lors de la mise à jour de la série:", error);
      throw error;
    }
  }

  async deleteCouponSeries(id: string): Promise<void> {
    try {
      await apiClient.delete<void>(`/api/coupon-series/${id}`);
    } catch (error) {
      console.error("🔍 Erreur lors de la suppression de la série:", error);
      throw error;
    }
  }

  async getCouponSeriesStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
  }> {
    try {
      return await apiClient.get<{
        total: number;
        active: number;
        inactive: number;
        expired: number;
      }>("/api/coupon-series/stats");
    } catch (error) {
      console.error("🔍 Erreur lors de la récupération des statistiques:", error);
      throw error;
    }
  }
}

export const couponSeriesService = new CouponSeriesService();