/**
 * Application Express pour les tests
 * Version simplifiée sans démarrage du serveur
 */

const express = require('express');
const cors = require('cors');

// Créer l'application Express pour les tests
const app = express();

// Middleware essentiels
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Middleware d'authentification simple pour les tests
app.use('/api', (req, res, next) => {
  if (req.headers.authorization) {
    req.user = { _id: 'test-user-id' }; // Mock user pour les tests
  }
  next();
});

// Routes
app.use('/api/auth', require('../../routes/auth'));
app.use('/api/families', require('../../routes/families'));
app.use('/api/students', require('../../routes/students'));
app.use('/api/subjects', require('../../routes/subjects'));

// Route de santé pour les tests
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: 'test' });
});

// Gestion d'erreur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

module.exports = app;