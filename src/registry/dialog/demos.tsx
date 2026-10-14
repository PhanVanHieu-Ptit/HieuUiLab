import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Delete component</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this component?</DialogTitle>
          <DialogDescription>
            Its page and demos are removed from the registry. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive">Delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DialogFormDemo() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Hieu UI Lab')

  return (
    <div className="flex flex-col items-center gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Rename project</Button>
        </DialogTrigger>
        <DialogContent>
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault()
              const value = new FormData(event.currentTarget).get('name')
              if (typeof value === 'string') setName(value)
              setOpen(false)
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>The name appears in the header and page titles.</DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-2">
              <Label htmlFor="dialog-project-name">Name</Label>
              <Input id="dialog-project-name" name="name" defaultValue={name} required />
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground">
        Current name: <span className="font-medium text-foreground">{name}</span>
      </p>
    </div>
  )
}

export function DialogScrollDemo() {
  const sections = [
    'Components are provided as source you copy into your project.',
    'You may modify, redistribute, and use them in commercial work.',
    'Design tokens and state utilities are part of the same license.',
    'Third-party packages such as Radix keep their own licenses.',
    'There is no warranty; test components in your own product.',
    'Attribution is appreciated but not required.',
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Read license</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>License</DialogTitle>
          <DialogDescription>Scroll to read; the actions stay in view.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 text-sm">
          {sections.map((text, index) => (
            <section key={text} className="flex flex-col gap-1">
              <h3 className="font-medium">Section {index + 1}</h3>
              <p className="text-muted-foreground">
                {text} Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </section>
          ))}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
