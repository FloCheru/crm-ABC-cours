const CouponSeries = require("../models/CouponSeries");
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
   * Génère automatiquement une série de coupons pour une note de règlement
   * @param {Object} settlementNote - La note de règlement
   * @param {string} createdBy - ID de l'utilisateur créateur
   * @returns {Object} - La série de coupons créée avec ses coupons
   */
  static async generateCouponSeries(settlementNote, createdBy) {
    try {
      // Gérer la compatibilité avec l'ancien format (studentId) et le nouveau (studentIds)
      let studentIds = [];
      if (settlementNote.studentIds && Array.isArray(settlementNote.studentIds)) {
        studentIds = settlementNote.studentIds;
      } else if (settlementNote.studentId) {
        studentIds = [settlementNote.studentId];
      }

      // Vérifier qu'au moins un élève est spécifié
      if (!studentIds || studentIds.length === 0) {
        throw new Error("Au moins un élève requis pour créer la série de coupons");
      }

      // Calculer le nombre total de coupons basé sur les matières et quantités
      let totalCoupons = 0;
      if (settlementNote.subjects && Array.isArray(settlementNote.subjects)) {
        // Nouveau format avec multiples matières
        totalCoupons = settlementNote.subjects.reduce((sum, subject) => {
          return sum + Math.ceil(subject.quantity);
        }, 0) * studentIds.length; // Multiplier par le nombre d'élèves
      } else {
        // Ancien format avec une seule matière
        totalCoupons = Math.ceil(settlementNote.quantity) * studentIds.length;
      }

      // Créer la série de coupons (adapter pour multiples élèves/matières)
      const couponSeries = new CouponSeries({
        settlementNoteId: settlementNote._id,
        familyId: settlementNote.familyId,
        studentId: studentIds[0], // Garder le premier pour compatibilité
        studentIds: studentIds, // Nouveau champ pour multiples élèves
        totalCoupons,
        usedCoupons: 0,
        status: "active",
        // Gérer les matières multiples ou unique
        subject: settlementNote.subjects && settlementNote.subjects.length > 0 
          ? settlementNote.subjects[0].subjectId 
          : settlementNote.subject,
        subjects: settlementNote.subjects, // Nouveau champ pour multiples matières
        hourlyRate: settlementNote.subjects && settlementNote.subjects.length > 0
          ? settlementNote.subjects[0].hourlyRate
          : settlementNote.hourlyRate,
        professorSalary: settlementNote.subjects && settlementNote.subjects.length > 0
          ? settlementNote.subjects[0].professorSalary
          : settlementNote.professorSalary,
        createdBy,
        coupons: [], // Sera rempli après création des coupons
      });

      await couponSeries.save();

      // Générer les coupons individuels
      const coupons = [];
      for (let i = 1; i <= totalCoupons; i++) {
        const couponCode = await generateUniqueCouponCode(
          couponSeries._id.toString(),
          i
        );

        // Debug: vérifier que le code n'est pas null
        console.log("🔍 DEBUG - Génération coupon:", {
          seriesId: couponSeries._id.toString(),
          couponIndex: i,
          couponCode: couponCode,
        });

        if (!couponCode) {
          throw new Error(
            `Erreur: Impossible de générer le code pour le coupon ${i}`
          );
        }

        const coupon = new Coupon({
          couponSeriesId: couponSeries._id,
          familyId: settlementNote.familyId,
          code: couponCode, // Code unique généré (ex: "ABC123-001")
          status: "available",
        });

        await coupon.save();
        coupons.push(coupon._id);
      }

      // Mettre à jour la série avec les références des coupons
      couponSeries.coupons = coupons;
      await couponSeries.save();

      console.log(
        `Série de ${totalCoupons} coupons générée pour la NDR ${settlementNote._id}`
      );

      return {
        couponSeries,
        coupons,
        totalCoupons,
      };
    } catch (error) {
      console.error("Erreur lors de la génération des coupons:", error);
      throw new Error(
        `Erreur lors de la génération des coupons: ${error.message}`
      );
    }
  }

  /**
   * Récupère une série de coupons par ID de note de règlement
   * @param {string} settlementNoteId - ID de la note de règlement
   * @returns {Object} - La série de coupons avec ses coupons
   */
  static async getCouponSeriesBySettlementNote(settlementNoteId) {
    try {
      const couponSeries = await CouponSeries.findOne({ settlementNoteId })
        .populate("coupons")
        .populate("subject", "name category")
        .populate("familyId", "name");

      if (!couponSeries) {
        throw new Error(
          "Aucune série de coupons trouvée pour cette note de règlement"
        );
      }

      return couponSeries;
    } catch (error) {
      console.error("Erreur lors de la récupération de la série:", error);
      throw error;
    }
  }

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
      console.error(
        "Erreur lors de la récupération des statistiques:",
        error
      );
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
