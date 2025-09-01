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
  body("studentIds")
    .isArray()
    .withMessage("studentIds doit être un tableau")
    .custom((value) => {
      // Autoriser tableau vide pour NDR famille seule
      return true;
    })
    .withMessage("Format studentIds invalide"),
  body("studentIds.*").isMongoId().withMessage("ID d'élève invalide"),
  body("clientName").trim().notEmpty().withMessage("Nom du client requis"),
  body("department").trim().notEmpty().withMessage("Département requis"),
  body("paymentMethod")
    .isIn(["card", "CESU", "check", "transfer", "cash", "PRLV"])
    .withMessage("Mode de règlement invalide"),
  body("paymentType")
    .notEmpty()
    .isIn(["immediate_advance", "tax_credit_n1"])
    .withMessage("Type de paiement requis (immediate_advance ou tax_credit_n1)"),
  body("subjects")
    .isArray({ min: 1 })
    .withMessage("Au moins une matière requise"),
  body("subjects.*.subjectId").isMongoId().withMessage("ID de matière invalide"),
  body("subjects.*.hourlyRate")
    .isFloat({ min: 0 })
    .withMessage("Tarif horaire doit être positif"),
  body("subjects.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantité doit être au moins 1"),
  body("subjects.*.professorSalary")
    .isFloat({ min: 0 })
    .withMessage("Salaire du professeur doit être positif"),
  body("charges")
    .isFloat({ min: 0 })
    .withMessage("Charges doivent être positives"),
  // Validation conditionnelle pour l'échéancier
  body("paymentSchedule").optional().isObject(),
  body("paymentSchedule.paymentMethod")
    .optional()
    .isIn(["PRLV", "check"])
    .withMessage("Mode de règlement de l'échéancier invalide"),
  body("paymentSchedule.numberOfInstallments")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Nombre d'échéances doit être entre 1 et 12"),
  body("paymentSchedule.dayOfMonth")
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage("Jour du mois doit être entre 1 et 31"),
  body("notes").optional().trim(),
];

