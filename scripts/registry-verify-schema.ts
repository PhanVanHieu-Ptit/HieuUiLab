/*
 * Compares the shadcn JSON Schemas vendored in src/registry/shadcn/schema with the ones shadcn
 * publishes today. Run it when raising the tested CLI version, or on a schedule: it is not part of
 * `pnpm test`, so a PR never fails because ui.shadcn.com changed or was unreachable.
 *
 *   pnpm registry:verify-schema
 *
 * Exit code 0: the published files are byte-identical to the vendored ones. 1: they differ, or a
 * download failed. To adopt a change, download the files into the schema folder, update the hashes
 * and date in lock.json, and run `pnpm registry:build` and `pnpm registry:install-test`.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

interface Lock {
  fetchedAt: string
  cli: string
  schemas: Record<string, { url: string; sha256: string }>
}

const folder = path.resolve(import.meta.dirname, '..', 'src', 'registry', 'shadcn', 'schema')
const lock = JSON.parse(readFileSync(path.join(folder, 'lock.json'), 'utf8')) as Lock

const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')

let drifted = false

for (const [file, expected] of Object.entries(lock.schemas)) {
  const vendored = sha256(readFileSync(path.join(folder, file)))
  if (vendored !== expected.sha256) {
    console.log(`DRIFT  ${file}: the vendored file does not match lock.json (edited by hand?)`)
    drifted = true
    continue
  }
  try {
    const response = await fetch(expected.url)
    if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
    const live = sha256(new Uint8Array(await response.arrayBuffer()))
    if (live === expected.sha256) {
      console.log(`same   ${file}  (${expected.url}, vendored ${lock.fetchedAt})`)
    } else {
      console.log(`DRIFT  ${file}: ${expected.url} has changed since ${lock.fetchedAt}`)
      drifted = true
    }
  } catch (error) {
    console.log(`ERROR  ${file}: could not download ${expected.url}: ${String(error)}`)
    drifted = true
  }
}

process.exit(drifted ? 1 : 0)
