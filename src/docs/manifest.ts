// The documentation pages: their titles, places in the navigation, and how to load their Markdown.
// The manifest is small and eager, because navigation and search list every page; the Markdown
// bodies load lazily, one chunk per page. This file imports nothing from the app, so
// `src/config/site.ts` can build the sidebar from it without a cycle. `docs.test.ts` checks that
// every page here has a file and that every file has a page.

export interface DocEntry {
  /** Names the file, `src/docs/content/<id>.md`, unless `file` says otherwise. Unique. */
  id: string
  /** One URL segment under the parent page; '' only for the docs index. */
  slug: string
  /** The page's h1 and sidebar label. The file's `# Title` must match it. */
  title: string
  /** The meta description and sidebar tooltip. */
  description: string
  /** Extra terms the search palette matches. */
  keywords?: readonly string[] | undefined
  /** Repository path of the Markdown source when it is not `src/docs/content/<id>.md`. */
  file?: string | undefined
  /** The Markdown text. A literal `import()` so a missing file fails the build. */
  load: () => Promise<{ default: string }>
  /** Pages nested under this one, at `<this page's URL>/<slug>`. */
  children?: readonly DocEntry[] | undefined
}

export interface DocGroup {
  id: string
  /** The sidebar heading and the non-link breadcrumb above its pages. */
  title: string
  pages: readonly DocEntry[]
}

export const DOCS_BASE = '/docs'

