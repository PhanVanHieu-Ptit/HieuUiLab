import { describe, expect, it } from 'vitest'

import {
  PUBLIC_VARIABLES,
  checkDist,
  formatResults,
  hasErrors,
  rules,
  type DistContext,
  type Level,
} from './dist-rules.ts'

// One failing example for each rule, against a small output that passes them all. Credential-shaped
// strings are assembled in the test so that no such literal sits in the repository.

const INDEX_HTML =
  '<!doctype html><html><head><link rel="icon" href="/favicon.svg" />' +
  '<script type="module" crossorigin src="/assets/index-1.js"></script>' +
  '<link rel="modulepreload" crossorigin href="/assets/react-1.js" />' +
  '</head><body><div id="root"></div></body></html>'

const BASE_FILES: Record<string, string | null> = {
  'index.html': INDEX_HTML,
  'favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  'r/registry.json': '{"items":[]}',
  'r/kbd.json': '{"name":"kbd"}',
  'assets/index-1.js': 'console.log("app")',
  'assets/react-1.js': 'export const react = 1',
  'assets/maplibre-gl-worker-1.js': 'self.onmessage = () => {}',
  'assets/font-1.woff2': null,
}

/** The passing output, with some files replaced (a string) or removed (undefined). */
function dist(
  changes: Record<string, string | null | undefined> = {},
  rest: Partial<Omit<DistContext, 'files'>> = {},
): DistContext {
  const files = new Map<string, string | null>(Object.entries(BASE_FILES))
  for (const [path, text] of Object.entries(changes)) {
    if (text === undefined) files.delete(path)
    else files.set(path, text)
  }
  return { files, viteEnv: {}, processEnv: {}, ...rest }
}

function findings(ctx: DistContext, ruleId: string, level?: Level): string[] {
  const rule = rules.find((candidate) => candidate.id === ruleId)
  expect(rule, `rule ${ruleId}`).toBeDefined()
  return (rule?.check(ctx) ?? [])
    .filter((finding) => level === undefined || finding.level === level)
    .map((finding) => finding.message)
}

const errorsOf = (ctx: DistContext, ruleId: string) => findings(ctx, ruleId, 'error')

