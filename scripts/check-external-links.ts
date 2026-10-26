/*
 * Asks every web address the repository ships whether it still answers:
 *
 *   pnpm deploy:links                  check them all
 *   pnpm deploy:links --show           also list the ones that answered
 *
 * It reads src/config/site.ts, the typed content in src/content, the docs and notes Markdown, the
 * README and the changelog, skips placeholders and schema addresses, and sends each remaining
 * address one request (HEAD, then GET if the server refuses HEAD). An address that is gone (404,
 * 410), does not resolve, or has a bad certificate fails the run. A refusal (401, 403, 429), a
 * server error, or a timeout is reported as "could not verify", because GitHub and other sites
 * rate-limit or block scripts: open those in a browser. A plain http:// address fails.
 *
 * This needs the network and depends on servers this repository does not control, so it is not part
 * of `pnpm check` or the pull request workflow. Run it before a release, or from the Verify
 * deployment workflow.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

import {
  classifyError,
  classifyStatus,
  extractUrls,
  isCheckable,
  isInsecure,
  withoutFragment,
  type Verdict,
} from './lib/external-links.ts'

const repoRoot = path.resolve(import.meta.dirname, '..')

const { values: options } = parseArgs({
  options: { show: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
})

if (options.help) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('*/')[0])
  process.exit(0)
}

const USER_AGENT = 'HieuUiLab-link-check (+https://github.com/PhanVanHieu-Ptit/HieuUiLab)'
const TIMEOUT_MS = 10_000
const CONCURRENCY = 4

/** Files under `dir` (relative to the repository) whose names satisfy `keep`. */
function walk(dir: string, keep: (file: string) => boolean): string[] {
  return readdirSync(path.join(repoRoot, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(relative, keep)
    return keep(relative) ? [relative] : []
  })
}

const notTest = (file: string) => !/\.test\.tsx?$/.test(file)
const sources = [
  'README.md',
  'CHANGELOG.md',
  'src/config/site.ts',
  'src/lab/maplibre-viewer/map-controller.ts',
  ...walk('src/content', (file) => file.endsWith('.ts') && notTest(file)),
  ...walk('src/docs/content', (file) => file.endsWith('.md')),
  ...walk('src/notes/content', (file) => file.endsWith('.md')),
]

/** Address (without fragment) to the files that mention it. */
const found = new Map<string, Set<string>>()
for (const file of sources) {
  for (const url of extractUrls(readFileSync(path.join(repoRoot, file), 'utf8'))) {
    if (!isCheckable(url)) continue
    const key = withoutFragment(url)
    found.set(key, (found.get(key) ?? new Set()).add(file))
  }
}

interface Outcome {
  url: string
  verdict: Verdict
  detail: string
}

async function ask(url: string): Promise<Outcome> {
  if (isInsecure(url)) return { url, verdict: 'broken', detail: 'plain http:// on an https site' }
  try {
    for (const method of ['HEAD', 'GET']) {
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      await response.body?.cancel()
      // Some servers answer HEAD with an error that GET does not give.
      if (method === 'HEAD' && response.status >= 400) continue
      return { url, verdict: classifyStatus(response.status), detail: String(response.status) }
    }
    throw new Error('unreachable')
  } catch (cause) {
    const { verdict, reason } = classifyError(cause)
    return { url, verdict, detail: reason }
  }
}

const queue = [...found.keys()]
const outcomes: Outcome[] = []
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let url = queue.shift(); url !== undefined; url = queue.shift())
      outcomes.push(await ask(url))
  }),
)
outcomes.sort((a, b) => a.url.localeCompare(b.url))

function section(title: string, verdict: Verdict): number {
  const list = outcomes.filter((outcome) => outcome.verdict === verdict)
  if (list.length === 0 || (verdict === 'ok' && !options.show)) return list.length
  console.log(`${title} (${String(list.length)})`)
  for (const { url, detail } of list) {
    console.log(
      `  ${detail.padEnd(10)} ${url}\n             in ${[...(found.get(url) ?? [])].join(', ')}`,
    )
  }
  console.log()
  return list.length
}

console.log(`deploy:links  ${String(found.size)} addresses from ${String(sources.length)} files\n`)
const broken = section('BROKEN', 'broken')
const unverified = section('Could not verify: open these in a browser', 'unverified')
const good = section('Answered', 'ok')
console.log(
  `${String(good)} answered, ${String(unverified)} could not be verified, ${String(broken)} broken.`,
)
if (broken > 0) process.exit(1)
