export interface SettlementNote {
  _id: string;
  clientName: string;
  department: string;
  paymentMethod: "card" | "check" | "transfer" | "cash";
  subject: {
    _id: string;
    name: string;
  };
  hourlyRate: number;
  quantity: number;
  professorSalary: number;
  salaryToPay: number; // professorSalary * usedCoupons
  charges: number;
  chargesToPay: number; // charges * usedCoupons
  marginAmount: number;
  marginPercentage: number;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
}

export interface CreateSettlementNoteData {
  clientName: string;
  department: string;
  paymentMethod: "card" | "check" | "transfer" | "cash";
  subjectId: string;
  hourlyRate: number;
  quantity: number;
  professorSalary: number;
  charges: number;
  dueDate: Date;
  notes?: string;
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
