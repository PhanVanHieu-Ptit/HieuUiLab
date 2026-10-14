import { useState, type ReactElement, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export interface ConfirmActionProps {
  /** A single element that opens the dialog, usually a Button. */
  trigger: ReactElement
  title: ReactNode
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** May return a promise; the dialog stays open and busy until it settles. */
  onConfirm: () => void | Promise<void>
  /** Style of the confirm button. Use `default` for reversible or non-destructive actions. */
  confirmVariant?: 'destructive' | 'default'
}

/**
 * Confirmation for consequential actions, destructive by default. Async work keeps the dialog open with a
 * busy confirm button; a rejection is shown inline so the user can retry.
 */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmVariant = 'destructive',
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (pending) return
    setOpen(next)
    if (!next) setError(null)
  }

  async function confirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      setOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Something went wrong. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showClose={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error ? (
          <p
            role="alert"
            className="mx-5 mb-4 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            variant={confirmVariant}
            loading={pending}
            onClick={() => {
              void confirm()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
