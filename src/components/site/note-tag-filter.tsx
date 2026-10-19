import { useId } from 'react'

import { Button } from '@/components/ui/button'
import type { NoteTag } from '@/notes/manifest'

interface NoteTagFilterProps {
  /** The tags in use, with how many articles carry each. */
  tags: readonly { tag: NoteTag; count: number }[]
  /** The tag the list is filtered by, if any. */
  active: NoteTag | undefined
  /** Called with the tag to filter by, or undefined to show every article. */
  onChange: (tag: NoteTag | undefined) => void
  resultCount: number
  total: number
  /** Id of the results list the filter controls. */
  resultsId?: string
}

function articles(count: number): string {
  return count === 1 ? '1 article' : `${String(count)} articles`
}

/** One toggle per tag, a status line that says what is shown, and a way back to every article. */
export function NoteTagFilter({
  tags,
  active,
  onChange,
  resultCount,
  total,
  resultsId,
}: NoteTagFilterProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-labelledby={`${id}-tags`}
        className="flex flex-wrap items-center gap-2"
      >
        <span id={`${id}-tags`} className="mr-1 text-sm font-medium">
          Tags
        </span>
        {tags.map(({ tag, count }) => {
          const pressed = tag === active
          return (
            <Button
              key={tag}
              size="sm"
              variant={pressed ? 'secondary' : 'outline'}
              aria-pressed={pressed}
              aria-controls={resultsId}
              onClick={() => {
                onChange(pressed ? undefined : tag)
              }}
              className="h-7 rounded-full px-2.5 font-mono"
            >
              {tag} <span className="font-sans text-muted-foreground">({count})</span>
            </Button>
          )
        })}
      </div>
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <p role="status" className="mr-auto text-sm text-muted-foreground">
          {active
            ? `${articles(resultCount)} of ${String(total)} tagged ${active}`
            : articles(total)}
        </p>
        {active ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange(undefined)
            }}
          >
            Show all articles
          </Button>
        ) : null}
      </div>
    </div>
  )
}
