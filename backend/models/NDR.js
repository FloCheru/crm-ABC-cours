const mongoose = require("mongoose");

const settlementNoteSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "ID de la famille requis"],
    },
    beneficiaries: {
      students: [
        {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "ID de l'étudiant requis"],
          },
        },
      ],
      adult: {
        type: Boolean,
        default: false,
      },
    },
    paymentMethod: {
      type: String,
      required: [true, "Mode de règlement requis"],
    },
    subjects: {
      type: [
        {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "ID de la matière requis"],
          },
        },
      ],
      validate: {
        validator: function (subjects) {
          return subjects && subjects.length > 0;
        },
        message: "Au moins une matière requise pour la NDR",
      },
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
    charges: {
      type: Number,
      required: [true, "Charges requises"],
      min: [0, "Les charges doivent être positives"],
    },
    status: {
      type: String,
      required: [true, "Statut requis"],
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Utilisateur créateur requis"],
      },
    },
    coupons: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: [true, "ID du coupon requis"],
        },
        code: {
          type: String,
          required: [true, "Code du coupon requis"],
          unique: true,
        },
        status: {
          type: String,
          required: [true, "Statut du coupon requis"],
          enum: {
            values: ["available", "used", "deleted"],
            message: "Statut du coupon invalide. Valeurs autorisées: available, used, deleted"
          },
          default: "available",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    generatedPDFs: [],
    professor: {
      type: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: [true, "ID du professeur requis"],
        },
        salary: {
          type: Number,
          min: [0, "Le salaire doit être positif"],
          required: false,
        },
      },
      required: false, // Temporaire - à changer en true quand les professeurs seront implémentés
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances selon dataFlow.md
settlementNoteSchema.index({ familyId: 1 });
settlementNoteSchema.index({ status: 1 });
settlementNoteSchema.index({ createdAt: -1 });
settlementNoteSchema.index({ "createdBy.userId": 1 });

module.exports = mongoose.model("SettlementNote", settlementNoteSchema);
