# Install with the shadcn CLI

One entry, [Kbd](/components/kbd), is published as a shadcn registry item. The item is generated from the same registry entry and source file as the Kbd page, so the two cannot disagree. Every other entry is still copied by hand, as [Installation](/docs/installation) describes. This page says what was tested, because a registry that claims more than it ran is worse than none.

## What is published

- The index is `public/r/registry.json` and the item is `public/r/kbd.json`. Both are generated and committed; `pnpm registry:check` fails when they differ from what the registry produces today.
- The item name is `kbd`, which is also the name of an item in shadcn's own registry. Install this one by URL or through the `@hieuuilab` namespace, never with the bare name. [Conflicts and updates](#conflicts-and-updates) shows what the bare name does to a project that has this one.
- This site is not deployed, so no public URL has been tested. The commands below use the address where you serve `public/r`; the next section shows one way to serve it from this repository.

## Install

Replace the address with wherever `public/r` is served. To try it from a clone of this repository, build the site and preview it, which serves `public/r` at `/r`:

```bash title="serve the registry from a clone"
pnpm build
pnpm preview --port 4173
```

Run one of these in the project that should receive the component. Each command pins the CLI version that was tested.

```bash title="pnpm"
pnpm dlx shadcn@4.22.1 add http://localhost:4173/r/kbd.json
```

```bash title="npm"
npx shadcn@4.22.1 add http://localhost:4173/r/kbd.json
```

Register the namespace once if you want to install by name. `registry add` writes the template into `components.json`.

```bash title="install through the namespace"
pnpm dlx shadcn@4.22.1 registry add "@hieuuilab=http://localhost:4173/r/{name}.json"
pnpm dlx shadcn@4.22.1 add @hieuuilab/kbd
```

These are the same commands for the other package runners. They were not run for this registry, so treat them as untested:

```bash title="yarn and bun (untested)"
yarn dlx shadcn@4.22.1 add http://localhost:4173/r/kbd.json
bunx --bun shadcn@4.22.1 add http://localhost:4173/r/kbd.json
```

Preview an install before it writes anything, with `--dry-run` for the list of files, `--diff` for the changes to files that already exist, and `--view` for the incoming file.

```bash title="preview an install"
pnpm dlx shadcn@4.22.1 add http://localhost:4173/r/kbd.json --dry-run
```

## What the install changes

It writes one file, `components/ui/kbd.tsx` in the folder that the `ui` alias of your `components.json` names, and adds the `cn` package to your dependencies if it is missing. It does not change `lib/utils.ts` or any other file. After the install, the CLI prints a note about the tokens the component needs.

The component imports `cn` from the `cn` package, which is what shadcn's own components import since September 2026. The registry entry on this site imports its own helper from `@/lib/cn`, and the generator rewrites that one import when it builds the item.

## Assumptions

- React 19 and TypeScript.
- Tailwind CSS v4, set up CSS-first the way `shadcn init` writes it, with `cssVariables` set to `true` in `components.json`. Tailwind CSS v3 was not tested.
- The color tokens `muted` and `muted-foreground`, and the base-layer rule that gives borders the `border` color. A project created by `shadcn init` has all three.
- The `@/` import alias, or whichever aliases `components.json` names.
- Vite is the only framework that was tested. Next.js and other frameworks were not.

Components that use this site's own tokens (`surface`, `primary-subtle`, `success`, `warning`, `info`, and others) or its `focus-ring` and `disabled-state` utilities cannot be published yet, because a project created by `shadcn init` does not define them. The generator refuses them with a message instead of publishing a component that renders unstyled.

## Conflicts and updates

In every case tested, the CLI replaced a file only when `--overwrite` was given. These results come from the install test, run with the input closed so that no prompt can be answered, as in a script or a CI job. The exit code was 0 in every case, kept files included, so a script must check the file and not the exit code.

