import { useState } from 'react'

import { Pagination } from '@/components/ui/pagination'

export function PaginationDemo() {
  const [page, setPage] = useState(1)

  return (
    <div className="flex flex-col items-center gap-3">
      <Pagination
        aria-label="Search results pages"
        page={page}
        pageCount={12}
        onPageChange={setPage}
      />
      <p className="text-sm text-muted-foreground">Showing page {page} of 12</p>
    </div>
  )
}

export function PaginationFewPagesDemo() {
  const [page, setPage] = useState(2)
  return <Pagination aria-label="Comments pages" page={page} pageCount={4} onPageChange={setPage} />
}
