# Hieu UI Lab

A personal UI registry and frontend engineering lab: reusable React components with live previews,
copyable source, props documentation, and tests.

## Status

| Area                                                 | State                                   |
| ---------------------------------------------------- | --------------------------------------- |
| App shell (routing, theming, layout)                 | Implemented                             |
| Registry model + component docs page                 | Implemented                             |
| `Button`                                             | Implemented, unit + e2e tested          |
| More primitives, form patterns (RHF + Zod), MapLibre | Planned — not implemented               |
| CI (GitHub Actions)                                  | Workflow present; not yet run on GitHub |
| Deployment                                           | Not set up                              |

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 with semantic tokens · Radix UI ·
Lucide · React Router · Shiki (lazy-loaded) · Vitest + Testing Library · Playwright · ESLint +
Prettier · pnpm.

TypeScript is pinned to 6.0.x and ESLint to 9.x because `typescript-eslint` and
`eslint-plugin-jsx-a11y` do not yet support TypeScript 7 / ESLint 10.

## Getting started

Requires Node 24+ and pnpm 11.

```sh
pnpm install
pnpm dev
```

## Scripts

| Script           | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | Start the dev server                                     |
| `pnpm build`     | Typecheck and build for production                       |
| `pnpm preview`   | Serve the production build                               |
| `pnpm lint`      | ESLint (type-aware, react-hooks, jsx-a11y)               |
| `pnpm format`    | Format with Prettier                                     |
| `pnpm typecheck` | TypeScript project check                                 |
| `pnpm test`      | Unit/component tests (Vitest)                            |
| `pnpm test:e2e`  | Playwright smoke tests (builds and serves on port 47317) |
| `pnpm check`     | Lint, format check, typecheck, tests, build              |

Set `E2E_PORT` to run e2e tests on another port. Install the browser once with
`pnpm exec playwright install chromium`.

## Project structure

```
src/
  components/ui/      Registry components (the copyable source)
  components/site/    App shell and docs UI (not part of the registry)
  registry/           Entry metadata, demos, and props docs per component
  pages/              Route components
  styles/globals.css  Design tokens (light/dark) mapped to Tailwind utilities
e2e/                  Playwright tests
```

## Adding a component

1. Add the component to `src/components/ui/` with tests next to it.
2. Create `src/registry/<slug>/demos.tsx` and `meta.ts` (see `button/` for the pattern).
3. Add the entry to `src/registry/index.ts`. The sidebar, index, and route pick it up automatically.
