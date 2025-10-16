require('dotenv').config({ path: './.env.development' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Professor = require('../models/Professor');

async function seedProfessor() {
  try {
    // Connexion à MongoDB
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'utilisateur professeur existe déjà
    let user = await User.findOne({ email: 'prof@abc-cours.fr' });

    if (user) {
      console.log('ℹ️  L\'utilisateur prof@abc-cours.fr existe déjà');
    } else {
      // Créer l'utilisateur professeur
      console.log('Création de l\'utilisateur professeur...');
      user = new User({
        email: 'prof@abc-cours.fr',
        password: '123456',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'professor',
        phone: '06 12 34 56 78',
        isActive: true
      });
      await user.save();
      console.log('✅ Utilisateur professeur créé');
    }

    // Vérifier si le profil professeur existe déjà
    let professor = await Professor.findOne({ user: user._id });

    if (professor) {
      console.log('ℹ️  Le profil professeur existe déjà');
    } else {
      // Créer le profil professeur
      console.log('Création du profil professeur...');
      professor = new Professor({
        user: user._id,
        subjects: [
          {
            name: 'Mathématiques',
            levels: ['collège', 'lycée', 'supérieur'],
            experience: 5
          },
          {
            name: 'Physique',
            levels: ['lycée', 'supérieur'],
            experience: 3
          }
        ],
        hourlyRate: 35,
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
      console.log('✅ Profil professeur créé');
    }

    // Afficher le résumé
    const populatedProfessor = await Professor.findById(professor._id).populate('user');
    console.log('\n📋 Résumé du professeur de test :');
    console.log('----------------------------------');
    console.log(`Email: ${populatedProfessor.user.email}`);
    console.log(`Mot de passe: 123456`);
    console.log(`Nom: ${populatedProfessor.user.firstName} ${populatedProfessor.user.lastName}`);
    console.log(`Matières: ${populatedProfessor.subjects.map(s => s.name).join(', ')}`);
    console.log(`Tarif horaire: ${populatedProfessor.hourlyRate}€`);
    console.log(`Statut: ${populatedProfessor.status}`);
    console.log('----------------------------------\n');

    console.log('✅ Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedProfessor();
