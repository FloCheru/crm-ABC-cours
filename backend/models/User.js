const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
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
      enum: {
        values: ["admin", "professor"],
        message: "Rôle invalide. Valeurs autorisées: admin, professor",
      },
      required: [true, "Rôle de l'utilisateur requis"],
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
// Note: email déjà indexé via unique: true dans le schéma
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Méthode pour hasher le mot de passe avant sauvegarde
userSchema.pre("save", async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir le nom complet
userSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Méthode pour masquer le mot de passe dans les réponses JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model("User", userSchema);
