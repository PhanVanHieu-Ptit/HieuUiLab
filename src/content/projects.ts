import { siteConfig } from '@/config/site'

import type { Project } from './types'

export const projects: readonly Project[] = [
  {
    slug: 'contrast-tested-design-system',
    title: 'A contrast-tested design system',
    summary:
      'Semantic OKLCH tokens for light and dark themes, shared interaction states, and a unit test that fails when a colour pair drops below WCAG AA.',
    role: 'Design and implementation',
    period: '2026',
    stack: ['Tailwind CSS v4', 'OKLCH', 'Radix UI', 'class-variance-authority', 'Vitest'],
    links: [
      { label: 'Theming docs', href: '/docs/theming' },
      { label: 'Components', href: '/components' },
      { label: 'Source on GitHub', href: siteConfig.githubUrl },
    ],
    outcome:
      'Every semantic text pair and the focus ring are checked against WCAG 2.2 AA in both themes on each test run, and components use only semantic utilities.',
    body: [
      {
        heading: 'Context',
        paragraphs: [
          'A component library is only as consistent as the values it is built from. Without a shared vocabulary, each component picks its own greys, hover colours, and focus styles, and dark mode becomes a second, slightly different design.',
          'The goal was a small set of semantic tokens that every component uses, with accessibility checked automatically rather than by occasional audits.',
        ],
      },
      {
        heading: 'Approach',
        paragraphs: [
          'All raw values live in one stylesheet. Light values sit on :root (and a .light class, so a region can stay light inside a dark page) and dark overrides on .dark; a Tailwind v4 @theme inline block maps each one to a utility such as bg-surface or text-muted-foreground. Components never reference palette colours directly.',
          'Colours are written in OKLCH so lightness can be tuned independently of hue. Shared interaction states — focus-ring, focus-ring-inset, and disabled-state — are defined once as utilities, so every interactive element behaves the same way.',
        ],
        code: {
          language: 'text',
          title: 'src/styles/globals.css (excerpt)',
          code: '@theme inline {\n  --color-surface: var(--surface);\n  --color-muted-foreground: var(--muted-foreground);\n  --color-ring: var(--ring);\n}\n\n@utility focus-ring {\n  outline: 2px none var(--ring);\n  outline-offset: 2px;\n\n  &:focus-visible {\n    outline-style: solid;\n  }\n}',
        },
      },
      {
        heading: 'Verification',
        paragraphs: [
          'A unit test reads the stylesheet as raw text, converts each OKLCH token to relative luminance, and asserts 4.5:1 for text pairs and 3:1 for the focus ring against every surface. A palette change that breaks contrast fails the test suite instead of reaching a page.',
          'Playwright checks every documented route at 360, 768, and 1280 pixels in both themes for horizontal overflow, and the theme menu is covered by unit and end-to-end tests.',
        ],
      },
      {
        heading: 'Trade-offs',
        paragraphs: [
          'The contrast test checks token pairs, not every rendered combination: opacity modifiers such as border-destructive/40 are outside its reach. OKLCH also assumes a modern browser, which is acceptable for a lab but would need a fallback strategy for older targets.',
        ],
      },
    ],
  },
  {
    slug: 'registry-driven-documentation',
    title: 'Registry-driven documentation',
    summary:
      'One typed registry entry per component feeds the sidebar, search, breadcrumbs, docs page, and landing page, so documentation cannot drift from the code it describes.',
    role: 'Architecture and implementation',
    period: '2026',
    stack: ['React', 'React Router', 'TypeScript', 'Vite', 'Shiki'],
    links: [
      { label: 'Components', href: '/components' },
      { label: 'Blocks', href: '/blocks' },
      { label: 'Source on GitHub', href: siteConfig.githubUrl },
    ],
    outcome:
      'Adding a component takes a source file, a demos file, a metadata file, and one line in the registry; navigation, search, and the docs page pick it up without further edits.',
    body: [
      {
        heading: 'Context',
        paragraphs: [
          'Hand-written component docs drift: an example is updated in one place but not another, or a new component never makes it into the navigation. The lab needed a single source of truth that the site reads from.',
        ],
      },
      {
        heading: 'Approach',
        paragraphs: [
          'Each entry is a typed RegistryEntry with a slug, status, dependencies, props, demos, and the full component source. Source is imported with Vite’s ?raw suffix, so the code shown is the code that runs.',
          'Demo code is extracted by function name from the demos file, so the Code tab shows exactly the function rendered in the Preview tab.',
        ],
        code: {
          language: 'tsx',
          title: 'src/registry/utils.ts',
          code: "export function demoExtractor(demosSource: string) {\n  return (name: string): string => {\n    const start = demosSource.indexOf(`export function ${name}`)\n    if (start === -1) return demosSource\n    const next = demosSource.indexOf('\\nexport function ', start + 1)\n    return demosSource.slice(start, next === -1 ? undefined : next).trim()\n  }\n}",
        },
      },
      {
        heading: 'What reads the registry',
        paragraphs: [
          'The docs sidebar, the mobile drawer, the ⌘K search palette, the breadcrumbs, the component and block pages, and the featured sections on the landing page all derive from the same array. Status labels — stable, experimental, planned — come from the entry, so the site cannot claim more than is built.',
        ],
      },
      {
        heading: 'Trade-offs',
        paragraphs: [
          'Props tables are still written by hand, and demo extraction relies on the export function convention. Syntax highlighting is lazy-loaded to keep it out of the entry bundle, so code appears plain for a moment before it is highlighted.',
        ],
      },
    ],
  },
]

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
