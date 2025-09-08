// models/CouponSeries.js
const mongoose = require("mongoose");

const couponSeriesSchema = new mongoose.Schema(
  {
    settlementNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SettlementNote",
      required: [true, "ID de la note de règlement requis"],
    },
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "ID de la famille requis"],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false, // Optionnel pour permettre les NDR famille seule
    },
    // Nouveau champ pour supporter multiples élèves (optionnel pour compatibilité)
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    // Type de bénéficiaire pour gérer adulte/élève/mixte
    beneficiaryType: {
      type: String,
      enum: ["student", "adult", "mixed"],
      default: "student", // Par défaut pour compatibilité
    },
    // Information sur le bénéficiaire adulte
    adultBeneficiary: {
      isContact: {
        type: Boolean,
        default: true, // Par défaut, c'est le contact principal
      },
      customName: {
        type: String,
        trim: true, // Optionnel si différent du contact principal
      },
    },
    totalCoupons: {
      type: Number,
      required: [true, "Nombre total de coupons requis"],
      min: [1, "Le nombre de coupons doit être au moins 1"],
    },
    usedCoupons: {
      type: Number,
      default: 0,
      min: [0, "Le nombre de coupons utilisés ne peut pas être négatif"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
    coupons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
    ],
    // Métadonnées de la série
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Matière requise"],
    },
    // Nouveau champ pour supporter multiples matières (optionnel pour compatibilité)
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
        },
        hourlyRate: {
          type: Number,
          min: [0, "Le tarif doit être positif"],
        },
        quantity: {
          type: Number,
          min: [1, "La quantité doit être au moins 1"],
        },
        professorSalary: {
          type: Number,
          min: [0, "Le salaire doit être positif"],
        },
      },
    ],
    hourlyRate: {
      type: Number,
      required: [true, "Tarif horaire requis"],
      min: [0, "Le tarif doit être positif"],
    },
    professorSalary: {
      type: Number,
      required: [true, "Salaire du professeur requis"],
      min: [0, "Le salaire doit être positif"],
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
couponSeriesSchema.index({ settlementNoteId: 1 });
couponSeriesSchema.index({ familyId: 1 });
couponSeriesSchema.index({ studentId: 1 });
couponSeriesSchema.index({ status: 1 });
couponSeriesSchema.index({ subject: 1 });
couponSeriesSchema.index({ createdAt: -1 });

// Méthode pour vérifier si la série est complète
couponSeriesSchema.methods.isCompleted = function () {
  return this.usedCoupons >= this.totalCoupons;
};

// Méthode pour obtenir le nombre de coupons restants
couponSeriesSchema.methods.getRemainingCoupons = function () {
  return this.totalCoupons - this.usedCoupons;
};

// Méthode pour marquer un coupon comme utilisé
couponSeriesSchema.methods.useCoupon = function () {
  if (this.usedCoupons < this.totalCoupons) {
    this.usedCoupons += 1;

    // Mettre à jour le statut si tous les coupons sont utilisés
    if (this.usedCoupons >= this.totalCoupons) {
      this.status = "completed";
    }

    return true;
  }
  return false;
};

module.exports = mongoose.model("CouponSeries", couponSeriesSchema);
