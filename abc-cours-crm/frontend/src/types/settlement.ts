export interface SettlementNote {
  _id: string;
  familyId: string;
  studentIds: string[]; // Tableau d'IDs d'élèves
  clientName: string;
  department: string;
  paymentMethod: "card" | "check" | "transfer" | "cash" | "PRLV";
  subjects: Array<{
    subjectId: string;
    name?: string; // Nom populé depuis la DB
    hourlyRate: number;
    quantity: number;
    professorSalary: number;
  }>;
  // Champs calculés globaux
  totalHourlyRate: number;
  totalQuantity: number;
  totalProfessorSalary: number;
  salaryToPay: number; // Somme des (professorSalary * quantity) de chaque subject
  charges: number;
  chargesToPay: number; // charges * totalQuantity
  marginAmount: number;
  marginPercentage: number;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  notes?: string;
  // Échéancier
  paymentSchedule?: {
    paymentMethod: "PRLV" | "check";
    numberOfInstallments: number;
    dayOfMonth: number; // Jour du mois (1-31) pour le prélèvement ou remise des chèques
    installments: {
      amount: number;
      dueDate: Date;
      status: "pending" | "paid" | "failed";
      paidAt?: Date;
    }[];
  };
  // Champs pour la gestion des coupons
  couponSeriesId?: {
    _id: string;
    totalCoupons: number;
    usedCoupons: number;
    status: "active" | "completed" | "expired";
  };
  totalCoupons?: number;
}

export interface CreateSettlementNoteData {
  familyId: string;
  studentIds: string[]; // Support multiple students
  clientName: string;
  department: string;
  paymentMethod: "card" | "check" | "transfer" | "cash" | "PRLV";
  subjects: Array<{
    subjectId: string;
    hourlyRate: number | string; // Peut être string pendant la saisie
    quantity: number | string; // Peut être string pendant la saisie
    professorSalary: number | string; // Peut être string pendant la saisie
  }>;
  charges: number;
  notes?: string;
  // Échéancier
  paymentSchedule?: {
    paymentMethod: "PRLV" | "check";
    numberOfInstallments: number;
    dayOfMonth: number; // Jour du mois (1-31) pour le prélèvement ou remise des chèques
  };
  // Champs calculés automatiquement
  marginPercentage: number;
  marginAmount: number;
  chargesToPay: number;
  salaryToPay: number;
}

export interface SettlementNoteStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}
