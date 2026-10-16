import { useId } from 'react'

import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  /** Names the group; shown above the options. */
  legend: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * A row of mutually exclusive options. They are native radio buttons, so Tab enters the group,
 * the arrow keys move and select, and screen readers announce "n of m" with no extra code.
 */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="inline-flex w-fit max-w-full rounded-md border bg-muted p-0.5">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative inline-flex h-7 cursor-pointer items-center rounded-sm px-3 text-sm text-muted-foreground transition-colors has-checked:bg-surface has-checked:font-medium has-checked:text-foreground has-checked:shadow-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-ring"
          >
            {/* Covers the label so it can be clicked by pointer and by test tools, unlike sr-only. */}
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => {
                onChange(option.value)
              }}
              className="absolute inset-0 m-0 size-full cursor-pointer opacity-0"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
