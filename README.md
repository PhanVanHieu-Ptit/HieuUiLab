# Hieu UI Lab

A personal UI registry and frontend engineering lab: reusable React components with live previews,
copyable source, props documentation, and tests.

## Status

| Area                                                                                       | State                                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| App shell: header, docs sidebar, mobile drawer, breadcrumbs, ⌘K search, theme menu         | Implemented, unit + e2e tested (incl. 360/768/1280 overflow checks) |
| Design tokens (color, status, elevation, type, layout) and shared state utilities          | Implemented, contrast-tested                                        |
| Registry model + component docs page                                                       | Implemented                                                         |
| `Button`, `Badge`, `Breadcrumb`, `Card`, `Kbd`, `Separator`, `Skeleton`, `Spinner`, `Tabs` | Implemented, unit tested                                            |
| `Dialog`, `Sheet`                                                                          | Beta, unit + e2e tested                                             |
| Blocks section                                                                             | Shown as "Soon" in the nav; not implemented                         |
| Form controls, form patterns (RHF + Zod), MapLibre                                         | Planned — not implemented                                           |
| CI (GitHub Actions)                                                                        | Workflow present; not yet run on GitHub                             |
| Deployment                                                                                 | Not set up                                                          |

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 with semantic tokens · Radix UI ·
Lucide · React Router · Shiki (lazy-loaded) · Vitest + Testing Library · Playwright · ESLint +
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

`src/styles/tokens.test.ts` checks WCAG AA contrast for every text pair in both themes: 4.5:1
for text and 3:1 for the focus ring on every surface. If you change a color and that test fails, adjust the
lightness until it passes. Don't loosen the test.

## Project structure

```
src/
  components/ui/      Registry components (the copyable source)
  components/site/    App shell and docs UI (not part of the registry): header, sidebar,
                      mobile drawer, command menu, theme menu, page/section headers, code panel
  config/site.ts      Navigation: the one source for header, sidebar, drawer, search, breadcrumbs
  registry/           Entry metadata, demos, and props docs per component
  pages/              Route components
  styles/globals.css  Design tokens (light/dark) mapped to Tailwind utilities
  app.test.tsx        App smoke test (boots the real router)
e2e/                  Playwright tests
```

## Adding a component

1. Add the component to `src/components/ui/` with tests next to it.
2. Create `src/registry/<slug>/demos.tsx` and `meta.ts` (see `button/` for the pattern).
3. Add the entry to `src/registry/index.ts`. The sidebar, drawer, search, index, and route pick it
   up automatically.

To add a docs page, add a route under `DocsLayout` in `src/routes.tsx` and an item to `docsNav`
in `src/config/site.ts`; breadcrumbs and search follow from the nav entry.

## Troubleshooting

- **`pnpm` is the wrong version or missing:** run `corepack enable`, or check `pnpm -v` against
  `packageManager` in `package.json`.
- **e2e fails with "port already in use":** run `E2E_PORT=48000 pnpm test:e2e`. The config never
  reuses an existing server, so it never tests another project on the same port.
- **e2e fails with "Executable doesn't exist":** run `pnpm exec playwright install chromium`.
- **Typecheck errors appear after pulling:** delete `node_modules/.tmp` (the TypeScript build
  info) and run `pnpm typecheck` again.
