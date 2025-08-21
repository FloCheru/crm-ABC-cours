const mongoose = require("mongoose");

const settlementNoteSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "ID de la famille requis"],
    },
    studentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    }],
    clientName: {
      type: String,
      required: [true, "Nom du client requis"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Département requis"],
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "check", "transfer", "cash"],
      required: [true, "Mode de règlement requis"],
    },
    paymentType: {
      type: String,
      enum: ["immediate_advance", "tax_credit_n1"],
      required: false,
    },
    subjects: [{
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: [true, "Matière requise"],
      },
      hourlyRate: {
        type: Number,
        required: [true, "Tarif horaire requis"],
        min: [0, "Le tarif doit être positif"],
      },
      quantity: {
        type: Number,
        required: [true, "Quantité requise"],
        min: [1, "La quantité doit être au moins 1"],
      },
      professorSalary: {
        type: Number,
        required: [true, "Salaire du professeur requis"],
        min: [0, "Le salaire doit être positif"],
      },
    }],
    // Champs calculés globaux (somme de tous les subjects)
    totalHourlyRate: {
      type: Number,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    totalProfessorSalary: {
      type: Number,
      default: 0,
    },
    salaryToPay: {
      type: Number,
      min: [0, "Le salaire à verser doit être positif"],
    },
    charges: {
      type: Number,
      required: [true, "Charges requises"],
      min: [0, "Les charges doivent être positives"],
    },
    chargesToPay: {
      type: Number,
      min: [0, "Les charges à verser doivent être positives"],
    },
    marginAmount: {
      type: Number,
      min: [0, "Le montant de la marge doit être positif"],
    },
    marginPercentage: {
      type: Number,
      min: [0, "Le pourcentage de marge doit être positif"],
      max: [100, "Le pourcentage de marge ne peut pas dépasser 100%"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    // Échéancier de paiement (optionnel)
    paymentSchedule: {
      type: {
        paymentMethod: {
          type: String,
          enum: ["PRLV", "check"],
          required: true,
        },
        numberOfInstallments: {
          type: Number,
          min: [1, "Au moins une échéance requise"],
          required: true,
        },
        dayOfMonth: {
          type: Number,
          min: [1, "Le jour doit être entre 1 et 31"],
          max: [31, "Le jour doit être entre 1 et 31"],
          required: true,
        },
        installments: [{
          amount: {
            type: Number,
            min: [0, "Le montant doit être positif"],
          },
          dueDate: {
            type: Date,
          },
          status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
          },
          paidAt: {
            type: Date,
          },
        }],
      },
      required: false,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Utilisateur créateur requis"],
    },
    // Champs pour la gestion des coupons
    couponSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponSeries",
    },
    totalCoupons: {
      type: Number,
      min: [0, "Le nombre de coupons doit être positif"],
      default: 0,
    },
    // Champs pour la gestion des PDFs générés
    generatedPDFs: [{
      fileName: {
        type: String,
        required: true,
      },
      filePath: {
        type: String,
        required: true,
      },
      generatedAt: {
        type: Date,
        default: Date.now,
      },
      type: {
        type: String,
        enum: ["ndr", "coupons", "both"],
        default: "ndr",
      },
      totalPages: {
        type: Number,
        default: 1,
      },
      fileSize: {
        type: Number,
        required: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
settlementNoteSchema.index({ familyId: 1 });
settlementNoteSchema.index({ clientName: 1 });
settlementNoteSchema.index({ department: 1 });
settlementNoteSchema.index({ status: 1 });
settlementNoteSchema.index({ "paymentSchedule.dayOfMonth": 1 });
settlementNoteSchema.index({ createdAt: -1 });
settlementNoteSchema.index({ couponSeriesId: 1 });

// Middleware pour calculer automatiquement les montants
settlementNoteSchema.pre("save", function (next) {
  // Calculer les totaux à partir du tableau subjects
  if (this.subjects && this.subjects.length > 0) {
    this.totalHourlyRate = this.subjects.reduce((sum, subject) => sum + (subject.hourlyRate || 0), 0);
    this.totalQuantity = this.subjects.reduce((sum, subject) => sum + (subject.quantity || 0), 0);
    this.totalProfessorSalary = this.subjects.reduce((sum, subject) => sum + (subject.professorSalary || 0), 0);
  } else {
    this.totalHourlyRate = 0;
    this.totalQuantity = 0;
    this.totalProfessorSalary = 0;
  }

  // Calculer le salaire à verser (basé sur les totaux)
  this.salaryToPay = this.subjects.reduce((sum, subject) => 
    sum + ((subject.professorSalary || 0) * (subject.quantity || 0)), 0);

  // Calculer les charges à verser (charges globales * quantité totale)
  this.chargesToPay = this.charges * this.totalQuantity;

  // Calculer la marge
  const totalRevenue = this.subjects.reduce((sum, subject) => 
    sum + ((subject.hourlyRate || 0) * (subject.quantity || 0)), 0);
  const totalCosts = this.salaryToPay + this.chargesToPay;
  this.marginAmount = totalRevenue - totalCosts;

  // Calculer le pourcentage de marge
  if (totalRevenue > 0) {
    this.marginPercentage = (this.marginAmount / totalRevenue) * 100;
  } else {
    this.marginPercentage = 0;
  }

  next();
});

// Méthode pour marquer comme payé
settlementNoteSchema.methods.markAsPaid = function () {
  this.status = "paid";
  this.paidAt = new Date();
  return this.save();
};

// Méthode pour vérifier si en retard (basée sur les échéances)
settlementNoteSchema.methods.isOverdue = function () {
  if (this.status !== "pending") return false;
  
  if (this.paymentSchedule && this.paymentSchedule.installments) {
    // Vérifier si une échéance est en retard
    const now = new Date();
    return this.paymentSchedule.installments.some(installment => 
      installment.status === "pending" && installment.dueDate < now
    );
  }
  
  return false;
};

// Méthode statique pour mettre à jour les statuts en retard
settlementNoteSchema.statics.updateOverdueStatus = async function () {
  const notes = await this.find({
    status: "pending",
    "paymentSchedule.installments": { $exists: true }
  });

  let overdueCount = 0;
  const now = new Date();

  for (const note of notes) {
    if (note.paymentSchedule && note.paymentSchedule.installments) {
      const hasOverdueInstallment = note.paymentSchedule.installments.some(installment => 
        installment.status === "pending" && installment.dueDate < now
      );
      
      if (hasOverdueInstallment && note.status === "pending") {
        note.status = "overdue";
        await note.save();
        overdueCount++;
      }
    }
  }

  return overdueCount;
};

module.exports = mongoose.model("SettlementNote", settlementNoteSchema);
