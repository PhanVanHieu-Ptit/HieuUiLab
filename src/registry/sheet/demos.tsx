import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function SheetDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      {(['left', 'right'] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline">Open {side}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <SheetDescription>
                Focus is trapped inside. Press Escape or click outside to close.
              </SheetDescription>
            </div>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )
}
