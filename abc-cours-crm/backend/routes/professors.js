const express = require("express");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const Professor = require("../models/Professor");
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/professors/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"));
    }
  },
});

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

// @route   GET /api/professors/subject/:subjectId
// @desc    Obtenir tous les professeurs qui enseignent une matière spécifique
// @access  Private
router.get("/subject/:subjectId", async (req, res) => {
  try {
    const Subject = require("../models/Subject");
    const subject = await Subject.findById(req.params.subjectId);

    if (!subject) {
      return res.status(404).json({ message: "Matière non trouvée" });
    }

    const professors = await Professor.find({
      "subjects.name": subject.name,
      status: "active",
    })
      .populate("user", "firstName lastName")
      .sort({ "user.firstName": 1, "user.lastName": 1 });

    res.json(professors);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des professeurs par matière:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/professors
// @desc    Obtenir tous les professeurs
// @access  Private
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      subject,
      available,
    } = req.query;

    // Construire le filtre
    const filter = {};
    if (search) {
      filter.$or = [
        { "user.firstName": { $regex: search, $options: "i" } },
        { "user.lastName": { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
        { "subjects.name": { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }
    if (subject) {
      filter["subjects.name"] = subject;
    }
    if (available === "true") {
      filter.status = "active";
    }

    // Pagination
    const skip = (page - 1) * limit;

    const professors = await Professor.find(filter)
      .populate("user", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Professor.countDocuments(filter);

    res.json({
      professors,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des professeurs:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/professors/:id
// @desc    Obtenir un professeur par ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id).populate(
      "user",
      "firstName lastName email phone"
    );

    if (!professor) {
      return res.status(404).json({ message: "Professeur non trouvé" });
    }

    res.json({ professor });
  } catch (error) {
    console.error("Erreur lors de la récupération du professeur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/professors
// @desc    Créer un nouveau professeur
// @access  Private (Admin)
router.post(
  "/",
  [
    authorize(["admin"]),
    body("user").isMongoId().withMessage("Utilisateur valide requis"),
    body("subjects")
      .isArray({ min: 1 })
      .withMessage("Au moins une matière requise"),
    body("subjects.*.name")
      .trim()
      .notEmpty()
      .withMessage("Nom de matière requis"),
    body("hourlyRate").isNumeric().withMessage("Tarif horaire valide requis"),
    body("hourlyRate")
      .isFloat({ min: 0 })
      .withMessage("Tarif horaire doit être positif"),
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

      // Vérifier que l'utilisateur existe et est un professeur
      const user = await User.findById(req.body.user);
      if (!user) {
        return res.status(400).json({ message: "Utilisateur non trouvé" });
      }
      if (user.role !== "professor") {
        return res
          .status(400)
          .json({ message: "L'utilisateur doit avoir le rôle professeur" });
      }

      // Vérifier qu'il n'y a pas déjà un profil professeur pour cet utilisateur
      const existingProfessor = await Professor.findOne({
        user: req.body.user,
      });
      if (existingProfessor) {
        return res.status(400).json({
          message: "Un profil professeur existe déjà pour cet utilisateur",
        });
      }

      const professor = new Professor(req.body);
      await professor.save();

      const populatedProfessor = await Professor.findById(
        professor._id
      ).populate("user", "firstName lastName email phone");

      res.status(201).json({
        message: "Professeur créé avec succès",
        professor: populatedProfessor,
      });
    } catch (error) {
      console.error("Erreur lors de la création du professeur:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PUT /api/professors/:id
// @desc    Mettre à jour un professeur
// @access  Private (Admin ou le professeur lui-même)
router.put(
  "/:id",
  [
    authorize(["admin", "professor"]),
    body("subjects.*.name").optional().trim().notEmpty(),
    body("hourlyRate").optional().isNumeric(),
    body("hourlyRate").optional().isFloat({ min: 0 }),
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

      const professor = await Professor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("user", "firstName lastName email phone");

      if (!professor) {
        return res.status(404).json({ message: "Professeur non trouvé" });
      }

      res.json({
        message: "Professeur mis à jour avec succès",
        professor,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du professeur:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   POST /api/professors/:id/documents
// @desc    Uploader un document pour un professeur
// @access  Private (Admin ou le professeur lui-même)
router.post(
  "/:id/documents",
  [authorize(["admin", "professor"]), upload.single("document")],
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier fourni" });
      }

      const professor = await Professor.findById(req.params.id);
      if (!professor) {
        return res.status(404).json({ message: "Professeur non trouvé" });
      }

      const document = {
        name: req.body.name || req.file.originalname,
        type: req.body.type || "other",
        filename: req.file.filename,
        uploadDate: new Date(),
        verified: false,
      };

      professor.documents.push(document);
      await professor.save();

      res.json({
        message: "Document uploadé avec succès",
        document,
      });
    } catch (error) {
      console.error("Erreur lors de l'upload du document:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PUT /api/professors/:id/status
// @desc    Changer le statut d'un professeur
// @access  Private (Admin)
router.put(
  "/:id/status",
  [
    authorize(["admin"]),
    body("status").isIn(["active", "inactive", "pending", "suspended"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Statut invalide",
          errors: errors.array(),
        });
      }

      const professor = await Professor.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      ).populate("user", "firstName lastName email");

      if (!professor) {
        return res.status(404).json({ message: "Professeur non trouvé" });
      }

      res.json({
        message: "Statut mis à jour avec succès",
        professor,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

module.exports = router;
