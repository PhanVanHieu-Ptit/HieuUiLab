/*
 * Measures a production build in a real Chromium: what a first visit downloads, how it paints, and what
 * the WebGL pages leave behind when the visitor goes away. It reports numbers with their spread and says
 * nothing about a device it did not run on.
 *
 *   pnpm build && pnpm perf:measure                  measure ./dist
 *   pnpm perf:measure --dist before=/tmp/dist-a --dist after=dist
 *                                                    A/B: runs are interleaved, so drift hits both
 *   pnpm perf:measure --only size                    one mode: size, routes, lifecycle, interaction
 *   pnpm perf:measure --profile desktop --runs 3     fewer, faster runs while developing
 *
 * The build is served by a small in-process static server (not `vite preview`), with a single-page
 * fallback and, by default, gzip on text responses, because that is what a typical host does. The same
 * server answers every dist, so a difference between two is the build, not the server. Results go to
 * stdout and to `perf-results/` (not committed).
 *
 * What it cannot tell you: how a real phone behaves (CPU and network are emulated through the DevTools
 * protocol), how a real network behaves, what visitors experience (no field data), or anything about
 * the GPU (WebGL runs on whatever headless Chromium gets on this machine; the renderer is recorded).
 * Timings vary from run to run, so a difference is
 * called one only when the ranges of the two builds do not overlap; byte counts do not vary.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib'

import { chromium, type Browser, type CDPSession, type Page } from '@playwright/test'

const repoRoot = path.resolve(import.meta.dirname, '..')

// --- options ---------------------------------------------------------------------------------

const { values: options } = parseArgs({
  options: {
    dist: { type: 'string', multiple: true },
    runs: { type: 'string', default: '7' },
    profile: { type: 'string', default: 'all' },
    only: { type: 'string', default: 'size,routes,lifecycle,interaction' },
    routes: { type: 'string' },
    compress: { type: 'string', default: 'gzip' },
    out: { type: 'string' },
    note: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (options.help) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('*/')[0])
  process.exit(0)
}

interface Build {
  label: string
  dir: string
}

function parseBuilds(specs: readonly string[]): Build[] {
  return specs.map((spec) => {
    const at = spec.indexOf('=')
    const label = at === -1 ? 'current' : spec.slice(0, at)
    const dir = path.resolve(at === -1 ? spec : spec.slice(at + 1))
    if (!existsSync(path.join(dir, 'index.html'))) throw new Error(`${dir} has no index.html`)
    return { label, dir }
  })
}

const builds = parseBuilds(options.dist?.length ? options.dist : ['dist'])
if (new Set(builds.map((build) => build.label)).size !== builds.length) {
  throw new Error('--dist labels must be different')
}
const runs = Math.max(1, Number.parseInt(options.runs, 10) || 1)
const modes = new Set(options.only.split(',').map((mode) => mode.trim()))
const compress = options.compress === 'none' ? 'none' : 'gzip'

// --- profiles and routes ---------------------------------------------------------------------

interface Profile {
  name: string
  description: string
  viewport: { width: number; height: number }
  deviceScaleFactor: number
  isMobile: boolean
  /** 1 is no throttling; 4 makes the CPU 4 times slower. */
  cpuRate: number
  /** Bytes per second and milliseconds; null for the machine's own network. */
  network: { latency: number; down: number; up: number } | null
}

const PROFILES: readonly Profile[] = [
  {
    name: 'desktop',
    description: '1280x800 at DPR 1, no throttling',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    isMobile: false,
    cpuRate: 1,
    network: null,
  },
  {
    name: 'mobile-emulated',
    description:
      '390x844 at DPR 3 with touch, CPU 4x slower, 1.6 Mbit/s down, 750 Kbit/s up, 150 ms RTT',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    cpuRate: 4,
    network: { latency: 150, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8 },
  },
]

const profiles =
  options.profile === 'all'
    ? PROFILES
    : PROFILES.filter((profile) => profile.name === options.profile)
if (profiles.length === 0) throw new Error(`unknown --profile ${options.profile}`)

const ROUTES: readonly string[] = options.routes?.split(',') ?? [
  '/',
  '/components',
  '/components/button',
  '/blocks/orders-dashboard',
  '/docs',
  '/docs/data-table',
  '/notes/theme-without-flash',
  '/playground',
  '/about',
  '/labs/maps/maplibre-viewer',
  '/labs/3d/three-scene',
]

// --- statistics ------------------------------------------------------------------------------

interface Summary {
  median: number
  min: number
  max: number
  n: number
}

function summarize(values: readonly (number | null)[]): Summary | null {
  const sorted = values.filter((value): value is number => value !== null && Number.isFinite(value))
  sorted.sort((a, b) => a - b)
  if (sorted.length === 0) return null
  const middle = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 1
      ? (sorted[middle] ?? 0)
      : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
  return { median, min: sorted[0] ?? 0, max: sorted.at(-1) ?? 0, n: sorted.length }
}

/** 'separate' when the two builds' ranges do not overlap; anything else is within the spread. */
function compareRanges(before: Summary | null, after: Summary | null): string {
  if (!before || !after) return 'n/a'
  if (after.max < before.min) return 'lower'
  if (after.min > before.max) return 'higher'
  return 'within spread'
}

