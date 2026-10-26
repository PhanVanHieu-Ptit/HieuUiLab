/*
 * The checks behind scripts/smoke-deployment.ts: what a host has to get right for this site, asked
 * of a URL with plain HTTP requests, so it works against any host and needs no browser.
 *
 * The single-page app has one HTML file. The host must answer a direct load or a refresh of a
 * nested URL with that file, and must not answer a missing script or data file with it: a script
 * request that gets HTML fails in the browser with "Expected a JavaScript module", and the map
 * viewer's worker, which is an emitted asset, fails to start.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */

export interface CheckResult {
  name: string
  /** `note` reports a behavior that is expected and worth knowing, and never fails the run. */
  status: 'ok' | 'fail' | 'note'
  detail: string
}

export interface ExpectedHeaders {
  /** On every response. */
  all: Readonly<Record<string, string>>
  /** On files under /assets/. */
  assets: Readonly<Record<string, string>>
}

export interface SmokeOptions {
  /** The deployment's origin, such as https://example.vercel.app. */
  baseUrl: string
  /** The Vercel automation bypass secret, for a protected preview. */
  bypassSecret?: string | undefined
  expectedHeaders?: ExpectedHeaders | undefined
  routes?: readonly string[] | undefined
  timeoutMs?: number | undefined
}

/** Nested URLs of every kind of page. The host cannot know them; the app answers all of them. */
export const DEFAULT_ROUTES: readonly string[] = [
  '/components/button',
  '/blocks/resource-list',
  '/templates/admin-dashboard',
  '/playground',
  '/labs/maps/maplibre-viewer',
  '/labs/3d/three-scene',
  '/notes/theme-without-flash',
  '/projects/hieu-ui-lab-platform',
  '/docs/installation',
  '/docs/component-conventions/adding-a-component',
  '/docs/deployment',
  '/about',
]

interface Reply {
  status: number
  type: string
  body: string
  headers: Headers
  redirectedTo: string | undefined
}

interface Target {
  label: string
  reply: Reply
  wanted: Readonly<Record<string, string>>
}

const ok = (name: string, detail: string): CheckResult => ({ name, status: 'ok', detail })
const fail = (name: string, detail: string): CheckResult => ({ name, status: 'fail', detail })
const note = (name: string, detail: string): CheckResult => ({ name, status: 'note', detail })

/** The headers vercel.json asks for: the ones on every path, and the ones on /assets/. */
export function parseExpectedHeaders(vercelJson: string): ExpectedHeaders {
  const config = JSON.parse(vercelJson) as {
    headers?: { source: string; headers: { key: string; value: string }[] }[]
  }
  const collect = (source: string) =>
    Object.fromEntries(
      (config.headers ?? [])
        .filter((rule) => rule.source === source)
        .flatMap((rule) => rule.headers.map(({ key, value }) => [key, value] as const)),
    )
  return { all: collect('/(.*)'), assets: collect('/assets/(.*)') }
}

const isHtml = (reply: Reply) => reply.type.includes('text/html')
const hasRoot = (reply: Reply) => reply.body.includes('id="root"')

