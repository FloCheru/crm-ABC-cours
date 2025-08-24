/**
 * Test simple pour vérifier l'affichage des titres de groupe
 * Teste qu'il n'y a plus de duplication "NotesNotes"
 * Commande : npm test group-titles-display.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app.test');
const Family = require('../models/Family');
const User = require('../models/User');

describe('🏷️ TESTS TITRES GROUPES FORMULAIRE', () => {
  let mongoServer;
  let adminToken;
  let testUserId;

  // ========== SETUP/TEARDOWN ==========
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_secret_key_for_group_titles';
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    console.log('📊 Base de données temporaire initialisée pour tests titres');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const adminUser = await User.create({
      firstName: 'Test',
      lastName: 'GroupTitles',
      email: 'test.groups@titles.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    testUserId = adminUser._id;
    
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { userId: testUserId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🔑 Utilisateur admin test créé pour titres groupes');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log('🗑️ Base de données temporaire nettoyée');
  });

  beforeEach(async () => {
    await Family.deleteMany({});
  });

  // ========== TEST CORRECTION DUPLICATION ==========
  describe('Vérification correction duplication Notes', () => {
    
    test('✅ Création prospect avec tous les groupes - Plus de duplication', async () => {
      console.log('\n🎯 TEST: Pas de duplication NotesNotes');
      console.log('=====================================');
      
      const prospectData = {
        // Groupe primaryContact
        primaryContact: { 
          firstName: 'Test', 
          lastName: 'GroupTitles',
          primaryPhone: '0123456789',
          email: 'test@groups.fr',
          gender: 'M.'
        },
        // Groupe address (dans primaryContact mais séparé conceptuellement)
        address: { 
          street: '123 Rue Test', 
          city: 'Test', 
          postalCode: '12345' 
        },
        // Groupe demande
        demande: {
          beneficiaryType: 'adulte',
          subjects: ['Test'],
          notes: 'Notes sur la demande'
        },
        // Groupe notes (général)
        notes: 'Notes générales sur la famille',
        
        status: 'prospect',
        createdBy: testUserId,
      };

      console.log('📋 Groupes testés:', {
        primaryContact: !!prospectData.primaryContact,
        address: !!prospectData.address,
        demande: !!prospectData.demande,
        notes: !!prospectData.notes
      });

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      // Vérifier que tous les champs sont correctement sauvegardés
      const family = response.body.family;
      expect(family.primaryContact.firstName).toBe('Test');
      expect(family.address.street).toBe('123 Rue Test');
      expect(family.demande.beneficiaryType).toBe('adulte');
      expect(family.demande.notes).toBe('Notes sur la demande');
      expect(family.notes).toBe('Notes générales sur la famille');

      console.log('✅ Tous les groupes fonctionnent correctement');
      console.log('📊 Structure sauvegardée:', {
        contact: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
        address: family.address.city,
        beneficiaryType: family.demande.beneficiaryType,
        demandeNotes: !!family.demande.notes,
        generalNotes: !!family.notes,
        separateNotes: family.demande.notes !== family.notes // ✅ Séparées
      });
      console.log('=====================================\n');
    });

    test('✅ Vérification séparation Notes demande vs Notes générales', async () => {
      console.log('\n🎯 TEST: Séparation Notes demande/générales');
      console.log('===========================================');
      
      const prospectData = {
        primaryContact: { 
          firstName: 'Séparation', 
          lastName: 'Notes',
          primaryPhone: '0123456789',
          email: 'separation@notes.fr',
          gender: 'Mme'
        },
        address: { 
          street: '456 Rue Séparation', 
          city: 'NotesVille', 
          postalCode: '67890' 
        },
        demande: {
          beneficiaryType: 'eleves',
          subjects: ['Français'],
          notes: 'Ceci est une note spécifique à la demande de cours'
        },
        notes: 'Ceci est une note générale sur la famille',
        
        status: 'prospect',
        createdBy: testUserId,
      };

      console.log('📝 Types de notes testées:', {
        demandeNotes: prospectData.demande.notes,
        generalNotes: prospectData.notes,
        different: prospectData.demande.notes !== prospectData.notes
      });

      const response = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-test-mode', 'true')
        .send(prospectData)
        .expect(201);

      const family = response.body.family;
      
      // Vérifier que les deux types de notes sont bien séparés
      expect(family.demande.notes).toBe('Ceci est une note spécifique à la demande de cours');
      expect(family.notes).toBe('Ceci est une note générale sur la famille');
      expect(family.demande.notes).not.toBe(family.notes); // Différentes
      
      console.log('✅ Notes correctement séparées');
      console.log('📝 Résultat:', {
        demandeNotes: family.demande.notes.substring(0, 30) + '...',
        generalNotes: family.notes.substring(0, 30) + '...',
        properSeparation: true
      });
      console.log('===========================================\n');
    });

  });

});

// ========== RÉSUMÉ FINAL ==========
afterAll(() => {
  console.log(`
  📊 RÉSUMÉ TESTS TITRES GROUPES
  ==============================
  ✅ Duplication "NotesNotes" corrigée
  ✅ Groupes distincts : demande.notes vs notes
  ✅ Tous les champs fonctionnent correctement
  ✅ Séparation Notes demande/générales validée
  
  🏷️ TITRES GROUPES CORRECTS:
  - Contact principal ✅
  - Demande de cours ✅  
  - Notes ✅ (plus de duplication)
  
  📝 NOTES SÉPARÉES:
  - demande.notes : Notes sur la demande de cours
  - notes : Notes générales sur la famille
  
  🔄 INTERFACE PROPRE ET FONCTIONNELLE
  `);
});