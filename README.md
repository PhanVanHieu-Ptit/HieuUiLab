# Hieu UI Lab

A personal UI registry and frontend engineering lab: reusable React components with live previews,
copyable source, props documentation, and tests.

## Status

| Area                                                                                                                                                                                                                                                                                                                                                                                              | State                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| App shell: header, docs sidebar, mobile drawer, breadcrumbs, ⌘K search, theme menu                                                                                                                                                                                                                                                                                                                | Implemented, unit + e2e tested (incl. 360/768/1280 overflow checks)                                                                           |
| Design tokens (color, status, elevation, type, layout) and shared state utilities                                                                                                                                                                                                                                                                                                                 | Implemented, contrast-tested                                                                                                                  |
| Registry model, validation, catalog search/filter/sort with removable filter chips and search suggestions; detail pages with playground controls, Usage/Source tabs, dependencies, related entries                                                                                                                                                                                                | Implemented, unit + e2e tested                                                                                                                |
| Actions, display, feedback: `Button`, `Badge`, `Alert`, `Breadcrumb`, `Card`, `Kbd`, `Separator`, `Skeleton`, `Spinner`, `Tabs`                                                                                                                                                                                                                                                                   | Implemented, unit tested                                                                                                                      |
| Form controls: `Input`, `Textarea`, `PasswordInput`, `SearchInput`, `Label`, `Checkbox`, `Switch`, `Select`, `Field`                                                                                                                                                                                                                                                                              | Implemented, unit + e2e tested                                                                                                                |
| Forms: `FormField` + `useFormSubmit` (React Hook Form adapter), `FormFeedback`; blocks `ProfileForm`, `SearchFilterForm` (Zod schemas, mock handlers in demos only)                                                                                                                                                                                                                               | Experimental, unit + e2e tested                                                                                                               |
| Overlays: `Dialog`, `Tooltip` (stable), `Sheet` (experimental)                                                                                                                                                                                                                                                                                                                                    | Implemented, unit + e2e tested                                                                                                                |
| Landing page: hero, live component and block previews, templates, lab, projects, case studies, notes, stack, footer                                                                                                                                                                                                                                                                               | Implemented, unit + e2e tested (incl. internal link integrity)                                                                                |
| Blocks: `EmptyState` (stable), `ResourceList`, `ConfirmAction` (experimental)                                                                                                                                                                                                                                                                                                                     | Implemented, unit tested                                                                                                                      |
| Data display: `Table` (sortable headers), `Pagination`, `StatusBadge`, `MetricCard`, `NotificationItem`; blocks `DataTable`, `DataToolbar`, `ErrorState`, `ActivityList`, `DetailPanel`, `OrdersDashboard` (typed mock data, in memory)                                                                                                                                                           | Experimental, unit + e2e tested                                                                                                               |
| Page blocks (category Pages): `DashboardOverview`, `MonitoringDashboard`, `CrudManagementPage`, `SearchFilterToolbar`, `UserProfileSettings`, `NotificationCenter`, `SignInPage` (UI only, no authentication), `MultiStepOnboarding`; plus `Sparkline` (typed, clearly marked mock data in demos; no backend)                                                                                     | Experimental, unit + e2e tested                                                                                                               |
| Preview width switcher (Full / Tablet 768 / Mobile 375) on examples that set `preview.responsive`; the page blocks reflow with container queries                                                                                                                                                                                                                                                  | Implemented, unit + e2e tested                                                                                                                |
| Lab: map projection explorer (SVG), WebGL2 scene with reduced-motion and fallback states                                                                                                                                                                                                                                                                                                          | Experimental, unit + e2e tested; no map or 3D library                                                                                         |
| Routing: nested routes, breadcrumbs, titles/meta, 404s, redirects, lazy pages (see below)                                                                                                                                                                                                                                                                                                         | Implemented, unit + e2e tested (direct load, refresh, back/forward)                                                                           |
| Playground at `/playground`: Button, Input, Badge, Dialog, and Data table with typed controls (boolean, text, option, number), light/dark and preview-width switching, reset, copyable usage code and configuration. Pre-defined examples only; no code is compiled or evaluated                                                                                                                  | Implemented, unit + e2e tested                                                                                                                |
| Templates at `/templates`: Admin dashboard, Operations monitoring, and Data management workspace, each an example app composed only from existing blocks, with invented data, a resizable live preview, and its source                                                                                                                                                                            | Experimental, unit + e2e tested                                                                                                               |
| Project showcase at `/projects`: this site, its component library and design system, and the geospatial and 3D experiments, each with a problem statement, decisions, architecture, evidence-backed challenges, live demos, limitations, and its repository link (the site is not deployed, so there is no deployment link). Public projects only; every claim must cite a file in the repository | Implemented; the content is validated against the repository in unit tests, and the pages are unit + e2e tested                               |
| Documentation at `/docs`: Markdown pages in `src/docs/content/` with nested navigation, breadcrumbs, a table of contents, highlighted code with copy buttons, and props tables, live examples, and design tokens generated from the registry and the stylesheet                                                                                                                                   | Implemented; links, anchors, repository paths, and code-sample imports are validated (`pnpm docs:check`), and the pages are unit + e2e tested |
| Registry entry `Combobox`                                                                                                                                                                                                                                                                                                                                                                         | Planned — its page says so; nothing built                                                                                                     |
| Notes, case studies, and the project showcase                                                                                                                                                                                                                                                                                                                                                     | Typed local data in `src/content/`                                                                                                            |
| MapLibre                                                                                                                                                                                                                                                                                                                                                                                          | Planned — not implemented                                                                                                                     |
| CI (GitHub Actions)                                                                                                                                                                                                                                                                                                                                                                               | Implemented: runs lint, format check, typecheck, unit tests, build, and e2e on pushes to `main` and on pull requests                          |
| Deployment                                                                                                                                                                                                                                                                                                                                                                                        | Not set up                                                                                                                                    |

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 with semantic tokens · Radix UI ·
Lucide · React Router · React Hook Form + Zod · Shiki (lazy-loaded) · marked (docs Markdown) · Vitest + Testing Library · Playwright · ESLint +
Prettier · pnpm.

