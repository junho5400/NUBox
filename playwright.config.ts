import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --mode e2e --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
});
