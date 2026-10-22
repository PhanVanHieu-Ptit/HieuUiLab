/*
 * Installs the published registry items into a clean project with the real shadcn CLI, then builds
 * and runs the result. Needs network (npm registry, and ui.shadcn.com for the conflict scenario).
 *
 *   pnpm registry:install-test                       pnpm runner (default)
 *   pnpm registry:install-test --runner npm          npx runner
 *   pnpm registry:install-test --base-url <url>      test a hosted copy of public/r instead of a local server
 *   pnpm registry:install-test --keep                keep the temporary project and print its path
 *
 * One file with no relative imports and only erasable TypeScript, so Node runs it directly.
 * The CLI version under test is the `shadcn` pin in package.json; a unit test keeps that equal to
 * TESTED_CLI in src/registry/shadcn/config.ts, which is the only version the docs claim.
 */
import assert from 'node:assert/strict'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

import { chromium } from '@playwright/test'

type Runner = 'pnpm' | 'npm'

interface Options {
  runner: Runner
  baseUrl: string | undefined
  keep: boolean
}

interface Result {
  status: number | null
  text: string
}

interface RegistryItemJson {
  name: string
  dependencies?: string[]
  files: { path: string; content: string; type: string }[]
}

interface IndexJson {
  name: string
  homepage: string
  items: { name: string }[]
}

const repoRoot = path.resolve(import.meta.dirname, '..')

function parseOptions(argv: string[]): Options {
  const options: Options = { runner: 'pnpm', baseUrl: undefined, keep: false }
  for (let position = 0; position < argv.length; position += 1) {
    const flag = argv[position]
    if (flag === '--runner') {
      const value = argv[(position += 1)]
      if (value !== 'pnpm' && value !== 'npm') throw new Error('--runner must be pnpm or npm')
      options.runner = value
    } else if (flag === '--base-url') {
      options.baseUrl = argv[(position += 1)]?.replace(/\/+$/, '')
    } else if (flag === '--keep') {
      options.keep = true
    } else {
      throw new Error(`unknown argument ${String(flag)}`)
    }
  }
  return options
}

const options = parseOptions(process.argv.slice(2))

const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
  devDependencies: Record<string, string>
}

function pinnedCliVersion(): string {
  const version = packageJson.devDependencies.shadcn
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('package.json must pin shadcn to an exact version')
  }
  return version
}
const cliVersion = pinnedCliVersion()

// --- helpers ---------------------------------------------------------------------------------

const ESC = String.fromCharCode(27)
const ansi = new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, 'g')
const strip = (text: string) => text.replace(ansi, '')

/** The environment children run in: no npm_* variables leaked from the `pnpm run` that started us. */
const childEnv: NodeJS.ProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_')),
)
childEnv.NO_COLOR = '1'
delete childEnv.CI
delete childEnv.FORCE_COLOR

/** Runs a command with no stdin, so a prompt cannot be answered: what a CI job or script sees. */
function run(command: string, args: string[], cwd: string, timeout = 600_000): Result {
  const result = spawnSync(command, args, {
    cwd,
    env: childEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.error) throw result.error
  return { status: result.status, text: strip(`${result.stdout}${result.stderr}`) }
}

const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')

let passed = 0
const failures: string[] = []
const observed: string[] = []

async function step(name: string, body: () => void | Promise<void>) {
  const started = Date.now()
  try {
    await body()
    passed += 1
    console.log(`  ok   ${name} (${((Date.now() - started) / 1000).toFixed(1)}s)`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push(`${name}: ${message}`)
    console.log(`  FAIL ${name}\n${message.replace(/^/gm, '       ')}`)
  }
}

function note(text: string) {
  observed.push(text)
}

// --- the project under test ------------------------------------------------------------------

const work = mkdtempSync(path.join(os.tmpdir(), 'hieu-registry-install-'))
const sample = path.join(work, 'sample')
const sampleFile = (...parts: string[]) => path.join(sample, ...parts)
const kbdFile = sampleFile('src', 'components', 'ui', 'kbd.tsx')
const utilsFile = sampleFile('src', 'lib', 'utils.ts')

/** Runs the shadcn CLI through the chosen runner, from outside the project. */
function shadcn(args: string[]): Result {
  return options.runner === 'pnpm'
    ? run('pnpm', ['dlx', `shadcn@${cliVersion}`, ...args], work)
    : run('npx', ['--yes', `shadcn@${cliVersion}`, ...args], work)
}

/** Runs a package script or binary in the sample with the chosen package manager. */
function inSample(args: string[]): Result {
  return run(options.runner, args, sample)
}

function git(args: string[]): string {
  return run('git', ['-C', sample, ...args], work).text.trim()
}

function resetSample() {
  git(['reset', '-q', '--hard'])
  git(['clean', '-fdq'])
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => {
        if (address && typeof address === 'object') resolve(address.port)
        else reject(new Error('no port'))
      })
    })
  })
}

