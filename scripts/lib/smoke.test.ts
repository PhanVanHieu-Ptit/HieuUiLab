import { execFile } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assetsIn, parseExpectedHeaders } from './smoke-checks.ts'
import {
  readVercelJson,
  serveDirectory,
  type FallbackMode,
  type StaticServer,
} from './static-server.ts'

// The smoke script is run as a command, as a person or CI runs it, against throwaway servers that
// behave like a host done right and like a host done wrong in the two ways that matter for a
// single-page app. A check that never fails proves nothing, so each wrong host must fail the
// check that exists for it.

const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const script = path.join(repoRoot, 'scripts', 'smoke-deployment.ts')
const vercelJson = readVercelJson(repoRoot)

const INDEX_HTML =
  '<!doctype html><html><head><link rel="icon" href="/favicon.svg" />' +
  '<script type="module" crossorigin src="/assets/index-1.js"></script>' +
  '<link rel="stylesheet" crossorigin href="/assets/index-1.css" />' +
  '</head><body><div id="root"></div></body></html>'

let dist: string
const servers: StaticServer[] = []
const raw: Server[] = []

beforeAll(() => {
  dist = mkdtempSync(path.join(os.tmpdir(), 'smoke-dist-'))
  mkdirSync(path.join(dist, 'assets'))
  mkdirSync(path.join(dist, 'r'))
  writeFileSync(path.join(dist, 'index.html'), INDEX_HTML)
  writeFileSync(path.join(dist, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
  writeFileSync(path.join(dist, 'assets', 'index-1.js'), 'export {}')
  writeFileSync(path.join(dist, 'assets', 'index-1.css'), 'body{}')
  writeFileSync(path.join(dist, 'r', 'registry.json'), '{"items":[]}')
  writeFileSync(path.join(dist, 'r', 'kbd.json'), '{"name":"kbd"}')
})

afterAll(async () => {
  await Promise.all(servers.map((server) => server.close()))
  await Promise.all(
    raw.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections()
          server.close(() => {
            resolve()
          })
        }),
    ),
  )
  rmSync(dist, { recursive: true, force: true })
})

async function host(mode: FallbackMode, config = vercelJson): Promise<string> {
  const server = await serveDirectory(dist, mode, config)
  servers.push(server)
  return server.url
}

interface Run {
  code: number
  output: string
}

function smoke(args: string[], env: Record<string, string> = {}): Promise<Run> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [script, ...args],
      { env: { ...process.env, VERCEL_AUTOMATION_BYPASS_SECRET: '', ...env }, timeout: 60_000 },
      (error, stdout, stderr) => {
        const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1
        resolve({ code, output: stdout + stderr })
      },
    )
  })
}

describe('the checks', () => {
  it('pass for a host that applies vercel.json', async () => {
    const run = await smoke([await host('vercel')])
    expect(run.output).toContain('ok    home page')
    expect(run.output).toContain('ok    assets: 2 files')
    expect(run.output).toContain('ok    nested routes')
    expect(run.output).toContain('ok    missing script: 404')
    expect(run.output).toContain('ok    registry files')
    expect(run.output).toContain('ok    headers')
    expect(run.output).toContain('note  unknown URL: 200 with the app')
    expect(run.code).toBe(0)
  })

  it('fail for a host that answers a missing script with index.html', async () => {
    const run = await smoke([await host('catch-all')])
    expect(run.output).toMatch(
      /FAIL {2}missing script: 200 text\/html.*Expected a JavaScript module/,
    )
    expect(run.output).toMatch(/FAIL {2}missing registry file: 200/)
    // It does serve nested URLs, and the files that exist: those checks still pass.
    expect(run.output).toContain('ok    nested routes')
    expect(run.output).toContain('ok    assets')
    expect(run.code).toBe(1)
  })

  it('fail for a host with no fallback, on the nested URLs a refresh would load', async () => {
    const run = await smoke([await host('none')])
    expect(run.output).toMatch(
      /FAIL {2}nested routes: 12 of 12 are wrong: \/components\/button: 404/,
    )
    expect(run.output).toContain('ok    missing script: 404')
    expect(run.code).toBe(1)
  })

  it('fail when the headers in vercel.json are not sent', async () => {
    const rewritesOnly = JSON.stringify({
      rewrites: (JSON.parse(vercelJson) as { rewrites: unknown }).rewrites,
    })
    const run = await smoke([await host('vercel', rewritesOnly)])
    expect(run.output).toMatch(/FAIL {2}headers: .*X-Content-Type-Options is missing/)
    // Four headers on the page and five on the asset; the line names the first three.
    expect(run.output).toContain('and 6 more')
    expect(run.code).toBe(1)
  })
})

describe('a protected deployment', () => {
  const secret = 'bypass-secret-0123456789'

  async function protectedHost(): Promise<string> {
    const server = createServer((request, response) => {
      if (request.headers['x-vercel-protection-bypass'] !== secret) {
        response.writeHead(401, { 'content-type': 'text/html' }).end('Authentication Required')
        return
      }
      response.writeHead(200, { 'content-type': 'text/html' }).end(INDEX_HTML)
    })
    raw.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    return `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`
  }

  it('is reported with what to set, and the other checks do not run', async () => {
    const run = await smoke([await protectedHost()])
    expect(run.output).toMatch(/FAIL {2}home page: 401 text\/html: the deployment is protected/)
    expect(run.output).toContain('VERCEL_AUTOMATION_BYPASS_SECRET')
    expect(run.code).toBe(1)
  })

  it('is let in by the bypass secret, which is never printed', async () => {
    const run = await smoke([await protectedHost()], { VERCEL_AUTOMATION_BYPASS_SECRET: secret })
    expect(run.output).toContain('ok    home page')
    expect(run.output).toContain('(with the bypass secret)')
    expect(run.output).not.toContain(secret)
  })
})

describe('the command', () => {
  it('refuses an address that is not https unless it is the local machine', async () => {
    const run = await smoke(['http://deploy.example.com'])
    expect(run.output).toContain('FAIL  address: http://deploy.example.com is not https')
    expect(run.code).toBe(1)
  })

  it('says how to use it when there is no address', async () => {
    const run = await smoke([])
    expect(run.output).toContain('Usage: pnpm deploy:smoke')
    expect(run.code).toBe(2)
  })
})

describe('what it reads from vercel.json', () => {
  it('is the headers for every path and for /assets/', () => {
    const expected = parseExpectedHeaders(vercelJson)
    expect(expected.all).toMatchObject({ 'X-Content-Type-Options': 'nosniff' })
    expect(expected.assets['Cache-Control']).toContain('immutable')
  })

  it('finds the files index.html loads, once each', () => {
    expect(assetsIn(INDEX_HTML + INDEX_HTML)).toEqual(['/assets/index-1.js', '/assets/index-1.css'])
  })
})
