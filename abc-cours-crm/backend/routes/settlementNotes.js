const express = require("express");
const { body, query, validationResult } = require("express-validator");
const SettlementNote = require("../models/SettlementNote");
const Subject = require("../models/Subject");
const { authenticateToken, authorize } = require("../middleware/auth");
const {
  isValidObjectId,
  buildPaginationQuery,
  buildPaginatedResponse,
} = require("../utils/dbHelpers");
const CouponGenerationService = require("../services/couponGenerationService");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Validation pour créer une note de règlement
const createSettlementValidation = [
  body("familyId").isMongoId().withMessage("ID de famille requis"),
  body("clientName").trim().notEmpty().withMessage("Nom du client requis"),
  body("department").trim().notEmpty().withMessage("Département requis"),
  body("paymentMethod")
    .isIn(["card", "check", "transfer", "cash"])
    .withMessage("Mode de règlement invalide"),
  body("subjectId").isMongoId().withMessage("ID de matière invalide"),
  body("hourlyRate")
    .isFloat({ min: 0 })
    .withMessage("Tarif horaire doit être positif"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantité doit être au moins 1"),
  body("professorSalary")
    .isFloat({ min: 0 })
    .withMessage("Salaire du professeur doit être positif"),
  body("charges")
    .isFloat({ min: 0 })
    .withMessage("Charges doivent être positives"),
  body("dueDate").isISO8601().withMessage("Date d'échéance invalide"),
  body("notes").optional().trim(),
];

// GET /api/settlement-notes - Liste des notes de règlement
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("clientName").optional().trim(),
    query("department").optional().trim(),
    query("status").optional().isIn(["pending", "paid", "overdue"]),
    query("paymentMethod")
      .optional()
      .isIn(["card", "check", "transfer", "cash"]),
    query("sortBy")
      .optional()
      .isIn(["clientName", "dueDate", "createdAt", "marginAmount", "status"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  async (req, res) => {
    try {
      console.log("🔍 GET /api/settlement-notes - Début de la requête");
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
        clientName,
        department,
        status,
        paymentMethod,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      console.log("🔍 Paramètres traités:", {
        page,
        limit,
        clientName,
        department,
        status,
        paymentMethod,
        sortBy,
        sortOrder,
      });

      // Construction du filtre
      let filter = {};

      if (clientName) {
        filter.clientName = new RegExp(clientName, "i");
      }
      if (department) {
        filter.department = new RegExp(department, "i");
      }
      if (status) filter.status = status;
      if (paymentMethod) filter.paymentMethod = paymentMethod;

      console.log("🔍 Filtre construit:", filter);

      // Pagination et tri
      const { skip, limit: pageLimit } = buildPaginationQuery(page, limit);
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      console.log("🔍 Pagination:", { skip, pageLimit });
      console.log("🔍 Tri:", sort);

      // Exécution des requêtes
      console.log("🔍 Exécution de la requête MongoDB...");
      const [notes, total] = await Promise.all([
        SettlementNote.find(filter)
          .populate("subject", "name category")
          .populate("createdBy", "firstName lastName")
          .sort(sort)
          .skip(skip)
          .limit(pageLimit)
          .lean(),
        SettlementNote.countDocuments(filter),
      ]);

      console.log("🔍 Résultats:", { notesCount: notes.length, total });

      const response = buildPaginatedResponse(notes, total, page, pageLimit);

      console.log("🔍 Réponse envoyée avec succès");
      res.json(response);
    } catch (error) {
      console.error("❌ Erreur dans GET /api/settlement-notes:", error);
      console.error("❌ Stack trace:", error.stack);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/settlement-notes/:id - Détails d'une note de règlement
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    const note = await SettlementNote.findById(id)
      .populate("subject", "name category description")
      .populate("createdBy", "firstName lastName")
      .lean();

    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Get settlement note details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/settlement-notes - Créer une nouvelle note de règlement
router.post(
  "/",
  authorize(["admin"]),
  createSettlementValidation,
  async (req, res) => {
    try {
      console.log("🔍 POST /api/settlement-notes - Début de la requête");
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
        familyId,
        clientName,
        department,
        paymentMethod,
        subjectId,
        hourlyRate,
        quantity,
        professorSalary,
        charges,
        dueDate,
        notes,
      } = req.body;

      console.log("🔍 Paramètres extraits:", {
        familyId,
        clientName,
        department,
        paymentMethod,
        subjectId,
        hourlyRate,
        quantity,
        professorSalary,
        charges,
        dueDate,
      });

      // Vérifier que la matière existe
      const subjectExists = await Subject.findById(subjectId);
      if (!subjectExists) {
        return res.status(400).json({ error: "Subject not found" });
      }

      // Créer la note de règlement
      const settlementNote = new SettlementNote({
        familyId,
        clientName,
        department,
        paymentMethod,
        subject: subjectId,
        hourlyRate,
        quantity,
        professorSalary,
        charges,
        dueDate: new Date(dueDate),
        notes,
        createdBy: req.user.id,
      });

      await settlementNote.save();

      // Générer automatiquement la série de coupons
      console.log("🎫 Génération automatique des coupons...");
      const couponGenerationResult =
        await CouponGenerationService.generateCouponSeries(
          settlementNote,
          req.user.id
        );

      // Mettre à jour la note de règlement avec l'ID de la série de coupons
      settlementNote.couponSeriesId = couponGenerationResult.couponSeries._id;
      settlementNote.totalCoupons = couponGenerationResult.totalCoupons;
      await settlementNote.save();

      // Récupérer la note avec les données populées
      const populatedNote = await SettlementNote.findById(settlementNote._id)
        .populate("subject", "name category")
        .populate("createdBy", "firstName lastName")
        .populate("couponSeriesId", "totalCoupons usedCoupons status")
        .lean();

      console.log("🔍 Note de règlement créée avec succès:", populatedNote);
      console.log(
        "🎫 Série de coupons générée:",
        couponGenerationResult.totalCoupons,
        "coupons"
      );

      res.status(201).json({
        message:
          "Note de règlement créée avec succès avec génération automatique des coupons",
        settlementNote: populatedNote,
        couponSeries: {
          id: couponGenerationResult.couponSeries._id,
          totalCoupons: couponGenerationResult.totalCoupons,
          status: "active",
        },
      });
    } catch (error) {
      console.error("❌ Erreur dans POST /api/settlement-notes:", error);
      console.error("❌ Stack trace:", error.stack);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/settlement-notes/:id - Mettre à jour une note de règlement
router.put(
  "/:id",
  authorize(["admin"]),
  createSettlementValidation,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid settlement note ID" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        familyId,
        clientName,
        department,
        paymentMethod,
        subjectId,
        hourlyRate,
        quantity,
        professorSalary,
        charges,
        dueDate,
        notes,
      } = req.body;

      // Vérifier que la note existe
      const existingNote = await SettlementNote.findById(id);
      if (!existingNote) {
        return res.status(404).json({ error: "Settlement note not found" });
      }

      // Vérifier que la matière existe
      if (subjectId) {
        const subjectExists = await Subject.findById(subjectId);
        if (!subjectExists) {
          return res.status(400).json({ error: "Subject not found" });
        }
      }

      // Mettre à jour la note
      const updatedNote = await SettlementNote.findByIdAndUpdate(
        id,
        {
          familyId,
          clientName,
          department,
          paymentMethod,
          subject: subjectId,
          hourlyRate,
          quantity,
          professorSalary,
          charges,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes,
        },
        { new: true, runValidators: true }
      )
        .populate("subject", "name category")
        .populate("createdBy", "firstName lastName")
        .lean();

      res.json(updatedNote);
    } catch (error) {
      console.error("Update settlement note error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/settlement-notes/:id - Supprimer une note de règlement
router.delete("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    const note = await SettlementNote.findByIdAndDelete(id);
    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    res.json({ message: "Settlement note deleted successfully" });
  } catch (error) {
    console.error("Delete settlement note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/settlement-notes/:id/mark-paid - Marquer comme payé
router.patch("/:id/mark-paid", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    const note = await SettlementNote.findById(id);
    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    await note.markAsPaid();

    const updatedNote = await SettlementNote.findById(id)
      .populate("subject", "name category")
      .populate("createdBy", "firstName lastName")
      .lean();

    res.json(updatedNote);
  } catch (error) {
    console.error("Mark as paid error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/settlement-notes - Récupérer toutes les notes de règlement
router.get("/", authorize(["admin"]), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      clientName,
      department,
      familyId,
    } = req.query;

    // Construire le filtre
    const filter = {};
    if (status) filter.status = status;
    if (clientName) filter.clientName = { $regex: clientName, $options: "i" };
    if (department) filter.department = { $regex: department, $options: "i" };
    if (familyId) filter.familyId = familyId;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notes, total] = await Promise.all([
      SettlementNote.find(filter)
        .populate("subject", "name category")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SettlementNote.countDocuments(filter),
    ]);

    res.json({
      notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get settlement notes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/settlement-notes/stats - Statistiques des notes de règlement
router.get("/stats", async (req, res) => {
  try {
    const [
      total,
      pending,
      paid,
      overdue,
      totalAmount,
      totalPaid,
      totalPending,
      totalOverdue,
    ] = await Promise.all([
      SettlementNote.countDocuments(),
      SettlementNote.countDocuments({ status: "pending" }),
      SettlementNote.countDocuments({ status: "paid" }),
      SettlementNote.countDocuments({ status: "overdue" }),
      SettlementNote.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$hourlyRate", "$quantity"] } },
          },
        },
      ]),
      SettlementNote.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$hourlyRate", "$quantity"] } },
          },
        },
      ]),
      SettlementNote.aggregate([
        { $match: { status: "pending" } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$hourlyRate", "$quantity"] } },
          },
        },
      ]),
      SettlementNote.aggregate([
        { $match: { status: "overdue" } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$hourlyRate", "$quantity"] } },
          },
        },
      ]),
    ]);

    const stats = {
      total,
      pending,
      paid,
      overdue,
      totalAmount: totalAmount[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
      totalPending: totalPending[0]?.total || 0,
      totalOverdue: totalOverdue[0]?.total || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Get settlement stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/settlement-notes/:id - Récupérer une note de règlement spécifique
router.get("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    const note = await SettlementNote.findById(id)
      .populate("subject", "name category")
      .populate("createdBy", "firstName lastName")
      .populate("couponSeriesId", "totalCoupons usedCoupons status")
      .lean();

    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Get settlement note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/settlement-notes/:id/coupons - Récupérer les détails des coupons d'une NDR
router.get("/:id/coupons", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    // Récupérer la série de coupons avec tous les détails
    const couponSeries =
      await CouponGenerationService.getCouponSeriesBySettlementNote(id);

    res.json({
      settlementNoteId: id,
      couponSeries,
      stats: await CouponGenerationService.getCouponSeriesStats(
        couponSeries._id
      ),
    });
  } catch (error) {
    console.error(
      "❌ Erreur dans GET /api/settlement-notes/:id/coupons:",
      error
    );
    if (error.message.includes("Aucune série de coupons trouvée")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coupons/search/:code - Rechercher un coupon par son code
router.get("/coupons/search/:code", async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Code de coupon requis" });
    }

    const coupon = await CouponGenerationService.findCouponByCode(
      code.trim().toUpperCase()
    );

    res.json({
      coupon,
      message: "Coupon trouvé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur dans la recherche de coupon:", error);

    if (error.message.includes("Coupon non trouvé")) {
      return res.status(404).json({ error: "Coupon non trouvé" });
    }

    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
