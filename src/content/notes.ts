import type { Note } from './types'

const authored: readonly Note[] = [
  {
    slug: 'reduced-motion-beyond-css',
    title: 'Respecting reduced motion beyond CSS',
    summary:
      'A global CSS rule stops CSS animations, but JavaScript-driven motion needs its own check. A small hook covers the rest.',
    date: '2026-10-13',
    tags: ['accessibility', 'animation', 'react'],
    body: [
      {
        heading: 'What CSS already covers',
        paragraphs: [
          'The stylesheet shortens every animation and transition to near zero when the user has asked the operating system to reduce motion. That handles fades, pops, and slides defined in CSS.',
          'It does not touch motion driven from JavaScript. A requestAnimationFrame loop keeps running regardless of any media query.',
        ],
      },
      {
        heading: 'A hook for script-driven motion',
        paragraphs: [
          'useReducedMotion subscribes to the media query with useSyncExternalStore, so components re-render when the preference changes while the page is open.',
        ],
        code: {
          language: 'tsx',
          title: 'src/hooks/use-reduced-motion.ts',
          code: "const QUERY = '(prefers-reduced-motion: reduce)'\n\nfunction subscribe(listener: () => void) {\n  const query = window.matchMedia(QUERY)\n  query.addEventListener('change', listener)\n  return () => query.removeEventListener('change', listener)\n}\n\nexport function useReducedMotion(): boolean {\n  return useSyncExternalStore(\n    subscribe,\n    () => window.matchMedia(QUERY).matches,\n    () => false,\n  )\n}",
        },
      },
      {
        heading: 'Pause, don’t remove',
        paragraphs: [
          'The WebGL experiment in the lab renders a single still frame when reduced motion is on and offers an explicit Play button. The preference sets the default; the user can still opt in.',
          'The same loop also stops when the canvas scrolls out of view or the tab is hidden, which saves battery for everyone.',
        ],
      },
    ],
  },
  {
    slug: 'contrast-checks-as-unit-tests',
    title: 'Checking colour contrast in a unit test',
    summary:
      'Parse the token stylesheet, convert OKLCH to luminance, and assert WCAG ratios, so a palette tweak that hurts legibility fails fast.',
    date: '2026-10-13',
    tags: ['accessibility', 'design tokens', 'testing'],
    body: [
      {
        heading: 'Why test tokens',
        paragraphs: [
          'Contrast problems usually surface late, in an audit or a bug report. Because every component in the lab uses semantic tokens, checking the token pairs covers most of the text on the site.',
        ],
      },
      {
        heading: 'How the test works',
        paragraphs: [
          'Vitest imports the stylesheet with ?raw and reads the oklch() declarations from the :root and .dark blocks. Each colour is converted from OKLCH to linear sRGB, clamped to gamut, and reduced to WCAG relative luminance.',
          'Text pairs must reach 4.5:1. The focus ring is non-text UI, so WCAG 1.4.11 asks for 3:1 against each surface it can appear on.',
        ],
        code: {
          language: 'tsx',
          title: 'src/styles/tokens.test.ts (excerpt)',
          code: 'function contrast(x: Oklch, y: Oklch): number {\n  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p)\n  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)\n}',
        },
      },
      {
        heading: 'Limits',
        paragraphs: [
          'The test knows nothing about opacity modifiers, images, or gradients behind text. It is a fast first line of defence, not a replacement for checking real pages.',
        ],
      },
    ],
  },
  {
    slug: 'whole-card-links',
    title: 'Whole-card links without nesting everything in an anchor',
    summary:
      'Keep the link on the title and stretch its hit area with a pseudo-element, so screen readers announce a short link name.',
    date: '2026-10-13',
    tags: ['accessibility', 'css', 'components'],
    body: [
      {
        heading: 'The problem with wrapping',
        paragraphs: [
          'Wrapping a whole card in an anchor makes the entire card content the link’s accessible name, and it rules out any other interactive element inside the card.',
        ],
      },
      {
        heading: 'Stretch the title link instead',
        paragraphs: [
          'CardLink renders the link around the title only. An ::after pseudo-element positioned with inset: 0 covers the card, which is position: relative, so a click anywhere follows the link.',
          'The link itself has no outline; the card draws the focus ring through a :has() selector, so the visible focus matches the clickable area.',
        ],
        code: {
          language: 'tsx',
          title: 'src/components/ui/card.tsx (excerpt)',
          code: '<Comp\n  data-card-link=""\n  className="outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[""]"\n/>\n\n// On the card:\n// has-[[data-card-link]:focus-visible]:outline-2',
        },
      },
      {
        heading: 'Caveat',
        paragraphs: [
          'Any other button or link inside the card sits under the pseudo-element. Give it position: relative and a z-index so it stays reachable by pointer.',
        ],
      },
    ],
  },
  {
    slug: 'theme-without-flash',
    title: 'Switching themes without a first-paint flash',
    summary:
      'Apply the saved theme in a tiny inline script before the bundle loads, then keep React in sync with an external store.',
    date: '2026-10-13',
    tags: ['react', 'theming', 'performance'],
    body: [
      {
        heading: 'Where the flash comes from',
        paragraphs: [
          'If React applies the dark class, the browser has already painted the page in the default theme by the time the bundle runs. Dark-mode users see a white flash on every load.',
        ],
      },
      {
        heading: 'Decide before first paint',
        paragraphs: [
          'A few lines in index.html read the saved preference and the system setting and toggle the class on <html> synchronously. Storage access is wrapped in try/catch because it can throw in private modes or with blocked site data.',
        ],
        code: {
          language: 'text',
          title: 'index.html',
          code: "var theme = 'system'\ntry {\n  theme = localStorage.getItem('hieu-ui-lab:theme') || 'system'\n} catch (e) {}\nvar dark =\n  theme === 'dark' ||\n  (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)\ndocument.documentElement.classList.toggle('dark', dark)",
        },
      },
      {
        heading: 'Keep React in sync',
        paragraphs: [
          'useTheme reads from a module-level store through useSyncExternalStore, so every consumer agrees without a context provider. In system mode it listens for prefers-color-scheme changes and updates live.',
        ],
      },
    ],
  },
]

/** Newest first; notes written on the same day keep their authored order. */
export const notes: readonly Note[] = [...authored].sort((a, b) => b.date.localeCompare(a.date))

export function getNote(slug: string): Note | undefined {
  return notes.find((note) => note.slug === slug)
}
