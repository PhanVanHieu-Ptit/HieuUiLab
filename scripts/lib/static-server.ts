/*
 * A small static server over a build folder, for checking the deployment scripts and the
 * single-page-app fallback without a host. Its default mode applies vercel.json the way Vercel
 * reads it: the file is compiled with Vercel's own route compiler (@vercel/routing-utils), then a
 * request gets the headers the file lists, a file if one exists, and otherwise the rewrite.
 *
 *   vercel     vercel.json's headers and rewrites, applied after the file lookup (what the host should do)
 *   catch-all  every unknown URL gets index.html, a missing script included (the common mistake)
 *   none       no fallback: a nested URL that is not a file is a 404 (a host with no SPA setup)
 *
 * It is a model of the configuration, not of Vercel: it says what vercel.json asks for, and
 * scripts/smoke-deployment.ts against a real URL says what the host does.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'

import { getTransformedRoutes, type GetRoutesProps, type Route } from '@vercel/routing-utils'

export type FallbackMode = 'vercel' | 'catch-all' | 'none'

export interface StaticServer {
  /** For example http://127.0.0.1:41234, with no trailing slash. */
  url: string
  close(): Promise<void>
}

const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

type RouteWithSrc = Extract<Route, { src: string }>

/** vercel.json's rewrites and headers, compiled into Vercel's route objects. */
export function compileVercelConfig(vercelJson: string): RouteWithSrc[] {
  const config = JSON.parse(vercelJson) as Pick<GetRoutesProps, 'rewrites' | 'headers'>
  const { routes, error } = getTransformedRoutes({
    rewrites: config.rewrites ?? [],
    headers: config.headers ?? [],
  })
  if (error) throw new Error(`vercel.json does not compile: ${error.message}`)
  return (routes ?? []).filter((route): route is RouteWithSrc => 'src' in route)
}

function fileFor(root: string, urlPath: string): string | undefined {
  let decoded: string
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return undefined
  }
  const file = path.join(root, decoded === '/' ? 'index.html' : decoded)
  if (file !== root && !file.startsWith(root + path.sep)) return undefined
  return existsSync(file) && statSync(file).isFile() ? file : undefined
}

export async function serveDirectory(
  directory: string,
  mode: FallbackMode,
  vercelJson: string,
  port = 0,
): Promise<StaticServer> {
  const root = path.resolve(directory)
  const routes = compileVercelConfig(vercelJson)
  const headerRoutes = routes.filter((route) => route.headers !== undefined)
  const fallbackRoute = routes.find((route) => route.dest === '/index.html')

  const server = createServer((request, response) => {
    const urlPath = new URL(request.url ?? '/', 'http://localhost').pathname
    const headers: Record<string, string> = {}
    if (mode === 'vercel') {
      for (const route of headerRoutes) {
        if (new RegExp(route.src).test(urlPath)) Object.assign(headers, route.headers)
      }
    }

    let file = fileFor(root, urlPath)
    let status = 200
    if (file === undefined) {
      const rewritten =
        mode === 'catch-all' ||
        (mode === 'vercel' &&
          fallbackRoute !== undefined &&
          new RegExp(fallbackRoute.src).test(urlPath))
      if (rewritten) file = fileFor(root, '/')
    }
    if (file === undefined) {
      status = 404
      response.writeHead(status, { ...headers, 'content-type': 'text/plain; charset=utf-8' })
      response.end('404: NOT_FOUND')
      return
    }
    response.writeHead(status, {
      ...headers,
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).pipe(response)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  const { port: bound } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${String(bound)}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          resolve()
        })
        server.closeAllConnections()
      }),
  }
}

/** vercel.json from the repository root, for a script that serves the real file. */
export function readVercelJson(repoRoot: string): string {
  return readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8')
}
