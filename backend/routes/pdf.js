const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const pdfGenerationService = require('../services/pdfGenerationService');
const Family = require('../models/Family');
const Subject = require('../models/Subject');

const router = express.Router();

// Compression gzip pour toutes les réponses PDF
router.use(compression({
  filter: (req, res) => {
    // Compresser seulement les réponses PDF et JSON
    return /pdf|json/.test(res.getHeader('Content-Type'));
  },
  level: 6 // Niveau de compression optimal
}));

// Rate limiting pour la génération de PDF
const pdfGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Maximum 10 PDF par minute par IP
  message: 'Trop de générations de PDF. Veuillez patienter avant de réessayer.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/settlement-notes/:id/generate-pdf
 * Génère un PDF pour une note de règlement
 */
router.post('/settlement-notes/:id/generate-pdf', authenticateToken, pdfGenerationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'ndr' } = req.body;

    // Validation du type
    if (!['ndr', 'coupons', 'both'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de PDF invalide. Valeurs acceptées: ndr, coupons, both'
      });
    }

    console.log(`📄 Demande génération PDF - Note: ${id}, Type: ${type}, User: ${req.user.userId}`);

    const result = await pdfGenerationService.generatePDF(id, type, req.user.userId);

    // Headers de cache pour éviter régénération
    res.set({
      'Cache-Control': 'private, max-age=3600', // Cache 1 heure côté client
      'ETag': `"${result.pdfMetadata._id}"`,
      'X-PDF-Generated-At': new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'PDF généré avec succès',
      data: {
        pdfId: result.pdfMetadata._id,
        fileName: result.pdfMetadata.fileName,
        type: result.pdfMetadata.type,
        fileSize: result.pdfMetadata.fileSize,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la génération du PDF'
    });
  }
});

/**
 * GET /api/settlement-notes/:id/pdfs
 * Liste tous les PDFs générés pour une note de règlement
 */
router.get('/settlement-notes/:id/pdfs', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 Liste PDFs - Note: ${id}, User: ${req.user.userId}`);

    const pdfs = await pdfGenerationService.listPDFs(id);

    res.json({
      success: true,
      data: pdfs
    });

  } catch (error) {
    console.error('❌ Erreur liste PDFs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des PDFs'
    });
  }
});

/**
 * GET /api/pdfs/:settlementNoteId/:pdfId/download
 * Télécharge un PDF spécifique
 */
router.get('/pdfs/:settlementNoteId/:pdfId/download', authenticateToken, async (req, res) => {
  try {
    const { settlementNoteId, pdfId } = req.params;

    console.log(`⬇️ Téléchargement PDF - Note: ${settlementNoteId}, PDF: ${pdfId}, User: ${req.user.userId}`);

    const pdf = await pdfGenerationService.getPDF(settlementNoteId, pdfId);

    // Vérifier que le fichier existe
    try {
      await fs.access(pdf.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier PDF introuvable'
      });
    }

    // Configurer les headers pour le téléchargement avec cache
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.fileName}"`);
    res.setHeader('Content-Length', pdf.fileSize);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h pour PDFs téléchargés
    res.setHeader('ETag', `"${pdfId}"`);

    // Envoyer le fichier avec compression automatique
    res.sendFile(path.resolve(pdf.filePath));

  } catch (error) {
    console.error('❌ Erreur téléchargement PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du téléchargement du PDF'
    });
  }
});

/**
 * GET /api/pdfs/:settlementNoteId/:pdfId/preview
 * Prévisualise un PDF dans le navigateur
 */
router.get('/pdfs/:settlementNoteId/:pdfId/preview', authenticateToken, async (req, res) => {
  try {
    const { settlementNoteId, pdfId } = req.params;

    console.log(`👁️ Prévisualisation PDF - Note: ${settlementNoteId}, PDF: ${pdfId}, User: ${req.user.userId}`);

    const pdf = await pdfGenerationService.getPDF(settlementNoteId, pdfId);

    // Vérifier que le fichier existe
    try {
      await fs.access(pdf.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier PDF introuvable'
      });
    }

    // Configurer les headers pour la prévisualisation
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);

    // Envoyer le fichier
    res.sendFile(path.resolve(pdf.filePath));

  } catch (error) {
    console.error('❌ Erreur prévisualisation PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la prévisualisation du PDF'
    });
  }
});

