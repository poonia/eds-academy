const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4173/eds-academy/', browserName: 'chromium' },
  webServer: {
    command: 'python3 tests/serve.py 4173',
    url: 'http://127.0.0.1:4173/eds-academy/index.html',
    reuseExistingServer: !process.env.CI,
  },
});
