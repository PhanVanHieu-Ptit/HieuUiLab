import dataToolbarSource from '@/components/blocks/data-toolbar.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { DataToolbarDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const dataToolbarEntry: ImplementedEntry = {
  id: 'data-toolbar',
  slug: 'data-toolbar',
  name: 'Data toolbar',
  description:
    'Search, filter selects, a live result count, and an actions slot above a collection. Fully controlled; the caller filters the data.',
  kind: 'block',
  category: 'inputs',
  tags: ['a11y', 'composition', 'responsive', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/data-toolbar.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['button', 'label', 'search-input', 'select'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: dataToolbarSource,
  examples: [
    {
      id: 'filter-list',
      title: 'Filtering a list',
      description:
        'Type or pick a role: the count is announced politely, and Clear filters appears once anything is filtered.',
      component: DataToolbarDemo,
      code: demoCode('DataToolbarDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
  guidelines: [
    'The toolbar holds no state. Keep the search and filter values in your component (or the URL), filter the data with them, and pass the count back.',
    'Give every filter a value that means “not filtered” (defaultValue); Clear filters is shown only while something differs from it.',
    'Filters apply as soon as they change. For a form that applies on submit, with validation, use Search filter form.',
    'Every control has a visible label. Controls stack vertically below the sm breakpoint.',
    'For large data sets, filter with useDeferredValue on the query so typing stays responsive.',
  ],
  api: {
    parts: [
      {
        name: 'DataToolbar',
        props: [
          {
            name: 'search',
            type: '{ value; onChange; label; placeholder? }',
            description: 'A labelled search input; Escape or the clear button empties it.',
          },
          {
            name: 'filters',
            type: 'readonly { id; label; value; defaultValue; options; onChange }[]',
            description: 'One labelled select per filter.',
          },
          {
            name: 'resultCount',
            type: 'number',
            description: 'Count after filtering, in a role="status" region.',
          },
          {
            name: 'formatResultCount',
            type: '(count: number) => string',
            description: 'Wording for the count. Defaults to "n results".',
          },
          {
            name: 'onReset',
            type: '() => void',
            description: 'Shows Clear filters while anything is filtered.',
          },
          { name: 'actions', type: 'ReactNode', description: 'Buttons aligned to the end.' },
        ],
      },
    ],
  },
}
