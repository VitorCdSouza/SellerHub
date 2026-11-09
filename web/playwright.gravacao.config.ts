import { defineConfig, devices } from '@playwright/test';
import configuracao from './playwright.config';

export default defineConfig({
  ...configuracao,
  testIgnore: [],
  testMatch: '**/*.gravacao.spec.ts',
  outputDir: 'test-results/gravacao',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/gravacao' }],
    ['json', { outputFile: 'test-results/gravacao/resumo.json' }],
  ],
  projects: [{ name: 'chromium-gravacao', use: { ...devices['Desktop Chrome'] } }],
});
