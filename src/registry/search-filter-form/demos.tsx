import { useState } from 'react'

import {
  SearchFilterForm,
  type SearchFilterInput,
  type SearchFilterValues,
} from '@/components/blocks/search-filter-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { SubmitResult } from '@/components/ui/form'

type OrderStatus = SearchFilterValues['statuses'][number]

interface Order {
  id: string
  customer: string
  status: OrderStatus
  total: number
  updatedAt: string
  archived: boolean
}

/** Example data, held in memory. */
const sampleOrders: readonly Order[] = [
  {
    id: 'ORD-1041',
    customer: 'Linh Tran',
    status: 'pending',
    total: 89,
    updatedAt: '2026-10-02',
    archived: false,
  },
  {
    id: 'ORD-1042',
    customer: 'Sam Okafor',
    status: 'processing',
    total: 240,
    updatedAt: '2026-09-28',
    archived: false,
  },
  {
    id: 'ORD-1043',
    customer: 'Mai Pham',
    status: 'shipped',
    total: 56,
    updatedAt: '2026-09-20',
    archived: false,
  },
  {
    id: 'ORD-1044',
    customer: 'Jonas Berg',
    status: 'delivered',
    total: 312,
    updatedAt: '2026-08-14',
    archived: true,
  },
  {
    id: 'ORD-1045',
    customer: 'Aiko Sato',
    status: 'cancelled',
    total: 45,
    updatedAt: '2026-08-02',
    archived: false,
  },
  {
    id: 'ORD-1046',
    customer: 'Linh Tran',
    status: 'shipped',
    total: 130,
    updatedAt: '2026-07-30',
    archived: false,
  },
  {
    id: 'ORD-1047',
    customer: 'Priya Shah',
    status: 'pending',
    total: 74,
    updatedAt: '2026-10-08',
    archived: false,
  },
  {
    id: 'ORD-1048',
    customer: 'Sam Okafor',
    status: 'delivered',
    total: 198,
    updatedAt: '2026-06-19',
    archived: true,
  },
]

type MockOutcome = 'success' | 'unavailable'

/**
 * Example only, not a backend integration. Filters the in-memory sample after
 * a short wait, or fails when the demo asks it to. Nothing is sent.
 */
async function mockSearchOrders(
  filters: SearchFilterValues,
  outcome: MockOutcome,
): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  if (outcome === 'unavailable') throw new Error('Mock: the search service is unavailable.')
  const query = filters.query.toLowerCase()
  const matches = sampleOrders.filter(
    (order) =>
      (query === '' ||
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query)) &&
      filters.statuses.includes(order.status) &&
      (filters.includeArchived || !order.archived) &&
      (filters.updatedFrom === '' || order.updatedAt >= filters.updatedFrom) &&
      (filters.updatedTo === '' || order.updatedAt <= filters.updatedTo),
  )
  const [key, direction] =
    filters.sort === 'total-asc' || filters.sort === 'total-desc'
      ? (['total', filters.sort === 'total-asc' ? 1 : -1] as const)
      : (['updatedAt', filters.sort === 'updated-asc' ? 1 : -1] as const)
  return matches.toSorted((a, b) =>
    a[key] > b[key] ? direction : a[key] < b[key] ? -direction : 0,
  )
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function SearchFilterFormDemo() {
  const [outcome, setOutcome] = useState<MockOutcome>('success')
  const [orders, setOrders] = useState<Order[] | null>(null)

  async function search(filters: SearchFilterValues): Promise<SubmitResult<SearchFilterInput>> {
    setOrders(null)
    const results = await mockSearchOrders(filters, outcome)
    setOrders(results)
    return {
      ok: true,
      message:
        results.length === 1 ? '1 order matches.' : `${String(results.length)} orders match.`,
    }
  }

  return (
    <div className="grid w-full max-w-2xl gap-5">
      <Alert variant="info" role="none">
        <AlertTitle>Example only</AlertTitle>
        <AlertDescription>
          Searches run against eight sample orders in memory; nothing is sent anywhere.
        </AlertDescription>
      </Alert>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary"
          checked={outcome === 'unavailable'}
          onChange={(event) => {
            setOutcome(event.target.checked ? 'unavailable' : 'success')
          }}
        />
        Mock response: make the search service fail
      </label>
      <SearchFilterForm
        onSubmit={search}
        onReset={() => {
          setOrders(null)
        }}
      />
      {orders && orders.length > 0 ? (
        <ul aria-label="Matching orders" className="divide-y rounded-md border">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium">{order.id}</span>{' '}
                <span className="text-muted-foreground">{order.customer}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">{order.status}</Badge>
                {order.archived ? <Badge variant="neutral">archived</Badge> : null}
                <span className="tabular-nums">{money.format(order.total)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
