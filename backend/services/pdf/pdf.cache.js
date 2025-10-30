/**
 * Cache LRU (Least Recently Used) pour PDFs
 * Évite de régénérer les mêmes PDFs plusieurs fois
 * Performance: PDF en cache = <100ms au lieu de 1-4s
 */
class PDFCache {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Génère une clé unique pour le cache
   * Format: type:userId:version
   * Exemple: fiche_paie:507f1f77bcf86cd799439011:1
   */
  generateKey(type, userId, version) {
    return `${type}:${userId}:${version || 1}`;
  }

  /**
   * Récupère un PDF du cache
   * Déplace l'élément en tête (LRU)
   */
  get(type, userId, version) {
    const key = this.generateKey(type, userId, version);

    if (this.cache.has(key)) {
      // Déplacer en tête (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);

      console.log(`📦 Cache HIT: ${key}`);
      return value;
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;
  }

  /**
   * Ajoute un PDF au cache
   * Supprime le plus ancien si cache plein
   */
  set(type, userId, version, pdfData) {
    const key = this.generateKey(type, userId, version);

    // Si cache plein, supprimer le plus ancien (first key)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log(`🗑️ Cache EVICT: ${firstKey}`);
    }

    this.cache.set(key, {
      ...pdfData,
      cachedAt: Date.now()
    });

    console.log(`✅ Cache SET: ${key}`);
  }

  /**
   * Vérifie si un PDF est en cache
   */
  has(type, userId, version) {
    const key = this.generateKey(type, userId, version);
    return this.cache.has(key);
  }

  /**
   * Invalide un PDF du cache
   */
  invalidate(type, userId, version) {
    const key = this.generateKey(type, userId, version);
    const deleted = this.cache.delete(key);

    if (deleted) {
      console.log(`🗑️ Cache INVALIDATE: ${key}`);
    }

    return deleted;
  }

  /**
   * Vide complètement le cache
   */
  clear() {
    this.cache.clear();
    console.log('🗑️ Cache CLEARED');
  }

  /**
   * Retourne la taille actuelle du cache
   */
  size() {
    return this.cache.size;
  }
}

// Export singleton instance
const pdfCache = new PDFCache(10);

module.exports = pdfCache;
