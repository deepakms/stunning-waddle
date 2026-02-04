/** @type {import('jest').Config} */
module.exports = {
  // Use node environment for utility tests
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
      },
    ],
  },

  // Transform packages that use ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|expo-modules-core|@react-native|react-native|@supabase)/)',
  ],

  // Path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Test file patterns
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],

  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/app/'],

  // Coverage settings
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/node_modules/**',
  ],
};
