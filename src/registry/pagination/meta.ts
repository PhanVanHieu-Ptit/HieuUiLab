import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const paginationEntry: ImplementedEntry = {
  id: 'pagination',
  slug: 'pagination',
  name: 'Pagination',
  description:
    'Previous, next, and numbered page buttons with a constant width, aria-current on the current page, and a compact summary on small screens.',
  kind: 'component',
  category: 'navigation',
  tags: ['a11y', 'keyboard', 'pagination', 'responsive'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/pagination.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['button'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  guidelines: [
    'Name each pagination with aria-label when a page has more than one, e.g. "Orders pages".',
    'Pagination is controlled: keep the page in state (or in the URL) and clamp it when the data shrinks.',
    'Previous and Next stay focusable with aria-disabled at the ends, so keyboard focus is not lost on the first or last page.',
    'Below the sm breakpoint only Previous, Next, and "Page x of y" are shown.',
  ],
  api: {
    parts: [
      {
        name: 'Pagination',
        props: [
          {
            name: 'page',
            type: 'number',
            required: true,
            description: 'Current page, from 1.',
          },
          {
            name: 'pageCount',
            type: 'number',
            required: true,
            description: 'Total number of pages.',
          },
          {
            name: 'onPageChange',
            type: '(page: number) => void',
            required: true,
            description: 'Called with the requested page.',
          },
          {
            name: 'siblings',
            type: 'number',
            default: '1',
            description: 'Pages shown either side of the current page.',
          },
          {
            name: 'aria-label',
            type: 'string',
            default: "'Pagination'",
            description: 'Name of the navigation landmark.',
          },
          nativeProps('nav'),
        ],
      },
      {
        name: 'getPageItems',
        description: 'The pure function behind the page list.',
        props: [
          {
            name: 'getPageItems(page, pageCount, siblings)',
            type: "(number | 'ellipsis-start' | 'ellipsis-end')[]",
            description: 'Page numbers and gap markers to render.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
