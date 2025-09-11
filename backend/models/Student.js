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
    familyId: {
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
        enum: ["primaire", "collège", "lycée", "supérieur"],
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
      usesFamilyAddress: {
        type: Boolean,
        default: true,
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
    notes: {
      type: String,
      trim: true,
    },
    settlementNoteIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SettlementNote",
      index: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
studentSchema.index({ firstName: 1, lastName: 1 });
studentSchema.index({ familyId: 1 });
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
