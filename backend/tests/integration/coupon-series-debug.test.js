const mongoose = require('mongoose');
const CouponSeries = require('../../models/CouponSeries');
const Family = require('../../models/Family');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Coupon Series Debug - Populate Issue Analysis', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  it('devrait reproduire exactement le problème "Famille inconnue"', async () => {
    console.log('🔍 === TEST DEBUG: Reproduction du problème "Famille inconnue" ===');

    // 1. Créer une famille AVEC primaryContact
    const validFamily = new Family({
      primaryContact: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@email.com',
        primaryPhone: '0123456789',
        gender: 'M.'
      },
      address: {
        street: '123 rue de la Paix',
        city: 'Lyon',
        postalCode: '69000'
      },
      demande: {
        beneficiaryType: 'eleves'
      },
      status: 'client',
      createdBy: new mongoose.Types.ObjectId()
    });
    await validFamily.save();
    console.log('🔍 Famille valide créée:', validFamily._id);

    // 2. Créer une famille avec primaryContact VIDE/CASSÉ
    const brokenFamily = new Family({
      primaryContact: {
        firstName: '',  // Vide !
        lastName: '',   // Vide !
        email: 'broken@email.com',
        primaryPhone: '0000000000',
        gender: 'M.'
      },
      address: {
        street: '456 avenue Cassée',
        city: 'Paris',
        postalCode: '75000'
      },
      demande: {
        beneficiaryType: 'eleves'
      },
      status: 'client',
      createdBy: new mongoose.Types.ObjectId()
    });
    await brokenFamily.save();
    console.log('🔍 Famille cassée créée (sans primaryContact):', brokenFamily._id);

    // 3. Créer des séries de coupons référençant ces familles
    const validSeries = new CouponSeries({
      settlementNoteId: new mongoose.Types.ObjectId(),
      familyId: validFamily._id,
      studentId: new mongoose.Types.ObjectId(),
      subject: new mongoose.Types.ObjectId(),
      totalCoupons: 10,
      hourlyRate: 25.0,
      professorSalary: 17.5,
      usedCoupons: 0,
      status: 'active',
      createdBy: new mongoose.Types.ObjectId()
    });
    await validSeries.save();

    const brokenSeries = new CouponSeries({
      settlementNoteId: new mongoose.Types.ObjectId(),
      familyId: brokenFamily._id,
      studentId: new mongoose.Types.ObjectId(),
      subject: new mongoose.Types.ObjectId(),
      totalCoupons: 10,
      hourlyRate: 25.0,
      professorSalary: 17.5,
      usedCoupons: 0,
      status: 'active',
      createdBy: new mongoose.Types.ObjectId()
    });
    await brokenSeries.save();

    // 4. Reproduire exactement la requête du backend
    console.log('🔍 Exécution de la requête avec populate...');
    const series = await CouponSeries.find()
      .populate("familyId", "primaryContact.firstName primaryContact.lastName primaryContact.email primaryContact.primaryPhone")
      .populate("studentId", "firstName lastName level")
      .populate("subject", "name category")
      .populate("createdBy", "firstName lastName")
      .lean();

    console.log('🔍 Résultats de la requête:');
    series.forEach((s, index) => {
      console.log(`🔍 Série ${index + 1}:`, {
        id: s._id,
        familyId: s.familyId,
        familyIdType: typeof s.familyId,
        hasPrimaryContact: !!(s.familyId?.primaryContact),
        primaryContactStructure: s.familyId?.primaryContact
      });

      // Reproduire la logique frontend
      const familyName = (s.familyId && typeof s.familyId === 'object' && s.familyId.primaryContact)
        ? `${s.familyId.primaryContact.firstName} ${s.familyId.primaryContact.lastName}`
        : "Famille inconnue";
      
      console.log(`🔍 Nom calculé pour série ${index + 1}:`, familyName);
    });

    // 5. Tests d'assertions
    expect(series).toHaveLength(2);
    
    // Série valide doit avoir un nom de famille
    const validResult = series.find(s => s.familyId?._id?.toString() === validFamily._id.toString());
    expect(validResult).toBeDefined();
    expect(validResult.familyId).toBeDefined();
    expect(validResult.familyId.primaryContact).toBeDefined();
    
    const validFamilyName = (validResult.familyId && typeof validResult.familyId === 'object' && validResult.familyId.primaryContact)
      ? `${validResult.familyId.primaryContact.firstName} ${validResult.familyId.primaryContact.lastName}`
      : "Famille inconnue";
    
    console.log('🔍 Nom famille valide final:', validFamilyName);
    expect(validFamilyName).toBe('Jean Dupont');
    expect(validFamilyName).not.toBe('Famille inconnue');

    // Série cassée devrait donner "Famille inconnue"
    const brokenResult = series.find(s => s.familyId?._id?.toString() === brokenFamily._id.toString());
    expect(brokenResult).toBeDefined();
    
    const brokenFamilyName = (brokenResult.familyId && typeof brokenResult.familyId === 'object' && brokenResult.familyId.primaryContact)
      ? `${brokenResult.familyId.primaryContact.firstName} ${brokenResult.familyId.primaryContact.lastName}`
      : "Famille inconnue";
    
    console.log('🔍 Nom famille cassée final:', brokenFamilyName);
    expect(brokenFamilyName).toBe('Famille inconnue');

    console.log('🔍 === FIN TEST DEBUG ===');
  });

  it('devrait tester les données exactement comme en production', async () => {
    console.log('🔍 Test avec des vraies données de production simulées...');

    // Créer des familles comme elles existent probablement en production
    const prodFamily = new Family({
      primaryContact: {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@email.com',
        primaryPhone: '0123456789',
        gender: 'Mme'
      },
      address: {
        street: '123 rue Exemple',
        city: 'Lyon',
        postalCode: '69000'
      },
      demande: {
        beneficiaryType: 'eleves'
      },
      status: 'client',
      createdBy: new mongoose.Types.ObjectId()
    });
    await prodFamily.save();

    // Créer une série normale
    const normalSeries = new CouponSeries({
      settlementNoteId: new mongoose.Types.ObjectId(),
      familyId: prodFamily._id,
      studentId: new mongoose.Types.ObjectId(),
      subject: new mongoose.Types.ObjectId(),
      totalCoupons: 15,
      hourlyRate: 30.0,
      professorSalary: 21.0,
      usedCoupons: 0,
      status: 'active',
      createdBy: new mongoose.Types.ObjectId()
    });
    await normalSeries.save();

    const series = await CouponSeries.find()
      .populate("familyId", "primaryContact.firstName primaryContact.lastName primaryContact.email primaryContact.primaryPhone")
      .lean();

    console.log('🔍 Résultats production simulée:');
    series.forEach((s, index) => {
      console.log(`🔍 Série prod ${index + 1}:`, {
        id: s._id,
        familyId: s.familyId,
        familyIdType: typeof s.familyId,
        hasPrimaryContact: !!(s.familyId?.primaryContact),
        primaryContactDetails: s.familyId?.primaryContact
      });

      const familyName = (s.familyId && typeof s.familyId === 'object' && s.familyId.primaryContact)
        ? `${s.familyId.primaryContact.firstName} ${s.familyId.primaryContact.lastName}`
        : "Famille inconnue";
      
      console.log(`🔍 Nom calculé prod ${index + 1}:`, familyName);
      
      // Ce test devrait RÉUSSIR avec des données normales
      expect(familyName).toBe('Marie Martin');
      expect(familyName).not.toBe('Famille inconnue');
    });
  });
});