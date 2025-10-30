const puppeteer = require('puppeteer');

/**
 * Pool de navigateurs Puppeteer pour réutilisation
 * Évite de relancer un navigateur à chaque génération de PDF
 * Performance: 1er PDF = 3-4s, suivants = 0.5-1s
 */
class BrowserPool {
  constructor(maxSize = 3) {
    this.maxSize = maxSize;
    this.browsers = [];
    this.availableBrowsers = [];
  }

  /**
   * Obtient un navigateur du pool (réutilise ou crée)
   */
  async getBrowser() {
    // Si un browser est disponible, le réutiliser
    if (this.availableBrowsers.length > 0) {
      return this.availableBrowsers.pop();
    }

    // Si on peut créer un nouveau browser
    if (this.browsers.length < this.maxSize) {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process'
        ]
      });
      this.browsers.push(browser);
      return browser;
    }

    // Attendre qu'un browser soit disponible
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.availableBrowsers.length > 0) {
          clearInterval(checkInterval);
          resolve(this.availableBrowsers.pop());
        }
      }, 100);
    });
  }

  /**
   * Libère un navigateur pour réutilisation
   */
  releaseBrowser(browser) {
    if (this.browsers.includes(browser)) {
      this.availableBrowsers.push(browser);
    }
  }

  /**
   * Ferme tous les navigateurs (cleanup)
   */
  async closeAll() {
    await Promise.all(this.browsers.map(browser => browser.close()));
    this.browsers = [];
    this.availableBrowsers = [];
  }
}

// Export singleton instance
const browserPool = new BrowserPool(3);

// Cleanup on process termination
process.on('SIGINT', async () => {
  console.log('🔄 Fermeture du pool de navigateurs...');
  await browserPool.closeAll();
  process.exit();
});

process.on('SIGTERM', async () => {
  console.log('🔄 Fermeture du pool de navigateurs...');
  await browserPool.closeAll();
  process.exit();
});

module.exports = browserPool;
