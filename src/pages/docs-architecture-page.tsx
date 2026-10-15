import type { ReactNode } from 'react'

import { CodeBlock } from '@/components/site/code-block'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { findDocsNavItem } from '@/config/site'

const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'

const page = findDocsNavItem('/docs/architecture')

const structure = `src/
  components/
    ui/        # registry components: the copyable source
    blocks/    # registry blocks composed from ui components
    site/      # app shell and docs UI (not part of the registry)
    landing/   # landing page sections
  config/
    site.ts    # navigation and section copy: header, sidebar, drawer, search, footer
  content/     # typed notes, case studies, experiments, and landing data
  lab/         # geospatial and 3D experiments, lazy-loaded per route
  pages/       # route components
  playground/  # playground examples (an allowlist), control schemas, validation, workbench UI
  registry/    # one folder per entry (demos.tsx + meta.ts), types, validation, catalog
  router/
    routes.tsx # the route tree
    loaders.ts # slug lookups: 404s and redirects
    meta.ts    # page titles, descriptions, and breadcrumbs
  styles/
    globals.css  # semantic tokens, themes, shared state utilities`

const routeExample = `{
  path: 'notes',
  handle: { meta: { title: 'Notes', description: '…' } },
  children: [
    { index: true, lazy: { Component: … } },
    {
      path: ':slug',
      loader: noteLoader, // the note, or a 404
      handle: { meta: metaFromData<Note>((note) => ({ title: note.title })) },
      lazy: { Component: … },
    },
  ],
}`

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="max-w-prose leading-7 text-pretty">{children}</p>
}

export function DocsArchitecturePage() {
  return (
    <article className="flex flex-col gap-12">
      <PageHeader
        eyebrow="Getting started"
        title={page?.title ?? 'Architecture'}
        description={page?.description}
      />

      <section aria-labelledby="structure" className="flex flex-col gap-4">
        <SectionHeader id="structure" title="Project structure" anchorLabel="Project structure" />
        <CodeBlock code={structure} language="text" title="tree" />
      </section>

      <section aria-labelledby="registry" className="flex flex-col gap-4">
        <SectionHeader id="registry" title="The registry" anchorLabel="The registry" />
        <Paragraph>
          Each entry has a folder in <code className={inlineCode}>src/registry/</code> with its
          metadata, examples, and API reference, and imports its own source as raw text so the docs
          show exactly the file you copy. The sidebar, mobile drawer, search, catalog pages, landing
          cards, and detail routes are all derived from one typed array, so adding an entry needs no
          navigation changes.
        </Paragraph>
        <Paragraph>
          An entry is either implemented (<code className={inlineCode}>stable</code> or{' '}
          <code className={inlineCode}>experimental</code>), with source, examples, and explicit
          installation data, or <code className={inlineCode}>planned</code>, with only a description
          of its scope. The two are separate types, so a planned entry cannot be rendered with code
          or install steps. A validator checks the registry at startup and in tests: duplicate ids
          or slugs, unknown categories or tags, broken or planned dependencies, cycles, and install
          steps that no longer match the source&apos;s imports.
        </Paragraph>
        <Paragraph>
          The catalog&apos;s search, category and tag filters, and sort live in the URL query, so a
          filtered view can be shared and Back undoes a filter change.
        </Paragraph>
      </section>

      <section aria-labelledby="routing" className="flex flex-col gap-4">
        <SectionHeader id="routing" title="Routing" anchorLabel="Routing" />
        <Paragraph>
          React Router&apos;s data router owns every URL. Routes are nested to mirror the URL, and
          each route&apos;s <code className={inlineCode}>handle.meta</code> holds its title and
          description. One resolver turns the matched routes into the breadcrumb trail, the document
          title, and the description meta, so pages never repeat them.
        </Paragraph>
        <Paragraph>
          Detail routes have a small loader that looks the slug up in local content. An unknown slug
          throws a 404 that the layout&apos;s error boundary renders as the not-found page, with the
          header and sidebar still in place. A slug from another category, such as a block requested
          under <code className={inlineCode}>/components</code>, redirects to its real URL.
        </Paragraph>
        <CodeBlock code={routeExample} language="tsx" title="src/router/routes.tsx (shape)" />
      </section>

      <section aria-labelledby="code-splitting" className="flex flex-col gap-4">
        <SectionHeader id="code-splitting" title="Code splitting" anchorLabel="Code splitting" />
        <Paragraph>
          The shell, the home page, and the component and block indexes load up front. Docs pages,
          registry detail pages, the playground, the labs, notes, case studies, and the about page
          are lazy routes, each its own chunk. Loaders and route metadata are not lazy, so a 404 or
          redirect resolves before any page code downloads. Shiki and each lab demo are loaded on
          demand inside their pages.
        </Paragraph>
        <Paragraph>
          The registry itself is still in the main bundle, because the navigation lists every entry
          and each entry carries its source text.
        </Paragraph>
      </section>
    </article>
  )
}
