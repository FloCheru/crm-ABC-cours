const Coupon = require("../models/Coupon");

// Système de numérotation en base 32
const BASE32_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclut I, O, Q
const BASE32_LENGTH = BASE32_CHARS.length;

/**
 * Convertit un nombre décimal en base 32
 * @param {number} decimal - Nombre décimal
 * @param {number} minLength - Longueur minimale du code (optionnel)
 * @returns {string} - Code en base 32
 */
function decimalToBase32(decimal, minLength = 1) {
  if (decimal === 0) return "0";

  let result = "";
  let num = decimal;

  while (num > 0) {
    result = BASE32_CHARS[num % BASE32_LENGTH] + result;
    num = Math.floor(num / BASE32_LENGTH);
  }

  // Ajouter des zéros en tête si nécessaire
  while (result.length < minLength) {
    result = "0" + result;
  }

  return result;
}

/**
 * Génère un code de coupon unique avec préfixe de série
 * @param {string} seriesId - ID de la série (6 premiers caractères)
 * @param {number} couponNumber - Numéro du coupon dans la série
 * @returns {string} - Code unique du coupon
 */
function generateCouponCode(seriesId, couponNumber) {
  const seriesPrefix = seriesId.substring(0, 6).toUpperCase();
  const base32Number = decimalToBase32(couponNumber, 3); // Minimum 3 caractères
  return `${seriesPrefix}-${base32Number}`;
}

/**
 * Décode un code de coupon pour obtenir le numéro
 * @param {string} code - Code du coupon (ex: "ABC123-001")
 * @returns {number} - Numéro du coupon
 */
function decodeCouponCode(code) {
  const parts = code.split("-");
  if (parts.length !== 2) {
    throw new Error("Format de code invalide");
  }

  const base32Number = parts[1];
  let result = 0;

  for (let i = 0; i < base32Number.length; i++) {
    const char = base32Number[i];
    const charValue = BASE32_CHARS.indexOf(char);
    if (charValue === -1) {
      throw new Error("Caractère invalide dans le code");
    }
    result = result * BASE32_LENGTH + charValue;
  }

  return result;
}

/**
 * Génère un code de coupon unique en vérifiant qu'il n'existe pas déjà
 * @param {string} seriesId - ID de la série
 * @param {number} couponNumber - Numéro du coupon dans la série
 * @returns {Promise<string>} - Code unique du coupon
 */
async function generateUniqueCouponCode(seriesId, couponNumber) {
  let attempts = 0;
  const maxAttempts = 10; // Limite de sécurité

  while (attempts < maxAttempts) {
    const couponCode = generateCouponCode(seriesId, couponNumber + attempts);

    // Vérifier que le code n'existe pas déjà
    const Coupon = require("../models/Coupon");
    const existingCoupon = await Coupon.findOne({ code: couponCode });

    if (!existingCoupon) {
      return couponCode; // Code unique trouvé
    }

    attempts++;
    console.log(`Code ${couponCode} existe déjà, tentative ${attempts + 1}`);
  }

  // Si on arrive ici, utiliser un timestamp pour garantir l'unicité
  const timestamp = Date.now().toString(36).substring(0, 4);
  const baseCode = generateCouponCode(seriesId, couponNumber);
  return `${baseCode}-${timestamp}`;
}

class CouponGenerationService {
  /**
   * Marque un coupon comme utilisé
   * @param {string} couponId - ID du coupon
   * @param {Object} sessionData - Données de la session
   * @param {string} usedBy - ID de l'utilisateur qui utilise le coupon
   * @returns {Object} - Le coupon mis à jour
   */
  static async useCoupon(couponId, sessionData, usedBy) {
    try {
      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        throw new Error("Coupon non trouvé");
      }

      // Marquer le coupon comme utilisé
      await coupon.markAsUsed(sessionData, usedBy);

      // Mettre à jour le compteur dans la série
      const couponSeries = await CouponSeries.findById(coupon.couponSeriesId);
      if (couponSeries) {
        couponSeries.useCoupon();
        await couponSeries.save();
      }

      return coupon;
    } catch (error) {
      console.error("Erreur lors de l'utilisation du coupon:", error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'une série de coupons
   * @param {string} couponSeriesId - ID de la série
   * @returns {Object} - Statistiques de la série
   */
  static async getCouponSeriesStats(couponSeriesId) {
    try {
      const couponSeries = await CouponSeries.findById(couponSeriesId);
      if (!couponSeries) {
        throw new Error("Série de coupons non trouvée");
      }

      const stats = {
        totalCoupons: couponSeries.totalCoupons,
        usedCoupons: couponSeries.usedCoupons,
        remainingCoupons: couponSeries.getRemainingCoupons(),
        status: couponSeries.status,
        usagePercentage: (
          (couponSeries.usedCoupons / couponSeries.totalCoupons) *
          100
        ).toFixed(1),
      };

      return stats;
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      throw error;
    }
  }

  /**
   * Recherche un coupon par son code
   * @param {string} code - Code du coupon
   * @returns {Object} - Le coupon avec ses informations
   */
  static async findCouponByCode(code) {
    try {
      const coupon = await Coupon.findOne({ code })
        .populate(
          "couponSeriesId",
          "settlementNoteId familyId subject hourlyRate"
        )
        .populate("familyId", "name")
        .lean();

      if (!coupon) {
        throw new Error("Coupon non trouvé");
      }

      return coupon;
    } catch (error) {
      console.error("Erreur lors de la recherche du coupon:", error);
      throw error;
    }
  }
}

module.exports = CouponGenerationService;

// Export des fonctions utilitaires pour usage direct
module.exports.generateCouponCode = generateCouponCode;
module.exports.generateUniqueCouponCode = generateUniqueCouponCode;
