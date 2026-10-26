/*
 * Checks a deployed site with plain HTTP requests:
 *
 *   pnpm deploy:smoke https://your-deployment.vercel.app
 *   VERCEL_AUTOMATION_BYPASS_SECRET=… pnpm deploy:smoke https://a-protected-preview.vercel.app
 *
 * It asks whether the home page is the app, whether every file index.html loads comes back with the
 * right type, whether nested URLs (a refresh of /docs/installation) get the same index.html, whether
 * a missing script or data file is a 404 rather than index.html, whether the registry JSON is served,
 * and whether the response headers in vercel.json are present. Exit status 1 if any check fails.
 *
 * A protected Vercel preview answers 401 to a request without its automation bypass secret; the
 * secret is sent as a header to the one address you give, and is never printed.
 *
 * What it cannot tell you: that the pages work in a browser. `pnpm deploy:e2e` with E2E_BASE_URL set
 * runs the browser tests against the same address. To try the script without a deployment, serve the
 * build with `pnpm deploy:serve` and give it that address; that is a model of vercel.json, not Vercel.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { formatSmoke, hasFailures, parseExpectedHeaders, runSmoke } from './lib/smoke-checks.ts'

const repoRoot = path.resolve(import.meta.dirname, '..')

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: { url: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
})

if (options.help) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('*/')[0])
  process.exit(0)
}

const address = options.url ?? positionals[0]
if (address === undefined || !/^https?:\/\/[^/\s]+/.test(address)) {
  console.error('Usage: pnpm deploy:smoke <https://address>   (see --help)')
  process.exit(2)
}

const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim()
const bypassSecret = secret === '' ? undefined : secret
const origin = new URL(address).origin

console.log(
  `deploy:smoke  ${origin}${bypassSecret === undefined ? '' : '  (with the bypass secret)'}\n`,
)

const results = await runSmoke({
  baseUrl: origin,
  bypassSecret,
  expectedHeaders: parseExpectedHeaders(readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8')),
})
console.log(formatSmoke(results))

if (hasFailures(results)) {
  console.error('\nThe deployment failed the checks above.')
  process.exit(1)
}
console.log('\nThe deployment passed the HTTP checks. Run pnpm deploy:e2e for the browser checks.')
