import { X } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/cn'

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => {
        list.removeEventListener('change', onChange)
      }
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export interface DetailPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  /** Media query above which the panel renders inline instead of as a modal sheet. */
  inlineQuery?: string
  /** Classes for the inline `<aside>`. The sheet keeps its own width. */
  className?: string
}

/**
 * Details for the selected record. On wide screens it is an inline, non-modal
 * `<aside>` placed by the caller beside the list; on narrow screens it is a
 * modal Sheet. Either way, opening it moves focus into it, Escape closes it,
 * and closing it returns focus to the element that opened it.
 */
export function DetailPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  inlineQuery = '(min-width: 64rem)',
  className,
}: DetailPanelProps) {
  const inline = useMediaQuery(inlineQuery)
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  // Layout effects run before the sheet's focus trap moves focus, so this sees the opener.
  useLayoutEffect(() => {
    if (!open) return
    const active = document.activeElement
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null
  }, [open])

  useEffect(() => {
    if (!open || !inline) return
    headingRef.current?.focus()
    // While the inline panel stays open, the user may open another record from
    // outside it; that element becomes the one to return to.
    function trackOpener(event: FocusEvent) {
      const target = event.target
      if (target instanceof HTMLElement && !panelRef.current?.contains(target)) {
        openerRef.current = target
      }
    }
    document.addEventListener('focusin', trackOpener)
    return () => {
      document.removeEventListener('focusin', trackOpener)
      const opener = openerRef.current
      if (opener?.isConnected) opener.focus()
    }
  }, [open, inline])

  if (!inline) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          {...(description ? {} : { 'aria-describedby': undefined })}
          onCloseAutoFocus={(event) => {
            const opener = openerRef.current
            if (opener?.isConnected) {
              event.preventDefault()
              opener.focus()
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            {description ? <SheetDescription>{description}</SheetDescription> : null}
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!open) return null

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault()
      onOpenChange(false)
    }
  }

  return (
    // The handler only catches Escape bubbling from the controls inside.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <aside
      ref={panelRef}
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex flex-col self-start rounded-lg border bg-surface text-surface-foreground',
        className,
      )}
    >
      <div className="flex items-start gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2
            ref={headingRef}
            id={titleId}
            tabIndex={-1}
            className="font-semibold tracking-tight outline-none"
          >
            {title}
          </h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close details"
          className="-mt-1 -mr-2 shrink-0"
          onClick={() => {
            onOpenChange(false)
          }}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </aside>
  )
}
