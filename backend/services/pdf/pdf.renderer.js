/**
 * Renderer PDF avec Puppeteer
 * Convertit HTML → PDF avec optimisations de performance
 */

/**
 * Génère un PDF à partir de HTML avec Puppeteer
 * @param {string} html - HTML complet à convertir
 * @param {BrowserPool} browserPool - Pool de navigateurs partagé
 * @returns {Promise<Buffer>} - Buffer du PDF généré
 */
async function generatePDFFromHTML(html, browserPool) {
  // Utiliser le pool de browsers
  const browser = await browserPool.getBrowser();
  let page;

  try {
    page = await browser.newPage();

    // Optimisations de performance
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Bloquer les ressources inutiles (images, fonts externes, media)
      // Les images inline (data:image) passent car elles sont dans le HTML
      if (['image', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Charger le HTML
    // 'domcontentloaded' est plus rapide que 'networkidle0'
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Générer le PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true, // Important pour les couleurs de fond
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: false
    });

    return pdf;
  } finally {
    // Toujours fermer la page et libérer le browser
    if (page) {
      await page.close();
    }
    // Libérer le browser pour réutilisation
    browserPool.releaseBrowser(browser);
  }
}

module.exports = { generatePDFFromHTML };
