// Same NODE_ENV guarantee as vitest.config.ts (see comment there).
process.env.NODE_ENV = 'test';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
