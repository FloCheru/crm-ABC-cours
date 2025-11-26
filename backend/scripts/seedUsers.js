require('dotenv').config({ path: './.env.development' });
const mongoose = require('mongoose');
const Professor = require('../models/Professor');
const Admin = require('../models/Admin');

async function seedUsers() {
  try {
    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n👥 Création des utilisateurs de test...');

    // Créer un admin de test
    const existingAdmin = await Admin.findOne({ email: 'admin@abc-cours.fr' });
    if (!existingAdmin) {
      const admin = new Admin({
        email: 'admin@abc-cours.fr',
        password: '123456',
        firstName: 'Admin',
        lastName: 'ABC',
        isActive: true,
      });
      await admin.save();
      console.log('✅ Admin créé : admin@abc-cours.fr / 123456');
    } else {
      console.log('ℹ️  Admin existe déjà : admin@abc-cours.fr');
    }

    // Créer un professeur de test
    const existingProf = await Professor.findOne({ email: 'prof@abc-cours.fr' });
    if (!existingProf) {
      const professor = new Professor({
        email: 'prof@abc-cours.fr',
        password: '123456',
        firstName: 'Prof',
        lastName: 'Test',
        isActive: true,
        status: 'active',
      });
      await professor.save();
      console.log('✅ Professeur créé : prof@abc-cours.fr / 123456');
    } else {
      console.log('ℹ️  Professeur existe déjà : prof@abc-cours.fr');
    }

    console.log('\n✅ Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedUsers();