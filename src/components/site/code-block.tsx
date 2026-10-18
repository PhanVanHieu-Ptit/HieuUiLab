import { FileCode2, SquareTerminal } from 'lucide-react'
import { useEffect, useState } from 'react'

import { highlightCode, type HighlightLanguage } from '@/lib/highlight'
import { cn } from '@/lib/cn'

import { CopyButton } from './copy-button'
import { ScrollRegion } from './scroll-region'

export type CodeLanguage = HighlightLanguage | 'bash' | 'text'

interface CodeBlockProps {
  code: string
  /** `tsx`, `ts`, `json`, and `css` are syntax highlighted; `bash` and `text` render as-is. */
  language?: CodeLanguage
  /** Optional file name shown in the header bar; defaults to the language. */
  title?: string
  /** Accessible name of the copy button; name what is copied when a page has several. */
  copyLabel?: string
  className?: string
}

function isHighlighted(language: CodeLanguage): language is HighlightLanguage {
  return language !== 'bash' && language !== 'text'
}

/**
 * Code panel: header with file name and copy button, then a scrollable body.
 * Long lines scroll inside the panel and never widen the page; the body is
 * keyboard-scrollable while it overflows.
 */
export function CodeBlock({
  code,
  language = 'tsx',
  title,
  copyLabel = 'Copy code',
  className,
}: CodeBlockProps) {
  const [highlighted, setHighlighted] = useState<{
    code: string
    language: CodeLanguage
    html: string
  } | null>(null)

  useEffect(() => {
    if (!isHighlighted(language)) return
    let cancelled = false
    highlightCode(code, language).then(
      (html) => {
        if (!cancelled) setHighlighted({ code, language, html })
      },
      () => {
        // Highlighting is progressive enhancement; the plain <pre> stays visible on failure.
      },
    )
    return () => {
      cancelled = true
    }
  }, [code, language])

  const html =
    isHighlighted(language) && highlighted?.code === code && highlighted.language === language
      ? highlighted.html
      : null
  const Icon = language === 'bash' ? SquareTerminal : FileCode2
  const name = title ?? language

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
          {name}
        </span>
        <CopyButton value={code} label={copyLabel} />
      </figcaption>
      <ScrollRegion
        label={`${name}, scrollable`}
        className="max-h-128 overflow-auto font-mono text-mono"
      >
        {/* One stable wrapper, so the scroll region notices the plain text being replaced. */}
        <div className="w-max min-w-full">
          {html === null ? (
            <pre className="p-4">
              <code>{code}</code>
            </pre>
          ) : (
            <div
              className="[&_pre]:w-max [&_pre]:min-w-full [&_pre]:!bg-transparent [&_pre]:p-4"
              // Trusted input: Shiki output generated locally from repository source files.
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </ScrollRegion>
    </figure>
  )
}
