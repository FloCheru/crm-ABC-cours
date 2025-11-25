require('dotenv').config({ path: './.env.development' });
const mongoose = require('mongoose');
const Professor = require('../models/Professor');
const Admin = require('../models/Admin');

async function seedProfessor() {
  try {
    // Connexion à MongoDB
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si le professeur existe déjà
    let professor = await Professor.findOne({ email: 'prof@abc-cours.fr' });

    if (professor) {
      console.log('ℹ️  Le professeur prof@abc-cours.fr existe déjà');
    } else {
      // Créer le professeur avec authentification intégrée
      console.log('Création du professeur...');
      professor = new Professor({
        email: 'prof@abc-cours.fr',
        password: '123456',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '06 12 34 56 78',
        isActive: true,
        status: 'active',
        bio: 'Professeur expérimenté en mathématiques et physique, passionné par la transmission des savoirs.',
        availability: [
          {
            day: 'monday',
            timeSlots: [
              { start: '14:00', end: '18:00' }
            ]
          },
          {
            day: 'wednesday',
            timeSlots: [
              { start: '14:00', end: '18:00' }
            ]
          },
          {
            day: 'friday',
            timeSlots: [
              { start: '14:00', end: '18:00' }
            ]
          }
        ],
        education: [
          {
            degree: 'Master en Mathématiques',
            institution: 'Université Paris-Saclay',
            year: 2018,
            description: 'Spécialisation en analyse numérique'
          }
        ],
        experience: [
          {
            position: 'Professeur particulier',
            company: 'ABC Cours',
            startDate: new Date('2019-09-01'),
            description: 'Cours particuliers de mathématiques et physique'
          }
        ]
      });
      await professor.save();
      console.log('✅ Professeur créé');
    }

    // Afficher le résumé
    console.log('\n📋 Résumé du professeur de test :');
    console.log('----------------------------------');
    console.log(`Email: ${professor.email}`);
    console.log(`Mot de passe: 123456`);
    console.log(`Nom: ${professor.firstName} ${professor.lastName}`);
    console.log(`Statut: ${professor.status}`);
    console.log('----------------------------------\n');

    console.log('✅ Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedProfessor();
