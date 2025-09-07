const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const SettlementNote = require('../models/SettlementNote');

// Pool de browsers Puppeteer pour réutilisation
class BrowserPool {
  constructor(maxSize = 3) {
    this.maxSize = maxSize;
    this.browsers = [];
    this.availableBrowsers = [];
  }

  async getBrowser() {
    // Si un browser est disponible, le réutiliser
    if (this.availableBrowsers.length > 0) {
      return this.availableBrowsers.pop();
    }

    // Si on peut créer un nouveau browser
    if (this.browsers.length < this.maxSize) {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process'
        ]
      });
      this.browsers.push(browser);
      return browser;
    }

    // Attendre qu'un browser soit disponible
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.availableBrowsers.length > 0) {
          clearInterval(checkInterval);
          resolve(this.availableBrowsers.pop());
        }
      }, 100);
    });
  }

  releaseBrowser(browser) {
    if (this.browsers.includes(browser)) {
      this.availableBrowsers.push(browser);
    }
  }

  async closeAll() {
    await Promise.all(this.browsers.map(browser => browser.close()));
    this.browsers = [];
    this.availableBrowsers = [];
  }
}

// Cache LRU pour PDFs récents
class PDFCache {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  generateKey(settlementNoteId, type) {
    return `${settlementNoteId}_${type}`;
  }