/**
 * DELETE /api/pdfs/:settlementNoteId/:pdfId
 * Supprime un PDF généré
 */
router.delete('/pdfs/:settlementNoteId/:pdfId', authenticateToken, async (req, res) => {
  try {
    const { settlementNoteId, pdfId } = req.params;

    console.log(`🗑️ Suppression PDF - Note: ${settlementNoteId}, PDF: ${pdfId}, User: ${req.user.userId}`);

    // Récupérer le PDF
    const pdf = await pdfGenerationService.getPDF(settlementNoteId, pdfId);

    // Supprimer le fichier physique
    try {
      await fs.unlink(pdf.filePath);
    } catch (error) {
      console.warn('⚠️ Fichier PDF déjà supprimé du disque');
    }

    // Supprimer l'entrée de la base de données
    const SettlementNote = require('../models/SettlementNote');
    await SettlementNote.findByIdAndUpdate(
      settlementNoteId,
      {
        $pull: {
          generatedPDFs: { _id: pdfId }
        }
      }
    );

    res.json({
      success: true,
      message: 'PDF supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du PDF'
    });
  }
});

/**
 * GET /api/pdf/preview/:familyId
 * Génère un PDF de prévisualisation avec une famille spécifique
 */
router.get('/preview/:familyId', authenticateToken, async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // Récupérer la famille avec ses étudiants
    const family = await Family.findById(familyId)
      .populate('studentIds');
    
    if (!family) {
      return res.status(404).json({ error: 'Famille non trouvée' });
    }

    // Récupérer quelques matières pour les données de test
    const subjects = await Subject.find().limit(3);
    
    // Créer des données de test pour la note de règlement
    const mockSettlementNote = {
      _id: 'preview123456789',
      clientName: `${family.firstName} ${family.lastName}`,
      familyId: family,
      studentIds: family.studentIds,
      department: family.department || '75',
      paymentMethod: 'card',
      subjects: subjects.map(subject => ({
        subjectId: subject,
        hourlyRate: 35,
        quantity: 8,
        professorSalary: 25,
        total: 280
      })),
      totalQuantity: 24,
      totalRevenue: 840,
      salaryToPay: 600,
      chargesToPay: 120,
      marginAmount: 120,
      marginPercentage: 14.3,
      notes: 'Note de règlement générée pour prévisualisation du template PDF',
      paymentSchedule: {
        paymentMethod: 'PRLV',
        numberOfInstallments: 3,
        dayOfMonth: 5,
        installments: [
          {
            dueDate: new Date('2024-02-05'),
            amount: 280,
            status: 'pending'
          },
          {
            dueDate: new Date('2024-03-05'),
            amount: 280,
            status: 'pending'
          },
          {
            dueDate: new Date('2024-04-05'),
            amount: 280,
            status: 'pending'
          }
        ]
      }
    };

    // Préparer les données pour le template
    const templateData = await pdfGenerationService.prepareTemplateData(mockSettlementNote, 'ndr');
    
    // Générer le HTML à partir du template
    const html = await pdfGenerationService.renderTemplate(templateData, 'ndr');
    
    // Générer le PDF avec Puppeteer
    const pdfBuffer = await pdfGenerationService.generatePDFFromHTML(html);
    
    // Retourner le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview-ndr.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erreur génération PDF preview:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du PDF',
      details: error.message 
    });
  }
});

/**
 * GET /api/pdf/template-preview
 * Génère un PDF template vide (avec données de démo)
 */
