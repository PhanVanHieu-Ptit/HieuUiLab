import { useState } from 'react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortHeader,
  type SortDirection,
} from '@/components/ui/table'

interface Plan {
  name: string
  seats: number
  priceCents: number
}

// Example data, held in memory.
const plans: readonly Plan[] = [
  { name: 'Starter', seats: 3, priceCents: 900 },
  { name: 'Team', seats: 10, priceCents: 2900 },
  { name: 'Business', seats: 50, priceCents: 9900 },
  { name: 'Studio', seats: 5, priceCents: 1900 },
]

type SortKey = 'name' | 'seats' | 'priceCents'

const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function TableDemo() {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'priceCents',
    direction: 'asc',
  })

  const rows = plans.toSorted((a, b) => {
    const result = sort.key === 'name' ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key]
    return sort.direction === 'asc' ? result : -result
  })

  function sortBy(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function directionOf(key: SortKey) {
    return sort.key === key ? sort.direction : null
  }

  return (
    <div className="w-full max-w-lg overflow-x-auto rounded-lg border bg-surface">
      <Table>
        <TableCaption className="border-b">Plans</TableCaption>
        <TableHeader>
          <TableRow>
            <TableSortHeader
              sortDirection={directionOf('name')}
              onSort={() => {
                sortBy('name')
              }}
            >
              Plan
            </TableSortHeader>
            <TableSortHeader
              align="end"
              sortDirection={directionOf('seats')}
              onSort={() => {
                sortBy('seats')
              }}
            >
              Seats
            </TableSortHeader>
            <TableSortHeader
              align="end"
              sortDirection={directionOf('priceCents')}
              onSort={() => {
                sortBy('priceCents')
              }}
            >
              Price / month
            </TableSortHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((plan) => (
            <TableRow key={plan.name}>
              <TableHead scope="row" className="h-auto text-sm text-foreground">
                {plan.name}
              </TableHead>
              <TableCell className="text-right tabular-nums">{plan.seats}</TableCell>
              <TableCell className="text-right tabular-nums">
                {price.format(plan.priceCents / 100)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function TableStaticDemo() {
  return (
    <div className="w-full max-w-lg overflow-x-auto rounded-lg border bg-surface">
      <Table>
        <TableCaption className="sr-only">Keyboard shortcuts</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Shortcut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Open search</TableCell>
            <TableCell className="font-mono text-xs">⌘ K</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Toggle theme</TableCell>
            <TableCell className="font-mono text-xs">⌘ J</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