  get(settlementNoteId, type) {
    const key = this.generateKey(settlementNoteId, type);
    if (this.cache.has(key)) {
      // Déplacer en tête (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(settlementNoteId, type, pdfData) {
    const key = this.generateKey(settlementNoteId, type);
    
    // Si cache plein, supprimer le plus ancien
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      ...pdfData,
      cachedAt: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

class PDFGenerationService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    this.uploadsDir = path.join(__dirname, '../uploads/pdfs');
    this.browserPool = new BrowserPool(3);
    this.pdfCache = new PDFCache(10);
  }

  /**
   * Génère un PDF pour une note de règlement
   */
  async generatePDF(settlementNoteId, type = 'ndr', userId) {
    try {
      console.log(`🚀 Génération PDF - Note: ${settlementNoteId}, Type: ${type}`);
      
      // Vérifier le cache d'abord
      const cachedPDF = this.pdfCache.get(settlementNoteId, type);
      if (cachedPDF && Date.now() - cachedPDF.cachedAt < 3600000) { // Cache valide 1h
        console.log(`📦 PDF trouvé en cache`);
        return cachedPDF;
      }
      
      // Récupérer la note de règlement avec toutes les données populées
      const settlementNote = await SettlementNote.findById(settlementNoteId)
        .populate('familyId')
        .populate('studentIds')
        .populate('subjects.subjectId')
        .populate('couponSeriesId')
        .populate('createdBy');

      if (!settlementNote) {
        throw new Error('Note de règlement non trouvée');
      }

      // Préparer les données pour le template
      const templateData = await this.prepareTemplateData(settlementNote, type);
      
      // Générer le HTML à partir du template
      const html = await this.renderTemplate(templateData, type);
      
      // Générer le PDF avec Puppeteer
      const pdfBuffer = await this.generatePDFFromHTML(html);
      
      // Sauvegarder le fichier PDF
      const pdfMetadata = await this.savePDF(pdfBuffer, settlementNote, type);
      
      // Mettre à jour la note de règlement avec les métadonnées du PDF
      const pdfId = await this.updateSettlementNoteWithPDF(settlementNoteId, pdfMetadata);
      
      console.log(`✅ PDF généré avec succès: ${pdfMetadata.fileName} (ID: ${pdfId})`);
      
      const result = {
        success: true,
        pdfMetadata: {
          ...pdfMetadata,
          _id: pdfId
        },
        filePath: pdfMetadata.filePath
      };
      
      // Mettre en cache
      this.pdfCache.set(settlementNoteId, type, result);
      
      return result;

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }

  /**
   * Prépare les données pour le template
   */
  async prepareTemplateData(settlementNote, type) {
    const data = {
      // Logo BLD Solution Cours
      logoSolutionCours: "data:image/jpeg;base64,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",
      
      // Informations de base
      noteNumber: `${settlementNote._id.toString().slice(-8).toUpperCase()}`,
      formattedDate: new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      generationDate: new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      // Client
      clientName: settlementNote.clientName,
      clientAddress: this.formatClientAddress(settlementNote.familyId),
      department: settlementNote.department,
      
      // Mode de paiement
      paymentMethodLabel: this.getPaymentMethodLabel(settlementNote.paymentMethod),
      
      // Étudiants
      studentNames: settlementNote.studentIds?.map(student => 
        `${student.firstName} ${student.lastName}`
      ).join(', ') || 'Non renseigné',
      
      // Prestations
      subjects: await this.formatSubjects(settlementNote.subjects),
      
      // Totaux
      totalQuantity: settlementNote.totalQuantity || this.calculateTotalQuantity(settlementNote),
      totalRevenue: this.calculateTotalRevenue(settlementNote),
      totalHourlyRate: settlementNote.totalHourlyRate || this.calculateTotalRevenue(settlementNote),
      
      // Montants pour répartition client/URSSAF (50/50)
      clientAmount: (this.calculateTotalRevenue(settlementNote) / 2).toFixed(2),
      urssafAmount: (this.calculateTotalRevenue(settlementNote) / 2).toFixed(2),
      
      // ID Client généré
      clientId: settlementNote._id.toString().slice(-6),
      
      // Notes
      notes: settlementNote.notes,
      
      // Conditionnels pour les pages
      includeNdr: type === 'ndr' || type === 'both',
      includeCoupons: type === 'coupons' || type === 'both',
    };

    // Échéancier de paiement
    if (settlementNote.paymentSchedule) {
      data.paymentSchedule = {
        paymentMethodLabel: this.getPaymentMethodLabel(settlementNote.paymentSchedule.paymentMethod),
        numberOfInstallments: settlementNote.paymentSchedule.numberOfInstallments,
        dayOfMonth: settlementNote.paymentSchedule.dayOfMonth,
        installments: settlementNote.paymentSchedule.installments?.map((installment, index) => ({
          index: index + 1,
          dueDate: installment.dueDate ? new Date(installment.dueDate).toLocaleDateString('fr-FR') : 'Non définie',
          amount: (installment.amount || 0).toFixed(2),
          paymentMethod: settlementNote.paymentSchedule.paymentMethod === 'PRLV' ? 'PRLV' : 'AUTRE'
        })) || []
      };
    }

    // Données des coupons si nécessaire
    if (data.includeCoupons && settlementNote.couponSeriesId) {
      data.couponSeries = {
        code: settlementNote.couponSeriesId.code,
        startNumber: settlementNote.couponSeriesId.startNumber,
        endNumber: settlementNote.couponSeriesId.endNumber
      };
      
      data.totalCoupons = settlementNote.totalCoupons || 0;
      data.coupons = this.generateCouponsData(settlementNote);
    }

    // Logging pour debug
    console.log('🔍 Données préparées pour le template:', {
      noteNumber: data.noteNumber,
      clientName: data.clientName,
      clientAddress: data.clientAddress,
      totalRevenue: data.totalRevenue,
      totalQuantity: data.totalQuantity,
      subjectsCount: data.subjects?.length,
      hasPaymentSchedule: !!data.paymentSchedule,
      includeCoupons: data.includeCoupons,
      totalCoupons: data.totalCoupons
    });

    return data;
  }

  /**
   * Formate les matières pour l'affichage
   */
  async formatSubjects(subjects) {
    return subjects.map(subject => ({
      subjectName: subject.subjectId?.name || 'Matière non renseignée',
      hourlyRate: subject.hourlyRate || 0,
      quantity: subject.quantity || 0,
      professorSalary: subject.professorSalary || 0,
      total: (subject.hourlyRate || 0) * (subject.quantity || 0)
    }));
  }

  /**
   * Calcule le total des heures
   */
  calculateTotalQuantity(settlementNote) {
    return settlementNote.subjects.reduce((total, subject) => {
      return total + (subject.quantity || 0);
    }, 0);
  }

  /**
   * Calcule le chiffre d'affaires total
   */
  calculateTotalRevenue(settlementNote) {
    return settlementNote.subjects.reduce((total, subject) => {
      return total + ((subject.hourlyRate || 0) * (subject.quantity || 0));
    }, 0);
  }

  /**
   * Génère les données des coupons
   */
  generateCouponsData(settlementNote) {
    const coupons = [];
    const totalCoupons = settlementNote.totalCoupons || 0;
    const startNumber = settlementNote.couponSeriesId?.startNumber || 1;
    const seriesCode = settlementNote.couponSeriesId?.code || 'UNKNOWN';

    for (let i = 0; i < totalCoupons; i++) {
      coupons.push({
        number: startNumber + i,
        series: seriesCode
      });
    }

    return coupons;
  }

  /**
   * Rend le template HTML avec les données
   */
  async renderTemplate(data, type) {
    // Mise en cache du template HTML
    if (!this.cachedTemplate) {
      const templatePath = path.join(this.templatesDir, 'ndr-template.html');
      this.cachedTemplate = await fs.readFile(templatePath, 'utf8');
      // Minifier le HTML template
      this.cachedTemplate = this.cachedTemplate
        .replace(/>\s+</g, '><')  // Supprimer espaces entre tags
        .replace(/\s+/g, ' ')      // Réduire espaces multiples
        .trim();
    }

    // Remplacement simple des variables (simulation de Handlebars)
    const htmlTemplate = this.replaceTemplateVariables(this.cachedTemplate, data);

    return htmlTemplate;
  }

  /**
   * Remplace les variables dans le template (simulation basique de Handlebars)
   */
  replaceTemplateVariables(html, data) {
    let result = html;

    // Remplacement des variables simples {{variable}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = data[key] !== undefined && data[key] !== null ? data[key] : '';
      result = result.replace(regex, value);
    });

    // Gestion des conditions {{#if condition}}
    result = this.handleIfConditions(result, data);

    // Gestion des boucles {{#each array}}
    result = this.handleEachLoops(result, data);

    return result;
  }

