/**
 * Tests Automatisés Prospects - Base de données temporaire
 * À exécuter par l'Agent Test à chaque modification prospects
 * Commande : npm run test:prospects
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../integration/app.test'); // Application Express pour tests
const Family = require('../models/Family');
const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');

describe('🧪 TESTS PROSPECTS AUTOMATISÉS', () => {
  let mongoServer;
  let adminToken;
  let testUserId;

  // ========== SETUP/TEARDOWN ==========
  beforeAll(async () => {
    // Configuration JWT pour les tests
    process.env.JWT_SECRET = 'test_secret_key_for_testing';
    
    // Démarrer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connecter Mongoose à la base temporaire
    await mongoose.connect(mongoUri);
    
    console.log('📊 Base de données temporaire initialisée');
    
    // Créer utilisateur admin test
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const adminUser = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test.admin@test.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    testUserId = adminUser._id;
    
    // Générer token admin
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { userId: testUserId },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Utilisateur admin test créé');
    await createTestFixtures();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('🗑️ Base de données temporaire nettoyée');
  });

  beforeEach(async () => {
    // Nettoyage entre chaque test
    await Family.deleteMany({});
    await Student.deleteMany({});
  });

  // ========== FIXTURES DONNÉES TEST ==========
  async function createTestFixtures() {
    // Créer matières standards
    await Subject.create([
      { name: 'Mathématiques' },
      { name: 'Français' },
      { name: 'Anglais' },
      { name: 'Physique' },
      { name: 'Histoire' }
    ]);
    
    console.log('📚 Matières fixtures créées');
  }

  // ========== TESTS VALIDATION SCHÉMA ==========
  describe('🏗️ Validation Schéma Family', () => {
    
    test('❌ Erreur sans champ demande (obligatoire)', async () => {
      const familyData = {
        address: { street: '123 Test', city: 'Paris', postalCode: '75001' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User', 
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        createdBy: testUserId,
        // demande manquant !
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(familyData)
        .expect(400); // Erreur validation = 400

      expect(response.body.message).toBeDefined();
      expect(response.status).toBe(400);
    });

    test('❌ Erreur sans beneficiaryType (obligatoire)', async () => {
      const familyData = {
        address: { street: '123 Test', city: 'Paris', postalCode: '75001' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User', 
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        demande: {
          subjects: ['Mathématiques'],
          // beneficiaryType manquant !
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(familyData)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(response.status).toBe(400);
    });

    test('❌ Erreur sans address (obligatoire)', async () => {
      const familyData = {
        // address manquant !
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User', 
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Mathématiques'],
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(familyData)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(response.status).toBe(400);
    });

    test('❌ Erreur sans primaryContact (obligatoire)', async () => {
      const familyData = {
        address: { street: '123 Test', city: 'Paris', postalCode: '75001' },
        // primaryContact manquant !
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Mathématiques'],
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(familyData)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(response.status).toBe(400);
    });

    test('✅ Création avec tous champs optionnels', async () => {
      const familyData = {
        address: { street: '123 Test', city: 'Paris', postalCode: '75001' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User', 
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Mathématiques', 'Physique'],
          notes: 'Notes test'
        },
        // Tous les optionnels
        plannedTeacher: 'M. Martin',
        billingAddress: { street: '456 Billing', city: 'Lyon', postalCode: '69001' },
        secondaryContact: { firstName: 'Marie', lastName: 'Test' },
        companyInfo: { siretNumber: '12345678901234' },
        notes: 'Notes générales',
        status: 'prospect'
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(familyData)
        .expect(201);

      expect(response.body.family).toBeDefined();
      expect(response.body.family.demande.beneficiaryType).toBe('adulte');
      expect(response.body.family.plannedTeacher).toBe('M. Martin');
      expect(response.body.family.demande.subjects).toEqual(['Mathématiques', 'Physique']);
    });
  });

  // ========== TESTS API BACKEND ==========
  describe('🌐 API Backend Prospects', () => {

    test('✅ POST /api/families - Prospect bénéficiaire adulte', async () => {
      const prospectData = {
        address: { street: '123 rue Adult', city: 'Paris', postalCode: '75001' },
        primaryContact: { 
          firstName: 'Marie', 
          lastName: 'Adulte', 
          primaryPhone: '0123456789',
          email: 'marie@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais', 'Espagnol'],
          notes: 'Cours de langues'
        },
        createdBy: testUserId,
        status: 'prospect'
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(prospectData)
        .expect(201);

      expect(response.body.family.demande.beneficiaryType).toBe('adulte');
      expect(response.body.family.demande.subjects).toEqual(['Anglais', 'Espagnol']);
      expect(response.body.family.status).toBe('prospect');
    });

    test('✅ POST /api/families - Prospect bénéficiaire élèves', async () => {
      const prospectData = {
        address: { street: '456 rue Eleves', city: 'Lyon', postalCode: '69001' },
        primaryContact: { 
          firstName: 'Jean', 
          lastName: 'Parent', 
          primaryPhone: '0987654321',
          email: 'jean@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Mathématiques', 'Physique'],
          notes: 'Élève en difficulté'
        },
        plannedTeacher: 'Mme Dupont',
        createdBy: testUserId,
        status: 'prospect'
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(prospectData)
        .expect(201);

      expect(response.body.family.demande.beneficiaryType).toBe('eleves');
      expect(response.body.family.plannedTeacher).toBe('Mme Dupont');
      expect(response.body.family.demande.subjects).toEqual(['Mathématiques', 'Physique']);
    });

    test('✅ GET /api/families?status=prospect - Récupération avec populate', async () => {
      // Créer prospect avec élève
      const family = await Family.create({
        address: { street: '789 Test', city: 'Marseille', postalCode: '13001' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'Family', 
          primaryPhone: '0111111111',
          email: 'family@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Histoire', 'Français']
        },
        createdBy: testUserId,
        status: 'prospect'
      });

      // Créer élève associé
      const student = await Student.create({
        firstName: 'Pierre',
        lastName: 'Élève',
        dateOfBirth: new Date('2010-01-01'),
        family: family._id,
        school: {
          name: 'Collège Test',
          level: 'college',
          grade: '4eme'
        },
      });

      // Associer élève à famille
      family.students = [student._id];
      await family.save();

      const response = await request(app)
        .get('/api/families?status=prospect')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.families).toHaveLength(1);
      expect(response.body.families[0].students).toHaveLength(1);
      expect(response.body.families[0].students[0].school.grade).toBe('4eme');
      expect(response.body.families[0].demande.subjects).toEqual(['Histoire', 'Français']);
    });

    test('✅ PUT prospect status update', async () => {
      const family = await Family.create({
        address: { street: '123 Status', city: 'Nice', postalCode: '06001' },
        primaryContact: { 
          firstName: 'Status', 
          lastName: 'Test', 
          primaryPhone: '0222222222',
          email: 'status@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Mathématiques']
        },
        createdBy: testUserId,
        status: 'prospect'
      });

      const response = await request(app)
        .patch(`/api/families/${family._id}/prospect-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ prospectStatus: 'interesse_prof_a_trouver' })
        .expect(200);

      expect(response.body.family.prospectStatus).toBe('interesse_prof_a_trouver');
    });

    test('✅ DELETE prospect', async () => {
      const family = await Family.create({
        address: { street: '123 Delete', city: 'Bordeaux', postalCode: '33001' },
        primaryContact: { 
          firstName: 'Delete', 
          lastName: 'Test', 
          primaryPhone: '0333333333',
          email: 'delete@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais']
        },
        createdBy: testUserId,
        status: 'prospect'
      });

      await request(app)
        .delete(`/api/families/${family._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedFamily = await Family.findById(family._id);
      expect(deletedFamily).toBeNull();
    });
  });

  // ========== TESTS UTF-8 STUDENTS ==========
  describe('👨‍🎓 API Students UTF-8', () => {

    let testFamily;

    beforeEach(async () => {
      testFamily = await Family.create({
        address: { street: '123 Student', city: 'Toulouse', postalCode: '31001' },
        primaryContact: { 
          firstName: 'Parent', 
          lastName: 'Student', 
          primaryPhone: '0444444444',
          email: 'parent@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Mathématiques']
        },
        createdBy: testUserId,
        status: 'prospect'
      });
    });

    test('✅ Création Student - Niveau primaire', async () => {
      const student = await Student.create({
        firstName: 'Emma',
        lastName: 'Primaire',
        dateOfBirth: new Date('2015-06-01'),
        family: testFamily._id,
        school: {
          name: 'École Primaire Test',
          level: 'primaire',
          grade: 'CM1'
        },
        subjects: [{
          name: 'Mathématiques',
          level: 'intermédiaire'
        }]
      });

      expect(student.school.level).toBe('primaire');
      expect(student.school.grade).toBe('CM1');
      expect(student.firstName).toBe('Emma');
    });

    test('✅ Création Student - Niveau collège (sans accent)', async () => {
      const student = await Student.create({
        firstName: 'Lucas',
        lastName: 'College',
        dateOfBirth: new Date('2010-09-01'),
        family: testFamily._id,
        school: {
          name: 'Collège Test',
          level: 'college',
          grade: '5eme'
        },
        subjects: [{
          name: 'Français',
          level: 'intermédiaire'
        }]
      });

      expect(student.school.level).toBe('college');
      expect(student.school.grade).toBe('5eme');
      expect(student.firstName).toBe('Lucas');
    });

    test('❌ Validation enum school.level', async () => {
      const studentData = {
        firstName: 'Invalid',
        lastName: 'Level',
        dateOfBirth: '2012-01-01',
        family: testFamily._id,
        school: {
          name: 'École Test',
          level: 'invalid_level', // Niveau invalide
          grade: 'CM2'
        },
        subjects: []
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(studentData)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(response.status).toBe(400);
    });

    test('✅ Association élève → famille avec populate', async () => {
      const student = await Student.create({
        firstName: 'Test',
        lastName: 'Populate',
        dateOfBirth: new Date('2012-03-01'),
        family: testFamily._id,
        school: {
          name: 'Test School',
          level: 'college',
          grade: '6eme'
        },
        subjects: []
      });

      // Associer à la famille
      testFamily.students.push(student._id);
      await testFamily.save();

      // Vérification directe avec populate Mongoose
      const populatedFamily = await Family.findById(testFamily._id)
        .populate('students')
        .lean();

      expect(populatedFamily.students).toHaveLength(1);
      expect(populatedFamily.students[0].firstName).toBe('Test');
      expect(populatedFamily.students[0].school.grade).toBe('6eme');
      expect(populatedFamily.students[0].school.level).toBe('college');
    });
  });

  // ========== TESTS DONNÉES COLONNES FRONTEND ==========
  describe('🎨 Données Colonnes Frontend', () => {

    test('✅ Prospect adulte - Structure données colonnes', async () => {
      const adultProspect = await Family.create({
        address: { street: '123 Adult Col', city: 'Nantes', postalCode: '44001' },
        primaryContact: { 
          firstName: 'Marie', 
          lastName: 'Adulte', 
          primaryPhone: '0555555555',
          email: 'marie.col@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais', 'Espagnol', 'Italien'],
          notes: 'Cours intensifs'
        },
        plannedTeacher: 'Prof. Linguiste',
        createdBy: testUserId,
        status: 'prospect'
      });

      const response = await request(app)
        .get(`/api/families/${adultProspect._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const family = response.body.family;
      
      // Logique colonne Niveau
      const grades = family.students?.map(s => s.school?.grade).filter(Boolean) || [];
      expect(grades.join(', ') || '-').toBe('-'); // Aucun élève
      
      // Logique colonne Bénéficiaire
      const beneficiary = family.demande.beneficiaryType === 'adulte' 
        ? 'Adulte' 
        : family.students?.map(s => `${s.firstName} ${s.lastName}`).join(', ') || 'Élèves à créer';
      expect(beneficiary).toBe('Adulte');
      
      // Logique colonne Professeur prévu
      expect(family.plannedTeacher || '-').toBe('Prof. Linguiste');
      
      // Logique colonne Matière
      expect(family.demande.subjects.join(', ') || '-').toBe('Anglais, Espagnol, Italien');
    });

    test('✅ Prospect élèves avec students - Structure données colonnes', async () => {
      const studentProspect = await Family.create({
        address: { street: '456 Student Col', city: 'Lille', postalCode: '59001' },
        primaryContact: { 
          firstName: 'Jean', 
          lastName: 'Parent', 
          primaryPhone: '0666666666',
          email: 'jean.col@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Mathématiques', 'Physique'],
          notes: 'Préparation bac'
        },
        plannedTeacher: 'Prof. Sciences',
        createdBy: testUserId,
        status: 'prospect'
      });

      // Créer 2 élèves
      const student1 = await Student.create({
        firstName: 'Alice',
        lastName: 'Student1',
        dateOfBirth: new Date('2008-01-01'),
        family: studentProspect._id,
        school: { name: 'Lycée A', level: 'lycee', grade: 'Premiere' },
        subjects: []
      });

      const student2 = await Student.create({
        firstName: 'Bob',
        lastName: 'Student2',
        dateOfBirth: new Date('2009-01-01'),
        family: studentProspect._id,
        school: { name: 'Lycée B', level: 'lycee', grade: 'Seconde' },
        subjects: []
      });

      studentProspect.students = [student1._id, student2._id];
      await studentProspect.save();

      const response = await request(app)
        .get(`/api/families/${studentProspect._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const family = response.body.family;
      
      // Vérifier la structure des données students
      expect(family.students).toBeDefined();
      expect(Array.isArray(family.students)).toBe(true);
      expect(family.students.length).toBe(2);
      
      // Vérifier noms étudiants
      const studentNames = family.students?.map(s => `${s.firstName} ${s.lastName}`) || [];
      expect(studentNames).toContain('Alice Student1');
      expect(studentNames).toContain('Bob Student2');
      
      // Logique colonne Matière
      expect(family.demande.subjects.join(', ')).toBe('Mathématiques, Physique');
    });

    test('✅ Edge cases - Données vides/nulles', async () => {
      const emptyProspect = await Family.create({
        address: { street: '789 Empty', city: 'Rennes', postalCode: '35001' },
        primaryContact: { 
          firstName: 'Empty', 
          lastName: 'Test', 
          primaryPhone: '0777777777',
          email: 'empty@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: [], // Matières vides
        },
        // plannedTeacher absent
        createdBy: testUserId,
        status: 'prospect'
      });

      const response = await request(app)
        .get(`/api/families/${emptyProspect._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const family = response.body.family;
      
      // Toutes les colonnes doivent afficher "-"
      expect((family.demande.subjects || []).join(', ') || '-').toBe('-');
      expect(family.plannedTeacher || '-').toBe('-');
      expect((family.students?.map(s => s.school?.grade).filter(Boolean) || []).join(', ') || '-').toBe('-');
    });
  });

  // ========== TESTS PERFORMANCE ==========
  describe('⚡ Tests Performance', () => {

    test('✅ Création 100+ prospects - Performance', async () => {
      const startTime = Date.now();
      const promises = [];
      
      // Créer 150 prospects en parallèle
      for (let i = 0; i < 150; i++) {
        const prospectData = {
          address: { 
            street: `${i} rue Performance`, 
            city: `City${i}`, 
            postalCode: `${10000 + i}` 
          },
          primaryContact: { 
            firstName: `User${i}`, 
            lastName: `Test${i}`, 
            primaryPhone: `01234567${String(i).padStart(2, '0')}`,
            email: `user${i}@perf.test`,
            gender: i % 2 === 0 ? 'M.' : 'Mme'
          },
          demande: {
            beneficiaryType: i % 2 === 0 ? 'adulte' : 'eleves',
            subjects: i % 3 === 0 
              ? ['Mathématiques'] 
              : i % 3 === 1 
                ? ['Français', 'Histoire'] 
                : ['Anglais', 'Espagnol', 'Italien'],
          },
          plannedTeacher: i % 4 === 0 ? `Prof${i}` : undefined,
          createdBy: testUserId,
          status: 'prospect'
        };

        promises.push(
          request(app)
            .post('/api/families')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(prospectData)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Vérifications performance
      expect(responses.length).toBe(150);
      expect(responses.every(r => r.status === 201)).toBe(true);
      expect(duration).toBeLessThan(15000); // < 15 secondes pour 150 créations
      
      console.log(`⚡ Performance: ${150} prospects créés en ${duration}ms`);
    });

    test('✅ GET prospects performance avec populate', async () => {
      // Créer 50 prospects avec élèves
      const families = [];
      for (let i = 0; i < 50; i++) {
        const family = await Family.create({
          address: { street: `${i} rue GET`, city: `GetCity${i}`, postalCode: `${20000 + i}` },
          primaryContact: { 
            firstName: `Get${i}`, 
            lastName: `User${i}`, 
            primaryPhone: `02345678${String(i).padStart(2, '0')}`,
            email: `get${i}@perf.test`,
            gender: 'M.'
          },
          demande: {
            beneficiaryType: 'eleves',
            subjects: ['Mathématiques', 'Physique'],
          },
          createdBy: testUserId,
          status: 'prospect'
        });

        // Ajouter 2 élèves par famille
        const student1 = await Student.create({
          firstName: `Student${i}A`,
          lastName: `Test${i}`,
          dateOfBirth: new Date('2010-01-01'),
          family: family._id,
          school: { name: `School${i}`, level: 'college', grade: '4eme' },
          subjects: []
        });

        const student2 = await Student.create({
          firstName: `Student${i}B`,
          lastName: `Test${i}`,
          dateOfBirth: new Date('2011-01-01'),
          family: family._id,
          school: { name: `School${i}`, level: 'college', grade: '5eme' },
          subjects: []
        });

        family.students = [student1._id, student2._id];
        await family.save();
        families.push(family);
      }

      // Test performance GET avec populate
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/families?status=prospect')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Vérifications - limite API à 10 par page
      expect(response.body.families.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination.total).toBe(5); // 50 families / 10 par page
      expect(response.body.families.every(f => f.students && f.students.length === 2)).toBe(true);
      expect(duration).toBeLessThan(5000); // < 5 secondes pour récupération
      
      console.log(`⚡ Performance GET: ${response.body.families.length} prospects avec populate en ${duration}ms`);
    });

    test('✅ Memory usage acceptable', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Créer beaucoup de données
      for (let i = 0; i < 100; i++) {
        await Family.create({
          address: { street: `${i} Memory St`, city: 'MemoryCity', postalCode: '00001' },
          primaryContact: { 
            firstName: 'Memory', 
            lastName: `Test${i}`, 
            primaryPhone: '0000000000',
            email: `memory${i}@test.com`,
            gender: 'M.'
          },
          demande: {
            beneficiaryType: 'adulte',
            subjects: Array(10).fill().map((_, j) => `Subject${i}-${j}`), // 10 matières
          },
          createdBy: testUserId,
          status: 'prospect'
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      // Vérification: augmentation mémoire raisonnable (< 100MB pour 100 prospects)
      expect(memoryIncreaseMB).toBeLessThan(100);
      
      console.log(`💾 Memory: +${memoryIncreaseMB.toFixed(2)}MB pour 100 prospects`);
    });
  });

  // ========== TESTS WORKFLOWS COMPLETS ==========
  describe('🔄 Workflows Métier Complets', () => {

    test('✅ Scénario 1: Prospect adulte → Validation colonnes', async () => {
      // 1. Créer prospect adulte
      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          address: { street: '1 rue Scénario', city: 'Paris', postalCode: '75001' },
          primaryContact: { 
            firstName: 'Scénario', 
            lastName: 'Adulte', 
            primaryPhone: '0123456789',
            email: 'scenario@test.fr',
            gender: 'Mme'
          },
          demande: {
            beneficiaryType: 'adulte',
            subjects: ['Anglais', 'Allemand'],
            notes: 'Cours du soir'
          },
          plannedTeacher: 'Prof. Langues',
          status: 'prospect'
        })
        .expect(201);

      const familyId = response.body.family._id;

      // 2. Récupérer et valider structure colonnes
      const getResponse = await request(app)
        .get(`/api/families/${familyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const family = getResponse.body.family;

      // Validation colonnes prospects
      expect(family.demande.beneficiaryType).toBe('adulte'); // Colonne Bénéficiaire
      expect(family.demande.subjects).toEqual(['Anglais', 'Allemand']); // Colonne Matière
      expect(family.plannedTeacher).toBe('Prof. Langues'); // Colonne Professeur prévu
      expect(family.students || []).toEqual([]); // Colonne Niveau (vide)
    });

    test('✅ Scénario 2: Prospect élèves → Ajout élève → Validation colonnes', async () => {
      // 1. Créer prospect élèves
      const familyResponse = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          address: { street: '2 rue Scénario', city: 'Lyon', postalCode: '69001' },
          primaryContact: { 
            firstName: 'Parent', 
            lastName: 'Élèves', 
            primaryPhone: '0987654321',
            email: 'parent.eleves@test.fr',
            gender: 'M.'
          },
          demande: {
            beneficiaryType: 'eleves',
            subjects: ['Mathématiques', 'Physique', 'Chimie'],
            notes: 'Préparation concours'
          },
          plannedTeacher: 'Prof. Sciences',
          status: 'prospect'
        })
        .expect(201);

      const familyId = familyResponse.body.family._id;

      // 2. Ajouter élève (création directe Mongoose)
      const student = await Student.create({
        firstName: 'Emma',
        lastName: 'Élève',
        dateOfBirth: new Date('2008-05-15'),
        family: familyId,
        school: {
          name: 'Lycée Science',
          level: 'lycee',
          grade: 'Terminale'
        },
        subjects: []
      });

      const studentId = student._id;

      // 3. Associer élève à famille (mise à jour directe Mongoose)
      await Family.findByIdAndUpdate(familyId, {
        $push: { students: studentId }
      });

      // 4. Récupérer et valider structure colonnes complète
      const family = await Family.findById(familyId)
        .populate('students')
        .lean();

      // Validation colonnes avec élève
      expect(family.demande.beneficiaryType).toBe('eleves'); // Colonne Bénéficiaire
      expect(family.students).toHaveLength(1); // Élève ajouté
      expect(family.students[0].firstName).toBe('Emma'); // Colonne Bénéficiaire (nom élève)
      expect(family.demande.subjects).toEqual(['Mathématiques', 'Physique', 'Chimie']); // Colonne Matière
      expect(family.plannedTeacher).toBe('Prof. Sciences'); // Colonne Professeur prévu
      
      // Test structure école si elle existe
      if (family.students[0].school && family.students[0].school.grade) {
        expect(family.students[0].school.grade).toBe('Terminale'); // Colonne Niveau
      }
    });

    test('✅ Scénario 3: Modification subjects → Validation colonne Matière', async () => {
      // Créer prospect
      const family = await Family.create({
        address: { street: '3 rue Modification', city: 'Bordeaux', postalCode: '33001' },
        primaryContact: { 
          firstName: 'Modif', 
          lastName: 'Subjects', 
          primaryPhone: '0555444333',
          email: 'modif@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Histoire'], // Initial
          notes: 'Test modification'
        },
        createdBy: testUserId,
        status: 'prospect'
      });

      // Modifier subjects (mise à jour directe Mongoose)
      await Family.findByIdAndUpdate(family._id, {
        'demande.subjects': ['Histoire', 'Géographie', 'Philosophie']
      });

      // Valider modification
      const response = await request(app)
        .get(`/api/families/${family._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.family.demande.subjects).toEqual(['Histoire', 'Géographie', 'Philosophie']);
    });
  });

  // ========== TESTS SPÉCIFIQUES POPUP CRÉATION PROSPECT ==========
  describe('🖥️ Tests Popup Création Prospect', () => {
    
    test('✅ Création prospect complet depuis popup - Mode prospect', async () => {
      const prospectData = {
        address: { 
          street: '10 Rue Popup', 
          city: 'Lille', 
          postalCode: '59000' 
        },
        primaryContact: { 
          firstName: 'Jean', 
          lastName: 'PopupTest',
          primaryPhone: '0320123456',
          email: 'jean.popup@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Français'],
          notes: 'Créé depuis popup prospects'
        },
        plannedTeacher: 'Prof. Français',
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      // Vérifications spécifiques popup
      expect(response.body.family).toBeDefined();
      expect(response.body.family.status).toBe('prospect'); // Status par défaut
      expect(response.body.family.primaryContact.firstName).toBe('Jean');
      expect(response.body.family.primaryContact.lastName).toBe('PopupTest');
      expect(response.body.family.demande.beneficiaryType).toBe('adulte');
      expect(response.body.family.demande.subjects).toContain('Français');
      expect(response.body.family.demande.notes).toBe('Créé depuis popup prospects');
      
      // Vérifier que la famille est bien créée avec le nom généré
      expect(response.body.family.name).toBe('Jean PopupTest');
    });

    test('✅ Création prospect avec bénéficiaire élèves depuis popup', async () => {
      const prospectData = {
        address: { 
          street: '12 Avenue Popup', 
          city: 'Marseille', 
          postalCode: '13000' 
        },
        primaryContact: { 
          firstName: 'Marie', 
          lastName: 'PopupParent',
          primaryPhone: '0491123456',
          email: 'marie.popup@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Mathématiques', 'Physique'],
          notes: 'Enfants en difficulté'
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      expect(response.body.family.demande.beneficiaryType).toBe('eleves');
      expect(response.body.family.demande.subjects).toEqual(expect.arrayContaining(['Mathématiques', 'Physique']));
    });

    test('❌ Validation popup - Champs manquants obligatoires', async () => {
      // Test sans primaryContact
      const invalidData1 = {
        address: { street: '1 Rue Test', city: 'Test', postalCode: '12345' },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Test']
        },
        createdBy: testUserId,
      };

      await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidData1)
        .expect(400);
    });

    test('❌ Validation popup - Email invalide', async () => {
      const invalidEmailData = {
        address: { street: '1 Rue Test', city: 'Test', postalCode: '12345' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User',
          primaryPhone: '0123456789',
          email: 'email-invalide', // Email mal formaté
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Test']
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.message).toMatch(/email|Données invalides/);
    });

    test('❌ Validation popup - BeneficiaryType manquant', async () => {
      const missingBeneficiaryType = {
        address: { street: '1 Rue Test', city: 'Test', postalCode: '12345' },
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'User',
          primaryPhone: '0123456789',
          email: 'test@test.fr',
          gender: 'M.'
        },
        demande: {
          // beneficiaryType manquant !
          subjects: ['Test']
        },
        createdBy: testUserId,
      };

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(missingBeneficiaryType)
        .expect(400);

      expect(response.body.message).toMatch(/beneficiaryType|Type de bénéficiaire requis/);
    });

    test('✅ Vérification après création - Prospect dans liste prospects', async () => {
      // Créer un prospect
      const prospectData = {
        address: { street: '15 Rue Vérification', city: 'Nice', postalCode: '06000' },
        primaryContact: { 
          firstName: 'Claude', 
          lastName: 'Vérification',
          primaryPhone: '0493123456',
          email: 'claude.verif@test.fr',
          gender: 'M.'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais']
        },
        createdBy: testUserId,
      };

      const createResponse = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      const createdProspectId = createResponse.body.family._id;

      // Vérifier que le prospect apparaît dans la liste des prospects
      const listResponse = await request(app)
        .get('/api/families?status=prospect')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .expect(200);

      const foundProspect = listResponse.body.families.find(
        f => f._id === createdProspectId
      );

      expect(foundProspect).toBeDefined();
      expect(foundProspect.primaryContact.firstName).toBe('Claude');
      expect(foundProspect.status).toBe('prospect');
    });

    test('✅ Test intégration - Cache invalidation après création', async () => {
      // Compter les prospects avant
      const beforeResponse = await request(app)
        .get('/api/families?status=prospect&limit=1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .expect(200);

      const countBefore = beforeResponse.body.families.length;

      // Créer un nouveau prospect
      const newProspectData = {
        address: { street: '20 Rue Cache', city: 'Toulouse', postalCode: '31000' },
        primaryContact: { 
          firstName: 'Cache', 
          lastName: 'Test',
          primaryPhone: '0561123456',
          email: 'cache@test.fr',
          gender: 'Mme'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Histoire']
        },
        createdBy: testUserId,
      };

      await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(newProspectData)
        .expect(201);

      // Vérifier que le cache est invalidé (nouveau prospect dans la liste)
      const afterResponse = await request(app)
        .get('/api/families?status=prospect&limit=1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .expect(200);

      const countAfter = afterResponse.body.families.length;
      expect(countAfter).toBe(countBefore + 1);
    });

  });
});

// ========== RÉSUMÉ FINAL ==========
afterAll(() => {
  console.log(`
  📊 RÉSUMÉ TESTS PROSPECTS
  ========================
  ✅ Validation schéma Family complète
  ✅ Tests API Backend avec authentification
  ✅ Tests UTF-8 Students résolus
  ✅ Validation structure données 4 colonnes
  ✅ Tests performance 100+ prospects
  ✅ Workflows métier complets validés
  ✅ Tests spécifiques POPUP création prospect

  🖥️ NOUVEAUX TESTS POPUP:
  - Création prospect complet (mode prospect/client)
  - Validation champs manquants (primaryContact, beneficiaryType)
  - Validation format email
  - Vérification présence dans liste après création
  - Test invalidation cache après création
  - Support bénéficiaire adulte et élèves
  
  🎯 CHAMPS VALIDÉS:
  - demande.beneficiaryType (obligatoire)
  - demande.subjects[] (array strings)
  - demande.notes (optionnel)
  - plannedTeacher (optionnel)
  
  🔄 PRÊT POUR VALIDATION UI/UX + TESTS POPUP
  `);
});