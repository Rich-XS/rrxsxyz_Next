/**
 * Jest Configuration for RRXS.XYZ Project
 *
 * Testing Framework: Jest v30.2.0
 * Environment: Node.js + JSDOM (for browser-like testing)
 *
 * Test Suites:
 * - Unit Tests: test_reports/unit_tests/*.test.js
 * - Integration Tests: test_reports/integration_tests/*.test.js (future)
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/test_reports/**/*.test.js',
    '**/test_reports/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'duomotai/src/**/*.js',
    'server/**/*.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/Backup/**',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],

  // Coverage thresholds (optional, can be adjusted)
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    }
  },

  // Module paths
  moduleDirectories: ['node_modules', 'duomotai/src', 'server'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Transform configuration (if needed for ES modules)
  transform: {},

  // Timeout for tests (default 5000ms, increase for slow tests)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/Backup/',
    '/.claude/'
  ],

  // Module name mapper (for absolute imports)
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/duomotai/src/modules/$1',
    '^@server/(.*)$': '<rootDir>/server/$1'
  }
};
