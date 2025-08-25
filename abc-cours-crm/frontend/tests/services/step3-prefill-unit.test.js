/**
 * Tests unitaires spécifiques pour l'intégration du préremplissage dans Step3
 * Ces tests se concentrent sur la logique métier sans l'interface utilisateur
 */
import { ndrPrefillService } from '../../src/services/ndrPrefillService';

describe('Step3RatesValidation - Unit Tests Préremplissage', () => {
  describe('Intégration avec données Step1 et Step2', () => {
    it('devrait générer un préremplissage avec des données réalistes de Step1 et Step2', () => {
      // Arrange - Données typiques venant des étapes précédentes
      const step1Data = {
        familyId: 'family-123',
        clientName: 'Famille Dupont',
        department: '75 - Paris',
        primaryContact: {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie.dupont@email.com',
          phone: '0123456789'
        }
      };

      const step2Data = {
        familySelected: true,
        studentIds: ['student-1', 'student-2'],
        selectedSubjectIds: ['math-id', 'physics-id', 'french-id']
      };

      // Simuler les matières récupérées en Step3
      const subjects = [
        { _id: 'math-id', name: 'Mathématiques' },
        { _id: 'physics-id', name: 'Physique' },
        { _id: 'french-id', name: 'Français' }
      ];

      // Act
      const prefillData = ndrPrefillService.generatePrefillData(
        subjects,
        step1Data.department,
        'prospect' // Nouveau client
      );

      // Assert
      expect(prefillData).toEqual({
        hourlyRate: 27.67, // Moyenne Math(28) + Physique(30) + Français(25) / 3
        professorSalary: 20, // Moyenne Math(20) + Physique(22) + Français(18) / 3  
        quantity: 24, // 3 matières × 8 heures par défaut
        charges: 3.0, // Paris = charges élevées
        paymentMethod: 'check', // Prospect = chèque par défaut
        paymentType: 'tax_credit_n1' // Crédit d'impôt le plus courant
      });
    });

    it('devrait adapter les calculs selon le département client', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Mathématiques' }];
      
      // Test avec différents départements
      const parisData = ndrPrefillService.generatePrefillData(subjects, '75 - Paris', 'prospect');
      const lyonData = ndrPrefillService.generatePrefillData(subjects, '69 - Lyon', 'prospect');
      const autreData = ndrPrefillService.generatePrefillData(subjects, '15 - Cantal', 'prospect');

      // Assert - Les charges diffèrent selon la localisation
      expect(parisData.charges).toBe(3.0); // Paris = charges maximales
      expect(lyonData.charges).toBe(2.4); // Lyon = charges moyennes
      expect(autreData.charges).toBe(2.0); // Autres = charges standard
      
      // Mais les tarifs restent identiques (même matière)
      expect(parisData.hourlyRate).toBe(lyonData.hourlyRate);
      expect(parisData.hourlyRate).toBe(autreData.hourlyRate);
    });

    it('devrait calculer correctement les previews financières', () => {
      // Arrange
      const prefillData = {
        hourlyRate: 30,
        quantity: 16,
        professorSalary: 22,
        charges: 2.5,
        paymentMethod: 'transfer',
        paymentType: 'tax_credit_n1'
      };

      // Act
      const preview = ndrPrefillService.calculateQuickPreview(prefillData);

      // Assert
      expect(preview).toEqual({
        totalRevenue: 480, // 30 × 16
        totalSalary: 352, // 22 × 16
        totalCharges: 40, // 2.5 × 16
        margin: 88, // 480 - 352 - 40
        marginPercentage: 18.3 // (88 / 480) × 100, arrondi à 1 décimale
      });
    });
  });

  describe('Cas d\'usage métier réels', () => {
    it('devrait gérer un client avec beaucoup de matières scientifiques', () => {
      // Arrange - Élève en terminale scientifique
      const subjects = [
        { _id: '1', name: 'Mathématiques' },
        { _id: '2', name: 'Physique' },
        { _id: '3', name: 'Chimie' },
        { _id: '4', name: 'Biologie' }
      ];

      // Act
      const prefillData = ndrPrefillService.generatePrefillData(subjects, '92 - Hauts-de-Seine', 'client');

      // Assert
      // Tarifs élevés pour matières scientifiques
      expect(prefillData.hourlyRate).toBeGreaterThan(27); // Au dessus de la moyenne générale
      expect(prefillData.professorSalary).toBeGreaterThan(19); // Salaires prof plus élevés
      expect(prefillData.quantity).toBe(32); // 4 matières × 8 heures
      expect(prefillData.paymentMethod).toBe('transfer'); // Client = virement
      expect(prefillData.charges).toBe(2.8); // Hauts-de-Seine
    });

    it('devrait gérer un client avec matières littéraires uniquement', () => {
      // Arrange - Élève en filière littéraire
      const subjects = [
        { _id: '1', name: 'Français' },
        { _id: '2', name: 'Histoire' },
        { _id: '3', name: 'Anglais' },
        { _id: '4', name: 'Espagnol' }
      ];

      // Act
      const prefillData = ndrPrefillService.generatePrefillData(subjects, '31 - Haute-Garonne', 'prospect');

      // Assert
      // Tarifs modérés pour matières littéraires
      expect(prefillData.hourlyRate).toBeLessThan(27); // Sous la moyenne scientifique
      expect(prefillData.professorSalary).toBeLessThan(20); 
      expect(prefillData.charges).toBe(2.3); // Toulouse
    });

    it('devrait calculer des tarifs optimaux pour différentes marges cibles', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Mathématiques' }];
      const department = '69 - Lyon';

      // Act - Test avec différentes marges cibles
      const marge20 = ndrPrefillService.suggestOptimalRates(subjects, department, 20);
      const marge30 = ndrPrefillService.suggestOptimalRates(subjects, department, 30);

      // Assert
      expect(marge30.hourlyRate).toBeGreaterThan(marge20.hourlyRate);
      
      // Vérifier que les marges calculées correspondent aux cibles
      const preview20 = ndrPrefillService.calculateQuickPreview(marge20);
      const preview30 = ndrPrefillService.calculateQuickPreview(marge30);
      
      expect(Math.round(preview20.marginPercentage)).toBe(20);
      expect(Math.round(preview30.marginPercentage)).toBe(30);
    });
  });

  describe('Validation des règles métier', () => {
    it('devrait respecter les minimums de rentabilité', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Français' }]; // Matière avec tarif standard
      
      // Act
      const prefillData = ndrPrefillService.generatePrefillData(subjects, '75 - Paris', 'prospect');
      const preview = ndrPrefillService.calculateQuickPreview(prefillData);

      // Assert - La marge doit être positive
      expect(preview.margin).toBeGreaterThan(0);
      expect(preview.marginPercentage).toBeGreaterThan(10); // Au moins 10% de marge
    });

    it('devrait suggérer des modes de paiement appropriés selon le profil', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Mathématiques' }];
      
      // Act
      const prospectData = ndrPrefillService.generatePrefillData(subjects, '75 - Paris', 'prospect');
      const clientData = ndrPrefillService.generatePrefillData(subjects, '75 - Paris', 'client');

      // Assert - Modes de paiement différenciés
      expect(prospectData.paymentMethod).toBe('check'); // Prospects = sécurité
      expect(clientData.paymentMethod).toBe('transfer'); // Clients = commodité
      
      // Type de paiement identique (business rule)
      expect(prospectData.paymentType).toBe('tax_credit_n1');
      expect(clientData.paymentType).toBe('tax_credit_n1');
    });
  });
});