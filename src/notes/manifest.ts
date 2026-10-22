import type { EvidenceRef } from '@/content/showcase-types'

// The engineering notes: their titles, tags, dates, and how to load their Markdown. The manifest is
// small and eager, because the index, the home page, the tag filter, and the related list all read
// it; the article bodies load lazily, one chunk per article. This file imports no Markdown code,
// so the main bundle stays free of the parser. `notes.test.ts` checks that every article here has
// a file and that every file has an article. Contributor guide: `src/notes/README.md`.

/** The tags an article may carry. Closed, so a typo is a type error and the filter stays tidy. */
export const noteTags = [
  'accessibility',
  'components',
  'design-tokens',
  'forms',
  'react',
  'registry',
  'testing',
  'theming',
  'tooling',
  'typescript',
] as const

export type NoteTag = (typeof noteTags)[number]

export function isNoteTag(value: string): value is NoteTag {
  return (noteTags as readonly string[]).includes(value)
}

export interface NoteEntry {
  /** One URL segment under `/notes`, and the name of `src/notes/content/<slug>.md`. Unique. */
  slug: string
  /** The article's h1. The file's `# Title` must match it. */
  title: string
  /** The card text and the meta description: a sentence that ends with a period. */
  summary: string
  /** ISO date (YYYY-MM-DD) the article was first written. */
  date: string
  /** ISO date of the last time its claims were re-checked against the code. */
  updated?: string | undefined
  /** One to four tags from `noteTags`. */
  tags: readonly NoteTag[]
  /** Slugs of articles worth reading next. A link counts both ways. */
  related?: readonly string[] | undefined
  /** The repository files the claims rest on. `notes.test.ts` checks that each exists. */
  evidence: readonly [EvidenceRef, ...EvidenceRef[]]
  /** The Markdown text. A literal `import()` so a missing file fails the build. */
  load: () => Promise<{ default: string }>
}

