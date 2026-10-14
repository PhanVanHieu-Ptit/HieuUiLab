import { CircleAlert, CircleCheck } from 'lucide-react'
import { useEffect, useRef, type ComponentProps, type ReactNode, type Ref } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/cn'

export interface FormFeedbackProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** `success` is announced politely (`role="status"`); `error` at once (`role="alert"`). */
  status: 'success' | 'error'
  title: ReactNode
  /**
   * Move focus here when it appears. Submitting usually disables the submit
   * button, which drops focus to the page; this puts keyboard users back next
   * to the result. Give it a new `key` per submission to focus it again.
   */
  focusOnMount?: boolean
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

/**
 * The outcome of submitting a form, on Alert. Not tied to a form library:
 * render it when a submission settles and remove it when a new one starts.
 */
export function FormFeedback({
  status,
  title,
  focusOnMount = true,
  className,
  children,
  ref,
  ...props
}: FormFeedbackProps) {
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusOnMount) nodeRef.current?.focus()
  }, [focusOnMount])

  return (
    <Alert
      ref={(node) => {
        nodeRef.current = node
        assignRef(ref, node)
      }}
      tabIndex={-1}
      variant={status === 'success' ? 'success' : 'destructive'}
      className={cn('outline-none', className)}
      {...props}
    >
      {status === 'success' ? (
        <CircleCheck aria-hidden="true" />
      ) : (
        <CircleAlert aria-hidden="true" />
      )}
      <AlertTitle>{title}</AlertTitle>
      {children ? <AlertDescription>{children}</AlertDescription> : null}
    </Alert>
  )
}
