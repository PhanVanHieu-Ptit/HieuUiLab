/*
 * What the real shadcn CLI does when the registry or the input is bad: an invalid name, a missing
 * file, a malformed item, an unsafe path, a dependency that cannot be installed, an unset registry
 * variable. Needs network (the npm registry, for the CLI itself and for one dependency case).
 *
 *   pnpm registry:failure-test                       pnpm runner (default)
 *   pnpm registry:failure-test --runner npm          npx runner
 *   pnpm registry:failure-test --show                also print what the CLI printed for every case
 *   pnpm registry:failure-test --keep                keep the temporary project and print its path
 *
 * The install test covers the good path and conflicts; this covers what is left. Every case serves a
 * crafted item from a local server, so nothing here depends on a hosted registry. The expected
 * messages are the ones the pinned CLI printed when this was written; `--show` prints them again
 * after a CLI upgrade, and src/docs/content/shadcn-registry.md quotes them.
 */
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  createHarness,
  freePort,
  parseOptions,
  serveRoutes,
  type Result,
  type Routes,
} from './lib/registry-harness.ts'

const options = parseOptions(process.argv.slice(2), ['--show'])
const h = createHarness(options, 'hieu-registry-failure-')

interface Observation extends Result {
  /** `git status --short` lines of the sample after the command, not counting components.json. */
  changes: string[]
  /** Sentinel files outside the sample (or an injected command's file) that exist afterwards. */
  outside: string[]
  /** The distinct request paths the local server saw during the command (the CLI asks twice). */
  requests: string[]
}

interface Settings {
  cwd?: string
  timeout?: number
  env?: Record<string, string>
  /** Written to components.json before the command runs. */
  registries?: Record<string, string>
}

