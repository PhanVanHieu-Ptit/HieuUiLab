/*
 * Rules for the production build in dist/, as pure functions over an injected context, so a test can
 * show each one failing (the same shape as src/docs/docs-rules.ts). scripts/check-dist.ts reads the
 * folder and the environment and prints what these find; the Vercel build runs it right after
 * `pnpm build` (see vercel.json), so a build that leaks a setting or lacks a file is not deployed.
 *
 * What it cannot tell you: that the host serves these files correctly. That is
 * scripts/smoke-deployment.ts, run against a URL. No message here prints a secret's value: it names
 * the variable and the files.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */

export type Level = 'error' | 'warning' | 'notice'

export interface Finding {
  level: Level
  message: string
}

export interface DistContext {
  /**
   * Every file in the output folder, by path relative to it with `/` separators. The text of a
   * file the rules read; `null` for one that is not text (an image, a font).
   */
  files: ReadonlyMap<string, string | null>
  /** The `VITE_` variables the build saw: the environment and the .env files, as Vite loads them. */
  viteEnv: Readonly<Record<string, string>>
  /** The process environment, for secrets that are not `VITE_` variables. */
  processEnv: Readonly<Record<string, string | undefined>>
}

export interface Rule {
  id: string
  title: string
  check(ctx: DistContext): Finding[]
}

export interface RuleResult {
  rule: Rule
  findings: Finding[]
}

/** The only `VITE_` variables the code reads, and so the only ones that may reach the bundle. */
export const PUBLIC_VARIABLES: readonly string[] = [
  'VITE_MAP_STYLE_URL',
  'VITE_MAP_API_KEY',
  'VITE_MAP_ATTRIBUTION',
  'VITE_MAP_PROVIDER_NAME',
]

/** What Vercel adds, with this prefix, when a project exposes its system variables to Vite. */
const SYSTEM_PREFIX = 'VITE_VERCEL_'

/** Names that mark a setting as a secret, for variables without the `VITE_` prefix. */
const SECRET_NAME = /SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|BYPASS|API_?KEY/i

/** A shorter value is not searched for: it would match ordinary text such as "production". */
const MIN_SEARCHED_LENGTH = 8
const MIN_SEARCHED_SECRET_LENGTH = 12

