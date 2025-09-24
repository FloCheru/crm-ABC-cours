const RDV = require("../models/RDV");

class RdvService {
  /**
   * R�cup�re les RDV d'une famille
   * @param {string} familyId - ID de la famille
   * @returns {Promise<Array>} Liste des RDV
   */
  static async getRdvsByFamily(familyId) {
    return await RDV.find({ "family.id": familyId })
      .populate("admins.id", "firstName lastName")
      .sort({ date: 1 });
  }

  /**
   * R�cup�re les RDV d'un admin
   * @param {string} adminId - ID de l'admin
   * @param {Date} startDate - Date de d�but (optionnel)
   * @param {Date} endDate - Date de fin (optionnel)
   * @returns {Promise<Array>} Liste des RDV
   */
  static async getRdvsByAdmin(adminId, startDate = null, endDate = null) {
    const query = { "admins.id": adminId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    return await RDV.find(query)
      .populate("family.id", "primaryContact.firstName primaryContact.lastName")
      .sort({ date: 1 });
  }

  /**
   * V�rifie la disponibilit� d'un admin � une date donn�e
   * @param {Date} date - Date du rendez-vous
   * @param {string} adminId - ID de l'admin
   * @param {string} excludeId - ID du RDV � exclure (pour les modifications)
   * @returns {Promise<Object|null>} RDV en conflit ou null si disponible
   */
  static async checkAdminAvailability(date, adminId, excludeId = null) {
    const query = {
      date: new Date(date),
      "admins.id": adminId,
      status: "planned",
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await RDV.findOne(query);
  }

  /**
   * V�rifie la disponibilit� de tous les admins pour un RDV
   * @param {Date} date - Date du rendez-vous
   * @param {Array} adminIds - Liste des IDs des admins
   * @param {string} excludeId - ID du RDV à exclure
   * @returns {Promise<Array>} Liste des conflits
   */
  static async checkMultipleAdminsAvailability(
    date,
    adminIds,
    excludeId = null
  ) {
    const conflicts = [];

    for (const adminId of adminIds) {
      const existingRdv = await this.checkAdminAvailability(
        date,
        adminId,
        excludeId
      );
      if (existingRdv) {
        conflicts.push({
          adminId,
          conflictingRdv: existingRdv,
        });
      }
    }

    return conflicts;
  }

  /**
   * Crée un RDV avec validation complète
   * @param {Object} rdvData - Donn�es du RDV
   * @returns {Promise<Object>} RDV cr��
   */
  static async createRdvWithValidation(rdvData) {
    const { date, admins } = rdvData;

    // V�rifier les conflits pour tous les admins
    const adminIds = admins.map((admin) => admin.id);
    const conflicts = await this.checkMultipleAdminsAvailability(
      date,
      adminIds
    );

    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(
        (conflict) => `Admin ${conflict.adminId} a d�j� un RDV � cette date`
      );
      throw new Error(`Conflits d�tect�s: ${conflictMessages.join(", ")}`);
    }

    // Cr�er le RDV si pas de conflits
    return await RDV.create(rdvData);
  }

  /**
   * Met à jour un RDV avec validation
   * @param {string} rdvId - ID du RDV � modifier
   * @param {Object} updateData - Nouvelles donn�es
   * @returns {Promise<Object>} RDV mis � jour
   */
  static async updateRdvWithValidation(rdvId, updateData) {
    const { date, admins } = updateData;

    // Si date ou admins sont modifi�s, v�rifier les conflits
    if (date || admins) {
      const currentRdv = await RDV.findById(rdvId);
      if (!currentRdv) {
        throw new Error("RDV non trouv�");
      }

      const newDate = date || currentRdv.date;
      const newAdminIds = admins
        ? admins.map((admin) => admin.id)
        : currentRdv.admins.map((admin) => admin.id);

      const conflicts = await this.checkMultipleAdminsAvailability(
        newDate,
        newAdminIds,
        rdvId
      );

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(
          (conflict) => `Admin ${conflict.adminId} a d�j� un RDV � cette date`
        );
        throw new Error(`Conflits d�tect�s: ${conflictMessages.join(", ")}`);
      }
    }

    return await RDV.findByIdAndUpdate(rdvId, updateData, { new: true });
  }

  /**
   * Marque un RDV comme r�alis�
   * @param {string} rdvId - ID du RDV
   * @returns {Promise<Object>} RDV mis � jour
   */
  static async markRdvAsCompleted(rdvId) {
    return await RDV.findByIdAndUpdate(
      rdvId,
      { status: "done" },
      { new: true }
    );
  }
}

module.exports = RdvService;
