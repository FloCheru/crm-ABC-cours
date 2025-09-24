class CacheManager {
  static cache = {
    families: new Map(),
    ndrs: new Map(),
    rdvs: new Map(),
    subjects: new Map(),
    users: new Map(),
  };

  static TTL = {
    families: { list: 5 * 60 * 1000, detail: 10 * 60 * 1000 },
    ndrs: { list: 3 * 60 * 1000, detail: 8 * 60 * 1000 },
    rdvs: { list: 2 * 60 * 1000, detail: 5 * 60 * 1000 },
    subjects: { list: 60 * 60 * 1000 }, // Référentiel stable
    users: { list: 15 * 60 * 1000 },
  };

  // Méthodes génériques
  static get(entity, key) {
    const cacheEntry = this.cache[entity]?.get(key); //on vérifie si la key existe
    if (!cacheEntry) {
      return null;
    }

    // Vérifier si le cache est expiré
    const now = Date.now();
    if (now > cacheEntry.timestamp + cacheEntry.ttl) {
      this.cache[entity].delete(key);
      return null;
    }

    return cacheEntry.data;
  }

  static set(entity, key, data) {
    // Validation des paramètres
    if (!entity || typeof entity !== "string") {
      throw new Error(
        `Cache error: entity must be a non-empty string, received: ${typeof entity}`
      );
    }

    if (!key || typeof key !== "string") {
      throw new Error(
        `Cache error: key must be a non-empty string, received: ${typeof key}`
      );
    }

    if (data === undefined) {
      throw new Error(
        `Cache error: data cannot be undefined for ${entity}:${key}`
      );
    }

    // Déterminer automatiquement le type TTL selon la clé
    const ttlType =
      key.includes("list") || key.includes("stats") ? "list" : "detail";
    const ttl = this.TTL[entity]?.[ttlType];

    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache[entity].set(key, cacheEntry);
    console.log(`Cache set for ${entity}:${key}, TTL: ${ttl}ms (${ttlType})`);
    return true;
  }

  static invalidate(entity, pattern = null) {
    // Validation des paramètres
    if (!entity || typeof entity !== "string") {
      throw new Error(
        `Cache error: entity must be a non-empty string, received: ${typeof entity}`
      );
    }

    if (!this.cache[entity]) {
      const availableEntities = Object.keys(this.cache).join(", ");
      throw new Error(
        `Cache error: entity '${entity}' not found. Available entities: ${availableEntities}`
      );
    }

    if (pattern === null) {
      // Invalider tout le cache de l'entité
      const size = this.cache[entity].size;
      this.cache[entity].clear();
      console.log(
        `Cache cleared for entity '${entity}': ${size} entries removed`
      );
      return size;
    }

    if (typeof pattern !== "string") {
      throw new Error(
        `Cache error: pattern must be a string or null, received: ${typeof pattern}`
      );
    }

    // Invalider selon un pattern (ex: "family_*", "families_list*")
    try {
      const regex = new RegExp(pattern.replace("*", ".*"));
      const keysToDelete = [];

      for (const key of this.cache[entity].keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => this.cache[entity].delete(key));
      console.log(
        `Cache invalidated for ${entity} with pattern '${pattern}': ${keysToDelete.length} entries removed`
      );
      return keysToDelete.length;
    } catch (error) {
      throw new Error(
        `Cache error: invalid regex pattern '${pattern}': ${error.message}`
      );
    }
  }

  static clear(entity) {
    // Validation des paramètres
    if (!entity || typeof entity !== "string") {
      throw new Error(
        `Cache error: entity must be a non-empty string, received: ${typeof entity}`
      );
    }

    if (!this.cache[entity]) {
      const availableEntities = Object.keys(this.cache).join(", ");
      throw new Error(
        `Cache error: entity '${entity}' not found. Available entities: ${availableEntities}`
      );
    }

    const size = this.cache[entity].size;
    this.cache[entity].clear();
    console.log(
      `Cache cleared for entity '${entity}': ${size} entries removed`
    );
    return size;
  }

  // Méthodes spécialisées pour les familles
  static getFamiliesList() {
    return this.get("families", "families_list_50");
  }

  static setFamiliesList(data) {
    return this.set("families", "families_list_50", data);
  }

  static getFamily(id) {
    return this.get("families", `family_${id}`);
  }

  static setFamily(id, data) {
    return this.set("families", `family_${id}`, data);
  }

  static getFamiliesStats() {
    return this.get("families", "families_stats");
  }

  static setFamiliesStats(data) {
    return this.set("families", "families_stats", data);
  }

  static invalidateFamily(id) {
    // Invalider la famille spécifique et toutes les listes
    this.invalidate("families", `family_${id}`);
    this.invalidate("families", "families_list*");
    this.invalidate("families", "families_stats");
  }

  // Méthodes utilitaires

  //Voir les datas du cache pour le debug
  static getCacheStats() {
    const stats = {};

    for (const entity in this.cache) {
      stats[entity] = {
        size: this.cache[entity].size,
        keys: Array.from(this.cache[entity].keys()),
      };
    }

    return stats;
  }

  static clearExpiredEntries() {
    const now = Date.now();
    let totalCleared = 0;

    for (const entity in this.cache) {
      const expiredKeys = [];

      for (const [key, cacheEntry] of this.cache[entity]) {
        if (now > cacheEntry.timestamp + cacheEntry.ttl) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach((key) => this.cache[entity].delete(key));
      totalCleared += expiredKeys.length;
    }

    return totalCleared;
  }
}

module.exports = CacheManager;
