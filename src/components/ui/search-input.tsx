import { Search, X } from 'lucide-react'
import { useRef, type KeyboardEvent, type Ref } from 'react'

import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/cn'

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  /**
   * Shows a clear button while the controlled `value` is not empty, and clears
   * on Escape. Set `value` to `''` in it.
   */
  onClear?: () => void
  /** Accessible name of the clear button. */
  clearLabel?: string
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

/**
 * A native `type="search"` Input (role `searchbox`) with a leading search icon
 * and an optional clear button. Clearing returns focus to the input. Every
 * input attribute and `ref` go to the `<input>`; `className` styles the
 * wrapper. Put it in a `<form role="search">` or label it.
 */
export function SearchInput({
  className,
  onClear,
  clearLabel = 'Clear search',
  value,
  disabled,
  ref,
  onKeyDown,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const clearable = onClear !== undefined && typeof value === 'string' && value !== ''

  function clear() {
    onClear?.()
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.key === 'Escape' && clearable && !event.defaultPrevented) {
      event.preventDefault()
      clear()
    }
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={(node) => {
          inputRef.current = node
          assignRef(ref, node)
        }}
        type="search"
        value={value}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={cn(
          'pl-9 [&::-webkit-search-cancel-button]:appearance-none',
          clearable && 'pr-10',
        )}
        {...props}
      />
      {clearable ? (
        <button
          type="button"
          aria-label={clearLabel}
          disabled={disabled}
          onClick={clear}
          className="disabled-state absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center rounded-r-md text-muted-foreground focus-ring-inset transition-colors hover:text-foreground [&_svg]:size-4"
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