/** Credential formats that are recognisable by their shape alone. */
const CREDENTIAL_FORMATS: readonly (readonly [name: string, pattern: RegExp])[] = [
  ['an AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['a GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['a GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
  ['an Anthropic API key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['an API key beginning sk-', /\bsk-[A-Za-z0-9]{32,}\b/],
  ['a Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['a private key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
]

const REQUIRED_FILES: readonly string[] = [
  'index.html',
  'favicon.svg',
  // The shadcn registry, served as static files next to the app.
  'r/registry.json',
  'r/kbd.json',
]

/** MapLibre's worker is a separate emitted asset; without it the map never starts. */
const WORKER_FILE = /^assets\/maplibre-gl-worker-[\w-]+\.js$/

function textFiles(ctx: DistContext): [path: string, text: string][] {
  return [...ctx.files].flatMap(([path, text]) => (text === null ? [] : [[path, text]]))
}

function filesContaining(ctx: DistContext, needle: string): string[] {
  return textFiles(ctx)
    .filter(([, text]) => text.includes(needle))
    .map(([path]) => path)
}

const error = (message: string): Finding => ({ level: 'error', message })
const warning = (message: string): Finding => ({ level: 'warning', message })
const notice = (message: string): Finding => ({ level: 'notice', message })

function requiredFiles(ctx: DistContext): Finding[] {
  const findings = REQUIRED_FILES.filter((path) => !ctx.files.has(path)).map((path) =>
    error(`${path} is missing from the output`),
  )
  if (![...ctx.files.keys()].some((path) => WORKER_FILE.test(path))) {
    findings.push(
      error(
        'no assets/maplibre-gl-worker-*.js: the map viewer imports the worker as an asset, and without it the map cannot start',
      ),
    )
  }
  return findings
}

/** The `src` and `href` values of the tags in index.html. */
function referencesIn(html: string): string[] {
  return [...html.matchAll(/\b(?:src|href)="([^"]*)"/g)].flatMap((match) => match[1] ?? [])
}

function indexHtml(ctx: DistContext): Finding[] {
  const html = ctx.files.get('index.html')
  if (typeof html !== 'string') return []

  const findings: Finding[] = []
  if (!html.includes('<div id="root"></div>'))
    findings.push(error('index.html has no #root element'))

  for (const reference of referencesIn(html)) {
    if (reference === '' || reference.startsWith('data:') || reference.startsWith('#')) continue
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(reference)) {
      findings.push(error(`index.html loads ${reference} from another origin`))
    } else if (!reference.startsWith('/')) {
      // A relative path resolves against the URL, so it breaks on a nested route such as /docs/x.
      findings.push(error(`index.html refers to "${reference}" without a leading slash`))
    } else {
      const file = reference.slice(1).split(/[?#]/)[0] ?? ''
      if (!ctx.files.has(file))
        findings.push(error(`index.html refers to ${reference}, which is not in the output`))
    }
  }
  return findings
}

function sourceMaps(ctx: DistContext): Finding[] {
  const maps = [...ctx.files.keys()].filter((path) => path.endsWith('.map'))
  const linked = textFiles(ctx)
    .filter(([path, text]) => /\.(?:js|mjs|css)$/.test(path) && text.includes('sourceMappingURL='))
    .map(([path]) => path)
  return [
    ...maps.map((path) =>
      error(`${path} publishes source code; build.sourcemap is meant to be off`),
    ),
    ...linked.map((path) => error(`${path} points at a source map`)),
  ]
}

/** The names of the `VITE_` keys in an `import.meta.env` object Vite wrote into the output. */
function inlinedEnvironmentKeys(text: string): string[] {
  const names: string[] = []
  for (const start of text.matchAll(/\bSSR:(?:!0|!1|true|false)/g)) {
    const window = text.slice(start.index, start.index + 4000)
    for (const key of window.matchAll(/,"?(VITE_[A-Z0-9_]+)"?:/g)) names.push(key[1] ?? '')
  }
  return names
}

function viteVariables(ctx: DistContext): Finding[] {
  const findings: Finding[] = []

  // Vite writes `import.meta.env` into the output as an object holding every VITE_ variable of the
  // build when code uses it whole. That would publish settings no code asked for.
  for (const [path, text] of textFiles(ctx)) {
    const leaked = [...new Set(inlinedEnvironmentKeys(text))].filter(
      (name) => !PUBLIC_VARIABLES.includes(name),
    )
    if (leaked.length > 0) {
      findings.push(
        error(
          `${path} holds all of import.meta.env, including ${leaked.join(', ')}: read each setting by name, as maplibre-viewer-demo.tsx does`,
        ),
      )
    }
  }

  for (const [name, value] of Object.entries(ctx.viteEnv)) {
    if (PUBLIC_VARIABLES.includes(name)) continue
    if (name.startsWith(SYSTEM_PREFIX)) continue
    if (value.length < MIN_SEARCHED_LENGTH) {
      findings.push(
        warning(
          `${name} is set, and its value is too short to look for in the output; remove it if nothing reads it`,
        ),
      )
      continue
    }
    const files = filesContaining(ctx, value)
    findings.push(
      files.length > 0
        ? error(`the value of ${name} is in ${files.join(', ')}; a VITE_ value is public`)
        : warning(
            `${name} is set and its value is not in the output; remove it if nothing reads it`,
          ),
    )
  }
  return findings
}

function secretVariables(ctx: DistContext): Finding[] {
  return Object.entries(ctx.processEnv).flatMap(([name, value]) => {
    if (name.startsWith('VITE_') || !SECRET_NAME.test(name)) return []
    if (value === undefined || value.length < MIN_SEARCHED_SECRET_LENGTH) return []
    const files = filesContaining(ctx, value)
    return files.length > 0 ? [error(`the value of ${name} is in ${files.join(', ')}`)] : []
  })
}

function credentialFormats(ctx: DistContext): Finding[] {
  return textFiles(ctx).flatMap(([path, text]) =>
    CREDENTIAL_FORMATS.filter(([, pattern]) => pattern.test(text)).map(([name]) =>
      error(`${path} contains what looks like ${name}`),
    ),
  )
}

function mapSettings(ctx: DistContext): Finding[] {
  const value = (name: string) => (ctx.viteEnv[name] ?? '').trim()
  const style = value('VITE_MAP_STYLE_URL')
  const key = value('VITE_MAP_API_KEY')
  const attribution = value('VITE_MAP_ATTRIBUTION')
  const provider = value('VITE_MAP_PROVIDER_NAME')

  if (style === '') {
    const ignored = PUBLIC_VARIABLES.filter(
      (name) => name !== 'VITE_MAP_STYLE_URL' && value(name) !== '',
    )
    return ignored.length > 0
      ? [
          warning(
            `${ignored.join(', ')} set without VITE_MAP_STYLE_URL: ignored, the bundled basemap is used`,
          ),
        ]
      : [
          notice(
            'no online basemap configured: the map viewer draws its bundled basemap and asks nobody for tiles',
          ),
        ]
  }

  const findings: Finding[] = []
  let host = 'the style URL'
  try {
    host = new URL(style.replaceAll('{key}', 'key')).host
  } catch {
    findings.push(warning('VITE_MAP_STYLE_URL is not a URL: the online basemap will stay off'))
  }
  if (attribution === '') {
    findings.push(
      warning(
        'VITE_MAP_ATTRIBUTION is empty: the viewer refuses an online basemap without its provider’s credit',
      ),
    )
  }
  if (style.includes('{key}') && key === '') {
    findings.push(
      warning(
        'the style URL has {key} but VITE_MAP_API_KEY is empty: the online basemap will stay off',
      ),
    )
  }
  if (key !== '' && !style.includes('{key}')) {
    findings.push(
      warning(
        'VITE_MAP_API_KEY is set but the style URL has no {key}: the viewer ignores it, yet it is still in the bundle',
      ),
    )
  }
  if (key !== '') {
    findings.push(
      notice(
        'VITE_MAP_API_KEY is in the public bundle by design: restrict the key to this site’s origin at the provider',
      ),
    )
  }
  findings.push(
    notice(
      `online basemap configured for ${host}${provider === '' ? '' : ` (${provider})`}: loaded only after the visitor presses the button; check the provider’s terms and that the credit reads as they require`,
    ),
  )
  return findings
}

export const rules: readonly Rule[] = [
  { id: 'required-files', title: 'The output has the files the site needs', check: requiredFiles },
  {
    id: 'index-html',
    title: 'index.html loads only root-absolute files that exist',
    check: indexHtml,
  },
  { id: 'source-maps', title: 'No source maps are published', check: sourceMaps },
  {
    id: 'vite-variables',
    title: 'No VITE_ setting other than the map settings is in the bundle',
    check: viteVariables,
  },
  {
    id: 'secret-variables',
    title: 'No secret-named variable’s value is in the output',
    check: secretVariables,
  },
  {
    id: 'credential-formats',
    title: 'No credential-shaped string is in the output',
    check: credentialFormats,
  },
  { id: 'map-settings', title: 'The map settings are consistent', check: mapSettings },
]

export function checkDist(ctx: DistContext): RuleResult[] {
  return rules.map((rule) => ({ rule, findings: rule.check(ctx) }))
}

export function hasErrors(results: readonly RuleResult[]): boolean {
  return results.some(({ findings }) => findings.some((finding) => finding.level === 'error'))
}

const LABEL: Record<Level, string> = { error: 'ERROR', warning: 'WARN ', notice: 'note ' }

/** One line per rule, then its findings. */
export function formatResults(results: readonly RuleResult[]): string {
  return results
    .flatMap(({ rule, findings }) => {
      const failed = findings.some((finding) => finding.level === 'error')
      return [
        `${failed ? 'FAIL' : 'ok  '}  ${rule.title}`,
        ...findings.map((finding) => `        ${LABEL[finding.level]} ${finding.message}`),
      ]
    })
    .join('\n')
}
