const mongoose = require("mongoose");

const settlementNoteSchema = new mongoose.Schema(
  {
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
    subject: {
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
    salaryToPay: {
      type: Number,
      required: [true, "Salaire à verser requis"],
      min: [0, "Le salaire à verser doit être positif"],
    },
    charges: {
      type: Number,
      required: [true, "Charges requises"],
      min: [0, "Les charges doivent être positives"],
    },
    chargesToPay: {
      type: Number,
      required: [true, "Charges à verser requises"],
      min: [0, "Les charges à verser doivent être positives"],
    },
    marginAmount: {
      type: Number,
      required: [true, "Montant de la marge requis"],
    },
    marginPercentage: {
      type: Number,
      required: [true, "Pourcentage de marge requis"],
      min: [0, "Le pourcentage de marge doit être positif"],
      max: [100, "Le pourcentage de marge ne peut pas dépasser 100%"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: [true, "Date d'échéance requise"],
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
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
settlementNoteSchema.index({ clientName: 1 });
settlementNoteSchema.index({ department: 1 });
settlementNoteSchema.index({ status: 1 });
settlementNoteSchema.index({ dueDate: 1 });
settlementNoteSchema.index({ createdAt: -1 });

// Middleware pour calculer automatiquement les montants
settlementNoteSchema.pre("save", function (next) {
  // Calculer le salaire à verser
  this.salaryToPay = this.professorSalary * this.quantity;

  // Calculer les charges à verser
  this.chargesToPay = this.charges * this.quantity;

  // Calculer la marge
  const totalRevenue = this.hourlyRate * this.quantity;
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

// Méthode pour vérifier si en retard
settlementNoteSchema.methods.isOverdue = function () {
  return this.status === "pending" && new Date() > this.dueDate;
};

// Méthode statique pour mettre à jour les statuts en retard
settlementNoteSchema.statics.updateOverdueStatus = async function () {
  const overdueNotes = await this.find({
    status: "pending",
    dueDate: { $lt: new Date() },
  });

  for (const note of overdueNotes) {
    note.status = "overdue";
    await note.save();
  }

  return overdueNotes.length;
};

module.exports = mongoose.model("SettlementNote", settlementNoteSchema);
