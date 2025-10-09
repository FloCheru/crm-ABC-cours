const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
    primaryContact: {
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      primaryPhone: {
        type: String,
        trim: true,
      },
      secondaryPhone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      birthDate: {
        type: Date,
      },
      relation: {
        type: String,
        enum: {
          values: ["père", "mère", "tuteur"],
          message: "Relation invalide. Valeurs autorisées: père, mère, tuteur",
        },
        trim: true,
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
    },
    secondaryContact: {
      type: {
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
        birthDate: {
          type: Date,
        },
        relation: {
          type: String,
          enum: {
            values: ["père", "mère", "tuteur"],
            message:
              "Relation invalide. Valeurs autorisées: père, mère, tuteur",
          },
          trim: true,
        },
      },
    },
    // Notes de règlement liées à cette famille
    ndr: [
      {
        _id: false, // Désactiver l'auto-génération d'_id pour ce sous-document
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: [true, "id NDR requis"],
        },
      },
    ],
    // Adresse de facturation
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
    },
    prospectStatus: {
      type: String,
      enum: {
        values: [
          "en_reflexion",
          "interesse_prof_a_trouver",
          "injoignable",
          "ndr_editee",
          "premier_cours_effectue",
          "rdv_prospect",
          "ne_va_pas_convertir",
        ],
        message:
          "Statut prospect invalide. Valeurs autorisées: en_reflexion, interesse_prof_a_trouver, injoignable, ndr_editee, premier_cours_effectue, rdv_prospect, ne_va_pas_convertir",
      },
    },
    nextAction: {
      type: String,
      enum: {
        values: [
          "Actions à définir",
          "Présenter nos cours",
          "Envoyer le devis",
          "Relancer après devis",
          "Planifier rendez-vous",
          "Editer la NDR",
          "Négocier les tarifs",
          "Organiser cours d'essai",
          "Confirmer les disponibilités",
          "Suivre satisfaction parent",
        ],
        message:
          "Action invalide. Valeurs autorisées: Actions à définir, Présenter nos cours, Envoyer le devis, Relancer après devis, Planifier rendez-vous, Editer la NDR, Négocier les tarifs, Organiser cours d'essai, Confirmer les disponibilités, Suivre satisfaction parent",
      },
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
    demande: {
      grade: {
        type: String,
        enum: {
          values: [
            "",
            "CP",
            "CE1",
            "CE2",
            "CM1",
            "CM2",
            "6ème",
            "5ème",
            "4ème",
            "3ème",
            "Seconde",
            "Première",
            "Terminale",
          ],
          message:
            "Niveau invalide. Valeurs autorisées: CP, CE1, CE2, CM1, CM2, 6ème, 5ème, 4ème, 3ème, Seconde, Première, Terminale",
        },
      },
      subjects: [
        {
          _id: false, // Désactiver l'auto-génération d'_id pour ce sous-document
          id: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Id Matière requis"],
          },
        },
      ],
    },
    plannedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
    },
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Utilisateur créateur requis"],
      },
    },
    students: [
      {
        _id: false, // Désactiver l'auto-génération d'_id pour ce sous-document
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: [true, "ID de l'étudiant requis"],
        },
        firstName: {
          type: String,
          trim: true,
        },
        lastName: {
          type: String,
          trim: true,
        },
        birthDate: {
          type: Date,
        },
        school: {
          name: {
            type: String,
            trim: true,
          },
          grade: {
            type: String,
            trim: true,
          },
        },
        contact: {
          phone: {
            type: String,
            trim: true,
          },
          email: {
            type: String,
            lowercase: true,
            trim: true,
          },
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
        availability: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    // RDV liés à cette famille
    rdvs: [
      {
        _id: false, // Désactiver l'auto-génération d'_id pour ce sous-document
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: [true, "ID du RDV requis"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances selon dataFlow.md
familySchema.index({ "primaryContact.lastName": 1 });
familySchema.index({ "primaryContact.email": 1 });
familySchema.index({ status: 1 });
familySchema.index({ createdAt: -1 });
familySchema.index({ "createdBy.userId": 1 });

// // Méthode pour obtenir le contact principal
// familySchema.methods.getPrimaryContact = function () {
//   return {
//     firstName: this.primaryContact.firstName,
//     lastName: this.primaryContact.lastName,
//     email: this.primaryContact.email,
//     phone: this.primaryContact.primaryPhone,
//   };
// };

// // Méthode pour obtenir le contact secondaire
// familySchema.methods.getSecondaryContact = function () {
//   if (this.secondaryContact && this.secondaryContact.firstName) {
//     return this.secondaryContact;
//   }
//   return null;
// };

// // Méthode pour obtenir l'adresse complète
// familySchema.methods.getFullAddress = function () {
//   return `${this.address.street}, ${this.address.postalCode} ${this.address.city}`;
// };

// // Virtual pour le nom de famille (contact principal)
// familySchema.virtual("name").get(function () {
//   return `${this.primaryContact.firstName} ${this.primaryContact.lastName}`;
// });

// // Assurer que les virtuals sont inclus lors de JSON.stringify
// familySchema.set("toJSON", { virtuals: true });
// familySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Family", familySchema);
