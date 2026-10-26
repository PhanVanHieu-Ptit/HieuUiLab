# Deployment

This page covers building Hieu UI Lab for production, hosting it on Vercel, and checking a deployment. The site is not deployed. Everything below is configured and tested without a host, and the steps under [Verify a deployment](#verify) are how to find out what a real host does. Nothing on this page has been run against one.

## What is configured {#configured}

| File                                  | What it does                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `vercel.json`                         | The build command, the output folder, the single-page-app fallback, the caching of built files, and the security headers. |
| `scripts/check-dist.ts`               | `pnpm dist:check`: checks the build output before it is deployed. The Vercel build runs it after `pnpm build`.            |
| `scripts/smoke-deployment.ts`         | `pnpm deploy:smoke <address>`: HTTP checks of a deployment.                                                               |
| `scripts/serve-dist.ts`               | `pnpm deploy:serve`: serves `dist/` with the rules in `vercel.json`, to try the checks without a host.                    |
| `scripts/check-external-links.ts`     | `pnpm deploy:links`: asks every web address the repository ships whether it still answers.                                |
| `src/router/vercel-config.test.ts`    | Compiles `vercel.json` with Vercel's own route compiler and checks it against every URL the site serves.                  |
| `.github/workflows/ci.yml`            | Runs the checks, the build, `pnpm dist:check`, and the end-to-end tests on pull requests and on pushes to `main`.         |
| `.github/workflows/deploy-verify.yml` | Runs the HTTP and browser checks against a deployment, by hand or after a successful production deployment.               |

## Develop locally and build for production {#local}

```bash title="local development"
pnpm install
pnpm dev
```

The dev server listens on `http://localhost:5173`. It needs no environment variable. To look at what would be deployed, build and serve it:

```bash title="a production build, served locally"
pnpm build
pnpm dist:check
pnpm preview
```

`pnpm build` type-checks, then writes `dist/`. It prints a chunk size warning for the MapLibre and Three.js chunks; both are downloaded only by the pages that use them. `pnpm preview` serves `dist/` at `http://localhost:4173`, and the end-to-end tests run against it, but it has its own single-page-app fallback, so it cannot show whether `vercel.json` is right. To serve the build with the rules from `vercel.json` instead, see [Try the checks without a host](#serve).

## Environment variables and secrets {#env}

The site needs no environment variable to build or run. These are the ones that exist:

| Variable                                                                                   | Where it is set                                                                        | Public?          | What it does                                                                                    |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `VITE_MAP_STYLE_URL`, `VITE_MAP_API_KEY`, `VITE_MAP_ATTRIBUTION`, `VITE_MAP_PROVIDER_NAME` | The build: `.env.local`, or the host's environment variables.                          | Yes              | Enable the map viewer's optional online basemap. See [Map provider and attribution](#maps).     |
| `ENABLE_EXPERIMENTAL_COREPACK`                                                             | The Vercel project.                                                                    | No               | Makes the Vercel build use the pnpm version in `package.json`. See [Deploy to Vercel](#vercel). |
| `VERCEL_AUTOMATION_BYPASS_SECRET`                                                          | Vercel (Protection Bypass for Automation), your shell, and a GitHub repository secret. | **No, a secret** | Lets the checks into a protected preview. Never give it a `VITE_` name.                         |
| `E2E_BASE_URL`, `E2E_PORT`                                                                 | Your shell or CI.                                                                      | No               | Point the Playwright tests at a deployment, or choose the port of the local preview.            |

Rules that keep secrets out of the bundle:

- **Every `VITE_` variable is public.** Vite writes its value into the JavaScript that each visitor downloads. A key in a style URL is visible in the bundle and in the network panel, so use a key the provider lets you restrict to the site's origin.
- **The code reads exactly four.** `src/lab/maplibre-viewer/maplibre-viewer-demo.tsx` passes the four map settings by name. Passing `import.meta.env` whole makes Vite write every `VITE_` variable of the build into the bundle, including any that someone added to the host's settings and, when the project exposes Vercel's system variables, the `VITE_VERCEL_*` ones, which carry the Git author and commit message. A build with a stray variable was checked before the change: the value was in the bundle. After it, the value was not.
- **The build is checked.** `pnpm dist:check` fails if an `import.meta.env` object with another `VITE_` name is in the output, if the value of another `VITE_` variable is, if the value of a secret-named variable (`SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE`, `CREDENTIAL`, `API_KEY`, `BYPASS`) is, or if a string shaped like a well-known credential is. Its messages name the variable and the file, never the value.
- **A value is read at build time.** Changing a variable on the host does not change a deployment that exists; redeploy.
- **No secret belongs in `vercel.json` or the repository.** `.gitignore` excludes `.env` files except `.env.example`, and `.vercel`, the folder the Vercel CLI writes when it links a project. A test fails if `vercel.json` gains an `env` section.

## Deploy to Vercel {#vercel}

These steps use Vercel's dashboard and were written from Vercel's documentation; none of them has been performed for this project.

1. Import the GitHub repository as a new project. Leave the root directory at the repository root, where `vercel.json` is.
2. The framework is Vite. `vercel.json` sets the build command to `pnpm build && pnpm dist:check` and the output folder to `dist`, so a deployment whose output fails the checks is not published.
3. Use Node.js 24.x, which is Vercel's default. `package.json` asks for Node.js 24 or newer (`engines`), and Vercel maps that range to 24.x.
4. Add the environment variable `ENABLE_EXPERIMENTAL_COREPACK` with the value `1`, for every environment. The lockfile has version 9.0, which Vercel reads as pnpm 9 or 10, and this repository pins pnpm 11 in `packageManager`. Vercel follows `packageManager` only when Corepack is enabled, and calls Corepack experimental, so it is a setting to recheck if the build starts failing at install. It cannot go in `vercel.json`: an install command of `pnpm install` there would pick the oldest pnpm available. See Vercel's pages on [package managers](https://vercel.com/docs/package-managers) and [configuring a build](https://vercel.com/docs/builds/configure-a-build).
5. Add the `VITE_MAP_*` variables only if you want the online basemap, after reading [Map provider and attribution](#maps).
6. Decide who can open previews. Vercel's standard protection puts a login in front of preview deployments and leaves production domains public; see [Deployment Protection](https://vercel.com/docs/deployment-protection). The checks in this repository can reach a protected preview with its automation bypass secret.
7. Deploy, then read the build log. It should show pnpm 11 installing the dependencies, `pnpm build` finishing, and `pnpm dist:check` ending with "The build output passed."

## Single-page-app routing {#routing}

The site has one HTML file. React Router draws every page in the browser, so `/docs/installation` is not a file on the host. A visitor who refreshes there, or opens a shared link, asks the host for that path, and the host has to answer with `index.html`. `vercel.json` says so:

```json title="vercel.json (rewrites)"
{
  "rewrites": [{ "source": "/((?!assets/)[^.]*)", "destination": "/index.html" }]
}
```

Vercel looks for a file first and applies a rewrite only when there is none, so `/favicon.svg` and `/r/kbd.json` are served as they are. The pattern also excludes `/assets/` and any path with a dot. A bare catch-all would answer a missing script with `index.html` and status 200, and the browser would report "Expected a JavaScript module". That is how a tab opened before a deployment fails when the script it asks for is gone, and how the map viewer's worker, which is an emitted file, would fail to start. With the exclusion, a missing file is a 404. No route of the site contains a dot.

Two consequences:

- **Unknown URLs get status 200.** The app draws its own "Page not found" page, because a static host cannot know which URLs are pages. Search engines may treat these as soft 404s. Returning 404 would need a list of every route or prerendered pages, and the site has neither.
- **Nested paths need absolute asset URLs.** `index.html` loads `/assets/…`, never `assets/…`. `pnpm dist:check` fails if that changes, for example if `base` is set in `vite.config.ts`.

Other hosts need the same fallback in their own syntax. These notes come from each host's documentation and were not tested here:

- **Netlify** reads a `_redirects` file in the published folder: a line `/* /index.html 200`. Files that exist are served first.
- **Cloudflare Pages** serves `index.html` for unknown paths when the project has no top-level `404.html`.
- **GitHub Pages** has no rewrite rules. Copying `index.html` to `404.html` makes nested URLs load but with status 404, and a project site is served under `/<repository>/`, which needs `base` in `vite.config.ts`. This site assumes it is served from the root.

## Map provider and attribution {#maps}

By default the map viewer draws a basemap from data in the repository and makes no network request. An online basemap exists only when the build sets `VITE_MAP_STYLE_URL` and `VITE_MAP_ATTRIBUTION`, and loads only after a visitor presses "Load online basemap". The attribution is required because providers make credit a condition of use; it is shown in the map's attribution control and in the Basemap panel. [Map viewer and basemaps](/docs/map-viewer) lists the settings and what the providers it names require. No provider is configured in this repository, and none has been contacted by a test.

`pnpm dist:check` prints what the build will do:

- With nothing set, a note that the bundled basemap is used.
- A warning when the attribution is empty, when the style URL has `{key}` and the key is empty, when a key is set but the style URL has nowhere to put it, or when settings are set without a style URL.
- A note when a key is set: the key is in the public bundle, so restrict it to the site's origin at the provider. Production and every preview have different origins, so a key restricted to one is refused on the others.
- A note naming the provider's host when the online basemap is configured, so that you check its terms and the credit.

A provider that refuses requests with 401, 403, or 429 is handled by the viewer, which goes back to the bundled basemap after three refusals and names the host. A content security policy is not set; [the map viewer page](/docs/map-viewer#worker) lists what MapLibre needs if you add one.

## Verify a deployment {#verify}

A passing build shows that the files exist. It does not show that a host serves them. After the first deployment, and after any change to `vercel.json`, the Vercel project settings, or the map settings, do these in order.

1. **Read the build log.** pnpm 11, `pnpm build` finished, and `pnpm dist:check` passed.
2. **Run the HTTP checks** (command below). They ask whether the home page is the app, whether every file `index.html` loads comes back with the right type, whether nested URLs get the same `index.html`, whether a missing script and a missing data file are 404s, whether the registry JSON is served, and whether the headers in `vercel.json` are present.
3. **Run the browser checks** (command below). They load and reload every required URL, start the map viewer's real map and the Three.js scene, and read the external links.
4. **Look by hand.** Open `/docs/component-conventions/adding-a-component` and refresh it. Open `/labs/maps/maplibre-viewer`: the map draws, and its corner reads "Synthetic sample data". In the browser's network panel, with the cache disabled, reload and check that no request goes to another origin, that the `.js` files have a JavaScript type, and that they carry `cache-control: public, max-age=31536000, immutable`. Search the downloaded JavaScript for any key you configured: it should be there if you set one, and no other setting should be.
5. **If a provider is configured,** press "Load online basemap". The credit should show in the map and in the panel, and the provider should not answer 401, 403, or 429.
6. **Check the links to other sites** with `pnpm deploy:links`. It fails on an address that is gone and lists the ones it could not verify, such as sites that block scripts, for you to open.
7. **Only then, say so.** The README's status table, `src/content/showcase-projects.ts` (a deployment of `{ status: 'live', … }` with the address and the date you verified it), this page, and the lines that say the site is not deployed on [Testing strategy](/docs/testing), [Map viewer and basemaps](/docs/map-viewer), and [Install with the shadcn CLI](/docs/shadcn-registry) are written for the site as it is today.

The commands:

```bash title="HTTP checks"
pnpm deploy:smoke https://your-deployment.vercel.app
```

```bash title="HTTP checks on a protected preview"
VERCEL_AUTOMATION_BYPASS_SECRET=… pnpm deploy:smoke https://your-preview.vercel.app
```

```bash title="browser checks"
pnpm exec playwright install chromium
E2E_BASE_URL=https://your-deployment.vercel.app pnpm deploy:e2e
```

The bypass secret is sent to that address only and is never printed. Set the same variable for `pnpm deploy:e2e` on a protected preview.

### Try the checks without a host {#serve}

`pnpm deploy:serve` serves `dist/` the way `vercel.json` asks: its headers, files first, then the rewrite. Run the checks against it from another terminal.

```bash title="the checks against a local model of vercel.json"
pnpm build
pnpm deploy:serve
pnpm deploy:smoke http://127.0.0.1:4173
E2E_BASE_URL=http://127.0.0.1:4173 pnpm deploy:e2e
```

`pnpm deploy:serve --mode catch-all` answers every unknown URL with `index.html`, and `--mode none` has no fallback. The smoke check fails for each, which is the test that it can fail. This is a model of the configuration, not of Vercel.

### What has been checked, and what has not {#checked}

Checked on a development machine, on 2026-10-26, with Node.js 22.22.3 (CI uses Node.js 24):

- `vercel.json` compiles with `@vercel/routing-utils`, every URL of the site matches the rewrite, and files and missing files do not.
- `pnpm dist:check` passes on the real build and fails on a build that leaks a variable, with a test for each rule.
- `pnpm deploy:smoke` passes against a server that applies `vercel.json` and fails against the two wrong ones, as a command, with its exit status.
- The Playwright switch to a deployment works against that local server. The addresses `pnpm deploy:links` found all answered.

Not checked, because there is no deployment: a Vercel build with pnpm 11 through Corepack, how Vercel applies `vercel.json` and sends its headers, preview protection, the `deploy-verify.yml` workflow, a custom domain, any browser other than Chromium, performance over a real network, and any map provider.

## Continuous integration {#ci}

`.github/workflows/ci.yml` runs on Ubuntu with Node.js 24: a frozen-lockfile install, lint, format check, typecheck, the docs, notes, and registry checks, the unit tests, the build, `pnpm dist:check`, and the end-to-end tests against the production build. No `VITE_` variable is set there, so the tests stay offline. A failed run uploads the Playwright report.

Dependencies are cached by `actions/setup-node`, which stores the pnpm package store under a key made from the lockfile. It restores packages that the lockfile names, and a changed lockfile gets a new cache. Nothing else is cached on purpose: `node_modules` and `dist` depend on more than the lockfile, and the Playwright browsers need their system packages installed on every run anyway.

`.github/workflows/deploy-verify.yml` runs `pnpm deploy:smoke`, `pnpm deploy:e2e`, and `pnpm deploy:links` against an address. Start it from the Actions tab with an address, or let it run after Vercel reports a successful Production deployment through the GitHub integration. It does not run for previews, which are protected by default; add the bypass secret as the repository secret `VERCEL_AUTOMATION_BYPASS_SECRET` and run it by hand for one. The links step never fails the run. This workflow has not run yet.

## Limits of the services involved {#limits}

- **Vercel plans differ.** Read the terms of the plan you use, including what it allows for commercial use.
- **Skew Protection is for paid plans.** Vercel documents it for Pro and Enterprise. Without it, a tab opened before a deployment may ask for a script that the new deployment no longer has; the host answers 404, and the route error page offers "Reload page". That path has not been tested against a real deployment.
- **Previews can be protected.** Under Vercel's standard protection they are, and a check that does not carry the bypass secret gets 401. Look at the project's Deployment Protection settings to see which applies.
- **No content security policy.** The page has an inline script that applies the theme before the first paint, which a policy would have to allow by hash, and an online basemap needs `connect-src` for a host that is chosen when the site is built. A static header cannot name it, and an untested policy could stop MapLibre or Three.js. [The map viewer page](/docs/map-viewer#worker) lists what MapLibre asks for.
- **No analytics, error reporting, or uptime monitoring.**
- **Other sites limit scripts.** GitHub and others rate-limit or block automated requests, so `pnpm deploy:links` can only say "could not verify" for some addresses.
- **Tile providers set their own terms.** [Map viewer and basemaps](/docs/map-viewer#providers) records what the ones it names require, as checked on 2026-10-21.

## Troubleshooting {#troubleshooting}

| Symptom                                                                                 | Cause                                                                                                                                                           | What to do                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The build fails while installing, with a lockfile, pnpm, or "Unsupported engine" error  | Vercel used pnpm 9 or 10 instead of 11, or a Node.js older than 24.                                                                                             | Set `ENABLE_EXPERIMENTAL_COREPACK` to `1` and Node.js to 24.x in the project settings, redeploy, and check the log for pnpm 11.                                |
| The build fails at `pnpm dist:check`                                                    | A rule found a problem. Each failing line names the rule and the file.                                                                                          | See the next four rows.                                                                                                                                        |
| `holds all of import.meta.env` or `the value of VITE_… is in`                           | Code reads `import.meta.env` whole, or reads a `VITE_` variable that is not a map setting, or a variable on the host has a value that the bundle contains.      | Read each setting by name, as `src/lab/maplibre-viewer/maplibre-viewer-demo.tsx` does, and remove variables nothing needs.                                     |
| `r/kbd.json is missing` or `no assets/maplibre-gl-worker-*.js`                          | The output is incomplete: `public/r` was not generated, or the map worker was not emitted.                                                                      | Run `pnpm registry:build` and `pnpm build` locally and read the first error. Check that `map-controller.ts` still imports the worker with `?worker&url`.       |
| `index.html refers to … without a leading slash` or `which is not in the output`        | `base` was set in `vite.config.ts`, or a file was not emitted.                                                                                                  | Remove `base`. The site is served from the root.                                                                                                               |
| Refreshing a nested URL shows the host's 404 page, while the home page works            | `vercel.json` is not applied: it is not at the project's root directory, the project has another root directory, or the file is invalid.                        | Check the project's root directory setting and that the file is in the deployed source. Run `pnpm deploy:smoke` against the deployment to see which URLs fail. |
| A blank page, and the console says a module script got `text/html`                      | A script request was answered with `index.html`: the rewrite includes `/assets/`, or a tab opened before a deployment asked for a script that no longer exists. | Reload the tab. Run `pnpm deploy:smoke`: "missing script" must be a 404. Keep `/assets/` out of the rewrite.                                                   |
| The map viewer shows an error with a Retry button, or "Worker failed to load" is logged | The worker file `assets/maplibre-gl-worker-*.js` was answered with HTML or a 404, or a content blocker stopped it.                                              | Open the network panel and look at that request. The rewrite must not catch `/assets/`.                                                                        |
| "Load online basemap" is disabled after the variables were set                          | The deployment was built before the change, a name is mistyped, or the attribution is empty. The panel names the reason.                                        | Redeploy, because values are read at build time. Read the `pnpm dist:check` lines in the build log.                                                            |
| The online basemap loads, then returns to the bundled one and names a host              | The provider answered 401, 403, or 429 three times: the key is restricted to another origin, or a limit was reached.                                            | Add this deployment's origin to the key's allowed origins; previews have their own addresses. Read the provider's limits.                                      |
| `pnpm deploy:smoke` or the browser checks get 401                                       | The deployment is a protected preview.                                                                                                                          | Set `VERCEL_AUTOMATION_BYPASS_SECRET` to the project's automation bypass secret, or check the production address, which is public by default.                  |
| An unknown URL returns status 200                                                       | Expected for a single-page app. The app draws its own "Page not found" page.                                                                                    | Nothing to fix. See [Single-page-app routing](#routing) for why.                                                                                               |
| `pnpm deploy:links` lists addresses it could not verify                                 | The other site refused a script (401, 403, 429) or timed out.                                                                                                   | Open them in a browser.                                                                                                                                        |
| `deploy-verify.yml` does not start after a deployment                                   | It reacts to deployment statuses that Vercel's GitHub integration creates, for the Production environment only.                                                 | Check the repository's Deployments, and start the workflow by hand with the address.                                                                           |
