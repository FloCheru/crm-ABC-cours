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
      .populate("subjects", "name category")
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
      "subjects",
      "name category"
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
    body("firstName").trim().notEmpty().withMessage("Prénom requis"),
    body("lastName").trim().notEmpty().withMessage("Nom requis"),
    body("email").isEmail().normalizeEmail().withMessage("Email valide requis"),
    body("phone").optional().trim(),
    body("birthDate").optional().isISO8601().withMessage("Date valide requise"),
    body("postalCode").optional().trim(),
    body("identifier").optional().trim(),
    body("notifyEmail").optional().isEmail().normalizeEmail(),
    body("hourlyRate")
      .isNumeric()
      .withMessage("Tarif horaire valide requis"),
    body("hourlyRate")
      .isFloat({ min: 0 })
      .withMessage("Tarif horaire doit être positif"),
    body("subjects")
      .optional()
      .isArray()
      .withMessage("Les matières doivent être un array"),
    body("subjects.*")
      .optional()
      .isMongoId()
      .withMessage("Les IDs de matières doivent être valides"),
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

      // Vérifier qu'un professeur n'existe pas déjà avec cet email
      const existingProfessor = await Professor.findOne({
        email: req.body.email,
      });
      if (existingProfessor) {
        return res.status(400).json({
          message: "Un professeur existe déjà avec cet email",
        });
      }

      // Valider les subjects s'ils sont fournis
      if (req.body.subjects && req.body.subjects.length > 0) {
        const Subject = require("../models/Subject");
        for (const subjectId of req.body.subjects) {
          const subject = await Subject.findById(subjectId);
          if (!subject) {
            return res.status(400).json({
              message: `Matière avec l'ID ${subjectId} non trouvée`,
            });
          }
        }
      }

      const professor = new Professor(req.body);
      await professor.save();

      const populatedProfessor = await Professor.findById(
        professor._id
      ).populate("subjects", "name category");

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
    body("subjects.*").optional().isMongoId().withMessage("Les IDs de matières doivent être valides"),
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
      ).populate("subjects", "name category");

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
