import { cva, type VariantProps } from 'class-variance-authority'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

/** Root; holds the value. Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`). */
export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

const triggerVariants = cva(
  'disabled-state flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background text-left whitespace-nowrap text-foreground focus-ring transition-[color,border-color] aria-invalid:border-destructive aria-invalid:outline-destructive data-[placeholder]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&>span]:truncate',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-10 px-3.5 text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export interface SelectTriggerProps
  extends ComponentProps<typeof SelectPrimitive.Trigger>, VariantProps<typeof triggerVariants> {}

/**
 * The button that opens the list (`role="combobox"`). Give it an accessible
 * name with a Label (`htmlFor` → trigger `id`) or `aria-label`. Opens with
 * Enter, Space, or the arrow keys; typing a letter jumps to a matching option.
 */
export function SelectTrigger({ className, size, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger className={cn(triggerVariants({ size }), className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" className="text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

const scrollButton = 'flex h-6 cursor-default items-center justify-center text-muted-foreground'

/**
 * The listbox, portalled above the page. `position="popper"` (the default here)
 * anchors it below the trigger at the trigger's width and keeps it inside the
 * viewport; `item-aligned` overlays the selected option on the trigger instead.
 */
export function SelectContent({
  className,
  children,
  position = 'popper',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  const popper = position === 'popper'
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        {...(popper ? { sideOffset } : {})}
        className={cn(
          'relative z-(--z-popover) max-h-(--radix-select-content-available-height) min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-floating data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in',
          popper &&
            'w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin)',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className={scrollButton}>
          <ChevronUp aria-hidden="true" className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className={scrollButton}>
          <ChevronDown aria-hidden="true" className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/** One option. `value` must be a non-empty string; disabled items are skipped by the keyboard. */
export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'disabled-state relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

/** A heading for a SelectGroup; it labels the group for assistive tech. */
export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}

export function SelectSeparator({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
  )
}
