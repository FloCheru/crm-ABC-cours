const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();

// Middleware d'authentification
const { authenticate, authorize } = require("../middleware/auth");

// Modèles
const Assignment = require("../models/Assignment");
const Student = require("../models/Student");
const Professor = require("../models/Professor");

// Utilitaires
const {
  isValidObjectId,
  formatMongoErrors,
  createPaginatedResponse,
  createSearchFilter,
  createSortOptions,
  validatePaginationParams,
  createErrorResponse,
  createSuccessResponse,
} = require("../utils/dbHelpers");

/**
 * @route   GET /api/assignments
 * @desc    Récupérer toutes les assignations avec pagination et filtres
 * @access  Private (Admin, Professor)
 */
router.get(
  "/",
  authenticate,
  authorize(["admin", "professor"]),
  async (req, res) => {
    try {
      const {
        page,
        limit,
        search,
        status,
        subject,
        professorId,
        studentId,
        sortBy,
        sortOrder,
      } = req.query;

      // Validation des paramètres de pagination
      const pagination = validatePaginationParams({ page, limit });

      // Création du filtre
      const filter = {};

      // Recherche textuelle
      if (search) {
        filter.$or = [{ subject: new RegExp(search, "i") }];
      }

      // Filtres
      if (status) filter.status = status;
      if (subject) filter.subject = subject;
      if (professorId && isValidObjectId(professorId))
        filter.professor = professorId;
      if (studentId && isValidObjectId(studentId)) filter.student = studentId;

      // Options de tri
      const sortOptions = createSortOptions(sortBy, sortOrder);

      // Récupération des données avec population
      const assignments = await Assignment.find(filter)
        .populate({
          path: "student",
          select: "firstName lastName school family",
          populate: {
            path: "family",
            select: "name contact",
          },
        })
        .populate({
          path: "professor",
          select: "subjects hourlyRate status",
          populate: {
            path: "user",
            select: "firstName lastName email phone",
          },
        })
        .sort(sortOptions)
        .skip(pagination.skip)
        .limit(pagination.limit);

      // Comptage total
      const total = await Assignment.countDocuments(filter);

      // Réponse paginée
      const response = createPaginatedResponse(
        assignments,
        pagination.page,
        pagination.limit,
        total
      );

      res.json(
        createSuccessResponse(response, "Assignations récupérées avec succès")
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des assignations:", error);
      res.status(500).json(createErrorResponse("Erreur serveur", 500));
    }
  }
);

/**
 * @route   GET /api/assignments/:id
 * @desc    Récupérer une assignation par ID
 * @access  Private (Admin, Professor)
 */
router.get(
  "/:id",
  authenticate,
  authorize(["admin", "professor"]),
  [
    param("id").custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("ID invalide");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const assignment = await Assignment.findById(id)
        .populate({
          path: "student",
          select:
            "firstName lastName school family dateOfBirth subjects contact notes",
          populate: {
            path: "family",
            select: "name address contact parents",
          },
        })
        .populate({
          path: "professor",
          select:
            "subjects education experience hourlyRate availability status notes",
          populate: {
            path: "user",
            select: "firstName lastName email phone",
          },
        });

      if (!assignment) {
        return res
          .status(404)
          .json(createErrorResponse("Assignation non trouvée", 404));
      }

      res.json(
        createSuccessResponse(assignment, "Assignation récupérée avec succès")
      );
    } catch (error) {
      console.error("Erreur lors de la récupération de l'assignation:", error);
      res.status(500).json(createErrorResponse("Erreur serveur", 500));
    }
  }
);

