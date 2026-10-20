import { siteConfig } from '@/config/site'

import type { Profile, ProfileLink, ResolvedProfileLink } from './profile-types'

/**
 * The About page's profile: positioning, skill domains, learning goals, and links. It is the one
 * place this information is written down; the About page, the footer, and the validator all read
 * it. `validateProfile` (profile-rules.ts) checks it against the repository in
 * profile.test.ts, and the type has no field for an employer, qualification, or metric.
 *
 * Add a CV or an email by adding one entry to `links`; see "Editing the About page" in the README.
 * Nothing is shown for a link that is not listed.
 */

export const profile: Profile = {
  headline:
    'Frontend engineer focused on React, TypeScript, reusable UI systems, and practical engineering.',

  intro: [
    'I’m Hieu, a frontend engineer. I work in React and TypeScript, on interface code that other people can reuse, and on the practical side of the job: typed data, explicit loading and error states, and tests at several layers. Hieu UI Lab is where I do that work in public, so what is written here can be checked against the source.',
    'This page describes the work in this repository and nothing else. It makes no claims about employment, qualifications, or how widely anything is used. Learning goals are listed separately from what is built.',
  ],

  domains: [
    {
      id: 'component-apis',
      title: 'Component APIs and composition',
      summary:
        'Props that follow the native element, variants through class-variance-authority, asChild for changing what is rendered, and compound parts such as Card and Field. The note also records where one component’s API stops matching its documentation.',
      tools: [
        { name: 'React', package: 'react' },
        { name: 'Radix UI', package: 'radix-ui' },
        { name: 'class-variance-authority', package: 'class-variance-authority' },
        { name: 'tailwind-merge', package: 'tailwind-merge' },
      ],
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
          label: 'CardTitle and its as prop',
          path: 'src/components/ui/card.tsx',
          anchor: 'as: Tag',
        },
      ],
      projects: ['hieu-ui-lab-component-library'],
      notes: ['designing-reusable-component-apis'],
    },
    {
      id: 'tokens-and-theming',
      title: 'Design tokens and theming',
      summary:
        'Semantic OKLCH colour tokens in one stylesheet, light and dark themes, a saved theme applied before first paint, and a unit test that checks text contrast for the token pairs.',
      tools: [
        { name: 'Tailwind CSS', package: 'tailwindcss' },
        { name: 'CSS custom properties' },
        { name: 'Vitest', package: 'vitest' },
      ],
      evidence: [
        {
          label: 'Tokens mapped to Tailwind utilities',
          path: 'src/styles/globals.css',
          anchor: '@theme inline',
        },
        {
          label: 'The contrast test',
          path: 'src/styles/tokens.test.ts',
          anchor: 'function contrast',
        },
        {
          label: 'The pre-paint theme script',
          path: 'index.html',
          anchor: 'hieu-ui-lab:theme',
        },
      ],
      projects: ['hieu-ui-lab-component-library'],
      notes: ['theme-without-flash', 'contrast-checks-as-unit-tests'],
    },
    {
      id: 'typescript',
      title: 'TypeScript',
      summary:
        'Strict compiler settings including exactOptionalPropertyTypes and noUncheckedIndexedAccess, type-aware lint presets, discriminated unions for registry entries, and records that require a loader for every slug. The note shows what each setting caught in real code and what it costs.',
      tools: [
        { name: 'TypeScript', package: 'typescript' },
        { name: 'typescript-eslint', package: 'typescript-eslint' },
      ],
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
          label: 'The registry entry union',
          path: 'src/registry/types.ts',
          anchor: 'export type RegistryEntry = ImplementedEntry | PlannedEntry',
        },
      ],
      projects: ['hieu-ui-lab-platform'],
      notes: ['strict-typescript-for-a-component-library'],
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      summary:
        'Reduced-motion support in CSS and in JavaScript-driven animation, stretched card links that keep a short link name, keyboard flows covered by end-to-end tests, jsx-a11y linting, and colour contrast checked in a unit test.',
      tools: [
        { name: 'eslint-plugin-jsx-a11y', package: 'eslint-plugin-jsx-a11y' },
        { name: 'Testing Library', package: '@testing-library/react' },
        { name: 'Playwright', package: '@playwright/test' },
      ],
      evidence: [
        {
          label: 'The reduced-motion hook',
          path: 'src/hooks/use-reduced-motion.ts',
          anchor: 'useSyncExternalStore',
        },
        {
          label: 'The stretched card link test',
          path: 'src/components/ui/card.test.tsx',
          anchor: 'stretches CardLink over an interactive card',
        },
        {
          label: 'What the testing guide says is not covered',
          path: 'src/docs/content/testing.md',
          anchor: 'No automated accessibility engine such as axe runs',
        },
      ],
      projects: ['hieu-ui-lab-component-library'],
      notes: ['reduced-motion-beyond-css', 'whole-card-links'],
      boundary:
        'No automated accessibility engine such as axe runs, and Chromium is the only browser.',
    },
    {
      id: 'forms',
      title: 'Forms and validation',
      summary:
        'Forms on React Hook Form and Zod where the schema holds the rules, a small adapter only displays the resolver’s result, and input and output types are kept apart. Unit tests cover the adapter, and an end-to-end test checks error focus and saving from the keyboard.',
      tools: [
        { name: 'React Hook Form', package: 'react-hook-form' },
        { name: 'Zod', package: 'zod' },
        { name: 'Hookform resolvers', package: '@hookform/resolvers' },
      ],
      evidence: [
        {
          label: 'The adapter, which only displays the resolver result',
          path: 'src/components/ui/form.tsx',
          anchor: 'Validation stays in the resolver',
        },
        {
          label: 'A schema whose output differs from its input',
          path: 'src/components/blocks/profile-form.tsx',
          anchor: 'useForm<ProfileFormInput, unknown, ProfileFormValues>',
        },
        {
          label: 'The end-to-end form test',
          path: 'e2e/forms.spec.ts',
          anchor:
            'focuses the first error, shows a server field error, then saves from the keyboard',
        },
      ],
      projects: ['hieu-ui-lab-component-library'],
      notes: ['react-hook-form-and-zod-in-a-form-library'],
    },
    {
      id: 'testing',
      title: 'Testing and quality checks',
      summary:
        'Unit and component tests that query by role and name, Playwright tests at several widths in both themes, and a CI workflow that runs lint, format, type, documentation, notes, unit, build, and end-to-end checks. Content validators fail the build when documentation or a note drifts from the code.',
      tools: [
        { name: 'Vitest', package: 'vitest' },
        { name: 'Testing Library', package: '@testing-library/react' },
        { name: 'Playwright', package: '@playwright/test' },
        { name: 'ESLint', package: 'eslint' },
        { name: 'Prettier', package: 'prettier' },
      ],
      evidence: [
        {
          label: 'The CI workflow runs the end-to-end tests',
          path: '.github/workflows/ci.yml',
          anchor: 'pnpm test:e2e',
        },
        {
          label: 'The testing guide’s test layers',
          path: 'src/docs/content/testing.md',
          anchor: 'Unit and content',
        },
        {
          label: 'Source rules every block and template must pass',
          path: 'src/test/source-rules.ts',
          anchor: 'forbiddenInSource',
        },
      ],
      projects: ['hieu-ui-lab-platform'],
      notes: ['contrast-checks-as-unit-tests'],
      boundary: 'Chromium is the only browser the end-to-end tests run in.',
    },
    {
      id: 'architecture',
      title: 'Frontend architecture and tooling',
      summary:
        'A typed registry that feeds navigation, search, the catalog, and detail pages; React Router data routes with per-route metadata and lazy pages; and validators that check the registry, documentation, notes, and project showcase against the repository.',
      tools: [
        { name: 'React Router', package: 'react-router' },
        { name: 'Vite', package: 'vite' },
        { name: 'marked', package: 'marked' },
        { name: 'Shiki', package: 'shiki' },
      ],
      evidence: [
        {
          label: 'The route tree',
          path: 'src/router/routes.tsx',
          anchor: 'export function createRoutes',
        },
        {
          label: 'Declared packages checked against the source',
          path: 'src/registry/validate.ts',
          anchor: 'source imports "${name}" but it is not declared',
        },
        {
          label: 'The documentation validator',
          path: 'src/docs/docs-rules.ts',
          anchor: 'export function validateDocs',
        },
        {
          label: 'Where the README records that deployment is not set up',
          path: 'README.md',
          anchor: 'Not set up',
        },
      ],
      projects: ['hieu-ui-lab-platform'],
      notes: ['registry-validation-as-a-distribution-workflow'],
      boundary: 'The site is not deployed yet.',
    },
    {
      id: 'graphics',
      title: 'Geospatial and 3D graphics',
      summary:
        'Map projections written as pure, tested functions and drawn as SVG, and a lit WebGL2 scene with a small tested matrix module. Both follow the theme, and the scene starts still when the system asks for reduced motion.',
      tools: [{ name: 'React', package: 'react' }, { name: 'SVG' }, { name: 'WebGL2' }],
      evidence: [
        {
          label: 'An orthographic projection as a pure function',
          path: 'src/lab/map-projections/projection.ts',
          anchor: 'export function createOrthographic',
        },
        {
          label: 'The WebGL2 scene',
          path: 'src/lab/webgl-scene/scene.ts',
          anchor: "canvas.getContext('webgl2'",
        },
        {
          label: 'The matrix module tests',
          path: 'src/lab/webgl-scene/mat4.test.ts',
          anchor: "describe('mat4'",
        },
      ],
      projects: ['geospatial-3d-experiments'],
      notes: ['reduced-motion-beyond-css'],
    },
  ],

  goals: [
    {
      id: 'tanstack-query',
      title: 'Server state with TanStack Query',
      why: 'Interfaces that load data need caching, loading and error states, and invalidation. I want to learn how a library built for that shapes the code.',
      today:
        'Blocks and templates use invented data, and a source rule forbids network requests in them. TanStack Query is not a dependency.',
      evidence: {
        label: 'The rule against network requests in blocks and templates',
        path: 'src/test/source-rules.ts',
        anchor: 'make network requests (fetch / XMLHttpRequest)',
      },
      notYetDependency: '@tanstack/react-query',
    },
    {
      id: 'maplibre',
      title: 'Geospatial layers with MapLibre',
      why: 'The lab draws projections by hand to understand how they work. A mapping library is the next step for real map data and layers.',
      today: 'The maps are SVG drawn from pure projection functions. MapLibre is not a dependency.',
      evidence: {
        label: 'The SVG map component',
        path: 'src/lab/map-projections/map-svg.tsx',
        anchor: '<svg',
      },
      notYetDependency: 'maplibre-gl',
    },
    {
      id: 'npm-publishing',
      title: 'Publishing a React UI library to npm',
      why: 'Today the components are copied into a project by hand. Publishing a library means a build, an exports map, versioning, and a release process.',
      today:
        'The package is private, and the repository has no library build, exports map, or release workflow.',
      evidence: {
        label: 'The package is private',
        path: 'package.json',
        anchor: '"private": true',
      },
    },
    {
      id: 'component-tests',
      title: 'Reliable component tests',
      why: 'The existing tests query by role and name. I want a clearer method for deciding what a component test should cover and how to keep it dependable.',
      today:
        'The repository has Vitest and Testing Library tests for components, hooks, and routes, described on the Testing docs page. It has no written guide to what makes a component test reliable.',
      evidence: {
        label: 'The topic listed as not written yet',
        path: 'src/notes/README.md',
        anchor: 'Writing reliable component tests',
      },
    },
    {
      id: 'performance',
      title: 'Measuring frontend performance',
      why: 'The repository records that the registry source is still in the main bundle, but it has no way to measure what that costs.',
      today:
        'There is no bundle analyzer or measurement code, so this site makes no performance claim.',
      evidence: {
        label: 'The note listing the missing measurement',
        path: 'src/notes/README.md',
        anchor: 'no bundle analyzer or measurement code',
      },
    },
  ],

  links: [
    { kind: 'github', url: siteConfig.githubProfileUrl },
    { kind: 'repository', url: siteConfig.githubUrl },
    { kind: 'issues', url: siteConfig.issuesUrl },
  ],
}

function resolveLink(link: ProfileLink): ResolvedProfileLink {
  switch (link.kind) {
    case 'github':
      return { kind: link.kind, label: 'GitHub profile', href: link.url, target: 'web' }
    case 'repository':
      return { kind: link.kind, label: 'Repository', href: link.url, target: 'web' }
    case 'issues':
      return { kind: link.kind, label: 'Open an issue', href: link.url, target: 'web' }
    case 'cv':
      return { kind: link.kind, label: 'CV (PDF)', href: link.path, target: 'file' }
    case 'email':
      return { kind: link.kind, label: 'Email', href: `mailto:${link.address}`, target: 'mail' }
  }
}

/** Every link in `links`, ready to render, in the order they are listed. */
export function profileLinks(links: readonly ProfileLink[] = profile.links): ResolvedProfileLink[] {
  return links.map(resolveLink)
}

/** The links for reaching the author: everything except the repository, which the footer lists as source. */
export function contactLinks(links: readonly ProfileLink[] = profile.links): ResolvedProfileLink[] {
  return profileLinks(links.filter((link) => link.kind !== 'repository'))
}
