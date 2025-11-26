const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
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
      required: [true, "Mot de passe requis"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
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
    phone: {
      type: String,
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });

// Méthode pour hasher le mot de passe avant sauvegarde
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir le nom complet
adminSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Méthode pour masquer le mot de passe dans les réponses JSON
adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.resetPasswordToken;
  delete admin.resetPasswordExpires;
  return admin;
};

module.exports = mongoose.model("Admin", adminSchema);