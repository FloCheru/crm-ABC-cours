/**
 * Setup global pour tests Frontend
 * Configuration Jest et React Testing Library
 */

import '@testing-library/jest-dom';

// Mock de fetch global
global.fetch = jest.fn();

// Mock de window.matchMedia (pour composants responsive)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de window.confirm pour tests de suppression
global.confirm = jest.fn(() => true);

// Mock de window.alert  
global.alert = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Configuration TextEncoder/TextDecoder pour Node.js
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const actualRouter = jest.requireActual('react-router-dom');
  return {
    ...actualRouter,
    useNavigate: () => jest.fn(),
    useLocation: () => ({
      pathname: '/test',
      search: '',
      hash: '',
      state: null
    }),
  };
});

// Mock des services API
jest.mock('../src/services/familyService', () => ({
  familyService: {
    getFamilies: jest.fn(),
    getFamilyStats: jest.fn(),
    createFamily: jest.fn(),
    deleteFamily: jest.fn(),
    updateProspectStatus: jest.fn(),
    updateFamilyStatus: jest.fn(),
  }
}));

jest.mock('../src/services/settlementService', () => ({
  settlementService: {
    getSettlementNotesByFamily: jest.fn(),
    deleteSettlementNote: jest.fn(),
    createSettlementNote: jest.fn(),
  }
}));

// Console personnalisée pour tests
const originalError = console.error;
console.error = (...args) => {
  // Ignorer certains warnings React en mode test
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning:')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Helpers globaux pour tests
global.testHelpers = {
  // Attendre que les effets asynchrones se terminent
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Créer des données mock
  createMockFamily: (overrides = {}) => ({
    _id: 'test-family-id',
    status: 'prospect',
    primaryContact: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      primaryPhone: '0123456789',
      gender: 'M.'
    },
    address: {
      street: '123 Test Street',
      city: 'Test City',
      postalCode: '12345'
    },
    demande: {
      beneficiaryType: 'adulte',
      subjects: ['Test'],
      notes: 'Test notes'
    },
    settlementNotes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),
  
  // Mock store Zustand
  createMockStore: (initialState = {}) => ({
    getState: () => initialState,
    setState: jest.fn(),
    subscribe: jest.fn(),
    destroy: jest.fn(),
  })
};

// Configuration timeouts
jest.setTimeout(10000);

console.log('🧪 Frontend test setup completed');