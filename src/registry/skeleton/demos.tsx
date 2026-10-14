import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonDemo() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
      className="flex w-full max-w-xs items-center gap-3"
    >
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonListDemo() {
  const [loading, setLoading] = useState(true)
  const posts = ['Theme without a flash', 'Testing contrast in CI', 'Radix in a registry']

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => {
      clearTimeout(timer)
    }
  }, [loading])

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <section aria-labelledby="skeleton-posts" aria-busy={loading} className="flex flex-col gap-3">
        <h3 id="skeleton-posts" className="text-sm font-medium">
          Recent notes
        </h3>
        {loading ? (
          <>
            <span className="sr-only">Loading notes…</span>
            {posts.map((title) => (
              <div key={title} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            ))}
          </>
        ) : (
          <ul className="flex flex-col gap-3">
            {posts.map((title) => (
              <li key={title} className="flex flex-col gap-1">
                <span className="text-sm leading-4">{title}</span>
                <span className="text-xs leading-3 text-muted-foreground">3 min read</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        disabled={loading}
        onClick={() => {
          setLoading(true)
        }}
      >
        Reload
      </Button>
    </div>
  )
}
