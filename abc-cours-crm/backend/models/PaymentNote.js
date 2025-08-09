const mongoose = require("mongoose");

const paymentNoteSchema = new mongoose.Schema(
  {
    // Date de saisie de la note
    entryDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Informations famille
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "Famille requise"],
    },

    // Informations élève
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Élève requis"],
    },

    // Informations matière
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Matière requise"],
    },

    // Niveau de l'élève
    studentLevel: {
      type: String,
      enum: ["primaire", "collège", "lycée", "supérieur"],
      required: [true, "Niveau de l'élève requis"],
    },

    // Série de coupons concernée
    couponSeries: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponSeries",
      required: [true, "Série de coupons requise"],
    },

    // Professeur sélectionné
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      required: [true, "Professeur requis"],
    },

    // Montant du règlement
    amount: {
      type: Number,
      required: [true, "Montant requis"],
      min: [0, "Le montant doit être positif"],
    },

    // Méthode de paiement
    paymentMethod: {
      type: String,
      enum: ["check", "transfer", "card", "cash"],
      required: [true, "Méthode de paiement requise"],
    },

    // Statut du paiement
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },

    // Date de paiement
    paymentDate: {
      type: Date,
    },

    // Notes et commentaires
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Les notes ne peuvent pas dépasser 1000 caractères"],
    },

    // Référence du paiement (numéro de chèque, virement, etc.)
    paymentReference: {
      type: String,
      trim: true,
    },

    // Créé par
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
paymentNoteSchema.index({ family: 1, entryDate: -1 });
paymentNoteSchema.index({ student: 1, entryDate: -1 });
paymentNoteSchema.index({ couponSeries: 1 });
paymentNoteSchema.index({ professor: 1 });
paymentNoteSchema.index({ status: 1 });
paymentNoteSchema.index({ entryDate: -1 });

// Virtual pour obtenir le nom complet de l'élève
paymentNoteSchema.virtual("studentFullName").get(function () {
  if (this.populated("student")) {
    return `${this.student.firstName} ${this.student.lastName}`;
  }
  return "";
});

// Virtual pour obtenir le nom de la famille
paymentNoteSchema.virtual("familyName").get(function () {
  if (this.populated("family")) {
    return this.family.name;
  }
  return "";
});

// Méthode pour marquer comme payé
paymentNoteSchema.methods.markAsPaid = function (paymentDate = new Date()) {
  this.status = "paid";
  this.paymentDate = paymentDate;
  return this.save();
};

// Méthode pour annuler
paymentNoteSchema.methods.cancel = function () {
  this.status = "cancelled";
  return this.save();
};

// Méthode pour obtenir le statut en français
paymentNoteSchema.methods.getStatusInFrench = function () {
  const statusMap = {
    pending: "En attente",
    paid: "Payé",
    cancelled: "Annulé",
  };
  return statusMap[this.status] || this.status;
};

// Méthode pour obtenir la méthode de paiement en français
paymentNoteSchema.methods.getPaymentMethodInFrench = function () {
  const methodMap = {
    check: "Chèque",
    transfer: "Virement",
    card: "Carte bancaire",
    cash: "Espèces",
  };
  return methodMap[this.paymentMethod] || this.paymentMethod;
};

module.exports = mongoose.model("PaymentNote", paymentNoteSchema);
