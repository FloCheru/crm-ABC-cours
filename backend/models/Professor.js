const mongoose = require("mongoose");

const professorSchema = new mongoose.Schema(
  {
    // Informations personnelles - Identité
    gender: {
      type: String,
      enum: ['M.', 'Mme', ''],
      trim: true,
    },
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
    birthName: {
      type: String,
      trim: true,
    },
    birthDate: {
      type: Date,
    },
    socialSecurityNumber: {
      type: String,
      trim: true,
    },
    birthCountry: {
      type: String,
      trim: true,
    },
    // Informations de contact - Coordonnées
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
    secondaryPhone: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    addressComplement: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    inseeCity: {
      type: String,
      trim: true,
    },
    distributionOffice: {
      type: String,
      trim: true,
    },
    transportMode: {
      type: String,
      trim: true,
    },
    courseLocation: {
      type: String,
      enum: ['domicile', 'visio', ''],
      trim: true,
    },
    secondaryAddress: {
      type: String,
      trim: true,
    },
    identifier: {
      type: String,
      trim: true,
    },
    // Informations bancaires - RIB
    employmentStatus: {
      type: String,
      enum: ['salarie', 'auto-entrepreneur', 'formation-professionnel', ''],
      trim: true,
    },
    currentSituation: {
      type: String,
      enum: [
        'enseignant_education_nationale',
        'enseignant_vacataire_contractuel',
        'etudiant_master_professorat',
        'enseignant_avec_activite_domicile',
        'enseignant_activite_professionnelle',
        'enseignant_formation_professionnelle',
        'etudiant',
        ''
      ],
      trim: true,
    },
    siret: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    iban: {
      type: String,
      trim: true,
    },
    bic: {
      type: String,
      trim: true,
    },
    // Déplacements
    availableDepartments: [{
      type: String,
      trim: true,
    }],
    // Disponibilités hebdomadaires
    weeklyAvailability: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Matières enseignées (références au modèle Subject)
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    // Matières enseignées avec niveaux détaillés
    teachingSubjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        subjectName: {
          type: String,
          required: true,
        },
        grades: {
          type: [String],
          default: [],
        },
        levels: {
          type: [String],
          enum: ["primaire", "college", "lycee", "superieur"],
          default: [],
        },
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
