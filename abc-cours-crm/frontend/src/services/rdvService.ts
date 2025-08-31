import { apiClient } from '../utils';
import type { RendezVous } from '../types/rdv';

export interface CreateRdvData {
  familyId: string;
  assignedAdminId: string;
  date: string;
  time: string;
  type: "physique" | "virtuel";
  notes?: string;
}

export interface UpdateRdvData {
  date?: string;
  time?: string;
  type?: "physique" | "virtuel";
  notes?: string;
  status?: "planifie" | "realise" | "annule";
}

export interface RdvFilters {
  familyId?: string;
  assignedAdminId?: string;
  status?: "planifie" | "realise" | "annule";
  dateFrom?: string;
  dateTo?: string;
  type?: "physique" | "virtuel";
  page?: number;
  limit?: number;
}

export interface RdvResponse {
  rdvs: RendezVous[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AvailabilityCheck {
  available: boolean;
  conflict?: {
    id: string;
    familyId: string;
    status: string;
  } | null;
}

export interface RdvStats {
  total: number;
  byStatus: {
    planifie?: number;
    realise?: number;
    annule?: number;
  };
  weeklyCount: number;
  todayCount: number;
}

class RdvService {
  private readonly baseUrl = '/api/rdv';

  /**
   * Récupérer tous les rendez-vous avec filtres et pagination
   */
  async getRdvs(filters: RdvFilters = {}): Promise<RdvResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const data = (await apiClient.get(`${this.baseUrl}?${params.toString()}`)) as any;
      
      return {
        rdvs: data.rdvs.map(this.formatRdvDates),
        pagination: data.pagination
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des RDV:', error);
      throw this.handleError(error, 'Impossible de récupérer les rendez-vous');
    }
  }

  /**
   * Récupérer un rendez-vous spécifique
   */
  async getRdvById(id: string): Promise<RendezVous> {
    try {
      const data = (await apiClient.get(`${this.baseUrl}/${id}`)) as any;
      return this.formatRdvDates(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du RDV:', error);
      throw this.handleError(error, 'Impossible de récupérer le rendez-vous');
    }
  }

  /**
   * Créer un nouveau rendez-vous
   */
  async createRdv(rdvData: CreateRdvData): Promise<RendezVous> {
    try {
      // Validation côté client
      this.validateRdvData(rdvData);

      const data = (await apiClient.post(this.baseUrl, rdvData)) as any;
      
      return this.formatRdvDates(data.rdv);
    } catch (error) {
      console.error('Erreur lors de la création du RDV:', error);
      throw this.handleError(error, 'Impossible de créer le rendez-vous');
    }
  }

  /**
   * Mettre à jour un rendez-vous
   */
  async updateRdv(id: string, updateData: UpdateRdvData): Promise<RendezVous> {
    try {
      // Validation côté client pour les champs modifiés
      if (updateData.date || updateData.time || updateData.type) {
        this.validateRdvData(updateData as Partial<CreateRdvData>);
      }

      const data = (await apiClient.put(`${this.baseUrl}/${id}`, updateData)) as any;
      
      return this.formatRdvDates(data.rdv);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du RDV:', error);
      throw this.handleError(error, 'Impossible de mettre à jour le rendez-vous');
    }
  }

  /**
   * Supprimer/Annuler un rendez-vous
   */
  async deleteRdv(id: string): Promise<{ message: string; action: 'cancelled' | 'deleted' }> {
    try {
      const data = (await apiClient.delete(`${this.baseUrl}/${id}`)) as any;
      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression du RDV:', error);
      throw this.handleError(error, 'Impossible de supprimer le rendez-vous');
    }
  }

  /**
   * Vérifier la disponibilité d'un administrateur
   */
  async checkAvailability(adminId: string, date: string, time: string): Promise<AvailabilityCheck> {
    try {
      const params = new URLSearchParams({ date, time });
      const data = (await apiClient.get(`${this.baseUrl}/availability/${adminId}?${params.toString()}`)) as any;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      throw this.handleError(error, 'Impossible de vérifier la disponibilité');
    }
  }

  /**
   * Récupérer les statistiques des rendez-vous
   */
  async getStats(): Promise<RdvStats> {
    try {
      const data = (await apiClient.get(`${this.baseUrl}/stats/summary`)) as any;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques RDV:', error);
      throw this.handleError(error, 'Impossible de récupérer les statistiques');
    }
  }

  /**
   * Récupérer les RDV d'une famille spécifique
   */
  async getRdvsByFamily(familyId: string): Promise<RendezVous[]> {
    try {
      const response = await this.getRdvs({ familyId, limit: 100 });
      return response.rdvs;
    } catch (error) {
      console.error('Erreur lors de la récupération des RDV de la famille:', error);
      throw this.handleError(error, 'Impossible de récupérer les rendez-vous de la famille');
    }
  }

  /**
   * Récupérer les RDV d'un administrateur
   */
  async getRdvsByAdmin(adminId: string, dateFrom?: string, dateTo?: string): Promise<RendezVous[]> {
    try {
      const filters: RdvFilters = { assignedAdminId: adminId, limit: 100 };
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const response = await this.getRdvs(filters);
      return response.rdvs;
    } catch (error) {
      console.error('Erreur lors de la récupération des RDV de l\'admin:', error);
      throw this.handleError(error, 'Impossible de récupérer les rendez-vous de l\'administrateur');
    }
  }

  /**
   * Récupérer les prochains RDV (7 prochains jours)
   */
  async getUpcomingRdvs(): Promise<RendezVous[]> {
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const response = await this.getRdvs({
        dateFrom: today.toISOString().split('T')[0],
        dateTo: nextWeek.toISOString().split('T')[0],
        status: 'planifie',
        limit: 50
      });

      return response.rdvs;
    } catch (error) {
      console.error('Erreur lors de la récupération des prochains RDV:', error);
      throw this.handleError(error, 'Impossible de récupérer les prochains rendez-vous');
    }
  }

  // Méthodes utilitaires privées

  /**
   * Formater les dates d'un RDV depuis l'API
   */
  private formatRdvDates(rdv: any): RendezVous {
    return {
      ...rdv,
      date: new Date(rdv.date),
      createdAt: new Date(rdv.createdAt),
      updatedAt: new Date(rdv.updatedAt)
    };
  }

  /**
   * Validation des données de RDV
   */
  private validateRdvData(data: Partial<CreateRdvData>): void {
    if (data.date) {
      const rdvDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (rdvDate < today) {
        throw new Error('La date du rendez-vous ne peut pas être dans le passé');
      }
    }

    if (data.time) {
      const timeRegex = /^([0-1][0-9]|2[0-1]):([0-5][0-9])$/;
      if (!timeRegex.test(data.time)) {
        throw new Error('Format d\'heure invalide (HH:MM attendu)');
      }

      const [hours, minutes] = data.time.split(':').map(Number);
      if (hours < 8 || hours > 21 || minutes % 30 !== 0) {
        throw new Error('L\'heure doit être entre 08:00 et 21:00, par créneaux de 30 minutes');
      }
    }

    if (data.type && !['physique', 'virtuel'].includes(data.type)) {
      throw new Error('Type de rendez-vous invalide');
    }

    if (data.notes && data.notes.length > 1000) {
      throw new Error('Les notes ne peuvent pas dépasser 1000 caractères');
    }
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.response?.data?.errors?.length > 0) {
      return new Error(error.response.data.errors.join(', '));
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  // Méthodes utilitaires publiques

  /**
   * Formater une date et heure pour l'affichage
   */
  formatDateTime(date: Date, time: string): string {
    const formattedDate = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `${formattedDate} à ${time}`;
  }

  /**
   * Vérifier si un RDV est dans le passé
   */
  isRdvPast(date: Date, time: string): boolean {
    const now = new Date();
    const rdvDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    rdvDateTime.setHours(hours, minutes, 0, 0);
    
    return rdvDateTime < now;
  }

  /**
   * Calculer le temps restant avant un RDV
   */
  getTimeUntilRdv(date: Date, time: string): string {
    const now = new Date();
    const rdvDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    rdvDateTime.setHours(hours, minutes, 0, 0);
    
    const diff = rdvDateTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Passé';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `Dans ${days} jour${days > 1 ? 's' : ''}`;
    } else if (remainingHours > 0) {
      return `Dans ${remainingHours} heure${remainingHours > 1 ? 's' : ''}`;
    } else {
      const remainingMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Dans ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }
  }
}

// Export d'une instance unique
export default new RdvService();