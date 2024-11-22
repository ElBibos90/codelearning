// jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/tests/**/*.js',
    '**/src/**/*.test.js'
  ],
  setupFilesAfterEnv: ['./tests/setup-test-env.js'], 
  moduleDirectories: ['node_modules'],
  testTimeout: 10000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ]
};