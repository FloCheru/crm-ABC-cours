const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nom de famille requis"],
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: [true, "Adresse requise"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "Ville requise"],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [true, "Code postal requis"],
        trim: true,
      },
    },
    contact: {
      primaryPhone: {
        type: String,
        required: [true, "Téléphone principal requis"],
        trim: true,
      },
      secondaryPhone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Email requis"],
        lowercase: true,
        trim: true,
      },
    },
    parents: [
      {
        firstName: {
          type: String,
          required: true,
          trim: true,
        },
        lastName: {
          type: String,
          required: true,
          trim: true,
        },
        phone: String,
        email: String,
        profession: String,
        isPrimaryContact: {
          type: Boolean,
          default: false,
        },
      },
    ],
    financialInfo: {
      paymentMethod: {
        type: String,
        enum: ["check", "transfer", "card"],
        default: "transfer",
      },
      billingAddress: {
        street: String,
        city: String,
        postalCode: String,
      },
      notes: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
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
familySchema.index({ name: 1 });
familySchema.index({ "contact.email": 1 });
familySchema.index({ status: 1 });

// Méthode pour obtenir le contact principal
familySchema.methods.getPrimaryContact = function () {
  return (
    this.parents.find((parent) => parent.isPrimaryContact) || this.parents[0]
  );
};

// Méthode pour obtenir l'adresse complète
familySchema.methods.getFullAddress = function () {
  return `${this.address.street}, ${this.address.postalCode} ${this.address.city}`;
};

module.exports = mongoose.model("Family", familySchema);
