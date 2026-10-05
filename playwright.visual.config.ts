import { defineConfig, devices } from '@playwright/test';

// U2: visual regression suite (separate from the functional e2e in tests/e2e).
export default defineConfig({
  testDir: './tests/visual',
  testMatch: /\.visual\.ts$/,
  outputDir: './test-results/visual',
  timeout: 90 * 1000,
  expect: { timeout: 10000, toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled', caret: 'hide' } },
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5196', viewport: { width: 390, height: 844 } },
  webServer: {
    command: 'npm run preview -- --port 5196 --strictPort',
    url: 'http://localhost:5196',
    reuseExistingServer: false,
    timeout: 60 * 1000,
  },
  projects: [{ name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }],
});