| Situation                                              | Plain `add`                                            | With `-y`                                               | With `--overwrite` |
| ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------- | ------------------ |
| The file is identical to the item                      | Skipped                                                | Skipped                                                 | Not tested         |
| You edited `kbd.tsx`, or shadcn's own Kbd is installed | Asks "Would you like to overwrite?" and keeps the file | Same as plain `add`: `-y` does not answer that question | Replaces the file  |
| You customised `lib/utils.ts`                          | Not touched                                            | Not touched                                             | Not touched        |

`--dry-run`, `--diff` and `--view` write nothing, including over a file you edited. `--dry-run` marks the file as an overwrite, `--diff` prints the difference from your file to the incoming one, and `--view` prints the incoming file. Answering the question at an interactive prompt was not tested.

Nothing records which version of the item a file came from, so nothing tells you that the item changed. To update, run `add` with `--diff` to see what differs from your copy. If you want the new version, commit your work first, run `add` with `--overwrite`, and apply your own changes again. If you want to keep your copy, do nothing.

## What was tested

`pnpm registry:install-test` installs the item into a project that `shadcn init` creates in a temporary folder. It serves `public/r` from a small local server, or uses the address you pass with `--base-url`, and it checks, in order:

1. The index resolves, lists the item, and the item resolves.
2. `view`, `list` and `--dry-run` read the registry and write nothing.
3. `add` writes only `kbd.tsx`, with the exact content of the item, and installs `cn`.
4. The project type-checks and builds with the component in use.
5. Playwright opens the built page, and the component is visible, is 20px tall, has a 1px border in the border color, a background that is not transparent, and a monospace font.
6. Each conflict row in the table above.
7. The namespace flow: `registry add`, `search`, and `add @hieuuilab/kbd`.
8. `shadcn registry validate` accepts the registry, and `shadcn build` writes the same content as the committed files, apart from the final newline.

| CLI           | Runner                    | Node.js | Registry address                       | Result                 |
| ------------- | ------------------------- | ------- | -------------------------------------- | ---------------------- |
| shadcn 4.22.1 | pnpm 11.15.1 (`pnpm dlx`) | 22.22.3 | local server, 2026-10-22               | 15 of 15 checks passed |
| shadcn 4.22.1 | npm 10.9.8 (`npx`)        | 22.22.3 | local server, 2026-10-22               | 15 of 15 checks passed |
| shadcn 4.22.1 | pnpm 11.15.1 (`pnpm dlx`) | 22.22.3 | `pnpm preview --port 4173`, 2026-10-22 | 15 of 15 checks passed |

Not tested: any other CLI version, yarn, bun, Windows, Next.js, Tailwind CSS v3, an interactive terminal, a public URL, and Node.js 24, which the repository requires for development.

## How the item is checked

The item is validated against the JSON Schema that shadcn publishes, saved in `src/registry/shadcn/schema`, and against the schema inside the CLI package. Neither schema rejects an unknown field, so the generator adds its own rules. `pnpm registry:check` runs them all:

- every file an item names exists, and the content equals the source after the one import rewrite;
- every package the content imports is declared, and every declared package is used;
- item names are unique, are not the reserved name `registry`, and do not collide with a shadcn item unless the collision is acknowledged in the configuration;
- registry dependencies are never bare names, which shadcn resolves to its own registry;
- no two items write the same file, there are no dependency cycles, and no field outside the emitted set appears;
- the index lists exactly the items that are served, and `public/r` holds nothing else.

`pnpm registry:verify-schema` compares the saved schemas with the published ones. It needs the network, so it is not part of `pnpm test`.

## Publish another entry

Add the slug to `publishedSlugs` in `src/registry/shadcn/config.ts`, run `pnpm registry:build`, then `pnpm registry:check`. The install test exercises Kbd only, so extend it for the new item, run it, and add a row to the table above before claiming that it installs. The generator publishes components only; blocks, tokens and custom utilities need a decision that has not been made.
