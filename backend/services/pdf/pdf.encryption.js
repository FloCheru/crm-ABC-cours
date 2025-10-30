/**
 * Module de chiffrement/déchiffrement des PDFs
 * Utilise AES-256-CBC avec IV unique par document
 */

const crypto = require('crypto');

// Clé de chiffrement depuis .env (32 bytes en hex = 64 caractères)
const ENCRYPTION_KEY = process.env.PDF_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

// Validation de la clé au démarrage
if (!ENCRYPTION_KEY) {
  throw new Error('❌ PDF_ENCRYPTION_KEY manquante dans .env');
}

if (ENCRYPTION_KEY.length !== 64) {
  throw new Error(`❌ PDF_ENCRYPTION_KEY invalide: doit faire 64 caractères hex (32 bytes), reçu ${ENCRYPTION_KEY.length}`);
}

/**
 * Chiffre un PDF avec AES-256-CBC
 * @param {Buffer} pdfBuffer - Buffer du PDF à chiffrer
 * @returns {{ encrypted: Buffer, iv: string }} - PDF chiffré + IV en hex
 */
function encryptPDF(pdfBuffer) {
  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new Error('encryptPDF() requiert un Buffer');
  }

  // Générer un IV unique (16 bytes pour AES)
  const iv = crypto.randomBytes(16);

  // Créer le cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  // Chiffrer le PDF
  let encrypted = cipher.update(pdfBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  console.log(`🔐 PDF chiffré: ${pdfBuffer.length} bytes → ${encrypted.length} bytes`);

  return {
    encrypted,
    iv: iv.toString('hex') // Stocker l'IV en hex pour MongoDB
  };
}

/**
 * Déchiffre un PDF avec AES-256-CBC
 * @param {Buffer} encryptedBuffer - Buffer du PDF chiffré
 * @param {string} ivHex - IV en format hexadécimal
 * @returns {Buffer} - PDF déchiffré
 */
function decryptPDF(encryptedBuffer, ivHex) {
  if (!Buffer.isBuffer(encryptedBuffer)) {
    throw new Error('decryptPDF() requiert un Buffer pour encryptedBuffer');
  }

  if (!ivHex || typeof ivHex !== 'string') {
    throw new Error('decryptPDF() requiert un IV en hex string');
  }

  // Créer le decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  // Déchiffrer le PDF
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  console.log(`🔓 PDF déchiffré: ${encryptedBuffer.length} bytes → ${decrypted.length} bytes`);

  return decrypted;
}

module.exports = {
  encryptPDF,
  decryptPDF
};
