const mongoose = require("mongoose");

const professorSchema = new mongoose.Schema(
  {
    // Informations personnelles
    firstName: {
      type: String,
      required: [true, "Prénom requis"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Nom requis"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email requis"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    birthDate: {
      type: Date,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    identifier: {
      type: String,
      trim: true,
    },
    notifyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Matières enseignées (références au modèle Subject)
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    availability: [
      {
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
        timeSlots: [
          {
            start: {
              type: String,
              required: true,
            },
            end: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
    hourlyRate: {
      type: Number,
      required: [true, "Tarif horaire requis"],
      min: [0, "Le tarif doit être positif"],
    },
    documents: [
      {
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["cv", "diploma", "certificate", "id", "other"],
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: Date.now,
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "La bio ne peut pas dépasser 1000 caractères"],
    },
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        description: String,
      },
    ],
    experience: [
      {
        position: String,
        company: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
professorSchema.index({ email: 1 });
professorSchema.index({ subjects: 1 });
professorSchema.index({ status: 1 });
professorSchema.index({ hourlyRate: 1 });

// Méthode pour calculer le rating moyen
professorSchema.methods.updateRating = function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Méthode pour vérifier la disponibilité
professorSchema.methods.isAvailable = function (day, time) {
  const dayAvailability = this.availability.find((a) => a.day === day);
  if (!dayAvailability) return false;

  return dayAvailability.timeSlots.some(
    (slot) => slot.start <= time && slot.end >= time
  );
};

// Méthode pour obtenir les documents vérifiés
professorSchema.methods.getVerifiedDocuments = function () {
  return this.documents.filter((doc) => doc.verified);
};

module.exports = mongoose.model("Professor", professorSchema);
