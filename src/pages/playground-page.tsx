import { Link, useSearchParams } from 'react-router'

import { PageHeader } from '@/components/site/page'
import { findDocsNavItem } from '@/config/site'
import { getPlaygroundExample, playgroundExamples } from '@/playground'
import { Workbench } from '@/playground/ui/workbench'

/** The Playground page: pick a pre-defined example, then change its props and see the result. */
export function PlaygroundPage() {
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('example')
  // An id the allowlist does not know is not an error page: the first example is shown instead.
  const found = getPlaygroundExample(requested)
  const example = found ?? playgroundExamples[0]
  const item = findDocsNavItem('/playground')

  return (
    <article className="flex flex-col gap-8">
      <PageHeader
        title="Playground"
        {...(item?.description ? { description: item.description } : {})}
      />

      <div className="flex flex-col gap-3">
        <nav aria-label="Playground examples">
          <ul className="flex flex-wrap gap-2">
            {playgroundExamples.map((each) => (
              <li key={each.id}>
                <Link
                  to={{ search: `?example=${each.id}` }}
                  preventScrollReset
                  aria-current={each.id === example.id ? 'page' : undefined}
                  className="inline-flex h-8 items-center rounded-md border px-3 text-sm text-muted-foreground focus-ring transition-colors hover:bg-accent hover:text-accent-foreground aria-[current=page]:border-transparent aria-[current=page]:bg-primary-subtle aria-[current=page]:font-medium aria-[current=page]:text-primary-subtle-foreground"
                >
                  {each.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {requested !== null && !found ? (
          <p role="status" className="text-sm text-muted-foreground">
            There is no example called “{requested}”. Showing {example.title}.
          </p>
        ) : null}
        <p className="max-w-prose text-sm text-muted-foreground">
          These are pre-defined examples with typed controls. This is not a code editor: it never
          compiles or runs code you type, only the components each example lists.
        </p>
      </div>

      <Workbench key={example.id} example={example} />
    </article>
  )
}