/**
 * @route   POST /api/assignments
 * @desc    Créer une nouvelle assignation
 * @access  Private (Admin)
 */
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  [
    body("studentId")
      .notEmpty()
      .withMessage("ID de l'élève requis")
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error("ID d'élève invalide");
        }
        return true;
      }),
    body("professorId")
      .notEmpty()
      .withMessage("ID du professeur requis")
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error("ID de professeur invalide");
        }
        return true;
      }),
    body("subject")
      .notEmpty()
      .withMessage("Matière requise")
      .isLength({ min: 2, max: 50 })
      .withMessage("Matière doit contenir entre 2 et 50 caractères"),
    body("startDate")
      .notEmpty()
      .withMessage("Date de début requise")
      .isISO8601()
      .withMessage("Format de date invalide"),
    body("endDate")
      .optional()
      .isISO8601()
      .withMessage("Format de date de fin invalide"),
    body("schedule.day")
      .notEmpty()
      .withMessage("Jour de la semaine requis")
      .isIn([
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
      ])
      .withMessage("Jour de la semaine invalide"),
    body("schedule.time")
      .notEmpty()
      .withMessage("Horaire requis")
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      )
      .withMessage("Format d'horaire invalide (HH:MM-HH:MM)"),
    body("schedule.frequency")
      .notEmpty()
      .withMessage("Fréquence requise")
      .isIn(["weekly", "biweekly", "monthly"])
      .withMessage("Fréquence invalide"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes trop longues (max 500 caractères)"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(createErrorResponse("Données invalides", 400, errors.array()));
      }

      const {
        studentId,
        professorId,
        subject,
        startDate,
        endDate,
        schedule,
        notes,
      } = req.body;

      // Vérifier que l'élève existe
      const student = await Student.findById(studentId);
      if (!student) {
        return res
          .status(404)
          .json(createErrorResponse("Élève non trouvé", 404));
      }

      // Vérifier que le professeur existe
      const professor = await Professor.findById(professorId);
      if (!professor) {
        return res
          .status(404)
          .json(createErrorResponse("Professeur non trouvé", 404));
      }

      // Vérifier que le professeur enseigne la matière
      if (!professor.subjects.includes(subject)) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              "Le professeur n'enseigne pas cette matière",
              400
            )
          );
      }

      // Vérifier la disponibilité du professeur
      const isAvailable = professor.availability.some(
        (avail) =>
          avail.day === schedule.day &&
          avail.slots.some((slot) => {
            const [slotStart, slotEnd] = slot.split("-");
            const [reqStart, reqEnd] = schedule.time.split("-");
            return reqStart >= slotStart && reqEnd <= slotEnd;
          })
      );

      if (!isAvailable) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              "Le professeur n'est pas disponible à cet horaire",
              400
            )
          );
      }

      // Vérifier les conflits d'horaires
      const conflictingAssignment = await Assignment.findOne({
        professor: professorId,
        status: "active",
        "schedule.day": schedule.day,
        "schedule.time": schedule.time,
      });

      if (conflictingAssignment) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              "Conflit d'horaire avec une autre assignation",
              400
            )
          );
      }

      // Créer l'assignation
      const assignment = new Assignment({
        student: studentId,
        professor: professorId,
        subject,
        startDate,
        endDate,
        schedule,
        notes,
        status: "active",
      });

      await assignment.save();

      // Populer les références pour la réponse
      await assignment.populate([
        {
          path: "student",
          select: "firstName lastName grade",
          populate: {
            path: "family",
            select: "name",
          },
        },
        {
          path: "professor",
          select: "subjects hourlyRate",
          populate: {
            path: "user",
            select: "firstName lastName",
          },
        },
      ]);

      res
        .status(201)
        .json(
          createSuccessResponse(
            assignment,
            "Assignation créée avec succès",
            201
          )
        );
    } catch (error) {
      console.error("Erreur lors de la création de l'assignation:", error);

      if (error.name === "ValidationError") {
        const errors = formatMongoErrors(error);
        return res
          .status(400)
          .json(createErrorResponse("Données invalides", 400, errors));
      }

      res.status(500).json(createErrorResponse("Erreur serveur", 500));
    }
  }
);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Modifier une assignation
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  [
    param("id").custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("ID invalide");
      }
      return true;
    }),
    body("subject")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Matière doit contenir entre 2 et 50 caractères"),
    body("startDate")
      .optional()
      .isISO8601()
      .withMessage("Format de date de début invalide"),
    body("endDate")
      .optional()
      .isISO8601()
      .withMessage("Format de date de fin invalide"),
    body("schedule.day")
      .optional()
      .isIn([
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
      ])
      .withMessage("Jour de la semaine invalide"),
    body("schedule.time")
      .optional()
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      )
      .withMessage("Format d'horaire invalide (HH:MM-HH:MM)"),
    body("schedule.frequency")
      .optional()
      .isIn(["weekly", "biweekly", "monthly"])
      .withMessage("Fréquence invalide"),
    body("status")
      .optional()
      .isIn(["active", "paused", "completed", "cancelled"])
      .withMessage("Statut invalide"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes trop longues (max 500 caractères)"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(createErrorResponse("Données invalides", 400, errors.array()));
      }

      const { id } = req.params;
      const updateData = req.body;

      // Vérifier que l'assignation existe
      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res
          .status(404)
          .json(createErrorResponse("Assignation non trouvée", 404));
      }

      // Si on modifie l'horaire, vérifier les conflits
      if (updateData.schedule) {
        const conflictingAssignment = await Assignment.findOne({
          _id: { $ne: id },
          professor: assignment.professor,
          status: "active",
          "schedule.day": updateData.schedule.day,
          "schedule.time": updateData.schedule.time,
        });

        if (conflictingAssignment) {
          return res
            .status(400)
            .json(
              createErrorResponse(
                "Conflit d'horaire avec une autre assignation",
                400
              )
            );
        }
      }

      // Mettre à jour l'assignation
      const updatedAssignment = await Assignment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        {
          path: "student",
          select: "firstName lastName grade",
          populate: {
            path: "family",
            select: "name",
          },
        },
        {
          path: "professor",
          select: "subjects hourlyRate",
          populate: {
            path: "user",
            select: "firstName lastName",
          },
        },
      ]);

      res.json(
        createSuccessResponse(
          updatedAssignment,
          "Assignation mise à jour avec succès"
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'assignation:", error);

      if (error.name === "ValidationError") {
        const errors = formatMongoErrors(error);
        return res
          .status(400)
          .json(createErrorResponse("Données invalides", 400, errors));
      }

      res.status(500).json(createErrorResponse("Erreur serveur", 500));
    }
  }
);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Supprimer une assignation
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  [
    param("id").custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("ID invalide");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res
          .status(404)
          .json(createErrorResponse("Assignation non trouvée", 404));
      }

      await Assignment.findByIdAndDelete(id);

      res.json(
        createSuccessResponse(null, "Assignation supprimée avec succès")
      );
    } catch (error) {
      console.error("Erreur lors de la suppression de l'assignation:", error);
      res.status(500).json(createErrorResponse("Erreur serveur", 500));
    }
  }
);

