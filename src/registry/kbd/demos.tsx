import { Kbd } from '@/components/ui/kbd'

export function KbdDemo() {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      Press <Kbd>⌘</Kbd>
      <Kbd>K</Kbd> or <Kbd>/</Kbd> to search, <Kbd>Esc</Kbd> to close.
    </p>
  )
}
