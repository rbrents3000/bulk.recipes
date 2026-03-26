import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/test-results',
  timeout: 30000,
  retries: 0,
  workers: 2,
  use: {
    baseURL: 'http://localhost:4321',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run dev',
    port: 4321,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
