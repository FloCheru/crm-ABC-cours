/**
 * Stockage des PDFs chiffrés dans MongoDB GridFS
 * GridFS permet de stocker des fichiers binaires > 16MB
 */

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

let gfsBucket;

/**
 * Initialise le bucket GridFS
 * À appeler après connexion MongoDB
 */
function initGridFS() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('❌ MongoDB non connectée. Appeler initGridFS() après mongoose.connect()');
  }

  gfsBucket = new GridFSBucket(db, {
    bucketName: 'pdfs' // Collection: pdfs.files et pdfs.chunks
  });

  console.log('✅ GridFS bucket "pdfs" initialisé');
}

/**
 * Sauvegarde un PDF chiffré dans GridFS
 * @param {Buffer} encryptedBuffer - PDF chiffré
 * @param {Object} metadata - Métadonnées du PDF
 * @returns {Promise<string>} - ID du fichier GridFS
 */
function savePDF(encryptedBuffer, metadata) {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error('❌ GridFS non initialisé. Appeler initGridFS() d\'abord'));
    }

    // Créer un stream readable depuis le buffer
    const readableStream = Readable.from(encryptedBuffer);

    // Créer un upload stream vers GridFS
    const uploadStream = gfsBucket.openUploadStream(metadata.filename, {
      metadata: {
        type: metadata.type,          // 'fiche_paie', 'NDR', 'convention', 'facture'
        userId: metadata.userId,       // ID du professeur/utilisateur
        iv: metadata.iv,               // IV pour déchiffrement
        version: metadata.version || 1,
        createdAt: new Date()
      }
    });

    // Gérer les événements
    uploadStream.on('error', (error) => {
      console.error('❌ Erreur upload GridFS:', error);
      reject(error);
    });

    uploadStream.on('finish', () => {
      const fileId = uploadStream.id.toString();
      console.log(`💾 PDF sauvegardé dans GridFS: ${fileId} (${encryptedBuffer.length} bytes)`);
      resolve(fileId);
    });

    // Pipe le buffer vers GridFS
    readableStream.pipe(uploadStream);
  });
}

/**
 * Récupère un PDF depuis GridFS
 * @param {string} fileId - ID du fichier GridFS
 * @returns {Promise<{ buffer: Buffer, metadata: Object }>}
 */
function getPDF(fileId) {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error('❌ GridFS non initialisé'));
    }

    const chunks = [];

    // Créer un download stream depuis GridFS
    const downloadStream = gfsBucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('error', (error) => {
      console.error('❌ Erreur download GridFS:', error);
      reject(error);
    });

    downloadStream.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      // Récupérer les métadonnées du fichier
      const files = await gfsBucket.find({
        _id: new mongoose.Types.ObjectId(fileId)
      }).toArray();

      if (files.length === 0) {
        return reject(new Error(`❌ PDF ${fileId} non trouvé dans GridFS`));
      }

      const metadata = files[0].metadata;
      console.log(`📥 PDF récupéré depuis GridFS: ${fileId} (${buffer.length} bytes)`);

      resolve({ buffer, metadata });
    });
  });
}

/**
 * Supprime un PDF de GridFS
 * @param {string} fileId - ID du fichier à supprimer
 * @returns {Promise<void>}
 */
async function deletePDF(fileId) {
  if (!gfsBucket) {
    throw new Error('❌ GridFS non initialisé');
  }

  try {
    await gfsBucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log(`🗑️ PDF supprimé de GridFS: ${fileId}`);
  } catch (error) {
    console.error('❌ Erreur suppression GridFS:', error);
    throw error;
  }
}

/**
 * Liste les PDFs d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} type - Type de PDF (optionnel)
 * @returns {Promise<Array>} - Liste des fichiers
 */
async function listUserPDFs(userId, type = null) {
  if (!gfsBucket) {
    throw new Error('❌ GridFS non initialisé');
  }

  const query = { 'metadata.userId': userId };
  if (type) {
    query['metadata.type'] = type;
  }

  const files = await gfsBucket.find(query).toArray();

  console.log(`📋 ${files.length} PDFs trouvés pour user ${userId}${type ? ` (type: ${type})` : ''}`);

  return files.map(file => ({
    fileId: file._id.toString(),
    filename: file.filename,
    type: file.metadata.type,
    version: file.metadata.version,
    createdAt: file.metadata.createdAt,
    size: file.length
  }));
}

module.exports = {
  initGridFS,
  savePDF,
  getPDF,
  deletePDF,
  listUserPDFs
};
