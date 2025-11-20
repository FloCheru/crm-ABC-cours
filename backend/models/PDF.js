/**
 * Modèle pour les métadonnées des PDFs
 * Les PDFs eux-mêmes sont stockés dans GridFS (chiffrés)
 * Ce modèle stocke les métadonnées + référence GridFS
 */

const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  // Référence au fichier dans GridFS
  gridFsFileId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Type de PDF
  type: {
    type: String,
    required: true,
    enum: ['fiche_paie', 'NDR', 'convention', 'facture'],
    index: true
  },

  // Propriétaire du PDF
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    refPath: 'userModel'
  },

  // Modèle du propriétaire (Professor ou Admin)
  userModel: {
    type: String,
    required: true,
    enum: ['Professor', 'Admin']
  },

  // Version du document (pour versionning)
  version: {
    type: Number,
    default: 1
  },

  // Métadonnées spécifiques au type de PDF
  metadata: {
    // Pour fiche_paie
    period: String,        // Ex: "2024-01"
    salaryAmount: Number,  // Montant du salaire (pour recherche)

    // Pour NDR
    settlementNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SettlementNote'
    },

    // Pour convention
    startDate: Date,
    endDate: Date,

    // Pour facture
    invoiceNumber: String,
    invoiceDate: Date,
    totalAmount: Number
  },

  // Statut du PDF
  status: {
    type: String,
    enum: ['generated', 'sent', 'downloaded', 'archived'],
    default: 'generated'
  },

  // Historique des actions
  accessLog: [{
    action: {
      type: String,
      enum: ['generated', 'downloaded', 'sent', 'viewed', 'deleted']
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'accessLog.byModel'
    },
    byModel: {
      type: String,
      enum: ['Professor', 'Admin']
    },
    at: {
      type: Date,
      default: Date.now
    },
    ip: String
  }],

  // Soft delete
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Index composé pour recherche efficace
pdfSchema.index({ userId: 1, type: 1, createdAt: -1 });
pdfSchema.index({ type: 1, 'metadata.period': 1 });

// Méthode pour logger un accès
pdfSchema.methods.logAccess = function(action, userId, userModel, ip = null) {
  this.accessLog.push({
    action,
    by: userId,
    byModel: userModel,
    at: new Date(),
    ip
  });
  return this.save();
};

// Méthode pour soft delete
pdfSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.status = 'archived';
  return this.save();
};

// Query helper pour exclure les PDFs supprimés
pdfSchema.query.notDeleted = function() {
  return this.where({ deletedAt: null });
};

// Virtual pour vérifier si supprimé
pdfSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Ensure virtuals are included in JSON
pdfSchema.set('toJSON', { virtuals: true });
pdfSchema.set('toObject', { virtuals: true });

const PDF = mongoose.model('PDF', pdfSchema);

module.exports = PDF;
