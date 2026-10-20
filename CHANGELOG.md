# Changelog

The notable changes to Hieu UI Lab, newest first. The project is at version 0.1.0 and has no tagged releases, so entries are grouped by the date a pull request merged, with its number. Work that is not merged yet is listed under Unreleased.

## Unreleased

- About page: `/about` now introduces the author as a frontend engineer focused on React, TypeScript, reusable UI systems, and practical engineering. Skills are grouped into eight engineering domains, each citing source files and linking to the projects and notes that show it, and learning goals are listed separately as goals, not achievements. The content is one typed profile, `src/content/profile.ts`, checked in `pnpm test` by `validateProfile`: evidence files, anchors, project and note slugs, and npm packages must exist, a goal's package must not be installed yet, and wording such as expert or production-proven is rejected. The GitHub links are shown, and a CV or an email appears only when one is added to the profile. The footer's Contact group reads the same links. The lab inventory, planned entries, and tech stack moved below the profile. The heading is now About Hieu.
- Engineering notes: `/notes` is a technical learning journal of Markdown articles in `src/notes/content/`, with tags (`/notes?tag=react`), article pages with a table of contents, an evidence list, and related articles. Every article follows one template: context, constraints, alternatives, an implementation example, verification with what it does not verify, trade-offs, and references. `pnpm notes:check` validates them against the repository, and CI runs it: a code block must be an excerpt of the file it names or be labelled hypothetical, commands must be the repository's own scripts, and the evidence files must exist. Four articles are new (component APIs, strict TypeScript, React Hook Form with Zod, and registry validation), and the four earlier notes moved to the same format. The guide is `src/notes/README.md`.
- The Markdown rules shared by the docs and the notes moved to `src/docs/markdown-rules.ts`. Showcase evidence can now cite `tsconfig.json` and `tsconfig.app.json`.
- Documentation system: these pages are Markdown files in `src/docs/content/`, with nested sidebar navigation, breadcrumbs, a table of contents, highlighted code blocks with copy buttons, and a 404 that suggests the closest pages. Props tables, design tokens, and live examples are generated from the registry and the stylesheet instead of being copied. `pnpm docs:check` validates internal links, `#heading` anchors, repository paths, and the imports in code samples, and CI runs it. The four hand-written docs pages are replaced, and `/docs/architecture` moved to `/docs/project-structure` and redirects.
- Code blocks highlight TypeScript, JSON, and CSS as well as TSX. Code blocks, props tables, and documentation tables can be scrolled with the keyboard while they overflow.
- Added the `marked` package, which parses the documentation Markdown.
- Templates: three example apps at `/templates` (admin dashboard, operations monitoring, and data management workspace), each built only from registry blocks with invented data.
- Project showcase at `/projects`: public projects whose claims cite files in the repository, checked by a validator.

## 2026-10-16

- Page blocks gallery (#11): eight blocks in the Pages category (dashboard overview, monitoring dashboard, CRUD management page, search and filter toolbar, user profile settings, notification center, sign-in page, and multi-step onboarding), a Sparkline component, and a Full, Tablet, and Mobile width switcher on examples that opt in.

## 2026-10-15

- Playground (#10): `/playground` offers interactive examples with typed controls, light and dark previews, preview widths, reset, and copyable code. It runs only the examples in an allowlist; no code is compiled or evaluated.

## 2026-10-14

- Component catalog (#9): Table, Pagination, Status badge, Metric card, and Notification item, and the Data table, Data toolbar, Detail panel, Error state, Activity list, and Orders dashboard blocks.
- Form components (#8): Field, Form (React Hook Form), Form feedback, Textarea, Search input, and Password input, and the Profile form and Search and filter form blocks.
- Component collections (#7): Alert, Checkbox, Input, Label, Select, Switch, and Tooltip.
- Rendering architecture (#6): typed registry metadata with a validator, categories and tags, planned entries, install-step resolution, and a catalog whose search, filters, and sort live in the URL.
- Route structure (#5): nested routes in a React Router data router, with per-route titles and descriptions, breadcrumbs, 404 pages inside the layout, redirects, and lazy-loaded pages. The first Installation and Architecture docs pages and the About page.

## 2026-10-13

- Landing page (#4): the landing page, the Confirm action, Empty state, and Resource list blocks, the map projection and WebGL labs, and the notes and case studies.
- Design system (#3): Badge, Breadcrumb, Card, Dialog, Kbd, Separator, Sheet, Skeleton, Spinner, and Tabs, the Introduction and Theming docs pages, and the first responsive layout checks.
- Technical baseline (#2): the contrast test for the design tokens and an app smoke test.
- Project setup (#1): Vite, React, TypeScript, and Tailwind CSS, the CI workflow, Playwright, and the first registry entry, Button.
