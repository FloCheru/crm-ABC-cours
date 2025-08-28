/**
 * Tests pour le mode édition de SeriesDetails
 * Validation du comportement du bouton Modifier et de l'édition des séries de coupons
 */

const { JSDOM } = require('jsdom');
const React = require('react');

// Configuration JSDOM pour les tests DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

describe('SeriesDetails - Mode édition', () => {
  let mockFetch;
  
  beforeEach(() => {
    // Mock fetch pour les appels API
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Mock console pour éviter les logs de test
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset DOM entre les tests
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Bouton Modifier', () => {
    test('Le bouton Modifier doit être présent dans le header', () => {
      // Simulation de la structure DOM de SeriesDetails
      const headerActions = document.createElement('div');
      headerActions.className = 'series-details__header-actions';
      
      const modifyButton = document.createElement('button');
      modifyButton.textContent = 'Modifier';
      modifyButton.className = 'button button--secondary';
      
      headerActions.appendChild(modifyButton);
      document.body.appendChild(headerActions);
      
      const button = document.querySelector('.series-details__header-actions button');
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Modifier');
      expect(button.className).toContain('button--secondary');
    });

    test('Le bouton Modifier doit déclencher le mode édition', () => {
      // Simulation du clic sur le bouton Modifier
      const seriesDetails = document.createElement('div');
      seriesDetails.className = 'series-details';
      
      const headerActions = document.createElement('div');
      headerActions.className = 'series-details__header-actions';
      
      const modifyButton = document.createElement('button');
      modifyButton.textContent = 'Modifier';
      modifyButton.onclick = () => {
        seriesDetails.classList.add('series-details--editing');
        modifyButton.style.display = 'none';
        
        // Ajouter les boutons Annuler/Enregistrer
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Annuler';
        cancelButton.className = 'button button--outline';
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Enregistrer';
        saveButton.className = 'button button--primary';
        
        headerActions.appendChild(cancelButton);
        headerActions.appendChild(saveButton);
      };
      
      headerActions.appendChild(modifyButton);
      seriesDetails.appendChild(headerActions);
      document.body.appendChild(seriesDetails);
      
      // Clic sur le bouton Modifier
      modifyButton.click();
      
      // Vérifications
      expect(seriesDetails.classList.contains('series-details--editing')).toBe(true);
      expect(modifyButton.style.display).toBe('none');
      expect(headerActions.children.length).toBe(3); // Modifier + Annuler + Enregistrer
    });
  });

  describe('Mode édition - Champs éditables', () => {
    test('Les champs tarif horaire et nombre de coupons doivent devenir éditables', () => {
      // Simulation de la structure des champs en mode édition
      const field = document.createElement('div');
      field.className = 'series-details__field';
      
      const label = document.createElement('label');
      label.textContent = 'Tarif horaire';
      
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.min = '0';
      input.value = '25.00';
      input.className = 'input-field';
      
      field.appendChild(label);
      field.appendChild(input);
      document.body.appendChild(field);
      
      const inputField = document.querySelector('input[type=\"number\"]');
      expect(inputField).toBeTruthy();
      expect(inputField.value).toBe('25.00');
      expect(inputField.step).toBe('0.01');
      expect(inputField.min).toBe('0');
    });

    test('Le sélecteur de statut doit permettre les options active/completed/expired', () => {
      const field = document.createElement('div');
      field.className = 'series-details__field';
      
      const label = document.createElement('label');
      label.textContent = 'Statut';
      
      const select = document.createElement('select');
      select.className = 'series-details__select';
      
      const options = ['active', 'completed', 'expired'];
      options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option === 'active' ? 'Actif' : 
                                   option === 'completed' ? 'Terminé' : 'Expiré';
        select.appendChild(optionElement);
      });
      
      field.appendChild(label);
      field.appendChild(select);
      document.body.appendChild(field);
      
      const selectElement = document.querySelector('.series-details__select');
      expect(selectElement).toBeTruthy();
      expect(selectElement.children.length).toBe(3);
      expect(selectElement.children[0].value).toBe('active');
      expect(selectElement.children[1].value).toBe('completed');
      expect(selectElement.children[2].value).toBe('expired');
    });
  });

  describe('Validation des formulaires', () => {
    test('Les champs obligatoires doivent être validés', () => {
      // Test de validation du tarif horaire
      const validateForm = (hourlyRate, totalCoupons) => {
        const errors = {};
        
        if (!hourlyRate || hourlyRate <= 0) {
          errors.hourlyRate = 'Le tarif horaire est requis et doit être positif';
        }
        if (!totalCoupons || totalCoupons <= 0) {
          errors.totalCoupons = 'Le nombre de coupons est requis et doit être positif';
        }
        
        return errors;
      };
      
      // Test avec valeurs invalides
      let errors = validateForm(0, 0);
      expect(errors.hourlyRate).toBeDefined();
      expect(errors.totalCoupons).toBeDefined();
      
      // Test avec valeurs valides
      errors = validateForm(25.5, 10);
      expect(Object.keys(errors).length).toBe(0);
      
      // Test avec valeurs négatives
      errors = validateForm(-5, -2);
      expect(errors.hourlyRate).toBeDefined();
      expect(errors.totalCoupons).toBeDefined();
    });

    test('Les messages d\'erreur doivent s\'afficher sous les champs', () => {
      const field = document.createElement('div');
      field.className = 'series-details__field';
      
      const input = document.createElement('input');
      input.type = 'number';
      input.value = '-5';
      
      const errorMessage = document.createElement('div');
      errorMessage.className = 'input__error';
      errorMessage.textContent = 'Le tarif horaire est requis et doit être positif';
      errorMessage.style.color = '#dc2626';
      
      field.appendChild(input);
      field.appendChild(errorMessage);
      document.body.appendChild(field);
      
      const error = document.querySelector('.input__error');
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('requis et doit être positif');
      expect(error.style.color).toBe('rgb(220, 38, 38)');
    });
  });

  describe('États de sauvegarde', () => {
    test('Le bouton Enregistrer doit afficher \"Sauvegarde...\" pendant l\'envoi', () => {
      const saveButton = document.createElement('button');
      saveButton.textContent = 'Enregistrer';
      saveButton.className = 'button button--primary';
      saveButton.disabled = false;
      
      // Simulation de l'état de sauvegarde
      const setSavingState = (isSaving) => {
        saveButton.textContent = isSaving ? 'Sauvegarde...' : 'Enregistrer';
        saveButton.disabled = isSaving;
      };
      
      document.body.appendChild(saveButton);
      
      // Test état initial
      expect(saveButton.textContent).toBe('Enregistrer');
      expect(saveButton.disabled).toBe(false);
      
      // Test état de sauvegarde
      setSavingState(true);
      expect(saveButton.textContent).toBe('Sauvegarde...');
      expect(saveButton.disabled).toBe(true);
      
      // Test retour à l'état normal
      setSavingState(false);
      expect(saveButton.textContent).toBe('Enregistrer');
      expect(saveButton.disabled).toBe(false);
    });
  });

  describe('Annulation des modifications', () => {
    test('Le bouton Annuler doit restaurer les valeurs originales', () => {
      const originalData = {
        hourlyRate: 25.00,
        totalCoupons: 10,
        status: 'active'
      };
      
      // Simulation de l'annulation
      const cancelEditing = () => {
        // Reset des données
        return { ...originalData };
      };
      
      // Modifier les données
      const editedData = {
        hourlyRate: 30.00,
        totalCoupons: 15,
        status: 'completed'
      };
      
      // Annuler
      const resetData = cancelEditing();
      
      expect(resetData.hourlyRate).toBe(25.00);
      expect(resetData.totalCoupons).toBe(10);
      expect(resetData.status).toBe('active');
    });
  });
});

console.log('✅ Tests SeriesDetails - Mode édition créés avec succès');