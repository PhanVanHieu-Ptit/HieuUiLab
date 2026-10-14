import { cva, type VariantProps } from 'class-variance-authority'
import { Switch as SwitchPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

// The track's inner width is exactly two thumbs, so "checked" slides the thumb by its own size.
const switchVariants = cva(
  'peer disabled-state inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-muted-foreground focus-ring transition-colors aria-invalid:outline-destructive data-[state=checked]:bg-primary',
  {
    variants: {
      size: {
        sm: 'h-4 w-7 [--thumb:--spacing(3)]',
        md: 'h-5 w-9 [--thumb:--spacing(4)]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export interface SwitchProps
  extends ComponentProps<typeof SwitchPrimitive.Root>, VariantProps<typeof switchVariants> {}

/**
 * An on/off toggle on Radix Switch (`role="switch"`, toggled with Space or
 * Enter). Use it for settings that apply immediately; use a Checkbox for
 * choices confirmed by submitting a form. Controlled with `checked` +
 * `onCheckedChange`, or uncontrolled with `defaultChecked`.
 */
export function Switch({ className, size, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root className={cn(switchVariants({ size }), className)} {...props}>
      <SwitchPrimitive.Thumb className="pointer-events-none block size-(--thumb) rounded-full bg-background shadow-raised transition-transform data-[state=checked]:translate-x-(--thumb)" />
    </SwitchPrimitive.Root>
  )
}
