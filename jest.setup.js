/**
 * Jest Setup File
 *
 * Runs before each test suite
 * Configure global mocks and utilities here
 */

// Set timezone to GMT+8 (consistent with project)
process.env.TZ = 'Asia/Shanghai';

// Suppress console output during tests (optional, can be commented out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Mock performance.now() for consistent timing tests
if (!global.performance) {
  global.performance = {};
}

let mockTime = 0;
global.performance.now = jest.fn(() => {
  mockTime += 16; // ~60fps
  return mockTime;
});

// Reset mock time before each test
beforeEach(() => {
  mockTime = 0;
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock window.matchMedia (for CSS media queries) - only if window exists
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock localStorage - only if window exists
if (typeof window !== 'undefined') {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
      get length() { return Object.keys(store).length; },
      key: (index) => Object.keys(store)[index] || null
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });
}

console.log('✅ Jest setup completed - Global mocks initialized');
