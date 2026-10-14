import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'

import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/cn'

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** Accessible name of the visibility toggle; its pressed state says whether the password shows. */
  toggleLabel?: string
}

/**
 * An Input for passwords with a button that shows or hides the value. The
 * toggle keeps one name and reports its state with `aria-pressed`, so screen
 * readers say "Show password, toggle button, pressed". Every input attribute
 * and `ref` go to the `<input>`; `className` styles the wrapper (use it for
 * width). Set `autoComplete` to `current-password` or `new-password`.
 */
export function PasswordInput({
  className,
  toggleLabel = 'Show password',
  id,
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn('relative w-full', className)}>
      <Input
        id={inputId}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="none"
        className="pr-10"
        {...props}
      />
      <button
        type="button"
        aria-label={toggleLabel}
        aria-pressed={visible}
        aria-controls={inputId}
        disabled={disabled}
        onClick={() => {
          setVisible((current) => !current)
        }}
        className="disabled-state absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center rounded-r-md text-muted-foreground focus-ring-inset transition-colors hover:text-foreground [&_svg]:size-4"
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  )
}
