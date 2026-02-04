/** @type {import('jest').Config} */
module.exports = {
  // Use jsdom for React component tests
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Transform TypeScript and JavaScript files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
      },
    ],
  },

  // Transform packages that use ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|expo-modules-core|@react-native|react-native|@supabase|@testing-library|pretty-format|react-is)/)',
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
