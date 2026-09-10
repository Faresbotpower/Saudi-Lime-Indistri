import '@testing-library/jest-dom/vitest'

// Tests run with reduced motion so count-ups and transitions resolve immediately.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

if (!('ResizeObserver' in window)) {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: RO })
}

// happy-dom's Web Animations stub rejects with AbortError on teardown; Framer falls back to
// its JS animator without it, which resolves instantly under reduced motion.
Object.defineProperty(Element.prototype, 'animate', { value: undefined, configurable: true, writable: true })
