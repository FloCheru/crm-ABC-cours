/**
 * Tests spécifiques pour le champ Niveau du bénéficiaire dans la popup
 * Teste l'affichage et le fonctionnement du champ beneficiaryLevel ajouté
 * Commande : npm test beneficiary-level-field.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../integration/app.test');
const Family = require('../../../models/Family');
const User = require('../../../models/User');
const Subject = require('../../../models/Subject');

describe('📋 TESTS CHAMP NIVEAU DU BÉNÉFICIAIRE', () => {
  let mongoServer;
  let adminToken;
  let testUserId;

  // ========== SETUP/TEARDOWN ==========
  beforeAll(async () => {
    // Configuration JWT pour les tests
    process.env.JWT_SECRET = 'test_secret_key_for_beneficiary_level';
    
    // Démarrer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connecter Mongoose à la base temporaire
    await mongoose.connect(mongoUri);
    
    console.log('📊 Base de données temporaire initialisée pour tests champ niveau');
    
    // Créer utilisateur admin test
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const adminUser = await User.create({
      firstName: 'Test',
      lastName: 'BeneficiaryLevel',
      email: 'test.level@field.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    testUserId = adminUser._id;
    
    // Générer token admin
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { userId: testUserId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🔑 Utilisateur admin test créé pour champ niveau');
    
    // Créer quelques matières de test
    const subjects = [
      { name: 'Mathématiques', isActive: true },
      { name: 'Français', isActive: true },
      { name: 'Anglais', isActive: true },
    ];
    
    await Subject.create(subjects);
    console.log('📚 Matières fixtures créées pour champ niveau');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log('🗑️ Base de données temporaire nettoyée');
  });

  beforeEach(async () => {
    // Nettoyer les familles avant chaque test
    await Family.deleteMany({});
  });

  // ========== TESTS CHAMP BENEFICIARY LEVEL ==========
  describe('Tests du champ Niveau du bénéficiaire', () => {
    
    test('✅ Création prospect avec beneficiaryLevel "CP"', async () => {
      console.log('\n🎯 TEST: BeneficiaryLevel CP');
      console.log('===============================');
      
      const prospectData = {
        address: { 
          street: '123 Rue CP Test', 
          city: 'Paris', 
          postalCode: '75001' 
        },
        primaryContact: { 
          firstName: 'Marie', 
          lastName: 'CPTest',
          primaryPhone: '0142123456',
          email: 'marie.cp@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'eleves',
          beneficiaryLevel: 'CP', // ✅ Niveau CP
          subjects: ['Français', 'Mathématiques'],
          notes: 'Soutien scolaire niveau CP'
        },
        plannedTeacher: 'Prof. Primaire',
        status: 'prospect',
        createdBy: testUserId,
      };

      console.log('📋 Niveau du bénéficiaire:', prospectData.demande.beneficiaryLevel);

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      // Vérifications spécifiques
      expect(response.body.family).toBeDefined();
      expect(response.body.family.demande.beneficiaryLevel).toBe('CP');
      expect(response.body.family.demande.beneficiaryType).toBe('eleves');
      expect(response.body.family.demande.subjects).toEqual(['Français', 'Mathématiques']);
      
      console.log('✅ Prospect CP créé avec succès');
      console.log('📊 Données sauvegardées:', {
        beneficiaryLevel: response.body.family.demande.beneficiaryLevel,
        beneficiaryType: response.body.family.demande.beneficiaryType,
        subjects: response.body.family.demande.subjects
      });
      console.log('===============================\n');
    });

    test('✅ Création prospect avec beneficiaryLevel "Terminale"', async () => {
      console.log('\n🎯 TEST: BeneficiaryLevel TERMINALE');
      console.log('==================================');
      
      const prospectData = {
        address: { 
          street: '456 Avenue Terminale', 
          city: 'Lyon', 
          postalCode: '69000' 
        },
        primaryContact: { 
          firstName: 'Jean', 
          lastName: 'TerminaleTest',
          primaryPhone: '0472987654',
          email: 'jean.terminale@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          beneficiaryLevel: 'Terminale', // ✅ Niveau Terminale
          subjects: ['Mathématiques', 'Physique'],
          notes: 'Préparation BAC scientifique'
        },
        status: 'prospect',
        createdBy: testUserId,
      };

      console.log('📋 Niveau du bénéficiaire:', prospectData.demande.beneficiaryLevel);

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      expect(response.body.family.demande.beneficiaryLevel).toBe('Terminale');
      expect(response.body.family.demande.subjects).toEqual(['Mathématiques', 'Physique']);
      
      console.log('✅ Prospect Terminale créé avec succès');
      console.log('📊 Données sauvegardées:', {
        beneficiaryLevel: response.body.family.demande.beneficiaryLevel,
        subjects: response.body.family.demande.subjects
      });
      console.log('==================================\n');
    });

    test('❌ Erreur avec beneficiaryLevel invalide', async () => {
      console.log('\n🎯 TEST: BeneficiaryLevel INVALIDE');
      console.log('==================================');
      
      const invalidData = {
        address: { street: '789 Rue Invalide', city: 'Test', postalCode: '12345' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'InvalidLevel',
          primaryPhone: '0123456789',
          email: 'invalid@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          beneficiaryLevel: 'Niveau_Invalide', // ❌ Niveau non autorisé
          subjects: ['Test']
        },
        status: 'prospect',
        createdBy: testUserId,
      };

      console.log('📋 Niveau invalide testé:', invalidData.demande.beneficiaryLevel);

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeDefined();
      console.log('✅ Erreur détectée pour niveau invalide:', response.body.message);
      console.log('==================================\n');
    });

    test('❌ Champ beneficiaryLevel obligatoire - Erreur si manquant', async () => {
      console.log('\n🎯 TEST: BeneficiaryLevel OBLIGATOIRE');
      console.log('====================================');
      
      const missingLevelData = {
        address: { 
          street: '321 Rue Manquant', 
          city: 'Marseille', 
          postalCode: '13000' 
        },
        primaryContact: { 
          firstName: 'Manquant', 
          lastName: 'TestLevel',
          primaryPhone: '0491555777',
          email: 'manquant@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          // beneficiaryLevel manquant ❌
          subjects: ['Mathématiques'],
          notes: 'Test champ obligatoire'
        },
        status: 'prospect',
        createdBy: testUserId,
      };

      console.log('📋 BeneficiaryLevel manquant dans les données');

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(missingLevelData)
        .expect(400);

      expect(response.body.message).toBeDefined();
      // Le message peut venir de la validation express-validator ou de Mongoose
      const message = response.body.message;
      const hasLevelError = message.includes('Niveau du bénéficiaire requis') || 
                           message.includes('Données invalides');
      expect(hasLevelError).toBe(true);
      console.log('✅ Erreur détectée pour niveau manquant:', response.body.message);
      console.log('====================================\n');
    });

    test('✅ Test tous les niveaux valides', async () => {
      console.log('\n🎯 TEST: TOUS LES NIVEAUX VALIDES');
      console.log('=================================');
      
      const validLevels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'];
      
      for (const level of validLevels) {
        const prospectData = {
          address: { 
            street: `123 Rue ${level}`, 
            city: 'Test', 
            postalCode: '12345' 
          },
          primaryContact: { 
            firstName: 'Test', 
            lastName: `Level${level}`,
            primaryPhone: '0123456789',
            email: `test.${level.toLowerCase()}@test.fr`,
            gender: 'M.'
          },
          demande: {
            beneficiaryType: 'eleves',
            beneficiaryLevel: level,
            subjects: ['Mathématiques'],
            notes: `Test niveau ${level}`
          },
          status: 'prospect',
          createdBy: testUserId,
        };

        console.log(`📋 Test niveau: ${level}`);

        const response = await request(app)
          .post('/api/families')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('x-test-mode', 'true')
          .send(prospectData)
          .expect(201);

        expect(response.body.family.demande.beneficiaryLevel).toBe(level);
        console.log(`✅ Niveau ${level} validé`);
        
        // Nettoyer pour le prochain test
        await Family.deleteMany({});
      }
      
      console.log('✅ Tous les niveaux valides testés avec succès');
      console.log('=================================\n');
    });

  });

  // ========== TESTS INTÉGRATION AVEC BENEFICIARYTYPE ==========
  describe('Tests intégration niveau + type de bénéficiaire', () => {
    
    test('✅ Intégration complète niveau + type + autres champs', async () => {
      console.log('\n🎯 TEST: INTÉGRATION NIVEAU + TYPE');
      console.log('==================================');
      
      const fullData = {
        address: { 
          street: '654 Rue Intégration', 
          city: 'Toulouse', 
          postalCode: '31000' 
        },
        primaryContact: { 
          firstName: 'Intégration', 
          lastName: 'TestComplet',
          primaryPhone: '0561444666',
          email: 'integration.level@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'eleves',
          beneficiaryLevel: '3ème', // ✅ Nouveau champ obligatoire
          subjects: ['Français', 'Mathématiques', 'Anglais'],
          notes: 'Préparation brevet des collèges'
        },
        plannedTeacher: 'Prof. Collège',
        notes: 'Notes générales famille',
        status: 'prospect',
        createdBy: testUserId,
      };

      console.log('📋 Champs demande testés:', {
        beneficiaryType: fullData.demande.beneficiaryType,
        beneficiaryLevel: fullData.demande.beneficiaryLevel,
        subjects: fullData.demande.subjects.length + ' matières',
        hasNotes: !!fullData.demande.notes
      });

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(fullData)
        .expect(201);

      // Vérifier que tous les champs sont sauvegardés
      const family = response.body.family;
      expect(family.demande.beneficiaryType).toBe('eleves');
      expect(family.demande.beneficiaryLevel).toBe('3ème');
      expect(family.demande.subjects).toEqual(['Français', 'Mathématiques', 'Anglais']);
      expect(family.demande.notes).toBe('Préparation brevet des collèges');
      expect(family.plannedTeacher).toBe('Prof. Collège');

      console.log('✅ Intégration complète réussie');
      console.log('📊 Structure finale:', {
        demande: {
          beneficiaryType: family.demande.beneficiaryType,
          beneficiaryLevel: family.demande.beneficiaryLevel,
          subjects: family.demande.subjects.length + ' matières',
          hasNotes: !!family.demande.notes
        },
        plannedTeacher: family.plannedTeacher
      });
      console.log('==================================\n');
    });

  });

});

// ========== RÉSUMÉ FINAL ==========
afterAll(() => {
  console.log(`
  📊 RÉSUMÉ TESTS CHAMP NIVEAU DU BÉNÉFICIAIRE
  ============================================
  ✅ Champ beneficiaryLevel ajouté au modèle (obligatoire)
  ✅ Validation backend avec express-validator
  ✅ Tous les niveaux scolaires supportés
  ✅ Erreurs appropriées pour valeurs invalides/manquantes
  ✅ Intégration parfaite avec beneficiaryType
  
  📋 NIVEAUX VALIDÉS:
  - Primaire: CP, CE1, CE2, CM1, CM2
  - Collège: 6ème, 5ème, 4ème, 3ème  
  - Lycée: Seconde, Première, Terminale
  
  🔧 VALIDATIONS BACKEND:
  - Champ obligatoire (required: true)
  - Enum avec tous les niveaux
  - Express-validator pour routes API
  
  🔄 PRÊT POUR TESTS FRONTEND UI
  `);
});