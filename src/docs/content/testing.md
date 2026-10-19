# Testing strategy

The lab tests behavior and rules, not pixels. Unit tests check components, routes, and content in jsdom; validators check the registry, the showcase, and these docs against the repository; end-to-end tests drive a production build in Chromium. This page explains each layer, how to run it, and what is not tested.

## Layers {#layers}

| Layer            | Tool                                       | Runs with                                          | Covers                                                         |
| ---------------- | ------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| Static checks    | ESLint, Prettier, TypeScript               | `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | Types, accessibility lint rules, formatting                    |
| Unit and content | Vitest, Testing Library, user-event        | `pnpm test`                                        | Components, hooks, routes, registry data, docs, contrast       |
| End to end       | Playwright (Chromium) against `pnpm build` | `pnpm test:e2e`                                    | Keyboard flows, routing, overflow at three widths, both themes |

`pnpm check` runs the static checks, the unit tests, and the build, which is what CI runs before the end-to-end tests. Run it before you push.

## Unit tests {#unit}

Vitest runs every `src/**/*.test.ts` and `*.test.tsx` file in jsdom. Test files import `describe`, `it`, and `expect` from `vitest`, because globals are off. `src/test/setup.ts` adds the pieces jsdom lacks: `matchMedia` (never matching), `ResizeObserver`, `scrollIntoView`, pointer capture, `window.scrollTo`, and a canvas context that reports none.

- **Components** are tested with Testing Library: query by role and accessible name, and use `userEvent` for the keyboard (Tab, Enter, Space, and the arrows). Create `userEvent.setup()` before `render` when a test needs the clipboard, because the copy button checks for it when it mounts.
- **Routes** are tested through `renderRoute(path)` in `src/test/render.tsx`. It renders the real route tree in a memory router and waits for loaders and lazy pages. `src/router/routes.test.tsx` lists every required route and checks one `h1`, one `main`, the document title, and the description.
- **Tokens**: `src/styles/tokens.test.ts` checks WCAG AA contrast of the token pairs in both themes, and that token names do not collide across utility namespaces. [Accessibility guidelines](/docs/accessibility) explains the thresholds.
- **Jsdom has no layout**, so rules about layout are checked on source text instead. `src/registry/page-blocks.test.ts` and `src/templates/templates.test.ts` read each block and template as text and reject patterns such as `min-h-screen`, `fixed`, `dark:`, and raw palette colors. Both read the list from `src/test/source-rules.ts`.

## Validators {#validators}

The repository checks its own data with pure functions that take their facts as an argument, so a test can feed them bad data:

- `validateRegistry` in `src/registry/validate.ts` checks every entry's metadata against its source. It also runs when the dev server starts.
- `validateShowcase` in `src/content/showcase-rules.ts` checks that the project showcase cites files and anchors that exist.
- `validateNotes` in `src/notes/notes-rules.ts` checks the engineering notes: the template sections, that every code block is an excerpt of the file it names or is labelled as hypothetical, that the commands are the repository's own, and that the evidence files exist. It reuses the Markdown rules of `src/docs/markdown-rules.ts`. `src/notes/notes.test.ts` runs it against the real articles.
- `validateDocs` in `src/docs/docs-rules.ts` checks these pages: the manifest against the files, every internal link and `#heading`, every repository path written in code, the imports in code samples, and the directives that pull content from the registry. It also keeps `CHANGELOG.md` in date order. `src/docs/docs.test.ts` runs it against the real docs, and `src/docs/docs-rules.test.ts` feeds it bad data to show each rule fires.

```bash title="check the docs"
pnpm docs:check
```

```bash title="check the notes"
pnpm notes:check
```

`pnpm docs:check` runs only the tests in `src/docs`, so a broken link or import is reported on its own as `docs/<page id>: message`. `pnpm test` includes the same checks. A test reads repository files with `src/test/repo-files.ts`, which uses `import.meta.glob`; only tests may import it, since bundling it would ship every source file as text.

## End-to-end tests {#e2e}

Playwright tests live in `e2e/` and run in Chromium against the production build: the configuration builds the site and serves it with `pnpm preview` on port 47317, or the port in `E2E_PORT`. It always starts its own server, so it never tests another project that holds the port. They cover:

- keyboard flows for the components and blocks, in `components.spec.ts`, `forms.spec.ts`, `data-display.spec.ts`, `blocks.spec.ts`, `catalog.spec.ts`, `playground.spec.ts`, `templates.spec.ts`, and `projects.spec.ts`, and `notes.spec.ts`;
- routing in `routes.spec.ts`: direct load, refresh, Back and Forward, invalid URLs, and redirects;
- layout in `shell.spec.ts`: no horizontal overflow on every route at 360, 768, and 1280 pixels in both themes, the header, the mobile drawer, and the search menu. Set `SCREENSHOT_DIR` to save full-page captures from that sweep for manual review.

```bash title="run the end-to-end tests"
pnpm exec playwright install chromium
pnpm test:e2e
```

Install the browser once. To run one file, pass it to Playwright, for example `pnpm exec playwright test e2e/docs.spec.ts`.

## CI {#ci}

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, on Ubuntu with Node.js 24. In order: install with the frozen lockfile, lint, format check, typecheck, `pnpm docs:check`, `pnpm notes:check`, unit tests, build, then the Playwright tests. A new `*.test.ts` file runs in CI without a workflow change; a new `package.json` script does not, unless the workflow calls it.

## What is not tested {#gaps}

- There are no visual snapshot tests. CI runs on Ubuntu with no baseline images, so the tests assert layout and behavior, not pixels.
- No automated accessibility engine such as axe runs, and Chromium is the only browser.
- The site is not deployed, so nothing tests a live URL.
