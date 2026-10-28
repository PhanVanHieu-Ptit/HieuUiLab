# Reproduce the quality checks

Every check that the release relies on, with the command that runs it, what a pass shows, and what it does not show. They need no account and no secret. A few need the network, and the table says which. [Testing strategy](/docs/testing) explains why the checks are shaped as they are; [Release readiness](/docs/release-readiness) records what each of them reported for 0.1.0.

## Before you start {#prerequisites}

You need Node.js 24 or newer (`engines` in `package.json`, and the version the workflows use) and pnpm 11, which `packageManager` pins. Corepack installs the right pnpm.

```bash title="set up a clean checkout"
nvm use 24
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

`--frozen-lockfile` fails if the lockfile does not match `package.json`, which is what CI does. The last line downloads the Chromium that Playwright drives; the end-to-end tests, the accessibility scans, `pnpm perf:measure`, and `pnpm registry:install-test` use it.

## The set that runs before a pull request {#quick}

`pnpm check` runs the static checks, the unit tests, the build, and the check of the build output. It stops at the first failure.

```bash title="what pnpm check runs"
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm dist:check
```

`pnpm test` includes the validators that read the repository: the docs, the notes, the About profile, the project showcase, the registry data and its `public/r` files, the README, the changelog, and the license and notices (`scripts/lib/release-metadata.test.ts`). A failure names the page, the file, or the sentence that no longer matches.

## Every check {#every-check}

| Command                       | A pass shows                                                                                                            | Network |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- |
| `pnpm lint`                   | ESLint finds nothing, with type-aware rules, React hook rules, and accessibility rules for JSX. Warnings fail.          | No      |
| `pnpm format:check`           | Every file is formatted as Prettier would write it.                                                                     | No      |
| `pnpm typecheck`              | The app, the tests, the scripts, and the end-to-end specs type-check in strict mode.                                    | No      |
| `pnpm test`                   | The Vitest suite passes: components, hooks, routes, registry data, every validator, and the tests of the scripts.       | No      |
| `pnpm docs:check`             | Only the docs tests: links, anchors, repository paths, code-sample imports, the changelog's shape, and the README.      | No      |
| `pnpm notes:check`            | Only the notes tests: each code block is an excerpt of the file it names, and the evidence exists.                      | No      |
| `pnpm registry:check`         | `public/r` matches what the registry would generate, and the items pass the shadcn schemas.                             | No      |
| `pnpm build`                  | The type check passes and Vite writes `dist/`.                                                                          | No      |
| `pnpm dist:check`             | `dist/` has the files the site needs, root-absolute paths, no source maps, and no secret or stray `VITE_` setting.      | No      |
| `pnpm test:e2e`               | The Playwright specs pass in Chromium against the production build on port 47317, in both themes and at several widths. | No      |
| `pnpm test:a11y`              | Only the axe scans of `e2e/a11y.spec.ts` (also part of `pnpm test:e2e`).                                                | No      |
| `pnpm deploy:serve`           | Serves `dist/` with the rules of `vercel.json` on port 4173. It keeps running; see [the rehearsal](#rehearsal).         | No      |
| `pnpm deploy:smoke <address>` | The HTTP checks pass for the address: the home page, assets, nested URLs, missing files, registry JSON, and headers.    | Address |
| `pnpm deploy:e2e`             | The browser specs that matter for a host pass against `E2E_BASE_URL`.                                                   | Address |
| `pnpm registry:install-test`  | The real shadcn CLI installs Kbd into a clean project, which builds and runs.                                           | Yes     |
| `pnpm registry:failure-test`  | The CLI reports bad names, missing files, malformed items, and unsafe paths the way the docs say.                       | Yes     |
| `pnpm registry:verify-schema` | The saved shadcn JSON Schemas equal the published ones.                                                                 | Yes     |
| `pnpm deploy:links`           | Every web address the repository ships still answers. Placeholders written as `<name>` are skipped.                     | Yes     |
| `pnpm perf:measure`           | Lab measurements of a production build; see [below](#performance).                                                      | No      |
| `pnpm audit --prod`           | The advisory database lists no known vulnerability for the production dependencies.                                     | Yes     |
| `pnpm licenses list --prod`   | The licenses of the production dependencies, to compare with `THIRD-PARTY-NOTICES.md`.                                  | No      |

## Run what CI runs {#as-ci}

`.github/workflows/ci.yml` runs these in order. With `CI` set, the end-to-end specs for the map and the 3D scene fail instead of skipping when the browser has no WebGL2, and `--retries=0` shows a flaky test as a failure.

```bash title="the CI steps"
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm docs:check
pnpm notes:check
pnpm registry:check
pnpm test
pnpm build
pnpm dist:check
CI=1 pnpm test:e2e --retries=0
```

`pnpm test:e2e` builds the site and starts `vite preview` on port 47317 itself; set `E2E_PORT` if that port is taken. It never reuses a server that is already running. Set `SCREENSHOT_DIR` to keep a capture per viewport and theme.

## The deployment rehearsal {#rehearsal}

This shows that `vercel.json`, the build, and the deployment checks agree with each other. It does not show that Vercel honors the file: the server is a model of the configuration (`scripts/lib/static-server.ts`).

```bash title="serve three versions of the build"
pnpm build
pnpm deploy:serve --port 4173 &
pnpm deploy:serve --mode catch-all --port 4174 &
pnpm deploy:serve --mode none --port 4175 &
```

```bash title="check each of them"
pnpm deploy:smoke http://127.0.0.1:4173
pnpm deploy:smoke http://127.0.0.1:4174
pnpm deploy:smoke http://127.0.0.1:4175
E2E_BASE_URL=http://127.0.0.1:4173 pnpm deploy:e2e
```

The first command passes. The second and third must fail with exit status 1: they are a host that answers a missing script with `index.html` and a host with no fallback at all, and a check that cannot fail shows nothing. Stop the servers afterwards (`kill %1 %2 %3` in the shell that started them).

## Against a real address {#real-address}

After a deployment, give the same commands its address. A protected Vercel preview answers 401 without the project's automation bypass secret; set `VERCEL_AUTOMATION_BYPASS_SECRET` and it is sent to that address only. [Deployment](/docs/deployment#verify) has the full list of steps and what each one decides.

```bash title="a deployment"
pnpm deploy:smoke https://<your-deployment>.vercel.app
E2E_BASE_URL=https://<your-deployment>.vercel.app pnpm deploy:e2e
```

## Measure performance {#performance}

`pnpm perf:measure` runs a production build (`dist/`, so build first) in headless Chromium and reports what a first visit downloads, how it paints, what loading a route and an interaction cost, and what the WebGL pages leave behind when the visitor goes away. `--only size` runs one mode, `--runs 3` makes fewer and faster runs, and `--dist before=<folder> --dist after=<folder>` compares two builds with the runs interleaved, so drift in the machine hits both. Results go to the terminal and to `perf-results/`, which is not committed.

It cannot tell you how a real phone or a real network behaves, because both are emulated; what visitors experience, because there is no field data; or anything about the graphics hardware, because WebGL runs on whatever headless Chromium gets on the machine. A difference between two builds is called one only when the ranges of the runs do not overlap. The repository holds no recorded results and makes no performance claim.

## What a pass does not show {#limits}

- The end-to-end specs, the axe scans, and the performance runs use Chromium only.
- A green run on one machine is not a green run on GitHub. The release checklist in [Release readiness](/docs/release-readiness#checklist) has the push and the CI run as open items.
- Accessibility tooling finds rule violations. It does not show that a page is accessible; [Known limitations](/docs/known-limitations#accessibility) lists what is not covered.
- The tests that need the network depend on npm, the shadcn registry, and other sites, and can fail for a reason that is not in this repository. Read the output before concluding that something broke.
