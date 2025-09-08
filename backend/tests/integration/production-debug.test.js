const request = require('supertest');
const jwt = require('jsonwebtoken');

// Configuration pour Railway production
const RAILWAY_API_URL = 'https://crm-abc-cours-production.up.railway.app';

describe('Production Debug - Famille inconnue', () => {
  let adminToken;
  let testAgent;

  beforeAll(() => {
    // Créer un token admin pour les tests
    const adminPayload = {
      _id: 'test_admin_id',
      email: 'admin@test.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Test'
    };
    
    adminToken = jwt.sign(adminPayload, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });

    console.log('🔍 Token créé pour les tests:', adminToken.substring(0, 20) + '...');
  });

  it('devrait récupérer les séries de coupons depuis Railway avec populate famille', async () => {
    console.log('🔍 Test avec Railway URL:', RAILWAY_API_URL);

    const response = await request(RAILWAY_API_URL)
      .get('/api/coupon-series')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response body structure:', {
      hasData: !!response.body.data,
      dataLength: response.body.data?.length || 0,
      firstElement: response.body.data?.[0] || null
    });

    if (response.body.data && response.body.data.length > 0) {
      const firstSeries = response.body.data[0];
      console.log('🔍 Premier élément complet:', JSON.stringify(firstSeries, null, 2));
      
      // Vérifier la structure familyId
      console.log('🔍 FamilyId structure:', {
        familyId: firstSeries.familyId,
        type: typeof firstSeries.familyId,
        hasPrimaryContact: !!(firstSeries.familyId?.primaryContact),
        primaryContact: firstSeries.familyId?.primaryContact
      });

      // Simuler la logique frontend
      const familyName = (firstSeries.familyId && typeof firstSeries.familyId === 'object' && firstSeries.familyId.primaryContact)
        ? `${firstSeries.familyId.primaryContact.firstName} ${firstSeries.familyId.primaryContact.lastName}`
        : "Famille inconnue";
      
      console.log('🔍 Nom famille calculé:', familyName);
      
      // Le test échoue si on obtient "Famille inconnue"
      expect(familyName).not.toBe('Famille inconnue');
      expect(firstSeries.familyId).toBeDefined();
      expect(firstSeries.familyId.primaryContact).toBeDefined();
      expect(firstSeries.familyId.primaryContact.firstName).toBeDefined();
    } else {
      console.log('🔍 Aucune série de coupons trouvée en production');
    }
  });

  it('devrait vérifier la structure de base de données en production', async () => {
    // Test pour vérifier s'il y a des données dans la base
    const response = await request(RAILWAY_API_URL)
      .get('/api/coupon-series')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log('🔍 Nombre total de séries en production:', response.body.data?.length || 0);
    console.log('🔍 Pagination info:', {
      total: response.body.total,
      page: response.body.page,
      limit: response.body.limit,
      pages: response.body.pages
    });

    if (response.body.total === 0) {
      console.log('⚠️  AUCUNE donnée en production - Problème de seeding !');
    }
  });
});