/**
 * Routes API pour la génération et récupération de PDFs
 * Routes génériques pour tous types de PDFs (fiche_paie, NDR, convention, facture)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const pdfService = require('../services/pdf/pdfService');

/**
 * POST /api/pdfs/generate
 * Génère un nouveau PDF
 * Body: { type, data, version? }
 * Auth: Professor (own), Admin (all)
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { type, data, version } = req.body;

    // Validation
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Type et données requis'
      });
    }

    // Vérifier que le type est valide
    const validTypes = ['fiche_paie', 'NDR', 'convention', 'facture'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Type invalide. Types autorisés: ${validTypes.join(', ')}`
      });
    }

    // Pour les professeurs, ils ne peuvent générer que leurs propres PDFs
    let targetUserId = req.body.userId || req.user._id;
    const userModel = req.body.userModel || (req.user.role === 'admin' ? 'Admin' : 'Professor');

    if (req.user.role === 'professor' && targetUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé: vous ne pouvez générer que vos propres documents'
      });
    }

    // Générer le PDF
    const result = await pdfService.generatePDF(
      type,
      data,
      targetUserId,
      userModel,
      version
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `PDF ${type} généré avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération du PDF'
    });
  }
});

/**
 * GET /api/pdfs/:pdfId
 * Récupère un PDF déchiffré
 * Auth: Professor (own), Admin (all)
 */
router.get('/:pdfId', authenticateToken, async (req, res) => {
  try {
    const { pdfId } = req.params;

    // Récupérer le PDF
    const pdfBuffer = await pdfService.retrievePDF(
      pdfId,
      req.user._id,
      req.user.role === 'admin' ? 'Admin' : 'Professor'
    );

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="document_${pdfId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur récupération PDF:', error);

    if (error.message.includes('Accès refusé')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération du PDF'
    });
  }
});

/**
 * GET /api/pdfs/list/:userId?
 * Liste les PDFs d'un utilisateur
 * Query: ?type=fiche_paie (optionnel)
 * Auth: Professor (own only), Admin (all)
 */
router.get('/list/:userId?', authenticateToken, async (req, res) => {
  try {
    let targetUserId = req.params.userId || req.user._id;
    const { type } = req.query;

    // Professors ne peuvent lister que leurs propres PDFs
    if (req.user.role === 'professor' && targetUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé: vous ne pouvez lister que vos propres documents'
      });
    }

    // Liste des PDFs
    const pdfs = await pdfService.listPDFs(targetUserId, type);

    res.json({
      success: true,
      count: pdfs.length,
      data: pdfs
    });

  } catch (error) {
    console.error('❌ Erreur liste PDFs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération de la liste'
    });
  }
});

/**
 * DELETE /api/pdfs/:pdfId
 * Supprime un PDF (soft delete)
 * Auth: Professor (own), Admin (all)
 */
router.delete('/:pdfId', authenticateToken, async (req, res) => {
  try {
    const { pdfId } = req.params;

    await pdfService.removePDF(
      pdfId,
      req.user._id,
      req.user.role === 'admin' ? 'Admin' : 'Professor'
    );

    res.json({
      success: true,
      message: 'PDF supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression PDF:', error);

    if (error.message.includes('Accès refusé')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression du PDF'
    });
  }
});

/**
 * DELETE /api/pdfs/:pdfId/hard
 * Suppression définitive d'un PDF (hard delete)
 * Auth: Admin ONLY
 */
router.delete('/:pdfId/hard', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { pdfId } = req.params;

    await pdfService.hardDeletePDF(pdfId);

    res.json({
      success: true,
      message: 'PDF supprimé définitivement'
    });

  } catch (error) {
    console.error('❌ Erreur suppression définitive PDF:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression définitive du PDF'
    });
  }
});

/**
 * POST /api/pdfs/template/invalidate
 * Invalide le cache d'un template (après modification)
 * Auth: Admin ONLY
 */
router.post('/template/invalidate', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { templateName } = req.body;

    if (!templateName) {
      return res.status(400).json({
        success: false,
        error: 'Nom du template requis'
      });
    }

    pdfService.invalidateTemplateCache(templateName);

    res.json({
      success: true,
      message: `Cache du template ${templateName} invalidé`
    });

  } catch (error) {
    console.error('❌ Erreur invalidation cache:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'invalidation du cache'
    });
  }
});

module.exports = router;
