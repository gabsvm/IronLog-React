// Q1: shared setup for emulator integration tests (Node environment).
// Stubs the browser globals that syncService and utils/db touch:
// window.dispatchEvent / localStorage and navigator (no serviceWorker).
import 'fake-indexeddb/auto';

const store = new Map<string, string>();

const localStorageStub = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
        store.set(key, String(value));
    },
    removeItem: (key: string) => {
        store.delete(key);
    },
    clear: () => store.clear(),
    get length() {
        return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
};

(globalThis as any).window = (globalThis as any).window ?? {};
Object.assign((globalThis as any).window, {
    dispatchEvent: () => true,
    localStorage: localStorageStub,
    _lastSyncedId: undefined,
});
// Note: no navigator stub; globalThis.navigator is read-only in Node.

export const emulatorsRunning =
    !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
