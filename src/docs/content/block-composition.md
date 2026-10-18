# Block composition

A block is a registry entry assembled from other registry entries. This page explains how blocks are composed, what a block may import, and where page blocks and templates fit. The step-by-step recipes are [Adding a page block](/docs/block-composition/page-blocks) and [Adding a template](/docs/block-composition/templates).

## Components, blocks, and templates {#levels}

- A **component** lives in `src/components/ui/` and is one control or surface, such as [Button](/components/button) or [Table](/components/table). [Component conventions](/docs/component-conventions) describes how they are written.
- A **block** lives in `src/components/blocks/`. It composes components, and sometimes other blocks, into a pattern with its loading, empty, error, and success states handled, such as [Data table](/blocks/data-table) or [Resource list](/blocks/resource-list).
- A **page block** is a block in the Pages category: a whole screen, such as [Dashboard overview](/blocks/dashboard-overview) or [Sign-in page](/blocks/sign-in-page).
- A **template** is an example app built from several blocks, at [Templates](/templates). It is not a registry entry. A registry block is one flat file that you copy alone, and a template spans several files.

## What a block may import {#imports}

A block has to be copyable on its own, so the registry validator limits what its file can import:

- other registry components and blocks, as `@/components/ui/…` and `@/components/blocks/…`;
- `@/lib/cn`;
- the npm packages listed in `src/registry/packages.ts`, plus `react` and `react-dom`.

Any other `@/` path or a relative import is an error, because a project that copies the file would not have it. The entry's `registryDependencies` must name exactly the registry files the source imports: none missing and none extra. The validator also rejects a dependency on a planned entry and a dependency cycle. That list is what readers see as "copy these first" in the entry's Installation section, and it feeds the Dependencies section. The [CRUD management page](/blocks/crud-management-page#dependencies) is a good example to read, since it composes many entries.

## Pass data and state in through props {#props}

Blocks do not fetch anything. They take their data and their handlers as props:

- **Typed props with documented defaults.** The main part of a page block must document every prop with a type and a description.
- **A state union.** Loading, error, and ready are one value, `{ status: 'loading' }`, `{ status: 'error' }`, or `{ status: 'ready', items }`, and ready with no items is the empty state. [Data table](/blocks/data-table) and [Resource list](/blocks/resource-list) share this shape, so they compose.
- **The clock passed in.** A block takes the current time as a prop (`asOf`) instead of reading it while rendering, so a screen renders the same way every time.

## Example data stays out of the block {#mock-data}

The blocks run on invented data and say so. The data lives in `src/registry/<slug>/mock-data.ts` with a header saying it is invented. Mock handlers are named `mock*`, wait briefly, and never authenticate, bill, or call a backend; the sign-in page, for example, does no authentication. Demo chrome such as `MockPicker` and `ExampleOnlyNotice` lives in `src/registry/demo-controls.tsx`, outside the block. Every example describes its data as an example or as invented.

## Reflow with the container {#responsive}

Page blocks respond to the width of the space they are given, not to the browser window. The root has `@container`, and the layout uses container-query variants such as `@lg:`. Examples that set `preview.responsive` get a Full, Tablet, and Mobile width switcher, which resizes the preview frame.

The preview is inline, not an iframe, so only container queries follow the switcher. Viewport breakpoints (`sm:`, `md:`) still follow the browser window, and so do the parts that use them, such as the Data table's `hideBelow` and Pagination. Only Dialog is portalled into the frame; Select and Tooltip render on the page and do not follow the preview theme.

## Where the rules are enforced {#enforcement}

- `src/registry/validate.ts` runs when the dev server starts and in `src/registry/validate.test.ts`. It checks the imports and `registryDependencies` of every entry.
- `src/registry/page-blocks.test.ts` checks every Pages block: container queries, no forbidden patterns, at least two responsive examples, and complete documentation.
- `src/templates/templates.test.ts` checks every template and the shared shell against the same forbidden patterns, and limits what they import.

Both tests read the forbidden patterns from `src/test/source-rules.ts`. [Testing strategy](/docs/testing) explains how these checks fit with the rest of the tests.