TypeScript is pinned to 6.0.x and ESLint to 9.x because `typescript-eslint` and
`eslint-plugin-jsx-a11y` do not yet support TypeScript 7 / ESLint 10.

## Getting started

Requirements:

- **Node.js 24+**
- **pnpm 11**. The exact version is pinned in `package.json` (`packageManager`). Run
  `corepack enable` once to have Corepack provide it, or install pnpm 11 globally.

```sh
pnpm install
pnpm dev          # http://localhost:5173
```

For end-to-end tests, install the Playwright browser once:

```sh
pnpm exec playwright install chromium
```

### Environment variables

The app needs none, so there is no `.env.example`. Never commit `.env` files: `.gitignore`
excludes `.env` and `.env.*` (except `.env.example`) and `*.local`.

| Variable   | Used by    | Default | Purpose                                  |
| ---------- | ---------- | ------- | ---------------------------------------- |
| `E2E_PORT` | Playwright | `47317` | Port for the preview server in e2e tests |

## Documentation

The documentation is Markdown in `src/docs/content/`, rendered at `/docs` and listed in
`src/docs/manifest.ts`. Start with `src/docs/content/getting-started.md`. `CHANGELOG.md` is rendered as
the Changelog page. To add or change a page, see `src/docs/README.md`; `pnpm docs:check` validates the
result.

## Scripts

| Script              | Purpose                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Start the dev server                                                                                                                |
| `pnpm build`        | Typecheck and build for production into `dist/`                                                                                     |
| `pnpm preview`      | Serve the production build                                                                                                          |
| `pnpm lint`         | ESLint (type-aware, react-hooks, jsx-a11y); fails on warnings                                                                       |
| `pnpm lint:fix`     | ESLint with autofix                                                                                                                 |
| `pnpm format`       | Format with Prettier                                                                                                                |
| `pnpm format:check` | Check formatting without writing                                                                                                    |
| `pnpm typecheck`    | TypeScript project check                                                                                                            |
| `pnpm test`         | Unit/component tests (Vitest), single run                                                                                           |
| `pnpm test:watch`   | Vitest in watch mode                                                                                                                |
| `pnpm docs:check`   | Validate the docs: links, anchors, repository paths, and code-sample imports (also part of `pnpm test`)                             |
| `pnpm test:e2e`     | Playwright end-to-end tests against the production build (port 47317). Set `SCREENSHOT_DIR` to save captures per viewport and theme |
| `pnpm check`        | Lint, format check, typecheck, tests, build — what CI runs                                                                          |

