export interface Coupon {
  _id: string;
  couponSeriesId?: string;
  code: string;
  status: "available" | "used" | "deleted";
  updatedAt: string;

  // Informations d'utilisation (pour coupons utilisés)
  usedBy?: {
    professorId: string;
    professorName: string;
  };
  usedAt?: string; // Date de saisie du coupon

  // Données de la séance
  sessionData?: {
    sessionDate: string; // Date du cours effectué
    sessionDuration: number; // Durée en heures (toujours 1)
    sessionLocation: "home" | "professor" | "online"; // Lieu du cours
    notes?: string; // Notes optionnelles
  };

  // Informations enrichies (depuis la série/NDR)
  familyName?: string;
  studentName?: string;
  subjectName?: string;
  professorSalary?: number; // Montant à facturer pour ce coupon

  // Annulation
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface CouponSeries {
  _id: string;
  settlementNoteId: string;
  familyId: {
    _id: string;
    primaryContact: {
      firstName: string;
      lastName: string;
      email: string;
    };
    demande?: {
      beneficiaryType?: string;
    };
  };
  studentId?: {
    _id: string;
    firstName: string;
    lastName: string;
    grade?: string;
  };
  studentIds?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    grade?: string;
  }>;
  beneficiaryType?: "student" | "adult" | "mixed";
  totalCoupons: number;
  usedCoupons: number;
  status: "active" | "completed" | "expired";
  coupons: string[]; // IDs des coupons
  subject: {
    _id: string;
    name: string;
    category: string;
  };
  hourlyRate: number;
  professorSalary: number;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponSeriesStats {
  totalCoupons: number;
  usedCoupons: number;
  remainingCoupons: number;
  status: "active" | "completed" | "expired";
  usagePercentage: string;
}

export interface CouponGenerationResult {
  couponSeries: CouponSeries;
  coupons: string[];
  totalCoupons: number;
}

export interface SettlementNoteWithCoupons {
  settlementNoteId: string;
  couponSeries: CouponSeries;
  stats: CouponSeriesStats;
}

export interface CreateCouponSeriesData {
  familyId: string;
  studentId: string;
  professorId?: string; // Optionnel pour l'auto-assignation
  subject: string;
  hourlyRate: number;
  totalCoupons: number;
  notes?: string;
  autoAssignTeacher: boolean;
  sendNotification: boolean;
}

export interface CouponSeriesFormData {
  familyId: string;
  studentId: string;
  subject: string;
  hourlyRate: number;
  totalCoupons: number;
  notes: string;
  autoAssignTeacher: boolean;
  sendNotification: boolean;
}
