/**
 * Fixtures d'authentification pour tests
 * Tokens et utilisateurs de test
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Secret de test (différent de production)
const TEST_JWT_SECRET = 'test_secret_key_for_tests_only';

const authFixtures = {
  // Utilisateurs de test
  users: {
    admin: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@test.fr',
      password: 'admin123', // Mot de passe en clair
      role: 'admin',
      isActive: true
    },
    
    professor: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Prof',
      lastName: 'Test',
      email: 'prof@test.fr',
      password: 'prof123',
      role: 'professor',
      isActive: true
    },
    
    inactive: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Inactive',
      lastName: 'User',
      email: 'inactive@test.fr',
      password: 'inactive123',
      role: 'admin',
      isActive: false
    }
  },

  // Générer un token pour un utilisateur
  generateToken: (user, expiresIn = '24h') => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    return jwt.sign(
      { userId: user._id || new mongoose.Types.ObjectId() },
      TEST_JWT_SECRET,
      { expiresIn }
    );
  },

  // Tokens pré-générés
  getTokens: () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    return {
      admin: authFixtures.generateToken(authFixtures.users.admin),
      professor: authFixtures.generateToken(authFixtures.users.professor),
      expired: jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        TEST_JWT_SECRET,
        { expiresIn: '-1h' } // Token expiré
      ),
      invalid: 'invalid.token.here' // Token invalide
    };
  },

  // Créer un utilisateur avec mot de passe hashé
  createUserWithHash: async (userData) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return {
      ...userData,
      password: hashedPassword
    };
  },

  // Headers pour requêtes authentifiées
  getAuthHeaders: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-test-mode': 'true' // Header spécial pour tests
  }),

  // Créer un utilisateur en base de test
  createTestUser: async (Model, userType = 'admin') => {
    const userData = authFixtures.users[userType];
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    return await Model.create({
      ...userData,
      password: hashedPassword
    });
  },

  // Setup complet pour tests avec auth
  setupAuth: async (UserModel) => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    
    // Créer les utilisateurs
    const admin = await authFixtures.createTestUser(UserModel, 'admin');
    const professor = await authFixtures.createTestUser(UserModel, 'professor');
    
    // Générer les tokens
    const adminToken = authFixtures.generateToken(admin);
    const professorToken = authFixtures.generateToken(professor);
    
    return {
      users: { admin, professor },
      tokens: { admin: adminToken, professor: professorToken },
      headers: {
        admin: authFixtures.getAuthHeaders(adminToken),
        professor: authFixtures.getAuthHeaders(professorToken)
      }
    };
  },

  // Nettoyer après tests
  cleanup: async (UserModel) => {
    const emails = Object.values(authFixtures.users).map(u => u.email);
    await UserModel.deleteMany({ email: { $in: emails } });
  }
};

module.exports = authFixtures;