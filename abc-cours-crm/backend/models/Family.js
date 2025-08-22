const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
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
    primaryContact: {
      firstName: {
        type: String,
        required: [true, "Prénom du contact principal requis"],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, "Nom du contact principal requis"],
        trim: true,
      },
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
      dateOfBirth: {
        type: Date,
      },
      relationship: {
        type: String,
        trim: true,
        default: "Contact principal",
      },
      gender: {
        type: String,
        required: [true, "Civilité requise"],
        enum: ["M.", "Mme"],
        trim: true,
      },
    },
    secondaryContact: {
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
        default: "Contact secondaire",
      },
      dateOfBirth: {
        type: Date,
      },
    },
    // Notes de règlement liées à cette famille
    settlementNotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SettlementNote",
      },
    ],
    // Adresse de facturation (optionnelle)
    billingAddress: {
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
    // Informations entreprise
    companyInfo: {
      urssafNumber: {
        type: String,
        trim: true,
      },
      siretNumber: {
        type: String,
        trim: true,
      },
      ceNumber: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ["prospect", "client"],
      default: "prospect",
    },
    // Champs spécifiques aux prospects
    prospectStatus: {
      type: String,
      enum: [
        "en_reflexion",
        "interesse_prof_a_trouver", 
        "injoignable",
        "ndr_editee",
        "premier_cours_effectue",
        "rdv_prospect",
        "ne_va_pas_convertir"
      ],
    },
    nextActionReminderSubject: {
      type: String,
      enum: [
        "Actions à définir",
        "Présenter nos cours",
        "Envoyer le devis",
        "Relancer après devis",
        "Planifier rendez-vous",
        "Editer la NDR",
        "Négocier les tarifs",
        "Organiser cours d'essai",
        "Confirmer les disponibilités",
        "Suivre satisfaction parent"
      ],
      default: "Actions à définir",
      trim: true,
    },
    nextActionDate: {
      type: Date,
    },
    source: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
familySchema.index({ "primaryContact.lastName": 1 });
familySchema.index({ "primaryContact.email": 1 });
familySchema.index({ status: 1 });
familySchema.index({ createdAt: -1 });
familySchema.index({ "address.city": 1 });

// Méthode pour obtenir le contact principal
familySchema.methods.getPrimaryContact = function () {
  return {
    firstName: this.primaryContact.firstName,
    lastName: this.primaryContact.lastName,
    email: this.primaryContact.email,
    phone: this.primaryContact.primaryPhone,
  };
};

// Méthode pour obtenir le contact secondaire
familySchema.methods.getSecondaryContact = function () {
  if (this.secondaryContact && this.secondaryContact.firstName) {
    return this.secondaryContact;
  }
  return null;
};

// Méthode pour obtenir l'adresse complète
familySchema.methods.getFullAddress = function () {
  return `${this.address.street}, ${this.address.postalCode} ${this.address.city}`;
};

// Virtual pour le nom de famille (contact principal)
familySchema.virtual('name').get(function() {
  return `${this.primaryContact.firstName} ${this.primaryContact.lastName}`;
});

// Assurer que les virtuals sont inclus lors de JSON.stringify
familySchema.set('toJSON', { virtuals: true });
familySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Family", familySchema);