// --- the static server -----------------------------------------------------------------------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg'])

interface Served {
  type: string
  body: Buffer
  gzip?: Buffer
}

function listFiles(root: string, dir = root): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(root, full) : [path.relative(root, full)]
  })
}

/** Serves one dist: files by path, anything else without an extension as index.html. */
function serve(dir: string): Promise<{ origin: string; close: () => void }> {
  const files = new Map<string, Served>()
  for (const file of listFiles(dir)) {
    const extension = path.extname(file)
    const body = readFileSync(path.join(dir, file))
    const served: Served = { type: MIME[extension] ?? 'application/octet-stream', body }
    // Compressed once, here, so the work is not part of any measured request.
    if (compress === 'gzip' && COMPRESSIBLE.has(extension))
      served.gzip = gzipSync(body, { level: 6 })
    files.set(`/${file.split(path.sep).join('/')}`, served)
  }
  const index = files.get('/index.html')
  if (!index) throw new Error(`${dir} has no index.html`)

  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    let served = files.get(pathname)
    if (!served && !path.extname(pathname)) served = index
    if (!served) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
      return
    }
    const gzip = served.gzip && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '')
    const body = gzip && served.gzip ? served.gzip : served.body
    response.writeHead(200, {
      'content-type': served.type,
      'content-length': body.length,
      'cache-control': 'no-cache',
      vary: 'accept-encoding',
      ...(gzip ? { 'content-encoding': 'gzip' } : {}),
    })
    response.end(body)
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('no address'))
        return
      }
      resolve({
        origin: `http://127.0.0.1:${String(address.port)}`,
        close: () => {
          server.close()
          server.closeAllConnections()
        },
      })
    })
  })
}

// --- build size ------------------------------------------------------------------------------

interface FileSize {
  file: string
  raw: number
  gzip: number
  brotli: number
}

