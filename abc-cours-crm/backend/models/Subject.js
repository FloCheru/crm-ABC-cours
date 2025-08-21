const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de la matière est requis"],
      trim: true,
      unique: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    category: {
      type: String,
      required: [true, "La catégorie est requise"],
      enum: {
        values: [
          "Scientifique",
          "Littéraire",
          "Langues",
          "Arts",
          "Sport",
          "Autre",
        ],
        message: "Catégorie invalide",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
// Note: name déjà indexé via unique: true dans le schéma
subjectSchema.index({ category: 1 });
subjectSchema.index({ isActive: 1 });

// Méthode pour obtenir les matières actives
subjectSchema.statics.getActiveSubjects = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Méthode pour obtenir les matières par catégorie
subjectSchema.statics.getByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

// Méthode pour rechercher des matières
subjectSchema.statics.search = function (query) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
        ],
      },
    ],
  }).sort({ name: 1 });
};

module.exports = mongoose.model("Subject", subjectSchema);
