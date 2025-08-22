const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const SettlementNote = require('../models/SettlementNote');

class PDFGenerationService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    this.uploadsDir = path.join(__dirname, '../uploads/pdfs');
  }

  /**
   * Génère un PDF pour une note de règlement
   */
  async generatePDF(settlementNoteId, type = 'ndr', userId) {
    try {
      console.log(`🚀 Génération PDF - Note: ${settlementNoteId}, Type: ${type}`);
      
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
      
      return {
        success: true,
        pdfMetadata: {
          ...pdfMetadata,
          _id: pdfId
        },
        filePath: pdfMetadata.filePath
      };

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
      // Informations de base
      noteNumber: `NDR-${settlementNote._id.toString().slice(-8).toUpperCase()}`,
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
      salaryToPay: settlementNote.salaryToPay || 0,
      chargesToPay: settlementNote.chargesToPay || 0,
      marginAmount: settlementNote.marginAmount || 0,
      marginPercentage: Math.round((settlementNote.marginPercentage || 0) * 100) / 100,
      
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
          formattedDate: installment.dueDate ? installment.dueDate.toLocaleDateString('fr-FR') : 'Non définie',
          amount: installment.amount || 0,
          status: installment.status,
          statusLabel: this.getStatusLabel(installment.status)
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
    const templatePath = path.join(this.templatesDir, 'ndr-template.html');
    let htmlTemplate = await fs.readFile(templatePath, 'utf8');

    // Remplacement simple des variables (simulation de Handlebars)
    htmlTemplate = this.replaceTemplateVariables(htmlTemplate, data);

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
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Charger le CSS
      const cssPath = path.join(this.templatesDir, 'ndr-styles.css');
      const css = await fs.readFile(cssPath, 'utf8');
      
      // Injecter le CSS dans le HTML
      const htmlWithCSS = html.replace('<link rel="stylesheet" href="./ndr-styles.css">', `<style>${css}</style>`);
      
      await page.setContent(htmlWithCSS, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });

      return pdf;
    } finally {
      await browser.close();
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

module.exports = new PDFGenerationService();