function sizeOf(dir: string, file: string): FileSize {
  const body = readFileSync(path.join(dir, file))
  if (!COMPRESSIBLE.has(path.extname(file))) {
    return { file, raw: body.length, gzip: body.length, brotli: body.length }
  }
  return {
    file,
    raw: body.length,
    gzip: gzipSync(body, { level: 9 }).length,
    brotli: brotliCompressSync(body, {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  }
}

const sumSizes = (sizes: readonly FileSize[]) => ({
  count: sizes.length,
  raw: sizes.reduce((total, size) => total + size.raw, 0),
  gzip: sizes.reduce((total, size) => total + size.gzip, 0),
  brotli: sizes.reduce((total, size) => total + size.brotli, 0),
})

// Minified output: `import{a as b}from"./x.js"`, `import"./x.js"`, `export{a}from"./x.js"`. A dynamic
// `import("./x.js")` has a parenthesis right after the keyword, so it does not match.
const STATIC_IMPORT = /\b(?:import|export)\s*(?:[^"'()`;]*?\bfrom\s*)?["'](\.{1,2}\/[^"']+)["']/g

interface SizeReport {
  label: string
  chunks: FileSize[]
  totals: {
    js: ReturnType<typeof sumSizes>
    css: ReturnType<typeof sumSizes>
    fonts: ReturnType<typeof sumSizes>
  }
  entry: {
    script: string
    /** The entry script and every chunk it reaches through static imports. */
    closure: FileSize[]
    closureTotals: ReturnType<typeof sumSizes>
    modulepreload: string[]
    stylesheets: FileSize[]
    /** Files in one list and not the other; should be empty. */
    closureMismatch: string[]
  }
}

function measureSize(build: Build): SizeReport {
  const files = listFiles(build.dir).filter((file) => file.startsWith('assets/'))
  const chunks = files.map((file) => sizeOf(build.dir, file))
  const html = readFileSync(path.join(build.dir, 'index.html'), 'utf8')
  const hrefs = (pattern: RegExp) =>
    [...html.matchAll(pattern)].map((match) => (match[1] ?? '').replace(/^\//, ''))
  const script = hrefs(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)[0] ?? ''
  const modulepreload = hrefs(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)
  const stylesheets = hrefs(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)

  const seen = new Set<string>()
  const queue = [script]
  while (queue.length > 0) {
    const file = queue.shift() ?? ''
    if (seen.has(file) || !existsSync(path.join(build.dir, file))) continue
    seen.add(file)
    const text = readFileSync(path.join(build.dir, file), 'utf8')
    for (const match of text.matchAll(STATIC_IMPORT)) {
      const target = path.posix.join(path.posix.dirname(file), match[1] ?? '')
      if (target.endsWith('.js') && existsSync(path.join(build.dir, target))) queue.push(target)
    }
  }
  const closure = [...seen].map((file) => sizeOf(build.dir, file))
  const preloaded = new Set([script, ...modulepreload])
  const closureMismatch = [
    ...[...seen]
      .filter((file) => !preloaded.has(file))
      .map((file) => `${file} (imported, not preloaded)`),
    ...[...preloaded]
      .filter((file) => !seen.has(file))
      .map((file) => `${file} (preloaded, not imported)`),
  ]
  const kind = (extension: string) =>
    chunks.filter((chunk) => path.extname(chunk.file) === extension)
  return {
    label: build.label,
    chunks,
    totals: {
      js: sumSizes(kind('.js')),
      css: sumSizes(kind('.css')),
      fonts: sumSizes(kind('.woff2')),
    },
    entry: {
      script,
      closure,
      closureTotals: sumSizes(closure),
      modulepreload,
      stylesheets: stylesheets.map((file) => sizeOf(build.dir, file)),
      closureMismatch,
    },
  }
}

const chunkName = (file: string) => file.replace(/^assets\//, '').replace(/-[\w-]{8}(\.\w+)$/, '$1')
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`

function printSize(reports: readonly SizeReport[]) {
  console.log('\n== Build size (raw / gzip level 9 / brotli level 11) ==')
  for (const report of reports) {
    const { js, css, fonts } = report.totals
    console.log(`\n[${report.label}] ${String(report.chunks.length)} files in assets/`)
    console.log(
      `  all JS    ${String(js.count)} files  ${kb(js.raw)} / ${kb(js.gzip)} / ${kb(js.brotli)}`,
    )
    console.log(
      `  all CSS   ${String(css.count)} files  ${kb(css.raw)} / ${kb(css.gzip)} / ${kb(css.brotli)}`,
    )
    console.log(`  fonts     ${String(fonts.count)} files  ${kb(fonts.raw)}`)
    const closure = report.entry.closureTotals
    console.log(
      `  entry JS closure  ${String(closure.count)} files  ${kb(closure.raw)} / ${kb(closure.gzip)} / ${kb(closure.brotli)}`,
    )
    const styles = sumSizes(report.entry.stylesheets)
    console.log(
      `  entry CSS         ${String(styles.count)} files  ${kb(styles.raw)} / ${kb(styles.gzip)} / ${kb(styles.brotli)}`,
    )
    if (report.entry.closureMismatch.length > 0) {
      console.log(
        `  WARNING: static imports and modulepreload differ: ${report.entry.closureMismatch.join(', ')}`,
      )
    }
    console.log('  largest in the entry closure:')
    for (const size of [...report.entry.closure].sort((a, b) => b.raw - a.raw).slice(0, 8)) {
      console.log(
        `    ${chunkName(size.file).padEnd(36)} ${kb(size.raw).padStart(10)} ${kb(size.gzip).padStart(10)}`,
      )
    }
    console.log('  largest overall:')
    for (const size of [...report.chunks].sort((a, b) => b.raw - a.raw).slice(0, 6)) {
      console.log(
        `    ${chunkName(size.file).padEnd(36)} ${kb(size.raw).padStart(10)} ${kb(size.gzip).padStart(10)}`,
      )
    }
  }
}

// --- page load measurement -------------------------------------------------------------------

/** Runs in the page before any of its scripts, once per document. */
function installObservers() {
  interface Perf {
    fcp: number | null
    lcp: number | null
    cls: number
    shifts: { value: number; at: number; nodes: string[] }[]
    longTasks: number[]
    events: { name: string; duration: number }[]
  }
  const perf: Perf = { fcp: null, lcp: null, cls: 0, shifts: [], longTasks: [], events: [] }
  Object.defineProperty(window, '__perf', { value: perf })
  const watch = (type: string, onEntries: (entries: PerformanceEntry[]) => void, extra = {}) => {
    try {
      new PerformanceObserver((list) => {
        onEntries(list.getEntries())
      }).observe({ type, buffered: true, ...extra })
    } catch {
      // The browser does not report this entry type.
    }
  }
  watch('paint', (entries) => {
    for (const entry of entries)
      if (entry.name === 'first-contentful-paint') perf.fcp = entry.startTime
  })
  watch('largest-contentful-paint', (entries) => {
    const last = entries.at(-1)
    if (last) perf.lcp = last.startTime
  })
  watch('layout-shift', (entries) => {
    for (const entry of entries as unknown as {
      hadRecentInput: boolean
      value: number
      startTime: number
      sources: { node: Element | null }[]
    }[]) {
      if (entry.hadRecentInput) continue
      perf.cls += entry.value
      // Which elements moved, as a tag with its first classes: enough to find it in the source.
      const nodes = entry.sources.map(({ node }) =>
        node
          ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${(
              node.getAttribute('class') ?? ''
            )
              .split(/\s+/)
              .slice(0, 3)
              .join('.')}`
          : 'removed',
      )
      perf.shifts.push({ value: entry.value, at: entry.startTime, nodes })
    }
  })
  watch('longtask', (entries) => {
    for (const entry of entries) perf.longTasks.push(entry.duration)
  })
  watch(
    'event',
    (entries) => {
      for (const entry of entries) perf.events.push({ name: entry.name, duration: entry.duration })
    },
    { durationThreshold: 16 },
  )
}

interface PagePerf {
  fcp: number | null
  lcp: number | null
  cls: number
  shifts: { value: number; at: number; nodes: string[] }[]
  longTasks: number[]
  events: { name: string; duration: number }[]
}

async function applyProfile(cdp: CDPSession, profile: Profile) {
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  if (profile.network) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: profile.network.latency,
      downloadThroughput: profile.network.down,
      uploadThroughput: profile.network.up,
    })
  }
  if (profile.cpuRate !== 1)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate })
  await cdp.send('Performance.enable')
}

