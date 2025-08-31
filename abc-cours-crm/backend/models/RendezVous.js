const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
    index: true
  },
  assignedAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Valide le format HH:MM et vérifie que l'heure est entre 08:00 et 21:00
        const timeRegex = /^([0-1][0-9]|2[0-1]):([0-5][0-9])$/;
        if (!timeRegex.test(v)) return false;
        
        const [hours, minutes] = v.split(':').map(Number);
        // Valide de 08:00 à 21:00 (21:30 et après ne sont pas autorisés)
        if (hours < 8 || hours > 21) return false;
        if (hours === 21 && minutes > 0) return false; // 21:00 est le dernier créneau
        return minutes % 30 === 0;
      },
      message: 'L\'heure doit être au format HH:MM entre 08:00 et 21:00, par créneaux de 30 minutes'
    }
  },
  type: {
    type: String,
    enum: ['physique', 'virtuel'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['planifie', 'realise', 'annule'],
    default: 'planifie',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Index composé pour éviter les créneaux en double
rendezVousSchema.index({ date: 1, time: 1, assignedAdminId: 1 }, { unique: true });

// Index pour les recherches par famille
rendezVousSchema.index({ familyId: 1, date: 1 });

// Méthode statique pour vérifier la disponibilité
rendezVousSchema.statics.checkAvailability = function(date, time, assignedAdminId, excludeId = null) {
  const query = {
    date: new Date(date),
    time: time,
    assignedAdminId: assignedAdminId,
    status: { $ne: 'annule' }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.findOne(query);
};

// Méthode d'instance pour formater la date
rendezVousSchema.methods.getFormattedDateTime = function() {
  const date = this.date.toLocaleDateString('fr-FR');
  return `${date} à ${this.time}`;
};

// Middleware pre-save pour validation supplémentaire
rendezVousSchema.pre('save', async function(next) {
  // Vérifier que la date n'est pas dans le passé (sauf si c'est une modification de statut)
  if (this.isNew || this.isModified('date') || this.isModified('time')) {
    const now = new Date();
    const rdvDateTime = new Date(this.date);
    const [hours, minutes] = this.time.split(':').map(Number);
    rdvDateTime.setHours(hours, minutes, 0, 0);
    
    if (rdvDateTime < now && this.status === 'planifie') {
      const error = new Error('Impossible de planifier un rendez-vous dans le passé');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  
  // Vérifier la disponibilité de l'admin
  if (this.isNew || this.isModified('date') || this.isModified('time') || this.isModified('assignedAdminId')) {
    const existingRdv = await this.constructor.checkAvailability(
      this.date,
      this.time,
      this.assignedAdminId,
      this._id
    );
    
    if (existingRdv) {
      const error = new Error('Cet administrateur a déjà un rendez-vous prévu à cette date et heure');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  
  next();
});

module.exports = mongoose.model('RendezVous', rendezVousSchema);