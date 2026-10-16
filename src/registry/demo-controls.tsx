import { useId, type ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export interface MockOption<T extends string> {
  value: T
  label: string
}

interface MockPickerProps<T extends string> {
  /** What the choice controls, e.g. "Mock response" or "Mock state". */
  legend?: string
  options: readonly MockOption<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * Demo chrome, never part of a block: picks what a mock handler returns or which state a block is
 * shown in, so every state can be tried. Marked "example only" so it is not mistaken for the block.
 */
export function MockPicker<T extends string>({
  legend = 'Mock response',
  options,
  value,
  onChange,
}: MockPickerProps<T>) {
  const name = useId()
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-dashed p-3 text-sm">
      <legend className="px-1 text-xs font-medium text-muted-foreground">
        {legend} (example only)
      </legend>
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={name}
            className="accent-primary"
            checked={value === option.value}
            onChange={() => {
              onChange(option.value)
            }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}

/** Demo chrome: says the data and handlers behind an example are not real. */
export function ExampleOnlyNotice({ children }: { children: ReactNode }) {
  return (
    <Alert variant="info" role="none">
      <AlertTitle>Example only</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
