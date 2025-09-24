const FamilyService = require('./services/familyService');

console.log('🧪 Test validation métier students');

// Test 1: Données valides
try {
  FamilyService.validateStudentData({
    firstName: 'Jean',
    lastName: 'Dupont',
    school: { name: 'Lycée Victor Hugo', grade: 'Terminale' },
    contact: { phone: '0123456789' },
    address: { street: '123 rue', city: 'Paris', postalCode: '75001' }
  });
  console.log('✅ Test 1 OK: Données complètes valides');
} catch (e) {
  console.log('❌ Test 1 FAIL:', e.message);
}

// Test 2: School incomplet (doit échouer)
try {
  FamilyService.validateStudentData({
    firstName: 'Jean',
    lastName: 'Dupont',
    school: { name: 'Lycée Victor Hugo' } // grade manquant
  });
  console.log('❌ Test 2 FAIL: Aurait dû échouer');
} catch (e) {
  console.log('✅ Test 2 OK: École incomplète détectée -', e.message);
}

// Test 3: Contact vide (doit échouer)
try {
  FamilyService.validateStudentData({
    firstName: 'Jean',
    lastName: 'Dupont',
    contact: {} // phone et email vides
  });
  console.log('❌ Test 3 FAIL: Aurait dû échouer');
} catch (e) {
  console.log('✅ Test 3 OK: Contact vide détecté -', e.message);
}

// Test 4: Address incomplète (doit échouer)
try {
  FamilyService.validateStudentData({
    firstName: 'Jean',
    lastName: 'Dupont',
    address: { street: '123 rue', city: 'Paris' } // postalCode manquant
  });
  console.log('❌ Test 4 FAIL: Aurait dû échouer');
} catch (e) {
  console.log('✅ Test 4 OK: Adresse incomplète détectée -', e.message);
}

// Test 5: Données minimales (doit réussir)
try {
  FamilyService.validateStudentData({
    firstName: 'Jean',
    lastName: 'Dupont',
    birthDate: '2005-01-01'
  });
  console.log('✅ Test 5 OK: Données minimales valides');
} catch (e) {
  console.log('❌ Test 5 FAIL:', e.message);
}

console.log('\n🎉 Tests de validation terminés');