const entries: readonly NoteEntry[] = [
  {
    slug: 'registry-validation-as-a-distribution-workflow',
    title: 'Registry validation as a distribution workflow',
    summary:
      'How a copy-and-own registry keeps its install contract true without a package manager: declared metadata checked against the real source, and what that check cannot see.',
    date: '2026-10-19',
    updated: '2026-10-22',
    tags: ['registry', 'tooling'],
    related: ['strict-typescript-for-a-component-library', 'designing-reusable-component-apis'],
    evidence: [
      {
        label: 'The install contract of one entry',
        path: 'src/registry/button/meta.ts',
        anchor: "packages: ['class-variance-authority', 'radix-ui', 'lucide-react']",
      },
      {
        label: 'Declared packages checked against the source',
        path: 'src/registry/validate.ts',
        anchor: 'source imports "${name}" but it is not declared',
      },
      {
        label: 'The transitive install plan',
        path: 'src/registry/install.ts',
        anchor: 'export function resolveInstallPlan',
      },
      {
        label: 'The closed vocabulary of packages',
        path: 'src/registry/packages.ts',
        anchor: 'as const satisfies Record<string, { purpose: string }>',
      },
      {
        label: 'Validation while developing',
        path: 'src/registry/index.ts',
        anchor: 'if (import.meta.env.DEV) assertValidRegistry(registry)',
      },
      {
        label: 'The URL snapshot',
        path: 'src/registry/registry.test.tsx',
        anchor: 'Slugs are public URLs.',
      },
      {
        label: 'What the installation page promises',
        path: 'src/docs/content/installation.md',
        anchor: 'Nothing tracks a copied file against the entry it came from.',
      },
      {
        label: 'The shadcn item generator',
        path: 'src/registry/shadcn/manifest.ts',
        anchor: 'export function toShadcnItem',
      },
      {
        label: 'What the comparison with the official build checks',
        path: 'src/docs/content/shadcn-registry.md',
        anchor: '`shadcn build` writes the same content as the committed files',
      },
      {
        label: 'The generated install command',
        path: 'src/pages/registry-detail-page.tsx',
        anchor: 'pnpm add ${plan.packages.join',
      },
    ],
    load: () => import('./content/registry-validation-as-a-distribution-workflow.md?raw'),
  },
  {
    slug: 'react-hook-form-and-zod-in-a-form-library',
    title: 'React Hook Form and Zod in a component library',
    summary:
      'Where each form concern lives when rules, display, and submit handling are separate: a schema, a resolver-agnostic adapter, and input and output types.',
    date: '2026-10-19',
    tags: ['forms', 'typescript', 'react'],
    related: ['designing-reusable-component-apis'],
    evidence: [
      {
        label: 'The adapter, which only displays the resolver result',
        path: 'src/components/ui/form.tsx',
        anchor: 'Validation stays in the resolver',
      },
      {
        label: 'The adapter tests',
        path: 'src/components/ui/form.test.tsx',
        anchor: 'submits parsed values and reports success',
      },
      {
        label: 'A schema whose output differs from its input',
        path: 'src/components/blocks/profile-form.tsx',
        anchor: 'useForm<ProfileFormInput, unknown, ProfileFormValues>',
      },
      {
        label: 'The convention in the Form entry guidelines',
        path: 'src/registry/form/meta.ts',
        anchor: 'Type the form as `useForm<z.input<S>, unknown, z.output<S>>`',
      },
      {
        label: 'A form with no schema and one type argument',
        path: 'src/components/blocks/user-profile-settings.tsx',
        anchor: 'useForm<NotificationPreferences>',
      },
      {
        label: 'The end-to-end form tests',
        path: 'e2e/forms.spec.ts',
        anchor: 'focuses the first error, shows a server field error, then saves from the keyboard',
      },
    ],
    load: () => import('./content/react-hook-form-and-zod-in-a-form-library.md?raw'),
  },
  {
    slug: 'strict-typescript-for-a-component-library',
    title: 'Strict TypeScript for a component library',
    summary:
      'Which compiler and lint settings this library uses, what each one catches in real code, what it costs, and which tool enforces the type-level tests.',
    date: '2026-10-19',
    tags: ['typescript', 'components'],
    related: ['react-hook-form-and-zod-in-a-form-library'],
    evidence: [
      {
        label: 'The strictness flags',
        path: 'tsconfig.app.json',
        anchor: 'exactOptionalPropertyTypes',
      },
      {
        label: 'The type-aware lint presets',
        path: 'eslint.config.js',
        anchor: 'strictTypeChecked',
      },
      {
        label: 'Optional properties that may be undefined',
        path: 'src/router/meta.ts',
        anchor: 'crumb?: string | undefined',
      },
      {
        label: 'An array read that may be empty',
        path: 'src/components/ui/form.tsx',
        anchor: 'const [firstField] = fieldErrors',
      },
      {
        label: 'The registry entry union and its guard',
        path: 'src/registry/types.ts',
        anchor: 'export type RegistryEntry = ImplementedEntry | PlannedEntry',
      },
      {
        label: 'A record that needs a loader for every slug',
        path: 'src/templates/template-modules.ts',
        anchor: 'Readonly<Record<TemplateSlug',
      },
      {
        label: 'Playground controls checked against props',
        path: 'src/registry/playground.ts',
        anchor: 'export function definePlayground',
      },
      {
        label: 'A control that must not compile',
        path: 'src/registry/playground.test.ts',
        anchor: '@ts-expect-error -- Button has no `tone` prop.',
      },
    ],
    load: () => import('./content/strict-typescript-for-a-component-library.md?raw'),
  },
  {
    slug: 'designing-reusable-component-apis',
    title: 'Designing reusable React component APIs',
    summary:
      'How the props of a copy-and-own component library are shaped: native props, variants, asChild, compound parts, and where the API stops matching its documentation.',
    date: '2026-10-19',
    tags: ['components', 'react'],
    related: ['strict-typescript-for-a-component-library', 'whole-card-links'],
    evidence: [
      {
        label: 'Button and its asChild branch',
        path: 'src/components/ui/button.tsx',
        anchor: 'asChild',
      },
      {
        label: 'Button tests, including the ref',
        path: 'src/components/ui/button.test.tsx',
        anchor: 'forwards ref to the underlying element',
      },
      {
        label: 'Input replacing the native size prop',
        path: 'src/components/ui/input.tsx',
        anchor: "Omit<ComponentProps<'input'>, 'size'>",
      },
      { label: 'CardTitle and its as prop', path: 'src/components/ui/card.tsx', anchor: 'as: Tag' },
      {
        label: 'The Field context and its named error',
        path: 'src/components/ui/field.tsx',
        anchor: 'must be used inside <Field>',
      },
      {
        label: 'How Button documents loading',
        path: 'src/registry/button/meta.ts',
        anchor: 'Shows a spinner, sets aria-busy, and disables the button.',
      },
    ],
    load: () => import('./content/designing-reusable-component-apis.md?raw'),
  },
  {
    slug: 'theme-without-flash',
    title: 'Switching themes without a first-paint flash',
    summary:
      'Set the saved theme in a tiny inline script before the bundle loads, then keep React in step with an external store.',
    date: '2026-10-13',
    updated: '2026-10-19',
    tags: ['theming', 'react'],
    related: ['reduced-motion-beyond-css'],
    evidence: [
      { label: 'The pre-paint script', path: 'index.html', anchor: 'hieu-ui-lab:theme' },
      { label: 'The theme store', path: 'src/hooks/use-theme.ts', anchor: 'useSyncExternalStore' },
      {
        label: 'Unit tests for the theme menu',
        path: 'src/components/site/theme-menu.test.tsx',
        anchor: 'applies and persists the dark theme on the document',
      },
      {
        label: 'The end-to-end theme test',
        path: 'e2e/shell.spec.ts',
        anchor: 'system follows the OS preference live and persists',
      },
    ],
    load: () => import('./content/theme-without-flash.md?raw'),
  },
  {
    slug: 'reduced-motion-beyond-css',
    title: 'Respecting reduced motion beyond CSS',
    summary:
      'A global CSS rule stops CSS animations, but motion driven from JavaScript needs its own check, and the setting should be a default, not a lock.',
    date: '2026-10-13',
    updated: '2026-10-19',
    tags: ['accessibility', 'react'],
    evidence: [
      {
        label: 'The global CSS rule',
        path: 'src/styles/globals.css',
        anchor: 'prefers-reduced-motion: reduce',
      },
      {
        label: 'The hook',
        path: 'src/hooks/use-reduced-motion.ts',
        anchor: 'useSyncExternalStore',
      },
      {
        label: 'Unit tests for the hook',
        path: 'src/hooks/use-reduced-motion.test.ts',
        anchor: 'follows the preference live',
      },
      {
        label: 'The WebGL demo',
        path: 'src/lab/webgl-scene/webgl-scene-demo.tsx',
        anchor: 'Paused because your system asks for reduced motion.',
      },
      {
        label: 'The demo test under reduced motion',
        path: 'src/lab/webgl-scene/webgl-scene-demo.test.tsx',
        anchor: 'starts still under reduced motion until the user presses Play',
      },
    ],
    load: () => import('./content/reduced-motion-beyond-css.md?raw'),
  },
  {
    slug: 'contrast-checks-as-unit-tests',
    title: 'Checking colour contrast in a unit test',
    summary:
      'Parse the token stylesheet, convert OKLCH to luminance, and assert contrast ratios, so a palette tweak that hurts legibility fails a test.',
    date: '2026-10-13',
    updated: '2026-10-19',
    tags: ['accessibility', 'design-tokens', 'testing'],
    evidence: [
      {
        label: 'The contrast test',
        path: 'src/styles/tokens.test.ts',
        anchor: 'function contrast',
      },
      {
        label: 'The tokens it reads',
        path: 'src/styles/globals.css',
        anchor: '--muted-foreground',
      },
      {
        label: 'CSS processed only for raw imports',
        path: 'vite.config.ts',
        anchor: 'token tests read globals.css as text',
      },
      {
        label: 'The statement that no accessibility engine runs',
        path: 'src/docs/content/testing.md',
        anchor: 'No automated accessibility engine such as axe runs',
      },
    ],
    load: () => import('./content/contrast-checks-as-unit-tests.md?raw'),
  },
  {
    slug: 'whole-card-links',
    title: 'Whole-card links without nesting everything in an anchor',
    summary:
      'Keep the link on the title and stretch its hit area with a pseudo-element, so the link has a short name and the card can still hold other controls.',
    date: '2026-10-13',
    updated: '2026-10-19',
    tags: ['accessibility', 'components'],
    evidence: [
      { label: 'The stretched link', path: 'src/components/ui/card.tsx', anchor: 'data-card-link' },
      {
        label: 'Unit tests for the link',
        path: 'src/components/ui/card.test.tsx',
        anchor: 'stretches CardLink over an interactive card',
      },
      {
        label: 'A card using the link',
        path: 'src/components/site/content-cards.tsx',
        anchor: '<CardLink asChild>',
      },
      {
        label: 'The page test that looks the link up by its title',
        path: 'src/pages/section-pages.test.tsx',
        anchor: 'Switching themes without a first-paint flash',
      },
    ],
    load: () => import('./content/whole-card-links.md?raw'),
  },
]

