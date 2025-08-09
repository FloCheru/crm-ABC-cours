const express = require("express");
const router = express.Router();
const PaymentNote = require("../models/PaymentNote");
const Family = require("../models/Family");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Professor = require("../models/Professor");
const CouponSeries = require("../models/CouponSeries");
const { authenticateToken } = require("../middleware/auth");

// GET /api/payment-notes - Récupérer toutes les notes de règlement
router.get("/", authenticateToken, async (req, res) => {
  try {
    const paymentNotes = await PaymentNote.find()
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .populate("couponSeries", "name totalAmount")
      .populate("createdBy", "firstName lastName")
      .sort({ entryDate: -1 });

    res.json(paymentNotes);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des notes de règlement:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/payment-notes/:id - Récupérer une note de règlement spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const paymentNote = await PaymentNote.findById(req.params.id)
      .populate("family")
      .populate("student")
      .populate("subject")
      .populate("professor")
      .populate("couponSeries")
      .populate("createdBy", "firstName lastName");

    if (!paymentNote) {
      return res.status(404).json({ message: "Note de règlement non trouvée" });
    }

    res.json(paymentNote);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la note de règlement:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/payment-notes - Créer une nouvelle note de règlement
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      family,
      student,
      subject,
      studentLevel,
      couponSeries,
      professor,
      amount,
      paymentMethod,
      notes,
      paymentReference,
    } = req.body;

    // Validation des données
    if (
      !family ||
      !student ||
      !subject ||
      !studentLevel ||
      !couponSeries ||
      !professor ||
      !amount ||
      !paymentMethod
    ) {
      return res
        .status(400)
        .json({ message: "Tous les champs obligatoires doivent être remplis" });
    }

    // Vérifier que la famille existe
    const familyExists = await Family.findById(family);
    if (!familyExists) {
      return res.status(400).json({ message: "Famille non trouvée" });
    }

    // Vérifier que l'élève existe et appartient à la famille
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      return res.status(400).json({ message: "Élève non trouvé" });
    }
    if (studentExists.family.toString() !== family) {
      return res
        .status(400)
        .json({ message: "L'élève n'appartient pas à cette famille" });
    }

    // Vérifier que la matière existe
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(400).json({ message: "Matière non trouvée" });
    }

    // Vérifier que la série de coupons existe
    const couponSeriesExists = await CouponSeries.findById(couponSeries);
    if (!couponSeriesExists) {
      return res.status(400).json({ message: "Série de coupons non trouvée" });
    }

    // Vérifier que le professeur existe et enseigne cette matière
    const professorExists = await Professor.findById(professor);
    if (!professorExists) {
      return res.status(400).json({ message: "Professeur non trouvé" });
    }

    const professorTeachesSubject = professorExists.subjects.some(
      (subj) => subj.name === subjectExists.name
    );
    if (!professorTeachesSubject) {
      return res
        .status(400)
        .json({ message: "Le professeur n'enseigne pas cette matière" });
    }

    const paymentNote = new PaymentNote({
      family,
      student,
      subject,
      studentLevel,
      couponSeries,
      professor,
      amount,
      paymentMethod,
      notes,
      paymentReference,
      createdBy: req.user.id,
    });

    await paymentNote.save();

    // Récupérer la note avec les données populées
    const populatedPaymentNote = await PaymentNote.findById(paymentNote._id)
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .populate("couponSeries", "name totalAmount")
      .populate("createdBy", "firstName lastName");

    res.status(201).json(populatedPaymentNote);
  } catch (error) {
    console.error("Erreur lors de la création de la note de règlement:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT /api/payment-notes/:id - Mettre à jour une note de règlement
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const {
      family,
      student,
      subject,
      studentLevel,
      couponSeries,
      professor,
      amount,
      paymentMethod,
      notes,
      paymentReference,
      status,
      paymentDate,
    } = req.body;

    const paymentNote = await PaymentNote.findById(req.params.id);
    if (!paymentNote) {
      return res.status(404).json({ message: "Note de règlement non trouvée" });
    }

    // Mise à jour des champs
    if (family) paymentNote.family = family;
    if (student) paymentNote.student = student;
    if (subject) paymentNote.subject = subject;
    if (studentLevel) paymentNote.studentLevel = studentLevel;
    if (couponSeries) paymentNote.couponSeries = couponSeries;
    if (professor) paymentNote.professor = professor;
    if (amount) paymentNote.amount = amount;
    if (paymentMethod) paymentNote.paymentMethod = paymentMethod;
    if (notes !== undefined) paymentNote.notes = notes;
    if (paymentReference !== undefined)
      paymentNote.paymentReference = paymentReference;
    if (status) paymentNote.status = status;
    if (paymentDate) paymentNote.paymentDate = paymentDate;

    await paymentNote.save();

    // Récupérer la note mise à jour avec les données populées
    const updatedPaymentNote = await PaymentNote.findById(paymentNote._id)
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .populate("couponSeries", "name totalAmount")
      .populate("createdBy", "firstName lastName");

    res.json(updatedPaymentNote);
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la note de règlement:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE /api/payment-notes/:id - Supprimer une note de règlement
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const paymentNote = await PaymentNote.findById(req.params.id);
    if (!paymentNote) {
      return res.status(404).json({ message: "Note de règlement non trouvée" });
    }

    await PaymentNote.findByIdAndDelete(req.params.id);
    res.json({ message: "Note de règlement supprimée avec succès" });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de la note de règlement:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/payment-notes/families/:familyId - Récupérer les notes de règlement d'une famille
router.get("/families/:familyId", authenticateToken, async (req, res) => {
  try {
    const paymentNotes = await PaymentNote.find({ family: req.params.familyId })
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .populate("couponSeries", "name totalAmount")
      .populate("createdBy", "firstName lastName")
      .sort({ entryDate: -1 });

    res.json(paymentNotes);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des notes de règlement de la famille:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/payment-notes/students/:studentId - Récupérer les notes de règlement d'un élève
router.get("/students/:studentId", authenticateToken, async (req, res) => {
  try {
    const paymentNotes = await PaymentNote.find({
      student: req.params.studentId,
    })
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .populate("couponSeries", "name totalAmount")
      .populate("createdBy", "firstName lastName")
      .sort({ entryDate: -1 });

    res.json(paymentNotes);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des notes de règlement de l'élève:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PATCH /api/payment-notes/:id/mark-paid - Marquer une note comme payée
router.patch("/:id/mark-paid", authenticateToken, async (req, res) => {
  try {
    const { paymentDate } = req.body;

    const paymentNote = await PaymentNote.findById(req.params.id);
    if (!paymentNote) {
      return res.status(404).json({ message: "Note de règlement non trouvée" });
    }

    await paymentNote.markAsPaid(
      paymentDate ? new Date(paymentDate) : new Date()
    );

    const updatedPaymentNote = await PaymentNote.findById(paymentNote._id)
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .populate("couponSeries", "name totalAmount")
      .populate("createdBy", "firstName lastName");

    res.json(updatedPaymentNote);
  } catch (error) {
    console.error("Erreur lors du marquage comme payé:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PATCH /api/payment-notes/:id/cancel - Annuler une note de règlement
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const paymentNote = await PaymentNote.findById(req.params.id);
    if (!paymentNote) {
      return res.status(404).json({ message: "Note de règlement non trouvée" });
    }

    await paymentNote.cancel();

    const updatedPaymentNote = await PaymentNote.findById(paymentNote._id)
      .populate("family", "name")
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("professor", "user")
      .populate("couponSeries", "name totalAmount")
      .populate("createdBy", "firstName lastName");

    res.json(updatedPaymentNote);
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
