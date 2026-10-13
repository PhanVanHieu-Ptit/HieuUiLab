import { defineConfig, devices } from '@playwright/test'

// Override with E2E_PORT if the default is taken locally.
const PORT = Number(process.env.E2E_PORT ?? 47317)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm build && pnpm preview --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    // Always start our own server; reusing one can silently test another project on the same port.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
