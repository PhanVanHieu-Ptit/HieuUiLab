import type { ImplementedEntry } from '../types'

export const searchFilterFormEntry: ImplementedEntry = {
  id: 'search-filter-form',
  slug: 'search-filter-form',
  name: 'Search and filter form',
  description:
    'Search criteria on React Hook Form and Zod: a query, a status group that needs one choice, a validated date range, sorting, and an archive toggle.',
  kind: 'block',
  category: 'inputs',
  tags: ['async', 'composition', 'form', 'validation'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/search-filter-form.tsx',
    packages: ['@hookform/resolvers', 'react-hook-form', 'zod'],
    registryDependencies: [
      'button',
      'checkbox',
      'field',
      'form',
      'form-feedback',
      'input',
      'search-input',
      'select',
      'switch',
    ],
    requirements: ['design-tokens'],
  },
  guidelines: [
    'The block collects criteria; the parent runs the search and renders the results, so it can also sync filters with the URL.',
    'Cross-field rules live in the schema (`superRefine`) and are reported on the field the user must change, here the end date.',
    'The form has `role="search"`, so it is a landmark screen-reader users can jump to.',
  ],
  api: {
    parts: [
      {
        name: 'SearchFilterForm',
        props: [
          {
            name: 'onSubmit',
            type: '(values: SearchFilterValues) => Promise<SubmitResult<SearchFilterInput>>',
            required: true,
            description: 'Runs the search; return a message such as "12 orders match".',
          },
          {
            name: 'onReset',
            type: '() => void',
            description: 'Called after Reset restores the defaults.',
          },
          {
            name: 'defaultValues',
            type: 'Partial<SearchFilterInput>',
            description: 'Initial filters merged over the defaults.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Block editing and searching.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
