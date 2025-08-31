const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const RendezVous = require('../../models/RendezVous');
const Family = require('../../models/Family');
const User = require('../../models/User');

describe('RDV API Tests', () => {
  let mongoServer;
  let adminToken;
  let professeurToken;
  let adminUser;
  let professeurUser;
  let testFamily;
  let testRendezVous;

  beforeAll(async () => {
    // Démarrer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connecter à la base de données de test
    await mongoose.connect(mongoUri);

    // Créer des utilisateurs de test
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    professeurUser = await User.create({
      firstName: 'Professeur',
      lastName: 'Test',
      email: 'prof@test.com',
      password: 'password123',
      role: 'professor'
    });

    // Créer une famille de test
    testFamily = await Family.create({
      primaryContact: {
        lastName: 'Dupont',
        firstName: 'Marie',
        email: 'marie.dupont@test.com',
        primaryPhone: '0123456789',
        gender: 'Mme'
      },
      address: {
        street: '123 Rue Test',
        city: 'Paris',
        postalCode: '75001'
      },
      demande: {
        beneficiaryType: 'eleves',
        beneficiaryLevel: '5ème',
        subjects: ['Mathématiques']
      },
      createdBy: adminUser._id,
      students: [] // Vide car les students sont des ObjectId vers le modèle Student
    });

    // Générer des tokens JWT
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    adminToken = adminLoginResponse.body.token;

    const profLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'prof@test.com',
        password: 'password123'
      });
    professeurToken = profLoginResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Nettoyer les RDV avant chaque test
    await RendezVous.deleteMany({});
  });

  describe('POST /api/rdv - Création de RDV', () => {
    const validRdvData = {
      familyId: null, // Sera défini dans le test
      assignedAdminId: null, // Sera défini dans le test
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
      time: '14:00',
      type: 'physique',
      notes: 'RDV de test'
    };

    beforeEach(() => {
      validRdvData.familyId = testFamily._id;
      validRdvData.assignedAdminId = adminUser._id;
    });

    test('Devrait créer un RDV valide avec succès', async () => {
      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRdvData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Rendez-vous créé avec succès');
      expect(response.body.rdv).toHaveProperty('_id');
      expect(response.body.rdv.familyId._id).toBe(testFamily._id.toString());
      expect(response.body.rdv.assignedAdminId._id).toBe(adminUser._id.toString());
      expect(response.body.rdv.time).toBe('14:00');
      expect(response.body.rdv.type).toBe('physique');
      expect(response.body.rdv.status).toBe('planifie');
    });

    test('Devrait rejeter si champs obligatoires manquants', async () => {
      const invalidData = { ...validRdvData };
      delete invalidData.familyId;

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Tous les champs obligatoires doivent être renseignés');
      expect(response.body.required).toContain('familyId');
    });

    test('Devrait rejeter si famille inexistante', async () => {
      const invalidData = {
        ...validRdvData,
        familyId: new mongoose.Types.ObjectId()
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Famille non trouvée');
    });

    test('Devrait rejeter si admin inexistant', async () => {
      const invalidData = {
        ...validRdvData,
        assignedAdminId: new mongoose.Types.ObjectId()
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Administrateur non trouvé ou rôle invalide');
    });

    test('Devrait rejeter si assigné à un professeur', async () => {
      const invalidData = {
        ...validRdvData,
        assignedAdminId: professeurUser._id
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Administrateur non trouvé ou rôle invalide');
    });

    test('Devrait rejeter heure invalide', async () => {
      const invalidData = {
        ...validRdvData,
        time: '25:00' // Heure invalide
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Données invalides');
    });

    test('Devrait rejeter créneaux non autorisés (avant 8h)', async () => {
      const invalidData = {
        ...validRdvData,
        time: '07:30'
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Données invalides');
    });

    test('Devrait rejeter créneaux non autorisés (après 21h)', async () => {
      const invalidData = {
        ...validRdvData,
        time: '21:30'
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Données invalides');
    });

    test('Devrait rejeter créneaux non multiples de 30min', async () => {
      const invalidData = {
        ...validRdvData,
        time: '14:15'
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Données invalides');
    });

    test('Devrait rejeter type invalide', async () => {
      const invalidData = {
        ...validRdvData,
        type: 'invalide'
      };

      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Données invalides');
    });

    test('Devrait rejeter si conflit de créneaux', async () => {
      // Créer un premier RDV
      await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRdvData);

      // Tenter de créer un second RDV au même créneau
      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRdvData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Données invalides');
      expect(response.body.errors[0]).toContain('déjà un rendez-vous prévu');
    });

    test('Devrait rejeter création sans token admin', async () => {
      const response = await request(app)
        .post('/api/rdv')
        .set('Authorization', `Bearer ${professeurToken}`)
        .send(validRdvData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/rdv - Récupération des RDV', () => {
    beforeEach(async () => {
      // Créer quelques RDV de test
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await RendezVous.create([
        {
          familyId: testFamily._id,
          assignedAdminId: adminUser._id,
          date: tomorrow,
          time: '09:00',
          type: 'physique',
          status: 'planifie'
        },
        {
          familyId: testFamily._id,
          assignedAdminId: adminUser._id,
          date: dayAfter,
          time: '14:30',
          type: 'virtuel',
          status: 'realise'
        }
      ]);
    });

    test('Devrait récupérer tous les RDV', async () => {
      const response = await request(app)
        .get('/api/rdv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rdvs).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    test('Devrait filtrer par statut', async () => {
      const response = await request(app)
        .get('/api/rdv?status=planifie')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rdvs).toHaveLength(1);
      expect(response.body.rdvs[0].status).toBe('planifie');
    });

    test('Devrait filtrer par type', async () => {
      const response = await request(app)
        .get('/api/rdv?type=virtuel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rdvs).toHaveLength(1);
      expect(response.body.rdvs[0].type).toBe('virtuel');
    });

    test('Devrait filtrer par famille', async () => {
      const response = await request(app)
        .get(`/api/rdv?familyId=${testFamily._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rdvs).toHaveLength(2);
    });

    test('Devrait supporter la pagination', async () => {
      const response = await request(app)
        .get('/api/rdv?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rdvs).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.pages).toBe(2);
    });

    test('Devrait être accessible aux professeurs', async () => {
      const response = await request(app)
        .get('/api/rdv')
        .set('Authorization', `Bearer ${professeurToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/rdv/:id - RDV spécifique', () => {
    beforeEach(async () => {
      testRendezVous = await RendezVous.create({
        familyId: testFamily._id,
        assignedAdminId: adminUser._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        time: '10:00',
        type: 'physique',
        status: 'planifie'
      });
    });

    test('Devrait récupérer un RDV existant', async () => {
      const response = await request(app)
        .get(`/api/rdv/${testRendezVous._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(testRendezVous._id.toString());
      expect(response.body).toHaveProperty('familyId');
      expect(response.body).toHaveProperty('assignedAdminId');
    });

    test('Devrait retourner 404 pour RDV inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/rdv/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rendez-vous non trouvé');
    });
  });

  describe('PUT /api/rdv/:id - Mise à jour RDV', () => {
    beforeEach(async () => {
      testRendezVous = await RendezVous.create({
        familyId: testFamily._id,
        assignedAdminId: adminUser._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        time: '10:00',
        type: 'physique',
        status: 'planifie',
        notes: 'Notes initiales'
      });
    });

    test('Devrait mettre à jour un RDV existant', async () => {
      const updateData = {
        time: '15:30',
        type: 'virtuel',
        notes: 'Notes mises à jour',
        status: 'realise'
      };

      const response = await request(app)
        .put(`/api/rdv/${testRendezVous._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Rendez-vous mis à jour avec succès');
      expect(response.body.rdv.time).toBe('15:30');
      expect(response.body.rdv.type).toBe('virtuel');
      expect(response.body.rdv.notes).toBe('Notes mises à jour');
      expect(response.body.rdv.status).toBe('realise');
    });

    test('Devrait rejeter mise à jour avec heure invalide', async () => {
      const response = await request(app)
        .put(`/api/rdv/${testRendezVous._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ time: '25:00' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Données invalides');
    });

    test('Devrait retourner 404 pour RDV inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/rdv/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rendez-vous non trouvé');
    });

    test('Devrait rejeter mise à jour sans autorisation admin', async () => {
      const response = await request(app)
        .put(`/api/rdv/${testRendezVous._id}`)
        .set('Authorization', `Bearer ${professeurToken}`)
        .send({ notes: 'Test' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/rdv/:id - Suppression RDV', () => {
    beforeEach(async () => {
      testRendezVous = await RendezVous.create({
        familyId: testFamily._id,
        assignedAdminId: adminUser._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        time: '10:00',
        type: 'physique',
        status: 'planifie'
      });
    });

    test('Devrait annuler un RDV planifié', async () => {
      const response = await request(app)
        .delete(`/api/rdv/${testRendezVous._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Rendez-vous annulé avec succès');
      expect(response.body.action).toBe('cancelled');

      // Vérifier que le statut a été changé à 'annule'
      const updatedRdv = await RendezVous.findById(testRendezVous._id);
      expect(updatedRdv.status).toBe('annule');
    });

    test('Devrait supprimer définitivement un RDV réalisé', async () => {
      testRendezVous.status = 'realise';
      await testRendezVous.save();

      const response = await request(app)
        .delete(`/api/rdv/${testRendezVous._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Rendez-vous supprimé avec succès');
      expect(response.body.action).toBe('deleted');

      // Vérifier que le RDV a été supprimé
      const deletedRdv = await RendezVous.findById(testRendezVous._id);
      expect(deletedRdv).toBeNull();
    });

    test('Devrait retourner 404 pour RDV inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/rdv/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rendez-vous non trouvé');
    });

    test('Devrait rejeter suppression sans autorisation admin', async () => {
      const response = await request(app)
        .delete(`/api/rdv/${testRendezVous._id}`)
        .set('Authorization', `Bearer ${professeurToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/rdv/availability/:adminId - Vérification disponibilité', () => {
    test('Devrait confirmer disponibilité libre', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .get(`/api/rdv/availability/${adminUser._id}`)
        .query({
          date: tomorrow.toISOString(),
          time: '09:00'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
      expect(response.body.conflict).toBeNull();
    });

    test('Devrait détecter conflit de créneaux', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Créer un RDV existant
      const existingRdv = await RendezVous.create({
        familyId: testFamily._id,
        assignedAdminId: adminUser._id,
        date: tomorrow,
        time: '14:00',
        type: 'physique',
        status: 'planifie'
      });

      const response = await request(app)
        .get(`/api/rdv/availability/${adminUser._id}`)
        .query({
          date: tomorrow.toISOString(),
          time: '14:00'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(false);
      expect(response.body.conflict).toHaveProperty('id');
      expect(response.body.conflict.id).toBe(existingRdv._id.toString());
    });

    test('Devrait rejeter si paramètres manquants', async () => {
      const response = await request(app)
        .get(`/api/rdv/availability/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Date et heure requises pour vérifier la disponibilité');
    });
  });

  describe('GET /api/rdv/stats/summary - Statistiques RDV', () => {
    beforeEach(async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      await RendezVous.create([
        {
          familyId: testFamily._id,
          assignedAdminId: adminUser._id,
          date: tomorrow,
          time: '09:00',
          type: 'physique',
          status: 'planifie'
        },
        {
          familyId: testFamily._id,
          assignedAdminId: adminUser._id,
          date: dayAfter,
          time: '14:00',
          type: 'virtuel',
          status: 'realise'
        },
        {
          familyId: testFamily._id,
          assignedAdminId: adminUser._id,
          date: dayAfter,
          time: '16:00',
          type: 'physique',
          status: 'annule'
        }
      ]);
    });

    test('Devrait calculer les statistiques correctement', async () => {
      const response = await request(app)
        .get('/api/rdv/stats/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(3);
      expect(response.body.byStatus).toHaveProperty('planifie');
      expect(response.body.byStatus).toHaveProperty('realise');
      expect(response.body.byStatus).toHaveProperty('annule');
      expect(response.body.byStatus.planifie).toBe(1);
      expect(response.body.byStatus.realise).toBe(1);
      expect(response.body.byStatus.annule).toBe(1);
      expect(response.body).toHaveProperty('weeklyCount');
      expect(response.body).toHaveProperty('todayCount');
    });

    test('Devrait rejeter accès non-admin', async () => {
      const response = await request(app)
        .get('/api/rdv/stats/summary')
        .set('Authorization', `Bearer ${professeurToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Tests de validation du modèle RendezVous', () => {
    test('Devrait valider correctement les créneaux de 30 minutes', async () => {
      const validTimes = ['08:00', '08:30', '09:00', '20:00', '21:00'];
      
      for (const time of validTimes) {
        const rdv = new RendezVous({
          familyId: testFamily._id,
          assignedAdminId: adminUser._id,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          time: time,
          type: 'physique'
        });
        
        const error = rdv.validateSync();
        expect(error).toBeUndefined();
      }
    });

    test('Devrait rejeter les créneaux invalides', async () => {
      const invalidTimes = ['07:30', '21:30', '14:15', '25:00', 'invalid'];
      
      for (const time of invalidTimes) {
        const rdv = new RendezVous({
          familyId: testFamily._id,
          assignedAdminId: adminUser._id,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          time: time,
          type: 'physique'
        });
        
        const error = rdv.validateSync();
        expect(error).toBeDefined();
        expect(error.errors.time).toBeDefined();
      }
    });

    test('Devrait formater correctement la date et l\'heure', async () => {
      const rdv = new RendezVous({
        familyId: testFamily._id,
        assignedAdminId: adminUser._id,
        date: new Date('2024-12-25'),
        time: '14:30',
        type: 'physique'
      });

      const formatted = rdv.getFormattedDateTime();
      expect(formatted).toMatch(/25\/12\/2024 à 14:30/);
    });

    test('Devrait vérifier correctement la disponibilité', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Créer un RDV
      const rdv = await RendezVous.create({
        familyId: testFamily._id,
        assignedAdminId: adminUser._id,
        date: tomorrow,
        time: '10:00',
        type: 'physique'
      });

      // Vérifier qu'il y a un conflit
      const conflict = await RendezVous.checkAvailability(
        tomorrow,
        '10:00',
        adminUser._id
      );
      expect(conflict).toBeTruthy();
      expect(conflict._id.toString()).toBe(rdv._id.toString());

      // Vérifier qu'on peut exclure le RDV actuel
      const noConflict = await RendezVous.checkAvailability(
        tomorrow,
        '10:00',
        adminUser._id,
        rdv._id
      );
      expect(noConflict).toBeNull();
    });
  });

  describe('Tests d\'authentification et d\'autorisation', () => {
    test('Devrait rejeter requêtes sans token', async () => {
      const response = await request(app)
        .get('/api/rdv')
        .send();

      expect(response.status).toBe(401);
    });

    test('Devrait rejeter token invalide', async () => {
      const response = await request(app)
        .get('/api/rdv')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      expect(response.status).toBe(401); // 401 car token invalide (unauthorized) plutôt que 403 (forbidden)
    });

    test('Devrait accepter token admin pour toutes les opérations', async () => {
      const responses = await Promise.all([
        request(app).get('/api/rdv').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/rdv/stats/summary').set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      });
    });
  });
});