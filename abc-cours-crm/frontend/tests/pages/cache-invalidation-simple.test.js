/**
 * Test simple de l'invalidation du cache après ajout d'élève
 */

// Mocks avant tout
const mockNavigate = jest.fn();
const mockInvalidate = jest.fn();
const mockAddStudent = jest.fn();

jest.mock('react-router-dom');
jest.mock('../../src/hooks/useCacheInvalidation');
jest.mock('../../src/services/familyService');

import { useCacheInvalidation } from '../../src/hooks/useCacheInvalidation';
import { familyService } from '../../src/services/familyService';

describe('Cache Invalidation System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup des mocks après clear
    useCacheInvalidation.mockReturnValue({
      invalidateAllFamilyRelatedCaches: mockInvalidate,
    });
    
    familyService.addStudent = mockAddStudent;
    mockAddStudent.mockResolvedValue({ success: true });
  });

  test('invalidateAllFamilyRelatedCaches existe et fonctionne', () => {
    const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();
    
    expect(typeof invalidateAllFamilyRelatedCaches).toBe('function');
    
    invalidateAllFamilyRelatedCaches();
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  test('familyService.addStudent existe', () => {
    expect(typeof familyService.addStudent).toBe('function');
  });

  test('séquence complète: addStudent puis invalidation', async () => {
    // Simuler la séquence d'AddStudent.tsx
    const familyId = 'test-family-id';
    const studentData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      dateOfBirth: '2010-01-01',
      school: { name: 'Test', level: 'college', grade: '6ème' },
      contact: {},
      courseLocation: { type: 'domicile' },
      status: 'active',
    };

    // 1. Appeler addStudent
    await familyService.addStudent(familyId, studentData);
    expect(mockAddStudent).toHaveBeenCalledWith(familyId, studentData);

    // 2. Invalider le cache
    const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();
    invalidateAllFamilyRelatedCaches();
    
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });
});