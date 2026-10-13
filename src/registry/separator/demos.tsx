import { Separator } from '@/components/ui/separator'

export function SeparatorDemo() {
  return (
    <div className="w-full max-w-xs text-sm">
      <p className="font-medium">Hieu UI Lab</p>
      <p className="text-muted-foreground">Components, blocks, and experiments.</p>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Components</span>
        <Separator orientation="vertical" />
        <span>Blocks</span>
      </div>
    </div>
  )
}
