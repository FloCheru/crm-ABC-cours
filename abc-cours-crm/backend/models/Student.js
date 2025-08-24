const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
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
    dateOfBirth: {
      type: Date,
      required: [true, "Date de naissance requise"],
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "Famille requise"],
    },
    school: {
      name: {
        type: String,
        required: [true, "Nom de l'établissement requis"],
        trim: true,
      },
      level: {
        type: String,
        enum: ["primaire", "college", "lycee", "superieur"],
        required: [true, "Niveau scolaire requis"],
      },
      grade: {
        type: String,
        required: [true, "Classe requise"],
        trim: true,
      },
    },
    contact: {
      phone: String,
      email: String,
    },
    courseLocation: {
      type: {
        type: String,
        enum: ["domicile", "professeur", "autre"],
        default: "domicile",
      },
      address: {
        street: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        postalCode: {
          type: String,
          trim: true,
        },
      },
      otherDetails: {
        type: String,
        trim: true,
      },
    },
    availability: {
      type: String,
      trim: true,
    },
    comments: {
      type: String,
      trim: true,
    },
    medicalInfo: {
      allergies: [String],
      conditions: [String],
      medications: [String],
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated"],
      default: "active",
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
studentSchema.index({ firstName: 1, lastName: 1 });
studentSchema.index({ family: 1 });
studentSchema.index({ "school.level": 1 });
studentSchema.index({ status: 1 });

// Méthode pour calculer l'âge
studentSchema.methods.getAge = function () {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// Méthode pour obtenir le nom complet
studentSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Méthode pour obtenir le niveau scolaire complet
studentSchema.methods.getSchoolLevel = function () {
  return `${this.school.level} - ${this.school.grade}`;
};

module.exports = mongoose.model("Student", studentSchema);
