export interface PaymentNote {
  _id: string;
  entryDate: string;
  family: {
    _id: string;
    name: string;
  };
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  subject: {
    _id: string;
    name: string;
  };
  studentLevel: "primaire" | "collège" | "lycée" | "supérieur";
  couponSeries: {
    _id: string;
    name: string;
    totalAmount: number;
  };
  professor: {
    _id: string;
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  };
  amount: number;
  paymentMethod: "check" | "transfer" | "card" | "cash";
  status: "pending" | "paid" | "cancelled";
  paymentDate?: string;
  notes?: string;
  paymentReference?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentNoteRequest {
  family: string;
  student: string;
  subject: string;
  studentLevel: "primaire" | "collège" | "lycée" | "supérieur";
  couponSeries: string;
  professor: string;
  amount: number;
  paymentMethod: "check" | "transfer" | "card" | "cash";
  notes?: string;
  paymentReference?: string;
}

export interface UpdatePaymentNoteRequest {
  family?: string;
  student?: string;
  subject?: string;
  studentLevel?: "primaire" | "collège" | "lycée" | "supérieur";
  couponSeries?: string;
  professor?: string;
  amount?: number;
  paymentMethod?: "check" | "transfer" | "card" | "cash";
  notes?: string;
  paymentReference?: string;
  status?: "pending" | "paid" | "cancelled";
  paymentDate?: string;
}

export interface PaymentNoteFormData {
  family: string;
  student: string;
  subject: string;
  studentLevel: "primaire" | "collège" | "lycée" | "supérieur";
  couponSeries: string;
  professor: string;
  amount: number;
  paymentMethod: "check" | "transfer" | "card" | "cash";
  notes: string;
  paymentReference: string;
}

export const PAYMENT_METHODS = [
  { value: "check", label: "Chèque" },
  { value: "transfer", label: "Virement" },
  { value: "card", label: "Carte bancaire" },
  { value: "cash", label: "Espèces" },
] as const;

export const STUDENT_LEVELS = [
  { value: "primaire", label: "Primaire" },
  { value: "collège", label: "Collège" },
  { value: "lycée", label: "Lycée" },
  { value: "supérieur", label: "Supérieur" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payé" },
  { value: "cancelled", label: "Annulé" },
] as const;