async function cdpMetrics(cdp: CDPSession): Promise<Record<string, number>> {
  const { metrics } = await cdp.send('Performance.getMetrics')
  return Object.fromEntries(metrics.map((metric) => [metric.name, metric.value]))
}

/** Encoded bytes of every request that finished, by the DevTools resource type. */
function trackNetwork(cdp: CDPSession) {
  const started = new Map<string, { type: string; url: string }>()
  const finished: { type: string; url: string; bytes: number }[] = []
  cdp.on('Network.requestWillBeSent', (event) => {
    started.set(event.requestId, { type: event.type ?? 'Other', url: event.request.url })
  })
  cdp.on('Network.loadingFinished', (event) => {
    const request = started.get(event.requestId)
    if (request && !request.url.startsWith('data:')) {
      finished.push({ ...request, bytes: event.encodedDataLength })
    }
  })
  return finished
}

type Metric =
  | 'requests'
  | 'transferBytes'
  | 'scriptBytes'
  | 'scriptRequests'
  | 'styleBytes'
  | 'fontBytes'
  | 'fcp'
  | 'lcp'
  | 'cls'
  | 'longTaskBlocking'
  | 'longTaskCount'
  | 'scriptMs'
  | 'taskMs'
  | 'layoutMs'
  | 'styleMs'
  | 'nodes'
  | 'jsHeapKB'
  | 'loadEventMs'
type LoadResult = Record<Metric, number | null> & {
  /** The largest layout shifts, with the elements that moved. */
  shifts: { value: number; at: number; nodes: string[] }[]
}

async function measureLoad(
  browser: Browser,
  origin: string,
  route: string,
  profile: Profile,
): Promise<LoadResult> {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.isMobile,
    serviceWorkers: 'block',
  })
  try {
    await context.addInitScript(installObservers)
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    const network = trackNetwork(cdp)
    await applyProfile(cdp, profile)

    await page.goto(`${origin}${route}`, { waitUntil: 'load', timeout: 120_000 })
    await page.waitForLoadState('networkidle', { timeout: 120_000 })
    // Largest paint and layout shifts can still arrive just after the network goes quiet.
    await page.waitForTimeout(750)

    const perf = await page.evaluate(() => (window as unknown as { __perf: PagePerf }).__perf)
    const navigation = await page.evaluate(() => {
      const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      return entry ? { load: entry.loadEventEnd } : { load: null }
    })
    const metrics = await cdpMetrics(cdp)
    const heapBytes = metrics.JSHeapUsedSize
    const bytesOf = (type: string) =>
      network
        .filter((request) => request.type === type)
        .reduce((total, request) => total + request.bytes, 0)
    const ms = (name: string) => (metrics[name] === undefined ? null : (metrics[name] ?? 0) * 1000)
    return {
      requests: network.length,
      transferBytes: network.reduce((total, request) => total + request.bytes, 0),
      scriptBytes: bytesOf('Script'),
      scriptRequests: network.filter((request) => request.type === 'Script').length,
      styleBytes: bytesOf('Stylesheet'),
      fontBytes: bytesOf('Font'),
      fcp: perf.fcp,
      lcp: perf.lcp,
      cls: perf.cls,
      shifts: [...perf.shifts].sort((a, b) => b.value - a.value).slice(0, 4),
      longTaskBlocking: perf.longTasks.reduce(
        (total, duration) => total + Math.max(0, duration - 50),
        0,
      ),
      longTaskCount: perf.longTasks.length,
      scriptMs: ms('ScriptDuration'),
      taskMs: ms('TaskDuration'),
      layoutMs: ms('LayoutDuration'),
      styleMs: ms('RecalcStyleDuration'),
      nodes: metrics.Nodes ?? null,
      jsHeapKB: heapBytes === undefined ? null : heapBytes / 1024,
      loadEventMs: navigation.load,
    }
  } finally {
    await context.close()
  }
}

type RouteRuns = Record<string, Record<string, Record<string, LoadResult[]>>> // profile > route > label > runs

async function measureRoutes(browser: Browser, servers: Map<string, string>): Promise<RouteRuns> {
  const results: RouteRuns = {}
  for (const profile of profiles) {
    console.log(
      `\n-- ${profile.name}: ${String(runs)} runs x ${String(ROUTES.length)} routes x ${String(builds.length)} builds`,
    )
    const byRoute: Record<string, Record<string, LoadResult[]>> = {}
    results[profile.name] = byRoute
    // Runs are the outer loop and builds the inner one, so a slow minute costs every build alike.
    for (let run = 1; run <= runs; run += 1) {
      for (const route of ROUTES) {
        for (const build of builds) {
          const origin = servers.get(build.label) ?? ''
          const result = await measureLoad(browser, origin, route, profile)
          const forRoute = (byRoute[route] ??= {})
          const forBuild = (forRoute[build.label] ??= [])
          forBuild.push(result)
        }
      }
      process.stdout.write(`   run ${String(run)}/${String(runs)} done\n`)
    }
  }
  return results
}

const cell = (summary: Summary | null, digits = 0, scale = 1) =>
  summary
    ? `${(summary.median / scale).toFixed(digits)} (${(summary.min / scale).toFixed(digits)}-${(summary.max / scale).toFixed(digits)})`
    : 'n/a'