  /**
   * Gère les conditions if dans le template
   */
  handleIfConditions(html, data) {
    let result = html;

    // Pattern pour {{#if condition}}...{{/if}}
    const ifPattern = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    result = result.replace(ifPattern, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    return result;
  }

  /**
   * Gère les boucles each dans le template
   */
  handleEachLoops(html, data) {
    let result = html;

    // Pattern pour {{#each array}}...{{/each}}
    const eachPattern = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    
    result = result.replace(eachPattern, (match, arrayName, template) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';

      return array.map((item, index) => {
        let itemHtml = template;
        
        // Remplacer {{this.property}}
        Object.keys(item).forEach(key => {
          const regex = new RegExp(`{{this\\.${key}}}`, 'g');
          itemHtml = itemHtml.replace(regex, item[key] || '');
        });

        // Remplacer {{@index}}
        itemHtml = itemHtml.replace(/{{@index}}/g, index + 1);

        // Remplacer {{../parentProperty}} pour accéder aux données parent
        Object.keys(data).forEach(key => {
          const regex = new RegExp(`{{\\.\\./${key}}}`, 'g');
          itemHtml = itemHtml.replace(regex, data[key] || '');
        });

        return itemHtml;
      }).join('');
    });

    return result;
  }

  /**
   * Génère le PDF à partir du HTML avec Puppeteer
   */
  async generatePDFFromHTML(html) {
    // Utiliser le pool de browsers au lieu de créer une nouvelle instance
    const browser = await this.browserPool.getBrowser();
    let page;

    try {
      page = await browser.newPage();
      
      // Optimisations de performance
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        // Bloquer les ressources inutiles
        if (['image', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Charger le CSS (mis en cache si possible)
      if (!this.cachedCSS) {
        const cssPath = path.join(this.templatesDir, 'ndr-styles.css');
        this.cachedCSS = await fs.readFile(cssPath, 'utf8');
        // Minifier le CSS
        this.cachedCSS = this.cachedCSS
          .replace(/\s+/g, ' ')
          .replace(/:\s+/g, ':')
          .replace(/;\s+/g, ';')
          .replace(/\{\s+/g, '{')
          .replace(/\}\s+/g, '}')
          .trim();
      }
      
      // Injecter le CSS minifié dans le HTML
      const htmlWithCSS = html.replace('<link rel="stylesheet" href="./ndr-styles.css" />', `<style>${this.cachedCSS}</style>`);
      
      await page.setContent(htmlWithCSS, { waitUntil: 'domcontentloaded' }); // Plus rapide que networkidle0

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        preferCSSPageSize: false
      });

      return pdf;
    } finally {
      if (page) {
        await page.close();
      }
      // Libérer le browser pour réutilisation
      this.browserPool.releaseBrowser(browser);
    }
  }

