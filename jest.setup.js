// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Suppress React act() warnings for async state updates in useEffect
// These warnings occur when components update state asynchronously (e.g., in useEffect)
// The warnings are informational and don't indicate test failures - the tests still pass
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    // Suppress React act() warnings - these are expected for async useEffect updates
    if (
      typeof args[0] === 'string' &&
      (args[0].includes(
        'The current testing environment is not configured to support act(...)'
      ) ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('was not wrapped in act(...)'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock window.matchMedia for Sanity UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver for Sanity UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
