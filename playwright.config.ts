import { defineConfig, devices } from '@playwright/test'

// Override with E2E_PORT if the default is taken locally.
const PORT = Number(process.env.E2E_PORT ?? 47317)

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === '' ? undefined : trimmed
}

// Set E2E_BASE_URL to run the tests against a deployment instead of a local build (`pnpm deploy:e2e`,
// /docs/deployment). No server is started then, and the network guard in e2e/fixtures.ts treats that
// URL's origin as the site's own. A protected Vercel preview answers 401 unless the request carries
// the project's automation bypass secret, so it is sent as a header, to that origin only.
const REMOTE_URL = nonEmpty(process.env.E2E_BASE_URL)
if (REMOTE_URL !== undefined && !/^https?:\/\/[^/]+/.test(REMOTE_URL)) {
  throw new Error('E2E_BASE_URL must be an http(s) URL, such as https://example.vercel.app')
}
const BYPASS_SECRET = nonEmpty(process.env.VERCEL_AUTOMATION_BYPASS_SECRET)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // On CI the HTML report is what the workflow uploads when a test fails; 'github' alone writes none.
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: REMOTE_URL ?? `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
    ...(REMOTE_URL !== undefined && BYPASS_SECRET !== undefined
      ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': BYPASS_SECRET } }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(REMOTE_URL === undefined
    ? {
        webServer: {
          command: `pnpm build && pnpm preview --port ${String(PORT)} --strictPort`,
          url: `http://localhost:${String(PORT)}`,
          // Always start our own server; reusing one can silently test another project on the same port.
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }
    : {}),
})
