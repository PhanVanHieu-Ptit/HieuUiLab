# Hieu UI Lab

A personal UI registry and frontend engineering lab: reusable React components with live previews,
copyable source, props documentation, and tests.

## Status

| Area                                                                                                                                                                                                                                                                             | State                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| App shell: header, docs sidebar, mobile drawer, breadcrumbs, ⌘K search, theme menu                                                                                                                                                                                               | Implemented, unit + e2e tested (incl. 360/768/1280 overflow checks)     |
| Design tokens (color, status, elevation, type, layout) and shared state utilities                                                                                                                                                                                                | Implemented, contrast-tested                                            |
| Registry model, validation, catalog search/filter/sort with removable filter chips and search suggestions; detail pages with playground controls, Usage/Source tabs, dependencies, related entries                                                                               | Implemented, unit + e2e tested                                          |
| Actions, display, feedback: `Button`, `Badge`, `Alert`, `Breadcrumb`, `Card`, `Kbd`, `Separator`, `Skeleton`, `Spinner`, `Tabs`                                                                                                                                                  | Implemented, unit tested                                                |
| Form controls: `Input`, `Textarea`, `PasswordInput`, `SearchInput`, `Label`, `Checkbox`, `Switch`, `Select`, `Field`                                                                                                                                                             | Implemented, unit + e2e tested                                          |
| Forms: `FormField` + `useFormSubmit` (React Hook Form adapter), `FormFeedback`; blocks `ProfileForm`, `SearchFilterForm` (Zod schemas, mock handlers in demos only)                                                                                                              | Experimental, unit + e2e tested                                         |
| Overlays: `Dialog`, `Tooltip` (stable), `Sheet` (experimental)                                                                                                                                                                                                                   | Implemented, unit + e2e tested                                          |
| Landing page: hero, live component and block previews, lab, case studies, notes, stack, footer                                                                                                                                                                                   | Implemented, unit + e2e tested (incl. internal link integrity)          |
| Blocks: `EmptyState` (stable), `ResourceList`, `ConfirmAction` (experimental)                                                                                                                                                                                                    | Implemented, unit tested                                                |
| Data display: `Table` (sortable headers), `Pagination`, `StatusBadge`, `MetricCard`, `NotificationItem`; blocks `DataTable`, `DataToolbar`, `ErrorState`, `ActivityList`, `DetailPanel`, `OrdersDashboard` (typed mock data, in memory)                                          | Experimental, unit + e2e tested                                         |
| Lab: map projection explorer (SVG), WebGL2 scene with reduced-motion and fallback states                                                                                                                                                                                         | Experimental, unit + e2e tested; no map or 3D library                   |
| Routing: nested routes, breadcrumbs, titles/meta, 404s, redirects, lazy pages (see below)                                                                                                                                                                                        | Implemented, unit + e2e tested (direct load, refresh, back/forward)     |
| Playground at `/playground`: Button, Input, Badge, Dialog, and Data table with typed controls (boolean, text, option, number), light/dark and preview-width switching, reset, copyable usage code and configuration. Pre-defined examples only; no code is compiled or evaluated | Implemented, unit + e2e tested                                          |
| `/templates`; registry entry `Combobox`                                                                                                                                                                                                                                          | Planned — pages exist and say so; nothing built                         |
| Projects (case studies) and notes                                                                                                                                                                                                                                                | Typed local data in `src/content/`; content describes work in this repo |
| MapLibre, MDX content                                                                                                                                                                                                                                                            | Planned — not implemented                                               |
| CI (GitHub Actions)                                                                                                                                                                                                                                                              | Workflow present; not yet run on GitHub                                 |
| Deployment                                                                                                                                                                                                                                                                       | Not set up                                                              |

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 with semantic tokens · Radix UI ·
Lucide · React Router · React Hook Form + Zod · Shiki (lazy-loaded) · Vitest + Testing Library · Playwright · ESLint +
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

## Scripts

