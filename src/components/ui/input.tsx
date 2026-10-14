import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const inputVariants = cva(
  'disabled-state flex w-full min-w-0 rounded-md border border-input bg-background text-foreground focus-ring transition-[color,border-color] file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground read-only:bg-muted aria-invalid:border-destructive aria-invalid:outline-destructive',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-xs file:h-7 file:text-xs',
        md: 'h-9 px-3 text-sm file:h-8 file:text-sm',
        lg: 'h-10 px-3.5 text-sm file:h-9 file:text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

/**
 * The native `size` attribute (width in characters) is replaced by the size
 * scale shared with Button and SelectTrigger; set width with `className`.
 */
export interface InputProps
  extends Omit<ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {}

/**
 * A native text input. Every input attribute passes through, so it works
 * controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). Pair it
 * with a Label; mark errors with `aria-invalid` and `aria-describedby`.
 */
export function Input({ className, size, type, ...props }: InputProps) {
  return (
    <input type={type ?? 'text'} className={cn(inputVariants({ size }), className)} {...props} />
  )
}
