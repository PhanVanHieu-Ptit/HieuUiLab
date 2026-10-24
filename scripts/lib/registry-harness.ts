/*
 * What the registry install test and the registry failure test share: running the pinned shadcn CLI
 * the way a script or CI job does (no stdin, so a prompt cannot be answered), a git-initialised sample
 * project made by `shadcn init`, a local registry server in a child process, and a small reporter.
 *
 * Only erasable TypeScript, so Node runs the scripts that import this directly.
 */
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export type Runner = 'pnpm' | 'npm'

export interface Options {
  runner: Runner
  baseUrl: string | undefined
  keep: boolean
  show: boolean
}

export interface Result {
  status: number | null
  text: string
  /** True when the command was killed for running past its timeout. */
  timedOut: boolean
}

/** One answer of the routes server. `body` is sent as is, so it may be deliberately malformed. */
export interface Route {
  status: number
  contentType?: string
  body: string
}

export type Routes = Record<string, Route>

export const repoRoot = path.resolve(import.meta.dirname, '..', '..')

/** Flags every script takes are --runner and --keep; the others are opted into per script. */
export function parseOptions(
  argv: string[],
  allowed: readonly ('--base-url' | '--show')[],
): Options {
  const options: Options = { runner: 'pnpm', baseUrl: undefined, keep: false, show: false }
  for (let position = 0; position < argv.length; position += 1) {
    const flag = argv[position]
    if (flag === '--runner') {
      const value = argv[(position += 1)]
      if (value !== 'pnpm' && value !== 'npm') throw new Error('--runner must be pnpm or npm')
      options.runner = value
    } else if (flag === '--keep') {
      options.keep = true
    } else if (flag === '--base-url' && allowed.includes(flag)) {
      options.baseUrl = argv[(position += 1)]?.replace(/\/+$/, '')
    } else if (flag === '--show' && allowed.includes(flag)) {
      options.show = true
    } else {
      throw new Error(`unknown argument ${String(flag)}`)
    }
  }
  return options
}

/** The version under test is the `shadcn` pin in package.json, which must be exact. */
export function pinnedCliVersion(): string {
  const manifest = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
    devDependencies: Record<string, string>
  }
  const version = manifest.devDependencies.shadcn
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('package.json must pin shadcn to an exact version')
  }
  return version
}

const ESC = String.fromCharCode(27)
const ansi = new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, 'g')
export const strip = (text: string) => text.replace(ansi, '')

export const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')

/** The environment children run in: no npm_* variables leaked from the `pnpm run` that started us. */
export const childEnv: NodeJS.ProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_')),
)
childEnv.NO_COLOR = '1'
delete childEnv.CI
delete childEnv.FORCE_COLOR

/** Runs a command with no stdin, so a prompt cannot be answered: what a CI job or script sees. */
export function run(
  command: string,
  args: string[],
  cwd: string,
  settings: { timeout?: number; env?: Record<string, string> } = {},
): Result {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...childEnv, ...settings.env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: settings.timeout ?? 600_000,
    maxBuffer: 64 * 1024 * 1024,
  })
  const timedOut = (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT'
  if (result.error && !timedOut) throw result.error
  return { status: result.status, text: strip(`${result.stdout}${result.stderr}`), timedOut }
}

export function freePort(): Promise<number> {
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

// --- local registry servers ------------------------------------------------------------------

/**
 * The servers are separate processes, not servers in this one: the CLI is run with spawnSync, which
 * blocks this process's event loop, so a server living here could never answer the CLI's requests.
 * Each prints `PORT <n>` once listening and appends the raw path of every request to a log file. A
 * file, not stdout: this process only reads its children's pipes when its event loop runs, which it
 * does not while a CLI command is running, so a file is the only thing it can read straight after.
 */
const directoryServer = `
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const root = process.argv[1]
const logFile = process.argv[2]
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname
  fs.appendFileSync(logFile, request.url + '\\n')
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

/** Answers from a JSON file of routes that is read on every request, so a test can change it. */
const routesServer = `
const http = require('node:http')
const fs = require('node:fs')
const routesFile = process.argv[1]
const logFile = process.argv[2]
const server = http.createServer((request, response) => {
  fs.appendFileSync(logFile, request.url + '\\n')
  const pathname = request.url.split('?')[0]
  const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8'))
  const route = routes[pathname]
  if (!route) {
    response.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
    return
  }
  response.writeHead(route.status, { 'content-type': route.contentType || 'application/json' }).end(route.body)
})
server.listen(0, '127.0.0.1', () => console.log('PORT ' + server.address().port))
`

export interface RunningServer {
  /** `http://127.0.0.1:<port>` */
  origin: string
  /** Every request path the server has seen since it started or since `clearRequests`. */
  requests: () => string[]
  clearRequests: () => void
  close: () => void
}

