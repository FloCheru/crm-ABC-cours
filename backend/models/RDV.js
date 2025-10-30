const mongoose = require("mongoose");

const rdvSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "ID de la famille requis"],
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID de l'admin requis"],
    },
    date: {
      type: Date,
      required: [true, "Date du rendez-vous requise"],
    },
    time: {
      type: String,
      required: [true, "Heure du rendez-vous requise"],
      validate: {
        validator: function(v) {
          // Format HH:MM (ex: "14:30")
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Format d'heure invalide. Utilisez le format HH:MM (ex: 14:30)"
      }
    },
    type: {
      type: String,
      enum: {
        values: ["physique", "visio"],
        message: "Type de RDV invalide. Valeurs autorisées: physique, visio"
      },
      required: [true, "Type de rendez-vous requis"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: {
        values: ["planned", "done"],
        message: "Statut de RDV invalide. Valeurs autorisées: planned, done"
      },
      default: "planned",
      required: [true, "Statut du rendez-vous requis"],
    },
  },
  {
    timestamps: true,
  }
);

// Index composés pour optimiser les requêtes
rdvSchema.index({ familyId: 1, date: 1 }); // Recherche RDV par famille + tri date
rdvSchema.index({ assignedAdminId: 1, date: 1 }); // Recherche RDV par admin + tri date
rdvSchema.index({ status: 1 }); // Recherche par statut

// Méthode d'instance pour formater la date
rdvSchema.methods.getFormattedDateTime = function () {
  return this.date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Middleware
// pre-save pour validation simple
rdvSchema.pre("save", function (next) {
  // Validation simple : pas de date dans le passé
  if (this.isNew || this.isModified("date")) {
    const now = new Date();
    if (this.date < now && this.status === "planned") {
      const error = new Error(
        "Impossible de planifier un rendez-vous dans le passé"
      );
      error.name = "ValidationError";
      return next(error);
    }
  }
  next();
});


module.exports = mongoose.model("RendezVous", rdvSchema);
