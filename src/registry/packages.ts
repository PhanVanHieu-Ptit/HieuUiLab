import manifestSource from '../../package.json?raw'

/**
 * Every npm package a registry entry may ask the reader to install, with why.
 * A test checks each one is a dependency of this project, so documented install
 * commands never name a package the site itself does not use.
 */
export const registryPackages = {
  'class-variance-authority': { purpose: 'Typed variant and size class maps.' },
  clsx: { purpose: 'Conditional class names (used by the cn helper).' },
  'tailwind-merge': { purpose: 'Resolves conflicting Tailwind classes (used by the cn helper).' },
  'radix-ui': {
    purpose:
      'Accessible primitives: Slot, Dialog, Tabs, Select, Tooltip, Checkbox, Switch, Label, Separator.',
  },
  'lucide-react': { purpose: 'Icons.' },
  'react-hook-form': {
    purpose: 'Form state, submission, and focusing the first invalid field (form adapter only).',
  },
  zod: { purpose: 'Schemas that hold every validation rule and type the form values.' },
  '@hookform/resolvers': { purpose: 'Connects a Zod schema to React Hook Form.' },
} as const satisfies Record<string, { purpose: string }>

export type PackageName = keyof typeof registryPackages

/**
 * Project setup an entry expects besides npm packages. Each one is documented
 * on the installation or theming page.
 */
export const registryRequirements = {
  'cn-helper': {
    title: 'cn helper',
    description: 'src/lib/cn.ts, which merges class names with clsx and tailwind-merge.',
    href: '/docs/installation#cn',
    packages: ['clsx', 'tailwind-merge'],
  },
  'design-tokens': {
    title: 'Design tokens',
    description: 'The semantic color, radius, and type tokens from the site stylesheet.',
    href: '/docs/installation#tokens',
    packages: [],
  },
  'state-utilities': {
    title: 'State utilities',
    description: 'The focus-ring, focus-ring-inset, and disabled-state @utility rules.',
    href: '/docs/installation#tokens',
    packages: [],
  },
} as const satisfies Record<
  string,
  { title: string; description: string; href: string; packages: readonly PackageName[] }
>

export type RequirementId = keyof typeof registryRequirements

export function isPackageName(value: string): value is PackageName {
  return Object.hasOwn(registryPackages, value)
}

export function isRequirementId(value: string): value is RequirementId {
  return Object.hasOwn(registryRequirements, value)
}

const manifest = JSON.parse(manifestSource) as { dependencies?: Record<string, string> }

/** The version range this site builds and tests the registry against, from package.json. */
export function packageVersion(name: PackageName): string | undefined {
  return manifest.dependencies?.[name]
}
