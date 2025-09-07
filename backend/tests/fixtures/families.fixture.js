/**
 * Fixtures de familles pour tests
 * Données réutilisables pour éviter la duplication
 */

const mongoose = require('mongoose');

const testFamilies = {
  // Prospect complet valide
  prospectComplete: {
    address: { 
      street: '123 Test Street',
      city: 'TestVille',
      postalCode: '75001'
    },
    primaryContact: {
      firstName: 'Jean',
      lastName: 'Prospect',
      email: 'jean.prospect@test.fr',
      primaryPhone: '0123456789',
      gender: 'M.'
    },
    secondaryContact: {
      firstName: 'Marie',
      lastName: 'Prospect',
      email: 'marie.prospect@test.fr',
      primaryPhone: '0123456790',
      gender: 'Mme'
    },
    demande: {
      beneficiaryType: 'adulte',
      subjects: ['Mathématiques', 'Français'],
      notes: 'Demande de cours particuliers'
    },
    status: 'prospect'
  },

  // Prospect minimal (champs requis seulement)
  prospectMinimal: {
    address: { 
      street: '1 Rue Min',
      city: 'Min',
      postalCode: '10000'
    },
    primaryContact: {
      firstName: 'Min',
      lastName: 'Imal',
      email: 'min@test.fr',
      primaryPhone: '0600000000',
      gender: 'M.'
    },
    demande: {
      beneficiaryType: 'eleves',
      subjects: ['Test']
    },
    status: 'prospect'
  },

  // Client avec NDR
  clientWithNDR: {
    address: { 
      street: '456 Avenue Client',
      city: 'ClientVille',
      postalCode: '69000'
    },
    primaryContact: {
      firstName: 'Pierre',
      lastName: 'Client',
      email: 'pierre.client@test.fr',
      primaryPhone: '0987654321',
      gender: 'M.'
    },
    demande: {
      beneficiaryType: 'adulte',
      subjects: ['Anglais'],
      notes: 'Client régulier'
    },
    status: 'client',
    settlementNotes: [] // Sera rempli dynamiquement
  },

  // Famille avec étudiants
  familyWithStudents: {
    address: { 
      street: '789 Boulevard Famille',
      city: 'FamilleVille',
      postalCode: '13000'
    },
    primaryContact: {
      firstName: 'Sophie',
      lastName: 'Parent',
      email: 'sophie.parent@test.fr',
      primaryPhone: '0612345678',
      gender: 'Mme'
    },
    demande: {
      beneficiaryType: 'eleves',
      subjects: ['Mathématiques', 'Physique'],
      notes: 'Deux enfants à accompagner'
    },
    status: 'prospect',
    students: [] // Sera rempli avec createStudents()
  },

  // Créer plusieurs familles d'un coup
  createBatch: (count = 10, status = 'prospect') => {
    const families = [];
    for (let i = 0; i < count; i++) {
      families.push({
        address: { 
          street: `${i} Rue Batch`,
          city: 'BatchVille',
          postalCode: `${10000 + i}`
        },
        primaryContact: {
          firstName: `Batch${i}`,
          lastName: 'Test',
          email: `batch${i}@test.fr`,
          primaryPhone: `06${String(i).padStart(8, '0')}`,
          gender: i % 2 === 0 ? 'M.' : 'Mme'
        },
        demande: {
          beneficiaryType: i % 2 === 0 ? 'adulte' : 'eleves',
          subjects: ['Test'],
          notes: `Batch test ${i}`
        },
        status
      });
    }
    return families;
  },

  // Créer des étudiants pour une famille
  createStudents: (familyId, count = 2) => {
    const students = [];
    for (let i = 0; i < count; i++) {
      students.push({
        familyId: familyId || new mongoose.Types.ObjectId(),
        firstName: `Élève${i + 1}`,
        lastName: 'Test',
        dateOfBirth: new Date(2010 + i, 0, 1),
        school: {
          name: 'Lycée Test',
          grade: `${6 + i}ème`
        }
      });
    }
    return students;
  },

  // Données invalides pour tests d'erreur
  invalidData: {
    missingRequired: {
      address: { street: '1 rue', city: 'Ville' }, // Manque postalCode
      primaryContact: { firstName: 'Test' }, // Manque lastName, email, phone, gender
      status: 'prospect'
      // Manque demande
    },
    
    invalidGender: {
      address: { street: '1 rue', city: 'Ville', postalCode: '10000' },
      primaryContact: {
        firstName: 'Test',
        lastName: 'Invalid',
        email: 'test@test.fr',
        primaryPhone: '0600000000',
        gender: 'X' // Invalide, doit être M. ou Mme
      },
      demande: { beneficiaryType: 'adulte', subjects: ['Test'] },
      status: 'prospect'
    },

    invalidStatus: {
      address: { street: '1 rue', city: 'Ville', postalCode: '10000' },
      primaryContact: {
        firstName: 'Test',
        lastName: 'Invalid',
        email: 'test@test.fr',
        primaryPhone: '0600000000',
        gender: 'M.'
      },
      demande: { beneficiaryType: 'adulte', subjects: ['Test'] },
      status: 'invalid' // Doit être prospect ou client
    }
  }
};

module.exports = testFamilies;