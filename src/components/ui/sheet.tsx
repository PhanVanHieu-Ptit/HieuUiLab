import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

const sheetVariants = cva(
  'fixed inset-y-0 z-(--z-overlay) flex w-[85vw] max-w-sheet flex-col bg-popover text-popover-foreground shadow-floating outline-none',
  {
    variants: {
      side: {
        left: 'left-0 border-r data-[state=closed]:animate-slide-out-left data-[state=open]:animate-slide-in-left',
        right:
          'right-0 border-l data-[state=closed]:animate-slide-out-right data-[state=open]:animate-slide-in-right',
      },
    },
    defaultVariants: {
      side: 'left',
    },
  },
)

export interface SheetContentProps extends ComponentProps<typeof SheetPrimitive.Content> {
  side?: 'left' | 'right'
}

/**
 * A modal panel that slides in from the edge of the screen: overlay, focus
 * trap, Escape and outside click to close, focus restored to the trigger.
 */
export function SheetContent({ side = 'left', className, children, ...props }: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute top-2.5 right-2.5 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground focus-ring transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4">
          <X aria-hidden="true" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex h-header shrink-0 items-center gap-2 border-b px-4 pr-14', className)}
      {...props}
    />
  )
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn('font-semibold', className)} {...props} />
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
