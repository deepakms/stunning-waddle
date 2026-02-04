/**
 * Jest Setup File
 *
 * Global test setup and mocks for the test environment.
 */

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Redirect: ({ href }) => null,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
  Link: ({ children }) => children,
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `couplesworkout://${path}`),
  parse: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
}));

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes?.('Animated') ||
    args[0]?.includes?.('componentWillReceiveProps') ||
    args[0]?.includes?.('componentWillMount')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
