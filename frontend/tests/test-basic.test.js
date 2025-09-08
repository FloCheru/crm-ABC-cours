/**
 * Test basique pour vérifier la configuration Jest
 */

describe('🧪 Configuration Jest', () => {
  
  test('✅ Jest fonctionne correctement', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toMatch(/hello/);
    expect([1, 2, 3]).toHaveLength(3);
  });

  test('✅ Setup global disponible', () => {
    // Vérifier que testHelpers est disponible globalement
    expect(global.testHelpers).toBeDefined();
    expect(typeof global.testHelpers.createMockFamily).toBe('function');
    
    // Tester la création de mock family
    const mockFamily = global.testHelpers.createMockFamily();
    expect(mockFamily).toHaveProperty('_id');
    expect(mockFamily).toHaveProperty('primaryContact');
    expect(mockFamily.primaryContact).toHaveProperty('firstName', 'Test');
    expect(mockFamily.primaryContact).toHaveProperty('lastName', 'User');
  });

  test('✅ Mocks globaux disponibles', () => {
    // Vérifier que les mocks sont configurés
    expect(global.fetch).toBeDefined();
    expect(global.confirm).toBeDefined();
    expect(global.alert).toBeDefined();
    expect(global.localStorage).toBeDefined();
  });

  test('✅ Helper createMockFamily avec overrides', () => {
    const customFamily = global.testHelpers.createMockFamily({
      status: 'client',
      primaryContact: {
        firstName: 'Custom',
        lastName: 'Client'
      },
      settlementNotes: ['ndr1', 'ndr2']
    });

    expect(customFamily.status).toBe('client');
    expect(customFamily.primaryContact.firstName).toBe('Custom');
    expect(customFamily.settlementNotes).toHaveLength(2);
  });

  test('✅ Tests asynchrones avec waitForAsync', async () => {
    const startTime = Date.now();
    
    await global.testHelpers.waitForAsync();
    
    const endTime = Date.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(0);
  });
});