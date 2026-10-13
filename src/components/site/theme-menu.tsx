import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

import { Button } from '@/components/ui/button'
import { useTheme, type Theme } from '@/hooks/use-theme'

const options: readonly { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function isTheme(value: string): value is Theme {
  return options.some((option) => option.value === value)
}

/** Light / dark / system preference. The trigger icon shows the resolved theme. */
export function ThemeMenu() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const current = options.find((option) => option.value === theme)?.label ?? 'System'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Theme: ${current}`}>
          {resolvedTheme === 'dark' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-(--z-popover) min-w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-floating data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Theme
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={theme}
            onValueChange={(value) => {
              if (isTheme(value)) setTheme(value)
            }}
          >
            {options.map(({ value, label, icon: Icon }) => (
              <DropdownMenu.RadioItem
                key={value}
                value={value}
                className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:size-4"
              >
                <Icon aria-hidden="true" className="text-muted-foreground" />
                <span className="flex-1">{label}</span>
                <DropdownMenu.ItemIndicator>
                  <Check aria-hidden="true" className="text-primary" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
