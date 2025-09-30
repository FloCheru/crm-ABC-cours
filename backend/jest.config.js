// jest.config.js
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testTimeout: 30000,
  collectCoverageFrom: [
    "models/**/*.js",
    "routes/**/*.js",
    "middleware/**/*.js",
    "!**/node_modules/**",
  ],
  detectOpenHandles: true,
  forceExit: true,

  // Support TypeScript pour les services frontend
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
};
