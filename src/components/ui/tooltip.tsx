import { Tooltip as TooltipPrimitive } from 'radix-ui'
import { createContext, use, useRef, useState, type ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const HasProviderContext = createContext(false)

/**
 * Shares open and close delays between the tooltips inside it: once one is
 * open, moving to a neighbour opens it at once. Optional; a Tooltip without a
 * provider above it creates its own.
 */
export function TooltipProvider({
  delayDuration = 400,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <HasProviderContext value={true}>
      <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
    </HasProviderContext>
  )
}

/** Lets the trigger and content tell their Tooltip why the trigger has focus. */
interface FocusEvents {
  focused: (byKeyboard: boolean) => void
  blurred: () => void
  /** Escape was pressed or the trigger was activated. */
  dismissed: () => void
}

const FocusEventsContext = createContext<FocusEvents | null>(null)

/**
 * Root; holds the open state. Controlled (`open` + `onOpenChange`) or
 * uncontrolled (`defaultOpen`). Opens on hover after a delay and immediately on
 * keyboard focus. Escape, activating the trigger, blur, or moving the pointer
 * away closes it.
 */
export function Tooltip({
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  // Whether the trigger has keyboard focus, and whether the user dismissed the tooltip since.
  const focus = useRef({ keyboard: false, dismissed: false })
  const events: FocusEvents = {
    focused: (byKeyboard) => {
      focus.current = { keyboard: byKeyboard, dismissed: false }
    },
    blurred: () => {
      focus.current.keyboard = false
    },
    dismissed: () => {
      focus.current.dismissed = true
    },
  }

  function handleOpenChange(next: boolean) {
    // Tabbing to a trigger below the fold scrolls the page, and Radix closes
    // tooltips on scroll, so keyboard users would never see them. A tooltip
    // opened by keyboard focus stays open until blur, Escape, or activation.
    if (!next && focus.current.keyboard && !focus.current.dismissed) return
    setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const root = (
    <FocusEventsContext value={events}>
      <TooltipPrimitive.Root
        open={open ?? uncontrolledOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </FocusEventsContext>
  )
  return use(HasProviderContext) ? root : <TooltipProvider>{root}</TooltipProvider>
}

/** The element the tooltip describes. Use `asChild` with a focusable element, such as a Button. */
export function TooltipTrigger({
  onFocus,
  onBlur,
  onClick,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const focus = use(FocusEventsContext)
  return (
    <TooltipPrimitive.Trigger
      onFocus={(event) => {
        focus?.focused(event.currentTarget.matches(':focus-visible'))
        onFocus?.(event)
      }}
      onBlur={(event) => {
        focus?.blurred()
        onBlur?.(event)
      }}
      onClick={(event) => {
        focus?.dismissed()
        onClick?.(event)
      }}
      {...props}
    />
  )
}

/**
 * The hint itself (`role="tooltip"`, linked to the trigger with
 * `aria-describedby`). Keep it short and non-interactive: it cannot be reached
 * by Tab and does not open on touch.
 */
export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  onEscapeKeyDown,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  const focus = use(FocusEventsContext)
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        onEscapeKeyDown={(event) => {
          focus?.dismissed()
          onEscapeKeyDown?.(event)
        }}
        className={cn(
          'z-(--z-popover) max-w-64 origin-(--radix-tooltip-content-transform-origin) rounded-md bg-foreground px-2.5 py-1.5 text-xs text-balance text-background shadow-floating data-[state=closed]:animate-fade-out data-[state=delayed-open]:animate-pop-in data-[state=instant-open]:animate-fade-in',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-foreground" width={10} height={5} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
