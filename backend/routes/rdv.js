const express = require('express');
const router = express.Router();
const RendezVous = require('../models/RendezVous');
const Family = require('../models/Family');
const User = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');

// Middleware pour toutes les routes RDV
router.use(authenticateToken);

// GET /api/rdv - Récupérer tous les RDV avec filtres
router.get('/', async (req, res) => {
  try {
    const { 
      familyId, 
      assignedAdminId, 
      status, 
      dateFrom, 
      dateTo, 
      type,
      page = 1, 
      limit = 50 
    } = req.query;

    // Construction de la requête de filtrage
    const query = {};
    
    if (familyId) query.familyId = familyId;
    if (assignedAdminId) query.assignedAdminId = assignedAdminId;
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Filtre par date
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Exécution de la requête avec population
    const rdvs = await RendezVous.find(query)
      .populate('familyId', 'primaryContact address')
      .populate('assignedAdminId', 'firstName lastName email')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total pour la pagination
    const total = await RendezVous.countDocuments(query);

    res.json({
      rdvs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des RDV:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message 
    });
  }
});

// GET /api/rdv/:id - Récupérer un RDV spécifique
router.get('/:id', async (req, res) => {
  try {
    const rdv = await RendezVous.findById(req.params.id)
      .populate('familyId', 'primaryContact address students')
      .populate('assignedAdminId', 'firstName lastName email');

    if (!rdv) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    res.json(rdv);

  } catch (error) {
    console.error('Erreur lors de la récupération du RDV:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du rendez-vous',
      error: error.message 
    });
  }
});

// POST /api/rdv - Créer un nouveau RDV
router.post('/', authorize(['admin']), async (req, res) => {
  try {
    const { familyId, assignedAdminId, date, time, type, notes } = req.body;

    // Validation des champs requis
    if (!familyId || !assignedAdminId || !date || !time || !type) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être renseignés',
        required: ['familyId', 'assignedAdminId', 'date', 'time', 'type']
      });
    }

    // Vérifier que la famille existe
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Famille non trouvée' });
    }

    // Vérifier que l'admin existe et a le bon rôle
    const admin = await User.findById(assignedAdminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Administrateur non trouvé ou rôle invalide' });
    }

    // Créer le RDV
    const rdv = new RendezVous({
      familyId,
      assignedAdminId,
      date: new Date(date),
      time,
      type,
      notes: notes || ''
    });

    const savedRdv = await rdv.save();

    // Ajouter l'ID du RDV au tableau rdvs de la famille
    await Family.findByIdAndUpdate(familyId, {
      $push: { rdvs: savedRdv._id }
    });

    // Récupérer le RDV avec les données populées
    const populatedRdv = await RendezVous.findById(savedRdv._id)
      .populate('familyId', 'primaryContact address')
      .populate('assignedAdminId', 'firstName lastName email');

    res.status(201).json({
      message: 'Rendez-vous créé avec succès',
      rdv: populatedRdv
    });

  } catch (error) {
    console.error('Erreur lors de la création du RDV:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Données invalides',
        errors: error.errors ? Object.values(error.errors).map(err => err.message) : [error.message]
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de la création du rendez-vous',
      error: error.message 
    });
  }
});

// PUT /api/rdv/:id - Mettre à jour un RDV
router.put('/:id', authorize(['admin']), async (req, res) => {
  try {
    const { date, time, type, notes, status } = req.body;

    const rdv = await RendezVous.findById(req.params.id);
    if (!rdv) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Mise à jour des champs modifiables
    if (date) rdv.date = new Date(date);
    if (time) rdv.time = time;
    if (type) rdv.type = type;
    if (notes !== undefined) rdv.notes = notes;
    if (status) rdv.status = status;

    const updatedRdv = await rdv.save();

    // Récupérer le RDV avec les données populées
    const populatedRdv = await RendezVous.findById(updatedRdv._id)
      .populate('familyId', 'primaryContact address')
      .populate('assignedAdminId', 'firstName lastName email');

    res.json({
      message: 'Rendez-vous mis à jour avec succès',
      rdv: populatedRdv
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du RDV:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Données invalides',
        errors: error.errors ? Object.values(error.errors).map(err => err.message) : [error.message]
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du rendez-vous',
      error: error.message 
    });
  }
});

// DELETE /api/rdv/:id - Supprimer un RDV
router.delete('/:id', authorize(['admin']), async (req, res) => {
  try {
    const rdv = await RendezVous.findById(req.params.id);
    
    if (!rdv) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Suppression définitive pour tous les RDV
    
    // Retirer l'ID du RDV du tableau rdvs de la famille
    await Family.findByIdAndUpdate(rdv.familyId, {
      $pull: { rdvs: req.params.id }
    });
    
    await RendezVous.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Rendez-vous supprimé avec succès',
      action: 'deleted'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du RDV:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du rendez-vous',
      error: error.message 
    });
  }
});

// GET /api/rdv/availability/:adminId - Vérifier la disponibilité d'un admin
router.get('/availability/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        message: 'Date et heure requises pour vérifier la disponibilité'
      });
    }

    const existingRdv = await RendezVous.checkAvailability(date, time, adminId);
    
    res.json({
      available: !existingRdv,
      conflict: existingRdv ? {
        id: existingRdv._id,
        familyId: existingRdv.familyId,
        status: existingRdv.status
      } : null
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de disponibilité',
      error: error.message 
    });
  }
});

// GET /api/rdv/stats/summary - Statistiques des RDV
router.get('/stats/summary', authorize(['admin']), async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Statistiques générales
    const stats = await RendezVous.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // RDV de la semaine
    const weeklyRdvs = await RendezVous.countDocuments({
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek
      },
      status: { $ne: 'annule' }
    });

    // RDV du jour
    const todayRdvs = await RendezVous.countDocuments({
      date: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      },
      status: { $ne: 'annule' }
    });

    const summary = {
      total: stats.reduce((acc, stat) => acc + stat.count, 0),
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      weeklyCount: weeklyRdvs,
      todayCount: todayRdvs
    };

    res.json(summary);

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques RDV:', error);
    res.status(500).json({ 
      message: 'Erreur lors du calcul des statistiques',
      error: error.message 
    });
  }
});

module.exports = router;