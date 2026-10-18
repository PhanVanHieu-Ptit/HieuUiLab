# Troubleshooting

Fixes for problems that the repository's tooling reports or that come up when setting the project up. Each entry gives the symptom, the cause, and what to do. Problems in a project that copied an entry come first.

## Using a copied entry {#copied}

### Borders are drawn in the text color {#borders}

Entries write `border` without a color and rely on the base rule `* { @apply border-border; }` in `src/styles/globals.css`. Tailwind v4 otherwise draws borders in the current text color. Copy that rule; see [Installation](/docs/installation#tokens).

### A utility such as `bg-surface` has no effect {#utilities}

The utility comes from `@theme inline` in the stylesheet. Copy that block along with the `:root, .light` and `.dark` blocks, and check that the stylesheet is imported once. [Design tokens](/docs/design-tokens) lists every utility the tokens create.

### There is no focus outline, or disabled controls do not dim {#state-utilities}

`focus-ring`, `focus-ring-inset`, and `disabled-state` are `@utility` rules in the stylesheet, not Tailwind built-ins. Copy all three; see [Installation](/docs/installation#tokens).

### An import such as `@/lib/cn` cannot be resolved {#alias}

The `@` alias must point at your source folder in both TypeScript and your bundler, and `src/lib/cn.ts` must exist. Follow steps 4 and 5 of [Installation](/docs/installation#cn).

### Dark mode never switches on {#dark-mode}

The dark tokens apply under a `.dark` class, and no entry sets it. Set the class on `<html>` yourself; [Theme customization](/docs/theming#mechanism) shows how this site does it.

## Running this repository {#repository}

### pnpm is the wrong version or is missing {#pnpm}

Run `corepack enable`, then check that `pnpm -v` matches `packageManager` in `package.json`.

### pnpm warns "Unsupported engine" {#node}

The project needs Node.js 24 or newer, as the `engines` field says, and CI uses Node.js 24. Check `node -v`. If an end-to-end test fails on your machine but passes in CI, make sure your Node.js version matches before looking further.

### Typecheck errors appear after pulling {#typecheck}

Delete `node_modules/.tmp`, which holds the TypeScript build information, and run `pnpm typecheck` again.

### The end-to-end tests report "port already in use" {#port}

Run them on another port: `E2E_PORT=48000 pnpm test:e2e`. The configuration never reuses a running server, so it never tests another project that happens to hold the port.

### The end-to-end tests report "Executable doesn't exist" {#browser}

Install the browser once with `pnpm exec playwright install chromium`.

### The dev server stops with "Invalid registry metadata" {#registry}

The registry validator found an entry whose metadata no longer matches its source. The message lists each problem as the entry, the field, and what is wrong. [Adding a component](/docs/component-conventions/adding-a-component#validator) explains each check. `pnpm test` shows the same problems.

### A copy button is missing {#copy-button}

Browsers expose the clipboard only in secure contexts, so a copy button is hidden where it cannot work, for example on a page served over plain HTTP from a host other than `localhost`. The code beside it is still shown.

## Writing the docs {#docs}

### `pnpm format:check` fails on a Markdown file {#format}

Prettier formats Markdown, including `ts`, `tsx`, `json`, and `css` code blocks. Run `pnpm format` and commit the result. It also removes a `[!WARNING]` marker, so use `NOTE`, `TIP`, `IMPORTANT`, or `CAUTION` for an alert.

### `pnpm docs:check` reports a problem {#docs-check}

Each problem reads `docs/<page id>: <message>`. The common ones:

| Message                                                 | Fix                                                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `link … is not a docs page`                             | The path is mistyped, or the page is not in `src/docs/manifest.ts`.                                 |
| `link … points at no heading on …`                      | The heading was renamed. Pin its anchor with `{#id}` and link to that.                              |
| `… does not exist in the repository`                    | Fix the path in inline code, or write a path that only exists in a reader's project without `src/`. |
| `code block "…" imports "…", which is not a dependency` | Import something the project depends on, or add the dependency.                                     |
| `a … code block has no title="…"`                       | Add a title to the opening fence.                                                                   |
| `… belongs to no page in the manifest`                  | Add the page to the manifest, or delete the file.                                                   |
| `::name needs …` or `names "…", which is no …`          | A directive's attribute is missing or names something that does not exist.                          |

A page that shows "Cannot show ::name" is reporting the same directive problem in the browser. The full rules are in `src/docs/README.md`.

### A docs URL shows "Page not found" {#docs-404}

Docs URLs come from the manifest. The 404 suggests the closest pages. If a page moved, add the old URL to `docRedirects` in `src/docs/manifest.ts`, as `/docs/architecture` is.
