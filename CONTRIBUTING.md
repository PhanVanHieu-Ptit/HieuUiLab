# Contributing to Hieu UI Lab

Thank you for looking at the project. This is a personal lab, so changes are reviewed by one person and the scope is small on purpose. Open an issue before a large change, so that the work is not wasted.

By contributing you agree that your contribution is released under the MIT License in `LICENSE`.

## Set up

You need Node.js 24 or newer and pnpm 11. `packageManager` in `package.json` pins the exact pnpm, and `corepack enable` provides it.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # once, for the end-to-end tests
pnpm dev                                # http://localhost:5173
```

## Before you open a pull request

Work on a branch, one change per branch and per pull request, as the history of the repository shows. Write the commit message as `feat: short-name`, `fix: short-name`, or `docs: short-name`.

Run `pnpm check`. It runs the lint, the format check, the type check, the unit tests, the build, and the check of the build output, and it must pass. If you changed what a visitor sees or does, also run `pnpm test:e2e`; if you changed a page or a state, add it to the list in `e2e/a11y.spec.ts`. The docs page [Reproduce the quality checks](src/docs/content/reproducing-checks.md) lists every command, what it shows, and what it does not.

A fix comes with a test that fails without it. A new component, block, or page comes with tests next to it.

## Where things go

| You are adding                                                 | Read                                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| A component                                                    | `src/docs/content/adding-a-component.md` and `component-conventions.md` |
| A page block                                                   | `src/docs/content/adding-a-page-block.md`                               |
| A template                                                     | `src/docs/content/adding-a-template.md`                                 |
| A documentation page                                           | `src/docs/README.md`                                                    |
| An engineering note                                            | `src/notes/README.md`                                                   |
| A project, a playground example, or a change to the About page | the matching sections of `README.md`                                    |

The same pages are on the site under Docs.

## What is checked

- **Claims need evidence.** The docs, the notes, the project showcase, and the About profile are validated against the repository. A quotation that is not in the file it names, a path that does not exist, or wording such as "production-proven" in the profile or the showcase fails a test. Describe what exists and say what does not; do not write "coming soon".
- **Strict TypeScript and no `any`.** ESLint runs with the strict type-checked rules and treats `any` as an error. Give an `eslint-disable` a reason on the same line or the line above; review checks that, not a rule.
- **End-to-end specs import `test` and `expect` from `e2e/fixtures.ts`.** That fixture fails a test that requests another site, so the tests do not depend on the network.
- **Colors come from the tokens** in `src/styles/globals.css`: no palette colors and no `dark:` variants. A test enforces it for blocks and templates; for other components it is a convention that review checks.
- **No secret in the repository or the build.** `VITE_` variables are public. `.env` files are ignored, and `pnpm dist:check` fails a build that contains a secret-shaped value.
- **A new dependency needs a line in `THIRD-PARTY-NOTICES.md`** if the site ships it. A test fails until it has one.

## Reporting a problem

For a bug, open an issue with the steps that reproduce it and the page or command involved.

If you find a security problem, please do not describe it in a public issue. Use the repository's Security tab on GitHub to report it privately if that is available, or contact the owner through the GitHub profile linked from the About page.