/** Newest first; articles written on the same day keep their authored order. */
export const notes: readonly NoteEntry[] = [...entries].sort((a, b) => b.date.localeCompare(a.date))

export function getNote(slug: string, list: readonly NoteEntry[] = notes): NoteEntry | undefined {
  return list.find((note) => note.slug === slug)
}

export function noteHref(note: Pick<NoteEntry, 'slug'>): string {
  return `/notes/${note.slug}`
}

/** Repository path of an article's Markdown source. */
export function noteFile(note: Pick<NoteEntry, 'slug'>): string {
  return `src/notes/content/${note.slug}.md`
}

/** Every tag in use with the number of articles that carry it, in the order of `noteTags`. */
export function noteTagCounts(
  list: readonly NoteEntry[] = notes,
): readonly { tag: NoteTag; count: number }[] {
  return noteTags
    .map((tag) => ({ tag, count: list.filter((note) => note.tags.includes(tag)).length }))
    .filter(({ count }) => count > 0)
}

/** The articles with `tag`; an empty or unknown tag leaves the list as it is. */
export function filterNotes(
  tag: string | null | undefined,
  list: readonly NoteEntry[] = notes,
): readonly NoteEntry[] {
  if (!tag || !isNoteTag(tag)) return list
  return list.filter((note) => note.tags.includes(tag))
}

/**
 * Articles to read after `slug`. An explicit link, in either direction, counts 3; each shared tag
 * counts 1. An article that scores nothing is not related. Ties go to the newer article, then to
 * the slug, so the order never depends on the order of the list.
 */
export function relatedNotes(
  slug: string,
  limit = 3,
  list: readonly NoteEntry[] = notes,
): NoteEntry[] {
  const current = getNote(slug, list)
  if (!current) return []
  return list
    .filter((note) => note.slug !== slug)
    .map((note) => {
      const linked =
        current.related?.includes(note.slug) === true || note.related?.includes(slug) === true
      const shared = note.tags.filter((tag) => current.tags.includes(tag)).length
      return { note, score: (linked ? 3 : 0) + shared }
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.note.date.localeCompare(a.note.date) ||
        a.note.slug.localeCompare(b.note.slug),
    )
    .slice(0, limit)
    .map(({ note }) => note)
}