function printRoutes(results: RouteRuns) {
  const columns: { metric: Metric; title: string; digits: number; scale: number }[] = [
    { metric: 'transferBytes', title: 'transfer KB', digits: 0, scale: 1024 },
    { metric: 'scriptBytes', title: 'script KB', digits: 0, scale: 1024 },
    { metric: 'requests', title: 'requests', digits: 0, scale: 1 },
    { metric: 'fcp', title: 'FCP ms', digits: 0, scale: 1 },
    { metric: 'lcp', title: 'LCP ms', digits: 0, scale: 1 },
    { metric: 'cls', title: 'CLS', digits: 3, scale: 1 },
    { metric: 'longTaskBlocking', title: 'long-task over 50ms', digits: 0, scale: 1 },
    { metric: 'scriptMs', title: 'script ms', digits: 0, scale: 1 },
  ]
  for (const profile of profiles) {
    console.log(
      `\n== Page loads, ${profile.name} (${profile.description}); median (min-max) of ${String(runs)} runs ==`,
    )
    const byRoute = results[profile.name] ?? {}
    for (const route of ROUTES) {
      console.log(`\n${route}`)
      const header = ['build', ...columns.map((column) => column.title)]
      console.log('  ' + header.map((text, index) => text.padEnd(index === 0 ? 10 : 22)).join(''))
      for (const build of builds) {
        const runsOf = byRoute[route]?.[build.label] ?? []
        const row = columns.map((column) =>
          cell(summarize(runsOf.map((run) => run[column.metric])), column.digits, column.scale),
        )
        console.log(
          '  ' +
            [build.label, ...row].map((text, index) => text.padEnd(index === 0 ? 10 : 22)).join(''),
        )
      }
      const [first, ...others] = builds
      if (first) {
        for (const other of others) {
          const verdicts = columns.map((column) => {
            const a = summarize(
              (byRoute[route]?.[first.label] ?? []).map((run) => run[column.metric]),
            )
            const b = summarize(
              (byRoute[route]?.[other.label] ?? []).map((run) => run[column.metric]),
            )
            return compareRanges(a, b)
          })
          console.log(
            '  ' +
              [`${other.label} vs ${first.label}`, ...verdicts]
                .map((text, index) => text.padEnd(index === 0 ? 10 : 22))
                .join(''),
          )
        }
      }
    }
  }
}

// --- WebGL lifecycle -------------------------------------------------------------------------

/** Counts animation frames and keeps weak references to every WebGL context the page creates. */
function installGlSpy() {
  interface Spy {
    frames: number
    contexts: WeakRef<WebGLRenderingContext | WebGL2RenderingContext>[]
    renderer: string | null
  }
  const spy: Spy = { frames: 0, contexts: [], renderer: null }
  Object.defineProperty(window, '__spy', { value: spy })
  const request = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (callback) => {
    spy.frames += 1
    return request(callback)
  }
  // Called through Reflect.apply with the canvas as `this`, so the method is never unbound.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const original = HTMLCanvasElement.prototype.getContext
  const seen = new WeakSet<object>()
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: unknown[]) {
    const context = Reflect.apply(original, this, args) as unknown
    const type = args[0]
    if ((type === 'webgl2' || type === 'webgl') && context && !seen.has(context)) {
      seen.add(context)
      const gl = context as WebGLRenderingContext
      spy.contexts.push(new WeakRef(gl))
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      if (info && spy.renderer === null)
        spy.renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
    }
    return context
  } as typeof original
}

interface GlCounts {
  frames: number
  created: number
  /** Created, not lost, and still referenced by the page's own objects (no GC forced). */
  notLost: number
  renderer: string | null
}

const glCounts = (page: Page): Promise<GlCounts> =>
  page.evaluate(() => {
    const spy = (
      window as unknown as {
        __spy: {
          frames: number
          contexts: WeakRef<WebGLRenderingContext>[]
          renderer: string | null
        }
      }
    ).__spy
    let notLost = 0
    for (const ref of spy.contexts) {
      const gl = ref.deref()
      if (gl && !gl.isContextLost()) notLost += 1
    }
    return { frames: spy.frames, created: spy.contexts.length, notLost, renderer: spy.renderer }
  })

async function heapKB(cdp: CDPSession): Promise<number> {
  await cdp.send('HeapProfiler.collectGarbage')
  return ((await cdpMetrics(cdp)).JSHeapUsedSize ?? 0) / 1024
}

async function framesOver(page: Page, milliseconds: number): Promise<number> {
  const before = (await glCounts(page)).frames
  await page.waitForTimeout(milliseconds)
  return (await glCounts(page)).frames - before
}

interface LifecycleResult {
  route: string
  unavailable?: true
  renderer?: string | null
  /** Animation frames the page requested during a quiet window with nobody touching it. */
  idleFrames?: number
  idleWindowMs?: number
  cycles?: number
  contextsCreated?: number
  /** Not lost and still referenced right after leaving, before any garbage collection. */
  notLostAfterLeaving?: number
  /** Not lost and still referenced after forcing a garbage collection while away. */
  notLostAfterGc?: number
  workersStarted?: number
  /** JS heap after a forced GC: when the page had loaded, after the first return, after the last. */
  heapKBBefore?: number
  heapKBAfterFirstReturn?: number
  heapKBAfter?: number
  note?: string
  /** Set when the probe itself failed; the others still ran. */
  error?: string
}

