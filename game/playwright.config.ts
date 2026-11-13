import { defineConfig, devices } from '@playwright/test';

// Runs on the VM (real google-chrome). Base URL mimics production: the game at /khaqaniya/, the poem site at /khaqaniya/qasida/.
export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 8,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4321/khaqaniya/',
    channel: 'chrome',
    locale: 'ar',
    serviceWorkers: 'allow',
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
    trace: 'off',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, channel: 'chrome', isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 }, channel: 'chrome' } },
  ],
  webServer: { command: 'node tests/serve.mjs 4321', url: 'http://127.0.0.1:4321/khaqaniya/', reuseExistingServer: true, timeout: 30_000 },
});
