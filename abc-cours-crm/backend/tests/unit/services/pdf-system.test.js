const request = require('supertest');
const app = require('../../integration/app.test');

describe('Système PDF', () => {
  let token;
  let settlementNoteId;

  beforeAll(async () => {
    // Login pour obtenir un token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@abc-cours.fr',
        password: 'Admin123!'
      });

    token = loginResponse.body.accessToken;

    // Créer une note de règlement de test
    const noteResponse = await request(app)
      .post('/api/settlement-notes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: '689daf68bc7e70c938842ed0',
        studentIds: ['689db3ebbc7e70c938842f33'],
        clientName: 'Test Client',
        department: '75',
        paymentMethod: 'card',
        subjects: [{
          subjectId: '687663b73174b1a67afc0a09',
          hourlyRate: 25,
          quantity: 2,
          professorSalary: 20
        }],
        charges: 5
      });

    settlementNoteId = noteResponse.body.settlementNote._id;
  });

  test('Devrait vérifier la santé du service PDF', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Service PDF opérationnel');
  });

  test('Devrait générer un PDF NDR', async () => {
    const response = await request(app)
      .post(`/api/settlement-notes/${settlementNoteId}/generate-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'ndr' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.type).toBe('ndr');
    expect(response.body.data.fileName).toContain('NDR-');
  });

  test('Devrait lister les PDFs générés', async () => {
    const response = await request(app)
      .get(`/api/settlement-notes/${settlementNoteId}/pdfs`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('Devrait télécharger un PDF', async () => {
    // D'abord lister les PDFs
    const listResponse = await request(app)
      .get(`/api/settlement-notes/${settlementNoteId}/pdfs`)
      .set('Authorization', `Bearer ${token}`);

    const pdfId = listResponse.body.data[0].id;

    // Puis télécharger
    const downloadResponse = await request(app)
      .get(`/api/pdfs/${settlementNoteId}/${pdfId}/download`)
      .set('Authorization', `Bearer ${token}`);

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers['content-type']).toBe('application/pdf');
  });

  afterAll(async () => {
    // Nettoyer - supprimer la note de test
    if (settlementNoteId) {
      await request(app)
        .delete(`/api/settlement-notes/${settlementNoteId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });
});