import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

import { env, isCI } from './src/config/env';

const artefact = env.artefacts;

const reporters: ReporterDescription[] = [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['junit', { outputFile: 'reports/junit/results.xml' }],
  ['json', { outputFile: 'reports/json/results.json' }],
  [
    'allure-playwright',
    {
      resultsDir: 'allure-results',
      detail: true,
      environmentInfo: {
        base_url: env.baseUrl,
        node: process.version,
        os: `${process.platform} ${process.arch}`,
      },
    },
  ],
];

if (isCI) {
  reporters.push(['github']);
  reporters.push(['blob', { outputDir: 'blob-report' }]);
}

const desktopUse = {
  baseURL: env.baseUrl,
  headless: env.execution.headless,
  actionTimeout: env.execution.actionTimeoutMs,
  navigationTimeout: env.execution.navigationTimeoutMs,
  trace: artefact.trace as 'on-first-retry',
  video: artefact.video as 'retain-on-failure',
  screenshot: artefact.screenshot as 'only-on-failure',
  ignoreHTTPSErrors: true,
};

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: env.execution.retries,
  workers: env.execution.workers,
  timeout: env.execution.testTimeoutMs,
  reportSlowTests: { max: 5, threshold: 30_000 },
  expect: { timeout: env.execution.expectTimeoutMs },
  reporter: reporters,
  use: desktopUse,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...desktopUse },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], ...desktopUse },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], ...desktopUse },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], ...desktopUse },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'], ...desktopUse },
    },
  ],
});
