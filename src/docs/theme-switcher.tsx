import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useTheme, type Theme } from '@/hooks/use-theme'

const themes: readonly { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

/** The same Light / Dark / System choice as the header theme menu, shown on the page. */
export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 pt-5">
        <div role="group" aria-label="Theme" className="flex flex-wrap gap-2">
          {themes.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={theme === option.value ? 'default' : 'outline'}
              aria-pressed={theme === option.value}
              onClick={() => {
                setTheme(option.value)
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <p className="text-sm text-muted-foreground">
          Resolved: <Badge variant="primary">{resolvedTheme}</Badge>
        </p>
      </CardContent>
    </Card>
  )
}