function startServer(script: string, argument: string, logFile: string): Promise<RunningServer> {
  writeFileSync(logFile, '')
  const child = spawn(process.execPath, ['-e', script, argument, logFile], {
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return new Promise((resolve, reject) => {
    let buffered = ''
    child.once('error', reject)
    child.stdout.on('data', (chunk: Buffer) => {
      buffered += chunk.toString()
      const port = /^PORT (\d+)$/m.exec(buffered)?.[1]
      if (!port) return
      resolve({
        origin: `http://127.0.0.1:${port}`,
        requests: () =>
          existsSync(logFile)
            ? readFileSync(logFile, 'utf8')
                .split('\n')
                .filter((line) => line !== '')
            : [],
        clearRequests: () => {
          writeFileSync(logFile, '')
        },
        close: () => child.kill(),
      })
    })
  })
}

/** Serves the files of one directory at /r/<name>.json, and nothing else. */
export const serveDirectory = (root: string, logFile: string) =>
  startServer(directoryServer, root, logFile)

/** Serves what a routes file says; the file is read again on every request. */
export const serveRoutes = (routesFile: string, logFile: string) =>
  startServer(routesServer, routesFile, logFile)

// --- the project under test and the reporter -------------------------------------------------

export function createHarness(options: Options, prefix: string) {
  const cliVersion = pinnedCliVersion()
  const work = mkdtempSync(path.join(os.tmpdir(), prefix))
  const sample = path.join(work, 'sample')
  const sampleFile = (...parts: string[]) => path.join(sample, ...parts)

  /** Runs the shadcn CLI through the chosen runner, from outside the project unless told otherwise. */
  function shadcn(
    args: string[],
    settings: { cwd?: string; timeout?: number; env?: Record<string, string> } = {},
  ): Result {
    const cwd = settings.cwd ?? work
    const rest = { ...settings }
    delete rest.cwd
    return options.runner === 'pnpm'
      ? run('pnpm', ['dlx', `shadcn@${cliVersion}`, ...args], cwd, rest)
      : run('npx', ['--yes', `shadcn@${cliVersion}`, ...args], cwd, rest)
  }

  /** Runs a package script or binary in the sample with the chosen package manager. */
  const inSample = (args: string[]) => run(options.runner, args, sample)

  const git = (args: string[]) => run('git', ['-C', sample, ...args], work).text.trim()

  /** Back to the state `shadcn init` left: tracked files restored, anything the CLI added removed. */
  function resetSample() {
    git(['reset', '-q', '--hard'])
    git(['clean', '-fdq'])
  }

  /** `shadcn init` for a clean Vite project: fully non-interactive, and it git-initialises it. */
  const initSample = () =>
    shadcn([
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

  const note = (text: string) => observed.push(text)

  function cleanUp() {
    if (!options.keep) rmSync(work, { recursive: true, force: true })
  }

  /** Prints the summary, removes the temporary directory, and exits 1 if any step failed. */
  function finish(servers: (RunningServer | undefined)[]): never {
    for (const server of servers) server?.close()
    console.log(`\n${String(passed)} passed, ${String(failures.length)} failed\n`)
    if (observed.length > 0)
      console.log(`observed:\n${observed.map((line) => `  - ${line}`).join('\n')}\n`)
    if (options.keep) console.log(`kept: ${work}`)
    cleanUp()
    if (failures.length > 0) {
      console.log(
        `failures:\n${failures.map((line) => `  - ${line.split('\n')[0] ?? ''}`).join('\n')}`,
      )
      process.exit(1)
    }
    process.exit(0)
  }

  /** For `main().catch(...)`: report, clean up, exit 1. */
  function crash(error: unknown): never {
    console.error(error)
    cleanUp()
    process.exit(1)
  }

  return {
    cliVersion,
    work,
    sample,
    sampleFile,
    shadcn,
    inSample,
    git,
    resetSample,
    initSample,
    step,
    note,
    finish,
    crash,
  }
}

export type Harness = ReturnType<typeof createHarness>
