# Adding a template

Templates are example apps built only from registry blocks, shown at [Templates](/templates). They are not registry entries: a registry block is one flat file, and a template spans several. Read [Block composition](/docs/block-composition) first for how blocks fit together.

## Steps {#steps}

1. **Write the template.** Create `src/templates/<slug>/template.tsx` with one exported component that renders `TemplateShell` from `src/templates/shared/template-shell.tsx`: a view per screen, and a `MockPicker` in `controls`. Compose existing blocks through their public props. Take example data from `src/registry/<block>/mock-data.ts`. Keep state that must outlive a view (a range, a read flag, a list) in the template, and keep handlers inline so the Code tab shows them.
2. **Describe it** in `src/content/templates.ts`: add the slug to `templateSlugs` and a manifest. The manifest holds a scenario that says the data is invented, the views with their block slugs, the composition, decisions, limitations, files, and example data. It is the single source of truth: tests check that the sidebar buttons match `views[].label` and that the blocks the source imports match `views[].blocks`.
3. **Add a loader** to `src/templates/template-modules.ts`. Its `Record<TemplateSlug, …>` type does not compile without one. The component and its source load as separate chunks, and nothing in the navigation or on the landing page imports them.
4. **Follow the import rules** that `src/templates/templates.test.ts` enforces.
5. **Test it.** Add `src/templates/<slug>/template.test.tsx` for the views, shared state, loading and error, and keyboard. Add a flow in `e2e/templates.spec.ts`, and add the route to the `routes` arrays in `e2e/shell.spec.ts` and `e2e/routes.spec.ts`.

The header, sidebar, search, landing page, and About page read the manifest, so nothing else needs editing.

## What the tests reject {#rules}

`src/templates/templates.test.ts` reads every template source and the shared shell as text. A file may import only `react`, `lucide-react`, `@/lib/cn`, components and blocks from `@/components/ui` and `@/components/blocks`, example data and demo chrome from `@/registry` (`mock-data`, `demo-controls`, and `mock-delay`), and the shared shell. It must not do anything in `forbiddenInSource` from `src/test/source-rules.ts`, the same list the page blocks follow: sizing from the viewport, `fixed` positioning, `dark:` variants, `matchMedia`, reading the clock, network requests, browser storage, a router, or raw palette colors. Reflow with container queries, as the shell does.

Each `template.tsx` must also render `TemplateShell` and `MockPicker`.
