# Testing strategy

The lab tests behavior and rules, not pixels. Unit tests check components, routes, and content in jsdom; validators check the registry, the showcase, and these docs against the repository; end-to-end tests drive a production build in Chromium. This page explains each layer, how to run it, and what is not tested.

## Layers {#layers}

| Layer            | Tool                                       | Runs with                                                 | Covers                                                                               |
| ---------------- | ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Static checks    | ESLint, Prettier, TypeScript               | `pnpm lint`, `pnpm format:check`, `pnpm typecheck`        | Types, accessibility lint rules, formatting                                          |
| Unit and content | Vitest, Testing Library, user-event        | `pnpm test`                                               | Components, hooks, routes, registry data, docs, contrast                             |
| End to end       | Playwright (Chromium) against `pnpm build` | `pnpm test:e2e`                                           | Keyboard flows, routing, overflow at four widths, both themes, axe rules             |
| Build and host   | Node scripts, Playwright                   | `pnpm dist:check`, `pnpm deploy:smoke`, `pnpm deploy:e2e` | The build output, and a deployed address (see [Deployment](/docs/deployment#verify)) |

`pnpm check` runs the static checks, the unit tests, and the build, which is what CI runs before the end-to-end tests. Run it before you push.

## Unit tests {#unit}

Vitest runs every `src/**/*.test.ts` and `*.test.tsx` file in jsdom, and the `scripts/**/*.test.ts` files that test the deployment checks. Test files import `describe`, `it`, and `expect` from `vitest`, because globals are off. `src/test/setup.ts` adds the pieces jsdom lacks: `matchMedia` (never matching), `ResizeObserver`, `scrollIntoView`, pointer capture, `window.scrollTo`, and a canvas context that reports none.

- **Components** are tested with Testing Library: query by role and accessible name, and use `userEvent` for the keyboard (Tab, Enter, Space, and the arrows). Create `userEvent.setup()` before `render` when a test needs the clipboard, because the copy button checks for it when it mounts.
- **Routes** are tested through `renderRoute(path)` in `src/test/render.tsx`. It renders the real route tree in a memory router and waits for loaders and lazy pages. `renderSettled` in the same file is `render` inside an awaited `act`, which a component that loads its code with `use` needs: with the synchronous `render` it stays on its fallback. `src/router/routes.test.tsx` lists every required route and checks one `h1`, one `main`, the document title, and the description.
- **Tokens**: `src/styles/tokens.test.ts` checks WCAG AA contrast of the token pairs in both themes, and that token names do not collide across utility namespaces. [Accessibility guidelines](/docs/accessibility) explains the thresholds.
- **Syntax colors**: Shiki's themes are not the site's tokens, so `src/lib/highlight.test.ts` highlights everything the site displays (the docs and notes fences, and the registry examples and sources) and checks each color the highlighter produces against the code background in both themes. `src/lib/highlight.ts` replaces the five stock colors that failed. The contrast arithmetic is shared in `src/test/color.ts`.
- **Jsdom has no layout**, so rules about layout are checked on source text instead. `src/registry/page-blocks.test.ts` and `src/templates/templates.test.ts` read each block and template as text and reject patterns such as `min-h-screen`, `fixed`, `dark:`, and raw palette colors. Both read the list from `src/test/source-rules.ts`.

## Validators {#validators}

The repository checks its own data with pure functions that take their facts as an argument, so a test can feed them bad data:

- `validateFullRegistry` in `src/registry/validate.ts` checks every entry's metadata against its source and examples. The dev server runs `validateRegistry` on the metadata when it starts, and checks an entry's source when its page loads.
- `validateShowcase` in `src/content/showcase-rules.ts` checks that the project showcase cites files and anchors that exist.
- `validateNotes` in `src/notes/notes-rules.ts` checks the engineering notes: the template sections, that every code block is an excerpt of the file it names or is labelled as hypothetical, that the commands are the repository's own, and that the evidence files exist. It reuses the Markdown rules of `src/docs/markdown-rules.ts`. `src/notes/notes.test.ts` runs it against the real articles.
- `validateDocs` in `src/docs/docs-rules.ts` checks these pages: the manifest against the files, every internal link and `#heading`, every repository path written in code, the imports in code samples, and the directives that pull content from the registry. It also keeps `CHANGELOG.md` in date order. `src/docs/docs.test.ts` runs it against the real docs, and `src/docs/docs-rules.test.ts` feeds it bad data to show each rule fires.
- `validateReadme` in `src/docs/readme-rules.ts` checks the repository paths and routes that `README.md` names in code and links. It checks references only; the README's prose is not held to the docs style. `src/docs/readme.test.ts` runs it against the real file and against bad data. `CHANGELOG.md` is a docs page, so `validateDocs` already covers it.

```bash title="check the docs"
pnpm docs:check
```

```bash title="check the notes"
pnpm notes:check
```

`pnpm docs:check` runs only the tests in `src/docs`, so a broken link or import is reported on its own as `docs/<page id>: message`. `pnpm test` includes the same checks. A test reads repository files with `src/test/repo-files.ts`, which uses `import.meta.glob`; only tests may import it, since bundling it would ship every source file as text.

## End-to-end tests {#e2e}

Playwright tests live in `e2e/` and run in Chromium against the production build: the configuration builds the site and serves it with `pnpm preview` on port 47317, or the port in `E2E_PORT`. It always starts its own server, so it never tests another project that holds the port.

Every spec imports `test` and `expect` from `e2e/fixtures.ts`, not from Playwright, and ESLint rejects the other import. The fixture refuses any request to an origin other than the site's own and fails the test that made it, so no test depends on a server this repository does not control. `e2e/network-guard.spec.ts` shows the guard refusing a request and failing a test that makes one. A test that opens its own context with `browser.newContext()` passes it to `guardNetwork`. The tests cover:

- keyboard flows for the components and blocks, in `components.spec.ts`, `forms.spec.ts`, `data-display.spec.ts`, `blocks.spec.ts`, `catalog.spec.ts`, `playground.spec.ts`, `templates.spec.ts`, and `projects.spec.ts`, and `notes.spec.ts`;
- routing in `routes.spec.ts`: direct load, refresh, Back and Forward, invalid URLs, and redirects;
- layout in `shell.spec.ts`: no horizontal overflow on every route at 360, 768, and 1280 pixels in both themes, and at 320 pixels on those routes and on every registry entry the catalogs list, plus the header, the mobile drawer, and the search menu. `layout-shift.spec.ts` delays the scripts so a lazy page's fallback is on screen first, and fails if the page arriving shifts the layout;
- focus in `route-focus.spec.ts`: after a followed link, Back, or a page chosen in the search menu, focus is on the new page's heading, and typing in the catalog filter keeps it in the filter. Fast typing in that filter is in `catalog.spec.ts`; Set `SCREENSHOT_DIR` to save full-page captures from that sweep for manual review;
- the map viewer in `maplibre-viewer.spec.ts`: the real MapLibre library running in the production build, because the unit tests replace it with a stand-in and jsdom has no WebGL. It checks that the map starts, that layers toggle, that features can be selected, that the map follows its container, and that leaving the page removes it. In a browser without WebGL2 it skips these tests on a developer's machine and fails them where `CI` is set, so a runner that lost WebGL2 is noticed rather than passing quietly. See [Map viewer and basemaps](/docs/map-viewer).
- the Three.js scene in `three-scene.spec.ts`: the real library running in the production build, because the unit tests replace the renderer with a stand-in and jsdom has no WebGL. It checks that the scene draws, that clicking and the list select a solid, that a drag, the camera buttons, and Reset camera move the camera and restore the picture, that a plain wheel scrolls the page while Ctrl and wheel zooms, that an idle scene asks the browser for no animation frames, that a lost graphics context is reported and recovered, and that leaving the page releases its context. It skips these tests in a browser without WebGL2, and fails them where `CI` is set.
- accessibility in `a11y.spec.ts`: axe-core, through `@axe-core/playwright`, runs the WCAG 2.0 and 2.1 level A and AA rules in Chromium on 14 states in both themes: the landing page, the catalog with a search, a component page with its playground, the sign-in block after a failed submit, the data table after sorting, a docs page with code, the theme customization page, an engineering note, the playground, the map viewer once every layer is ready, and four open overlays (the mobile drawer, the theme menu, the search dialog, and a dialog on a phone screen). The helper in `e2e/a11y.ts` fails with each rule, its selectors, and for contrast the measured colors. What axe cannot decide is listed on the test as `axe-needs-review`; it is not counted as a pass. One rule is off in one state: `aria-hidden-focus` for the open theme menu, because Radix hides the page and keeps focus in the menu but axe recognises that only for an `aria-modal` dialog, and a test checks that Tab and Shift+Tab stay inside the menu. A scan of deliberately faulty markup shows that the helper reports a missing text alternative, an unnamed button, and low contrast. Run these alone with `pnpm test:a11y`.

```bash title="run the end-to-end tests"
pnpm exec playwright install chromium
pnpm test:e2e
```

Install the browser once. To run one file, pass it to Playwright, for example `pnpm exec playwright test e2e/docs.spec.ts`.

## CI {#ci}

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, on Ubuntu with Node.js 24. In order: install with the frozen lockfile, lint, format check, typecheck, `pnpm docs:check`, `pnpm notes:check`, `pnpm registry:check`, unit tests, build, `pnpm dist:check` on the build output, then the Playwright tests. If a step fails, the workflow uploads the Playwright HTML report and the traces of tests that needed a retry. A new `*.test.ts` file runs in CI without a workflow change; a new `package.json` script does not, unless the workflow calls it.

## What is not tested {#gaps}

- There are no visual snapshot tests. CI runs on Ubuntu with no baseline images, so the tests assert layout and behavior, not pixels.
- Axe finds violations of its rules in the states listed above; a clean scan does not show that a page is accessible. It cannot decide some items, for example the contrast of sidebar links that a scroll region partly covers, and those are listed for review, not counted as passes. No screen reader, zoom, or forced-colors test runs, and Chromium is the only browser.
- No coverage was measured, so this page makes no claim about how much of the code the tests run.
- The map viewer's online basemap is chosen at build time and is not in the build the end-to-end tests use.
- The site is not deployed. `pnpm deploy:smoke` and `pnpm deploy:e2e` can test a live address, and they are checked against a local server that applies `vercel.json`, but no run against a real host has happened. [Deployment](/docs/deployment#checked) lists what has and has not been checked.
- No test contacts a map tile provider. The map viewer's optional online basemap is tested against stand-ins only.
