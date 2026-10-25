import type { ImplementedEntry } from '../types'

export const searchFilterToolbarEntry: ImplementedEntry = {
  id: 'search-filter-toolbar',
  slug: 'search-filter-toolbar',
  name: 'Search and filter toolbar',
  description:
    'A search field, filter selects, sort, saved views, and a removable chip for every active criterion, driven by one value you own.',
  kind: 'block',
  category: 'pages',
  tags: ['a11y', 'composition', 'responsive', 'sorting'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/search-filter-toolbar.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['data-toolbar', 'badge', 'button'],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
    notes: [
      'The toolbar filters nothing. Apply the value to your data (in memory, in a query string, or on the server) and pass the result count back.',
      'The value is plain, serialisable data, so it can live in the URL: parse it from the query string and write each onValueChange back.',
    ],
  },
  guidelines: [
    'It is built on Data toolbar and keeps its behaviour: every control has a visible label, the result count is announced politely, and Clear filters appears only while something differs from its default.',
    'The whole state is one value ({ query, filters, sort }). A saved view is just such a value, and a view reads as pressed when it selects the same results as the current value.',
    'Every filter needs a default option that means “not filtered”. A filter missing from value.filters, or set to its default, is off and shows no chip.',
    'Each chip’s remove button is named after what it removes, for example “Remove filter Status: Beta”. After removing one, focus moves to the next chip, or to the toolbar when none is left.',
    'Sorting is not a filter: it has no chip, and the first sort option is the default. Clear filters resets the sort too.',
    'The toolbar stacks its controls while it is narrower than 36rem, measured on the toolbar itself rather than the window.',
  ],
  api: {
    parts: [
      {
        name: 'SearchFilterToolbar',
        props: [
          {
            name: 'value',
            type: 'FilterToolbarValue',
            required: true,
            description: 'The current query, filter choices, and sort.',
          },
          {
            name: 'onValueChange',
            type: '(value: FilterToolbarValue) => void',
            required: true,
            description: 'Called with the complete next value after any change.',
          },
          {
            name: 'filters',
            type: 'readonly FilterToolbarFilter[]',
            default: '[]',
            description: 'Filter selects, in order.',
          },
          {
            name: 'sortOptions',
            type: 'readonly { value: string; label: string }[]',
            default: '[]',
            description: 'Adds a “Sort by” select. The first option is the default sort.',
          },
          {
            name: 'views',
            type: 'readonly FilterToolbarView[]',
            default: '[]',
            description: 'Saved views shown as toggle buttons above the toolbar.',
          },
          {
            name: 'label',
            type: 'string',
            default: "'Search and filter'",
            description: 'Name of the search landmark.',
          },
          {
            name: 'searchLabel',
            type: 'string',
            default: "'Search'",
            description: 'Visible label of the search field.',
          },
          {
            name: 'searchPlaceholder',
            type: 'string',
            description: 'Placeholder of the search field.',
          },
          {
            name: 'resultCount',
            type: 'number',
            description: 'Number of results after filtering; announced politely when it changes.',
          },
          {
            name: 'formatResultCount',
            type: '(count: number) => string',
            default: "'1 result' or 'n results'",
            description: 'Wording for the count.',
          },
          {
            name: 'actions',
            type: 'ReactNode',
            description: 'Page actions, at the end of the count row.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer element.' },
        ],
      },
      {
        name: 'FilterToolbarValue',
        description: 'Everything the toolbar edits.',
        props: [
          { name: 'query', type: 'string', required: true, description: 'The search text.' },
          {
            name: 'filters',
            type: 'Readonly<Record<string, string>>',
            required: true,
            description: 'Chosen option per filter id. Missing or default means off.',
          },
          { name: 'sort', type: 'string', required: true, description: 'The chosen sort option.' },
        ],
      },
      {
        name: 'FilterToolbarFilter',
        description: 'One filter select.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Key in value.filters.' },
          { name: 'label', type: 'string', required: true, description: 'Visible label.' },
          {
            name: 'options',
            type: 'readonly { value: string; label: string }[]',
            required: true,
            description: 'Choices, including the default.',
          },
          {
            name: 'defaultValue',
            type: 'string',
            required: true,
            description: 'The option meaning “not filtered”, e.g. "all".',
          },
        ],
      },
      {
        name: 'FilterToolbarView',
        description: 'A saved set of criteria.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable unique id.' },
          { name: 'label', type: 'string', required: true, description: 'Text of the button.' },
          {
            name: 'value',
            type: 'FilterToolbarValue',
            required: true,
            description: 'The criteria applied when the button is pressed.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
