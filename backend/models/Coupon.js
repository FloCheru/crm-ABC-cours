const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponSeries",
      required: [true, "ID de la série de coupons requis"],
    },
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "ID de la famille requis"],
    },

    // Code unique du coupon (ex: "ABC123-001")
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Statut du coupon
    status: {
      type: String,
      enum: ["available", "used", "expired", "cancelled"],
      default: "available",
    },

    // Informations d'utilisation
    usedDate: Date,
    sessionDate: Date,
    sessionDuration: {
      type: Number, // en minutes
      min: 30,
      max: 180,
    },
    sessionLocation: {
      type: String,
      enum: ["home", "professor", "online"],
    },

    // Qui a validé l'utilisation
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Professeur ou admin qui valide
    },

    // Évaluation du cours (optionnel)
    rating: {
      student: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        ratedAt: Date,
      },
      professor: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        ratedAt: Date,
      },
    },

    notes: String,

    // Informations de facturation (si applicable)
    billingInfo: {
      invoiceNumber: String,
      invoiceDate: Date,
      amount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
// Note: code déjà indexé via unique: true dans le schéma
couponSchema.index({ couponSeriesId: 1, code: 1 }, { unique: true });
couponSchema.index({ familyId: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ usedDate: 1 });
couponSchema.index({ sessionDate: 1 });

// Virtual pour obtenir les infos de la série
couponSchema.virtual("seriesInfo", {
  ref: "CouponSeries",
  localField: "couponSeriesId",
  foreignField: "_id",
  justOne: true,
});

// Méthode pour marquer un coupon comme utilisé
couponSchema.methods.markAsUsed = async function (sessionData, usedBy) {
  if (this.status !== "available") {
    throw new Error("Coupon is not available for use");
  }

  // Vérifier que la série est encore active
  const CouponSeries = require("./CouponSeries");
  const series = await CouponSeries.findById(this.couponSeriesId);

  if (!series || series.status !== "active") {
    throw new Error("Coupon series is not active");
  }

  if (series.isExpired) {
    throw new Error("Coupon series has expired");
  }

  // Marquer le coupon comme utilisé
  this.status = "used";
  this.usedDate = new Date();
  this.sessionDate = sessionData.sessionDate || new Date();
  this.sessionDuration = sessionData.sessionDuration || 60;
  this.sessionLocation = sessionData.sessionLocation || "home";
  this.usedBy = usedBy;
  this.notes = sessionData.notes;

  await this.save();

  // Mettre à jour la série
  await series.useCoupon();

  return this;
};

// Méthode pour annuler l'utilisation d'un coupon
couponSchema.methods.cancelUsage = async function () {
  if (this.status !== "used") {
    throw new Error("Coupon is not marked as used");
  }

  // Remettre le coupon comme disponible
  this.status = "available";
  this.usedDate = undefined;
  this.sessionDate = undefined;
  this.sessionDuration = undefined;
  this.sessionLocation = undefined;
  this.usedBy = undefined;
  this.notes = undefined;

  await this.save();

  // Mettre à jour la série
  const CouponSeries = require("./CouponSeries");
  const series = await CouponSeries.findById(this.couponSeriesId);
  await series.refundCoupon();

  return this;
};

// Middleware pour validation des données de session
couponSchema.pre("save", function (next) {
  if (this.status === "used") {
    if (
      !this.usedDate ||
      !this.sessionDate ||
      !this.sessionDuration ||
      !this.usedBy
    ) {
      return next(new Error("Missing required fields for used coupon"));
    }
  }
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);
