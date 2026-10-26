/*
 * Checks the production build in dist/ before it is deployed:
 *
 *   pnpm build && pnpm dist:check            check ./dist
 *   pnpm dist:check --dist path/to/dist      check another folder
 *
 * It reads the build settings the way `vite build` does (the environment and the .env files, for the
 * production mode), then applies the rules in scripts/lib/dist-rules.ts: the files the site needs
 * exist, index.html loads only root-absolute files that exist, no source maps are published, no
 * VITE_ setting other than the map settings is in the bundle, and no secret or credential is.
 * Exit status 1 if any rule fails. Warnings and notes do not fail it.
 *
 * What it cannot tell you: that a host serves the files correctly. Run scripts/smoke-deployment.ts
 * (pnpm deploy:smoke) against a URL for that.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { loadEnv } from 'vite'

import { checkDist, formatResults, hasErrors } from './lib/dist-rules.ts'

const repoRoot = path.resolve(import.meta.dirname, '..')

const { values: options } = parseArgs({
  options: { dist: { type: 'string', default: 'dist' }, help: { type: 'boolean', short: 'h' } },
})

if (options.help) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('*/')[0])
  process.exit(0)
}

const TEXT = /\.(?:html|js|mjs|css|json|svg|txt|xml|md|map|webmanifest)$/i

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(full) : [full]
  })
}

const distDir = path.resolve(repoRoot, options.dist)
let paths: string[]
try {
  paths = listFiles(distDir)
} catch {
  console.error(`No build output at ${distDir}. Run pnpm build first.`)
  process.exit(1)
}

const files = new Map(
  paths.map((file) => [
    path.relative(distDir, file).split(path.sep).join('/'),
    TEXT.test(file) ? readFileSync(file, 'utf8') : null,
  ]),
)

const results = checkDist({
  files,
  viteEnv: loadEnv('production', repoRoot, 'VITE_'),
  processEnv: process.env,
})

console.log(
  `dist:check  ${path.relative(repoRoot, distDir) || '.'}  (${String(files.size)} files)\n`,
)
console.log(formatResults(results))

if (hasErrors(results)) {
  console.error('\nThe build output failed the checks above.')
  process.exit(1)
}
console.log('\nThe build output passed.')
