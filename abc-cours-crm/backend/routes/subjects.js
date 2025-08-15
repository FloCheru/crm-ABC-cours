const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middleware/auth");

// Modèle Subject (à créer)
const Subject = require("../models/Subject");

// GET /api/subjects - Récupérer toutes les matières
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};

    // Filtrer par statut actif si spécifié
    if (active === "true") {
      query.isActive = true;
    } else if (active === "false") {
      query.isActive = false;
    }

    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error("Erreur lors de la récupération des matières:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/subjects/:id - Récupérer une matière par ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Matière non trouvée" });
    }
    res.json(subject);
  } catch (error) {
    console.error("Erreur lors de la récupération de la matière:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/subjects - Créer une nouvelle matière
router.post("/", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    // Validation
    if (!name || !category) {
      return res.status(400).json({
        message: "Le nom et la catégorie sont requis",
      });
    }

    // Vérifier si la matière existe déjà
    const existingSubject = await Subject.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingSubject) {
      return res.status(400).json({
        message: "Une matière avec ce nom existe déjà",
      });
    }

    const subject = new Subject({
      name,
      description,
      category,
      isActive: true,
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    console.error("Erreur lors de la création de la matière:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT /api/subjects/:id - Mettre à jour une matière
router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { name, description, category, isActive } = req.body;

      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Matière non trouvée" });
      }

      // Vérifier si le nouveau nom existe déjà (sauf pour cette matière)
      if (name && name !== subject.name) {
        const existingSubject = await Subject.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
          _id: { $ne: req.params.id },
        });

        if (existingSubject) {
          return res.status(400).json({
            message: "Une matière avec ce nom existe déjà",
          });
        }
      }

      // Mettre à jour les champs
      if (name !== undefined) subject.name = name;
      if (description !== undefined) subject.description = description;
      if (category !== undefined) subject.category = category;
      if (isActive !== undefined) subject.isActive = isActive;

      await subject.save();
      res.json(subject);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la matière:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// DELETE /api/subjects/:id - Supprimer une matière
router.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Matière non trouvée" });
      }

      await Subject.findByIdAndDelete(req.params.id);
      res.json({ message: "Matière supprimée avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de la matière:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// GET /api/subjects/categories - Récupérer toutes les catégories
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await Subject.distinct("category");
    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
