import { useEffect, useState } from 'react'

import { highlightTsx } from '@/lib/highlight'
import { cn } from '@/lib/cn'

import { CopyButton } from './copy-button'

interface CodeBlockProps {
  code: string
  /** Optional file name shown in the header bar. */
  title?: string
  className?: string
}

export function CodeBlock({ code, title, className }: CodeBlockProps) {
  const [highlighted, setHighlighted] = useState<{ code: string; html: string } | null>(null)

  useEffect(() => {
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
  }, [code])

  const html = highlighted?.code === code ? highlighted.html : null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-code text-code-foreground',
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between border-b px-3">
        <span className="font-mono text-xs text-muted-foreground">{title ?? 'tsx'}</span>
        <CopyButton value={code} />
      </div>
      {html === null ? (
        <pre className="max-h-[32rem] overflow-auto p-4 font-mono text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
      ) : (
        <div
          className="max-h-[32rem] overflow-auto font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-4"
          // Trusted input: Shiki output generated locally from repository source files.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}
