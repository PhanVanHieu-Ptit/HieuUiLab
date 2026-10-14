import { FileCode2, SquareTerminal } from 'lucide-react'
import { useEffect, useState } from 'react'

import { highlightTsx } from '@/lib/highlight'
import { cn } from '@/lib/cn'

import { CopyButton } from './copy-button'

interface CodeBlockProps {
  code: string
  /** `tsx` is syntax highlighted; `bash` and `text` render as-is. */
  language?: 'tsx' | 'bash' | 'text'
  /** Optional file name shown in the header bar; defaults to the language. */
  title?: string
  /** Accessible name of the copy button; name what is copied when a page has several. */
  copyLabel?: string
  className?: string
}

/**
 * Code panel: header with file name and copy button, then a scrollable body.
 * Long lines scroll inside the panel and never widen the page.
 */
export function CodeBlock({
  code,
  language = 'tsx',
  title,
  copyLabel = 'Copy code',
  className,
}: CodeBlockProps) {
  const [highlighted, setHighlighted] = useState<{ code: string; html: string } | null>(null)

  useEffect(() => {
    if (language !== 'tsx') return
    let cancelled = false
    highlightTsx(code).then(
      (html) => {
        if (!cancelled) setHighlighted({ code, html })
      },
      () => {
        // Highlighting is progressive enhancement; the plain <pre> stays visible on failure.
      },
    )
    return () => {
      cancelled = true
    }
  }, [code, language])

  const html = language === 'tsx' && highlighted?.code === code ? highlighted.html : null
  const Icon = language === 'bash' ? SquareTerminal : FileCode2

  return (
    <figure
      className={cn(
        'relative min-w-0 overflow-hidden rounded-lg border bg-code text-code-foreground',
        className,
      )}
    >
      <figcaption className="flex h-10 items-center gap-2 border-b pr-1 pl-3">
        <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {title ?? language}
        </span>
        <CopyButton value={code} label={copyLabel} />
      </figcaption>
      {html === null ? (
        <pre className="max-h-128 overflow-auto p-4 font-mono text-mono">
          <code>{code}</code>
        </pre>
      ) : (
        <div
          className="max-h-128 overflow-auto font-mono text-mono [&_pre]:w-max [&_pre]:min-w-full [&_pre]:!bg-transparent [&_pre]:p-4"
          // Trusted input: Shiki output generated locally from repository source files.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </figure>
  )
}
