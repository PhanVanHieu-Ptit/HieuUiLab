import { ArrowRight, Mail, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ButtonVariantsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}

export function ButtonSizesDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" variant="outline" aria-label="Send email">
        <Mail aria-hidden="true" />
      </Button>
    </div>
  )
}

export function ButtonStatesDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
      <Button variant="destructive">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
      <Button asChild variant="outline">
        <a href="#props">
          Jump to props
          <ArrowRight aria-hidden="true" />
        </a>
      </Button>
    </div>
  )
}
