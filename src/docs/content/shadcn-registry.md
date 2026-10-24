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

## Supported commands

Every command here belongs to the official CLI. Hieu UI Lab has no CLI of its own, and [Why there is no Hieu UI Lab CLI](#why-there-is-no-hieu-ui-lab-cli) says why. A command is listed as supported only if it was run with shadcn 4.22.1, through `pnpm dlx` and through `npx`, by one of the two tests under [What was tested](#what-was-tested). `shadcn` below stands for either runner with the version pinned, and `<address>` for where `public/r` is served.

| Command                                                                                    | What it does                                                                       |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `shadcn add <address>/kbd.json`                                                            | Installs the item                                                                  |
| `shadcn registry add "@hieuuilab=<address>/{name}.json"`, then `shadcn add @hieuuilab/kbd` | Installs by name                                                                   |
| `shadcn add <address>/kbd.json --dry-run`, `--diff` or `--view`                            | Previews the files, the dependencies and the changes; writes nothing               |
| `shadcn add <address>/kbd.json --overwrite`                                                | Replaces a file that differs from the item                                         |
| `shadcn view <address>/kbd.json`                                                           | Prints the item as JSON                                                            |
| `shadcn list <address>/registry.json` and `shadcn search @hieuuilab`                       | Lists the items                                                                    |
| `shadcn init -t vite -b radix -p nova -y --no-monorepo -n sample`                          | Creates the Vite project and `components.json` that the tests install into         |
| `shadcn registry validate` and `shadcn build`, from a registry's own checkout              | Maintainer commands; the install test runs them on a copy of this registry's files |

`add` needs a `components.json`. Use your project's, or run `init` first: without one, even `add --dry-run` starts the questions of `init`, which [ends with exit code 0 and nothing done](#when-an-install-fails) when it has no terminal. An interactive `init` was not tested.

## Registry address

The address is not built into the item or the commands. The `@hieuuilab` namespace is a URL template in the `registries` entry of `components.json`, and `registry add` only writes it, so moving the registry means editing one line. The template may name an environment variable, which the CLI fills in when it runs:

```json title="components.json, registry address from an environment variable"
{
  "registries": {
    "@hieuuilab": "${HIEUUILAB_REGISTRY_URL}/{name}.json"
  }
}
```

Both outcomes were tested with a crafted item on a local server: with `HIEUUILAB_REGISTRY_URL` set to the address, `add @hieuuilab/<name>` installs it, and without the variable the CLI exits with 1, names the variable, and makes no request. `registry add` refuses a template that lacks `{name}`. Headers and parameters in a registry entry, and variables read from an `.env` file, were not tested.

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

In every case tested, the CLI replaced a file only when `--overwrite` was given. These results come from the install test, run with the input closed so that no prompt can be answered, as in a script or a CI job. The exit code was 0 in every case of this table, kept files included, so a script must check the file and not the exit code. Other failures exit with 1, as [When an install fails](#when-an-install-fails) shows.

| Situation                                              | Plain `add`                                            | With `-y`                                               | With `--overwrite` |
| ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------- | ------------------ |
| The file is identical to the item                      | Skipped                                                | Skipped                                                 | Not tested         |
| You edited `kbd.tsx`, or shadcn's own Kbd is installed | Asks "Would you like to overwrite?" and keeps the file | Same as plain `add`: `-y` does not answer that question | Replaces the file  |
| You customised `lib/utils.ts`                          | Not touched                                            | Not touched                                             | Not touched        |

`--dry-run`, `--diff` and `--view` write nothing, including over a file you edited. `--dry-run` marks the file as an overwrite, `--diff` prints the difference from your file to the incoming one, and `--view` prints the incoming file. Answering the question at an interactive prompt was not tested.

Nothing records which version of the item a file came from, so nothing tells you that the item changed. To update, run `add` with `--diff` to see what differs from your copy. If you want the new version, commit your work first, run `add` with `--overwrite`, and apply your own changes again. If you want to keep your copy, do nothing.

## When an install fails

These results come from `pnpm registry:failure-test`, which serves crafted answers from a local server and runs the CLI with the input closed. The messages are quoted from shadcn 4.22.1, shortened where `<url>` or `...` stands. After each one the CLI also suggests retrying with an older version, which was not tested. In every row, the project was left as it was and no file appeared outside it.

| Situation                                          | Exit | The CLI says                                                                                                         | What to do                                                      |
| -------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| The item address answers 404                       | 1    | `The item at <url> was not found. It may not exist at the registry.`                                                 | Check the name and the address                                  |
| It answers 401 or 403                              | 1    | `You are not authorized to access the item at <url>. If this is a remote registry, you may need to authenticate.`    | The registry wants credentials; this one does not               |
| It answers 410                                     | 1    | `The item at <url> is no longer available. It may have been removed or expired.`                                     | The item was removed                                            |
| It answers 500                                     | 1    | `Failed to fetch from registry (500): <url>`                                                                         | Try again later                                                 |
| Nothing is listening                               | 1    | `Request to <url> failed, reason: connect ECONNREFUSED 127.0.0.1:<port>`                                             | Check the network and the address                               |
| The answer is not JSON, such as an HTML error page | 1    | `Unexpected token '<', "<!doctype "... is not valid JSON`                                                            | The message does not name the address; open it in a browser     |
| The item breaks the schema                         | 1    | `Failed to parse registry item: <url>`, then `- name: Invalid input: expected string, received undefined`            | The item is wrong; tell its maintainer                          |
| `@name/item` and `@name` is not configured         | 1    | `Unknown registry "@name". Make sure it is defined under "registries" in your components.json or package.json file:` | Run `registry add`                                              |
| The address names a variable that is not set       | 1    | `Registry "@hieuuilab" requires the following environment variables:` and the name                                   | Set the variable                                                |
| The address given to `registry add` lacks `{name}` | 1    | `URL must include {name} placeholder`                                                                                | Add the placeholder                                             |
| A local file does not exist                        | 1    | `Failed to read local registry file: ./missing.json`                                                                 | A relative path is read from where you run the command          |
| A file path or `target` leaves the project         | 1    | `We found an unsafe file path "<path>" in the registry item. Installation aborted.`                                  | Do not install that item                                        |
| A dependency name starts with `-`                  | 1    | `Invalid dependency "--...": dependency names cannot start with "-".`                                                | The item is wrong; tell its maintainer                          |
| A dependency cannot be installed                   | 1    | `Command failed with exit code 1: ` and the package manager's own command and error                                  | The component file is not written; fix the dependency and retry |
| A registry dependency of the item does not exist   | 1    | The 404 message above, for the dependency's address                                                                  | The item is wrong; tell its maintainer                          |

Some results are easy to miss, because the exit code is 0:

- A file entry without `content` prints `No files updated.`, and an empty `files` list prints nothing after `Checking registry.` Neither is an error to the CLI. The generator and `pnpm registry:check` refuse both for this registry.
- `add --dry-run` in a folder without `components.json` shows the questions of `init` and stops.
- `--dry-run` does not apply the safety check of the real command. For an item whose file path leaves the project, it exits with 0 and lists the file as `create`, while `add` without `--dry-run` refuses. A dry run shows what an item asks for, not whether the install will be allowed. Nothing was written either way.
- A key the schema does not know, such as `author`, is ignored.

Some things the CLI does not check:

- A name goes into the address unchanged. `@hieuuilab/../../x` asked the server for `/x.json` on the same host, and `@hieuuilab/Not-Kebab` for `/r/Not-Kebab.json`. The host decides what such a name finds.
- A name with shell characters stays one name. `@hieuuilab/kbd; touch pwned` was requested as written and no command ran. That the CLI starts package managers without a shell comes from reading its code, not from a run.
- `~/` at the start of a file `target` means the root of your project, not your home directory.

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

`pnpm registry:failure-test` creates the same kind of project and serves crafted answers from a local server. Each case checks the exit code, the message in [When an install fails](#when-an-install-fails), that the project is unchanged, and that nothing was written outside it. The cases are:

1. Names: one that is not kebab-case, one with `../`, one with shell characters, an unconfigured namespace, and a registry address without `{name}`.
2. Missing files and bad answers: the statuses 401, 403, 404, 410 and 500, a missing registry dependency, a missing local file, a server that is not running, a file without content, and an empty file list.
3. Malformed items: an answer that is not JSON, an HTML page, three schema errors, and a key the schema does not know.
4. Paths: a relative `target`, an absolute one, a relative `path`, each with and without `--dry-run`, and a `target` that starts with `~/`.
5. Dependencies: a name that starts with `-`, a package that is not on npm, and `--dry-run` listing a dependency without installing it.
6. The registry address from an environment variable, set and unset.
7. `add --dry-run` in a folder without `components.json`.

| CLI           | Runner                    | Node.js | Registry address                          | Result                         |
| ------------- | ------------------------- | ------- | ----------------------------------------- | ------------------------------ |
| shadcn 4.22.1 | pnpm 11.15.1 (`pnpm dlx`) | 22.22.3 | local server, 2026-10-22                  | 15 of 15 checks passed         |
| shadcn 4.22.1 | npm 10.9.8 (`npx`)        | 22.22.3 | local server, 2026-10-22                  | 15 of 15 checks passed         |
| shadcn 4.22.1 | pnpm 11.15.1 (`pnpm dlx`) | 22.22.3 | `pnpm preview --port 4173`, 2026-10-22    | 15 of 15 checks passed         |
| shadcn 4.22.1 | pnpm 11.15.1 (`pnpm dlx`) | 22.22.3 | crafted answers, local server, 2026-10-23 | 36 of 36 failure checks passed |
| shadcn 4.22.1 | npm 10.9.8 (`npx`)        | 22.22.3 | crafted answers, local server, 2026-10-23 | 36 of 36 failure checks passed |

Every run was local, on one Apple-silicon Mac (macOS 15.7.4 for the runs of 2026-10-23). The install test was run again on 2026-10-23, after its helpers moved to a shared file, with the same 15 of 15 on both runners.

Not tested: any other CLI version, yarn, bun, Windows, Linux, Next.js, Tailwind CSS v3, an interactive terminal, an interactive `init`, headers or parameters in a registry entry, `.env` files, the `--path` option, a public URL, and Node.js 24, which the repository requires for development. The install workflow runs both tests on Linux with Node.js 24, and its first result is not recorded here.

## Why there is no Hieu UI Lab CLI

A CLI of our own was considered and not built. The official one does what it would have to do, and each item below was run, except where it says otherwise:

- Initial configuration: `init` and `components.json`.
- Lookup and retrieval: `list`, `search` and `view`, and `add` by address or by namespace.
- Validation: the item is parsed against its schema, and a malformed one is refused with the field named.
- Copying files, reporting the files and dependencies first with `--dry-run`, and keeping a file that you changed unless `--overwrite` is given.
- A configurable address, in `components.json`, optionally from an environment variable.
- Refusing paths that leave the project, and refusing a dependency name that looks like an option.

The gaps are listed in [When an install fails](#when-an-install-fails): a dead server and an answer that is not JSON get a bare message with no suggestion, `--dry-run` does not apply the path check, some malformed items exit with 0, and the CLI does not check names. A CLI of ours would have to be published to npm and kept in step with the registry and with shadcn, and none of those gaps needs one: this page and the failure test describe them. The one problem that a wrapper could fix is that a bare `shadcn add kbd` installs shadcn's own Kbd. It would not help anyone who types that command, and the namespace avoids it.

Reconsider when the registry has a public address and a published package, and installs of the wrong Kbd keep happening, or when a script needs a guarantee that the CLI does not give, such as a non-zero exit code for a file it kept.

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

Add the slug to `publishedSlugs` in `src/registry/shadcn/config.ts`, run `pnpm registry:build`, then `pnpm registry:check`. The install test exercises Kbd only, so extend it for the new item, run it, and add a row to the table above before claiming that it installs. The failure test serves crafted items, so a new entry does not change it. The generator publishes components only; blocks, tokens and custom utilities need a decision that has not been made.
