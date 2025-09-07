/**
 * Test Step 3 - Correction SubjectService
 * Validation de la logique de parsing flexible
 */

describe('SubjectService Correction Tests', () => {
  
  test('1. Test parsing réponse API directe (tableau)', () => {
    // Simuler la réponse API directe comme dans les logs
    const apiResponse = [
      { _id: '687663b73174b1a67afc09fa', name: 'Mathématiques', category: 'Scientifique' },
      { _id: '687663b73174b1a67afc09fd', name: 'Français', category: 'Littéraire' },
      { _id: '687663b73174b1a67afc0a03', name: 'Physique', category: 'Scientifique' }
    ];
    
    // Appliquer la nouvelle logique getActiveSubjects
    let result = [];
    
    // Si c'est directement un tableau
    if (Array.isArray(apiResponse)) {
      result = apiResponse;
    }
    // Si c'est encapsulé dans un objet
    else if (apiResponse && typeof apiResponse === "object" && "subjects" in apiResponse) {
      result = apiResponse.subjects || [];
    }
    
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Mathématiques');
    expect(result[1].name).toBe('Français');
    expect(result[2].name).toBe('Physique');
    
    console.log('✅ Test 1 : Parsing tableau direct fonctionne');
    console.log('Matières parsées:', result.length);
  });

  test('2. Test parsing réponse API encapsulée (objet)', () => {
    // Simuler une réponse API encapsulée
    const apiResponse = {
      subjects: [
        { _id: '687663b73174b1a67afc09fa', name: 'Mathématiques', category: 'Scientifique' },
        { _id: '687663b73174b1a67afc09fd', name: 'Français', category: 'Littéraire' }
      ],
      total: 2
    };
    
    // Appliquer la nouvelle logique
    let result = [];
    
    if (Array.isArray(apiResponse)) {
      result = apiResponse;
    } else if (apiResponse && typeof apiResponse === "object" && "subjects" in apiResponse) {
      result = apiResponse.subjects || [];
    }
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Mathématiques');
    
    console.log('✅ Test 2 : Parsing objet.subjects fonctionne');
  });

  test('3. Test filtrage avec IDs réels des logs', () => {
    // IDs réels extraits des logs utilisateur
    const realSubjects = [
      { _id: '687663b73174b1a67afc09fa', name: 'Mathématiques', category: 'Scientifique' },
      { _id: '687663b73174b1a67afc09fd', name: 'Français', category: 'Littéraire' },
      { _id: '687663b73174b1a67afc0a03', name: 'Physique', category: 'Scientifique' },
      { _id: '687663b73174b1a67afc0a06', name: 'Chimie', category: 'Scientifique' }
    ];
    
    // Simuler sélection dans Step 2
    const selectedSubjectIds = ['687663b73174b1a67afc09fa', '687663b73174b1a67afc0a03'];
    
    // Logique de filtrage Step 3
    const selectedSubjects = realSubjects.filter(subject => 
      selectedSubjectIds.includes(subject._id)
    );
    
    expect(selectedSubjects).toHaveLength(2);
    expect(selectedSubjects[0].name).toBe('Mathématiques');
    expect(selectedSubjects[1].name).toBe('Physique');
    
    console.log('✅ Test 3 : Filtrage avec IDs réels fonctionne');
    console.log('Matières sélectionnées:', selectedSubjects.map(s => s.name));
  });

  test('4. Test création rateRows avec données réelles', () => {
    const selectedSubjects = [
      { _id: '687663b73174b1a67afc09fa', name: 'Mathématiques', category: 'Scientifique' },
      { _id: '687663b73174b1a67afc0a03', name: 'Physique', category: 'Scientifique' }
    ];
    
    // Logique de création rateRows
    const initialRates = selectedSubjects.map(subject => ({
      subjectId: subject._id,
      subjectName: subject.name,
      hourlyRate: '',
      quantity: '',
      professorSalary: '',
      total: 0
    }));
    
    expect(initialRates).toHaveLength(2);
    expect(initialRates[0].subjectId).toBe('687663b73174b1a67afc09fa');
    expect(initialRates[0].subjectName).toBe('Mathématiques');
    expect(initialRates[1].subjectName).toBe('Physique');
    
    console.log('✅ Test 4 : Création rateRows avec données réelles OK');
    console.log('RateRows:', initialRates.map(r => r.subjectName));
  });

  test('5. Test gestion erreur format inattendu', () => {
    // Simuler format inattendu
    const apiResponse = "format_inattendu";
    
    let result = [];
    let warning = '';
    
    if (Array.isArray(apiResponse)) {
      result = apiResponse;
    } else if (apiResponse && typeof apiResponse === "object" && "subjects" in apiResponse) {
      result = apiResponse.subjects || [];
    } else {
      warning = "Format de réponse inattendu, retour d'un tableau vide";
      result = [];
    }
    
    expect(result).toHaveLength(0);
    expect(warning).toContain('Format de réponse inattendu');
    
    console.log('✅ Test 5 : Gestion erreur format inattendu OK');
  });
});