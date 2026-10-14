import { Bold, Italic, Link, Underline } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function TooltipToolbarDemo() {
  const tools = [
    { label: 'Bold', shortcut: 'Ctrl+B', Icon: Bold },
    { label: 'Italic', shortcut: 'Ctrl+I', Icon: Italic },
    { label: 'Underline', shortcut: 'Ctrl+U', Icon: Underline },
    { label: 'Insert link', shortcut: 'Ctrl+K', Icon: Link },
  ]

  return (
    <TooltipProvider>
      <div role="toolbar" aria-label="Formatting" className="flex gap-1 rounded-lg border p-1">
        {tools.map(({ label, shortcut, Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={label}>
                <Icon aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {label} <span className="opacity-70">{shortcut}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

export function TooltipSidesDemo() {
  const sides = ['top', 'right', 'bottom', 'left'] as const

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {sides.map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="outline" className="capitalize">
              {side}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Opens on the {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
