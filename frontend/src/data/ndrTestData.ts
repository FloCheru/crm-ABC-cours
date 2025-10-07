import type { NDRTemplateData } from "../types/ndrTemplate";

export const mockNDRData: NDRTemplateData = {
  // Information du document
  noteNumber: "2025-07-964",
  formattedDate: "1 Juillet 2025",
  generationDate: "1 juillet 2025 à 10:30",

  // Information client
  clientName: "LAVAURY PRISCILLA",
  clientGender: "Mme",
  // clientRelation: "mère" as "mère" | "père" | "tuteur",
  clientAddress: "1 Rue JEANNE GALZY\n34670 BAILLARGUES",
  department: "34 - Hérault",

  // Mode de paiement
  paymentMethodLabel: "Carte Bancaire",

  // Matières/Prestations
  subjects: [
    {
      subjectName: "COURS AIDE AUX DEVOIRS CE2",
      hourlyRate: 36.5,
      quantity: 66,
      professorSalary: 18,
      total: 2409.0,
    },
  ],

  // Récapitulatif financier
  totalQuantity: 66,
  totalRevenue: 2409.0,
  salaryToPay: 1188.0,
  chargesToPay: 237.6,
  marginAmount: 983.4,
  marginPercentage: 40.8,

  // Informations spécifiques au modèle
  studentName: "ZOE PIGAIANI",
  clientAccount: "#1113226",
  unitAmount: "36.50 €",
  amountToPayByClient: 1204.8,
  amountToPayByUrssaf: 1204.5,

  // Échéancier
  paymentSchedule: {
    paymentMethodLabel: "PRLV",
    numberOfInstallments: 10,
    dayOfMonth: 5,
    installments: [
      {
        formattedDate: "05-09-2025",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-10-2025",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-11-2025",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-12-2025",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-01-2026",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-02-2026",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-03-2026",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-04-2026",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-05-2026",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
      {
        formattedDate: "05-06-2026",
        amount: 120.45,
        status: "pending",
        statusLabel: "PRLV",
      },
    ],
  },

  // Notes
  notes:
    "Cours dispensés à domicile. Professeurs qualifiés et expérimentés. Suivi régulier des progrès.",

  // Coupons
  totalCoupons: 12,
  studentNames: "ZOE PIGAIANI",
  couponSeries: {
    code: "EMM-2024-001",
    startNumber: 1001,
    endNumber: 1012,
  },
  coupons: Array.from({ length: 12 }, (_, index) => ({
    number: (1001 + index).toString(),
    series: "EMM-2024-001",
  })),

  // Flags d'affichage
  includeNdr: true,
  includeCoupons: true,
};