async function lifecycleProbe(
  browser: Browser,
  origin: string,
  route: string,
  options: {
    reducedMotion?: boolean
    prepare: (page: Page) => Promise<boolean>
    settle: (page: Page) => Promise<void>
    prepared?: (page: Page) => Promise<void>
  },
): Promise<LifecycleResult> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: 'block',
    ...(options.reducedMotion ? { reducedMotion: 'reduce' as const } : {}),
  })
  try {
    await context.addInitScript(installGlSpy)
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Performance.enable')
    let workers = 0
    page.on('worker', () => {
      workers += 1
    })
    await page.goto(`${origin}${route}`)
    if (!(await options.prepare(page))) return { route, unavailable: true }
    await options.settle(page)
    await options.prepared?.(page)

    const idleWindowMs = 3000
    const idleFrames = await framesOver(page, idleWindowMs)
    const renderer = (await glCounts(page)).renderer
    const heapKBBefore = await heapKB(cdp)

    const cycles = 5
    let heapKBAfterFirstReturn = 0
    for (let cycle = 0; cycle < cycles; cycle += 1) {
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: 'Labs', exact: true })
        .click()
      await page.waitForURL(/\/labs$/)
      await page.goBack()
      if (!(await options.prepare(page))) return { route, unavailable: true }
      await options.settle(page)
      // The first visit loads the page's code; later ones show what a visit leaves behind.
      if (cycle === 0) heapKBAfterFirstReturn = await heapKB(cdp)
    }
    // Leave for good, then look.
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Labs', exact: true })
      .click()
    await page.waitForURL(/\/labs$/)
    await page.waitForTimeout(500)
    const afterLeaving = await glCounts(page)
    await cdp.send('HeapProfiler.collectGarbage')
    await page.waitForTimeout(250)
    const afterGc = await glCounts(page)
    const heapKBAfter = await heapKB(cdp)
    return {
      route,
      renderer,
      idleFrames,
      idleWindowMs,
      cycles,
      contextsCreated: afterGc.created,
      notLostAfterLeaving: afterLeaving.notLost,
      notLostAfterGc: afterGc.notLost,
      workersStarted: workers,
      heapKBBefore,
      heapKBAfterFirstReturn,
      heapKBAfter,
    }
  } finally {
    await context.close()
  }
}

const mapProbe = {
  prepare: async (page: Page) => {
    const canvas = page.locator('canvas.maplibregl-canvas')
    const unavailable = page.getByRole('heading', { name: 'Interactive map unavailable' })
    await canvas.or(unavailable).waitFor({ timeout: 30_000 })
    return (await unavailable.count()) === 0
  },
  settle: async (page: Page) => {
    // "Status: Ready" is one text node per layer, so the match is a substring; wait for all three.
    await page.getByText('Ready').nth(2).waitFor({ timeout: 30_000 })
    await page.waitForTimeout(1500)
  },
}

/** Waits until the page has stopped asking for animation frames. */
async function framesStop(page: Page) {
  let last = -1
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const now = (await glCounts(page)).frames
    if (now === last) return
    last = now
    await page.waitForTimeout(300)
  }
}

const threeProbe = {
  prepare: async (page: Page) => {
    const canvas = page.locator('canvas[role="img"]')
    const unavailable = page.getByRole('heading', { name: '3D scene unavailable' })
    await canvas.or(unavailable).waitFor({ timeout: 30_000 })
    return (await unavailable.count()) === 0
  },
  settle: framesStop,
}

const cubeProbe = {
  prepare: async (page: Page) => {
    const control = page.getByRole('button', { name: /(Play|Pause) rotation/ })
    const unavailable = page.getByRole('heading', { name: 'WebGL is unavailable' })
    await control.or(unavailable).waitFor({ timeout: 30_000 })
    return (await unavailable.count()) === 0
  },
  settle: async (page: Page) => {
    await page.waitForTimeout(500)
  },
}

/** A probe that fails records why and lets the others run, so one broken page loses one row. */
async function safely(
  route: string,
  probe: () => Promise<LifecycleResult>,
): Promise<LifecycleResult> {
  try {
    return await probe()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { route, error: message.split('\n')[0] ?? message }
  }
}

