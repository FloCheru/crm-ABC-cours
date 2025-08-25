/**
 * Script pour corriger les données de production
 * Problème : Familles avec primaryContact vides affichant "famille inconnue"
 * 
 * Ce script :
 * 1. Identifie les familles avec primaryContact vides/manquants
 * 2. Propose des corrections automatiques ou demande une intervention manuelle
 * 3. Met à jour les données pour que les séries de coupons affichent les noms
 */

const mongoose = require('mongoose');
const Family = require('../models/Family');
const CouponSeries = require('../models/CouponSeries');

// Configuration MongoDB (adapter selon l'environnement)
const DB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/abc-cours-crm';

async function connectDB() {
  try {
    await mongoose.connect(DB_URL);
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
}

async function analyzeFamilyData() {
  console.log('\n🔍 === ANALYSE DES DONNÉES FAMILLE ===');
  
  const totalFamilies = await Family.countDocuments();
  console.log(`📊 Total familles dans la base: ${totalFamilies}`);

  // Familles avec primaryContact vides ou problématiques
  const brokenFamilies = await Family.find({
    $or: [
      { 'primaryContact.firstName': { $in: ['', null] } },
      { 'primaryContact.lastName': { $in: ['', null] } },
      { 'primaryContact': { $exists: false } }
    ]
  }).lean();

  console.log(`🚨 Familles avec primaryContact cassé: ${brokenFamilies.length}`);

  if (brokenFamilies.length > 0) {
    console.log('\n📋 Détail des familles problématiques:');
    brokenFamilies.forEach((family, index) => {
      console.log(`\n  ${index + 1}. Famille ID: ${family._id}`);
      console.log(`     firstName: "${family.primaryContact?.firstName || 'MANQUANT'}"`);
      console.log(`     lastName: "${family.primaryContact?.lastName || 'MANQUANT'}"`);
      console.log(`     email: "${family.primaryContact?.email || 'MANQUANT'}"`);
      console.log(`     status: ${family.status}`);
      console.log(`     adresse: ${family.address?.street || 'N/A'}, ${family.address?.city || 'N/A'}`);
    });
  }

  // Vérifier l'impact sur les séries de coupons
  const brokenFamilyIds = brokenFamilies.map(f => f._id);
  const affectedSeries = await CouponSeries.find({
    familyId: { $in: brokenFamilyIds }
  }).lean();

  console.log(`\n📈 Séries de coupons affectées: ${affectedSeries.length}`);
  
  return { totalFamilies, brokenFamilies, affectedSeries };
}

async function fixBrokenFamilies(brokenFamilies) {
  console.log('\n🔧 === CORRECTION DES DONNÉES ===');
  
  if (brokenFamilies.length === 0) {
    console.log('✅ Aucune famille à corriger');
    return;
  }

  console.log(`🛠️  Correction de ${brokenFamilies.length} familles...`);

  let fixedCount = 0;

  for (const family of brokenFamilies) {
    try {
      const updates = {};

      // Générer des noms par défaut si manquants
      if (!family.primaryContact?.firstName || family.primaryContact.firstName === '') {
        updates['primaryContact.firstName'] = family.primaryContact?.email ? 
          family.primaryContact.email.split('@')[0].split('.')[0] : 'Client';
      }

      if (!family.primaryContact?.lastName || family.primaryContact.lastName === '') {
        updates['primaryContact.lastName'] = family.primaryContact?.email ? 
          family.primaryContact.email.split('@')[0].split('.')[1] || 'Famille' : 
          `Famille_${family._id.toString().slice(-6)}`;
      }

      if (Object.keys(updates).length > 0) {
        console.log(`\n  🔧 Correction famille ${family._id}:`);
        console.log(`     Avant: "${family.primaryContact?.firstName || 'VIDE'} ${family.primaryContact?.lastName || 'VIDE'}"`);
        console.log(`     Après: "${updates['primaryContact.firstName'] || family.primaryContact?.firstName} ${updates['primaryContact.lastName'] || family.primaryContact?.lastName}"`);

        await Family.findByIdAndUpdate(family._id, { $set: updates });
        fixedCount++;
      }

    } catch (error) {
      console.error(`❌ Erreur lors de la correction de la famille ${family._id}:`, error);
    }
  }

  console.log(`\n✅ Correction terminée: ${fixedCount} familles corrigées`);
}

async function verifyFix() {
  console.log('\n✅ === VÉRIFICATION POST-CORRECTION ===');

  // Re-analyser après correction
  const totalFamilies = await Family.countDocuments();
  const stillBrokenFamilies = await Family.find({
    $or: [
      { 'primaryContact.firstName': { $in: ['', null] } },
      { 'primaryContact.lastName': { $in: ['', null] } }
    ]
  }).lean();

  console.log(`📊 Total familles: ${totalFamilies}`);
  console.log(`🚨 Familles encore cassées: ${stillBrokenFamilies.length}`);

  // Tester avec une série de coupons
  console.log('\n🧪 Test avec requête série de coupons...');
  
  const testSeries = await CouponSeries.findOne()
    .populate("familyId", "primaryContact.firstName primaryContact.lastName primaryContact.email")
    .lean();

  if (testSeries) {
    const familyName = (testSeries.familyId && typeof testSeries.familyId === 'object' && testSeries.familyId.primaryContact)
      ? `${testSeries.familyId.primaryContact.firstName} ${testSeries.familyId.primaryContact.lastName}`
      : "Famille inconnue";
    
    console.log(`🔍 Test série ${testSeries._id}:`);
    console.log(`   Nom affiché: "${familyName}"`);
    console.log(`   Status: ${familyName === "Famille inconnue" ? "❌ ENCORE CASSÉ" : "✅ CORRIGÉ"}`);
  } else {
    console.log('⚠️  Aucune série de coupons trouvée pour les tests');
  }
}

async function main() {
  console.log('🚀 === SCRIPT DE CORRECTION FAMILLES PRODUCTION ===');
  console.log('Problème: Séries de coupons affichent "famille inconnue"');
  console.log('Solution: Corriger les primaryContact vides/manquants\n');

  try {
    await connectDB();

    // 1. Analyser le problème
    const { brokenFamilies } = await analyzeFamilyData();

    // 2. Proposer la correction
    if (brokenFamilies.length > 0) {
      console.log('\n❓ Voulez-vous corriger ces familles ? (automatique)');
      
      // Correction automatique (pour l'instant)
      await fixBrokenFamilies(brokenFamilies);
      
      // 3. Vérifier que la correction a fonctionné
      await verifyFix();
    } else {
      console.log('\n✅ Toutes les familles ont des primaryContact valides');
      await verifyFix();
    }

  } catch (error) {
    console.error('❌ Erreur dans le script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion MongoDB');
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { analyzeFamilyData, fixBrokenFamilies, verifyFix };