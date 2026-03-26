import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/screenshots',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 }, browserName: 'chromium' },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 }, browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 4321,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