/**
 * @route   GET /api/assignments/student/:studentId
 * @desc    Récupérer les assignations d'un élève
 * @access  Private (Admin, Professor)
 */
router.get(
  "/student/:studentId",
  authenticate,
  authorize(["admin", "professor"]),
  [
    param("studentId").custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("ID d'élève invalide");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const { studentId } = req.params;

      const assignments = await Assignment.find({ student: studentId })
        .populate({
          path: "professor",
          select: "subjects hourlyRate",
          populate: {
            path: "user",
            select: "firstName lastName email",
          },
        })
        .sort({ startDate: -1 });

      res.json(
        createSuccessResponse(assignments, "Assignations de l'élève récupérées")
      );
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des assignations de l'élève:",
        error
      );
      res.status(500).json(createErrorResponse("Erreur serveur", 500));
    }
  }
);

/**
 * @route   GET /api/assignments/professor/:professorId
 * @desc    Récupérer les assignations d'un professeur
 * @access  Private (Admin, Professor)
 */
router.get(
  "/professor/:professorId",
  authenticate,
  authorize(["admin", "professor"]),
  [
    param("professorId").custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("ID de professeur invalide");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const { professorId } = req.params;

      const assignments = await Assignment.find({ professor: professorId })
        .populate({
          path: "student",
          select: "firstName lastName grade",
          populate: {
            path: "family",
            select: "name phone",
          },
        })
        .sort({ startDate: -1 });

      res.json(
        createSuccessResponse(
          assignments,
          "Assignations du professeur récupérées"
        )
      );
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des assignations du professeur:",
        error
      );
      res.status(500).json(createErrorResponse("Erreur serveur", 500));
    }
  }
);

module.exports = router;
