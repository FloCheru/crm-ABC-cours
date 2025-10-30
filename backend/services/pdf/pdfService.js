/**
 * Service principal de génération de PDFs
 * Orchestre: Templates Handlebars → Puppeteer → Chiffrement → GridFS
 */

const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

const { generatePDFFromHTML } = require('./pdf.renderer');
const { encryptPDF, decryptPDF } = require('./pdf.encryption');
const { savePDF, getPDF, deletePDF, listUserPDFs } = require('./pdf.storage');
const pdfCache = require('./pdf.cache');
const browserPool = require('./browserPool');
const PDF = require('../../models/PDF');

// Cache des templates Handlebars compilés
const templateCache = new Map();

/**
 * Compile un template Handlebars (avec cache)
 * @param {string} templateName - Nom du template (ex: 'fiche_paie')
 * @returns {Promise<Function>} - Template compilé
 */
async function getCompiledTemplate(templateName) {
  // Vérifier le cache
  if (templateCache.has(templateName)) {
    console.log(`📄 Template HIT: ${templateName}`);
    return templateCache.get(templateName);
  }

  // Charger et compiler le template
  const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);

  try {
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);

    // Mettre en cache
    templateCache.set(templateName, compiledTemplate);
    console.log(`📄 Template compilé et mis en cache: ${templateName}`);

    return compiledTemplate;
  } catch (error) {
    console.error(`❌ Erreur chargement template ${templateName}:`, error);
    throw new Error(`Template ${templateName} introuvable: ${error.message}`);
  }
}

/**
 * Génère un PDF à partir d'un template et de données
 * @param {string} type - Type de PDF ('fiche_paie', 'NDR', etc.)
 * @param {Object} data - Données à injecter dans le template
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userModel - Modèle de l'utilisateur ('Teacher' ou 'Admin')
 * @param {number} version - Version du document (optionnel)
 * @returns {Promise<{ pdfId: string, gridFsFileId: string }>}
 */
async function generatePDF(type, data, userId, userModel, version = 1) {
  console.log(`\n🚀 Génération PDF: type=${type}, userId=${userId}, version=${version}`);

  try {
    // 1. Vérifier le cache
    const cachedPDF = pdfCache.get(type, userId, version);
    if (cachedPDF) {
      console.log(`📦 PDF trouvé dans le cache, récupération depuis GridFS...`);
      return cachedPDF;
    }

    // 2. Compiler le template Handlebars
    const template = await getCompiledTemplate(type);
    const html = template(data);

    // 3. Générer le PDF avec Puppeteer
    console.log(`🖨️ Génération PDF avec Puppeteer...`);
    const pdfBuffer = await generatePDFFromHTML(html, browserPool);
    console.log(`✅ PDF généré: ${pdfBuffer.length} bytes`);

    // 4. Chiffrer le PDF
    console.log(`🔐 Chiffrement du PDF...`);
    const { encrypted, iv } = encryptPDF(pdfBuffer);

    // 5. Sauvegarder dans GridFS
    console.log(`💾 Sauvegarde dans GridFS...`);
    const filename = `${type}_${userId}_${version}_${Date.now()}.pdf`;
    const gridFsFileId = await savePDF(encrypted, {
      filename,
      type,
      userId,
      iv,
      version
    });

    // 6. Créer l'entrée de métadonnées dans MongoDB
    console.log(`📝 Création des métadonnées...`);
    const pdfDoc = new PDF({
      gridFsFileId,
      type,
      userId,
      userModel,
      version,
      metadata: extractMetadata(type, data),
      status: 'generated',
      accessLog: [{
        action: 'generated',
        by: userId,
        byModel: userModel,
        at: new Date()
      }]
    });

    await pdfDoc.save();

    // 7. Mettre en cache
    const result = {
      pdfId: pdfDoc._id.toString(),
      gridFsFileId
    };
    pdfCache.set(type, userId, version, result);

    console.log(`✅ PDF généré avec succès: ${pdfDoc._id}`);
    return result;

  } catch (error) {
    console.error(`❌ Erreur génération PDF:`, error);
    throw error;
  }
}

/**
 * Récupère un PDF déchiffré
 * @param {string} pdfId - ID du document PDF (métadonnées)
 * @param {string} requesterId - ID de l'utilisateur qui fait la requête
 * @param {string} requesterModel - Modèle du requester
 * @returns {Promise<Buffer>} - PDF déchiffré
 */
