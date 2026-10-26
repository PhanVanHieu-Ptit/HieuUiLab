/*
 * Serves the build folder the way vercel.json asks a host to, to try the deployment checks locally:
 *
 *   pnpm build && pnpm deploy:serve                  http://127.0.0.1:4173, vercel.json applied
 *   pnpm deploy:serve --mode catch-all --port 5000   every unknown URL gets index.html (the mistake)
 *   pnpm deploy:serve --mode none                    no fallback at all
 *
 * then, in another terminal, `pnpm deploy:smoke http://127.0.0.1:4173` or
 * `E2E_BASE_URL=http://127.0.0.1:4173 pnpm deploy:e2e`.
 *
 * This is a model of the configuration (see scripts/lib/static-server.ts), not of a host.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { readVercelJson, serveDirectory, type FallbackMode } from './lib/static-server.ts'

const repoRoot = path.resolve(import.meta.dirname, '..')

const { values: options } = parseArgs({
  options: {
    dist: { type: 'string', default: 'dist' },
    port: { type: 'string', default: '4173' },
    mode: { type: 'string', default: 'vercel' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (options.help) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('*/')[0])
  process.exit(0)
}

const modes: readonly string[] = ['vercel', 'catch-all', 'none']
if (!modes.includes(options.mode)) {
  console.error(`--mode must be one of: ${modes.join(', ')}`)
  process.exit(2)
}

const server = await serveDirectory(
  path.resolve(repoRoot, options.dist),
  options.mode as FallbackMode,
  readVercelJson(repoRoot),
  Number(options.port),
)
console.log(`Serving ${options.dist}/ at ${server.url} (mode: ${options.mode}). Ctrl+C to stop.`)

process.on('SIGINT', () => {
  void server.close().then(() => process.exit(0))
})
