// jest.config.js
export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@src/(.*)$': '<rootDir>/src/$1'
    },
    testMatch: [
        '**/tests/**/*.js',
        '**/src/**/*.test.js'
    ],
    setupFilesAfterEnv: ['./tests/setup-test-env.js'],
    moduleDirectories: ['node_modules', 'src'],
    testTimeout: 60000,
    verbose: true,
    detectOpenHandles: true,
    forceExit: true,
    clearMocks: true,
    restoreMocks: true,
    injectGlobals: true,
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/coverage/',
        '/logs/'
    ],
    moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
    testEnvironmentOptions: {
        url: 'http://localhost'
    }
};