import type { TechGroup } from './types'

/** What the lab is built with, taken from package.json. Versions are left out so it cannot go stale. */
export const techStack: readonly TechGroup[] = [
  {
    title: 'Interface',
    items: [
      { name: 'React', purpose: 'Component model and rendering', href: 'https://react.dev' },
      { name: 'React Router', purpose: 'Routing and navigation', href: 'https://reactrouter.com' },
      {
        name: 'Radix UI',
        purpose: 'Accessible primitives for dialogs, tabs, and menus',
        href: 'https://www.radix-ui.com',
      },
      { name: 'Lucide', purpose: 'Icons', href: 'https://lucide.dev' },
    ],
  },
  {
    title: 'Styling',
    items: [
      {
        name: 'Tailwind CSS',
        purpose: 'Utilities generated from semantic tokens',
        href: 'https://tailwindcss.com',
      },
      {
        name: 'class-variance-authority',
        purpose: 'Typed component variants',
        href: 'https://cva.style',
      },
      {
        name: 'tailwind-merge',
        purpose: 'Conflict-free class overrides',
        href: 'https://github.com/dcastil/tailwind-merge',
      },
    ],
  },
  {
    title: 'Language and quality',
    items: [
      {
        name: 'TypeScript',
        purpose: 'Strict types across app and tests',
        href: 'https://www.typescriptlang.org',
      },
      {
        name: 'ESLint',
        purpose: 'Type-aware, hooks, and a11y linting',
        href: 'https://eslint.org',
      },
      { name: 'Prettier', purpose: 'Consistent formatting', href: 'https://prettier.io' },
    ],
  },
  {
    title: 'Testing',
    items: [
      { name: 'Vitest', purpose: 'Unit and component tests', href: 'https://vitest.dev' },
      {
        name: 'Testing Library',
        purpose: 'Tests that query by role and name',
        href: 'https://testing-library.com',
      },
      {
        name: 'Playwright',
        purpose: 'End-to-end and responsive checks',
        href: 'https://playwright.dev',
      },
    ],
  },
  {
    title: 'Build',
    items: [
      { name: 'Vite', purpose: 'Dev server and production build', href: 'https://vite.dev' },
      { name: 'Shiki', purpose: 'Lazy-loaded syntax highlighting', href: 'https://shiki.style' },
      {
        name: 'marked',
        purpose: 'Markdown parsing for the documentation pages',
        href: 'https://marked.js.org',
      },
    ],
  },
]
