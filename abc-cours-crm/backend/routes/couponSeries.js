const express = require("express");
const { body, query, validationResult } = require("express-validator");
const CouponSeries = require("../models/CouponSeries");
const Coupon = require("../models/Coupon");
const Family = require("../models/Family");
const Student = require("../models/Student");
const Professor = require("../models/Professor");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  isValidObjectId,
  buildPaginationQuery,
  buildPaginatedResponse,
} = require("../utils/dbHelpers");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Validation pour créer une série de coupons
const createSeriesValidation = [
  body("family").isMongoId().withMessage("Valid family ID required"),
  body("student").isMongoId().withMessage("Valid student ID required"),
  body("professor").isMongoId().withMessage("Valid professor ID required"),
  body("subject")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Subject must be at least 2 characters"),
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
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

      // Construction du filtre
      let filter = {};

      if (family && isValidObjectId(family)) filter.family = family;
      if (student && isValidObjectId(student)) filter.student = student;
      if (professor && isValidObjectId(professor)) filter.professor = professor;
      if (subject) filter.subject = new RegExp(subject, "i");
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;

      // Pagination et tri
      const { skip, limit: pageLimit } = buildPaginationQuery(page, limit);
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      // Exécution des requêtes
      const [series, total] = await Promise.all([
        CouponSeries.find(filter)
          .populate("family", "familyName contact.email")
          .populate("student", "firstName lastName")
          .populate(
            "professor",
            "personalInfo.firstName personalInfo.lastName personalInfo.email"
          )
          .populate("createdBy", "firstName lastName")
          .sort(sort)
          .skip(skip)
          .limit(pageLimit)
          .lean(),
        CouponSeries.countDocuments(filter),
      ]);

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
      res.json(response);
    } catch (error) {
      console.error("Get coupon series error:", error);
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
      .populate("family", "familyName contact address")
      .populate("student", "firstName lastName schoolLevel subjects")
      .populate("professor", "personalInfo professional.subjects")
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
  requireRole(["admin"]),
  createSeriesValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
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
      } = req.body;

      // Vérifications des entités liées
      const [familyExists, studentExists, professorExists] = await Promise.all([
        Family.findById(family),
        Student.findById(student),
        Professor.findById(professor),
      ]);

      if (!familyExists)
        return res.status(400).json({ error: "Family not found" });
      if (!studentExists)
        return res.status(400).json({ error: "Student not found" });
      if (!professorExists)
        return res.status(400).json({ error: "Professor not found" });

      // Vérifier que l'élève appartient à la famille
      if (studentExists.family.toString() !== family) {
        return res
          .status(400)
          .json({ error: "Student does not belong to this family" });
      }

      // Vérifier que le professeur enseigne cette matière
      const teachesSubject = professorExists.professional.subjects.some(
        (s) => s.name.toLowerCase() === subject.toLowerCase()
      );
      if (!teachesSubject) {
        return res
          .status(400)
          .json({ error: "Professor does not teach this subject" });
      }

      // Calculer la date d'expiration
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + expirationMonths);

      // Créer la série de coupons
      const series = new CouponSeries({
        family,
        student,
        subject,
        professor,
        totalCoupons,
        hourlyRate,
        expirationDate,
        notes,
        createdBy: req.user._id,
      });

      await series.save();

      // Créer les coupons individuels
      const coupons = [];
      for (let i = 1; i <= totalCoupons; i++) {
        coupons.push({
          series: series._id,
          couponNumber: i,
          status: "available",
        });
      }

      await Coupon.insertMany(coupons);

      // Retourner la série créée avec tous les détails
      const createdSeries = await CouponSeries.findById(series._id)
        .populate("family", "familyName contact.email")
        .populate("student", "firstName lastName")
        .populate("professor", "personalInfo.firstName personalInfo.lastName")
        .populate("createdBy", "firstName lastName");

      res.status(201).json({
        message: "Coupon series created successfully",
        series: createdSeries,
        couponsCreated: totalCoupons,
      });
    } catch (error) {
      console.error("Create coupon series error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/coupon-series/:id/status - Changer le statut d'une série
router.patch(
  "/:id/status",
  requireRole(["admin"]),
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
          .populate("family", "familyName")
          .populate("student", "firstName lastName"),
      });
    } catch (error) {
      console.error("Update series status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/coupon-series/stats - Statistiques globales des coupons
router.get("/stats/overview", requireRole(["admin"]), async (req, res) => {
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
        .populate("family", "familyName contact.email")
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

module.exports = router;