| Script              | Purpose                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`          | Start the dev server                                                                                                     |
| `pnpm build`        | Typecheck and build for production into `dist/`                                                                          |
| `pnpm preview`      | Serve the production build                                                                                               |
| `pnpm lint`         | ESLint (type-aware, react-hooks, jsx-a11y); fails on warnings                                                            |
| `pnpm lint:fix`     | ESLint with autofix                                                                                                      |
| `pnpm format`       | Format with Prettier                                                                                                     |
| `pnpm format:check` | Check formatting without writing                                                                                         |
| `pnpm typecheck`    | TypeScript project check                                                                                                 |
| `pnpm test`         | Unit/component tests (Vitest), single run                                                                                |
| `pnpm test:watch`   | Vitest in watch mode                                                                                                     |
| `pnpm test:e2e`     | Playwright smoke, shell, and responsive tests (port 47317). Set `SCREENSHOT_DIR` to save captures per viewport and theme |
| `pnpm check`        | Lint, format check, typecheck, tests, build — what CI runs                                                               |

Run `pnpm check` before pushing. CI also runs `pnpm test:e2e`.

## Routes

| Path                                                                 | Page                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| `/`                                                                  | Landing page                                            |
| `/components`, `/components/:slug`                                   | Registry components (docs layout)                       |
| `/blocks`, `/blocks/:slug`                                           | Registry blocks (docs layout)                           |
| `/docs`, `/docs/installation`, `/docs/architecture`, `/docs/theming` | Documentation                                           |
| `/templates`                                                         | **Planned** — labelled as such, `noindex`, no content   |
| `/playground`, `/playground?example=<id>`                            | Interactive examples with typed controls                |
| `/labs`, `/labs/maps`, `/labs/3d`                                    | Experiments and their categories                        |
| `/labs/:kind/:slug`                                                  | One experiment, e.g. `/labs/3d/webgl-scene`             |
| `/notes`, `/notes/:slug`                                             | Technical notes                                         |
| `/projects`, `/projects/:slug`                                       | Case studies                                            |
| `/about`                                                             | About the lab, built from the registry and content data |

The route tree is in `src/router/routes.tsx` (React Router data router):

- **Titles, descriptions, breadcrumbs** come from each route's `handle.meta`, resolved in
  `src/router/meta.ts`. Detail routes derive them from their loader data, so pages never repeat them.
  Section copy shared by page headers and metadata lives in `sections` in `src/config/site.ts`.
- **Unknown slugs**: loaders in `src/router/loaders.ts` throw a 404, rendered inside the layout
  (sidebar kept) with a link back to the section. Unmatched URLs hit the `*` route.
- **Redirects** (history `replace`, so Back does not bounce): the old `/lab` and `/lab/:slug`,
  a registry slug under the wrong category, and an experiment under the wrong lab category.
- **Lazy loading**: docs, registry detail, labs, notes, projects, and about pages are separate chunks.
  Loaders and metadata stay eager, so 404s and redirects resolve before any chunk loads. The registry
  (with each entry's source text) is still in the main chunk because the navigation lists it.
- Use `createRoutes()`, never a shared array: React Router clears resolved `lazy` keys in place, so
  route objects cannot be reused across routers (e.g. between tests).
- Metadata is set client-side. Crawlers that do not run JavaScript see `index.html`'s defaults.
- **Hosting** needs an SPA fallback (serve `index.html` for unknown paths) so nested URLs load
  directly and on refresh. `pnpm dev` and `pnpm preview` already do this.

## Design tokens

All tokens live in `src/styles/globals.css`. Raw values are defined on `:root` (light) and
`.dark`, and `@theme inline` exposes them as Tailwind utilities. Components use only these
semantic utilities, never raw palette colors such as `bg-blue-600`.

| Group           | Tokens (utility examples)                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Surfaces / text | `background`, `foreground`, `surface`, `popover`, `muted`, `muted-foreground`, `code`, `overlay` (scrim)                     |
| Interactive     | `primary` (the single accent), `primary-subtle` (active nav, selection), `secondary`, `accent`, `ring`, `input`, `border`    |
| Status          | `success`, `warning`, `info`, `destructive`, each with a `*-foreground` for filled use                                       |
| Elevation       | `shadow-raised`, `shadow-floating` (values differ per theme)                                                                 |
| Type            | `text-display`, `text-title`, `text-heading`, `text-mono`; `font-sans` (IBM Plex Sans), `font-mono` (JetBrains Mono)         |
| Radius          | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` (derived from `--radius`)                                             |
| Layout          | `px-gutter`, `py-section`, `h-header`/`top-header`, `w-sidebar`, `max-w-page`, `max-w-content`, `max-w-prose`, `max-w-sheet` |
| Stacking        | `z-(--z-header)`, `z-(--z-overlay)`, `z-(--z-popover)`                                                                       |
| Motion          | `animate-fade-in/out`, `animate-pop-in/out`, `animate-slide-in/out-left/right`; all collapse under `prefers-reduced-motion`  |

Interaction states are shared utilities, so every control looks the same when focused or disabled:

| Utility            | Effect                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `focus-ring`       | 2px `ring`-colored outline on `:focus-visible` (outline, so it survives forced colors)   |
| `focus-ring-inset` | Same, drawn inside the element; for items in scroll containers                           |
| `disabled-state`   | Dims and blocks pointer input for `:disabled`, `[aria-disabled=true]`, `[data-disabled]` |

