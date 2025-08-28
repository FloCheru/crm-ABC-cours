/**
 * Test basique de navigation ProspectDetails
 * Vérifie que la route et le composant ProspectDetails existent et fonctionnent
 */

describe('Navigation ProspectDetails - Tests de base', () => {
  
  test('devrait pouvoir importer le composant ProspectDetails', () => {
    // Test d'importation simple
    let ProspectDetailsComponent;
    
    try {
      const module = require('../../src/pages/prospects/ProspectDetails');
      ProspectDetailsComponent = module.ProspectDetails;
      
      expect(ProspectDetailsComponent).toBeDefined();
      expect(typeof ProspectDetailsComponent).toBe('function');
      
      console.log('✅ Composant ProspectDetails existe et est importable');
    } catch (error) {
      console.error('❌ Erreur import ProspectDetails:', error.message);
      throw error;
    }
  });

  test('devrait avoir la route configurée dans main.tsx', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Lire le fichier main.tsx
    const mainTsxPath = path.join(process.cwd(), 'src', 'main.tsx');
    const mainTsxContent = fs.readFileSync(mainTsxPath, 'utf8');
    
    // Vérifier que la route /families/:familyId existe
    expect(mainTsxContent).toContain('path="/families/:familyId"');
    expect(mainTsxContent).toContain('<ProspectDetails />');
    expect(mainTsxContent).toContain('import {');
    expect(mainTsxContent).toContain('ProspectDetails,');
    
    console.log('✅ Route /families/:familyId correctement configurée dans main.tsx');
  });

  test('devrait avoir le fichier CSS ProspectDetails.css', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(process.cwd(), 'src', 'pages', 'prospects', 'ProspectDetails.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    expect(cssContent).toContain('.prospect-details');
    expect(cssContent).toContain('.prospect-details__header');
    expect(cssContent).toContain('.prospect-details__content');
    
    console.log('✅ Fichier CSS ProspectDetails.css existe avec les classes nécessaires');
  });

  test('devrait être exporté depuis pages/prospects/index.ts', () => {
    const fs = require('fs');
    const path = require('path');
    
    const indexPath = path.join(process.cwd(), 'src', 'pages', 'prospects', 'index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    expect(indexContent).toContain('export { ProspectDetails }');
    expect(indexContent).toContain('./ProspectDetails');
    
    console.log('✅ ProspectDetails exporté depuis pages/prospects/index.ts');
  });

  test('devrait être exporté depuis pages/index.ts', () => {
    const fs = require('fs');
    const path = require('path');
    
    const indexPath = path.join(process.cwd(), 'src', 'pages', 'index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    expect(indexContent).toContain('export { ProspectDetails }');
    expect(indexContent).toContain('./prospects/ProspectDetails');
    
    console.log('✅ ProspectDetails exporté depuis pages/index.ts');
  });

  test('devrait utiliser les bons hooks et services', () => {
    const fs = require('fs');
    const path = require('path');
    
    const componentPath = path.join(process.cwd(), 'src', 'pages', 'prospects', 'ProspectDetails.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Vérifier les imports essentiels
    expect(componentContent).toContain('useParams');
    expect(componentContent).toContain('useNavigate');
    expect(componentContent).toContain('familyService');
    expect(componentContent).toContain('familyId: string');
    
    // Vérifier l'utilisation des composants UI
    expect(componentContent).toContain('Navbar');
    expect(componentContent).toContain('Breadcrumb');
    expect(componentContent).toContain('Container');
    expect(componentContent).toContain('Button');
    
    console.log('✅ ProspectDetails utilise les bons hooks et services');
  });

  test('devrait gérer les paramètres de route familyId', () => {
    const fs = require('fs');
    const path = require('path');
    
    const componentPath = path.join(process.cwd(), 'src', 'pages', 'prospects', 'ProspectDetails.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Vérifier la logique de récupération du familyId
    expect(componentContent).toContain('useParams<{ familyId: string }>');
    expect(componentContent).toContain('familyService.getFamily(familyId)');
    expect(componentContent).toContain('if (!familyId)');
    
    console.log('✅ ProspectDetails gère correctement le paramètre familyId');
  });

});

console.log('🧪 Tests de base ProspectDetails - 6 vérifications structurelles effectuées');