async function measureLifecycle(browser: Browser, servers: Map<string, string>) {
  const results: Record<string, Record<string, LifecycleResult>> = {}
  console.log('\n== WebGL lifecycle (desktop profile, no throttling) ==')
  for (const build of builds) {
    const origin = servers.get(build.label) ?? ''
    const mine: Record<string, LifecycleResult> = {}
    results[build.label] = mine
    const MAP = '/labs/maps/maplibre-viewer'
    const THREE = '/labs/3d/three-scene'
    const CUBE = '/labs/3d/webgl-scene'
    mine.map = await safely(MAP, () => lifecycleProbe(browser, origin, MAP, mapProbe))
    mine.three = await safely(THREE, () => lifecycleProbe(browser, origin, THREE, threeProbe))
    mine.cube = await safely(CUBE, () => lifecycleProbe(browser, origin, CUBE, cubeProbe))
    // The cube animates by design while it is visible; paused, and under reduced motion, it must not.
    mine['cube-paused'] = await safely(CUBE, () =>
      lifecycleProbe(browser, origin, CUBE, {
        ...cubeProbe,
        prepared: async (page) => {
          const pause = page.getByRole('button', { name: 'Pause rotation' })
          if (await pause.count()) await pause.click()
          await page.waitForTimeout(300)
        },
      }),
    )
    mine['cube-reduced-motion'] = await safely(CUBE, () =>
      lifecycleProbe(browser, origin, CUBE, { ...cubeProbe, reducedMotion: true }),
    )
    console.log(`\n[${build.label}]`)
    for (const [name, result] of Object.entries(mine)) {
      if (result.error) {
        console.log(`  ${name.padEnd(20)} probe failed: ${result.error}`)
        continue
      }
      if (result.unavailable) {
        console.log(`  ${name.padEnd(20)} WebGL unavailable here; not measured`)
        continue
      }
      console.log(
        `  ${name.padEnd(20)} idle frames in ${String(result.idleWindowMs)} ms: ${String(result.idleFrames)}` +
          `  | after ${String(result.cycles)} leave/return cycles: created ${String(result.contextsCreated)}, not lost after leaving ${String(result.notLostAfterLeaving)}, after GC ${String(result.notLostAfterGc)}` +
          `  | workers ${String(result.workersStarted)}  | heap KB after GC: loaded ${String(Math.round(result.heapKBBefore ?? 0))}, first return ${String(Math.round(result.heapKBAfterFirstReturn ?? 0))}, last ${String(Math.round(result.heapKBAfter ?? 0))}`,
      )
    }
    const renderer = Object.values(mine).find((result) => result.renderer)?.renderer
    console.log(`  WebGL renderer reported by the browser: ${renderer ?? 'unknown'}`)
  }
  return results
}

// --- interaction -----------------------------------------------------------------------------

interface TypingTrials {
  /** What was typed, in words. */
  scenario: 'in order' | 'mid-string'
  /** Pause between key presses; 0 is as fast as the driver can send them. */
  keyDelayMs: number
  trials: number
  /** Trials where the field or the URL did not end up as the text that should have been typed. */
  failures: number
  /** What the field held when a trial ended wrong; for diagnosis. */
  examples: string[]
  /** Key, input and keypress events of these trials that took 50 ms or more, and the longest. */
  slowEvents: number
  worstEventMs: number
}

interface InteractionResult {
  cpuRate: number
  typing: TypingTrials[]
  /** Key, input and keypress events that took 50 ms or more to handle, over the whole session. */
  slowEvents: number
  worstEventMs: number
}

/** The URL's `q` once it has stopped changing; typing commits it through a router transition. */
async function settledQuery(page: Page): Promise<string | null> {
  const read = () => new URL(page.url()).searchParams.get('q')
  let last = read()
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await page.waitForTimeout(250)
    const now = read()
    if (now === last) return now
    last = now
  }
  return last
}

async function interactionProbe(
  browser: Browser,
  origin: string,
  cpuRate: number,
): Promise<InteractionResult> {
  const profile = PROFILES.find((candidate) => candidate.name === 'mobile-emulated') ?? PROFILES[0]
  if (!profile) throw new Error('no profile')
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.isMobile,
    serviceWorkers: 'block',
  })
  try {
    await context.addInitScript(installObservers)
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await applyProfile(cdp, { ...profile, cpuRate })
    await page.goto(`${origin}/components`, { waitUntil: 'load' })
    await page.waitForLoadState('networkidle')
    const input = page.getByRole('searchbox')
    await input.waitFor()

    const clear = async () => {
      await input.fill('')
      await settledQuery(page)
      await input.focus()
    }
    const pause = (delay: number) => (delay > 0 ? page.waitForTimeout(delay) : Promise.resolve())

    // "In order" types the word. "Mid-string" types a letter short, moves the caret back two places,
    // and adds the missing letter: a controlled field whose value arrives late can lose either.
    const trialsEach = 5
    const typing: TypingTrials[] = []
    for (const scenario of ['in order', 'mid-string'] as const) {
      for (const keyDelayMs of [150, 60, 0]) {
        const examples: string[] = []
        let failures = 0
        await page.evaluate(() => {
          ;(window as unknown as { __perf: PagePerf }).__perf.events.length = 0
        })
        for (let trial = 0; trial < trialsEach; trial += 1) {
          await clear()
          if (scenario === 'in order') {
            await page.keyboard.type('button', { delay: keyDelayMs })
          } else {
            await page.keyboard.type('buton', { delay: keyDelayMs })
            await pause(keyDelayMs)
            await page.keyboard.press('ArrowLeft')
            await pause(keyDelayMs)
            await page.keyboard.press('ArrowLeft')
            await pause(keyDelayMs)
            await page.keyboard.type('t', { delay: keyDelayMs })
          }
          const query = await settledQuery(page)
          const value = await input.inputValue()
          if (value !== 'button' || query !== 'button') {
            failures += 1
            if (examples.length < 3) examples.push(`field "${value}", url q=${String(query)}`)
          }
        }
        const events = (
          await page.evaluate(() => (window as unknown as { __perf: PagePerf }).__perf)
        ).events.filter((event) => ['keydown', 'keyup', 'input', 'keypress'].includes(event.name))
        typing.push({
          scenario,
          keyDelayMs,
          trials: trialsEach,
          failures,
          examples,
          slowEvents: events.filter((event) => event.duration >= 50).length,
          worstEventMs: Math.max(0, ...events.map((event) => event.duration)),
        })
      }
    }
    return {
      cpuRate,
      typing,
      slowEvents: typing.reduce((total, row) => total + row.slowEvents, 0),
      worstEventMs: Math.max(0, ...typing.map((row) => row.worstEventMs)),
    }
  } finally {
    await context.close()
  }
}

