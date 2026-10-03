import { defineConfig } from 'vitest/config';

// Q1: integration tests against the LOCAL Auth + Firestore emulators
// (started by `npm run test:integration` via emulators:exec). Never touches
// real Firebase: the loader only connects to emulators when
// VITE_FIREBASE_EMULATOR=1 in DEV/test mode.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 60000,
    hookTimeout: 120000,
    env: {
      VITE_FIREBASE_EMULATOR: '1',
      VITE_FIREBASE_EMULATOR_AUTH: '127.0.0.1:9099',
      VITE_FIREBASE_EMULATOR_FIRESTORE: '127.0.0.1:8085',
      VITE_FIREBASE_API_KEY: 'demo-q-integration',
      VITE_FIREBASE_PROJECT_ID: 'demo-q1-integration',
    },
  },
});
