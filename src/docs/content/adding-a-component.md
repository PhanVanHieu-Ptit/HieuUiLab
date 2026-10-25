# Adding a component

A registry entry is a component file plus a folder of metadata, examples, and a source copy. The sidebar, drawer, search, catalog, landing cards, About counts, and detail route all read from one array, so registering an entry is the last step. Follow [Component conventions](/docs/component-conventions) when writing the file.

## Steps {#steps}

1. **Write the component.** Add it to `src/components/ui/`, or a block to `src/components/blocks/`, with tests next to it.
2. **Describe it.** Create `src/registry/<slug>/demos.tsx`, `src/registry/<slug>/meta.ts`, and `src/registry/<slug>/content.ts`; `src/registry/button/` is the pattern to copy. The navigation, the search, and the catalogs read every entry's `meta.ts`, so it holds only data. Everything that is heavy, the demos and the source text, is in `content.ts`, which the app loads when a page shows the entry. `meta.ts` exports an `ImplementedEntry` (`src/registry/types.ts`) with:
   - `id`, `slug`, `kind`, `category`, `tags`, and `status` (`stable` or `experimental`);
   - `installation`, which names the path the file is copied to, its npm packages, the registry entries it imports, and the setup it needs;
   - `api`;
   - optional `guidelines`: usage notes and behavioral constraints, shown in the Usage section, where backticks render as inline code;
   - `content: () => import('./content')`, which loads the second file.

   `content.ts` exports `content`, an `ImplementedEntryContent`, with `source` (the component file imported with `?raw`), `examples`, and the optional `playground`. A test (`src/registry/entry-graph.test.ts`) fails if `meta.ts` imports anything from the content or if anything the app loads first reaches a demo.

   Each demo is an `export function` whose body is self-contained, because the Code tab shows exactly that function. Categories and tags come from `src/registry/taxonomy.ts`, and packages and setup requirements from `src/registry/packages.ts`.

3. **Add a playground, if it fits.** A component that renders fully from props and text can have a `playground` in `content.ts`, made with `definePlayground(Component, { part, controls })` from `src/registry/playground.ts`. Control props and select options are type-checked against the component's props, and the validator checks them against the documented API: a documented prop, options within the documented union, and a default equal to the documented default. The preview and the copyable code are generated from the same resolved props. Entries without a playground show no controls.
4. **Register it.** Add the entry to the array in `src/registry/index.ts`.

To offer the component at [Playground](/playground) as well, see "Adding a playground example" in `README.md`.

## Planned entries {#planned}

A planned entry is a `PlannedEntry` (see `src/registry/planned.ts`): metadata and a `plannedScope`, with no source, examples, install steps, or `content.ts`, so it cannot render as implemented. Its page says it is not implemented yet.

## What the validator rejects {#validator}

`validateRegistry` in `src/registry/validate.ts` checks the metadata when the dev server starts. The dev server checks an entry's source and examples when its page loads, and `validateFullRegistry` checks all of it in the unit tests. Together they reject:

- duplicate ids or slugs, and unknown categories, tags, packages, or requirements;
- missing or planned registry dependencies, and dependency cycles;
- duplicate examples or props;
- install steps that drift from what the source imports: a package that is imported but not listed (or listed but not imported), a registry file that is imported but not in `registryDependencies`, or an import a project that copies the file would not have;
- documented API parts that the source does not export, because the Usage tab's import line is built from them;
- playground controls that drift from the documented props.

Run `pnpm test` to see every failure at once. The checks for the written docs are separate; see `pnpm docs:check` in [Testing strategy](/docs/testing).
