const express = require("express");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const Professor = require("../models/Professor");
const { authenticate, authorize } = require("../middleware/auth");
const UserService = require("../services/userService");

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
    const professor = await Professor.findById(req.params.id)
      .populate("subjects", "name category");

    if (!professor) {
      return res.status(404).json({ message: "Professeur non trouvé" });
    }

    // Inclure teachingSubjects dans la réponse pour éviter un appel API séparé
    const professorData = professor.toObject();
    professorData.teachingSubjects = professor.teachingSubjects || [];

    res.json({ professor: professorData });
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
      // Debug logging
      console.log("[POST /professors] 🔐 Authentification réussie");
      console.log("[POST /professors] 👤 User:", {
        userId: req.user?._id,
        userRole: req.user?.role,
        userEmail: req.user?.email,
      });
      console.log("[POST /professors] 📊 Données reçues:", {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        subjects: req.body.subjects,
      });

      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("[POST /professors] ❌ Erreurs de validation:", errors.array());
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      console.log("[POST /professors] ✅ Validation réussie");

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

      console.log("[POST /professors] 💾 Création du document MongoDB...");

      // Générer un mot de passe temporaire si aucun mot de passe fourni
      let temporaryPassword = null;
      if (!req.body.password) {
        temporaryPassword = UserService.generateTemporaryPassword();
        req.body.password = temporaryPassword;
        req.body.isPasswordSet = false;
        console.log("[POST /professors] 🔐 Mot de passe temporaire généré");
      } else {
        req.body.isPasswordSet = true;
      }

      const professor = new Professor(req.body);
      await professor.save();
      console.log("[POST /professors] ✅ Document créé avec ID:", professor._id);

      const populatedProfessor = await Professor.findById(
        professor._id
      ).populate("subjects", "name category");

      console.log("[POST /professors] 📤 Réponse envoyée au client:", {
        id: populatedProfessor._id,
        firstName: populatedProfessor.firstName,
        lastName: populatedProfessor.lastName,
        email: populatedProfessor.email,
      });

      const response = {
        message: "Professeur créé avec succès",
        professor: populatedProfessor,
      };

      // Inclure le mot de passe temporaire dans la réponse si généré
      if (temporaryPassword) {
        response.temporaryPassword = temporaryPassword;
        response.message = "Professeur créé avec succès. Un mot de passe temporaire a été généré.";
        console.log("[POST /professors] ⚠️  IMPORTANT: Communiquer ce mot de passe temporaire au professeur");
      }

      res.status(201).json(response);
    } catch (error) {
      console.error("[POST /professors] ❌ Erreur lors de la création:", error.message);
      console.error("[POST /professors] Stack:", error.stack);
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
  ],
  async (req, res) => {
    try {
      console.log("[PUT /professors/:id] 🔄 Mise à jour du profil - ID:", req.params.id);
      console.log("[PUT /professors/:id] 👤 Utilisateur:", {
        userId: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email
      });

      // Vérification de sécurité : un professeur ne peut modifier que son propre profil
      if (req.user.role === "professor" && req.user._id.toString() !== req.params.id) {
        console.log("[PUT /professors/:id] ❌ Accès refusé - Professeur:", req.user._id, "tentant de modifier:", req.params.id);
        return res.status(403).json({ message: "Vous ne pouvez modifier que votre propre profil" });
      }

      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("[PUT /professors/:id] ❌ Erreurs de validation:", errors.array());
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      // Récupérer le professeur actuel pour comparer
      const currentProfessor = await Professor.findById(req.params.id);

      // Identifier les champs modifiés
      const changedFields = [];
      const oldValues = {};
      const newValues = {};

      for (const [key, value] of Object.entries(req.body)) {
        if (JSON.stringify(currentProfessor?.[key]) !== JSON.stringify(value)) {
          changedFields.push(key);
          oldValues[key] = currentProfessor?.[key];
          newValues[key] = value;
        }
      }

      console.log("[PUT /professors/:id] 📝 Avant modification:", {
        fields: changedFields.length > 0 ? changedFields : "aucun changement",
        oldValues: changedFields.length > 0 ? oldValues : {}
      });

      // Log détaillé du body reçu
      console.log("[PUT /professors/:id] 🔍 Détails du body reçu:");
      console.log("[PUT /professors/:id] - primaryAddress:", req.body.primaryAddress);
      console.log("[PUT /professors/:id] - postalCode (racine):", req.body.postalCode);
      console.log("[PUT /professors/:id] - Body complet:", JSON.stringify(req.body, null, 2));

      const professor = await Professor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("subjects", "name category");

      // Log après la mise à jour
      console.log("[PUT /professors/:id] 📋 Professeur après mise à jour:");
      console.log("[PUT /professors/:id] - primaryAddress:", professor?.primaryAddress);
      console.log("[PUT /professors/:id] - postalCode (racine):", professor?.postalCode);

      if (!professor) {
        console.log("[PUT /professors/:id] ❌ Professeur non trouvé");
        return res.status(404).json({ message: "Professeur non trouvé" });
      }

      console.log("[PUT /professors/:id] ✅ Profil mis à jour avec succès");
      console.log("[PUT /professors/:id] 📊 Champs modifiés:", {
        count: changedFields.length,
        fields: changedFields,
        newValues: newValues
      });

      res.json({
        message: "Professeur mis à jour avec succès",
        professor,
      });
    } catch (error) {
      console.error("[PUT /professors/:id] ❌ Erreur:", error.message);
      console.error("[PUT /professors/:id] Stack:", error.stack);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   DELETE /api/professors/:id
// @desc    Supprimer un professeur
// @access  Private (Admin)
router.delete(
  "/:id",
  authorize(["admin"]),
  async (req, res) => {
    try {
      // Récupérer d'abord le professeur pour vérifier son email
      const professor = await Professor.findById(req.params.id);

      if (!professor) {
        return res.status(404).json({ message: "Professeur non trouvé" });
      }

      // Protection : bloquer la suppression du profil de test
      if (professor.email === 'prof@abc-cours.fr') {
        console.log("⚠️ Tentative de suppression du profil de test bloquée");
        return res.status(403).json({
          message: "Impossible de supprimer le profil de test. Ce profil est protégé."
        });
      }

      // Supprimer le professeur
      await Professor.findByIdAndDelete(req.params.id);

      res.json({
        message: "Professeur supprimé avec succès",
        professor,
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du professeur:", error);
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
      );

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

// @route   PUT /api/professors/:id/subjects
// @desc    Mettre à jour les matières enseignées d'un professeur
// @access  Private (Admin ou le professeur lui-même)
router.put(
  "/:id/subjects",
  [
    authorize(["admin", "professor"]),
    body("teachingSubjects")
      .isArray()
      .withMessage("teachingSubjects doit être un tableau"),
    body("teachingSubjects.*.subjectId")
      .notEmpty()
      .withMessage("subjectId est requis"),
    body("teachingSubjects.*.subjectName")
      .trim()
      .notEmpty()
      .withMessage("subjectName est requis"),
    body("teachingSubjects.*.grades")
      .isArray()
      .withMessage("grades doit être un tableau"),
    body("teachingSubjects.*.levels")
      .isArray()
      .withMessage("levels doit être un tableau"),
  ],
  async (req, res) => {
    try {
      // Vérification de sécurité : un professeur ne peut modifier que ses propres matières
      if (req.user.role === "professor" && req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres matières" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { teachingSubjects } = req.body;

      // Vérifier que toutes les matières existent
      const Subject = require("../models/Subject");
      for (const ts of teachingSubjects) {
        const subject = await Subject.findById(ts.subjectId);
        if (!subject) {
          return res.status(400).json({
            message: `Matière avec l'ID ${ts.subjectId} non trouvée`,
          });
        }
      }

      // Mettre à jour le professeur
      const professor = await Professor.findByIdAndUpdate(
        req.params.id,
        {
          teachingSubjects,
          subjects: teachingSubjects.map((ts) => ts.subjectId),
        },
        { new: true, runValidators: true }
      ).populate("subjects", "name category");

      if (!professor) {
        return res.status(404).json({ message: "Professeur non trouvé" });
      }

      res.json({
        message: "Matières mises à jour avec succès",
        teachingSubjects: professor.teachingSubjects,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des matières:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);


module.exports = router;
