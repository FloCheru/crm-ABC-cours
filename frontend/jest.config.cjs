/**
 * Configuration Jest pour tests Frontend
 */

module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Configuration pour Node.js globals
  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:3000/api',
        VITE_APP_NAME: 'ABC Cours CRM (Test)',
        VITE_APP_VERSION: '1.0.0',
        VITE_ENVIRONMENT: 'test',
        VITE_DEBUG: 'false'
      }
    }
  },
  
  // Chemins de tests
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  
  // Extensions de fichiers
  moduleFileExtensions: [
    'js',
    'jsx', 
    'ts',
    'tsx',
    'json'
  ],
  
  // Transformation des fichiers
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ],
      plugins: [
        ['babel-plugin-transform-vite-meta-env', {
          VITE_API_URL: 'http://localhost:3000/api',
          VITE_APP_NAME: 'ABC Cours CRM (Test)',
          VITE_APP_VERSION: '1.0.0',
          VITE_ENVIRONMENT: 'test',
          VITE_DEBUG: 'false'
        }]
      ]
    }]
  },
  
  // Mapping des modules (correction: moduleNameMapping → moduleNameMapper)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Setup avant tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Fichiers à ignorer
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  
  // Couverture
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!**/*.d.ts'
  ],
  
  coverageThreshold: {
    global: {
      branches: 50, // Réduit pour commencer
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  coverageReporters: [
    'text',
    'text-summary', 
    'html'
  ],
  
  // Timeout
  testTimeout: 10000,
  
  // Affichage
  verbose: true,
  
  // Parallélisation
  maxWorkers: 4
};