router.get('/template-preview', authenticateToken, async (req, res) => {
  try {
    // Récupérer quelques matières pour les données de test
    const subjects = await Subject.find().limit(2);
    
    // Créer des données de démo pour le template
    const mockSettlementNote = {
      _id: 'template123456789',
      clientName: 'DUPONT Jean',
      familyId: {
        address: '123 Rue de la Paix\n75001 PARIS'
      },
      studentIds: [
        { firstName: 'Paul', lastName: 'DUPONT' },
        { firstName: 'Marie', lastName: 'DUPONT' }
      ],
      department: '75',
      paymentMethod: 'PRLV',
      subjects: subjects.length > 0 ? subjects.map((subject, index) => ({
        subjectId: subject,
        hourlyRate: index === 0 ? 35 : 40,
        quantity: index === 0 ? 10 : 6,
        professorSalary: index === 0 ? 25 : 30,
        total: index === 0 ? 350 : 240
      })) : [
        {
          subjectId: { name: 'Mathématiques' },
          hourlyRate: 35,
          quantity: 10,
          professorSalary: 25,
          total: 350
        },
        {
          subjectId: { name: 'Physique-Chimie' },
          hourlyRate: 40,
          quantity: 6,
          professorSalary: 30,
          total: 240
        }
      ],
      totalQuantity: 16,
      totalRevenue: 590,
      salaryToPay: 440,
      chargesToPay: 88,
      marginAmount: 62,
      marginPercentage: 10.5,
      notes: 'Template de démonstration pour la note de règlement',
      paymentSchedule: {
        paymentMethod: 'PRLV',
        numberOfInstallments: 2,
        dayOfMonth: 15,
        installments: [
          {
            dueDate: new Date('2024-02-15'),
            amount: 295,
            status: 'pending'
          },
          {
            dueDate: new Date('2024-03-15'),
            amount: 295,
            status: 'pending'
          }
        ]
      }
    };

    // Préparer les données pour le template
    const templateData = await pdfGenerationService.prepareTemplateData(mockSettlementNote, 'ndr');
    
    // Générer le HTML à partir du template
    const html = await pdfGenerationService.renderTemplate(templateData, 'ndr');
    
    // Générer le PDF avec Puppeteer
    const pdfBuffer = await pdfGenerationService.generatePDFFromHTML(html);
    
    // Retourner le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="template-ndr.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erreur génération template PDF:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du template',
      details: error.message 
    });
  }
});

/**
 * GET /api/pdf/template-html
 * Servir le template HTML avec la première NDR réelle
 */
router.get('/template-html', authenticateToken, async (req, res) => {
  try {
    const SettlementNote = require('../models/SettlementNote');
    
    // Récupérer la première NDR avec toutes les données
    const firstSettlementNote = await SettlementNote.findOne()
      .populate('familyId')
      .populate('studentIds')
      .populate('subjects.subjectId')
      .populate('couponSeriesId')
      .populate('createdBy')
      .sort({ createdAt: -1 }); // La plus récente d'abord

    if (!firstSettlementNote) {
      // Fallback avec données de démo si aucune NDR
      const mockData = {
        noteNumber: 'NDR-DEMO',
        formattedDate: new Date().toLocaleDateString('fr-FR'),
        generationDate: new Date().toLocaleDateString('fr-FR'),
        clientName: 'CLIENT DE DEMONSTRATION',
        clientAddress: 'Adresse de démonstration',
        department: '75',
        paymentMethodLabel: 'Prélèvement automatique',
        studentNames: 'Élève de démo',
        subjects: [
          {
            subjectName: 'Mathématiques',
            hourlyRate: 35,
            quantity: 10,
            professorSalary: 25,
            total: 350
          }
        ],
        totalQuantity: 10,
        totalRevenue: 350,
        salaryToPay: 250,
        chargesToPay: 50,
        marginAmount: 50,
        marginPercentage: 14.3,
        includeNdr: true,
        includeCoupons: false
      };

      const html = await pdfGenerationService.renderTemplate(mockData, 'ndr');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // Utiliser la vraie NDR
    const templateData = await pdfGenerationService.prepareTemplateData(firstSettlementNote, 'ndr');
    const html = await pdfGenerationService.renderTemplate(templateData, 'ndr');
    
    // Retourner le HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('Erreur génération HTML template:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du HTML',
      details: error.message 
    });
  }
});

/**
 * GET /api/pdfs/health
 * Vérification de santé du service PDF
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    // Vérifier que les dossiers existent
    const uploadsDir = path.join(__dirname, '../uploads/pdfs');
    const templatesDir = path.join(__dirname, '../templates');

    await fs.access(uploadsDir);
    await fs.access(templatesDir);
    await fs.access(path.join(templatesDir, 'ndr-template.html'));
    await fs.access(path.join(templatesDir, 'ndr-styles.css'));

    res.json({
      success: true,
      message: 'Service PDF opérationnel',
      data: {
        uploadsDir,
        templatesDir,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur health check PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Service PDF non opérationnel',
      error: error.message
    });
  }
});

module.exports = router;