/** The files index.html loads: its scripts, stylesheets and preloads, which are all under /assets/. */
export function assetsIn(html: string): string[] {
  const urls = [...html.matchAll(/\b(?:src|href)="(\/assets\/[^"?#]+)"/g)].flatMap(
    (m) => m[1] ?? [],
  )
  return [...new Set(urls)]
}

/** The first few problems, so that twelve routes failing the same way read as one line. */
function summarise(problems: readonly string[], shown = 3): string {
  const rest = problems.length - shown
  return rest > 0
    ? `${problems.slice(0, shown).join('; ')}; and ${String(rest)} more`
    : problems.join('; ')
}

function describe(reply: Reply): string {
  return `${String(reply.status)} ${reply.type || 'no content type'}`
}

export async function runSmoke(options: SmokeOptions): Promise<CheckResult[]> {
  const base = new URL(options.baseUrl)
  const timeout = options.timeoutMs ?? 15_000
  const routes = options.routes ?? DEFAULT_ROUTES
  const results: CheckResult[] = []

  async function get(urlPath: string): Promise<Reply> {
    const response = await fetch(new URL(urlPath, base), {
      headers:
        options.bypassSecret === undefined
          ? {}
          : { 'x-vercel-protection-bypass': options.bypassSecret },
      signal: AbortSignal.timeout(timeout),
    })
    const body = await response.text()
    return {
      status: response.status,
      type: response.headers.get('content-type') ?? '',
      body,
      headers: response.headers,
      redirectedTo: response.redirected ? response.url : undefined,
    }
  }

  /** Runs a check; a network error is a failure of that check, not of the script. */
  async function check(
    name: string,
    run: () => Promise<CheckResult | CheckResult[]>,
  ): Promise<void> {
    try {
      const outcome = await run()
      results.push(...(Array.isArray(outcome) ? outcome : [outcome]))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      results.push(fail(name, `the request failed: ${message}`))
    }
  }

  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
  if (base.protocol !== 'https:' && !isLoopback) {
    return [fail('address', `${options.baseUrl} is not https; a deployment is served over https`)]
  }

  let page: Reply
  try {
    page = await get('/')
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return [fail('home page', `the request failed: ${message}`)]
  }
  if (page.status === 401 || page.status === 403) {
    return [
      fail(
        'home page',
        `${describe(page)}: the deployment is protected. For a Vercel preview, set VERCEL_AUTOMATION_BYPASS_SECRET to the project's automation bypass secret`,
      ),
    ]
  }
  if (page.status !== 200 || !isHtml(page) || !hasRoot(page)) {
    return [
      fail('home page', `expected the app's HTML with #root, got ${describe(page)}`),
      note('other checks', 'skipped: the home page is not the app'),
    ]
  }
  results.push(ok('home page', `${describe(page)}, has #root`))

  await check('assets', async () => {
    const urls = assetsIn(page.body)
    if (urls.length === 0) return fail('assets', 'index.html loads no file from /assets/')
    const problems: string[] = []
    for (const url of urls) {
      const reply = await get(url)
      const expected = url.endsWith('.css') ? 'text/css' : 'javascript'
      if (reply.status !== 200) problems.push(`${url}: ${describe(reply)}`)
      else if (!reply.type.includes(expected))
        problems.push(`${url}: ${describe(reply)}, expected ${expected}`)
    }
    return problems.length > 0
      ? fail(
          'assets',
          `${String(problems.length)} of ${String(urls.length)} are wrong: ${summarise(problems)}`,
        )
      : ok('assets', `${String(urls.length)} files from index.html load with the right type`)
  })

  await check('nested routes', async () => {
    const problems: string[] = []
    for (const route of routes) {
      const reply = await get(route)
      if (reply.redirectedTo !== undefined)
        problems.push(`${route}: redirected to ${reply.redirectedTo}`)
      else if (reply.status !== 200 || !isHtml(reply)) problems.push(`${route}: ${describe(reply)}`)
      else if (reply.body !== page.body)
        problems.push(`${route}: HTML differs from the home page's`)
    }
    return problems.length > 0
      ? fail(
          'nested routes',
          `${String(problems.length)} of ${String(routes.length)} are wrong: ${summarise(problems)}`,
        )
      : ok(
          'nested routes',
          `${String(routes.length)} nested URLs answer with the same index.html, as a refresh needs`,
        )
  })

  await check('missing script', async () => {
    const reply = await get('/assets/definitely-missing-0f3a9c.js')
    if (reply.status === 404 && !hasRoot(reply)) return ok('missing script', describe(reply))
    return fail(
      'missing script',
      `${describe(reply)}${hasRoot(reply) ? ' with the app HTML' : ''}: a missing script must be a 404, not index.html (the browser reports "Expected a JavaScript module")`,
    )
  })

  await check('missing registry file', async () => {
    const reply = await get('/r/definitely-missing-0f3a9c.json')
    if (reply.status === 404 && !hasRoot(reply)) return ok('missing registry file', describe(reply))
    return fail('missing registry file', `${describe(reply)}: a missing data file must be a 404`)
  })

  await check('registry files', async () => {
    const problems: string[] = []
    for (const file of ['/r/registry.json', '/r/kbd.json']) {
      const reply = await get(file)
      if (reply.status !== 200) {
        problems.push(`${file}: ${describe(reply)}`)
        continue
      }
      try {
        JSON.parse(reply.body)
      } catch {
        problems.push(`${file}: not JSON`)
      }
    }
    return problems.length > 0
      ? fail('registry files', problems.join('; '))
      : ok('registry files', '/r/registry.json and /r/kbd.json are JSON')
  })

  const expected = options.expectedHeaders
  if (expected !== undefined) {
    await check('headers', async () => {
      const assetUrl = assetsIn(page.body)[0]
      const targets: Target[] = [{ label: '/', reply: page, wanted: expected.all }]
      if (assetUrl !== undefined) {
        targets.push({
          label: assetUrl,
          reply: await get(assetUrl),
          wanted: { ...expected.all, ...expected.assets },
        })
      }
      const problems = targets.flatMap(({ label, reply, wanted }) =>
        Object.entries(wanted)
          .filter(([key, value]) => reply.headers.get(key) !== value)
          .map(([key]) => `${label}: ${key} is ${reply.headers.get(key) ?? 'missing'}`),
      )
      return problems.length > 0
        ? fail('headers', `${summarise(problems)} (vercel.json asks for them)`)
        : ok('headers', 'the headers vercel.json asks for are present on the page and on an asset')
    })
  }

  await check('unknown URL', async () => {
    const reply = await get('/docs/definitely-not-a-page-0f3a9c')
    if (reply.status === 200 && reply.body === page.body) {
      return note(
        'unknown URL',
        '200 with the app, which draws its own "Page not found": a soft 404, expected for a single-page app',
      )
    }
    return note('unknown URL', describe(reply))
  })

  return results
}

export function hasFailures(results: readonly CheckResult[]): boolean {
  return results.some((result) => result.status === 'fail')
}

const LABEL: Record<CheckResult['status'], string> = { ok: 'ok  ', fail: 'FAIL', note: 'note' }

export function formatSmoke(results: readonly CheckResult[]): string {
  return results.map((r) => `${LABEL[r.status]}  ${r.name}: ${r.detail}`).join('\n')
}
