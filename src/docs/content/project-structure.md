# Project structure

This page maps the repository: where the copyable source lives, how the registry feeds the rest of the site, how routing works, and what loads when. It describes this site; for using an entry in your own project, see [Installation](/docs/installation).

## Repository layout {#layout}

```text title="repository layout"
src/
  components/
    ui/          Registry components: the copyable source
    blocks/      Registry blocks composed from ui components, one self-contained file each
    site/        App shell and docs UI (not part of the registry)
    landing/     Landing page sections
    showcase/    Project pages: media, detail, and the public-project note
  config/
    site.ts      Navigation and section copy: header, sidebar, drawer, search, footer
  content/       Typed data: case studies, public projects, templates, experiments
  docs/          These pages: the Markdown, its manifest, the renderer, and the validator
  hooks/         Shared hooks: theme, reduced motion, overflow detection
  lab/           Geospatial and 3D experiments, lazy-loaded per route
  lib/           Small helpers: cn, clipboard, dates, syntax highlighting, heading slugs
  notes/         Engineering notes: the Markdown articles, their manifest, and the validator
  pages/         Route components
  playground/    Control schemas and validation, the example allowlist, stages, workbench UI
  registry/      One folder per entry (meta.ts, content.ts, demos.tsx), types, validation, catalog
  router/        routes.tsx (the route tree), loaders.ts (slug lookups), meta.ts (page metadata)
  styles/        globals.css: tokens, themes, and the shared state utilities
  templates/     Example apps built from blocks, lazy-loaded one by one
  test/          Test setup and helpers, imported only by tests
e2e/             Playwright tests
.github/workflows/ci.yml   The CI workflow
```

Component files in `src/components/ui/` and `src/components/blocks/` are the files you copy. Everything else is the site that documents them.

## The registry {#registry}

Each entry has a folder in `src/registry/`. Its `meta.ts` holds the metadata and the API reference, and its `content.ts` holds the examples and the source, imported as raw text so the docs show exactly the file you copy. The content loads on demand: everything that lists entries reads only the metadata. The sidebar, mobile drawer, search, catalog pages, landing cards, and detail routes are all derived from one typed array, so adding an entry needs no navigation changes.

An entry is either implemented (`stable` or `experimental`), with source, examples, and explicit installation data, or `planned`, with only a description of its scope. They are separate types, so a planned entry cannot be rendered with code or install steps. A validator checks the metadata when the dev server starts, an entry's source and examples when its page loads in development, and everything in the unit tests. [Component conventions](/docs/component-conventions) lists what it rejects, and [Component API reference](/docs/component-api) shows what each entry documents.

The catalog's search, category and tag filters, and sort live in the URL query, so a filtered view can be shared and Back undoes a filter change.

## Routing {#routing}

React Router's data router owns every URL. Routes are nested to mirror the URL, and each route's `handle.meta` holds its title and description. One resolver turns the matched routes into the breadcrumb trail, the document title, and the description meta, so pages never repeat them.

Detail routes have a small loader that looks the slug up in local content. An unknown slug throws a 404 that the layout's error boundary renders as the not-found page, with the header and sidebar still in place. A slug from another category, such as a block requested under `/components`, redirects to its real URL.

```tsx title="route shape"
{
  path: 'notes',
  handle: { meta: { title: 'Notes', description: '…' } },
  children: [
    { index: true, lazy: { Component: … } },
    {
      path: ':slug',
      loader: noteLoader, // the note and its Markdown, or a 404
      handle: { meta: metaFromData<NoteLoaderData>(({ entry }) => ({ title: entry.title })) },
      lazy: { Component: … },
    },
  ],
}
```

The docs routes are generated from `src/docs/manifest.ts`, one per page and nested like the sidebar. A path under `/docs` that matches no page is a 404 inside the docs layout, with links to the closest pages. Moved URLs, such as `/docs/architecture`, are listed in the manifest and redirect with history `replace`, so Back does not bounce.

## Code splitting {#code-splitting}

The shell, the home page, and the component and block indexes load up front. Docs pages, registry detail pages, the playground, the labs, notes, case studies, and the about page are lazy routes, each its own chunk. Loaders and route metadata are not lazy, so a 404 or redirect resolves before any page code downloads. Shiki and each lab demo load on demand inside their pages.

A docs page's Markdown text is fetched by its loader, and the Markdown parser loads with the docs page component, so neither is part of the main bundle. An engineering note works the same way, with one chunk per article. The registry's metadata is in the main bundle, because the navigation lists every entry. Each entry's examples and source text are a chunk of their own, loaded by the detail page's loader, by the landing page cards that show a live preview, and by the pages that show one example. A test, `src/registry/entry-graph.test.ts`, fails if anything the app loads first imports one.

## Documentation {#docs}

The pages you are reading are Markdown files in `src/docs/content/`, listed in `src/docs/manifest.ts`. Two commands check them: `pnpm docs:check` validates the links and the code samples, and `pnpm test` runs the same checks with everything else. `src/docs/README.md` explains how to add a page.
