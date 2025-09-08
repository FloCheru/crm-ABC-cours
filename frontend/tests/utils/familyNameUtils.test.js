import { getFamilyDisplayName, generateCouponSeriesName, isValidFamilyData } from '../../src/utils/familyNameUtils';

describe('familyNameUtils', () => {
  describe('getFamilyDisplayName', () => {
    it('should return fallback for null/undefined', () => {
      expect(getFamilyDisplayName(null)).toBe('Famille inconnue');
      expect(getFamilyDisplayName(undefined)).toBe('Famille inconnue');
      expect(getFamilyDisplayName(null, 'Custom fallback')).toBe('Custom fallback');
    });

    it('should return fallback for string (ObjectId)', () => {
      expect(getFamilyDisplayName('507f1f77bcf86cd799439011')).toBe('Famille inconnue');
    });

    it('should return fallback for object without primaryContact', () => {
      expect(getFamilyDisplayName({ _id: '123' })).toBe('Famille inconnue');
    });

    it('should return name for valid primaryContact', () => {
      const family = {
        _id: '123',
        primaryContact: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com'
        }
      };
      expect(getFamilyDisplayName(family)).toBe('Jean Dupont');
    });

    it('should handle partial names', () => {
      const familyFirstOnly = {
        primaryContact: { firstName: 'Jean', lastName: '', email: 'test@email.com' }
      };
      const familyLastOnly = {
        primaryContact: { firstName: '', lastName: 'Dupont', email: 'test@email.com' }
      };
      
      expect(getFamilyDisplayName(familyFirstOnly)).toBe('Jean');
      expect(getFamilyDisplayName(familyLastOnly)).toBe('Dupont');
    });

    it('should generate names from email when names are missing', () => {
      const familyNoNames = {
        primaryContact: {
          firstName: '',
          lastName: '',
          email: 'jean.dupont@gmail.com'
        }
      };
      
      expect(getFamilyDisplayName(familyNoNames)).toBe('jean dupont');
    });

    it('should handle email without dot', () => {
      const familySimpleEmail = {
        primaryContact: {
          firstName: '',
          lastName: '',
          email: 'client@gmail.com'
        }
      };
      
      expect(getFamilyDisplayName(familySimpleEmail)).toBe('client Famille');
    });

    it('should return fallback when everything is empty', () => {
      const familyEmpty = {
        primaryContact: {
          firstName: '',
          lastName: '',
          email: ''
        }
      };
      
      expect(getFamilyDisplayName(familyEmpty)).toBe('Famille inconnue');
    });
  });

  describe('generateCouponSeriesName', () => {
    it('should generate valid series name', () => {
      const family = {
        primaryContact: {
          firstName: 'Jean',
          lastName: 'Dupont'
        }
      };
      const date = new Date('2024-03-15');
      
      expect(generateCouponSeriesName(family, date)).toBe('JeanDupont_03_2024');
    });

    it('should handle special characters', () => {
      const family = {
        primaryContact: {
          firstName: 'Jean-Claude',
          lastName: 'Dupont-Martin'
        }
      };
      const date = new Date('2024-12-01');
      
      expect(generateCouponSeriesName(family, date)).toBe('JeanClaudeDupontMartin_12_2024');
    });

    it('should handle unknown families', () => {
      const result = generateCouponSeriesName(null, new Date('2024-05-10'));
      expect(result).toBe('FamilleInconnue_05_2024');
    });
  });

  describe('isValidFamilyData', () => {
    it('should return false for invalid data', () => {
      expect(isValidFamilyData(null)).toBe(false);
      expect(isValidFamilyData('123')).toBe(false);
      expect(isValidFamilyData({})).toBe(false);
      expect(isValidFamilyData({ primaryContact: null })).toBe(false);
    });

    it('should return true for valid names', () => {
      const family = {
        primaryContact: {
          firstName: 'Jean',
          lastName: 'Dupont'
        }
      };
      expect(isValidFamilyData(family)).toBe(true);
    });

    it('should return true for valid email even without names', () => {
      const family = {
        primaryContact: {
          firstName: '',
          lastName: '',
          email: 'test@email.com'
        }
      };
      expect(isValidFamilyData(family)).toBe(true);
    });

    it('should return false for empty data', () => {
      const family = {
        primaryContact: {
          firstName: '',
          lastName: '',
          email: ''
        }
      };
      console.log('Test result:', isValidFamilyData(family));
      expect(isValidFamilyData(family)).toBe(false);
    });
  });
});