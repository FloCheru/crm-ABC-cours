const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Élève requis"],
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      required: [true, "Professeur requis"],
    },
    subject: {
      type: String,
      required: [true, "Matière requise"],
      trim: true,
    },
    schedule: {
      day: {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
        required: [true, "Jour requis"],
      },
      startTime: {
        type: String,
        required: [true, "Heure de début requise"],
      },
      endTime: {
        type: String,
        required: [true, "Heure de fin requise"],
      },
      duration: {
        type: Number,
        required: [true, "Durée requise (en minutes)"],
      },
    },
    location: {
      type: {
        type: String,
        enum: ["home", "school", "online", "other"],
        default: "home",
      },
      address: {
        type: String,
        trim: true,
      },
      details: String,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "scheduled",
    },
    payment: {
      amount: {
        type: Number,
        required: [true, "Montant requis"],
      },
      method: {
        type: String,
        enum: ["check", "transfer", "card", "cash"],
        default: "transfer",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "overdue"],
        default: "pending",
      },
      dueDate: {
        type: Date,
        required: [true, "Date d'échéance requise"],
      },
    },
    notes: {
      professor: String,
      student: String,
      admin: String,
    },
    cancellation: {
      reason: String,
      cancelledBy: {
        type: String,
        enum: ["student", "professor", "admin"],
      },
      cancelledAt: Date,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      submittedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
assignmentSchema.index({ student: 1 });
assignmentSchema.index({ professor: 1 });
assignmentSchema.index({ "schedule.day": 1, "schedule.startTime": 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ "payment.status": 1 });

// Middleware pour calculer automatiquement la durée
assignmentSchema.pre("save", function (next) {
  if (this.schedule.startTime && this.schedule.endTime) {
    const start = new Date(`2000-01-01T${this.schedule.startTime}`);
    const end = new Date(`2000-01-01T${this.schedule.endTime}`);
    this.schedule.duration = Math.round((end - start) / (1000 * 60)); // en minutes
  }
  next();
});

// Méthode pour vérifier les conflits de planning
assignmentSchema.methods.hasConflict = async function () {
  const conflict = await this.constructor.findOne({
    _id: { $ne: this._id },
    professor: this.professor,
    "schedule.day": this.schedule.day,
    status: { $in: ["scheduled", "confirmed", "in_progress"] },
    $or: [
      {
        "schedule.startTime": { $lt: this.schedule.endTime },
        "schedule.endTime": { $gt: this.schedule.startTime },
      },
    ],
  });

  return conflict;
};

// Méthode pour calculer le montant total
assignmentSchema.methods.calculateAmount = function () {
  return (this.schedule.duration / 60) * this.payment.amount; // Montant par heure
};

// Méthode pour marquer comme payé
assignmentSchema.methods.markAsPaid = function () {
  this.payment.status = "paid";
  return this.save();
};

// Méthode pour annuler
assignmentSchema.methods.cancel = function (reason, cancelledBy) {
  this.status = "cancelled";
  this.cancellation = {
    reason,
    cancelledBy,
    cancelledAt: new Date(),
  };
  return this.save();
};

// Méthode pour obtenir le statut en français
assignmentSchema.methods.getStatusInFrench = function () {
  const statusMap = {
    scheduled: "Programmé",
    confirmed: "Confirmé",
    in_progress: "En cours",
    completed: "Terminé",
    cancelled: "Annulé",
    no_show: "Absence",
  };
  return statusMap[this.status] || this.status;
};

module.exports = mongoose.model("Assignment", assignmentSchema);