Hover uses `hover:bg-accent` (or a `/90` fill for solid buttons), pressed uses `active:` plus a 1px
nudge on buttons, and loading uses `Spinner` / `Button loading` (`aria-busy`).

Name new tokens so they don't collide across utility namespaces: `--text-code` next to
`--color-code` once made `text-code` paint text in the code background color. `tokens.test.ts`
now fails on such clashes.

Spacing otherwise uses Tailwind's default scale (`--spacing: 0.25rem`). The theme is class-based:
`.dark` on `<html>`, set before first paint by the inline script in `index.html` and by
`src/hooks/use-theme.ts`. Users choose Light, Dark, or System from the header theme menu; System
follows the OS setting live.

Both themes also work on any element, not just `<html>`: `.dark` re-declares the dark tokens and
`.light` the light ones, so a region can be light inside a dark page. The playground preview uses
this. Components read tokens through `var(--token)` where they are used, so they follow the nearest
scope; the shared `focus-ring` utilities read `--ring` directly for the same reason.

`src/styles/tokens.test.ts` checks WCAG AA contrast for every text pair in both themes: 4.5:1
for text and 3:1 for the focus ring on every surface. If you change a color and that test fails, adjust the
lightness until it passes. Don't loosen the test.

## Project structure

```
src/
  components/ui/      Registry components (the copyable source)
  components/site/    App shell and docs UI (not part of the registry): header, sidebar,
                      mobile drawer, command menu, theme menu, page/section headers, code panel
  config/site.ts      Navigation and section copy: header, sidebar, drawer, search, footer
  registry/           Entry metadata, demos, and props docs per component
  playground/         The playground: control schemas and validation, the example allowlist,
                      per-example stages and code generators, and the workbench UI
  pages/              Route components
  router/             Route tree, slug loaders, route metadata (titles, breadcrumbs)
  styles/globals.css  Design tokens (light/dark) mapped to Tailwind utilities
  app.test.tsx        App smoke test (boots the real router)
e2e/                  Playwright tests
```

## Adding a component

1. Add the component to `src/components/ui/` (or a block to `src/components/blocks/`) with tests
   next to it.
2. Create `src/registry/<slug>/demos.tsx` and `meta.ts` (see `button/` for the pattern). The entry
   is an `ImplementedEntry` (`src/registry/types.ts`): `id`, `slug`, `kind`, `category`, `tags`,
   `status` (`stable` or `experimental`), `installation`, `source`, `examples`, and `api`, plus
   optional `guidelines` (usage notes and behavioural constraints, shown in a Usage section;
   backticks render as inline code). Each demo is an `export function` whose body is self-contained,
   because the Code tab shows exactly that function. Categories and tags come from `src/registry/taxonomy.ts`; packages and setup requirements from
   `src/registry/packages.ts`.
3. Optionally add a `playground` with `definePlayground(Component, { part, controls })`
   (`src/registry/playground.ts`; see `button/meta.ts`) when the component renders fully from
   props and text. Control props and select options are type-checked against the component's
   props, and `validateRegistry` checks them against the documented API (documented prop, options
   within the documented union, default equal to the documented default). The preview and the
   copyable code are generated from the same resolved props. Entries without one show no
   controls.
4. Add the entry to `src/registry/index.ts`. The sidebar, drawer, search, catalog, landing cards,
   About counts, and detail route all read from that one array.

A planned entry is a `PlannedEntry` (see `src/registry/planned.ts`): metadata and a
`plannedScope`, with no source, examples, or install steps, so it cannot render as implemented.

`validateRegistry` (`src/registry/validate.ts`) runs at startup in development and in the test
suite. It rejects duplicate ids or slugs, unknown categories, tags, packages, or requirements,
missing or planned registry dependencies, dependency cycles, duplicate examples or props,
install steps that drift from what the source actually imports, documented API parts the source
does not export (the Usage tab's import line is built from them), and playground controls that
drift from the documented props.

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

To add a docs page, add an item to `docsNav` in `src/config/site.ts` and a lazy route under `docs`
in `src/router/routes.tsx` with `handle: docsHandle('/docs/<page>')`. The title, description,
breadcrumb, sidebar, and search all follow from the nav entry.

## Troubleshooting

- **`pnpm` is the wrong version or missing:** run `corepack enable`, or check `pnpm -v` against
  `packageManager` in `package.json`.
- **e2e fails with "port already in use":** run `E2E_PORT=48000 pnpm test:e2e`. The config never
  reuses an existing server, so it never tests another project on the same port.
- **e2e fails with "Executable doesn't exist":** run `pnpm exec playwright install chromium`.
- **Typecheck errors appear after pulling:** delete `node_modules/.tmp` (the TypeScript build
  info) and run `pnpm typecheck` again.
