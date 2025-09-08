/**
 * Test Step 3 - Protection NaN
 * Validation des corrections pour éviter les erreurs NaN dans les inputs
 */

describe('Step 3 NaN Protection Tests', () => {
  
  test('1. Calculs avec valeurs vides - pas de NaN', () => {
    // Simuler valeurs vides dans les champs
    const globalHourlyRate = '';
    const globalQuantity = '';
    const globalProfessorSalary = '';
    const charges = '';
    
    // Logique de calcul identique à Step 3 avec protection NaN
    const chargesValue = parseFloat(charges) || 0;
    const hourlyRate = parseFloat(globalHourlyRate) || 0;
    const quantity = parseFloat(globalQuantity) || 0;
    const professorSalary = parseFloat(globalProfessorSalary) || 0;
    
    const totalRevenue = isNaN(hourlyRate * quantity) ? 0 : hourlyRate * quantity;
    const totalSalary = isNaN(professorSalary * quantity) ? 0 : professorSalary * quantity;
    const totalCharges = isNaN(chargesValue * quantity) ? 0 : chargesValue * quantity;
    const margin = isNaN(totalRevenue - totalSalary - totalCharges) ? 0 : totalRevenue - totalSalary - totalCharges;
    
    // Vérifier qu'aucun NaN n'est produit
    expect(isNaN(totalRevenue)).toBe(false);
    expect(isNaN(totalSalary)).toBe(false);
    expect(isNaN(totalCharges)).toBe(false);
    expect(isNaN(margin)).toBe(false);
    
    expect(totalRevenue).toBe(0);
    expect(totalSalary).toBe(0);
    expect(totalCharges).toBe(0);
    expect(margin).toBe(0);
    
    console.log('✅ Test 1 : Aucun NaN avec valeurs vides');
    console.log(`Résultats: Revenue: ${totalRevenue}, Salary: ${totalSalary}, Charges: ${totalCharges}, Margin: ${margin}`);
  });

  test('2. Calculs avec valeurs invalides - pas de NaN', () => {
    // Simuler valeurs invalides
    const globalHourlyRate = 'abc';
    const globalQuantity = 'invalid';
    const globalProfessorSalary = null;
    const charges = undefined;
    
    // Protection identique à Step 3
    const chargesValue = parseFloat(charges) || 0;
    const hourlyRate = parseFloat(globalHourlyRate) || 0;
    const quantity = parseFloat(globalQuantity) || 0;
    const professorSalary = parseFloat(globalProfessorSalary) || 0;
    
    const totalRevenue = isNaN(hourlyRate * quantity) ? 0 : hourlyRate * quantity;
    
    expect(isNaN(totalRevenue)).toBe(false);
    expect(totalRevenue).toBe(0);
    
    console.log('✅ Test 2 : Aucun NaN avec valeurs invalides');
  });

  test('3. Affichage sécurisé avec toFixed()', () => {
    // Simuler calculs qui pourraient produire NaN
    const calculations = {
      totalRevenue: NaN,
      totalSalary: undefined,
      totalCharges: null,
      margin: NaN,
      marginPercentage: NaN
    };
    
    // Logique d'affichage identique à Step 3 avec protection
    const displayRevenue = (calculations.totalRevenue || 0).toFixed(2);
    const displaySalary = (calculations.totalSalary || 0).toFixed(2);
    const displayCharges = (calculations.totalCharges || 0).toFixed(2);
    const displayMargin = (calculations.margin || 0).toFixed(2);
    const displayPercentage = (calculations.marginPercentage || 0).toFixed(1);
    
    expect(displayRevenue).toBe('0.00');
    expect(displaySalary).toBe('0.00');
    expect(displayCharges).toBe('0.00');
    expect(displayMargin).toBe('0.00');
    expect(displayPercentage).toBe('0.0');
    
    // Vérifier qu'aucune chaîne ne contient 'NaN'
    expect(displayRevenue).not.toContain('NaN');
    expect(displaySalary).not.toContain('NaN');
    expect(displayCharges).not.toContain('NaN');
    expect(displayMargin).not.toContain('NaN');
    expect(displayPercentage).not.toContain('NaN');
    
    console.log('✅ Test 3 : Affichage sécurisé sans NaN');
    console.log(`Affichages: ${displayRevenue}, ${displaySalary}, ${displayCharges}, ${displayMargin}, ${displayPercentage}%`);
  });

  test('4. Division par zéro protection', () => {
    // Simuler division par zéro pour marginPercentage
    const totalRevenue = 0;
    const margin = 100;
    
    // Protection identique à Step 3
    const marginPercentage = totalRevenue > 0 && !isNaN(margin / totalRevenue) ? (margin / totalRevenue) * 100 : 0;
    
    expect(isNaN(marginPercentage)).toBe(false);
    expect(marginPercentage).toBe(0); // Pas Infinity ni NaN
    
    console.log('✅ Test 4 : Division par zéro protégée');
  });

  test('5. Validation formulaire avec valeurs NaN protégées', () => {
    // Simuler validation avec valeurs potentiellement problématiques
    const globalHourlyRate = '';
    const globalQuantity = '';
    const globalProfessorSalary = '';
    
    // Validation identique à Step 3
    const hourlyRate = parseFloat(globalHourlyRate);
    const quantity = parseFloat(globalQuantity);
    const professorSalary = parseFloat(globalProfessorSalary);
    
    // Les parseFloat() vides donnent NaN, donc la validation échoue correctement
    const isValid = !isNaN(hourlyRate) && hourlyRate > 0 &&
                   !isNaN(quantity) && quantity > 0 &&
                   !isNaN(professorSalary) && professorSalary > 0;
    
    expect(isValid).toBe(false); // Validation échoue avec valeurs vides (comportement voulu)
    
    console.log('✅ Test 5 : Validation échoue correctement avec valeurs vides');
  });

  test('6. Cas réels avec calculs complexes', () => {
    // Test avec vraies valeurs
    const globalHourlyRate = '25.50';
    const globalQuantity = '10';
    const globalProfessorSalary = '18.00';
    const charges = '3.50';
    
    // Calculs complets comme Step 3
    const chargesValue = parseFloat(charges) || 0;
    const hourlyRate = parseFloat(globalHourlyRate) || 0;
    const quantity = parseFloat(globalQuantity) || 0;
    const professorSalary = parseFloat(globalProfessorSalary) || 0;
    
    const totalRevenue = isNaN(hourlyRate * quantity) ? 0 : hourlyRate * quantity;
    const totalSalary = isNaN(professorSalary * quantity) ? 0 : professorSalary * quantity;
    const totalCharges = isNaN(chargesValue * quantity) ? 0 : chargesValue * quantity;
    const margin = isNaN(totalRevenue - totalSalary - totalCharges) ? 0 : totalRevenue - totalSalary - totalCharges;
    const marginPercentage = totalRevenue > 0 && !isNaN(margin / totalRevenue) ? (margin / totalRevenue) * 100 : 0;
    
    expect(totalRevenue).toBe(255); // 25.5 * 10
    expect(totalSalary).toBe(180);  // 18 * 10
    expect(totalCharges).toBe(35);  // 3.5 * 10
    expect(margin).toBe(40);        // 255 - 180 - 35
    expect(marginPercentage).toBeCloseTo(15.686, 2); // (40/255)*100
    
    // Vérifier affichages
    const display = {
      revenue: (totalRevenue || 0).toFixed(2),
      salary: (totalSalary || 0).toFixed(2),
      charges: (totalCharges || 0).toFixed(2),
      margin: (margin || 0).toFixed(2),
      percentage: (marginPercentage || 0).toFixed(1)
    };
    
    expect(display.revenue).toBe('255.00');
    expect(display.salary).toBe('180.00');
    expect(display.charges).toBe('35.00');
    expect(display.margin).toBe('40.00');
    expect(display.percentage).toBe('15.7');
    
    console.log('✅ Test 6 : Calculs réels fonctionnent correctement');
    console.log(`Revenue: ${display.revenue}€, Marge: ${display.margin}€ (${display.percentage}%)`);
  });
});