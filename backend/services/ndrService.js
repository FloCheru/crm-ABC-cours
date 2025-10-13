const NDR = require("../models/NDR");
const Family = require("../models/Family");
const CacheManager = require("../cache/cacheManager");
const mongoose = require("mongoose");

class CouponService {
  /**
   * Récupère tous les coupons de la base de données (embeddés dans les NDR)
   * @returns {Array} - Tableau de tous les coupons {id, }
   */
  static async getAllCoupons() {
    try {
      const result = await NDR.aggregate([
        { $match: { coupons: { $exists: true, $ne: [] } } },
        { $unwind: "$coupons" },
        {
          $project: {
            coupon: "$coupons",
            ndrId: "$_id",
            familyId: 1,
            subjects: 1,
            hourlyRate: 1,
            ndrCreatedAt: "$createdAt",
          },
        },
      ]);

      console.log(`🔍 [COUPON-DEBUG] getAllCoupons() - Nombre de coupons trouvés: ${result.length}`);
      if (result.length > 0) {
        const existingCodes = result.map(r => r.coupon.code).sort();
        console.log(`🔍 [COUPON-DEBUG] Codes existants: [${existingCodes.join(', ')}]`);
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de la récupération des coupons:", error);
      throw error;
    }
  }

  /**
   * Génère un code de coupon unique en hexadécimal
   * @param {number} index - Index du coupon (1, 2, 3...)
   * @returns {string} - Code hexadécimal du coupon
   */
  static async generateCouponCode(index) {
    const allCoupons = await this.getAllCoupons();

    // Trouver le code maximum existant (en convertissant hex -> decimal)
    let maxCode = 0;
    if (allCoupons.length > 0) {
      maxCode = Math.max(...allCoupons.map(c => parseInt(c.coupon.code, 16) || 0));
    }

    const number = maxCode + index + 1;
    const code = number.toString(16).toUpperCase();

    console.log(`🔍 [COUPON-DEBUG] generateCouponCode(index=${index})`);
    console.log(`   - Coupons existants: ${allCoupons.length}`);
    console.log(`   - Code max existant (hex->dec): ${maxCode}`);
    console.log(`   - Calcul: ${maxCode} + ${index} + 1 = ${number}`);
    console.log(`   - Code généré: "${code}"`);

    return code;
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
  static async getCouponSeriesStats(couponSeriesId) {}

  /**
   * Recherche un coupon par son code
   * @param {string} code - Code du coupon
   * @returns {Object} - Le coupon avec ses informations
   */
  static async findCouponByCode(code) {
    try {
      const coupon = await Coupon.findOne({ code })
        .populate("couponSeriesId", "NDRId familyId subject hourlyRate")
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

class NdrService {
  /**
   * Récupère toutes les NDRs
   * @returns {Array} - Tableau de toutes les NDRs
   */
  static async getAllNDRs() {
    try {
      const ndrs = await NDR.find()
        .populate("familyId", "primaryContact address")
        .populate("subjects.id", "name category")
        .populate("createdBy.userId", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean();

      // Aplatir la structure subjects pour chaque NDR et renommer _id en id
      return ndrs.map(ndr => ({
        ...ndr,
        subjects: ndr.subjects?.map(subject => {
          const subjectData = subject.id;
          if (subjectData && typeof subjectData === 'object') {
            return {
              id: subjectData._id,
              name: subjectData.name,
              category: subjectData.category
            };
          }
          return subjectData;
        }) || []
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des NDRs:", error);
      throw error;
    }
  }

  /**
   * Récupère une NDR par son ID
   * @param {string} ndrId - ID de la NDR
   * @returns {Object} - La NDR avec ses détails
   */
  static async getNDRById(ndrId) {
    try {
      const ndr = await NDR.findById(ndrId)
        .populate("familyId", "primaryContact address students")
        .populate("subjects.id", "name category")
        .populate("createdBy.userId", "firstName lastName")
        .populate("professor.id", "firstName lastName")
        .lean();

      if (!ndr) {
        throw new Error("NDR non trouvée");
      }

      // Aplatir la structure subjects et renommer _id en id
      if (ndr.subjects) {
        ndr.subjects = ndr.subjects.map(subject => {
          const subjectData = subject.id;
          if (subjectData && typeof subjectData === 'object') {
            return {
              id: subjectData._id,
              name: subjectData.name,
              category: subjectData.category
            };
          }
          return subjectData;
        });
      }

      return ndr;
    } catch (error) {
      console.error("Erreur lors de la récupération de la NDR:", error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle NDR avec génération automatique des coupons
   * @param {Object} ndrData - Données de la NDR
   * @returns {Object} - La NDR créée
   */
  static async createNDR(ndrData) {
    //1) Format NDR : ajout des coupons
    try {
      console.log(`\n🔍 [COUPON-DEBUG] ===== DÉBUT createNDR() =====`);
      console.log(`🔍 [COUPON-DEBUG] Quantité de coupons à générer: ${ndrData.quantity}`);

      // Générer les coupons
      const coupons = [];
      for (let i = 0; i < ndrData.quantity; i++) {
        console.log(`\n🔍 [COUPON-DEBUG] --- Génération coupon ${i + 1}/${ndrData.quantity} (index=${i}) ---`);
        const couponCode = await CouponService.generateCouponCode(i);
        coupons.push({
          id: new mongoose.Types.ObjectId(),
          code: couponCode,
          status: "available",
          updatedAt: new Date(),
        });
        console.log(`🔍 [COUPON-DEBUG] Coupon ajouté à la liste: code="${couponCode}"`);
      }

      console.log(`\n🔍 [COUPON-DEBUG] Tous les coupons générés pour cette NDR: [${coupons.map(c => c.code).join(', ')}]`);

      const ndrWithCoupons = {
        ...ndrData,
        coupons,
      };
      //2) Enregistrement de la NDR en base

      const newNDR = new NDR(ndrWithCoupons);
      const savedNDR = await newNDR.save();

      //3) Récupération de la NDR en base pour la réponse
      const finalNDR = await this.getNDRById(savedNDR._id);

      //4) Ajout de la NDR à la famille
      await Family.findByIdAndUpdate(
        finalNDR.familyId,
        { $push: { ndr: { id: savedNDR._id } } }
      );

      //5) Invalider les caches après création de la NDR
      CacheManager.invalidate("families", "families_list*");
      CacheManager.invalidate("families", "families_stats");
      CacheManager.invalidate("ndrs", "ndrs_list*");

      return finalNDR;
    } catch (error) {
      console.error(
        "❌ [NDR-SERVICE] ERREUR lors de la création de la NDR:",
        error
      );
      console.error("❌ [NDR-SERVICE] Stack trace:", error.stack);
      throw error;
    }
  }
}

module.exports = { CouponService, NdrService };
