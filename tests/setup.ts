import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { loadTranslations } from '../constants/translations';

// S7: dictionaries are lazy in the app; tests read both synchronously.
await Promise.all([loadTranslations('en'), loadTranslations('es')]);

// Node 24+ ships an experimental global `localStorage` accessor that shadows
// jsdom's Storage with `undefined` unless --localstorage-file is provided.
// Restore standard in-memory Storage semantics for the test environment.
if (typeof (globalThis as any).localStorage === 'undefined') {
  const createMemoryStorage = (): Storage => {
    const store = new Map<string, string>();
    return {
      get length() {
        return store.size;
      },
      clear: () => {
        store.clear();
      },
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      key: (index: number) => [...store.keys()][index] ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
    } as Storage;
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
