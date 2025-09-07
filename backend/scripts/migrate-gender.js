const mongoose = require('mongoose');
const Family = require('../models/Family');
const path = require('path');
const dotenv = require('dotenv');

// Configuration d'environnement
const envFile = process.env.NODE_ENV === "production" 
  ? ".env.production" 
  : ".env.development";
dotenv.config({ path: path.join(__dirname, '..', envFile) });

async function migrateGenderField() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver les familles sans gender
    const familiesWithoutGender = await Family.find({
      "primaryContact.gender": { $exists: false }
    }).select('primaryContact.firstName primaryContact.lastName');

    console.log(`🔍 Familles trouvées sans civilité: ${familiesWithoutGender.length}`);

    if (familiesWithoutGender.length === 0) {
      console.log('✅ Toutes les familles ont déjà une civilité définie');
      return;
    }

    // Lister les familles concernées
    console.log('\n📋 Familles qui seront mises à jour:');
    familiesWithoutGender.forEach((family, index) => {
      console.log(`${index + 1}. ${family.primaryContact.firstName} ${family.primaryContact.lastName} (ID: ${family._id})`);
    });

    // Migration avec valeur par défaut "M."
    console.log('\n🔄 Migration en cours...');
    const result = await Family.updateMany(
      { "primaryContact.gender": { $exists: false } },
      { 
        $set: { 
          "primaryContact.gender": "M.",
          "updatedAt": new Date()
        } 
      }
    );

    console.log(`✅ Migration terminée:`);
    console.log(`   - ${result.matchedCount} familles trouvées`);
    console.log(`   - ${result.modifiedCount} familles mises à jour`);
    console.log(`   - Civilité par défaut: "M." (Monsieur)`);

    // Vérification post-migration
    const remaining = await Family.countDocuments({
      "primaryContact.gender": { $exists: false }
    });
    
    if (remaining === 0) {
      console.log('🎉 Migration réussie - Toutes les familles ont maintenant une civilité');
    } else {
      console.warn(`⚠️  Il reste ${remaining} familles sans civilité`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter la migration
migrateGenderField();