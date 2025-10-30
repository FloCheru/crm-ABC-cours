const Family = require("../models/Family");
const User = require("../models/User");
const RendezVous = require("../models/RDV");
const Ndr = require("../models/NDR");
const Subject = require("../models/Subject");
const CacheManager = require("../cache/cacheManager");
const mongoose = require("mongoose");

class FamilyService {
  static async getFamilies(limit = 10000) {
    try {
      // 1. Check cache first
      const cached = CacheManager.getFamiliesList();
      if (cached) return cached;

      // 2. Cache miss - Query DB
      console.log("Cache miss: families list - querying database");
      const families = await Family.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const formattedFamilies = await Promise.all(
        families.map((family) => this.formatFamilyForCache(family))
      );

      // 3. Store in cache
      CacheManager.setFamiliesList(formattedFamilies);
      console.log(
        `Cache set: families list (${formattedFamilies.length} families)`
      );

      return formattedFamilies;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des familles formatées:",
        error
      );
      throw new Error("Erreur lors de la récupération des familles");
    }
  }

  static async formatFamilyForCache(family) {
    try {
      // Récupérer les IDs des matières pour populate
      const subjectIds = family.demande?.subjects?.map((s) => s.id) || [];

      // Récupérer les données liées
      const [createdByUser, rdvs, subjects] = await Promise.all([
        User.findById(family.createdBy.userId)
          .select("firstName lastName")
          .lean(),
        RendezVous.find({ familyId: family._id })
          .populate("assignedAdminId", "firstName lastName")
          .sort({ date: -1 })
          .lean(),
        Subject.find({ _id: { $in: subjectIds } })
          .select("_id name")
          .lean(),
      ]);

      // Formater les RDV selon dataFlow.md
      const formattedRdvs = rdvs.map((rdv) => ({
        ...rdv,
        id: rdv._id,
        assignedAdmin: rdv.assignedAdminId ? {
          id: rdv.assignedAdminId._id,
          firstName: rdv.assignedAdminId.firstName,
          lastName: rdv.assignedAdminId.lastName,
        } : null,
      }));

      // Formater les subjects avec nom selon dataFlow.md
      const formattedSubjects =
        family.demande?.subjects?.map((subject) => {
          const subjectData = subjects.find(
            (s) => s._id.toString() === subject.id.toString()
          );
          return {
            id: subject.id,
            name: subjectData?.name || "Matière inconnue",
          };
        }) || [];

      return {
        ...family, // Spread de tout
        id: family._id, // Changer _id → id
        createdBy: {
          // Remplacer createdBy
          userId: family.createdBy?.userId,
          firstName: createdByUser?.firstName,
          lastName: createdByUser?.lastName,
        },
        rdvs: formattedRdvs, // Remplacer rdvs
        students: family.students ?? [], // Sécuriser students
        address: family.address || { street: '', city: '', postalCode: '' }, // Sécuriser address
        billingAddress: family.billingAddress || { street: '', city: '', postalCode: '' }, // Sécuriser billingAddress
        demande: family.demande
          ? {
              ...family.demande,
              subjects: formattedSubjects, // Remplacer subjects avec nom
            }
          : undefined,
      };
    } catch (error) {
      console.error("Erreur lors du formatage de la famille:", error);
      throw new Error("Erreur lors du formatage de la famille");
    }
  }

  static async getFamilyById(id) {
    try {
      // Valider l'ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null; // ID invalide = famille non trouvée
      }

      // 1. Check cache first
      const cached = CacheManager.getFamily(id);
      if (cached) {
        console.log(`Cache hit: family ${id}`);
        return cached;
      }

      // 2. Cache miss - Query DB
      console.log(`Cache miss: family ${id} - querying database`);
      const family = await Family.findById(id).lean();
      if (!family) {
        return null;
      }

      // 3. Format and store in cache
      const formattedFamily = await this.formatFamilyForCache(family);
      CacheManager.setFamily(id, formattedFamily);
      console.log(`Cache set: family ${id}`);

      return formattedFamily;
    } catch (error) {
      console.error("Erreur lors de la récupération de la famille:", error);
      throw new Error("Erreur lors de la récupération de la famille");
    }
  }

  static async getFamiliesStats() {
    try {
      // 1. Check cache first
      const cached = CacheManager.getFamiliesStats();
      if (cached) {
        console.log("Cache hit: families stats");
        return cached;
      }

      // 2. Cache miss - Calculate stats
      console.log("Cache miss: families stats - calculating from database");
      const [totalFamilies, totalNDRFamilies] = await Promise.all([
        Family.countDocuments(),
        Ndr.distinct("familyId"),
      ]);

      const stats = {
        totalClient: totalNDRFamilies.length,
        totalProspect: totalFamilies - totalNDRFamilies.length,
      };

      // 3. Store in cache
      CacheManager.setFamiliesStats(stats);
      console.log(
        `Cache set: families stats (clients: ${stats.totalClient}, prospects: ${stats.totalProspect})`
      );

      return stats;
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques:", error);
      throw new Error("Erreur lors du calcul des statistiques");
    }
  }

  static async createFamily(familyData) {
    try {
      const family = new Family(familyData);
      const savedFamily = await family.save();

      // Invalidate cache after family creation
      CacheManager.invalidate("families", "families_list*");
      CacheManager.invalidate("families", "families_stats");

      return savedFamily;
    } catch (error) {
      console.error("Erreur lors de la création de la famille:", error);
      throw error;
    }
  }

  static async updateFamily(familyId, updateData) {
    try {
      // Validation de l'ID
      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(familyId)) {
        throw new Error("ID famille invalide");
      }

      // Construire l'objet de mise à jour avec seulement les champs autorisés
      const allowedFields = [
        "prospectStatus",
        "nextAction",
        "nextActionDate",
        "notes",
      ];

      const sanitizedData = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          sanitizedData[field] = updateData[field];
        }
      }

      if (Object.keys(sanitizedData).length === 0) {
        throw new Error("Aucun champ valide à mettre à jour");
      }

      // Mise à jour de la famille
      const updatedFamily = await Family.findByIdAndUpdate(
        familyId,
        { $set: sanitizedData },
        { new: true, runValidators: true }
      );

      if (!updatedFamily) {
        throw new Error("Famille non trouvée");
      }

      // Invalider le cache
      CacheManager.invalidateFamily(familyId);

      console.log(
        `✅ Famille ${familyId} mise à jour:`,
        Object.keys(sanitizedData)
      );

      return {
        message: "Famille mise à jour avec succès",
        family: updatedFamily,
      };
    } catch (error) {
      console.error("Erreur dans FamilyService.updateFamily:", error);
      throw error;
    }
  }

  static async updatePrimaryContact(familyId, primaryContactData) {
    try {
      const family = await Family.findByIdAndUpdate(
        familyId,
        { primaryContact: primaryContactData },
        { new: true, runValidators: true },
        { timestamps: true }
      ).lean();

      if (!family) {
        return null;
      }

      // Invalidate cache after successful update
      CacheManager.invalidateFamily(familyId);
      console.log(
        `Cache invalidated for family ${familyId} after primary contact update`
      );

      return await this.formatFamilyForCache(family);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du contact principal:",
        error
      );

      // Erreur de validation Mongoose
      if (error.name === "ValidationError") {
        throw new Error(
          `Données invalides: ${Object.values(error.errors)
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      // Erreur ObjectId invalide
      if (error.name === "CastError") {
        throw new Error("ID famille invalide");
      }

      // Erreur générique
      throw new Error("Erreur lors de la mise à jour du contact principal");
    }
  }


  static async updateDemande(familyId, demandeData) {
    try {
      const family = await Family.findByIdAndUpdate(
        familyId,
        { demande: demandeData },
        { new: true, runValidators: true },
        { timestamps: true }
      ).lean();

      if (!family) {
        return null;
      }

      // Invalidate cache after successful update
      CacheManager.invalidateFamily(familyId);
      console.log(
        `Cache invalidated for family ${familyId} after demande update`
      );

      return await this.formatFamilyForCache(family);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error);

      // Erreur de validation Mongoose
      if (error.name === "ValidationError") {
        throw new Error(
          `Données invalides: ${Object.values(error.errors)
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      // Erreur ObjectId invalide
      if (error.name === "CastError") {
        throw new Error("ID famille invalide");
      }

      // Erreur générique
      throw new Error("Erreur lors de la mise à jour de la demande");
    }
  }


  static async updateBillingAddress(familyId, billingAddressData) {
    try {
      const family = await Family.findByIdAndUpdate(
        familyId,
        { billingAddress: billingAddressData },
        { new: true, runValidators: true },
        { timestamps: true }
      ).lean();

      if (!family) {
        return null;
      }

      // Invalidate cache after successful update
      CacheManager.invalidateFamily(familyId);
      console.log(
        `Cache invalidated for family ${familyId} after billing address update`
      );

      return await this.formatFamilyForCache(family);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de l'adresse de facturation:",
        error
      );

      // Erreur de validation Mongoose
      if (error.name === "ValidationError") {
        throw new Error(
          `Données invalides: ${Object.values(error.errors)
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      // Erreur ObjectId invalide
      if (error.name === "CastError") {
        throw new Error("ID famille invalide");
      }

      // Erreur générique
      throw new Error(
        "Erreur lors de la mise à jour de l'adresse de facturation"
      );
    }
  }

  static async updateSecondaryContact(familyId, secondaryContactData) {
    try {
      const family = await Family.findByIdAndUpdate(
        familyId,
        { secondaryContact: secondaryContactData },
        { new: true, runValidators: true },
        { timestamps: true }
      ).lean();

      if (!family) {
        return null;
      }

      // Invalidate cache after successful update
      CacheManager.invalidateFamily(familyId);
      console.log(
        `Cache invalidated for family ${familyId} after secondary contact update`
      );

      return await this.formatFamilyForCache(family);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du contact secondaire:",
        error
      );

      // Erreur de validation Mongoose
      if (error.name === "ValidationError") {
        throw new Error(
          `Données invalides: ${Object.values(error.errors)
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      // Erreur ObjectId invalide
      if (error.name === "CastError") {
        throw new Error("ID famille invalide");
      }

      // Erreur générique
      throw new Error("Erreur lors de la mise à jour du contact secondaire");
    }
  }

  static async updateCompanyInfo(familyId, companyInfoData) {
    try {
      const family = await Family.findByIdAndUpdate(
        familyId,
        { companyInfo: companyInfoData },
        { new: true, runValidators: true },
        { timestamps: true }
      ).lean();

      if (!family) {
        return null;
      }

      // Invalidate cache after successful update
      CacheManager.invalidateFamily(familyId);
      console.log(
        `Cache invalidated for family ${familyId} after company info update`
      );

      return await this.formatFamilyForCache(family);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des infos entreprise:",
        error
      );

      // Erreur de validation Mongoose
      if (error.name === "ValidationError") {
        throw new Error(
          `Données invalides: ${Object.values(error.errors)
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      // Erreur ObjectId invalide
      if (error.name === "CastError") {
        throw new Error("ID famille invalide");
      }

      // Erreur générique
      throw new Error("Erreur lors de la mise à jour des infos entreprise");
    }
  }

  static validateStudentData(data) {
    // Validation métier : si un objet est fourni, ses champs obligatoires doivent être présents

    // School : si fourni, name et grade obligatoires
    if (
      data.school &&
      (!data.school.name?.trim() || !data.school.grade?.trim())
    ) {
      throw new Error("Si school est fourni, name et grade sont obligatoires");
    }

    // Contact : si fourni, au moins phone ou email obligatoire
    if (
      data.contact &&
      !data.contact.phone?.trim() &&
      !data.contact.email?.trim()
    ) {
      throw new Error(
        "Si contact est fourni, au moins phone ou email est obligatoire"
      );
    }

    // Address : si fourni, street, city et postalCode obligatoires
    if (
      data.address &&
      (!data.address.street?.trim() ||
        !data.address.city?.trim() ||
        !data.address.postalCode?.trim())
    ) {
      throw new Error(
        "Si address est fourni, street, city et postalCode sont obligatoires"
      );
    }

    return true;
  }

  static validateSecondaryContactData(data) {
    // SecondaryContact : si fourni, tous les champs deviennent obligatoires
    if (
      data.secondaryContact &&
      (!data.secondaryContact.firstName?.trim() ||
        !data.secondaryContact.lastName?.trim() ||
        !data.secondaryContact.phone?.trim() ||
        !data.secondaryContact.email?.trim())
    ) {
      throw new Error(
        "Si secondaryContact est fourni, tous les champs (firstName, lastName, phone, email) sont obligatoires"
      );
    }

    return true;
  }

  static async addStudent(familyId, studentData) {
    try {
      const mongoose = require("mongoose");

      // Validation des données élève
      this.validateStudentData(studentData);

      // Transformer dateOfBirth → birthDate si nécessaire
      const { dateOfBirth, ...restData } = studentData;
      const preparedStudentData = {
        id: new mongoose.Types.ObjectId(),
        ...restData,
        birthDate: dateOfBirth,
      };

      // Ajouter l'élève au tableau students de la famille
      const updatedFamily = await Family.findByIdAndUpdate(
        familyId,
        { $push: { students: preparedStudentData } },
        { new: true, runValidators: true }
      );

      if (!updatedFamily) {
        throw new Error("Famille non trouvée");
      }

      // Invalider le cache (famille spécifique + listes)
      CacheManager.invalidateFamily(familyId);

      return {
        message: "Élève ajouté avec succès à la famille",
        student: preparedStudentData,
        family: updatedFamily,
      };
    } catch (error) {
      console.error("Erreur dans FamilyService.addStudent:", error);
      throw error;
    }
  }

  static async deleteFamily(familyId) {
    try {
      const mongoose = require("mongoose");

      // Validation de l'ID
      if (!familyId) {
        throw new Error(`ID de famille invalide: ${familyId}`);
      }

      // Validation format ObjectId
      if (!mongoose.Types.ObjectId.isValid(familyId)) {
        throw new Error(
          `Format d'ID invalide (doit être un ObjectId MongoDB valide): ${familyId}`
        );
      }

      const family = await Family.findById(familyId);

      if (!family) {
        console.log(`❌ Famille non trouvée: ${familyId}`);
        return null;
      }

      // 1. Supprimer les notes de règlement liées (NDR)
      const deletedSettlementNotes = await Ndr.deleteMany({
        familyId: familyId,
      });

      // 2. Supprimer tous les RDV liés à cette famille
      const deletedRdvs = await RendezVous.deleteMany({
        familyId: familyId,
      });

      // 3. Supprimer la famille elle-même
      await Family.findByIdAndDelete(familyId);

      // 4. Invalidate cache after family deletion
      CacheManager.invalidate("families", "families_list*");
      CacheManager.invalidate("families", "families_stats");
      CacheManager.invalidate("families", `family_${familyId}`);

      return {
        message: "Famille et tous les éléments liés supprimés avec succès",
        deletedItems: {
          settlementNotes: deletedSettlementNotes.deletedCount,
          rdvs: deletedRdvs.deletedCount,
        },
      };
    } catch (error) {
      console.error("Erreur lors de la suppression de la famille:", error);
      throw error;
    }
  }
}

module.exports = FamilyService;
