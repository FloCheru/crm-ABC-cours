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

    // Récupérer les élèves de cette famille
    const students = await Student.find({ family: family._id })
      .select("firstName lastName level")
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
    body("address.street").trim().notEmpty().withMessage("Adresse requise"),
    body("address.city").trim().notEmpty().withMessage("Ville requise"),
    body("address.postalCode")
      .trim()
      .notEmpty()
      .withMessage("Code postal requis"),
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
        createdBy: req.user.id, // Ajouter automatiquement l'ID de l'utilisateur créateur
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

// @route   DELETE /api/families/:id
// @desc    Supprimer une famille
// @access  Private (Admin)
router.delete("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    // Vérifier s'il y a des élèves associés
    const studentsCount = await Student.countDocuments({
      family: req.params.id,
    });
    if (studentsCount > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer une famille avec des élèves",
      });
    }

    await Family.findByIdAndDelete(req.params.id);

    res.json({ message: "Famille supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la famille:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