// GET /api/settlement-notes - Liste des notes de règlement
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("familyId").optional().isMongoId(),
    query("clientName").optional().trim(),
    query("department").optional().trim(),
    query("status").optional().isIn(["pending", "paid", "overdue"]),
    query("paymentMethod")
      .optional()
      .isIn(["card", "CESU", "check", "transfer", "cash"]),
    query("sortBy")
      .optional()
      .isIn(["clientName", "createdAt", "marginAmount", "status"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  async (req, res) => {
    try {
      console.log("🔍 GET /api/settlement-notes - Début de la requête");
      console.log("🔍 Utilisateur:", req.user);
      console.log("🔍 Query params:", req.query);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Erreurs de validation:", errors.array());
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 10,
        familyId,
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
        familyId,
        clientName,
        department,
        status,
        paymentMethod,
        sortBy,
        sortOrder,
      });

      // Construction du filtre
      let filter = {};

      if (familyId) {
        filter.familyId = familyId;
      }
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
          .populate("subjects.subjectId", "name category")
          .populate("createdBy", "firstName lastName")
          .populate("familyId", "address.postalCode")
          .populate("studentIds", "firstName lastName")
          .sort(sort)
          .skip(skip)
          .limit(pageLimit)
          .lean(),
        SettlementNote.countDocuments(filter),
      ]);

      console.log("🔍 Résultats:", { notesCount: notes.length, total });

      // Fonction pour extraire le département depuis le code postal
      const extractDepartmentFromPostalCode = (postalCode) => {
        if (!postalCode || typeof postalCode !== 'string') return "";
        
        const cleanPostalCode = postalCode.trim();
        if (cleanPostalCode.length < 2) return "";
        
        // Si le code postal commence par 97 (DOM-TOM), prendre les 3 premiers chiffres
        if (cleanPostalCode.startsWith("97") && cleanPostalCode.length >= 3) {
          return cleanPostalCode.substring(0, 3);
        }
        
        // Sinon, prendre les 2 premiers chiffres (métropole)
        return cleanPostalCode.substring(0, 2);
      };

      // Enrichir les notes avec le département extrait du code postal
      const enrichedNotes = notes.map(note => {
        const extractedDepartment = note.familyId?.address?.postalCode 
          ? extractDepartmentFromPostalCode(note.familyId.address.postalCode)
          : "";
        
        return {
          ...note,
          extractedDepartment, // Nouveau champ avec le département extrait
          // Mettre à jour le département existant avec le département extrait s'il est vide
          department: note.department || extractedDepartment
        };
      });

      const response = buildPaginatedResponse(enrichedNotes, total, page, pageLimit);

      console.log("🔍 Réponse envoyée avec succès");
      res.json({
        notes: response.data, // Champ 'notes' attendu par le frontend
        pagination: response.pagination, // Pagination inchangée
      });
    } catch (error) {
      console.error("Erreur dans GET /api/settlement-notes:", error);
      console.error("Stack trace:", error.stack);
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
      .populate("subjects.subjectId", "name category description")
      .populate("createdBy", "firstName lastName")
      .populate("familyId", "address.postalCode")
      .populate("studentIds", "firstName lastName")
      .lean();

    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    // Fonction pour extraire le département depuis le code postal
    const extractDepartmentFromPostalCode = (postalCode) => {
      if (!postalCode || typeof postalCode !== 'string') return "";
      
      const cleanPostalCode = postalCode.trim();
      if (cleanPostalCode.length < 2) return "";
      
      // Si le code postal commence par 97 (DOM-TOM), prendre les 3 premiers chiffres
      if (cleanPostalCode.startsWith("97") && cleanPostalCode.length >= 3) {
        return cleanPostalCode.substring(0, 3);
      }
      
      // Sinon, prendre les 2 premiers chiffres (métropole)
      return cleanPostalCode.substring(0, 2);
    };

    // Enrichir la note avec le département extrait du code postal
    const extractedDepartment = note.familyId?.address?.postalCode 
      ? extractDepartmentFromPostalCode(note.familyId.address.postalCode)
      : "";
    
    const enrichedNote = {
      ...note,
      extractedDepartment, // Nouveau champ avec le département extrait
      // Mettre à jour le département existant avec le département extrait s'il est vide
      department: note.department || extractedDepartment
    };

    res.json(enrichedNote);
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
      console.log("🔍 Données reçues:", {
        ...req.body,
        paymentScheduleType: typeof req.body.paymentSchedule,
        hasPaymentSchedule: 'paymentSchedule' in req.body,
        paymentScheduleValue: req.body.paymentSchedule
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Erreurs de validation:", errors.array());
        console.log("❌ Structure paymentSchedule reçue:", {
          type: typeof req.body.paymentSchedule,
          value: req.body.paymentSchedule,
          isPresent: 'paymentSchedule' in req.body
        });
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        familyId,
        studentIds,
        clientName,
        department,
        paymentMethod,
        subjects,
        charges,
        paymentSchedule,
        notes,
      } = req.body;

      console.log("🔍 Paramètres extraits:", {
        familyId,
        studentIds,
        clientName,
        department,
        paymentMethod,
        subjects,
        charges,
        paymentSchedule,
      });

      // Vérifier que toutes les matières existent
      const subjectIds = subjects.map(s => s.subjectId);
      const existingSubjects = await Subject.find({ _id: { $in: subjectIds } });
      if (existingSubjects.length !== subjectIds.length) {
        return res.status(400).json({ error: "Une ou plusieurs matières introuvables" });
      }

      // Créer la note de règlement
      const settlementNoteData = {
        familyId,
        studentIds, // Tableau d'élèves
        clientName,
        department,
        paymentMethod,
        subjects, // Tableau de matières avec détails
        charges,
        notes,
        createdBy: req.user.id,
      };

      // Ajouter l'échéancier si fourni
      if (paymentSchedule && paymentSchedule.paymentMethod) {
        settlementNoteData.paymentSchedule = {
          paymentMethod: paymentSchedule.paymentMethod,
          numberOfInstallments: paymentSchedule.numberOfInstallments,
          dayOfMonth: paymentSchedule.dayOfMonth,
          installments: [] // Les échéances seront générées plus tard si nécessaire
        };
      }

      const settlementNote = new SettlementNote(settlementNoteData);

      await settlementNote.save();

      // Mettre à jour la famille avec l'ID de la note de règlement
      const Family = require("../models/Family");
      await Family.findByIdAndUpdate(familyId, {
        $push: { settlementNotes: settlementNote._id },
      });

      // RELATION BIDIRECTIONNELLE : Mettre à jour chaque élève avec l'ID de la note de règlement
      const Student = require("../models/Student");
      if (studentIds && studentIds.length > 0) {
        await Student.updateMany(
          { _id: { $in: studentIds } },
          { $push: { settlementNoteIds: settlementNote._id } }
        );
        console.log(`✅ Relation bidirectionnelle établie pour ${studentIds.length} élèves`);
      }

      // Changer automatiquement le statut de "prospect" à "client" si c'est la première note de règlement
      const family = await Family.findById(familyId);
      if (family && family.status === "prospect") {
        await Family.findByIdAndUpdate(familyId, { status: "client" });
        console.log(
          "Statut de la famille changé automatiquement de 'prospect' à 'client'"
        );
      }

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
        .populate("subjects.subjectId", "name category")
        .populate("createdBy", "firstName lastName")
        .populate("studentIds", "firstName lastName")
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
      console.error("Erreur dans POST /api/settlement-notes:", error);
      console.error("Stack trace:", error.stack);
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
        paymentSchedule,
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
      const updateData = {
        familyId,
        clientName,
        department,
        paymentMethod,
        subject: subjectId,
        hourlyRate,
        quantity,
        professorSalary,
        charges,
        notes,
      };

      // Ajouter l'échéancier si fourni
      if (paymentSchedule && paymentSchedule.paymentMethod) {
        updateData.paymentSchedule = {
          paymentMethod: paymentSchedule.paymentMethod,
          numberOfInstallments: paymentSchedule.numberOfInstallments,
          dayOfMonth: paymentSchedule.dayOfMonth,
          installments: paymentSchedule.installments || []
        };
      }

      const updatedNote = await SettlementNote.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("subjects.subjectId", "name category")
        .populate("createdBy", "firstName lastName")
        .populate("studentIds", "firstName lastName")
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

    const note = await SettlementNote.findById(id);
    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    // Supprimer en cascade : coupons et séries liés
    const CouponSeries = require("../models/CouponSeries");
    const Coupon = require("../models/Coupon");

    // Trouver la série de coupons liée
    const couponSeries = await CouponSeries.findOne({ settlementNoteId: id });
    if (couponSeries) {
      // Supprimer tous les coupons de la série
      await Coupon.deleteMany({ couponSeriesId: couponSeries._id });
      console.log(`Suppression des coupons de la série ${couponSeries._id}`);
      
      // Supprimer la série de coupons
      await CouponSeries.findByIdAndDelete(couponSeries._id);
      console.log(`Suppression de la série de coupons ${couponSeries._id}`);
    }

    // RELATION BIDIRECTIONNELLE : Retirer l'ID de la note de règlement des élèves AVANT suppression
    const Student = require("../models/Student");
    if (note.studentIds && note.studentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: note.studentIds } },
        { $pull: { settlementNoteIds: id } }
      );
      console.log(`✅ Relation bidirectionnelle nettoyée pour ${note.studentIds.length} élèves`);
    }

    // Supprimer la note de règlement
    await SettlementNote.findByIdAndDelete(id);

    // Retirer l'ID de la note de règlement de la famille
    const Family = require("../models/Family");
    await Family.findByIdAndUpdate(note.familyId, {
      $pull: { settlementNotes: id },
    });

    // Vérifier si la famille n'a plus de notes de règlement et changer le statut si nécessaire
    const family = await Family.findById(note.familyId);
    if (family && family.status === "client") {
      // Compter les NDR restantes pour cette famille
      const remainingNotes = await SettlementNote.countDocuments({ 
        familyId: note.familyId 
      });
      
      if (remainingNotes === 0) {
        // Plus aucune NDR, repasser en prospect
        await Family.findByIdAndUpdate(note.familyId, { status: "prospect" });
        console.log(`Statut de la famille ${family.primaryContact?.firstName} ${family.primaryContact?.lastName} changé automatiquement de 'client' à 'prospect' (plus de NDR)`);
      }
    }

    res.json({ 
      message: "Settlement note deleted successfully",
      deletedCoupons: couponSeries ? "yes" : "no",
      deletedSeries: couponSeries ? "yes" : "no",
      statusChanged: family?.status === "client" ? "checked" : "no"
    });
  } catch (error) {
    console.error("Delete settlement note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/settlement-notes/:id - Mise à jour partielle d'une note de règlement
router.patch("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    const note = await SettlementNote.findById(id);
    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    console.log("🔄 PATCH settlement note - Données reçues:", req.body);

    // Extraire seulement les champs autorisés pour la mise à jour partielle
    const allowedUpdates = {};
    const { clientName, department, status, paymentMethod, notes, subjects } = req.body;

    if (clientName !== undefined) allowedUpdates.clientName = clientName;
    if (department !== undefined) allowedUpdates.department = department;
    if (status !== undefined) allowedUpdates.status = status;
    if (paymentMethod !== undefined) allowedUpdates.paymentMethod = paymentMethod;
    if (notes !== undefined) allowedUpdates.notes = notes;
    if (subjects !== undefined) allowedUpdates.subjects = subjects;

    // Mettre à jour la date de modification
    allowedUpdates.updatedAt = new Date();

    console.log("🔄 Champs à mettre à jour:", allowedUpdates);

    const updatedNote = await SettlementNote.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    )
      .populate("subjects.subjectId", "name category")
      .populate("createdBy", "firstName lastName")
      .populate("studentIds", "firstName lastName")
      .lean();

    console.log("✅ Note mise à jour avec succès");
    res.json(updatedNote);
  } catch (error) {
    console.error("Update settlement note error:", error);
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
      .populate("subjects.subjectId", "name category")
      .populate("createdBy", "firstName lastName")
      .populate("studentIds", "firstName lastName")
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
        .populate("subjects.subjectId", "name category")
        .populate("createdBy", "firstName lastName")
        .populate("studentIds", "firstName lastName")
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
      .populate("subjects.subjectId", "name category")
      .populate("createdBy", "firstName lastName")
      .populate("studentIds", "firstName lastName")
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

// GET /api/settlement-notes/:id/deletion-preview - Aperçu de suppression d'une note de règlement
router.get("/:id/deletion-preview", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    // Récupérer la note de règlement
    const note = await SettlementNote.findById(id)
      .populate("subjects.subjectId", "name category")
      .populate("createdBy", "firstName lastName")
      .populate("studentIds", "firstName lastName")
      .populate("familyId", "primaryContact")
      .lean();

    if (!note) {
      return res.status(404).json({ error: "Settlement note not found" });
    }

    // Trouver la série de coupons liée
    const CouponSeries = require("../models/CouponSeries");
    const Coupon = require("../models/Coupon");
    
    const couponSeries = await CouponSeries.findOne({ settlementNoteId: id }).lean();
    let couponsInfo = null;
    
    if (couponSeries) {
      // Compter les coupons utilisés et non utilisés
      const [usedCoupons, unusedCoupons] = await Promise.all([
        Coupon.countDocuments({ 
          couponSeriesId: couponSeries._id, 
          status: 'used' 
        }),
        Coupon.countDocuments({ 
          couponSeriesId: couponSeries._id, 
          status: 'available' 
        })
      ]);
      
      couponsInfo = {
        seriesId: couponSeries._id,
        totalCoupons: couponSeries.totalCoupons,
        usedCoupons,
        unusedCoupons,
        status: couponSeries.status
      };
    }

    // Vérifier l'impact sur le statut de la famille
    const Family = require("../models/Family");
    let familyStatusChange = null;
    
    if (note.familyId) {
      const family = await Family.findById(note.familyId).lean();
      if (family && family.status === "client") {
        // Compter les autres NDR de cette famille
        const otherNotesCount = await SettlementNote.countDocuments({ 
          familyId: note.familyId, 
          _id: { $ne: id } 
        });
        
        if (otherNotesCount === 0) {
          familyStatusChange = {
            from: "client",
            to: "prospect",
            reason: "Plus aucune note de règlement après suppression"
          };
        }
      }
    }

    // Calculer le montant total (totalRevenue)
    const totalAmount = note.subjects.reduce((sum, subject) => 
      sum + ((subject.hourlyRate || 0) * (subject.quantity || 0)), 0);

    // Préparer les données de prévisualisation dans le format attendu par le frontend
    const couponSeriesDetails = couponsInfo ? [{
      subject: note.subjects[0]?.subjectId?.name || "Matière inconnue",
      totalCoupons: couponsInfo.totalCoupons,
      usedCoupons: couponsInfo.usedCoupons,
      remainingCoupons: couponsInfo.unusedCoupons,
      hourlyRate: note.subjects[0]?.hourlyRate || 0,
      status: couponsInfo.status
    }] : [];

    const deletionPreview = {
      settlementNote: {
        clientName: note.clientName,
        department: note.department,
        totalAmount: totalAmount,
        status: note.status,
        createdAt: note.createdAt
      },
      itemsToDelete: {
        couponSeries: {
          count: couponsInfo ? 1 : 0,
          details: couponSeriesDetails
        },
        coupons: {
          count: couponsInfo ? (couponsInfo.usedCoupons + couponsInfo.unusedCoupons) : 0,
          availableCount: couponsInfo ? couponsInfo.unusedCoupons : 0,
          usedCount: couponsInfo ? couponsInfo.usedCoupons : 0
        }
      },
      totalItems: (couponsInfo ? 1 : 0) + (couponsInfo ? (couponsInfo.usedCoupons + couponsInfo.unusedCoupons) : 0),
      // Garder l'ancien format pour compatibilité si nécessaire
      impacts: {
        coupons: couponsInfo,
        familyStatusChange,
        cascadeOperations: [
          ...(couponsInfo ? ["Suppression de tous les coupons de la série", "Suppression de la série de coupons"] : []),
          "Retrait de la NDR de la famille",
          ...(familyStatusChange ? [`Changement statut famille: ${familyStatusChange.from} → ${familyStatusChange.to}`] : [])
        ]
      }
    };

    res.json(deletionPreview);
  } catch (error) {
    console.error("Get deletion preview error:", error);
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
      "Erreur dans GET /api/settlement-notes/:id/coupons:",
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
    console.error("Erreur dans la recherche de coupon:", error);

    if (error.message.includes("Coupon non trouvé")) {
      return res.status(404).json({ error: "Coupon non trouvé" });
    }

    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
