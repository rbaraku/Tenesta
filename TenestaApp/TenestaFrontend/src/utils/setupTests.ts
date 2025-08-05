import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  StatusBar: {
    currentHeight: 0,
  },
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Redux
const mockStore = {
  getState: jest.fn(() => ({})),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
};

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Supabase
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  authService: {
    getCurrentUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Mock API service
jest.mock('../services/api', () => ({
  apiService: {
    getTenantDashboard: jest.fn(),
    getLandlordDashboard: jest.fn(),
    getPayments: jest.fn(),
    processPayment: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Uncomment to silence console logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};