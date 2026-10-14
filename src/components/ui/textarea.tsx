import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const textareaVariants = cva(
  'disabled-state flex field-sizing-content w-full min-w-0 resize-y rounded-md border border-input bg-background text-foreground focus-ring transition-[color,border-color] placeholder:text-muted-foreground read-only:bg-muted aria-invalid:border-destructive aria-invalid:outline-destructive',
  {
    variants: {
      size: {
        sm: 'min-h-14 px-2.5 py-1.5 text-xs',
        md: 'min-h-18 px-3 py-2 text-sm',
        lg: 'min-h-24 px-3.5 py-2.5 text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export interface TextareaProps
  extends ComponentProps<'textarea'>, VariantProps<typeof textareaVariants> {}

/**
 * A native multi-line text field styled like Input. It grows with its content
 * (`field-sizing: content`) from a minimum height and can still be resized
 * vertically. Pair it with a Label; mark errors with `aria-invalid` and
 * `aria-describedby`, or place it in a Field.
 */
export function Textarea({ className, size, ...props }: TextareaProps) {
  return <textarea className={cn(textareaVariants({ size }), className)} {...props} />
}
