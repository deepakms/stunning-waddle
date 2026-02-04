/**
 * Jest Setup File
 *
 * Global test setup and mocks for the test environment.
 */

// Define __DEV__ global for React Native
global.__DEV__ = true;

// Mock React Native with minimal implementation
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios ?? obj.default),
  },
  NativeModules: {},
  StyleSheet: {
    create: (styles) => styles,
    flatten: jest.fn(),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
  SafeAreaView: 'SafeAreaView',
  Image: 'Image',
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Animated: {
    View: 'View',
    Text: 'Text',
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    Value: jest.fn(() => ({
      interpolate: jest.fn(),
      setValue: jest.fn(),
    })),
    createAnimatedComponent: (component) => component,
  },
  Keyboard: {
    dismiss: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
  I18nManager: {
    isRTL: false,
  },
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

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
