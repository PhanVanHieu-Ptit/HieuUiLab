import { cva, type VariantProps } from 'class-variance-authority'
import { Check, Minus } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const checkboxVariants = cva(
  'peer disabled-state inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm border border-muted-foreground bg-background text-primary-foreground focus-ring transition-[color,background-color,border-color] aria-invalid:border-destructive data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
  {
    variants: {
      size: {
        sm: 'size-3.5 [&_svg]:size-3',
        md: 'size-4 [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export interface CheckboxProps
  extends ComponentProps<typeof CheckboxPrimitive.Root>, VariantProps<typeof checkboxVariants> {}

/**
 * A tri-state checkbox on Radix Checkbox (`role="checkbox"`, toggled with
 * Space). Use `checked` + `onCheckedChange` to control it, or `defaultChecked`.
 * `checked="indeterminate"` renders a dash and `aria-checked="mixed"`. Inside a
 * form it submits `name=value` (default value `on`) through a hidden input.
 */
export function Checkbox({ className, size, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root className={cn(checkboxVariants({ size }), className)} {...props}>
      <CheckboxPrimitive.Indicator className="group flex items-center justify-center">
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="group-data-[state=indeterminate]:hidden"
        />
        <Minus
          aria-hidden="true"
          strokeWidth={3}
          className="hidden group-data-[state=indeterminate]:block"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
