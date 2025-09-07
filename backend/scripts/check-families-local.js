/**
 * Script pour vérifier l'état actuel des familles en local
 * Pour comprendre pourquoi ça marche en local mais pas en production
 */

const mongoose = require('mongoose');
const Family = require('../models/Family');
const CouponSeries = require('../models/CouponSeries');

async function checkLocalData() {
  try {
    // Connexion à la base locale
    await mongoose.connect('mongodb://localhost:27017/abc-cours-crm-dev');
    console.log('✅ Connexion MongoDB locale établie');

    console.log('\n🔍 === ANALYSE BASE LOCALE ===');

    const totalFamilies = await Family.countDocuments();
    console.log(`📊 Total familles locales: ${totalFamilies}`);

    if (totalFamilies === 0) {
      console.log('⚠️  Aucune famille en base locale - base probablement vide');
      return;
    }

    // Vérifier quelques familles
    const sampleFamilies = await Family.find().limit(3).lean();
    console.log('\n📋 Échantillon de familles locales:');
    
    sampleFamilies.forEach((family, index) => {
      console.log(`\n  ${index + 1}. Famille ID: ${family._id}`);
      console.log(`     Nom: "${family.primaryContact?.firstName || 'MANQUANT'} ${family.primaryContact?.lastName || 'MANQUANT'}"`);
      console.log(`     Email: ${family.primaryContact?.email || 'MANQUANT'}`);
      console.log(`     Status: ${family.status}`);
    });

    // Tester avec les séries de coupons locales
    console.log('\n🧪 === TEST SÉRIE COUPONS LOCALE ===');
    
    const totalSeries = await CouponSeries.countDocuments();
    console.log(`📊 Total séries de coupons: ${totalSeries}`);

    if (totalSeries > 0) {
      const testSeries = await CouponSeries.find()
        .populate("familyId", "primaryContact.firstName primaryContact.lastName primaryContact.email")
        .limit(3)
        .lean();

      testSeries.forEach((series, index) => {
        const familyName = (series.familyId && typeof series.familyId === 'object' && series.familyId.primaryContact)
          ? `${series.familyId.primaryContact.firstName} ${series.familyId.primaryContact.lastName}`
          : "Famille inconnue";
        
        console.log(`\n  Série ${index + 1}: ${series._id}`);
        console.log(`  Nom famille: "${familyName}"`);
        console.log(`  FamilyId structure:`, {
          exists: !!series.familyId,
          hasContact: !!(series.familyId?.primaryContact),
          contactData: series.familyId?.primaryContact || 'MANQUANT'
        });
      });
    } else {
      console.log('⚠️  Aucune série de coupons locale');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion');
  }
}

checkLocalData();