const express = require("express");
const { body, query, validationResult } = require("express-validator");
const Coupon = require("../models/Coupon");
const CouponSeries = require("../models/CouponSeries");
const { authenticateToken, authorize } = require("../middleware/auth");
const {
  isValidObjectId,
  buildPaginationQuery,
  buildPaginatedResponse,
} = require("../utils/dbHelpers");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Validation pour marquer un coupon comme utilisé
const useCouponValidation = [
  body("sessionDate").isISO8601().withMessage("Valid session date required"),
  body("sessionDuration")
    .isInt({ min: 30, max: 180 })
    .withMessage("Session duration must be between 30 and 180 minutes"),
  body("sessionLocation")
    .isIn(["home", "professor", "online"])
    .withMessage("Valid session location required"),
  body("notes").optional().trim(),
];

// GET /api/coupons - Liste des coupons avec filtres
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("series").optional().isMongoId(),
    query("status")
      .optional()
      .isIn(["available", "used", "expired", "cancelled"]),
    query("usedBy").optional().isMongoId(),
    query("sessionDateFrom").optional().isISO8601(),
    query("sessionDateTo").optional().isISO8601(),
    query("sortBy")
      .optional()
      .isIn(["couponNumber", "usedDate", "sessionDate"]),
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
        series,
        status,
        usedBy,
        sessionDateFrom,
        sessionDateTo,
        sortBy = "couponNumber",
        sortOrder = "asc",
      } = req.query;

      // Construction du filtre
      let filter = {};

      if (series && isValidObjectId(series)) filter.series = series;
      if (status) filter.status = status;
      if (usedBy && isValidObjectId(usedBy)) filter.usedBy = usedBy;

      // Filtre par date de session
      if (sessionDateFrom || sessionDateTo) {
        filter.sessionDate = {};
        if (sessionDateFrom)
          filter.sessionDate.$gte = new Date(sessionDateFrom);
        if (sessionDateTo) filter.sessionDate.$lte = new Date(sessionDateTo);
      }

      // Pagination et tri
      const { skip, limit: pageLimit } = buildPaginationQuery(page, limit);
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      // Exécution des requêtes
      const [coupons, total] = await Promise.all([
        Coupon.find(filter)
          .populate({
            path: "series",
            populate: [
              { path: "family", select: "familyName" },
              { path: "student", select: "firstName lastName" },
              {
                path: "professor",
                select: "personalInfo.firstName personalInfo.lastName",
              },
            ],
          })
          .populate("usedBy", "firstName lastName")
          .sort(sort)
          .skip(skip)
          .limit(pageLimit)
          .lean(),
        Coupon.countDocuments(filter),
      ]);

      const response = buildPaginatedResponse(coupons, total, page, pageLimit);
      res.json(response);
    } catch (error) {
      console.error("Get coupons error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/coupons/:id - Détails d'un coupon
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id)
      .populate({
        path: "series",
        populate: [
          { path: "family", select: "familyName contact address" },
          { path: "student", select: "firstName lastName schoolLevel" },
          { path: "professor", select: "personalInfo professional.subjects" },
        ],
      })
      .populate("usedBy", "firstName lastName email")
      .lean();

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.json({ coupon });
  } catch (error) {
    console.error("Get coupon details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coupons/:id/use - Marquer un coupon comme utilisé
router.post("/:id/use", useCouponValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { sessionDate, sessionDuration, sessionLocation, notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id).populate("series");
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    // Vérifications de sécurité
    if (coupon.status !== "available") {
      return res.status(400).json({ error: "Coupon is not available for use" });
    }

    if (coupon.series.status !== "active") {
      return res.status(400).json({ error: "Coupon series is not active" });
    }

    if (new Date() > coupon.series.expirationDate) {
      return res.status(400).json({ error: "Coupon series has expired" });
    }

    // Vérification des permissions - seul le professeur assigné ou un admin peut valider
    const isAssignedProfessor =
      req.user.role === "professor" &&
      coupon.series.professor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAssignedProfessor && !isAdmin) {
      return res.status(403).json({
        error: "Only the assigned professor or admin can validate this coupon",
      });
    }

    // Marquer le coupon comme utilisé
    const sessionData = {
      sessionDate: new Date(sessionDate),
      sessionDuration,
      sessionLocation,
      notes,
    };

    await coupon.markAsUsed(sessionData, req.user._id);

    // Récupérer le coupon mis à jour avec toutes les relations
    const updatedCoupon = await Coupon.findById(id)
      .populate({
        path: "series",
        populate: [
          { path: "family", select: "familyName" },
          { path: "student", select: "firstName lastName" },
        ],
      })
      .populate("usedBy", "firstName lastName");

    res.json({
      message: "Coupon marked as used successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Use coupon error:", error);
    if (
      error.message.includes("not available") ||
      error.message.includes("expired")
    ) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coupons/:id/cancel-usage - Annuler l'utilisation d'un coupon
router.post(
  "/:id/cancel-usage",
  authorize(["admin"]),
  [
    body("reason")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Reason must be at least 5 characters"),
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
      const { reason } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid coupon ID" });
      }

      const coupon = await Coupon.findById(id);
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      if (coupon.status !== "used") {
        return res.status(400).json({ error: "Coupon is not marked as used" });
      }

      // Sauvegarder l'ancien état pour l'historique
      const oldUsageData = {
        usedDate: coupon.usedDate,
        sessionDate: coupon.sessionDate,
        sessionDuration: coupon.sessionDuration,
        sessionLocation: coupon.sessionLocation,
        usedBy: coupon.usedBy,
      };

      // Annuler l'utilisation
      await coupon.cancelUsage();

      // Ajouter une note d'annulation
      const cancellationNote = `[${new Date().toISOString()}] Usage cancelled by ${
        req.user.firstName
      } ${
        req.user.lastName
      }. Reason: ${reason}. Previous usage: ${JSON.stringify(oldUsageData)}`;
      coupon.notes = coupon.notes
        ? `${coupon.notes}\n\n${cancellationNote}`
        : cancellationNote;
      await coupon.save();

      res.json({
        message: "Coupon usage cancelled successfully",
        coupon: await Coupon.findById(id).populate(
          "series",
          "family student subject"
        ),
      });
    } catch (error) {
      console.error("Cancel coupon usage error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/coupons/:id/rating - Ajouter une évaluation au coupon
router.patch(
  "/:id/rating",
  [
    body("ratingType")
      .isIn(["student", "professor"])
      .withMessage("Rating type must be student or professor"),
    body("score")
      .isInt({ min: 1, max: 5 })
      .withMessage("Score must be between 1 and 5"),
    body("comment")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Comment must be less than 500 characters"),
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
      const { ratingType, score, comment } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid coupon ID" });
      }

      const coupon = await Coupon.findById(id).populate("series");
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      if (coupon.status !== "used") {
        return res.status(400).json({ error: "Can only rate used coupons" });
      }

      // Vérifications des permissions
      const isAssignedProfessor =
        req.user.role === "professor" &&
        coupon.series.professor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (ratingType === "professor" && !isAssignedProfessor && !isAdmin) {
        return res.status(403).json({
          error: "Only the assigned professor can give professor rating",
        });
      }

      // Pour les évaluations d'étudiants, on peut imaginer un système où la famille peut évaluer
      // ou que l'admin peut le faire au nom de la famille

      // Ajouter l'évaluation
      if (!coupon.rating) {
        coupon.rating = {};
      }

      coupon.rating[ratingType] = {
        score,
        comment: comment || "",
        ratedBy: req.user._id,
        ratedAt: new Date(),
      };

      await coupon.save();

      res.json({
        message: `${ratingType} rating added successfully`,
        coupon: await Coupon.findById(id)
          .populate("series", "family student subject")
          .populate("usedBy", "firstName lastName"),
      });
    } catch (error) {
      console.error("Add rating error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/coupons/available/by-series/:seriesId - Coupons disponibles d'une série
router.get("/available/by-series/:seriesId", async (req, res) => {
  try {
    const { seriesId } = req.params;

    if (!isValidObjectId(seriesId)) {
      return res.status(400).json({ error: "Invalid series ID" });
    }

    // Vérifier que la série existe et est active
    const series = await CouponSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ error: "Coupon series not found" });
    }

    if (series.status !== "active") {
      return res.status(400).json({ error: "Series is not active" });
    }

    // Récupérer les coupons disponibles
    const availableCoupons = await Coupon.find({
      series: seriesId,
      status: "available",
    })
      .sort({ couponNumber: 1 })
      .lean();

    res.json({
      series: {
        _id: series._id,
        subject: series.subject,
        totalCoupons: series.totalCoupons,
        usedCoupons: series.usedCoupons,
        remainingCoupons: series.totalCoupons - series.usedCoupons,
        expirationDate: series.expirationDate,
        isExpired: new Date() > series.expirationDate,
      },
      availableCoupons,
      count: availableCoupons.length,
    });
  } catch (error) {
    console.error("Get available coupons error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coupons/usage-history/:professorId - Historique d'utilisation par professeur
router.get("/usage-history/:professorId", async (req, res) => {
  try {
    const { professorId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    if (!isValidObjectId(professorId)) {
      return res.status(400).json({ error: "Invalid professor ID" });
    }

    // Vérification des permissions - un professeur ne peut voir que son historique
    if (
      req.user.role === "professor" &&
      req.user._id.toString() !== professorId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Construction du filtre
    let filter = {
      usedBy: professorId,
      status: "used",
    };

    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }

    // Pagination
    const { skip, limit: pageLimit } = buildPaginationQuery(page, limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .populate({
          path: "series",
          populate: [
            { path: "family", select: "familyName" },
            { path: "student", select: "firstName lastName" },
          ],
        })
        .sort({ sessionDate: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    // Calculer les statistiques
    const stats = {
      totalSessions: total,
      totalHours:
        coupons.reduce((sum, c) => sum + (c.sessionDuration || 0), 0) / 60,
      averageSessionDuration:
        coupons.length > 0
          ? coupons.reduce((sum, c) => sum + (c.sessionDuration || 0), 0) /
            coupons.length
          : 0,
      subjectsCount: [...new Set(coupons.map((c) => c.series.subject))].length,
    };

    const response = buildPaginatedResponse(coupons, total, page, pageLimit);
    res.json({
      ...response,
      stats,
    });
  } catch (error) {
    console.error("Get usage history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