describe('a passing output', () => {
  it('has no errors and no warnings', () => {
    const results = checkDist(dist())
    expect(hasErrors(results)).toBe(false)
    expect(
      results.flatMap((result) => result.findings).filter((f) => f.level !== 'notice'),
    ).toEqual([])
  })

  it('names every rule once', () => {
    const ids = rules.map((rule) => rule.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('required-files', () => {
  it('names a missing registry file', () => {
    expect(errorsOf(dist({ 'r/kbd.json': undefined }), 'required-files')).toEqual([
      'r/kbd.json is missing from the output',
    ])
  })

  it('names a missing map worker, the failure that blanks the map viewer', () => {
    const [message] = errorsOf(
      dist({ 'assets/maplibre-gl-worker-1.js': undefined }),
      'required-files',
    )
    expect(message).toContain('maplibre-gl-worker')
  })
})

describe('index-html', () => {
  it('rejects a path without a leading slash, which breaks on a nested route', () => {
    const html = INDEX_HTML.replace('src="/assets/index-1.js"', 'src="assets/index-1.js"')
    expect(errorsOf(dist({ 'index.html': html }), 'index-html')).toEqual([
      'index.html refers to "assets/index-1.js" without a leading slash',
    ])
    expect(
      errorsOf(dist({ 'index.html': html.replace('"assets/', '"./assets/') }), 'index-html'),
    ).toHaveLength(1)
  })

  it('rejects a file from another origin, in either spelling', () => {
    for (const url of ['https://cdn.example.com/x.js', '//cdn.example.com/x.js']) {
      const html = INDEX_HTML.replace('/assets/react-1.js', url)
      expect(errorsOf(dist({ 'index.html': html }), 'index-html'), url).toEqual([
        `index.html loads ${url} from another origin`,
      ])
    }
  })

  it('rejects a reference to a file the output does not have', () => {
    const html = INDEX_HTML.replace('/assets/react-1.js', '/assets/react-2.js')
    expect(errorsOf(dist({ 'index.html': html }), 'index-html')).toEqual([
      'index.html refers to /assets/react-2.js, which is not in the output',
    ])
  })

  it('rejects a page with no root element', () => {
    const html = INDEX_HTML.replace('<div id="root"></div>', '')
    expect(errorsOf(dist({ 'index.html': html }), 'index-html')).toEqual([
      'index.html has no #root element',
    ])
  })
})

describe('source-maps', () => {
  it('rejects a published map and a link to one', () => {
    expect(errorsOf(dist({ 'assets/index-1.js.map': '{}' }), 'source-maps')).toHaveLength(1)
    const linked = dist({ 'assets/index-1.js': 'x()\n//# sourceMappingURL=index-1.js.map' })
    expect(errorsOf(linked, 'source-maps')).toEqual(['assets/index-1.js points at a source map'])
  })
})

describe('vite-variables', () => {
  const leaked = (names: string) =>
    `let a=f({BASE_URL:\`/\`,DEV:!1,MODE:\`production\`,PROD:!0,SSR:!1,${names}})`

  it('rejects an import.meta.env object that holds a setting no code asked for', () => {
    const ctx = dist({ 'assets/index-1.js': leaked('VITE_PRIVATE_THING:`x`') })
    expect(errorsOf(ctx, 'vite-variables')).toEqual([
      'assets/index-1.js holds all of import.meta.env, including VITE_PRIVATE_THING: read each setting by name, as maplibre-viewer-demo.tsx does',
    ])
  })

  it('finds it whatever the value is, and with quoted keys', () => {
    const ctx = dist({ 'assets/index-1.js': leaked('"VITE_SHORT":"1"') })
    expect(errorsOf(ctx, 'vite-variables')).toHaveLength(1)
  })

  it('accepts an environment object that holds only the map settings, or none', () => {
    const names = PUBLIC_VARIABLES.map((name) => `${name}:\`v\``).join(',')
    expect(errorsOf(dist({ 'assets/index-1.js': leaked(names) }), 'vite-variables')).toEqual([])
    expect(
      errorsOf(
        dist({ 'assets/index-1.js': 'f({BASE_URL:`/`,DEV:!1,MODE:`production`,PROD:!0,SSR:!1})' }),
        'vite-variables',
      ),
    ).toEqual([])
  })

  it('rejects a variable whose value reached the output, and names the file, not the value', () => {
    const ctx = dist(
      { 'assets/index-1.js': 'fetch("https://api.example.com/?k=canary-9f3a7c21")' },
      { viteEnv: { VITE_CANARY: 'canary-9f3a7c21' } },
    )
    const [message] = errorsOf(ctx, 'vite-variables')
    expect(message).toBe(
      'the value of VITE_CANARY is in assets/index-1.js; a VITE_ value is public',
    )
    expect(formatResults(checkDist(ctx))).not.toContain('canary-9f3a7c21')
  })

  it('warns, without failing, about a variable nothing reads', () => {
    const ctx = dist({}, { viteEnv: { VITE_UNUSED: 'abcdefghij', VITE_TINY: '1' } })
    expect(errorsOf(ctx, 'vite-variables')).toEqual([])
    expect(findings(ctx, 'vite-variables', 'warning')).toHaveLength(2)
  })

  it('leaves the map settings and the variables Vercel adds alone', () => {
    const ctx = dist(
      { 'assets/index-1.js': 'const owner = "PhanVanHieu-Ptit"' },
      {
        viteEnv: { VITE_MAP_ATTRIBUTION: 'index', VITE_VERCEL_GIT_REPO_OWNER: 'PhanVanHieu-Ptit' },
      },
    )
    expect(findings(ctx, 'vite-variables')).toEqual([])
  })
})

describe('secret-variables', () => {
  const token = 'tok_0123456789abcdef'

  it('rejects the value of a secret-named variable found in the output', () => {
    const ctx = dist(
      { 'assets/index-1.js': `const t = "${token}"` },
      { processEnv: { DEPLOY_TOKEN: token } },
    )
    expect(errorsOf(ctx, 'secret-variables')).toEqual([
      'the value of DEPLOY_TOKEN is in assets/index-1.js',
    ])
    expect(formatResults(checkDist(ctx))).not.toContain(token)
  })

  it('ignores a secret that is not in the output, a short value, and other variables', () => {
    const ctx = dist(
      { 'assets/index-1.js': 'const mode = "production"; const home = "/root/user/path"' },
      {
        processEnv: {
          DEPLOY_TOKEN: token,
          SHORT_SECRET: 'production',
          HOME: '/root/user/path',
          VERCEL_AUTOMATION_BYPASS_SECRET: undefined,
        },
      },
    )
    expect(errorsOf(ctx, 'secret-variables')).toEqual([])
  })
})

describe('credential-formats', () => {
  const cases: [string, string][] = [
    ['an AWS access key id', 'AKIA' + 'A'.repeat(16)],
    ['a GitHub token', 'ghp_' + 'a'.repeat(36)],
    ['a GitHub fine-grained token', 'github_pat_' + 'a'.repeat(60)],
    ['an Anthropic API key', 'sk-ant-' + 'a'.repeat(30)],
    ['a Slack token', 'xoxb-' + '1'.repeat(12)],
    ['a private key', '-----BEGIN ' + 'RSA PRIVATE KEY-----'],
  ]

  it.each(cases)('finds %s', (name, text) => {
    const ctx = dist({ 'assets/index-1.js': `const x = "${text}"` })
    expect(errorsOf(ctx, 'credential-formats')).toEqual([
      `assets/index-1.js contains what looks like ${name}`,
    ])
    expect(formatResults(checkDist(ctx))).not.toContain(text)
  })

  it('leaves ordinary text alone', () => {
    const text = 'Use an sk-style prefix, a key like AKIA, or ghp_ tokens in your own project.'
    expect(errorsOf(dist({ 'assets/index-1.js': text }), 'credential-formats')).toEqual([])
  })
})

describe('map-settings', () => {
  const ready = {
    VITE_MAP_STYLE_URL: 'https://tiles.example.com/styles/basic/style.json?key={key}',
    VITE_MAP_API_KEY: 'public-key-123',
    VITE_MAP_ATTRIBUTION: '© Example Maps',
  }
  const withEnv = (viteEnv: Record<string, string>) => dist({}, { viteEnv })

  it('says the bundled basemap is used when nothing is set', () => {
    expect(findings(withEnv({}), 'map-settings')).toEqual([
      'no online basemap configured: the map viewer draws its bundled basemap and asks nobody for tiles',
    ])
  })

  it('warns that a setting without a style URL is ignored', () => {
    const [message] = findings(
      withEnv({ VITE_MAP_ATTRIBUTION: '© Example' }),
      'map-settings',
      'warning',
    )
    expect(message).toContain('VITE_MAP_ATTRIBUTION set without VITE_MAP_STYLE_URL')
  })

  it('warns when the style has no attribution, or {key} has no key', () => {
    const noCredit = findings(
      withEnv({ ...ready, VITE_MAP_ATTRIBUTION: ' ' }),
      'map-settings',
      'warning',
    )
    expect(noCredit.join('\n')).toContain('VITE_MAP_ATTRIBUTION is empty')
    const noKey = findings(withEnv({ ...ready, VITE_MAP_API_KEY: '' }), 'map-settings', 'warning')
    expect(noKey.join('\n')).toContain('VITE_MAP_API_KEY is empty')
  })

  it('warns about a key the style URL has no place for', () => {
    const style = 'https://tiles.example.com/style.json'
    const messages = findings(
      withEnv({ ...ready, VITE_MAP_STYLE_URL: style }),
      'map-settings',
      'warning',
    )
    expect(messages.join('\n')).toContain('has no {key}')
  })

  it('reminds that a key in the bundle is public, and names only the host', () => {
    const ctx = withEnv({ ...ready, VITE_MAP_PROVIDER_NAME: 'Example Maps' })
    expect(findings(ctx, 'map-settings', 'warning')).toEqual([])
    const text = findings(ctx, 'map-settings', 'notice').join('\n')
    expect(text).toContain('public bundle by design')
    expect(text).toContain('tiles.example.com (Example Maps)')
    expect(formatResults(checkDist(ctx))).not.toContain('public-key-123')
    expect(formatResults(checkDist(ctx))).not.toContain('styles/basic')
  })

  it('never fails the check by itself', () => {
    const results = checkDist(withEnv({ VITE_MAP_STYLE_URL: 'not a url' }))
    expect(hasErrors(results)).toBe(false)
    expect(
      findings(withEnv({ VITE_MAP_STYLE_URL: 'not a url' }), 'map-settings', 'warning')[0],
    ).toContain('is not a URL')
  })
})

describe('formatResults', () => {
  it('marks a failing rule and indents what it found', () => {
    const output = formatResults(checkDist(dist({ 'r/kbd.json': undefined })))
    expect(output).toContain('FAIL  The output has the files the site needs')
    expect(output).toContain('        ERROR r/kbd.json is missing from the output')
    expect(output).toContain('ok    No source maps are published')
  })
})
