const mongoose = require("mongoose");

/**
 * Fonction pour vérifier si un ObjectId est valide
 * @param {string} id - L'ID à vérifier
 * @returns {boolean} - True si l'ID est valide
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Fonction pour créer une erreur de validation MongoDB
 * @param {string} field - Le champ en erreur
 * @param {string} message - Le message d'erreur
 * @returns {Object} - L'objet d'erreur formaté
 */
const createValidationError = (field, message) => {
  return {
    field,
    message,
    type: "validation",
  };
};

/**
 * Fonction pour formater les erreurs MongoDB
 * @param {Error} error - L'erreur MongoDB
 * @returns {Array} - Tableau d'erreurs formatées
 */
const formatMongoErrors = (error) => {
  const errors = [];

  if (error.name === "ValidationError") {
    Object.keys(error.errors).forEach((field) => {
      errors.push({
        field,
        message: error.errors[field].message,
        type: "validation",
      });
    });
  } else if (error.code === 11000) {
    // Erreur de duplication
    const field = Object.keys(error.keyPattern)[0];
    errors.push({
      field,
      message: `${field} existe déjà`,
      type: "duplicate",
    });
  } else {
    errors.push({
      field: "general",
      message: error.message,
      type: "general",
    });
  }

  return errors;
};

/**
 * Fonction pour créer une réponse paginée
 * @param {Array} data - Les données
 * @param {number} page - La page actuelle
 * @param {number} limit - La limite par page
 * @param {number} total - Le total d'éléments
 * @returns {Object} - Réponse paginée
 */
const createPaginatedResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  };
};

/**
 * Fonction pour créer un filtre de recherche
 * @param {Object} query - Les paramètres de requête
 * @param {Array} searchFields - Les champs à rechercher
 * @returns {Object} - Le filtre MongoDB
 */
const createSearchFilter = (query, searchFields) => {
  const filter = {};

  // Recherche textuelle
  if (query.search && searchFields.length > 0) {
    const searchRegex = new RegExp(query.search, "i");
    const searchConditions = searchFields.map((field) => ({
      [field]: searchRegex,
    }));
    filter.$or = searchConditions;
  }

  // Filtres par statut
  if (query.status) {
    filter.status = query.status;
  }

  // Filtres par date
  if (query.startDate) {
    filter.createdAt = { $gte: new Date(query.startDate) };
  }

  if (query.endDate) {
    if (filter.createdAt) {
      filter.createdAt.$lte = new Date(query.endDate);
    } else {
      filter.createdAt = { $lte: new Date(query.endDate) };
    }
  }

  return filter;
};

/**
 * Fonction pour créer des options de tri
 * @param {string} sortBy - Le champ de tri
 * @param {string} sortOrder - L'ordre de tri (asc/desc)
 * @returns {Object} - Les options de tri
 */
const createSortOptions = (sortBy = "createdAt", sortOrder = "desc") => {
  const order = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: order };
};

/**
 * Fonction pour valider et nettoyer les paramètres de pagination
 * @param {Object} query - Les paramètres de requête
 * @returns {Object} - Paramètres de pagination nettoyés
 */
const validatePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

/**
 * Fonction pour créer une réponse d'erreur standardisée
 * @param {string} message - Le message d'erreur
 * @param {number} statusCode - Le code de statut HTTP
 * @param {Array} errors - Les erreurs détaillées
 * @returns {Object} - Réponse d'erreur formatée
 */
const createErrorResponse = (message, statusCode = 400, errors = []) => {
  return {
    success: false,
    message,
    statusCode,
    errors,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Fonction pour créer une réponse de succès standardisée
 * @param {any} data - Les données à retourner
 * @param {string} message - Le message de succès
 * @param {number} statusCode - Le code de statut HTTP
 * @returns {Object} - Réponse de succès formatée
 */
const createSuccessResponse = (
  data,
  message = "Opération réussie",
  statusCode = 200
) => {
  return {
    success: true,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  isValidObjectId,
  createValidationError,
  formatMongoErrors,
  createPaginatedResponse,
  createSearchFilter,
  createSortOptions,
  validatePaginationParams,
  createErrorResponse,
  createSuccessResponse,
};