Run `pnpm check` before pushing. CI also runs `pnpm docs:check` on its own, then `pnpm test:e2e`.

## Routes

| Path                                            | Page                                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| `/`                                             | Landing page                                            |
| `/components`, `/components/:slug`              | Registry components (docs layout)                       |
| `/blocks`, `/blocks/:slug`                      | Registry blocks (docs layout)                           |
| `/docs`, `/docs/<page>`, `/docs/<page>/<child>` | Documentation (Markdown, nested; see `src/docs/`)       |
| `/templates`, `/templates/:slug`                | Example apps built from the blocks (docs layout)        |
| `/playground`, `/playground?example=<id>`       | Interactive examples with typed controls                |
| `/labs`, `/labs/maps`, `/labs/3d`               | Experiments and their categories                        |
| `/labs/:kind/:slug`                             | One experiment, e.g. `/labs/3d/webgl-scene`             |
| `/notes`, `/notes/:slug`                        | Technical notes                                         |
| `/projects`, `/projects/:slug`                  | Public projects and case studies                        |
| `/about`                                        | About the lab, built from the registry and content data |

The route tree is in `src/router/routes.tsx` (React Router data router):

- **Titles, descriptions, breadcrumbs** come from each route's `handle.meta`, resolved in
  `src/router/meta.ts`. Detail routes derive them from their loader data, so pages never repeat them.
  Section copy shared by page headers and metadata lives in `sections` in `src/config/site.ts`.
- **Unknown slugs**: loaders in `src/router/loaders.ts` throw a 404, rendered inside the layout
  (sidebar kept) with a link back to the section. Unmatched URLs hit the `*` route. Docs routes are
  generated from `src/docs/manifest.ts`, and an unknown path under `/docs` is a 404 in the docs layout
  with links to the closest pages.
- **Redirects** (history `replace`, so Back does not bounce): the old `/lab` and `/lab/:slug`,
  a registry slug under the wrong category, an experiment under the wrong lab category, and moved
  docs URLs such as `/docs/architecture` (listed in `docRedirects` in `src/docs/manifest.ts`).