// --- a local server for public/r ------------------------------------------------------------

/**
 * A separate process, not a server in this one: the CLI is run with spawnSync, which blocks this
 * process's event loop, so a server living here could never answer the CLI's requests.
 */
const serverScript = `
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const root = process.argv[1]
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname
  console.log('GET ' + pathname)
  const match = /^\\/r\\/([a-z0-9-]+\\.json)$/.exec(pathname)
  const file = match ? path.join(root, match[1]) : undefined
  if (!file || !fs.existsSync(file)) {
    response.writeHead(404).end('not found')
    return
  }
  response.writeHead(200, { 'content-type': 'application/json' }).end(fs.readFileSync(file))
})
server.listen(0, '127.0.0.1', () => console.log('PORT ' + server.address().port))
`

const requested: string[] = []

function serveRegistry(): Promise<{ base: string; close: () => void }> {
  const child = spawn(process.execPath, ['-e', serverScript, path.join(repoRoot, 'public', 'r')], {
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return new Promise((resolve, reject) => {
    let buffered = ''
    child.once('error', reject)
    child.stdout.on('data', (chunk: Buffer) => {
      buffered += chunk.toString()
      const lines = buffered.split('\n')
      buffered = lines.pop() ?? ''
      for (const line of lines) {
        const port = /^PORT (\d+)$/.exec(line)?.[1]
        if (port) {
          resolve({ base: `http://127.0.0.1:${port}/r`, close: () => child.kill() })
        } else if (line.startsWith('GET ')) {
          requested.push(line.slice(4))
        }
      }
    })
  })
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  assert.equal(response.status, 200, `${url} answered ${String(response.status)}`)
  return (await response.json()) as T
}

// --- scenarios -------------------------------------------------------------------------------

async function main() {
  const server = options.baseUrl ? undefined : await serveRegistry()
  const base = options.baseUrl ?? server?.base ?? ''
  console.log(`registry install test`)
  console.log(`  runner   ${options.runner}`)
  console.log(`  cli      shadcn@${cliVersion}`)
  console.log(`  node     ${process.version}`)
  console.log(`  registry ${base}${options.baseUrl ? '' : ' (local server for public/r)'}`)
  console.log(`  project  ${sample}\n`)

  // Filled in by the first step; an object, because TypeScript does not follow closure assignments.
  const found: { kbd: RegistryItemJson | undefined } = { kbd: undefined }

  await step('the index resolves and lists items that resolve', async () => {
    const index = await fetchJson<IndexJson>(`${base}/registry.json`)
    assert.ok(index.items.length > 0, 'the index lists no items')
    for (const entry of index.items) {
      const json = await fetchJson<RegistryItemJson>(`${base}/${entry.name}.json`)
      assert.equal(json.name, entry.name)
      if (entry.name === 'kbd') found.kbd = json
    }
    assert.ok(found.kbd, 'the index does not list kbd')
  })
  const kbd = found.kbd
  if (!kbd) {
    finish(server)
    return
  }

  await step('the CLI under test is the pinned version', () => {
    const result = shadcn(['--version'])
    assert.equal(result.status, 0, result.text)
    const printed = result.text.split('\n').find((line) => /^\d+\.\d+\.\d+/.test(line.trim()))
    assert.equal(printed?.trim(), cliVersion, `printed:\n${result.text}`)
    note(`CLI version: ${cliVersion}`)
  })

  await step('a clean Vite project is created by shadcn init', () => {
    const result = shadcn([
      'init',
      '-t',
      'vite',
      '-b',
      'radix',
      '-p',
      'nova',
      '-y',
      '--no-monorepo',
      '-n',
      'sample',
      '-c',
      work,
    ])
    assert.equal(result.status, 0, result.text)
    for (const file of ['components.json', 'src/lib/utils.ts', 'src/index.css', 'package.json']) {
      assert.ok(existsSync(sampleFile(file)), `init did not create ${file}`)
    }
    assert.ok(!existsSync(kbdFile), 'the clean project must not contain kbd yet')
    const manifest = JSON.parse(readFileSync(sampleFile('package.json'), 'utf8')) as {
      dependencies: Record<string, string>
    }
    for (const name of ['react', 'tailwindcss', 'cn']) {
      note(`sample ${name}: ${manifest.dependencies[name] ?? 'not installed'}`)
    }
    note(
      `package manager: ${options.runner} ${run(options.runner, ['--version'], work).text.trim()}`,
    )
  })

  const utilsBefore = existsSync(utilsFile) ? sha(utilsFile) : ''

  await step('shadcn view reads the item from the URL', () => {
    const result = shadcn(['view', `${base}/kbd.json`, '-c', sample])
    assert.equal(result.status, 0, result.text)
    assert.match(result.text, /"name": "kbd"/)
  })

  await step('shadcn list reads the index', () => {
    const result = shadcn(['list', `${base}/registry.json`, '-c', sample])
    assert.equal(result.status, 0, result.text)
    assert.match(result.text, /kbd/)
  })

  await step('--dry-run reports what would be written and writes nothing', () => {
    const result = shadcn(['add', `${base}/kbd.json`, '--dry-run', '-c', sample])
    assert.equal(result.status, 0, result.text)
    assert.match(result.text, /kbd\.tsx\s+create/)
    assert.ok(!existsSync(kbdFile), 'a dry run wrote a file')
    assert.equal(git(['status', '--short']), '')
  })

  await step('add by URL installs the component, and only that', () => {
    const result = shadcn(['add', `${base}/kbd.json`, '-y', '-c', sample])
    assert.equal(result.status, 0, result.text)
    assert.ok(existsSync(kbdFile), 'src/components/ui/kbd.tsx was not created')
    assert.equal(readFileSync(kbdFile, 'utf8'), kbd.files[0]?.content, 'installed content differs')
    assert.equal(existsSync(utilsFile) ? sha(utilsFile) : '', utilsBefore, 'lib/utils.ts changed')
    const status = git(['status', '--short'])
    assert.equal(status, '?? src/components/ui/kbd.tsx', `unexpected changes:\n${status}`)
    const manifest = JSON.parse(readFileSync(sampleFile('package.json'), 'utf8')) as {
      dependencies: Record<string, string>
    }
    assert.ok(manifest.dependencies.cn, 'the cn package is not a dependency of the project')
    assert.ok(existsSync(sampleFile('node_modules', 'cn')), 'the cn package is not installed')
    assert.ok(
      requested.includes('/r/kbd.json') || options.baseUrl,
      'the CLI never asked for kbd.json',
    )
    note(`docs note printed by add: ${result.text.includes('Needs Tailwind') ? 'yes' : 'no'}`)
  })

  await step('the installed component type-checks and builds', () => {
    writeFileSync(
      sampleFile('src', 'App.tsx'),
      [
        'import { Kbd } from "@/components/ui/kbd"',
        '',
        'export function App() {',
        '  return (',
        '    <main className="p-6">',
        '      <p>',
        '        Press <Kbd data-testid="kbd">⌘K</Kbd> to search',
        '      </p>',
        '    </main>',
        '  )',
        '}',
        '',
        'export default App',
        '',
      ].join('\n'),
    )
    const result = inSample(['run', 'build'])
    assert.equal(result.status, 0, result.text.split('\n').slice(-30).join('\n'))
  })

  await step('the built page renders the component with its styling', async () => {
    const port = await freePort()
    const command = options.runner === 'pnpm' ? ['exec'] : ['exec', '--']
    const preview: ChildProcess = spawn(
      options.runner,
      [
        ...command,
        'vite',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort',
      ],
      { cwd: sample, env: childEnv, stdio: 'ignore', detached: true },
    )
    const stop = () => {
      if (preview.pid) {
        try {
          process.kill(-preview.pid)
        } catch {
          // already gone
        }
      }
    }
    try {
      const url = `http://127.0.0.1:${String(port)}/`
      for (let attempt = 0; ; attempt += 1) {
        const ready = await fetch(url).then(
          (response) => response.ok,
          () => false,
        )
        if (ready) break
        assert.ok(attempt < 60, 'vite preview did not start within 30 seconds')
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      const browser = await chromium.launch()
      try {
        const page = await browser.newPage()
        const problems: string[] = []
        page.on('pageerror', (error) => problems.push(error.message))
        page.on('console', (message) => {
          if (message.type() === 'error') problems.push(message.text())
        })
        await page.goto(url)
        const key = page.getByTestId('kbd')
        await key.waitFor({ state: 'visible' })
        assert.equal(await key.textContent(), '⌘K')
        const style = await key.evaluate((element) => {
          const computed = getComputedStyle(element)
          return {
            tag: element.tagName,
            height: computed.height,
            borderWidth: computed.borderTopWidth,
            borderColor: computed.borderTopColor,
            color: computed.color,
            background: computed.backgroundColor,
            font: computed.fontFamily,
          }
        })
        assert.equal(style.tag, 'KBD')
        assert.equal(style.height, '20px', 'h-5 was not generated: Tailwind did not scan the file')
        assert.equal(style.borderWidth, '1px')
        assert.notEqual(style.background, 'rgba(0, 0, 0, 0)', 'bg-muted resolved to transparent')
        assert.notEqual(style.borderColor, style.color, 'the base-layer border color is missing')
        assert.match(style.font, /mono/i)
        assert.deepEqual(problems, [], `the page logged errors:\n${problems.join('\n')}`)
        note(`rendered <kbd>: ${JSON.stringify(style)}`)
      } finally {
        await browser.close()
      }
    } finally {
      stop()
    }
  })

  // --- conflicts: nothing the user owns may change without --overwrite ---------------------

  await step('conflicts: an identical file is skipped', () => {
    resetSample()
    assert.equal(shadcn(['add', `${base}/kbd.json`, '-y', '-c', sample]).status, 0)
    const before = sha(kbdFile)
    const result = shadcn(['add', `${base}/kbd.json`, '-c', sample])
    assert.equal(result.status, 0)
    assert.match(result.text, /Skipped 1 file/)
    assert.equal(sha(kbdFile), before)
    note('identical re-add: skipped, exit 0')
  })

  await step('conflicts: a modified file is kept without --overwrite, exit code 0', () => {
    resetSample()
    assert.equal(shadcn(['add', `${base}/kbd.json`, '-y', '-c', sample]).status, 0)
    writeFileSync(kbdFile, `${readFileSync(kbdFile, 'utf8')}\n// my change\n`)
    const before = sha(kbdFile)
    for (const flags of [[], ['-y'], ['--dry-run'], ['--diff'], ['--view'], ['-y', '--dry-run']]) {
      const result = shadcn(['add', `${base}/kbd.json`, ...flags, '-c', sample])
      assert.equal(result.status, 0, `exit code for [${flags.join(' ')}]`)
      assert.equal(sha(kbdFile), before, `kbd.tsx changed with [${flags.join(' ')}]`)
      if (flags.length === 0 || flags.join(' ') === '-y') {
        assert.match(result.text, /already exists\. Would you like to overwrite\?/)
      }
      if (flags.includes('--dry-run')) assert.match(result.text, /overwrite/)
      if (flags.includes('--diff'))
        assert.match(result.text, /--- a\/src\/components\/ui\/kbd\.tsx/)
      note(`modified file, flags [${flags.join(' ') || 'none'}]: unchanged, exit 0`)
    }
    const overwrite = shadcn(['add', `${base}/kbd.json`, '-y', '--overwrite', '-c', sample])
    assert.equal(overwrite.status, 0, overwrite.text)
    assert.equal(readFileSync(kbdFile, 'utf8'), kbd.files[0]?.content)
    note('modified file, flags [-y --overwrite]: replaced')
  })

  await step("conflicts: shadcn's own kbd is kept, and replaced only with --overwrite", () => {
    resetSample()
    const official = shadcn(['add', 'kbd', '-y', '-c', sample])
    assert.equal(official.status, 0, official.text)
    const officialContent = readFileSync(kbdFile, 'utf8')
    assert.notEqual(officialContent, kbd.files[0]?.content)
    assert.match(officialContent, /KbdGroup/)
    const kept = shadcn(['add', `${base}/kbd.json`, '-y', '-c', sample])
    assert.equal(kept.status, 0)
    assert.equal(readFileSync(kbdFile, 'utf8'), officialContent, "shadcn's kbd was overwritten")
    const replaced = shadcn(['add', `${base}/kbd.json`, '-y', '--overwrite', '-c', sample])
    assert.equal(replaced.status, 0, replaced.text)
    assert.equal(readFileSync(kbdFile, 'utf8'), kbd.files[0]?.content)
    note("shadcn's own kbd present: kept without --overwrite, replaced with it")
  })

  await step('conflicts: a customised lib/utils.ts is never touched, even with --overwrite', () => {
    resetSample()
    writeFileSync(
      utilsFile,
      'import { cn } from "cn"\nexport { cn }\nexport const mine = 1 // my helper\n',
    )
    const before = sha(utilsFile)
    for (const flags of [['-y'], ['-y', '--overwrite']]) {
      const result = shadcn(['add', `${base}/kbd.json`, ...flags, '-c', sample])
      assert.equal(result.status, 0, result.text)
      assert.equal(sha(utilsFile), before, `lib/utils.ts changed with [${flags.join(' ')}]`)
    }
    note('customised lib/utils.ts: untouched, also with --overwrite')
  })

  // --- namespace and official tooling ----------------------------------------------------

  await step('the @hieuuilab namespace installs the component', () => {
    resetSample()
    const template = `${base}/{name}.json`
    const added = shadcn(['registry', 'add', `@hieuuilab=${template}`, '-c', sample])
    assert.equal(added.status, 0, added.text)
    const components = JSON.parse(readFileSync(sampleFile('components.json'), 'utf8')) as {
      registries: Record<string, string>
    }
    assert.equal(components.registries['@hieuuilab'], template)
    const search = shadcn(['search', '@hieuuilab', '-c', sample])
    assert.equal(search.status, 0, search.text)
    assert.match(search.text, /@hieuuilab\/kbd/)
    const result = shadcn(['add', '@hieuuilab/kbd', '-y', '-c', sample])
    assert.equal(result.status, 0, result.text)
    assert.equal(readFileSync(kbdFile, 'utf8'), kbd.files[0]?.content)
    note('namespace: registry add edits components.json; add @hieuuilab/kbd works')
  })

  await step('shadcn registry validate and shadcn build agree with the committed files', () => {
    const source = path.join(work, 'roundtrip')
    mkdirSync(source, { recursive: true })
    const sourceIndex: unknown = JSON.parse(
      readFileSync(path.join(repoRoot, 'public/r/registry.json'), 'utf8'),
    )
    writeFileSync(path.join(source, 'registry.json'), JSON.stringify(sourceIndex, null, 2))
    for (const file of kbd.files) {
      const target = path.join(source, file.path)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, file.content)
    }
    const validated = shadcn([
      'registry',
      'validate',
      path.join(source, 'registry.json'),
      '-c',
      source,
    ])
    assert.equal(validated.status, 0, validated.text)
    assert.match(validated.text, /Registry is valid/)
    const built = shadcn([
      'build',
      path.join(source, 'registry.json'),
      '-o',
      path.join(source, 'out'),
      '-c',
      source,
    ])
    assert.equal(built.status, 0, built.text)
    for (const name of ['kbd.json', 'registry.json']) {
      const official = readFileSync(path.join(source, 'out', name), 'utf8').trim()
      const ours = readFileSync(path.join(repoRoot, 'public/r', name), 'utf8').trim()
      assert.equal(official, ours, `shadcn build wrote a different ${name} than the committed one`)
    }
    note('shadcn registry validate: valid; shadcn build output equals the committed files')
  })

  finish(server)
}

function finish(server: { close: () => void } | undefined) {
  server?.close()
  console.log(`\n${String(passed)} passed, ${String(failures.length)} failed\n`)
  if (observed.length > 0)
    console.log(`observed:\n${observed.map((line) => `  - ${line}`).join('\n')}\n`)
  if (options.keep) console.log(`kept: ${work}`)
  else rmSync(work, { recursive: true, force: true })
  if (failures.length > 0) {
    console.log(
      `failures:\n${failures.map((line) => `  - ${line.split('\n')[0] ?? ''}`).join('\n')}`,
    )
    process.exit(1)
  }
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error(error)
  if (!options.keep) rmSync(work, { recursive: true, force: true })
  process.exit(1)
})
