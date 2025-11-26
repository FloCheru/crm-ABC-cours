const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de la matière est requis"],
      trim: true,
      unique: true, // Note: name déjà indexé via unique: true dans le schéma
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "La catégorie est requise"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Méthode pour obtenir toutes les matières
subjectSchema.statics.getAllSubjects = function () {
  return this.find({}).sort({ name: 1 });
};

// Méthode pour rechercher des matières
subjectSchema.statics.search = function (query) {
  return this.find({
    name: { $regex: `^${query}`, $options: "i" },
  }).sort({ name: 1 });
};

module.exports = mongoose.model("Subject", subjectSchema);
