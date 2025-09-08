// Test de workflow complet : Cycle de vie d'un prospect avec suppression
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Family = require('../../models/Family');
const Student = require('../../models/Student');
const CouponSeries = require('../../models/CouponSeries');
const Coupon = require('../../models/Coupon');
const SettlementNote = require('../../models/SettlementNote');
const User = require('../../models/User');
const Subject = require('../../models/Subject');

let mongoServer;
let adminToken;

describe('Prospect Lifecycle Workflow', () => {
  beforeAll(async () => {
    // Fermer toute connexion existante
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Démarrer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Se connecter à la base de données de test
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Créer un utilisateur admin
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    // Obtenir le token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await Promise.all([
      Family.deleteMany({}),
      Student.deleteMany({}),
      CouponSeries.deleteMany({}),
      Coupon.deleteMany({}),
      SettlementNote.deleteMany({}),
      Subject.deleteMany({})
    ]);
  });

  describe('Workflow complet : Prospect → Conversion → Suppression', () => {
    it('should handle complete prospect lifecycle with deletion', async () => {
      console.log('🚀 === DÉBUT DU WORKFLOW PROSPECT ===');
      
      // ===== ÉTAPE 1: CRÉATION DU PROSPECT =====
      console.log('📋 ÉTAPE 1: Création d\'un nouveau prospect');
      
      const prospectData = {
        primaryContact: {
          gender: 'Mme',
          firstName: 'Marie',
          lastName: 'Dubois',
          email: 'marie.dubois@email.com',
          primaryPhone: '0123456789'
        },
        address: {
          street: '15 Avenue des Lilas',
          city: 'Lyon',
          postalCode: '69000'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Mathématiques', 'Physique']
        },
        status: 'prospect',
        prospectStatus: 'en_reflexion',
        nextActionReminderSubject: 'Présenter nos cours',
        notes: 'Famille intéressée par des cours de maths niveau lycée'
      };

      const createProspectRes = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(prospectData)
        .expect(201);

      const prospect = createProspectRes.body.family;
      expect(prospect.status).toBe('prospect');
      expect(prospect.prospectStatus).toBe('en_reflexion');
      
      console.log(`✅ Prospect créé: ${prospect.primaryContact.firstName} ${prospect.primaryContact.lastName} (ID: ${prospect._id})`);

      // ===== ÉTAPE 2: AJOUT D'UN ÉLÈVE =====
      console.log('📋 ÉTAPE 2: Ajout d\'un élève à la famille');
      
      const studentData = {
        firstName: 'Lucas',
        lastName: 'Dubois',
        family: prospect._id,
        dateOfBirth: new Date('2006-03-15'),
        school: {
          name: 'Lycée Jean Moulin',
          level: 'lycee',
          grade: '1ère'
        }
      };

      const student = await Student.create(studentData);
      await Family.findByIdAndUpdate(prospect._id, {
        $push: { students: student._id }
      });
      
      console.log(`✅ Élève ajouté: ${student.firstName} ${student.lastName} - ${student.school.grade}`);

      // ===== ÉTAPE 3: ÉVOLUTION DU STATUT PROSPECT =====
      console.log('📋 ÉTAPE 3: Évolution du statut prospect');
      
      const statusUpdateRes = await request(app)
        .patch(`/api/families/${prospect._id}/prospect-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ prospectStatus: 'ndr_editee' })
        .expect(200);

      expect(statusUpdateRes.body.family.prospectStatus).toBe('ndr_editee');
      console.log('✅ Statut mis à jour: en_reflexion → ndr_editee');

      // ===== ÉTAPE 4: CONVERSION EN CLIENT AVEC NDR =====
      console.log('📋 ÉTAPE 4: Conversion en client avec création NDR');
      
      // Créer une matière pour la NDR
      const subject = await Subject.create({
        name: 'Mathématiques',
        category: 'Scientifique'
      });

      // Convertir en client
      const conversionRes = await request(app)
        .patch(`/api/families/${prospect._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'client' })
        .expect(200);

      expect(conversionRes.body.family.status).toBe('client');
      console.log('✅ Prospect converti en client');

      // Créer une NDR directement pour le test
      const ndr = await SettlementNote.create({
        familyId: prospect._id,
        studentIds: [student._id],
        clientName: 'Marie Dubois',
        department: 'Rhône',
        paymentMethod: 'transfer',
        subjects: [{
          subjectId: subject._id,
          hourlyRate: 45,
          quantity: 20,
          professorSalary: 35
        }],
        charges: 6.50,
        notes: 'NDR pour cours de mathématiques niveau 1ère',
        createdBy: (await User.findOne({ role: 'admin' }))._id
      });

      // Ajouter la NDR à la famille
      await Family.findByIdAndUpdate(prospect._id, {
        $push: { settlementNotes: ndr._id }
      });
      
      console.log(`✅ NDR créée: ${ndr.clientName} - ${ndr.subjects[0].quantity}h à ${ndr.subjects[0].hourlyRate}€/h`);

      // ===== ÉTAPE 5: CRÉATION SÉRIE DE COUPONS (MANUELLE POUR TEST) =====
      console.log('📋 ÉTAPE 5: Création d\'une série de coupons (simulation)');
      
      // Créer une série directement en base pour le test
      const couponSeries = await CouponSeries.create({
        settlementNoteId: ndr._id,
        familyId: prospect._id,
        studentId: student._id,
        subject: subject._id,
        totalCoupons: 20,
        usedCoupons: 0,
        status: 'active',
        hourlyRate: 45,
        professorSalary: 35,
        createdBy: (await User.findOne({ role: 'admin' }))._id
      });

      // Créer quelques coupons individuels
      const couponsToCreate = [];
      for (let i = 1; i <= 20; i++) {
        couponsToCreate.push({
          couponSeriesId: couponSeries._id,
          familyId: prospect._id,
          code: `MATH-${i.toString().padStart(3, '0')}`,
          status: 'available'
        });
      }
      await Coupon.insertMany(couponsToCreate);

      console.log(`✅ Série créée: ${couponSeries.totalCoupons} coupons - ${couponSeries.hourlyRate}€/h`);

      // ===== ÉTAPE 6: VÉRIFICATION DE L'ÉCOSYSTÈME =====
      console.log('📋 ÉTAPE 6: Vérification de l\'écosystème complet');
      
      // Vérifier que tout est lié correctement
      const familyWithData = await Family.findById(prospect._id)
        .populate('students')
        .populate('settlementNotes');
      
      const allCoupons = await Coupon.find({ familyId: prospect._id });
      const allSeries = await CouponSeries.find({ familyId: prospect._id });
      const allNDR = await SettlementNote.find({ familyId: prospect._id });

      expect(familyWithData.students.length).toBe(1);
      expect(allSeries.length).toBe(1);
      expect(allCoupons.length).toBe(20); // 20 coupons créés
      expect(allNDR.length).toBeGreaterThanOrEqual(1);

      console.log(`✅ Écosystème validé: 1 famille, 1 élève, ${allSeries.length} série, ${allCoupons.length} coupons, ${allNDR.length} NDR`);

      // ===== ÉTAPE 7: CHANGEMENT D'AVIS - RETOUR EN PROSPECT =====
      console.log('📋 ÉTAPE 7: Changement d\'avis - Retour en statut prospect');
      
      const revertRes = await request(app)
        .patch(`/api/families/${prospect._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'prospect' })
        .expect(200);

      expect(revertRes.body.family.status).toBe('prospect');
      console.log('✅ Client reconverti en prospect (changement d\'avis)');

      // ===== ÉTAPE 8: DÉCISION DE SUPPRESSION =====
      console.log('📋 ÉTAPE 8: Décision de suppression du prospect');
      
      console.log('⚠️  Analyse des éléments à supprimer avant suppression:');
      console.log(`   - Famille: ${familyWithData.primaryContact.firstName} ${familyWithData.primaryContact.lastName}`);
      console.log(`   - Élèves: ${familyWithData.students.length}`);
      console.log(`   - Séries de coupons: ${allSeries.length}`);
      console.log(`   - Coupons individuels: ${allCoupons.length}`);
      console.log(`   - Notes de règlement: ${allNDR.length}`);

      // ===== ÉTAPE 9: SUPPRESSION EN CASCADE =====
      console.log('📋 ÉTAPE 9: Suppression complète en cascade');
      
      const deleteRes = await request(app)
        .delete(`/api/families/${prospect._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteRes.body.message).toContain('supprimés avec succès');
      expect(deleteRes.body.deletedItems).toBeDefined();
      expect(deleteRes.body.deletedItems.students).toBe(1);
      expect(deleteRes.body.deletedItems.couponSeries).toBe(1);
      expect(deleteRes.body.deletedItems.coupons).toBe(20);
      expect(deleteRes.body.deletedItems.settlementNotes).toBeGreaterThanOrEqual(1);

      console.log('✅ Suppression en cascade réussie:');
      console.log(`   - Étudiants supprimés: ${deleteRes.body.deletedItems.students}`);
      console.log(`   - Séries supprimées: ${deleteRes.body.deletedItems.couponSeries}`);
      console.log(`   - Coupons supprimés: ${deleteRes.body.deletedItems.coupons}`);
      console.log(`   - NDR supprimées: ${deleteRes.body.deletedItems.settlementNotes}`);

      // ===== ÉTAPE 10: VÉRIFICATION FINALE =====
      console.log('📋 ÉTAPE 10: Vérification de la suppression complète');
      
      // Vérifier que tout a été supprimé
      const familyAfter = await Family.findById(prospect._id);
      const studentsAfter = await Student.find({ family: prospect._id });
      const seriesAfter = await CouponSeries.find({ familyId: prospect._id });
      const couponsAfter = await Coupon.find({ familyId: prospect._id });
      const ndrAfter = await SettlementNote.find({ familyId: prospect._id });

      expect(familyAfter).toBeNull();
      expect(studentsAfter.length).toBe(0);
      expect(seriesAfter.length).toBe(0);
      expect(couponsAfter.length).toBe(0);
      expect(ndrAfter.length).toBe(0);

      console.log('✅ Vérification finale: Toutes les données ont été supprimées');
      console.log('🏁 === FIN DU WORKFLOW - SUPPRESSION COMPLÈTE ===');
    });

    it('should handle prospect deletion early in lifecycle', async () => {
      console.log('🚀 === WORKFLOW: SUPPRESSION PRÉCOCE D\'UN PROSPECT ===');
      
      // Créer un prospect simple
      const prospectData = {
        primaryContact: {
          gender: 'M.',
          firstName: 'Pierre',
          lastName: 'Martin',
          email: 'pierre.martin@email.com',
          primaryPhone: '0987654321'
        },
        address: {
          street: '8 Rue de la Paix',
          city: 'Marseille',
          postalCode: '13000'
        },
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Anglais']
        },
        status: 'prospect',
        prospectStatus: 'injoignable'
      };

      const prospectRes = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(prospectData)
        .expect(201);

      const prospect = prospectRes.body.family;
      console.log(`✅ Prospect créé: ${prospect.primaryContact.firstName} ${prospect.primaryContact.lastName}`);
      console.log(`   Status: ${prospect.prospectStatus} (injoignable)`);

      // Suppression immédiate (prospect injoignable)
      console.log('⚠️  Décision: Suppression du prospect injoignable');
      
      const deleteRes = await request(app)
        .delete(`/api/families/${prospect._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteRes.body.deletedItems.students).toBe(0); // Pas d'élèves
      expect(deleteRes.body.deletedItems.couponSeries).toBe(0); // Pas de séries
      expect(deleteRes.body.deletedItems.coupons).toBe(0); // Pas de coupons
      expect(deleteRes.body.deletedItems.settlementNotes).toBe(0); // Pas de NDR

      console.log('✅ Suppression simple réussie (prospect sans éléments liés)');
      console.log('🏁 === FIN DU WORKFLOW SIMPLE ===');
    });
  });

  describe('Scénarios d\'erreur dans le workflow', () => {
    it('should handle deletion of non-existent prospect', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const deleteRes = await request(app)
        .delete(`/api/families/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(deleteRes.body.message).toBe('Famille non trouvée');
    });

    it('should prevent deletion without admin rights', async () => {
      // Créer un prospect
      const prospectRes = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          primaryContact: {
            gender: 'Mme',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@email.com',
            primaryPhone: '0123456789'
          },
          address: {
            street: 'Test Street',
            city: 'Test City',
            postalCode: '12345'
          },
          demande: {
            beneficiaryType: 'eleves'
          },
          status: 'prospect'
        });

      const prospect = prospectRes.body.family;

      // Tenter suppression sans token
      await request(app)
        .delete(`/api/families/${prospect._id}`)
        .expect(401);

      // Le prospect doit encore exister
      const stillExists = await Family.findById(prospect._id);
      expect(stillExists).toBeTruthy();
    });

    it('should provide detailed deletion preview', async () => {
      console.log('🔍 === TEST DE L\'APERÇU DE SUPPRESSION ===');
      
      // Créer un prospect avec des éléments liés pour tester l'aperçu
      const prospectData = {
        primaryContact: {
          gender: 'M.',
          firstName: 'Jean',
          lastName: 'Preview',
          email: 'jean.preview@test.com',
          primaryPhone: '0123456789'
        },
        address: {
          street: '10 Rue Preview',
          city: 'Test City',
          postalCode: '12345'
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Mathématiques']
        },
        status: 'prospect'
      };

      const prospectRes = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(prospectData);

      const prospect = prospectRes.body.family;
      console.log(`✅ Prospect créé pour test aperçu: ${prospect.primaryContact.firstName} ${prospect.primaryContact.lastName}`);

      // Ajouter un élève
      const student = await Student.create({
        firstName: 'Paul',
        lastName: 'Preview',
        family: prospect._id,
        dateOfBirth: new Date('2008-05-15'),
        school: {
          name: 'Collège Test',
          level: 'college',
          grade: '3ème'
        }
      });

      // Ajouter une matière
      const subject = await Subject.create({
        name: 'Mathématiques',
        category: 'Sciences'
      });

      // Ajouter une NDR
      const ndr = await SettlementNote.create({
        familyId: prospect._id,
        studentIds: [student._id],
        clientName: 'Jean Preview',
        department: 'Test',
        paymentMethod: 'transfer',
        subjects: [{
          subjectId: subject._id,
          hourlyRate: 40,
          quantity: 15,
          professorSalary: 30
        }],
        charges: 5.00,
        createdBy: (await User.findOne({ role: 'admin' }))._id
      });

      // Ajouter une série de coupons
      const series = await CouponSeries.create({
        settlementNoteId: ndr._id,
        familyId: prospect._id,
        studentId: student._id,
        subject: subject._id,
        totalCoupons: 15,
        usedCoupons: 3,
        status: 'active',
        hourlyRate: 40,
        professorSalary: 30,
        createdBy: (await User.findOne({ role: 'admin' }))._id
      });

      // Ajouter des coupons individuels
      await Coupon.create({
        couponSeriesId: series._id,
        familyId: prospect._id,
        code: 'PREVIEW-001',
        status: 'available'
      });

      await Coupon.create({
        couponSeriesId: series._id,
        familyId: prospect._id,
        code: 'PREVIEW-002',
        status: 'available'
      });

      await Coupon.create({
        couponSeriesId: series._id,
        familyId: prospect._id,
        code: 'PREVIEW-003',
        status: 'expired'
      });

      console.log('🔧 Écosystème test créé : 1 élève, 1 NDR, 1 série, 3 coupons');

      // Tester l'aperçu de suppression
      const previewRes = await request(app)
        .get(`/api/families/${prospect._id}/deletion-preview`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const preview = previewRes.body;
      console.log('📋 Aperçu de suppression reçu:', JSON.stringify(preview, null, 2));

      // Valider la structure de l'aperçu
      expect(preview.family).toBeDefined();
      expect(preview.family.name).toBe('Jean Preview');
      expect(preview.family.status).toBe('prospect');

      expect(preview.itemsToDelete).toBeDefined();
      expect(preview.itemsToDelete.students.count).toBe(1);
      expect(preview.itemsToDelete.students.details[0].name).toBe('Paul Preview');
      expect(preview.itemsToDelete.students.details[0].grade).toBe('3ème');

      expect(preview.itemsToDelete.settlementNotes.count).toBe(1);
      expect(preview.itemsToDelete.settlementNotes.details[0].clientName).toBe('Jean Preview');
      expect(preview.itemsToDelete.settlementNotes.details[0].totalHours).toBe(15);

      expect(preview.itemsToDelete.couponSeries.count).toBe(1);
      expect(preview.itemsToDelete.couponSeries.details[0].subject).toBe('Mathématiques');
      expect(preview.itemsToDelete.couponSeries.details[0].totalCoupons).toBe(15);
      expect(preview.itemsToDelete.couponSeries.details[0].usedCoupons).toBe(3);
      expect(preview.itemsToDelete.couponSeries.details[0].remainingCoupons).toBe(12);

      expect(preview.itemsToDelete.coupons.count).toBe(3);
      expect(preview.itemsToDelete.coupons.availableCount).toBe(2);
      expect(preview.itemsToDelete.coupons.usedCount).toBe(0);

      expect(preview.totalItems).toBe(6); // 1 élève + 1 NDR + 1 série + 3 coupons

      console.log('✅ Aperçu de suppression validé avec succès');
      console.log(`📊 Total éléments à supprimer: ${preview.totalItems}`);
      console.log('🏁 === FIN TEST APERÇU DE SUPPRESSION ===');
    });
  });
});