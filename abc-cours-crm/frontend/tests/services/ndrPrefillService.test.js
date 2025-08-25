import { ndrPrefillService } from '../../src/services/ndrPrefillService';

describe('NDRPrefillService', () => {
  describe('generatePrefillData', () => {
    it('devrait générer des données de préremplissage avec les matières par défaut', () => {
      // Arrange
      const subjects = [
        { _id: '1', name: 'Mathématiques' },
        { _id: '2', name: 'Français' }
      ];
      const department = '75 - Paris';

      // Act
      const result = ndrPrefillService.generatePrefillData(subjects, department);

      // Assert
      expect(result).toBeDefined();
      expect(result.hourlyRate).toBeGreaterThan(0);
      expect(result.quantity).toBe(16); // 2 matières × 8 heures par défaut
      expect(result.professorSalary).toBeGreaterThan(0);
      expect(result.charges).toBe(3.0); // Paris a des charges élevées
      expect(result.paymentMethod).toBe('check'); // Prospect par défaut
      expect(result.paymentType).toBe('tax_credit_n1');
    });

    it('devrait calculer des tarifs spécialisés pour les matières scientifiques', () => {
      // Arrange
      const subjects = [
        { _id: '1', name: 'Physique' },
        { _id: '2', name: 'Chimie' }
      ];
      const department = '69 - Lyon';

      // Act
      const result = ndrPrefillService.generatePrefillData(subjects, department);

      // Assert
      expect(result.hourlyRate).toBe(30); // Moyenne des tarifs physique (30) et chimie (30)
      expect(result.professorSalary).toBe(22); // Moyenne des salaires physique (22) et chimie (22)
      expect(result.charges).toBe(2.4); // Lyon a des charges moyennes
    });

    it('devrait utiliser des tarifs par défaut pour les matières non reconnues', () => {
      // Arrange
      const subjects = [
        { _id: '1', name: 'Matière Inconnue' }
      ];
      const department = '12 - Aveyron';

      // Act
      const result = ndrPrefillService.generatePrefillData(subjects, department);

      // Assert
      expect(result.hourlyRate).toBe(25); // Tarif par défaut
      expect(result.professorSalary).toBe(18); // Salaire par défaut
      expect(result.charges).toBe(2.0); // Charges par défaut pour département non reconnu
    });

    it('devrait adapter le mode de paiement selon le type de client', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Français' }];
      const department = '92 - Hauts-de-Seine';

      // Act - Client existant
      const clientResult = ndrPrefillService.generatePrefillData(subjects, department, 'client');
      
      // Act - Prospect
      const prospectResult = ndrPrefillService.generatePrefillData(subjects, department, 'prospect');

      // Assert
      expect(clientResult.paymentMethod).toBe('transfer'); // Virement pour clients
      expect(prospectResult.paymentMethod).toBe('check'); // Chèque pour prospects
    });

    it('devrait calculer correctement la quantité totale selon le nombre de matières', () => {
      // Arrange
      const subjectsUne = [{ _id: '1', name: 'Français' }];
      const subjectsTrois = [
        { _id: '1', name: 'Mathématiques' },
        { _id: '2', name: 'Français' },
        { _id: '3', name: 'Anglais' }
      ];
      const department = '75 - Paris';

      // Act
      const resultUne = ndrPrefillService.generatePrefillData(subjectsUne, department);
      const resultTrois = ndrPrefillService.generatePrefillData(subjectsTrois, department);

      // Assert
      expect(resultUne.quantity).toBe(8); // 1 matière × 8 heures
      expect(resultTrois.quantity).toBe(24); // 3 matières × 8 heures
    });
  });

  describe('calculateQuickPreview', () => {
    it('devrait calculer correctement un aperçu financier', () => {
      // Arrange
      const prefillData = {
        hourlyRate: 25,
        quantity: 10,
        professorSalary: 18,
        charges: 2.5,
        paymentMethod: 'transfer',
        paymentType: 'tax_credit_n1'
      };

      // Act
      const preview = ndrPrefillService.calculateQuickPreview(prefillData);

      // Assert
      expect(preview.totalRevenue).toBe(250); // 25 × 10
      expect(preview.totalSalary).toBe(180); // 18 × 10
      expect(preview.totalCharges).toBe(25); // 2.5 × 10
      expect(preview.margin).toBe(45); // 250 - 180 - 25
      expect(preview.marginPercentage).toBe(18); // (45 / 250) × 100
    });

    it('devrait gérer correctement les marges négatives', () => {
      // Arrange
      const prefillData = {
        hourlyRate: 20,
        quantity: 10,
        professorSalary: 25, // Salaire plus élevé que le tarif horaire
        charges: 2,
        paymentMethod: 'transfer',
        paymentType: 'tax_credit_n1'
      };

      // Act
      const preview = ndrPrefillService.calculateQuickPreview(prefillData);

      // Assert
      expect(preview.totalRevenue).toBe(200);
      expect(preview.totalSalary).toBe(250);
      expect(preview.totalCharges).toBe(20);
      expect(preview.margin).toBe(-70); // Marge négative
      expect(preview.marginPercentage).toBe(-35); // Pourcentage négatif
    });

    it('devrait arrondir correctement les valeurs monétaires', () => {
      // Arrange
      const prefillData = {
        hourlyRate: 25.33,
        quantity: 7,
        professorSalary: 18.67,
        charges: 2.15,
        paymentMethod: 'transfer',
        paymentType: 'tax_credit_n1'
      };

      // Act
      const preview = ndrPrefillService.calculateQuickPreview(prefillData);

      // Assert
      expect(preview.totalRevenue).toBe(177.31); // Arrondi à 2 décimales
      expect(preview.totalSalary).toBe(130.69);
      expect(preview.totalCharges).toBe(15.05);
      expect(preview.margin).toBe(31.57);
      expect(preview.marginPercentage).toBe(17.8); // Arrondi à 1 décimale
    });
  });

  describe('suggestOptimalRates', () => {
    it('devrait suggérer un tarif optimal pour atteindre une marge cible', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Français' }];
      const department = '75 - Paris';
      const targetMargin = 25; // 25% de marge

      // Act
      const result = ndrPrefillService.suggestOptimalRates(subjects, department, targetMargin);

      // Assert
      // Avec professorSalary=18 et charges=3.0, pour 25% de marge:
      // hourlyRate = (18 + 3) / (1 - 0.25) = 21 / 0.75 = 28
      expect(result.hourlyRate).toBe(28);
      expect(result.professorSalary).toBe(18); // Inchangé
      expect(result.charges).toBe(3.0); // Inchangé pour Paris
    });

    it('devrait calculer des tarifs optimaux avec différentes marges cibles', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Mathématiques' }];
      const department = '69 - Lyon';

      // Act
      const result15 = ndrPrefillService.suggestOptimalRates(subjects, department, 15);
      const result30 = ndrPrefillService.suggestOptimalRates(subjects, department, 30);

      // Assert
      // Mathématiques: professorSalary=20, charges Lyon=2.4
      // 15% de marge: (20 + 2.4) / 0.85 = 26.35
      // 30% de marge: (20 + 2.4) / 0.70 = 32
      expect(result15.hourlyRate).toBe(26.35);
      expect(result30.hourlyRate).toBe(32);
    });
  });

  describe('Gestion des cas limites', () => {
    it('devrait gérer le cas avec aucune matière', () => {
      // Arrange
      const subjects = [];
      const department = '75 - Paris';

      // Act
      const result = ndrPrefillService.generatePrefillData(subjects, department);

      // Assert
      expect(result.hourlyRate).toBe(25); // Tarif par défaut
      expect(result.quantity).toBe(0); // Aucune matière = 0 heures
      expect(result.professorSalary).toBe(18); // Salaire par défaut
    });

    it('devrait gérer un département non reconnu', () => {
      // Arrange
      const subjects = [{ _id: '1', name: 'Français' }];
      const department = 'Département Inconnu';

      // Act
      const result = ndrPrefillService.generatePrefillData(subjects, department);

      // Assert
      expect(result.charges).toBe(2.0); // Charges par défaut
    });

    it('devrait calculer des moyennes pondérées avec de nombreuses matières', () => {
      // Arrange
      const subjects = [
        { _id: '1', name: 'Mathématiques' }, // 28€ / 20€
        { _id: '2', name: 'Physique' },      // 30€ / 22€
        { _id: '3', name: 'Français' },      // 25€ / 18€
        { _id: '4', name: 'Histoire' }       // 24€ / 17€
      ];
      const department = '13 - Bouches-du-Rhône';

      // Act
      const result = ndrPrefillService.generatePrefillData(subjects, department);

      // Assert
      // Moyenne tarif horaire: (28 + 30 + 25 + 24) / 4 = 26.75
      // Moyenne salaire professeur: (20 + 22 + 18 + 17) / 4 = 19.25
      expect(result.hourlyRate).toBe(26.75);
      expect(result.professorSalary).toBe(19.25);
      expect(result.quantity).toBe(32); // 4 matières × 8 heures
      expect(result.charges).toBe(2.4); // Marseille
    });
  });
});