async function measureInteraction(browser: Browser, servers: Map<string, string>) {
  const results: Record<string, InteractionResult[]> = {}
  console.log('\n== Catalog search typing, /components, mobile-emulated viewport ==')
  for (const build of builds) {
    const origin = servers.get(build.label) ?? ''
    results[build.label] = [
      await interactionProbe(browser, origin, 4),
      await interactionProbe(browser, origin, 8),
    ]
    for (const result of results[build.label] ?? []) {
      console.log(
        `  [${build.label}] CPU ${String(result.cpuRate)}x slower; key events >= 50 ms: ${String(result.slowEvents)} (worst ${String(result.worstEventMs)} ms)`,
      )
      for (const trial of result.typing) {
        console.log(
          `    ${trial.scenario.padEnd(10)} ${String(trial.keyDelayMs).padStart(3)} ms between keys: wrong in ${String(trial.failures)}/${String(trial.trials)}; events >= 50 ms: ${String(trial.slowEvents)}, worst ${String(trial.worstEventMs)} ms` +
            (trial.examples.length ? `  (${trial.examples.join('; ')})` : ''),
        )
      }
    }
  }
  return results
}

// --- main ------------------------------------------------------------------------------------

function git(...args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

async function main() {
  const playwrightVersion = (
    JSON.parse(
      readFileSync(path.join(repoRoot, 'node_modules/@playwright/test/package.json'), 'utf8'),
    ) as {
      version: string
    }
  ).version
  const sizes = modes.has('size') ? builds.map(measureSize) : []
  if (sizes.length > 0) printSize(sizes)

  const needsBrowser = ['routes', 'lifecycle', 'interaction'].some((mode) => modes.has(mode))
  let routeResults: RouteRuns = {}
  let lifecycle: Record<string, Record<string, LifecycleResult>> = {}
  let interaction: Record<string, InteractionResult[]> = {}
  let browserVersion = 'not launched'
  const outDir = path.join(repoRoot, 'perf-results')
  const out =
    options.out ??
    path.join(
      outDir,
      `${new Date().toISOString().replace(/[:.]/g, '-')}-${builds.map((b) => b.label).join('+')}.json`,
    )
  // Written after every stage, so a failure later in a long run does not lose what was measured.
  const save = () => {
    mkdirSync(path.dirname(out), { recursive: true })
    writeFileSync(
      out,
      JSON.stringify(
        { meta: buildMeta(browserVersion), sizes, routes: routeResults, lifecycle, interaction },
        null,
        2,
      ),
    )
  }
  const buildMeta = (chromiumVersion: string) => ({
    date: new Date().toISOString(),
    note: options.note ?? null,
    commit: git('rev-parse', 'HEAD'),
    workingTreeClean: git('status', '--porcelain') === '',
    machine: {
      cpu: os.cpus()[0]?.model ?? 'unknown',
      cores: os.cpus().length,
      memoryGB: Math.round(os.totalmem() / 2 ** 30),
      platform: `${os.platform()} ${os.release()}`,
    },
    node: process.version,
    playwright: playwrightVersion,
    chromium: chromiumVersion,
    runs,
    compression: compress,
    builds: builds.map((build) => ({ label: build.label, dir: build.dir })),
    profiles: profiles.map(({ name, description }) => ({ name, description })),
    routes: ROUTES,
  })
  if (needsBrowser) {
    const servers = new Map<string, string>()
    const closers: (() => void)[] = []
    for (const build of builds) {
      const server = await serve(build.dir)
      servers.set(build.label, server.origin)
      closers.push(server.close)
    }
    const browser = await chromium.launch()
    browserVersion = browser.version()
    try {
      if (modes.has('routes')) {
        routeResults = await measureRoutes(browser, servers)
        printRoutes(routeResults)
        save()
      }
      if (modes.has('lifecycle')) {
        lifecycle = await measureLifecycle(browser, servers)
        save()
      }
      if (modes.has('interaction')) {
        interaction = await measureInteraction(browser, servers)
        save()
      }
    } finally {
      await browser.close()
      for (const close of closers) close()
    }
  }

  console.log('\n== Conditions ==')
  console.log(JSON.stringify(buildMeta(browserVersion), null, 2))
  save()
  console.log(`\nWrote ${path.relative(repoRoot, out)}`)
  if (statSync(out).size === 0) throw new Error('empty result file')
}

await main()
