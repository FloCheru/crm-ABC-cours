// models/CouponSeries.js
const mongoose = require("mongoose");

const couponSeriesSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      required: true,
    },

    // Quantités
    totalCoupons: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    usedCoupons: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tarification
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Dates
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    expirationDate: {
      type: Date,
      required: true,
    },

    // Statuts
    status: {
      type: String,
      enum: ["active", "expired", "suspended", "completed"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partial", "refunded"],
      default: "pending",
    },

    // Informations complémentaires
    notes: String,

    // Métadonnées
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

// Virtual pour les coupons restants
couponSeriesSchema.virtual("remainingCoupons").get(function () {
  return this.totalCoupons - this.usedCoupons;
});

// Virtual pour le pourcentage d'utilisation
couponSeriesSchema.virtual("usagePercentage").get(function () {
  return ((this.usedCoupons / this.totalCoupons) * 100).toFixed(1);
});

// Virtual pour vérifier si la série est expirée
couponSeriesSchema.virtual("isExpired").get(function () {
  return new Date() > this.expirationDate;
});

// Virtual pour vérifier si la série est complète
couponSeriesSchema.virtual("isCompleted").get(function () {
  return this.usedCoupons >= this.totalCoupons;
});

// Index pour optimiser les recherches
couponSeriesSchema.index({ family: 1, status: 1 });
couponSeriesSchema.index({ student: 1, status: 1 });
couponSeriesSchema.index({ professor: 1, status: 1 });
couponSeriesSchema.index({ subject: 1 });
couponSeriesSchema.index({ expirationDate: 1 });

// Middleware pour calculer automatiquement le montant total
couponSeriesSchema.pre("save", function (next) {
  if (this.isModified("totalCoupons") || this.isModified("hourlyRate")) {
    this.totalAmount = this.totalCoupons * this.hourlyRate;
  }

  // Mettre à jour le statut si complété
  if (this.usedCoupons >= this.totalCoupons && this.status === "active") {
    this.status = "completed";
  }

  next();
});

// Méthode pour utiliser un coupon
couponSeriesSchema.methods.useCoupon = async function () {
  if (this.remainingCoupons <= 0) {
    throw new Error("No coupons remaining in this series");
  }

  if (this.status !== "active") {
    throw new Error("Series is not active");
  }

  if (this.isExpired) {
    throw new Error("Series has expired");
  }

  this.usedCoupons += 1;
  await this.save();
  return this;
};

// Méthode pour rembourser un coupon
couponSeriesSchema.methods.refundCoupon = async function () {
  if (this.usedCoupons <= 0) {
    throw new Error("No coupons to refund in this series");
  }

  this.usedCoupons -= 1;
  if (this.status === "completed") {
    this.status = "active";
  }
  await this.save();
  return this;
};

module.exports = mongoose.model("CouponSeries", couponSeriesSchema);