  /**
   * Sauvegarde le PDF et retourne les métadonnées
   */
  async savePDF(pdfBuffer, settlementNote, type) {
    // Créer le dossier s'il n'existe pas
    await fs.mkdir(this.uploadsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const noteId = settlementNote._id.toString().slice(-8);
    const fileName = `NDR-${noteId}-${type}-${timestamp}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);

    await fs.writeFile(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
      type,
      fileSize: pdfBuffer.length,
      totalPages: 1 // TODO: calculer le nombre réel de pages
    };
  }

  /**
   * Met à jour la note de règlement avec les métadonnées du PDF
   */
  async updateSettlementNoteWithPDF(settlementNoteId, pdfMetadata) {
    const result = await SettlementNote.findByIdAndUpdate(
      settlementNoteId,
      {
        $push: {
          generatedPDFs: {
            fileName: pdfMetadata.fileName,
            filePath: pdfMetadata.filePath,
            type: pdfMetadata.type,
            fileSize: pdfMetadata.fileSize,
            totalPages: pdfMetadata.totalPages,
            generatedAt: new Date()
          }
        }
      },
      { new: true }
    );

    // Retourner l'ID du PDF créé
    const createdPdf = result.generatedPDFs[result.generatedPDFs.length - 1];
    return createdPdf._id;
  }

  /**
   * Récupère un PDF généré
   */
  async getPDF(settlementNoteId, pdfId) {
    console.log(`🔍 Recherche PDF - Note: ${settlementNoteId}, PDF ID: ${pdfId}`);
    
    const settlementNote = await SettlementNote.findById(settlementNoteId);
    if (!settlementNote) {
      throw new Error('Note de règlement non trouvée');
    }

    console.log(`📋 PDFs disponibles:`, settlementNote.generatedPDFs.map(p => ({
      id: p._id,
      fileName: p.fileName
    })));

    // Chercher par ID MongoDB d'abord
    let pdf = settlementNote.generatedPDFs.id(pdfId);
    
    // Si pas trouvé, chercher par nom de fichier
    if (!pdf) {
      pdf = settlementNote.generatedPDFs.find(p => p.fileName === pdfId);
    }
    
    // Si toujours pas trouvé, chercher par partie du nom de fichier
    if (!pdf) {
      pdf = settlementNote.generatedPDFs.find(p => p.fileName.includes(pdfId));
    }

    if (!pdf) {
      console.log(`❌ PDF non trouvé avec ID: ${pdfId}`);
      throw new Error('PDF non trouvé');
    }

    console.log(`✅ PDF trouvé: ${pdf.fileName} à ${pdf.filePath}`);

    // Vérifier que le fichier existe
    try {
      await fs.access(pdf.filePath);
      return pdf;
    } catch (error) {
      console.log(`❌ Fichier PDF introuvable: ${pdf.filePath}`);
      throw new Error('Fichier PDF introuvable sur le disque');
    }
  }

  /**
   * Liste tous les PDFs d'une note de règlement
   */
  async listPDFs(settlementNoteId) {
    const settlementNote = await SettlementNote.findById(settlementNoteId);
    if (!settlementNote) {
      throw new Error('Note de règlement non trouvée');
    }

    return settlementNote.generatedPDFs.map(pdf => ({
      id: pdf._id,
      fileName: pdf.fileName,
      type: pdf.type,
      fileSize: pdf.fileSize,
      totalPages: pdf.totalPages,
      generatedAt: pdf.generatedAt
    }));
  }

  /**
   * Formate l'adresse du client
   */
  formatClientAddress(family) {
    if (!family || !family.address) {
      return 'Adresse non renseignée';
    }
    
    const address = family.address;
    let formattedAddress = '';
    
    if (address.street) formattedAddress += address.street;
    if (address.city) {
      if (formattedAddress) formattedAddress += '\n';
      formattedAddress += address.city;
    }
    if (address.postalCode) {
      if (address.city) {
        formattedAddress = formattedAddress.replace(address.city, `${address.postalCode} ${address.city}`);
      } else {
        if (formattedAddress) formattedAddress += '\n';
        formattedAddress += address.postalCode;
      }
    }
    
    return formattedAddress || 'Adresse non renseignée';
  }

  /**
   * Utilitaires pour les labels
   */
  getPaymentMethodLabel(method) {
    const labels = {
      card: 'Carte bancaire',
      check: 'Chèque',
      transfer: 'Virement',
      cash: 'Espèces',
      PRLV: 'Prélèvement automatique'
    };
    return labels[method] || method;
  }

  getStatusLabel(status) {
    const labels = {
      pending: 'En attente',
      paid: 'Payé',
      failed: 'Échec'
    };
    return labels[status] || status;
  }
}

// Export singleton instance
const pdfService = new PDFGenerationService();

// Cleanup on process termination
process.on('SIGINT', async () => {
  console.log('🔄 Fermeture du pool de browsers...');
  await pdfService.browserPool.closeAll();
  process.exit();
});

process.on('SIGTERM', async () => {
  console.log('🔄 Fermeture du pool de browsers...');
  await pdfService.browserPool.closeAll();
  process.exit();
});

module.exports = pdfService;