export const docGroups: readonly DocGroup[] = [
  {
    id: 'overview',
    title: 'Overview',
    pages: [
      {
        id: 'getting-started',
        slug: '',
        title: 'Getting started',
        description: 'What the lab is, how the registry works, and where to go next.',
        keywords: ['introduction', 'overview', 'start'],
        load: () => import('./content/getting-started.md?raw'),
      },
      {
        id: 'installation',
        slug: 'installation',
        title: 'Installation',
        description: 'Copy a component into your project, with its dependencies and tokens.',
        keywords: ['install', 'setup', 'copy', 'alias', 'fonts'],
        load: () => import('./content/installation.md?raw'),
      },
      {
        id: 'shadcn-registry',
        slug: 'shadcn-registry',
        title: 'Install with the shadcn CLI',
        description:
          'Install the published components with the shadcn CLI: what is published, what was tested, and how conflicts and updates are handled.',
        keywords: ['shadcn', 'cli', 'registry', 'npx', 'pnpm dlx', 'overwrite', 'update', 'kbd'],
        load: () => import('./content/shadcn-registry.md?raw'),
      },
      {
        id: 'project-structure',
        slug: 'project-structure',
        title: 'Project structure',
        description:
          'Where things live in the repository: source folders, the registry, routing, and code splitting.',
        keywords: ['architecture', 'folders', 'routing', 'code splitting'],
        load: () => import('./content/project-structure.md?raw'),
      },
    ],
  },
  {
    id: 'foundations',
    title: 'Foundations',
    pages: [
      {
        id: 'design-tokens',
        slug: 'design-tokens',
        title: 'Design tokens',
        description:
          'Every color, radius, shadow, type size, and motion token in the stylesheet, generated from it.',
        keywords: ['colors', 'radius', 'typography', 'spacing', 'variables'],
        load: () => import('./content/design-tokens.md?raw'),
      },
      {
        id: 'theme-customization',
        slug: 'theming',
        title: 'Theme customization',
        description:
          'Change the look: light and dark tokens, scoped themes, and how the theme preference is stored.',
        keywords: ['theming', 'dark mode', 'light mode', 'theme', 'colors'],
        load: () => import('./content/theme-customization.md?raw'),
      },
      {
        id: 'accessibility',
        slug: 'accessibility',
        title: 'Accessibility guidelines',
        description:
          'What the components do for accessibility, how it is checked, and what is not covered.',
        keywords: ['a11y', 'keyboard', 'focus', 'contrast', 'screen reader', 'aria'],
        load: () => import('./content/accessibility.md?raw'),
      },
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    pages: [
      {
        id: 'component-conventions',
        slug: 'component-conventions',
        title: 'Component conventions',
        description: 'How components are written: files, props, variants, styling, and strictness.',
        keywords: ['conventions', 'cva', 'variants', 'aschild', 'cn'],
        load: () => import('./content/component-conventions.md?raw'),
        children: [
          {
            id: 'adding-a-component',
            slug: 'adding-a-component',
            title: 'Adding a component',
            description:
              'Add a registry entry: the component, its metadata and examples, and what the validator rejects.',
            keywords: ['contribute', 'registry', 'validator', 'new component'],
            load: () => import('./content/adding-a-component.md?raw'),
          },
        ],
      },
      {
        id: 'form-integration',
        slug: 'form-integration',
        title: 'Form integration',
        description: 'Build forms with Field, Form, Form feedback, and a Zod schema.',
        keywords: ['forms', 'react hook form', 'zod', 'validation', 'submit'],
        load: () => import('./content/form-integration.md?raw'),
      },
      {
        id: 'data-table',
        slug: 'data-table',
        title: 'DataTable usage',
        description:
          'Drive the data table block: columns, sorting, pagination, selection, and its states.',
        keywords: ['table', 'sorting', 'pagination', 'selection', 'rows'],
        load: () => import('./content/data-table.md?raw'),
      },
      {
        id: 'map-viewer',
        slug: 'map-viewer',
        title: 'Map viewer and basemaps',
        description:
          'Configure the map viewer’s basemap, and what each tile provider requires: attribution, usage policy, and API keys.',
        keywords: [
          'maplibre',
          'map',
          'tiles',
          'attribution',
          'api key',
          'basemap',
          'csp',
          'worker',
        ],
        load: () => import('./content/map-viewer.md?raw'),
      },
      {
        id: 'deployment',
        slug: 'deployment',
        title: 'Deployment',
        description:
          'Build for production, host the site on Vercel, keep secrets out of the bundle, and check a deployment.',
        keywords: [
          'vercel',
          'hosting',
          'production',
          'environment variables',
          'secrets',
          'rewrites',
          'spa',
          'ci',
        ],
        load: () => import('./content/deployment.md?raw'),
      },
      {
        id: 'block-composition',
        slug: 'block-composition',
        title: 'Block composition',
        description:
          'How blocks are composed from components, and where page blocks and templates fit.',
        keywords: ['blocks', 'compose', 'page blocks', 'templates', 'imports'],
        load: () => import('./content/block-composition.md?raw'),
        children: [
          {
            id: 'adding-a-page-block',
            slug: 'page-blocks',
            title: 'Adding a page block',
            description: 'The steps and rules for a new page-level block.',
            keywords: ['contribute', 'page block', 'container queries', 'mock data'],
            load: () => import('./content/adding-a-page-block.md?raw'),
          },
          {
            id: 'adding-a-template',
            slug: 'templates',
            title: 'Adding a template',
            description: 'The steps and rules for a new example app built from blocks.',
            keywords: ['contribute', 'template', 'example app'],
            load: () => import('./content/adding-a-template.md?raw'),
          },
        ],
      },
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    pages: [
      {
        id: 'component-api',
        slug: 'component-api',
        title: 'Component API reference',
        description: "How to read an entry's API, and every entry with the parts it exports.",
        keywords: ['api', 'props', 'exports', 'reference'],
        load: () => import('./content/component-api.md?raw'),
      },
    ],
  },
  {
    id: 'project',
    title: 'Project',
    pages: [
      {
        id: 'testing',
        slug: 'testing',
        title: 'Testing strategy',
        description: 'The test layers, how to run them, the validators, and what is not tested.',
        keywords: ['vitest', 'playwright', 'e2e', 'ci', 'validators'],
        load: () => import('./content/testing.md?raw'),
      },
      {
        id: 'troubleshooting',
        slug: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Fixes for setup, test, and docs problems that the repository documents.',
        keywords: ['errors', 'problems', 'fix', 'help'],
        load: () => import('./content/troubleshooting.md?raw'),
      },
      {
        id: 'changelog',
        slug: 'changelog',
        title: 'Changelog',
        description: 'What changed in the lab, newest first, from the merged pull requests.',
        keywords: ['releases', 'history', 'changes'],
        file: 'CHANGELOG.md',
        load: () => import('../../CHANGELOG.md?raw'),
      },
    ],
  },
]

/** Old URLs that now live elsewhere. The router replaces them, so Back does not bounce. */
export const docRedirects: Readonly<Record<string, string>> = {
  '/docs/architecture': '/docs/project-structure',
}

/** The URL of a page: its slug under its parent's URL. */
export function docHref(parentHref: string, slug: string): string {
  return slug === '' ? parentHref : `${parentHref}/${slug}`
}

/** The repository path of a page's Markdown source. */
export function docFile(entry: DocEntry): string {
  return entry.file ?? `src/docs/content/${entry.id}.md`
}

export interface DocNode {
  entry: DocEntry
  href: string
  group: DocGroup
  /** The pages above this one, outermost first. Empty for a top-level page. */
  parents: readonly DocNode[]
}

function buildNodes(): DocNode[] {
  const nodes: DocNode[] = []
  const visit = (
    entry: DocEntry,
    parentHref: string,
    group: DocGroup,
    parents: readonly DocNode[],
  ) => {
    const node: DocNode = { entry, href: docHref(parentHref, entry.slug), group, parents }
    nodes.push(node)
    for (const child of entry.children ?? []) visit(child, node.href, group, [...parents, node])
  }
  for (const group of docGroups) {
    for (const page of group.pages) visit(page, DOCS_BASE, group, [])
  }
  return nodes
}

/** Every page in reading order: a page, then its children, group by group. */
export const docNodes: readonly DocNode[] = buildNodes()

export function findDocById(id: string): DocNode | undefined {
  return docNodes.find((node) => node.entry.id === id)
}

export function findDocByHref(href: string): DocNode | undefined {
  return docNodes.find((node) => node.href === href)
}

/** The pages before and after `node` in reading order. */
export function docNeighbours(node: DocNode): { previous?: DocNode; next?: DocNode } {
  const index = docNodes.indexOf(node)
  const previous = index > 0 ? docNodes[index - 1] : undefined
  const next = docNodes[index + 1]
  return { ...(previous ? { previous } : {}), ...(next ? { next } : {}) }
}
