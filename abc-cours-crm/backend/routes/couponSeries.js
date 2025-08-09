const express = require("express");
const { body, query, validationResult } = require("express-validator");
const CouponSeries = require("../models/CouponSeries");
const Coupon = require("../models/Coupon");
const Family = require("../models/Family");
const Student = require("../models/Student");
const Professor = require("../models/Professor");
const Subject = require("../models/Subject");
const { authenticateToken, authorize } = require("../middleware/auth");
const {
  isValidObjectId,
  buildPaginationQuery,
  buildPaginatedResponse,
} = require("../utils/dbHelpers");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/coupon-series/student/:studentId/subject/:subjectId
// Récupérer les séries de coupons pour un élève et une matière spécifiques
router.get("/student/:studentId/subject/:subjectId", async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;

    // Vérifier que l'élève et la matière existent
    const [student, subject] = await Promise.all([
      Student.findById(studentId),
      Subject.findById(subjectId),
    ]);

    if (!student) {
      return res.status(404).json({ message: "Élève non trouvé" });
    }

    if (!subject) {
      return res.status(404).json({ message: "Matière non trouvée" });
    }

    // Récupérer les séries de coupons actives pour cet élève et cette matière
    const couponSeries = await CouponSeries.find({
      student: studentId,
      subject: subjectId,
      status: { $in: ["active", "completed"] },
    })
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .sort({ purchaseDate: -1 });

    res.json(couponSeries);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des séries de coupons:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Validation pour créer une série de coupons
const createSeriesValidation = [
  body("family").isMongoId().withMessage("Valid family ID required"),
  body("student").isMongoId().withMessage("Valid student ID required"),
  body("professor")
    .optional()
    .custom((value, { req }) => {
      // Si autoAssignTeacher est true, professor peut être null
      if (req.body.autoAssignTeacher === true) {
        return true;
      }
      // Sinon, professor doit être un ID MongoDB valide
      if (!value) {
        throw new Error(
          "Professor ID required when auto-assignment is disabled"
        );
      }
      const mongoose = require("mongoose");
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage(
      "Valid professor ID required when auto-assignment is disabled"
    ),
  body("subject").isMongoId().withMessage("Valid subject ID required"),
  body("totalCoupons")
    .isInt({ min: 1, max: 100 })
    .withMessage("Total coupons must be between 1 and 100"),
  body("hourlyRate")
    .isFloat({ min: 0 })
    .withMessage("Hourly rate must be positive"),
  body("expirationMonths")
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage("Expiration must be between 1 and 24 months"),
  body("notes").optional().trim(),
  body("autoAssignTeacher").optional().isBoolean(),
  body("sendNotification").optional().isBoolean(),
];

// GET /api/coupon-series - Liste des séries de coupons
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("family").optional().isMongoId(),
    query("student").optional().isMongoId(),
    query("professor").optional().isMongoId(),
    query("subject").optional().trim(),
    query("status")
      .optional()
      .isIn(["active", "expired", "suspended", "completed"]),
    query("paymentStatus")
      .optional()
      .isIn(["pending", "paid", "partial", "refunded"]),
    query("sortBy")
      .optional()
      .isIn([
        "purchaseDate",
        "expirationDate",
        "totalAmount",
        "remainingCoupons",
      ]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  async (req, res) => {
    try {
      console.log("🔍 GET /api/coupon-series - Début de la requête");
      console.log("🔍 Utilisateur:", req.user);
      console.log("🔍 Query params:", req.query);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Erreurs de validation:", errors.array());
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 10,
        family,
        student,
        professor,
        subject,
        status,
        paymentStatus,
        sortBy = "purchaseDate",
        sortOrder = "desc",
      } = req.query;

      console.log("🔍 Paramètres traités:", {
        page,
        limit,
        family,
        student,
        professor,
        subject,
        status,
        paymentStatus,
        sortBy,
        sortOrder,
      });

      // Construction du filtre
      let filter = {};

      if (family && isValidObjectId(family)) filter.family = family;
      if (student && isValidObjectId(student)) filter.student = student;
      if (professor && isValidObjectId(professor)) filter.professor = professor;
      if (subject) filter.subject = new RegExp(subject, "i");
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;

      console.log("🔍 Filtre construit:", filter);

      // Pagination et tri
      const { skip, limit: pageLimit } = buildPaginationQuery(page, limit);
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      console.log("🔍 Pagination:", { skip, pageLimit });
      console.log("🔍 Tri:", sort);

      // Exécution des requêtes
      console.log("🔍 Exécution de la requête MongoDB...");
      const [series, total] = await Promise.all([
        CouponSeries.find(filter)
          .populate("family", "name contact.email")
          .populate("student", "firstName lastName")
          .populate("subject", "name category")
          .populate({
            path: "professor",
            populate: {
              path: "user",
              select: "firstName lastName",
            },
          })
          .populate("createdBy", "firstName lastName")
          .sort(sort)
          .skip(skip)
          .limit(pageLimit)
          .lean(),
        CouponSeries.countDocuments(filter),
      ]);

      console.log("🔍 Résultats:", { seriesCount: series.length, total });

      // Enrichir avec les coupons restants et le statut
      const enrichedSeries = series.map((s) => ({
        ...s,
        remainingCoupons: s.totalCoupons - s.usedCoupons,
        usagePercentage: ((s.usedCoupons / s.totalCoupons) * 100).toFixed(1),
        isExpired: new Date() > s.expirationDate,
        isCompleted: s.usedCoupons >= s.totalCoupons,
      }));

      const response = buildPaginatedResponse(
        enrichedSeries,
        total,
        page,
        pageLimit
      );

      console.log("🔍 Réponse envoyée avec succès");
      res.json(response);
    } catch (error) {
      console.error("❌ Erreur dans GET /api/coupon-series:", error);
      console.error("❌ Stack trace:", error.stack);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/coupon-series/:id - Détails d'une série avec ses coupons
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid series ID" });
    }

    const series = await CouponSeries.findById(id)
      .populate("family", "name contact address")
      .populate("student", "firstName lastName schoolLevel subjects")
      .populate("subject", "name category description")
      .populate({
        path: "professor",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      })
      .populate("createdBy", "firstName lastName")
      .lean();

    if (!series) {
      return res.status(404).json({ error: "Coupon series not found" });
    }

    // Récupérer tous les coupons de cette série
    const coupons = await Coupon.find({ series: id })
      .populate("usedBy", "firstName lastName")
      .sort({ couponNumber: 1 })
      .lean();

    // Statistiques de la série
    const stats = {
      totalCoupons: series.totalCoupons,
      usedCoupons: series.usedCoupons,
      remainingCoupons: series.totalCoupons - series.usedCoupons,
      usagePercentage: (
        (series.usedCoupons / series.totalCoupons) *
        100
      ).toFixed(1),
      averageSessionDuration: coupons
        .filter((c) => c.status === "used" && c.sessionDuration)
        .reduce((acc, c, _, arr) => acc + c.sessionDuration / arr.length, 0),
      totalAmountUsed: (series.usedCoupons * series.hourlyRate).toFixed(2),
      remainingValue: (
        (series.totalCoupons - series.usedCoupons) *
        series.hourlyRate
      ).toFixed(2),
    };

    res.json({
      series: {
        ...series,
        ...stats,
        isExpired: new Date() > series.expirationDate,
        isCompleted: series.usedCoupons >= series.totalCoupons,
      },
      coupons,
      stats,
    });
  } catch (error) {
    console.error("Get coupon series details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coupon-series - Créer une nouvelle série de coupons
router.post(
  "/",
  authorize(["admin"]),
  createSeriesValidation,
  async (req, res) => {
    try {
      console.log("🔍 POST /api/coupon-series - Début de la requête");
      console.log("🔍 Données reçues:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Erreurs de validation:", errors.array());
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        family,
        student,
        professor,
        subject,
        totalCoupons,
        hourlyRate,
        expirationMonths = 12,
        notes,
        autoAssignTeacher = false,
        sendNotification = false,
      } = req.body;

      console.log("🔍 Paramètres extraits:", {
        family,
        student,
        professor,
        subject,
        totalCoupons,
        hourlyRate,
        autoAssignTeacher,
      });

      // Vérifications des entités liées
      console.log("🔍 Vérification des entités liées...");
      const [familyExists, studentExists, subjectExists] = await Promise.all([
        Family.findById(family),
        Student.findById(student),
        Subject.findById(subject),
      ]);

      console.log("🔍 Entités trouvées:", {
        familyExists: !!familyExists,
        studentExists: !!studentExists,
        subjectExists: !!subjectExists,
        subjectName: subjectExists?.name,
      });

      if (!familyExists)
        return res.status(400).json({ error: "Family not found" });
      if (!studentExists)
        return res.status(400).json({ error: "Student not found" });
      if (!subjectExists)
        return res.status(400).json({ error: "Subject not found" });

      // Vérifier que l'élève appartient à la famille
      if (studentExists.family.toString() !== family) {
        return res
          .status(400)
          .json({ error: "Student does not belong to this family" });
      }

      // Gérer l'assignation du professeur
      console.log("🔍 Gestion de l'assignation du professeur...");
      let professorId = professor;

      if (!professorId && autoAssignTeacher) {
        console.log(
          "🔍 Recherche d'un professeur disponible pour:",
          subjectExists.name
        );
        // Auto-assigner un professeur disponible pour cette matière
        const availableProfessor = await Professor.findOne({
          "subjects.name": {
            $regex: new RegExp(subjectExists.name, "i"),
          },
          status: "active",
        });

        console.log(
          "🔍 Professeur trouvé:",
          availableProfessor ? "Oui" : "Non"
        );

        if (availableProfessor) {
          professorId = availableProfessor._id;
          console.log(
            `🔍 Professeur auto-assigné: ${availableProfessor.user.firstName} ${availableProfessor.user.lastName}`
          );
        } else {
          return res.status(400).json({
            error: "Aucun professeur disponible pour cette matière",
          });
        }
      } else if (professorId) {
        // Vérifier que le professeur spécifié existe et enseigne cette matière
        const professorExists = await Professor.findById(professorId);
        if (!professorExists) {
          return res.status(400).json({ error: "Professor not found" });
        }

        const teachesSubject = professorExists.subjects.some(
          (s) => s.name.toLowerCase() === subjectExists.name.toLowerCase()
        );
        if (!teachesSubject) {
          return res
            .status(400)
            .json({ error: "Professor does not teach this subject" });
        }
      } else {
        return res.status(400).json({
          error: "Professor ID required or auto-assignment must be enabled",
        });
      }

      console.log("🔍 ProfessorId final:", professorId);

      // Calculer la date d'expiration
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + expirationMonths);

      console.log("🔍 Création de la série de coupons...");
      // Créer la série de coupons
      const series = new CouponSeries({
        family,
        student,
        subject,
        professor: professorId,
        totalCoupons,
        hourlyRate,
        totalAmount: totalCoupons * hourlyRate, // Calculer manuellement le montant total
        expirationDate,
        notes,
        createdBy: req.user._id,
        // Le nom sera généré automatiquement par le middleware
      });

      await series.save();
      console.log("🔍 Série créée avec succès, ID:", series._id);

      // Créer les coupons individuels
      console.log("🔍 Création des coupons individuels...");
      const coupons = [];
      for (let i = 1; i <= totalCoupons; i++) {
        coupons.push({
          series: series._id,
          couponNumber: i,
          status: "available",
        });
      }

      await Coupon.insertMany(coupons);
      console.log("🔍 Coupons créés avec succès");

      // Retourner la série créée avec tous les détails
      const createdSeries = await CouponSeries.findById(series._id)
        .populate("family", "name contact.email")
        .populate("student", "firstName lastName")
        .populate("subject", "name category")
        .populate("professor", "user.firstName user.lastName")
        .populate("createdBy", "firstName lastName");

      console.log("🔍 Réponse envoyée avec succès");
      res.status(201).json({
        message: "Coupon series created successfully",
        series: createdSeries,
        couponsCreated: totalCoupons,
      });
    } catch (error) {
      console.error("❌ Erreur dans POST /api/coupon-series:", error);
      console.error("❌ Stack trace:", error.stack);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/coupon-series/:id/status - Changer le statut d'une série
router.patch(
  "/:id/status",
  authorize(["admin"]),
  [
    body("status")
      .isIn(["active", "expired", "suspended", "completed"])
      .withMessage("Invalid status"),
    body("reason").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { status, reason } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid series ID" });
      }

      const series = await CouponSeries.findById(id);
      if (!series) {
        return res.status(404).json({ error: "Coupon series not found" });
      }

      const oldStatus = series.status;
      series.status = status;

      // Ajouter une note sur le changement de statut
      if (reason) {
        const statusNote = `[${new Date().toISOString()}] Status changed from ${oldStatus} to ${status}: ${reason}`;
        series.notes = series.notes
          ? `${series.notes}\n\n${statusNote}`
          : statusNote;
      }

      await series.save();

      // Si la série est suspendue, marquer tous les coupons disponibles comme suspendus
      if (status === "suspended") {
        await Coupon.updateMany(
          { series: id, status: "available" },
          { status: "expired" }
        );
      }

      res.json({
        message: `Series status changed to ${status}`,
        series: await CouponSeries.findById(id)
          .populate("family", "name")
          .populate("student", "firstName lastName"),
      });
    } catch (error) {
      console.error("Update series status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/coupon-series/stats - Statistiques globales des coupons
router.get("/stats/overview", authorize(["admin"]), async (req, res) => {
  try {
    const [
      totalSeries,
      seriesByStatus,
      totalRevenue,
      totalCoupons,
      usedCoupons,
      expiringSeriesSoon,
    ] = await Promise.all([
      CouponSeries.countDocuments(),
      CouponSeries.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),
      CouponSeries.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      CouponSeries.aggregate([
        { $group: { _id: null, total: { $sum: "$totalCoupons" } } },
      ]),
      CouponSeries.aggregate([
        { $group: { _id: null, total: { $sum: "$usedCoupons" } } },
      ]),
      CouponSeries.find({
        status: "active",
        expirationDate: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }, // 30 jours
      })
        .populate("family", "name contact.email")
        .populate("student", "firstName lastName")
        .select("family student subject expirationDate remainingCoupons")
        .lean(),
    ]);

    const remainingCoupons =
      totalCoupons[0]?.total - usedCoupons[0]?.total || 0;
    const usageRate =
      totalCoupons[0]?.total > 0
        ? ((usedCoupons[0]?.total / totalCoupons[0]?.total) * 100).toFixed(1)
        : 0;

    res.json({
      stats: {
        totalSeries,
        seriesByStatus,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCoupons: totalCoupons[0]?.total || 0,
        usedCoupons: usedCoupons[0]?.total || 0,
        remainingCoupons,
        usageRate: parseFloat(usageRate),
        expiringSeriesSoon: expiringSeriesSoon.length,
      },
      expiringSeriesSoon,
    });
  } catch (error) {
    console.error("Get coupon series stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/coupon-series/:id - Supprimer une série de coupons
router.delete("/:id", authorize(["admin"]), async (req, res) => {
  try {
    console.log("🔍 DELETE /api/coupon-series/:id - Début de la requête");
    console.log("🔍 ID de la série à supprimer:", req.params.id);

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid series ID" });
    }

    // Vérifier que la série existe
    const series = await CouponSeries.findById(id);
    if (!series) {
      return res.status(404).json({ error: "Coupon series not found" });
    }

    console.log("🔍 Série trouvée:", {
      id: series._id,
      family: series.family,
      student: series.student,
      totalCoupons: series.totalCoupons,
      usedCoupons: series.usedCoupons,
    });

    // Vérifier si des coupons ont été utilisés
    if (series.usedCoupons > 0) {
      return res.status(400).json({
        error:
          "Cannot delete series with used coupons. Please refund used coupons first.",
      });
    }

    // Supprimer tous les coupons de cette série
    console.log("🔍 Suppression des coupons de la série...");
    const deleteCouponsResult = await Coupon.deleteMany({ series: id });
    console.log("🔍 Coupons supprimés:", deleteCouponsResult.deletedCount);

    // Supprimer la série
    console.log("🔍 Suppression de la série...");
    await CouponSeries.findByIdAndDelete(id);
    console.log("🔍 Série supprimée avec succès");

    res.json({
      message: "Coupon series deleted successfully",
      deletedCoupons: deleteCouponsResult.deletedCount,
    });
  } catch (error) {
    console.error("❌ Erreur dans DELETE /api/coupon-series/:id:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