const NOTHING_CHANGED: string[] = []

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function main() {
  const routesFile = path.join(h.work, 'routes.json')
  writeFileSync(routesFile, '{}')
  const server = await serveRoutes(routesFile, path.join(h.work, 'requests.log'))
  const origin = server.origin

  console.log('registry failure test')
  console.log(`  runner   ${options.runner}`)
  console.log(`  cli      shadcn@${h.cliVersion}`)
  console.log(`  node     ${process.version}`)
  console.log(`  registry ${origin} (local server with crafted answers)`)
  console.log(`  project  ${h.sample}\n`)

  // Files an unsafe path or an injected command would create. The one in the home directory has a
  // unique name and is removed whether or not the CLI wrote it.
  const homeSentinel = path.join(os.homedir(), 'hieuuilab-failure-test-home.tsx')
  const sentinels = [
    path.join(h.work, 'escape-relative.tsx'),
    path.join(h.work, 'escape-absolute.tsx'),
    path.join(h.work, 'escape-path.tsx'),
    path.join(h.work, 'pwned'),
    homeSentinel,
  ]
  const clearSentinels = () => {
    for (const sentinel of sentinels) rmSync(sentinel, { force: true })
  }

  // --- what the local server answers ------------------------------------------------------

  const fixtureFile = (name: string, over: Record<string, unknown> = {}) => ({
    path: `registry/ui/${name}.tsx`,
    type: 'registry:ui',
    content: 'export const Fixture = () => null\n',
    ...over,
  })
  const item = (name: string, over: Record<string, unknown> = {}) => ({
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:ui',
    files: [fixtureFile(name)],
    ...over,
  })
  const itemRoute = (name: string, value: unknown): Routes => ({
    [`/r/${name}.json`]: { status: 200, body: JSON.stringify(value) },
  })
  const statuses = [401, 403, 404, 410, 500]
  const statusRoutes: Routes = Object.fromEntries(
    statuses.map((status) => [
      `/r/status-${String(status)}.json`,
      { status, contentType: 'text/plain', body: 'x' },
    ]),
  )
  writeFileSync(
    routesFile,
    JSON.stringify({
      ...statusRoutes,
      ...itemRoute('fixture', item('fixture')),
      ...itemRoute(
        'no-content',
        item('no-content', {
          files: [{ path: 'registry/ui/no-content.tsx', type: 'registry:ui' }],
        }),
      ),
      ...itemRoute('empty-files', item('empty-files', { files: [] })),
      ...itemRoute(
        'needs-missing',
        item('needs-missing', { registryDependencies: [`${origin}/r/does-not-exist.json`] }),
      ),
      '/r/not-json.json': { status: 200, contentType: 'text/plain', body: 'this is not json' },
      '/r/html.json': {
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body>Not found</body></html>',
      },
      ...itemRoute('unknown-type', item('unknown-type', { type: 'registry:nope' })),
      ...itemRoute('files-string', item('files-string', { files: 'registry/ui/x.tsx' })),
      ...itemRoute('no-name', { ...item('x'), name: undefined }),
      ...itemRoute('extra-key', item('extra-key', { author: 'someone', surprise: true })),
      ...itemRoute(
        'target-relative',
        item('target-relative', {
          files: [fixtureFile('m', { target: '../escape-relative.tsx' })],
        }),
      ),
      ...itemRoute(
        'target-absolute',
        item('target-absolute', {
          files: [fixtureFile('m', { target: path.join(h.work, 'escape-absolute.tsx') })],
        }),
      ),
      ...itemRoute(
        'target-home',
        item('target-home', {
          files: [fixtureFile('m', { target: '~/hieuuilab-failure-test-home.tsx' })],
        }),
      ),
      ...itemRoute(
        'path-relative',
        item('path-relative', { files: [fixtureFile('m', { path: '../../escape-path.tsx' })] }),
      ),
      ...itemRoute(
        'dep-option',
        item('dep-option', { dependencies: ['--registry=http://127.0.0.1:1'] }),
      ),
      ...itemRoute(
        'dep-missing',
        item('dep-missing', { dependencies: ['hieuuilab-no-such-package-4f9c1e7a2b'] }),
      ),
    }),
  )

  // --- running one command ----------------------------------------------------------------

  function setRegistries(registries: Record<string, string>) {
    const file = h.sampleFile('components.json')
    const config = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    config.registries = registries
    writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`)
  }

  /** Puts the sample back as `shadcn init` left it, runs one CLI command, and records what happened. */
  function attempt(label: string, args: string[], settings: Settings = {}): Observation {
    h.resetSample()
    clearSentinels()
    if (settings.registries) setRegistries(settings.registries)
    server.clearRequests()
    const result = h.shadcn(args, settings)
    const observation: Observation = {
      ...result,
      changes: h
        .git(['status', '--short'])
        .split('\n')
        // git() trims its output, which also strips the leading space of the first status line.
        .filter((line) => line !== '' && line.trim() !== 'M components.json'),
      outside: sentinels.filter((sentinel) => existsSync(sentinel)),
      requests: [...new Set(server.requests())],
    }
    clearSentinels()
    if (options.show) {
      console.log(
        [
          `--- ${label}`,
          `$ shadcn ${args.join(' ')}`,
          `exit ${String(result.status)}${result.timedOut ? ' (timed out)' : ''}`,
          result.text.trim().replace(/^/gm, '  | '),
          `changes: ${observation.changes.join(', ') || '(none)'}`,
          `outside: ${observation.outside.join(', ') || '(none)'}`,
          `requests: ${observation.requests.join(' ') || '(none)'}`,
          '',
        ].join('\n'),
      )
    }
    return observation
  }

  /** The command failed with exit code 1, said `message`, and changed nothing anywhere. */
  function expectRefused(observation: Observation, message: RegExp) {
    assert.equal(observation.status, 1, `exit code\n${observation.text}`)
    assert.match(observation.text, message)
    assert.deepEqual(observation.changes, NOTHING_CHANGED, 'the project changed')
    assert.deepEqual(observation.outside, [], 'a file appeared outside the project')
  }

  /** The command exited 0 and left the project exactly as it was. */
  function expectSilentNoOp(observation: Observation) {
    assert.equal(observation.status, 0, `exit code\n${observation.text}`)
    assert.deepEqual(observation.changes, NOTHING_CHANGED, 'the project changed')
    assert.doesNotMatch(observation.text, /Created \d+ file/)
  }

  const itemUrl = (name: string) => `${origin}/r/${name}.json`
  const add = (name: string, ...flags: string[]) => ['add', itemUrl(name), ...flags, '-c', h.sample]
  const fixtureContent = 'export const Fixture = () => null\n'

  // --- the project and a control ----------------------------------------------------------

  await h.step('a clean Vite project is created by shadcn init', () => {
    const result = h.initSample()
    assert.equal(result.status, 0, result.text)
  })

  await h.step('control: a well-formed item from the local server installs', () => {
    const observation = attempt('control', add('fixture', '-y'))
    assert.equal(observation.status, 0, observation.text)
    assert.deepEqual(observation.changes, ['?? src/components/ui/fixture.tsx'])
    assert.equal(
      readFileSync(h.sampleFile('src', 'components', 'ui', 'fixture.tsx'), 'utf8'),
      fixtureContent,
    )
    assert.ok(observation.requests.includes('/r/fixture.json'), 'the CLI never asked for the item')
  })

  // --- invalid names ----------------------------------------------------------------------

  const namespace = { '@hieuuilab': `${origin}/r/{name}.json` }

  await h.step('invalid name: a name that is not kebab-case is a 404 from the server', () => {
    const observation = attempt(
      'Not-Kebab',
      ['add', '@hieuuilab/Not-Kebab', '-y', '-c', h.sample],
      { registries: namespace },
    )
    expectRefused(observation, /The item at .*\/r\/Not-Kebab\.json was not found/)
    assert.deepEqual(observation.requests, ['/r/Not-Kebab.json'])
  })

  await h.step('invalid name: ../ in a name is not sanitised, and stays on the same host', () => {
    const observation = attempt(
      'traversal in the name',
      ['add', '@hieuuilab/../../x', '-y', '-c', h.sample],
      { registries: namespace },
    )
    expectRefused(observation, /The item at .*\/x\.json was not found/)
    assert.deepEqual(observation.requests, ['/x.json'])
    h.note('a name is put into the registry URL unchanged: @hieuuilab/../../x asked for /x.json')
  })

  await h.step('invalid name: shell metacharacters stay one name, no command runs', () => {
    const observation = attempt(
      'shell metacharacters',
      ['add', '@hieuuilab/kbd; touch pwned', '-y', '-c', h.sample],
      { registries: namespace },
    )
    expectRefused(observation, /was not found/)
    assert.equal(observation.requests.length, 1)
    assert.match(observation.requests[0] ?? '', /^\/r\/kbd;(%20| )touch(%20| )pwned\.json$/)
    assert.ok(!existsSync(h.sampleFile('pwned')), 'a command ran in the project')
  })

  await h.step('invalid name: a namespace that is not configured is named in the error', () => {
    const observation = attempt('unknown namespace', ['add', '@unknown/kbd', '-y', '-c', h.sample])
    expectRefused(
      observation,
      /Unknown registry "@unknown"\. Make sure it is defined under "registries"/,
    )
    assert.deepEqual(observation.requests, [])
  })

  await h.step('invalid name: a registry URL without {name} is refused and not saved', () => {
    const observation = attempt('registry add without {name}', [
      'registry',
      'add',
      `@nope=${origin}/r/fixed.json`,
      '-c',
      h.sample,
    ])
    expectRefused(observation, /URL must include \{name\} placeholder/)
    const config = JSON.parse(readFileSync(h.sampleFile('components.json'), 'utf8')) as {
      registries?: Record<string, string>
    }
    assert.equal(config.registries?.['@nope'], undefined)
  })

  // --- missing files and bad responses ----------------------------------------------------

  const statusMessages: [number, RegExp][] = [
    [401, /You are not authorized to access the item at .*status-401\.json/],
    [403, /You are not authorized to access the item at .*status-403\.json/],
    [404, /The item at .*status-404\.json was not found/],
    [410, /The item at .*status-410\.json is no longer available/],
    [500, /Failed to fetch from registry \(500\): .*status-500\.json/],
  ]
  for (const [status, message] of statusMessages) {
    await h.step(`missing: HTTP ${String(status)} from the item URL is reported`, () => {
      expectRefused(
        attempt(`HTTP ${String(status)}`, add(`status-${String(status)}`, '-y')),
        message,
      )
    })
  }

  await h.step('missing: a registry dependency that does not exist stops the install', () => {
    expectRefused(
      attempt('missing registryDependency', add('needs-missing', '-y')),
      /The item at .*does-not-exist\.json was not found/,
    )
  })

  await h.step('missing: a local file that does not exist', () => {
    const observation = attempt('missing local file', [
      'add',
      './missing.json',
      '-y',
      '-c',
      h.sample,
    ])
    expectRefused(observation, /Failed to read local registry file: \.\/missing\.json/)
    assert.match(observation.text, /ENOENT: no such file or directory/)
  })

  await h.step('missing: a server that is not running', async () => {
    const closed = await freePort()
    const observation = attempt('connection refused', [
      'add',
      `http://127.0.0.1:${String(closed)}/r/fixture.json`,
      '-y',
      '-c',
      h.sample,
    ])
    expectRefused(observation, /Request to .*fixture\.json failed, reason: connect ECONNREFUSED/)
  })

  await h.step('missing: a file entry without content installs nothing and exits 0', () => {
    const observation = attempt('file without content', add('no-content', '-y'))
    expectSilentNoOp(observation)
    assert.match(observation.text, /No files updated\./)
    h.note('a file entry without content: exit 0, "No files updated."')
  })

  await h.step('missing: an empty file list installs nothing and exits 0', () => {
    const observation = attempt('empty file list', add('empty-files', '-y'))
    expectSilentNoOp(observation)
    h.note('an empty file list: exit 0, nothing printed after "Checking registry."')
  })

  // --- malformed manifests ----------------------------------------------------------------

  await h.step('malformed: a 200 answer that is not JSON', () => {
    expectRefused(
      attempt('not JSON', add('not-json', '-y')),
      /Unexpected token 'h', "this is not json" is not valid JSON/,
    )
  })

  await h.step('malformed: a 200 answer that is an HTML page, as a wrong host often gives', () => {
    expectRefused(
      attempt('HTML page', add('html', '-y')),
      /Unexpected token '<', "<!doctype "\.\.\. is not valid JSON/,
    )
  })

  const schemaCases: [name: string, message: RegExp][] = [
    [
      'unknown-type',
      /Failed to parse registry item: .*unknown-type\.json\s+- type: Invalid discriminator value/,
    ],
    [
      'files-string',
      /Failed to parse registry item: .*files-string\.json\s+- files: Invalid input: expected array, received string/,
    ],
    [
      'no-name',
      /Failed to parse registry item: .*no-name\.json\s+- name: Invalid input: expected string, received undefined/,
    ],
  ]
  for (const [name, message] of schemaCases) {
    await h.step(`malformed: ${name} fails the item schema and names the field`, () => {
      expectRefused(attempt(name, add(name, '-y')), message)
    })
  }

  await h.step('malformed: a key the schema does not know is ignored', () => {
    const observation = attempt('extra key', add('extra-key', '-y'))
    assert.equal(observation.status, 0, observation.text)
    assert.deepEqual(observation.changes, ['?? src/components/ui/extra-key.tsx'])
  })

  const unsafe: [name: string, shown: string][] = [
    ['target-relative', '../escape-relative.tsx'],
    ['target-absolute', path.join(h.work, 'escape-absolute.tsx')],
    ['path-relative', '../../escape-path.tsx'],
  ]
  for (const [name, shown] of unsafe) {
    await h.step(`unsafe path: ${name} is refused and nothing is written`, () => {
      const observation = attempt(name, add(name, '-y'))
      expectRefused(
        observation,
        new RegExp(
          `We found an unsafe file path "${escapeRegExp(shown)}" in the registry item\\. Installation aborted\\.`,
        ),
      )
    })
    await h.step(`unsafe path: ${name} with --dry-run exits 0 and writes nothing`, () => {
      const observation = attempt(`${name} --dry-run`, add(name, '--dry-run'))
      assert.equal(observation.status, 0, observation.text)
      assert.match(observation.text, /\bcreate\b/)
      assert.deepEqual(observation.changes, NOTHING_CHANGED)
      assert.deepEqual(observation.outside, [])
      h.note(`${name} --dry-run: exit 0 and "create", although add without --dry-run aborts`)
    })
  }

  await h.step('unsafe path: ~/ in a target means the project root, not the home directory', () => {
    const observation = attempt('target ~/', add('target-home', '-y'))
    assert.equal(observation.status, 0, observation.text)
    assert.deepEqual(observation.changes, ['?? hieuuilab-failure-test-home.tsx'])
    assert.deepEqual(observation.outside, [], 'a file was written in the home directory')
  })

  // --- dependencies -----------------------------------------------------------------------

  await h.step('dependency: a name that looks like an option is refused', () => {
    expectRefused(
      attempt('option-like dependency', add('dep-option', '-y')),
      /Invalid dependency "--registry=http:\/\/127\.0\.0\.1:1": dependency names cannot start with "-"/,
    )
  })

  await h.step('dependency: --dry-run lists the dependencies and installs nothing', () => {
    const observation = attempt('dry run with a dependency', add('dep-missing', '--dry-run'))
    assert.equal(observation.status, 0, observation.text)
    assert.match(observation.text, /Dependencies/)
    assert.match(observation.text, /hieuuilab-no-such-package-4f9c1e7a2b/)
    assert.deepEqual(observation.changes, NOTHING_CHANGED)
    h.note('--dry-run lists the dependencies of an item without installing them')
  })

  await h.step(
    'dependency: a package that is not on npm fails the install and writes nothing',
    () => {
      const observation = attempt('missing package', add('dep-missing', '-y'))
      expectRefused(
        observation,
        /Command failed with exit code 1: .*hieuuilab-no-such-package-4f9c1e7a2b/,
      )
      h.note('a dependency that cannot be installed: exit 1, the component file is not written')
    },
  )

  // --- the registry address ---------------------------------------------------------------

  const fromVariable = { '@hieuuilab': '${HIEUUILAB_REGISTRY_URL}/{name}.json' }

  await h.step('address: ${VAR} in the registry URL is filled from the environment', () => {
    const observation = attempt(
      'variable set',
      ['add', '@hieuuilab/fixture', '-y', '-c', h.sample],
      { registries: fromVariable, env: { HIEUUILAB_REGISTRY_URL: `${origin}/r` } },
    )
    assert.equal(observation.status, 0, observation.text)
    assert.deepEqual(observation.changes, ['?? src/components/ui/fixture.tsx'])
    assert.deepEqual(observation.requests, ['/r/fixture.json'])
  })

  await h.step('address: an unset ${VAR} is named in the error and nothing is requested', () => {
    const observation = attempt(
      'variable unset',
      ['add', '@hieuuilab/fixture', '-y', '-c', h.sample],
      { registries: fromVariable },
    )
    expectRefused(
      observation,
      /Registry "@hieuuilab" requires the following environment variables:\s+• HIEUUILAB_REGISTRY_URL/,
    )
    assert.deepEqual(observation.requests, [])
  })

  // --- no components.json -----------------------------------------------------------------

  await h.step(
    'init: add --dry-run without components.json asks the init questions and does nothing',
    () => {
      const empty = path.join(h.work, 'empty')
      mkdirSync(empty, { recursive: true })
      server.clearRequests()
      const result = h.shadcn(['add', itemUrl('fixture'), '--dry-run', '-c', empty], {
        timeout: 90_000,
      })
      if (options.show)
        console.log(`--- no components.json\nexit ${String(result.status)}\n${result.text}\n`)
      assert.ok(!result.timedOut, 'the command waited for input')
      assert.equal(result.status, 0, result.text)
      assert.match(result.text, /Select a component library/)
      assert.deepEqual(readdirSync(empty), [], 'a dry run wrote files')
      h.note(
        'add --dry-run without components.json: shows the init questions, exit 0, nothing done',
      )
    },
  )

  h.finish([server])
}

main().catch(h.crash)
