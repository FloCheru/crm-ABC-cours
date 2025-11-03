const express = require("express");
const { NdrService } = require("../services/ndrService");
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

// GET /api/ndrs - Liste des NDRs
router.get("/", async (req, res) => {
  try {
    const ndrs = await NdrService.getAllNDRs();
    res.json({ ndrs: ndrs });
  } catch (error) {
    console.error("Erreur dans GET /api/ndrs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ndrs/:id - Détails d'une NDR
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid NDR ID" });
    }

    const ndr = await NdrService.getNDRById(id);
    res.json(ndr);
  } catch (error) {
    console.error("Erreur dans GET /api/ndrs/:id:", error);
    if (error.message.includes("NDR non trouvée")) {
      return res.status(404).json({ error: "NDR not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ndrs - Créer une nouvelle NDR
router.post("/", authorize(["admin"]), async (req, res) => {
  try {
    const {
      familyId,
      beneficiaries,
      paymentMethod,
      paymentType,
      deadlines,
      subjects,
      hourlyRate,
      quantity,
      charges,
      status,
      notes,
      professor,
    } = req.body;

    // Données de la NDR selon le nouveau modèle
    const ndrData = {
      familyId,
      beneficiaries,
      paymentMethod,
      paymentType,
      deadlines,
      subjects,
      hourlyRate,
      quantity,
      charges,
      status,
      notes,
      professor,
      createdBy: {
        userId: req.user.id,
      },
    };

    // Créer la NDR avec génération automatique des coupons
    const newNDR = await NdrService.createNDR(ndrData);

    res.status(201).json({
      message: "NDR créée avec succès",
      ndr: newNDR,
    });
  } catch (error) {
    console.error("Erreur lors de la création de NDR:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/ndrs/:id - Mettre à jour une NDR
router.put("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
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
        installments: paymentSchedule.installments || [],
      };
    }

    const updatedNote = await SettlementNote.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("subjects.id", "name category")
      .populate("createdBy", "firstName lastName")
      .populate("studentIds", "firstName lastName")
      .lean();

    res.json(updatedNote);
  } catch (error) {
    console.error("Update settlement note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/ndrs/:id - Supprimer une NDR
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
      console.log(
        `✅ Relation bidirectionnelle nettoyée pour ${note.studentIds.length} élèves`
      );
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
        familyId: note.familyId,
      });

      if (remainingNotes === 0) {
        // Plus aucune NDR, repasser en prospect
        await Family.findByIdAndUpdate(note.familyId, { status: "prospect" });
        console.log(
          `Statut de la famille ${family.primaryContact?.firstName} ${family.primaryContact?.lastName} changé automatiquement de 'client' à 'prospect' (plus de NDR)`
        );
      }
    }

    res.json({
      message: "Settlement note deleted successfully",
      deletedCoupons: couponSeries ? "yes" : "no",
      deletedSeries: couponSeries ? "yes" : "no",
      statusChanged: family?.status === "client" ? "checked" : "no",
    });
  } catch (error) {
    console.error("Delete settlement note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/ndrs/:id - Mise à jour partielle d'une NDR
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
    const { clientName, department, status, paymentMethod, notes, subjects } =
      req.body;

    if (clientName !== undefined) allowedUpdates.clientName = clientName;
    if (department !== undefined) allowedUpdates.department = department;
    if (status !== undefined) allowedUpdates.status = status;
    if (paymentMethod !== undefined)
      allowedUpdates.paymentMethod = paymentMethod;
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
      .populate("subjects.id", "name category")
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

// PATCH /api/ndrs/:id/mark-paid - Marquer comme payé
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
      .populate("subjects.id", "name category")
      .populate("createdBy", "firstName lastName")
      .populate("studentIds", "firstName lastName")
      .lean();

    res.json(updatedNote);
  } catch (error) {
    console.error("Mark as paid error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ndrs - Récupérer toutes les NDRs
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
        .populate("subjects.id", "name category")
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

// GET /api/ndrs/stats - Statistiques des NDRs
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

// GET /api/ndrs/:id - Récupérer une NDR spécifique
router.get("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    const note = await SettlementNote.findById(id)
      .populate("subjects.id", "name category")
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

// GET /api/ndrs/:id/deletion-preview - Aperçu de suppression d'une NDR
router.get("/:id/deletion-preview", authorize(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid settlement note ID" });
    }

    // Récupérer la note de règlement
    const note = await SettlementNote.findById(id)
      .populate("subjects.id", "name category")
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

    const couponSeries = await CouponSeries.findOne({
      settlementNoteId: id,
    }).lean();
    let couponsInfo = null;

    if (couponSeries) {
      // Compter les coupons utilisés et non utilisés
      const [usedCoupons, unusedCoupons] = await Promise.all([
        Coupon.countDocuments({
          couponSeriesId: couponSeries._id,
          status: "used",
        }),
        Coupon.countDocuments({
          couponSeriesId: couponSeries._id,
          status: "available",
        }),
      ]);

      couponsInfo = {
        seriesId: couponSeries._id,
        totalCoupons: couponSeries.totalCoupons,
        usedCoupons,
        unusedCoupons,
        status: couponSeries.status,
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
          _id: { $ne: id },
        });

        if (otherNotesCount === 0) {
          familyStatusChange = {
            from: "client",
            to: "prospect",
            reason: "Plus aucune note de règlement après suppression",
          };
        }
      }
    }

    // Calculer le montant total (totalRevenue)
    const totalAmount = note.subjects.reduce(
      (sum, subject) =>
        sum + (subject.hourlyRate || 0) * (subject.quantity || 0),
      0
    );

    // Préparer les données de prévisualisation dans le format attendu par le frontend
    const couponSeriesDetails = couponsInfo
      ? [
          {
            subject: note.subjects[0]?.subjectId?.name || "Matière inconnue",
            totalCoupons: couponsInfo.totalCoupons,
            usedCoupons: couponsInfo.usedCoupons,
            remainingCoupons: couponsInfo.unusedCoupons,
            hourlyRate: note.subjects[0]?.hourlyRate || 0,
            status: couponsInfo.status,
          },
        ]
      : [];

    const deletionPreview = {
      settlementNote: {
        clientName: note.clientName,
        department: note.department,
        totalAmount: totalAmount,
        status: note.status,
        createdAt: note.createdAt,
      },
      itemsToDelete: {
        couponSeries: {
          count: couponsInfo ? 1 : 0,
          details: couponSeriesDetails,
        },
        coupons: {
          count: couponsInfo
            ? couponsInfo.usedCoupons + couponsInfo.unusedCoupons
            : 0,
          availableCount: couponsInfo ? couponsInfo.unusedCoupons : 0,
          usedCount: couponsInfo ? couponsInfo.usedCoupons : 0,
        },
      },
      totalItems:
        (couponsInfo ? 1 : 0) +
        (couponsInfo ? couponsInfo.usedCoupons + couponsInfo.unusedCoupons : 0),
      // Garder l'ancien format pour compatibilité si nécessaire
      impacts: {
        coupons: couponsInfo,
        familyStatusChange,
        cascadeOperations: [
          ...(couponsInfo
            ? [
                "Suppression de tous les coupons de la série",
                "Suppression de la série de coupons",
              ]
            : []),
          "Retrait de la NDR de la famille",
          ...(familyStatusChange
            ? [
                `Changement statut famille: ${familyStatusChange.from} → ${familyStatusChange.to}`,
              ]
            : []),
        ],
      },
    };

    res.json(deletionPreview);
  } catch (error) {
    console.error("Get deletion preview error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ndrs/:id/coupons - Récupérer les détails des coupons d'une NDR
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
    console.error("Erreur dans GET /api/settlement-notes/:id/coupons:", error);
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
