const express = require("express");
const { body, validationResult } = require("express-validator");
const Student = require("../models/Student");
const Family = require("../models/Family");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

// @route   GET /api/students
// @desc    Obtenir tous les élèves
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, family, level } = req.query;

    // Construire le filtre
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { "school.name": { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }
    if (family) {
      filter.familyId = family;
    }
    if (level) {
      // Normalisation pour ignorer les accents et la casse
      const normalize = (str) =>
        str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const validLevels = ["primaire", "collège", "lycée", "supérieur"];
      const normalizedLevels = validLevels.map(normalize);
      if (normalizedLevels.includes(normalize(level))) {
        filter["school.level"] =
          validLevels[normalizedLevels.indexOf(normalize(level))];
      } else {
        return res.status(400).json({
          message:
            "Niveau invalide. Valeurs acceptées: primaire, collège, lycée, supérieur",
        });
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const students = await Student.find(filter)
      .populate("family", "name contact.email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(filter);

    res.json({
      students,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des élèves:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/students/:id
// @desc    Obtenir un élève par ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "family",
      "name address contact"
    );

    if (!student) {
      return res.status(404).json({ message: "Élève non trouvé" });
    }

    res.json({ student });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'élève:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/students
// @desc    Créer un nouvel élève
// @access  Private (Admin)
router.post(
  "/",
  [
    authorize(["admin"]),
    body("firstName").trim().notEmpty().withMessage("Prénom requis"),
    body("lastName").trim().notEmpty().withMessage("Nom requis"),
    body("dateOfBirth")
      .isISO8601()
      .withMessage("Date de naissance valide requise"),
    body("family").isMongoId().withMessage("Famille valide requise"),
    body("school.name")
      .trim()
      .notEmpty()
      .withMessage("Nom de l'établissement requis"),
    body("school.level")
      .isIn(["primaire", "collège", "lycée", "supérieur"])
      .withMessage("Niveau scolaire valide requis"),
    body("school.grade").trim().notEmpty().withMessage("Classe requise"),
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
      const family = await Family.findById(req.body.familyId);
      if (!family) {
        return res.status(400).json({ message: "Famille non trouvée" });
      }

      const student = new Student(req.body);
      await student.save();

      // Ajouter l'élève à la famille
      await Family.findByIdAndUpdate(req.body.familyId, {
        $push: { students: student._id },
      });

      // Note: La relation est maintenant bidirectionnelle
      // L'élève connaît sa famille ET la famille connaît ses élèves

      const populatedStudent = await Student.findById(student._id).populate(
        "family",
        "name contact.email"
      );

      res.status(201).json({
        message: "Élève créé avec succès",
        student: populatedStudent,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'élève:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PUT /api/students/:id
// @desc    Mettre à jour un élève
// @access  Private (Admin)
router.put(
  "/:id",
  [
    authorize(["admin"]),
    body("firstName").optional().trim().notEmpty(),
    body("lastName").optional().trim().notEmpty(),
    body("dateOfBirth").optional().isISO8601(),
    body("school.level")
      .optional()
      .isIn(["primaire", "collège", "lycée", "supérieur"]),
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

      const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("family", "primaryContact address");

      if (!student) {
        return res.status(404).json({ message: "Élève non trouvé" });
      }

      // Si la famille a changé, mettre à jour les relations
      if (req.body.familyId && req.body.familyId !== student.familyId._id) {
        // Retirer l'élève de l'ancienne famille
        await Family.findByIdAndUpdate(student.familyId._id, {
          $pull: { students: student._id },
        });

        // Ajouter l'élève à la nouvelle famille
        await Family.findByIdAndUpdate(req.body.familyId, {
          $push: { students: student._id },
        });
      }

      res.json({
        message: "Élève mis à jour avec succès",
        student,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'élève:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   DELETE /api/students/:id
// @desc    Supprimer un élève
// @access  Private (Admin)
router.delete("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Élève non trouvé" });
    }

    // Vérifier s'il y a des assignations actives
    // TODO: Ajouter la vérification des assignations

    // Retirer l'élève de la famille
    await Family.findByIdAndUpdate(student.familyId, {
      $pull: { students: student._id },
    });

    // Note: La relation est maintenant bidirectionnelle
    // Il faut maintenir la cohérence des deux côtés

    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: "Élève supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'élève:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/students/family/:familyId
// @desc    Obtenir tous les élèves d'une famille
// @access  Private
router.get("/family/:familyId", async (req, res) => {
  try {
    const students = await Student.find({ family: req.params.familyId })
      .populate("family", "name contact.email")
      .sort({ firstName: 1 });

    res.json({ students });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des élèves de la famille:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