async function retrievePDF(pdfId, requesterId, requesterModel) {
  console.log(`\n📥 Récupération PDF: ${pdfId}`);

  try {
    // 1. Récupérer les métadonnées
    const pdfDoc = await PDF.findById(pdfId).notDeleted();

    if (!pdfDoc) {
      throw new Error(`PDF ${pdfId} non trouvé ou supprimé`);
    }

    // 2. Vérifier les permissions
    // Admin peut tout voir, Professor ne peut voir que ses propres PDFs
    if (requesterModel === 'Professor' && pdfDoc.userId.toString() !== requesterId) {
      throw new Error(`Accès refusé au PDF ${pdfId}`);
    }

    // 3. Récupérer le PDF chiffré depuis GridFS
    console.log(`📥 Téléchargement depuis GridFS: ${pdfDoc.gridFsFileId}`);
    const { buffer: encryptedBuffer, metadata } = await getPDF(pdfDoc.gridFsFileId);

    // 4. Déchiffrer le PDF
    console.log(`🔓 Déchiffrement du PDF...`);
    const pdfBuffer = decryptPDF(encryptedBuffer, metadata.iv);

    // 5. Logger l'accès
    await pdfDoc.logAccess('downloaded', requesterId, requesterModel);

    console.log(`✅ PDF récupéré avec succès: ${pdfBuffer.length} bytes`);
    return pdfBuffer;

  } catch (error) {
    console.error(`❌ Erreur récupération PDF:`, error);
    throw error;
  }
}

/**
 * Liste les PDFs d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} type - Type de PDF (optionnel)
 * @returns {Promise<Array>} - Liste des PDFs
 */
async function listPDFs(userId, type = null) {
  const query = { userId, deletedAt: null };
  if (type) {
    query.type = type;
  }

  const pdfs = await PDF.find(query)
    .sort({ createdAt: -1 })
    .select('-accessLog')
    .lean();

  console.log(`📋 ${pdfs.length} PDFs trouvés pour user ${userId}`);
  return pdfs;
}

/**
 * Supprime un PDF (soft delete)
 * @param {string} pdfId - ID du PDF
 * @param {string} deleterId - ID de l'utilisateur qui supprime
 * @param {string} deleterModel - Modèle du deleter
 * @returns {Promise<void>}
 */
async function removePDF(pdfId, deleterId, deleterModel) {
  console.log(`\n🗑️ Suppression PDF: ${pdfId}`);

  try {
    const pdfDoc = await PDF.findById(pdfId);

    if (!pdfDoc) {
      throw new Error(`PDF ${pdfId} non trouvé`);
    }

    // Vérifier les permissions
    if (deleterModel === 'Professor' && pdfDoc.userId.toString() !== deleterId) {
      throw new Error(`Accès refusé pour supprimer le PDF ${pdfId}`);
    }

    // Soft delete
    await pdfDoc.softDelete();
    await pdfDoc.logAccess('deleted', deleterId, deleterModel);

    // Invalider le cache
    pdfCache.invalidate(pdfDoc.type, pdfDoc.userId.toString(), pdfDoc.version);

    console.log(`✅ PDF supprimé (soft delete): ${pdfId}`);

  } catch (error) {
    console.error(`❌ Erreur suppression PDF:`, error);
    throw error;
  }
}

/**
 * Suppression définitive d'un PDF (hard delete) - ADMIN ONLY
 * @param {string} pdfId - ID du PDF
 * @returns {Promise<void>}
 */
async function hardDeletePDF(pdfId) {
  console.log(`\n🗑️ Suppression DÉFINITIVE PDF: ${pdfId}`);

  try {
    const pdfDoc = await PDF.findById(pdfId);

    if (!pdfDoc) {
      throw new Error(`PDF ${pdfId} non trouvé`);
    }

    // Supprimer de GridFS
    await deletePDF(pdfDoc.gridFsFileId);

    // Supprimer les métadonnées
    await PDF.findByIdAndDelete(pdfId);

    // Invalider le cache
    pdfCache.invalidate(pdfDoc.type, pdfDoc.userId.toString(), pdfDoc.version);

    console.log(`✅ PDF supprimé définitivement: ${pdfId}`);

  } catch (error) {
    console.error(`❌ Erreur suppression définitive PDF:`, error);
    throw error;
  }
}

/**
 * Extrait les métadonnées spécifiques au type de PDF
 * @param {string} type - Type de PDF
 * @param {Object} data - Données du template
 * @returns {Object} - Métadonnées extraites
 */
function extractMetadata(type, data) {
  const metadata = {};

  switch (type) {
    case 'fiche_paie':
      metadata.period = data.period;
      metadata.salaryAmount = data.salary?.net || 0;
      break;

    case 'NDR':
      metadata.ndrId = data.ndrId;
      metadata.familyId = data.familyId;
      metadata.totalAmount = data.totalAmount;
      metadata.couponCount = data.coupons?.length || 0;
      break;

    case 'convention':
      metadata.startDate = data.startDate;
      metadata.endDate = data.endDate;
      break;

    case 'facture':
      metadata.invoiceNumber = data.invoiceNumber;
      metadata.invoiceDate = data.invoiceDate;
      metadata.totalAmount = data.totalAmount;
      break;
  }

  return metadata;
}

/**
 * Invalide le cache d'un template (après modification du .hbs)
 * @param {string} templateName - Nom du template
 */
function invalidateTemplateCache(templateName) {
  if (templateCache.has(templateName)) {
    templateCache.delete(templateName);
    console.log(`🔄 Cache template invalidé: ${templateName}`);
  }
}

module.exports = {
  generatePDF,
  retrievePDF,
  listPDFs,
  removePDF,
  hardDeletePDF,
  invalidateTemplateCache
};
