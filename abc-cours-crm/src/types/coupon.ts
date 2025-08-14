export interface Coupon {
  _id: string;
  couponSeriesId: string;
  familyId: string;
  couponNumber: string; // Code unique du coupon (anciennement code)
  status: "available" | "used" | "expired" | "cancelled";
  usedDate?: Date;
  sessionDate?: Date;
  sessionDuration?: number; // en minutes
  sessionLocation?: "home" | "professor" | "online";
  usedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  rating?: {
    student?: {
      score: number;
      comment?: string;
      ratedBy: string;
      ratedAt: Date;
    };
    professor?: {
      score: number;
      comment?: string;
      ratedBy: string;
      ratedAt: Date;
    };
  };
  notes?: string;
  billingInfo?: {
    invoiceNumber?: string;
    invoiceDate?: Date;
    amount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponSeries {
  _id: string;
  settlementNoteId: string;
  familyId: {
    _id: string;
    name: string;
  };
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    level?: string;
  };
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
