import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { StageProps } from '../example'

export interface DialogConfig {
  readonly title: string
  /** Undefined when blank: the description is left out and the dialog says it has none. */
  readonly description: string | undefined
  readonly showClose: boolean
  readonly confirmLabel: string
  readonly confirmVariant: 'default' | 'destructive'
}

/**
 * The Dialog from the registry, portalled into the preview frame. It is modal, as the component
 * is: while it is open the rest of the page, including the controls, is inert.
 */
export function DialogStage({ config, portalContainer }: StageProps<DialogConfig>) {
  const { title, description, showClose, confirmLabel, confirmVariant } = config
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent
        container={portalContainer}
        showClose={showClose}
        {...(description === undefined ? { 'aria-describedby': undefined } : {})}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description === undefined ? null : <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant={confirmVariant}>{confirmLabel}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
