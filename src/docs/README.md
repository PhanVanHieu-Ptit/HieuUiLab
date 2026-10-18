# Writing the docs

The documentation pages are Markdown files in `src/docs/content/`, listed in `src/docs/manifest.ts`. The site renders them with its own components. A validator checks them against the repository, so a broken link or a code sample that imports something that does not exist fails `pnpm docs:check` and CI.

## Add a page

1. Create `src/docs/content/<id>.md`. The first line is `# Title`, and it must equal the title in the manifest. The page header shows the title as the page's only h1, so the file's heading is not rendered twice.
2. Add an entry to `docGroups` in `src/docs/manifest.ts`: `id`, `slug`, `title`, `description` (a sentence that ends with a period), optional `keywords` for search, and `load: () => import('./content/<id>.md?raw')`. Put it in a group, or in a page's `children` to nest it under that page at `<its URL>/<slug>`.
3. Run `pnpm format` and `pnpm docs:check`.

The sidebar, mobile drawer, search, breadcrumbs, previous and next links, and the route all follow from the manifest. To move a page's URL, keep the old one working by adding it to `docRedirects`.

## What the Markdown supports

Paragraphs, lists, tables, block quotes, rules, links, inline code, emphasis, and fenced code blocks. Use `##`, `###`, and `####` headings without skipping a level.

It does not support raw HTML, images, task lists, indented code blocks, or headings inside lists and quotes. A page that uses them still renders, with the construct shown as typed in a note, and fails validation.

HTML entities such as `&amp;` are shown as typed, so write the character itself.

### Headings and anchors

A heading's anchor is made from its text: `## Add the cn helper` is `#add-the-cn-helper`. To pin an anchor that other places link to, write it explicitly: `## Add the cn helper {#cn}`. The registry's setup requirements link to `#cn` and `#tokens` on the Installation page, and the validator checks that they resolve. The id `main` is reserved.

### Alerts

```md
> [!NOTE]
> A note.
```

The kinds are `NOTE`, `TIP`, `IMPORTANT`, and `CAUTION`. There is no `WARNING`: Prettier 3.9 removes a `[!WARNING]` marker when it formats the file, which turns the alert into a plain quote.

### Code blocks

Open a fence with a language and a title: ` ```tsx title="src/main.tsx" `. The language is one of `tsx`, `ts`, `json`, `css`, `bash`, or `text`; `bash` and `text` are not highlighted. The title names the file or the action, and the copy button is named `Copy <title>`, so give each block on a page a different title.

The validator reads the imports of `ts` and `tsx` blocks. A `@/…` import must be a file under `src/`, a package must be in `package.json`, and a relative import is rejected, because a reader cannot resolve it. Prettier formats `ts`, `tsx`, `json`, and `css` blocks along with the file, so write them in the project's style.

### Links

A link is an `https://` URL, a `/path` on this site, or a `#heading` on the same page. A `/docs/…` path must be a page, and its `#heading` must exist on it. The sections of a registry entry's page are `#examples`, `#code`, `#installation`, `#dependencies`, `#api`, and `#related`. A link to a URL that moved is rejected, so link to the new one.

A path written in inline code, such as `src/lib/cn.ts`, must exist in the repository. Write a path that only exists in a reader's project without the `src/` prefix, or add a placeholder such as `<slug>`, which is not checked.

## Generate, do not copy

Content that exists as typed data is pulled in with a directive: a paragraph with only `::name{key="value"}`. The validator rejects a hand-written props table, a hand-written table of design tokens, and a code block that repeats registry source.

| Directive                                          | Shows                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| `::registry-api{slug="button" part="Button"}`      | The props tables of an entry; omit `part` for every part                 |
| `::registry-index{kind="component"}`               | Every implemented entry with its status and exports; optional `category` |
| `::registry-example{slug="form" example="invite"}` | A live example with its real source                                      |
| `::source{path="src/lib/cn.ts"}`                   | A repository file; the paths are listed in `src/docs/sources.ts`         |
| `::design-tokens{group="color"}`                   | A group of tokens read from `src/styles/globals.css`                     |
| `::theme-switcher`                                 | The Light, Dark, and System control                                      |

A directive that names something that does not exist renders a note in place of the content and fails validation. Directives work only at the top level of a page, not inside lists or quotes.

## Style

- Describe what exists. Do not write instructions for a feature that is not built, and do not write "coming soon", "upcoming", or "TODO". Where the repository says something is missing or planned, say so plainly, as the Testing strategy page does for visual tests.
- Use the project's names: entry, component, block, page block, template, token, registry. Spell tools as GitHub, TypeScript, JavaScript, Node.js, pnpm, Tailwind CSS, Playwright, Vitest, ESLint, Prettier, and Shiki, and write "end-to-end" in prose (`e2e` belongs in paths and commands). Write "data table" for the concept and `DataTable` for the component. The validator checks these spellings.
- Headings are in sentence case. Cite the repository path of anything you describe, in inline code.
- Avoid numbers that change, such as entry counts and test counts. Link to the generated list instead.

## The changelog

`CHANGELOG.md` at the repository root is rendered as the Changelog page. Its first `##` section is `Unreleased`, followed by one section per date as `## 2026-10-16`, newest first, each with a list of changes.

## Checking

`pnpm docs:check` runs the tests in `src/docs`. Each problem is reported as `docs/<page id>: <message>`. The rules are in `src/docs/docs-rules.ts`, and `src/docs/docs-rules.test.ts` shows one failing example for each.
