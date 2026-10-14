import { Label as LabelPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export interface LabelProps extends ComponentProps<typeof LabelPrimitive.Root> {
  /**
   * Show a required marker. It is visual only: put `required` on the control
   * itself so assistive tech and native validation know about it.
   */
  required?: boolean
}

/**
 * A native `<label>` on Radix Label, which keeps double-clicks from selecting
 * the text. Associate it with `htmlFor` or by wrapping the control. Dims when a
 * preceding `peer` control or a `group` ancestor is disabled.
 */
export function Label({ className, required = false, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'inline-flex items-center gap-1 text-sm leading-none font-medium select-none group-data-[disabled]:opacity-50 peer-disabled:opacity-50 peer-data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  )
}
