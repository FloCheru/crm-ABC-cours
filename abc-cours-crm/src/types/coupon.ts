export interface CouponSeries {
  _id: string;
  name: string;
  family: {
    _id: string;
    name: string;
    email: string;
  };
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    level: string;
  };
  subject: {
    _id: string;
    name: string;
    category: string;
  };
  professor?: {
    _id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  hourlyRate: number;
  totalCoupons: number;
  usedCoupons: number;
  remainingCoupons: number;
  totalAmount: number;
  status: "active" | "inactive" | "expired";
  notes?: string;
  autoAssignTeacher: boolean;
  sendNotification: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface Coupon {
  _id: string;
  seriesId: string;
  code: string;
  status: "unused" | "used" | "expired" | "blocked";
  usedAt?: Date;
  usedBy?: {
    _id: string;
    name: string;
  };
  createdAt: Date;
  expiresAt?: Date;
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
