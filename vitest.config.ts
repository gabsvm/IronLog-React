// Tests must run against the development React build (act() support) even
// when the ambient shell exports NODE_ENV=production for other tooling.
process.env.NODE_ENV = 'test';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    // U1: at full parallelism (one jsdom worker per core) chart-heavy Stats
    // renders went from ~0.3 s to 3.7 s and timed out intermittently. Half the
    // cores keeps the suite fast and the timings predictable.
    poolOptions: { forks: { minForks: 1, maxForks: 6 } },
  },
});