- **Lazy loading**: docs, registry detail, templates, labs, notes, projects, and about pages are
  separate chunks, and each template and its source text are chunks of their own. Loaders and
  metadata stay eager, so 404s and redirects resolve before any chunk loads. The registry (with each
  entry's source text) is still in the main chunk because the navigation lists it.
- **`/projects/:slug`** serves public projects and case studies from one URL space, so a slug is
  unique across both (a test checks it). The loader returns which kind it found.
- Use `createRoutes()`, never a shared array: React Router clears resolved `lazy` keys in place, so
  route objects cannot be reused across routers (e.g. between tests).
- Metadata is set client-side. Crawlers that do not run JavaScript see `index.html`'s defaults.
- **Hosting** needs an SPA fallback (serve `index.html` for unknown paths) so nested URLs load
  directly and on refresh. `pnpm dev` and `pnpm preview` already do this.

## Design tokens

All tokens live in `src/styles/globals.css`: raw values on `:root` and `.light` and on `.dark`, mapped to
Tailwind utilities by `@theme inline`. Components use only these semantic utilities, never raw palette
colors such as `bg-blue-600`.

- The token reference is generated from the stylesheet: `src/docs/content/design-tokens.md`
  (`/docs/design-tokens`).
- Changing a theme, scoped themes, and the theme preference: `src/docs/content/theme-customization.md`
  (`/docs/theming`).
- `src/styles/tokens.test.ts` checks WCAG AA contrast for every text pair in both themes. If a color
  change fails it, adjust the lightness; don't loosen the test.

## Project structure

The repository map, the registry, routing, and code splitting are in
`src/docs/content/project-structure.md` (`/docs/project-structure`).

## Adding a component

See `src/docs/content/adding-a-component.md` (`/docs/component-conventions/adding-a-component`), and
`src/docs/content/component-conventions.md` for how components are written.

## Adding a page block

See `src/docs/content/adding-a-page-block.md` (`/docs/block-composition/page-blocks`), and
`src/docs/content/block-composition.md` for how blocks are composed.

## Adding a template

See `src/docs/content/adding-a-template.md` (`/docs/block-composition/templates`).

## Adding a project

Projects (`/projects`) are public work, shown with its source. They are typed data in
`src/content/showcase-projects.ts`, checked by `validateShowcase` (`src/content/showcase-rules.ts`)
in `src/content/showcase-projects.test.ts`.

- **Only what can be verified.** Each challenge cites `evidence`: repository files, with an optional
  `anchor` (text that must occur in the file, such as a test name). Architecture parts cite an
  entry-point file. The validator fails when a path or an anchor does not exist. Paths are limited to
  `src/`, `e2e/`, `.github/workflows/`, `public/`, and a few root files.
- **No invented claims.** The validator rejects numeric metrics (percentages, milliseconds, stars,
  users), words about customers, employers, revenue, or production use, and links or email addresses
  in prose. That is a tripwire, not proof: the evidence requirement is the real control. Improvements
  are ideas, never commitments.
- **Public only.** `visibility` can only be `'public'`; there is no private variant, so private
  professional work, code, and data have no place in the data. A repository must be
  `https://github.com/<owner>/<repo>` under the account in `siteConfig.githubProfileUrl`.
- **An `application` needs a public repository and a live deployment** (`deployment: { status:
'live', url, verifiedOn }`). The type and the validator both enforce it. Check the URL by hand
  before setting `verifiedOn`. Without one, leave `deployment: { status: 'none' }` and the page says
  "Not deployed yet".
- **Media is what the page shows instead of a claim:** `lab-demo` (an experiment running in the
  page), `registry-example`, `template`, `route-link`, or a `screenshot` under
  `public/showcase/<slug>/` with `alt`, `caption`, `width`, and `height`. All are checked to exist.
- **Case studies** of part of a project stay in `src/content/projects.ts`; link them with
  `relatedCaseStudies`. A slug is unique across projects and case studies.

## Adding a playground example

The playground (`/playground`) runs **only the examples listed in `src/playground/index.ts`**. An
example can render only the components its own module imports; nothing is looked up by name,
compiled, or evaluated at runtime, and ESLint bans `eval`, `new Function`, dynamic `import()`, and
`dangerouslySetInnerHTML` in `src/playground/`.

1. For a component that renders fully from props and text, give its registry entry a `playground`
   (see above) and add `registryExample('<slug>', '<one line>')` to the list. Controls, defaults,
   and generated code are the registry's own.
2. For anything else (compound parts, typed data), add `src/playground/examples/<name>.ts` and
   `<name>-stage.tsx`: declare the controls with `defineControls` and the `booleanControl`,
   `stringControl`, `enumControl`, and `numberControl` factories (a bad default throws when the
   module loads), then `definePlaygroundExample({ id, title, description, controls, resolve,
Stage, code })`. `resolve` turns the validated values into one config object; the `Stage`
   component and `code` both read only that config, so the preview and the copied code cannot
   disagree. Keep the `.ts` logic and the `.tsx` component in separate files.
3. Values are sanitized before `resolve` runs (wrong types, unknown options, out-of-range numbers,
   control characters, over-long text), so an example never sees an invalid value. Numbers typed
   into a field are checked separately and refused with a message instead of being clamped.

The preview width presets resize the preview frame only. Tailwind breakpoints (`sm:`, `md:`) follow
the browser window, not the frame, and only Dialog is portalled into the frame; other portalled
parts (Select, Tooltip) render on the page and do not follow the preview theme.

To add or change a documentation page, see `src/docs/README.md`.

## Troubleshooting

See `src/docs/content/troubleshooting.md` (`/docs/troubleshooting`).
