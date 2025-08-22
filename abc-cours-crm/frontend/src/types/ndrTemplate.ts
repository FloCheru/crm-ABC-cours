export interface NDRTemplateData {
  // Information du document
  noteNumber: string;
  formattedDate: string;
  generationDate: string;
  
  // Information client
  clientName: string;
  clientGender: "M." | "Mme";
  clientAddress: string;
  department: string;
  
  // Mode de paiement
  paymentMethodLabel: string;
  
  // Matières/Prestations
  subjects: Array<{
    subjectName: string;
    hourlyRate: number;
    quantity: number;
    professorSalary: number;
    total: number;
  }>;
  
  // Récapitulatif financier
  totalQuantity: number;
  totalRevenue: number;
  salaryToPay: number;
  chargesToPay: number;
  marginAmount: number;
  marginPercentage: number;
  
  // Informations spécifiques au modèle
  studentName: string;
  clientAccount: string;
  unitAmount: string;
  amountToPayByClient: number;
  amountToPayByUrssaf: number;
  
  // Échéancier (optionnel)
  paymentSchedule?: {
    paymentMethodLabel: string;
    numberOfInstallments: number;
    dayOfMonth: number;
    installments: Array<{
      formattedDate: string;
      amount: number;
      status: string;
      statusLabel: string;
    }>;
  };
  
  // Notes (optionnel)
  notes?: string;
  
  // Coupons
  totalCoupons: number;
  studentNames: string;
  couponSeries: {
    code: string;
    startNumber: number;
    endNumber: number;
  };
  coupons: Array<{
    number: string;
    series: string;
  }>;
  
  // Flags d'affichage
  includeNdr: boolean;
  includeCoupons: boolean;
}