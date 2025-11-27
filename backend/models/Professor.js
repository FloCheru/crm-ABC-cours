const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const professorSchema = new mongoose.Schema(
  {
    // Authentification
    email: {
      type: String,
      required: [true, "Email requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide"],
    },
    password: {
      type: String,
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
    },
    isPasswordSet: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["professor"],
      default: "professor",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

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
    phone: {
      type: String,
      trim: true,
    },
    secondaryPhone: {
      type: String,
      trim: true,
    },
    primaryAddress: {
      street: {
        type: String,
        trim: true,
      },
      addressComplement: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },
    secondaryAddress: {
      street: {
        type: String,
        trim: true,
      },
      addressComplement: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },
    transportModes: {
      type: [String],
      default: [],
      validate: {
        validator: function(modes) {
          const validModes = ['voiture', 'vélo', 'transports', 'moto', 'pied'];
          return modes.every(mode => validModes.includes(mode));
        },
        message: 'Mode de transport invalide'
      }
    },
    courseLocation: {
      type: String,
      enum: ['domicile', 'visio', ''],
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
    availableCities: [{
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
    // Matières personnalisées (sans référence à la collection Subject)
    customSubjects: [
      {
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
    currentActivity: {
      type: String,
      trim: true,
      maxlength: [1000, "L'activité actuelle ne peut pas dépasser 1000 caractères"],
    },
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
professorSchema.index({ isActive: 1 });

// Méthode pour hasher le mot de passe avant sauvegarde
professorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    console.log("[PROFESSOR PRE-SAVE] Mot de passe non modifié, skip hashing");
    return next();
  }

  try {
    console.log("[PROFESSOR PRE-SAVE] 🔐 Hashing du mot de passe pour:", this.email);
    console.log("[PROFESSOR PRE-SAVE] Longueur du mot de passe avant hash:", this.password?.length);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log("[PROFESSOR PRE-SAVE] Hash généré:", hashedPassword.substring(0, 20) + "...");
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error("[PROFESSOR PRE-SAVE] ❌ Erreur lors du hashing:", error);
    next(error);
  }
});

// Méthode pour comparer les mots de passe
professorSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("[COMPARE PASSWORD] 🔍 Comparaison pour:", this.email);
  console.log("[COMPARE PASSWORD] Mot de passe candidat longueur:", candidatePassword?.length);
  console.log("[COMPARE PASSWORD] Hash stocké:", this.password?.substring(0, 20) + "...");
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log("[COMPARE PASSWORD] Résultat:", result ? "✅ MATCH" : "❌ NO MATCH");
  return result;
};

// Méthode pour obtenir le nom complet
professorSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Méthode pour masquer le mot de passe dans les réponses JSON
professorSchema.methods.toJSON = function () {
  const professor = this.toObject();
  delete professor.password;
  delete professor.resetPasswordToken;
  delete professor.resetPasswordExpires;
  return professor;
};

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
