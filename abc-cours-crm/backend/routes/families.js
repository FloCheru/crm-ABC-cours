const express = require("express");
const { body, validationResult } = require("express-validator");
const Family = require("../models/Family");
const Student = require("../models/Student");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

// @route   GET /api/families
// @desc    Obtenir toutes les familles
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    // Construire le filtre
    const filter = {};
    if (search) {
      filter.$or = [
        { "primaryContact.lastName": { $regex: search, $options: "i" } },
        { "primaryContact.firstName": { $regex: search, $options: "i" } },
        { "primaryContact.email": { $regex: search, $options: "i" } },
        { "primaryContact.primaryPhone": { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const families = await Family.find(filter)
      .populate('students', 'firstName lastName school.grade school.level')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Family.countDocuments(filter);

    res.json({
      families,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des familles:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/families/stats
// @desc    Obtenir les statistiques des familles
// @access  Private
router.get("/stats", async (req, res) => {
  try {
    const [total, prospects, clients] = await Promise.all([
      Family.countDocuments(),
      Family.countDocuments({ status: "prospect" }),
      Family.countDocuments({ status: "client" }),
    ]);

    res.json({
      total,
      prospects,
      clients,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/families/:id
// @desc    Obtenir une famille par ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    // Récupérer les élèves de cette famille avec toutes leurs informations
    const students = await Student.find({ family: family._id })
      .select("firstName lastName dateOfBirth school contact courseLocation availability comments medicalInfo status notes")
      .lean();

    // Ajouter les élèves à la réponse
    const familyWithStudents = {
      ...family.toObject(),
      students,
    };

    res.json({ family: familyWithStudents });
  } catch (error) {
    console.error("Erreur lors de la récupération de la famille:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/families
// @desc    Créer une nouvelle famille
// @access  Private (Admin)
router.post(
  "/",
  [
    authorize(["admin"]),
    body("primaryContact.firstName")
      .trim()
      .notEmpty()
      .withMessage("Prénom du contact principal requis"),
    body("primaryContact.lastName")
      .trim()
      .notEmpty()
      .withMessage("Nom du contact principal requis"),
    body("primaryContact.primaryPhone")
      .trim()
      .notEmpty()
      .withMessage("Téléphone principal requis"),
    body("primaryContact.email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Email valide requis"),
    body("primaryContact.gender")
      .trim()
      .notEmpty()
      .withMessage("Civilité requise")
      .isIn(["M.", "Mme"])
      .withMessage("Civilité doit être M. ou Mme"),
    body("address.street").trim().notEmpty().withMessage("Adresse requise"),
    body("address.city").trim().notEmpty().withMessage("Ville requise"),
    body("address.postalCode")
      .trim()
      .notEmpty()
      .withMessage("Code postal requis"),
    body("demande.beneficiaryLevel")
      .trim()
      .notEmpty()
      .withMessage("Niveau du bénéficiaire requis")
      .isIn(['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'])
      .withMessage("Niveau du bénéficiaire invalide"),
    // Validation supprimée pour financialInfo.paymentMethod (champ supprimé du modèle)
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const family = new Family({
        ...req.body,
        createdBy: req.user._id, // Ajouter automatiquement l'ID de l'utilisateur créateur
      });
      await family.save();

      // Debug: vérifier ce qui est dans family après sauvegarde
      console.log("🔍 DEBUG - family après save():", family);
      console.log("🔍 DEBUG - family._id:", family._id);
      console.log("🔍 DEBUG - family.primaryContact:", family.primaryContact);
      console.log("🔍 DEBUG - family.toObject():", family.toObject());

      res.status(201).json({
        message: "Famille créée avec succès",
        family: family.toObject(),
      });
    } catch (error) {
      console.error("Erreur lors de la création de la famille:", error);
      
      // Gérer les erreurs de validation Mongoose
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          message: errors.join(', '),
          errors: errors 
        });
      }
      
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PUT /api/families/:id
// @desc    Mettre à jour une famille
// @access  Private (Admin)
router.put(
  "/:id",
  [
    authorize(["admin"]),
    body("primaryContact.firstName").optional().trim().notEmpty(),
    body("primaryContact.lastName").optional().trim().notEmpty(),
    body("primaryContact.email").optional().isEmail().normalizeEmail(),
    body("primaryContact.primaryPhone").optional().trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const family = await Family.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      res.json({
        message: "Famille mise à jour avec succès",
        family,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la famille:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PATCH /api/families/:id/status
// @desc    Mettre à jour le statut d'une famille
// @access  Private (Admin)
router.patch(
  "/:id/status",
  [
    authorize(["admin"]),
    body("status")
      .isIn(["prospect", "client"])
      .withMessage("Statut doit être 'prospect' ou 'client'"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const family = await Family.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );

      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      res.json({
        message: "Statut mis à jour avec succès",
        family,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PATCH /api/families/:id/prospect-status
// @desc    Mettre à jour le statut prospect d'une famille
// @access  Private (Admin)
router.patch(
  "/:id/prospect-status",
  [
    authorize(["admin"]),
    body("prospectStatus")
      .optional()
      .isIn([
        "en_reflexion",
        "interesse_prof_a_trouver", 
        "injoignable",
        "ndr_editee",
        "premier_cours_effectue",
        "rdv_prospect",
        "ne_va_pas_convertir"
      ])
      .withMessage("Statut prospect invalide"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { prospectStatus } = req.body;
      
      const family = await Family.findByIdAndUpdate(
        req.params.id,
        { 
          prospectStatus: prospectStatus || null,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      res.json({
        message: "Statut prospect mis à jour avec succès",
        family,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut prospect:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PATCH /api/families/:id/reminder-subject
// @desc    Mettre à jour l'objet du rappel d'une famille
// @access  Private (Admin)
router.patch(
  "/:id/reminder-subject",
  [
    authorize(["admin"]),
    body("nextActionReminderSubject")
      .optional()
      .isIn([
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
      ])
      .withMessage("Objet de rappel invalide"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { nextActionReminderSubject } = req.body;
      
      const family = await Family.findByIdAndUpdate(
        req.params.id,
        { 
          nextActionReminderSubject: nextActionReminderSubject || "Actions à définir",
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      res.json({
        message: "Objet du rappel mis à jour avec succès",
        family,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'objet du rappel:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   GET /api/families/:id/deletion-preview
// @desc    Aperçu des éléments qui seront supprimés avec la famille
// @access  Private (Admin)
router.get("/:id/deletion-preview", authorize(["admin"]), async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    console.log(`🔍 Aperçu de suppression pour la famille ${req.params.id}`);

    // Compter les éléments liés
    const Coupon = require("../models/Coupon");
    const CouponSeries = require("../models/CouponSeries");
    const SettlementNote = require("../models/SettlementNote");

    const [couponsCount, seriesCount, settlementNotesCount, studentsCount] = await Promise.all([
      Coupon.countDocuments({ familyId: req.params.id }),
      CouponSeries.countDocuments({ familyId: req.params.id }),
      SettlementNote.countDocuments({ familyId: req.params.id }),
      Student.countDocuments({ family: req.params.id })
    ]);

    // Récupérer les détails des éléments liés
    const [couponsDetails, seriesDetails, settlementNotesDetails, studentsDetails] = await Promise.all([
      Coupon.find({ familyId: req.params.id }).select("code status").lean(),
      CouponSeries.find({ familyId: req.params.id })
        .populate("subject", "name")
        .select("totalCoupons usedCoupons hourlyRate status subject")
        .lean(),
      SettlementNote.find({ familyId: req.params.id })
        .select("clientName subjects.quantity subjects.hourlyRate status createdAt")
        .lean(),
      Student.find({ family: req.params.id })
        .select("firstName lastName school.grade")
        .lean()
    ]);

    const deletionPreview = {
      family: {
        name: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
        status: family.status,
        prospectStatus: family.prospectStatus
      },
      itemsToDelete: {
        students: {
          count: studentsCount,
          details: studentsDetails.map(s => ({
            name: `${s.firstName} ${s.lastName}`,
            grade: s.school?.grade || "Non précisé"
          }))
        },
        couponSeries: {
          count: seriesCount,
          details: seriesDetails.map(s => ({
            subject: s.subject?.name || "Matière non précisée",
            totalCoupons: s.totalCoupons,
            usedCoupons: s.usedCoupons,
            remainingCoupons: s.totalCoupons - s.usedCoupons,
            hourlyRate: s.hourlyRate,
            status: s.status
          }))
        },
        coupons: {
          count: couponsCount,
          availableCount: couponsDetails.filter(c => c.status === 'available').length,
          usedCount: couponsDetails.filter(c => c.status === 'used').length
        },
        settlementNotes: {
          count: settlementNotesCount,
          details: settlementNotesDetails.map(ndr => ({
            clientName: ndr.clientName,
            totalHours: ndr.subjects?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0,
            totalAmount: ndr.subjects?.reduce((sum, s) => sum + ((s.quantity || 0) * (s.hourlyRate || 0)), 0) || 0,
            status: ndr.status,
            date: new Date(ndr.createdAt).toLocaleDateString("fr-FR")
          }))
        }
      },
      totalItems: studentsCount + seriesCount + couponsCount + settlementNotesCount
    };

    console.log(`🔍 Aperçu calculé: ${deletionPreview.totalItems} éléments à supprimer`);
    res.json(deletionPreview);
  } catch (error) {
    console.error("Erreur lors du calcul de l'aperçu de suppression:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   DELETE /api/families/:id
// @desc    Supprimer une famille
// @access  Private (Admin)
router.delete("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const familyId = req.params.id;
    
    // Validation de l'ID
    if (!familyId || typeof familyId !== 'string') {
      console.log(`❌ ID de famille invalide: ${familyId}`);
      return res.status(400).json({ 
        message: "ID de famille invalide",
        id: familyId 
      });
    }

    // Validation format ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      console.log(`❌ Format ObjectId invalide: ${familyId}`);
      return res.status(400).json({ 
        message: "Format d'ID invalide (doit être un ObjectId MongoDB valide)",
        id: familyId 
      });
    }

    console.log(`🔍 Recherche famille pour suppression: ${familyId}`);
    const family = await Family.findById(familyId);

    if (!family) {
      console.log(`❌ Famille non trouvée: ${familyId}`);
      return res.status(404).json({ 
        message: "Famille non trouvée ou déjà supprimée",
        id: familyId 
      });
    }

    console.log(`🔍 Début de la suppression en cascade pour la famille ${req.params.id}`);

    // 1. Supprimer tous les coupons individuels liés à cette famille
    const Coupon = require("../models/Coupon");
    const deletedCoupons = await Coupon.deleteMany({
      familyId: req.params.id,
    });
    console.log(`🔍 ${deletedCoupons.deletedCount} coupons individuels supprimés`);

    // 2. Supprimer toutes les séries de coupons liées à cette famille
    const CouponSeries = require("../models/CouponSeries");
    const deletedSeries = await CouponSeries.deleteMany({
      familyId: req.params.id,
    });
    console.log(`🔍 ${deletedSeries.deletedCount} séries de coupons supprimées`);

    // 3. Supprimer les notes de règlement liées (NDR)
    const SettlementNote = require("../models/SettlementNote");
    const deletedSettlementNotes = await SettlementNote.deleteMany({
      familyId: req.params.id,
    });
    console.log(`🔍 ${deletedSettlementNotes.deletedCount} notes de règlement supprimées`);

    // 4. Supprimer tous les élèves associés à cette famille
    console.log(`🔍 Suppression des élèves pour la famille ${req.params.id}`);
    const deletedStudents = await Student.deleteMany({
      family: req.params.id,
    });
    console.log(`🔍 ${deletedStudents.deletedCount} élèves supprimés`);

    // 5. Supprimer la famille elle-même
    await Family.findByIdAndDelete(req.params.id);
    console.log(`🔍 Famille ${req.params.id} supprimée avec succès`);

    res.json({ 
      message: "Famille et tous les éléments liés supprimés avec succès",
      deletedItems: {
        students: deletedStudents.deletedCount,
        couponSeries: deletedSeries.deletedCount,
        coupons: deletedCoupons.deletedCount,
        settlementNotes: deletedSettlementNotes.deletedCount
      }
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la famille:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PATCH /api/families/:id/next-action-date
// @desc    Mettre à jour la date de prochaine action d'une famille
// @access  Private (Admin)
router.patch(
  "/:id/next-action-date",
  [
    authorize(["admin"]),
    body("nextActionDate")
      .optional()
      .custom((value) => {
        // Accepter null ou une date valide
        if (value === null || value === undefined) {
          return true;
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("Date invalide");
        }
        return true;
      })
      .withMessage("Date de prochaine action invalide"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { nextActionDate } = req.body;
      
      const family = await Family.findByIdAndUpdate(
        req.params.id,
        { 
          nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      res.json({
        message: "Date de prochaine action mise à jour avec succès",
        family,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la date de prochaine action:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   POST /api/families/:id/students
// @desc    Ajouter un élève à une famille existante
// @access  Private (Admin)
router.post(
  "/:id/students",
  [
    authorize(["admin"]),
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("Prénom de l'élève requis"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Nom de l'élève requis"),
    body("dateOfBirth")
      .isISO8601()
      .withMessage("Date de naissance valide requise"),
    body("school.name")
      .trim()
      .notEmpty()
      .withMessage("Nom de l'établissement requis"),
    body("school.level")
      .isIn(["primaire", "college", "lycee", "superieur"])
      .withMessage("Niveau scolaire invalide"),
    body("school.grade")
      .trim()
      .notEmpty()
      .withMessage("Classe requise"),
    body("courseLocation.type")
      .optional()
      .isIn(["domicile", "professeur", "autre"])
      .withMessage("Type de lieu de cours invalide"),
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      // Vérifier que la famille existe
      const family = await Family.findById(req.params.id);
      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      // Créer l'élève avec référence vers la famille
      const studentData = {
        ...req.body,
        family: req.params.id,
      };

      const student = new Student(studentData);
      await student.save();

      // Ajouter la référence de l'élève à la famille
      await Family.findByIdAndUpdate(
        req.params.id,
        { $push: { students: student._id } },
        { new: true }
      );

      console.log(`✅ Élève ${student.firstName} ${student.lastName} ajouté à la famille ${req.params.id}`);

      res.status(201).json({
        message: "Élève ajouté avec succès à la famille",
        student: student.toObject(),
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'élève:", error);
      
      // Gérer les erreurs de validation Mongoose
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          message: "Erreur de validation : " + errors.join(', '),
          errors: errors 
        });
      }
      
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

module.exports = router;
