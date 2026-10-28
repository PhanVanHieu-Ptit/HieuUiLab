# Writing an engineering note

The engineering notes are a technical learning journal. Each article is a Markdown file in `src/notes/content/`, described by an entry in `src/notes/manifest.ts`. The site renders them with the same components as the docs, and a validator checks them against the repository, so a code block that is not in its file, or a section that is missing, fails `pnpm notes:check` and CI.

The rule behind every other rule: an article says only what the repository can show. It does not describe an incident that cannot be verified, it does not claim that a problem was solved unless something was run to show it, and it does not name an employer, a team, or a customer.

## Add an article

1. Create `src/notes/content/<slug>.md`. The first line is `# Title`, and it must equal the title in the manifest.
2. Add an entry to `entries` in `src/notes/manifest.ts`:
   - `slug`, `title`, and a `summary` that is one sentence ending with a period, at most 220 characters;
   - `date`, and `updated` when claims were re-checked later;
   - one to four `tags` from `noteTags`, and optionally `related` slugs (a link counts both ways);
   - `evidence`: at least one repository file, each with an `anchor` that occurs in it, such as the name of the test that proves the claim;
   - `load: () => import('./content/<slug>.md?raw')`.
3. Run `pnpm format` and `pnpm notes:check`.

The index, the tag filter, the related list, the home page, and the About count all follow from the manifest.

## The template

Every article has these `##` sections, in this order:

1. Context and problem
2. Constraints
3. Approach and alternatives considered
4. Implementation example
5. Verification, with a `### What this does not verify` subsection
6. Trade-offs and lessons learned
7. References, if and only if the article links to an external source

An article has at least 600 words outside code, and each section has at least 30. Those floors only keep a stub from passing; they do not make an article good.

## Code blocks

Every fenced block has a title, and the title says what kind of block it is:

- **An excerpt of a repository file.** The title is the path, optionally followed by a note in parentheses, such as `src/hooks/use-theme.ts (the subscription)`. Every part of the block must occur in that file, in order. Whitespace, semicolons, and trailing commas do not matter, so Prettier can re-wrap the block. Leave code out with a line that is only `// …`, `/* … */`, `{/* … */}`, `# …`, or `<!-- … -->`.
- **A hypothetical example.** The title starts with `Hypothetical example:` and says what it is, for example `Hypothetical example: a throwaway check, not in the repository`. Use it for code that is not in the repository, including a check that was run once and not kept, and for compiler output that was reproduced.
- **A command.** A `bash` block whose title starts with `Command:`. Each line is a `pnpm` command, the script must exist in `package.json`, and a `src/` or `e2e/` path must exist.

Give each block on a page its own title, because the copy button is named after it. The fence languages are `tsx`, `ts`, `json`, `css`, `bash`, and `text`; `bash` and `text` are not highlighted. Imports are not checked, because an excerpt is real code and a hypothetical example is labelled.

## Honesty checklist for a reviewer

The validator catches the mechanical slips. These need a person:

- **Run it.** Every command in Verification was run, and the result is what the article says. If a claim rests on an experiment, say what was changed, what happened, and that it was reverted.
- **Say what was not checked.** `What this does not verify` names the gaps: untested browsers, untested configurations, claims taken from a document, measurements not made. An empty or evasive subsection is a defect.
- **Cite only what was opened.** A link in References is a page that was read, and the entry says what it supports. If a source could not be opened, say so under `What this does not verify` and do not cite it.
- **Label guesses.** Reasoning about an alternative that was not tried is written as reasoning ("the reasoning is…"), not as a finding.
- **Keep to the repository.** No past incidents, no customers, no workplace details, no first-person history. The validator rejects the obvious phrases; the rest is judgment. Numbers that carry a unit are rejected in prose, because a performance or popularity figure needs a method that belongs in the article, not in a sentence.
- **Report limitations found.** When writing turns up a gap in the code, write it down as a limitation. Do not fix it silently in the same change, and do not leave it out.

## Tags and related articles

`noteTags` in the manifest is a closed list, so a typo is a type error. To add a tag, add it there. An article links to related articles in two ways: a slug in `related` counts three, and each tag in common counts one. Every article must have at least one related article, so the page never shows an empty section.

## What the Markdown supports

The notes use the same Markdown as the docs: paragraphs, lists, tables, block quotes, links, inline code, emphasis, alerts, and fenced code. [The docs guide](../docs/README.md) lists what is and is not supported. Directives are for the docs and are rejected in notes. A path written in inline code, such as `src/lib/cn.ts`, must exist. Write "end-to-end" in prose, and spell tool names the way the docs do.

## Not written yet

These topics were proposed and are not articles, because the repository does not yet contain what an honest article would need. Nothing on the site names them.

- **Managing server state with TanStack Query.** `@tanstack/react-query` is not a dependency, and the examples use mock data and no network. A source rule forbids network calls in blocks and templates. It needs a real use of the library, with a test.
- **Publishing a React UI library to npm.** `package.json` is private, and there is no library build, `exports` map, or release workflow. It needs an actual package build to describe and check.
- **Writing reliable component tests, structuring providers, routing, and layouts, and investigating frontend performance.** The repository has material for each: the testing strategy page, the router and layout components, and the Performance docs page. They are not written yet. The performance note would be the first to need field data, which the repository does not have: `pnpm perf:measure` makes lab runs on one machine and does not commit its results, and the Reproduce the quality checks docs page says what it can and cannot tell you.
