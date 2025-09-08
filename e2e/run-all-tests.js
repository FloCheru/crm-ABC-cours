/**
 * Script pour exécuter tous les types de tests
 * Commande : node e2e/run-all-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 LANCEMENT DE TOUS LES TESTS');
console.log('=====================================\n');

const testResults = {
  backend: { unit: 0, integration: 0 },
  frontend: { pages: 0, components: 0, hooks: 0 },
  e2e: { workflows: 0 }
};

const runCommand = (command, description, cwd = null) => {
  console.log(`🧪 ${description}...`);
  console.log(`   Command: ${command}`);
  
  try {
    const options = cwd ? { cwd } : {};
    const output = execSync(command, { 
      ...options,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(`   ✅ Réussi\n`);
    return { success: true, output };
  } catch (error) {
    console.log(`   ❌ Échec: ${error.message}\n`);
    return { success: false, error: error.message };
  }
};

// ========================================
// TESTS BACKEND
// ========================================
console.log('📂 BACKEND TESTS');
console.log('================');

const backendDir = path.join(__dirname, '../backend');

// Tests unitaires
const unitResult = runCommand(
  'npm run test:unit',
  'Tests unitaires backend',
  backendDir
);

// Tests d'intégration
const integrationResult = runCommand(
  'npm run test:integration', 
  'Tests intégration API',
  backendDir
);

// ========================================
// TESTS FRONTEND
// ========================================
console.log('🖥️ FRONTEND TESTS');
console.log('=================');

const frontendDir = path.join(__dirname, '../frontend');

// Tests pages
const pagesResult = runCommand(
  'npm run test:pages',
  'Tests pages frontend',
  frontendDir
);

// ========================================
// TESTS E2E
// ========================================
console.log('🔄 E2E TESTS');
console.log('============');

const e2eResult = runCommand(
  'node ../backend/node_modules/.bin/jest workflows/',
  'Tests E2E workflows',
  __dirname
);

// ========================================
// RAPPORT FINAL
// ========================================
console.log('📊 RAPPORT FINAL');
console.log('================');

const allResults = [
  { name: 'Backend Unit', result: unitResult },
  { name: 'Backend API', result: integrationResult },
  { name: 'Frontend Pages', result: pagesResult },
  { name: 'E2E Workflows', result: e2eResult }
];

let totalSuccess = 0;
let totalTests = allResults.length;

allResults.forEach(({ name, result }) => {
  const status = result.success ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (result.success) totalSuccess++;
});

console.log('\n' + '='.repeat(40));
console.log(`📈 RÉSULTAT GLOBAL: ${totalSuccess}/${totalTests} suites passées`);
console.log(`🎯 Taux de réussite: ${Math.round((totalSuccess/totalTests)*100)}%`);

if (totalSuccess === totalTests) {
  console.log('🎉 TOUS LES TESTS PASSENT !');
  process.exit(0);
} else {
  console.log('⚠️  Certains tests échouent - Voir détails ci-dessus');
  process.exit(1);
}

// ========================================
// INSTRUCTIONS POUR AGENT TEST
// ========================================
console.log(`
📋 GUIDE AGENT TEST
===================

Pour tester spécifiquement:

Backend:
  cd backend && npm run test:unit
  cd backend && npm run test:integration
  cd backend && npm run test:api

Frontend:  
  cd frontend && npm run test:pages
  cd frontend && npm run test:page:prospects
  cd frontend && npm run test:page:clients

E2E:
  node e2e/run-all-tests.js
  cd backend && npm test ../e2e/workflows/prospect-to-client.e2e.js

Coverage:
  cd backend && npm run test:coverage
  cd frontend && npm run test:coverage

Résultats dans: 
  - Console pour status
  - coverage/ pour rapports HTML
`);