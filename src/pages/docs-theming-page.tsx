import { CodeBlock } from '@/components/site/code-block'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { cn } from '@/lib/cn'

interface TokenGroup {
  title: string
  tokens: readonly { name: string; usage: string }[]
}

const tokenGroups: readonly TokenGroup[] = [
  {
    title: 'Surfaces',
    tokens: [
      { name: 'background', usage: 'Page canvas' },
      { name: 'surface', usage: 'Cards, previews, tables' },
      { name: 'popover', usage: 'Menus, dialogs, drawer' },
      { name: 'muted', usage: 'Subtle fills, inline code' },
      { name: 'accent', usage: 'Hover and highlighted rows' },
      { name: 'code', usage: 'Code panels' },
    ],
  },
  {
    title: 'Text and lines',
    tokens: [
      { name: 'foreground', usage: 'Body text' },
      { name: 'muted-foreground', usage: 'Secondary text' },
      { name: 'border', usage: 'Dividers and outlines' },
      { name: 'input', usage: 'Form control borders' },
      { name: 'ring', usage: 'Focus outline' },
    ],
  },
  {
    title: 'Accent and status',
    tokens: [
      { name: 'primary', usage: 'The one accent: primary actions, links' },
      { name: 'primary-subtle', usage: 'Active navigation, selection' },
      { name: 'success', usage: 'Stable, positive status' },
      { name: 'warning', usage: 'Beta, caution' },
      { name: 'info', usage: 'Neutral notices' },
      { name: 'destructive', usage: 'Errors, irreversible actions' },
    ],
  },
]

const themes: readonly { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const stateUtilities = `/* globals.css */
@utility focus-ring        /* 2px ring outline on :focus-visible */
@utility focus-ring-inset  /* same, drawn inside (scroll containers) */
@utility disabled-state    /* :disabled, [aria-disabled=true], [data-disabled] */

<button className="... focus-ring disabled-state hover:bg-accent active:translate-y-px">`

export function DocsThemingPage() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <article className="flex flex-col gap-14">
      <PageHeader
        eyebrow="Getting started"
        title="Theming"
        description="Every color, surface, and interaction state comes from semantic tokens defined once in globals.css. Components never use raw palette values, so a theme change updates the whole interface."
      />

      <section aria-labelledby="preference" className="flex flex-col gap-4">
        <SectionHeader
          id="preference"
          title="Theme preference"
          anchorLabel="Theme preference"
          description="Stored in localStorage and applied before first paint. System follows the operating system setting live."
        />
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
      </section>

      <section aria-labelledby="color-tokens" className="flex flex-col gap-6">
        <SectionHeader
          id="color-tokens"
          title="Color tokens"
          anchorLabel="Color tokens"
          description="Use them as Tailwind utilities: bg-surface, text-muted-foreground, border-border. Pairs are contrast-tested in both themes."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {tokenGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader className="pb-3">
                <CardTitle>{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {group.tokens.map((token) => (
                    <li key={token.name} className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="size-8 shrink-0 rounded-md border"
                        style={{ background: `var(--${token.name})` }}
                      />
                      <span className="min-w-0">
                        <code className="block truncate font-mono text-xs font-medium">
                          {token.name}
                        </code>
                        <span className="block text-xs text-muted-foreground">{token.usage}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="states" className="flex flex-col gap-4">
        <SectionHeader
          id="states"
          title="Interaction states"
          anchorLabel="Interaction states"
          description="Hover, focus, active, disabled, and loading look the same everywhere. Focus is an outline, so it stays visible in forced-colors mode."
        />
        <Card>
          <CardHeader>
            <CardTitle>Try it with the keyboard</CardTitle>
            <CardDescription>Tab through these to see the shared focus ring.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </CardContent>
        </Card>
        <CodeBlock code={stateUtilities} language="text" title="state utilities" />
      </section>

      <section aria-labelledby="type" className="flex flex-col gap-4">
        <SectionHeader
          id="type"
          title="Typography"
          anchorLabel="Typography"
          description="IBM Plex Sans for interface text, JetBrains Mono for code. Self-hosted, with Latin and Vietnamese subsets."
        />
        <Card>
          <CardContent className="flex flex-col gap-4 pt-5">
            {(
              [
                ['text-display', 'Display'],
                ['text-title', 'Title'],
                ['text-heading', 'Heading'],
                ['text-base', 'Body text'],
                ['text-sm text-muted-foreground', 'Secondary text'],
                ['font-mono text-mono', 'const code = true'],
              ] as const
            ).map(([className, sample]) => (
              <div
                key={className}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <code className="w-40 shrink-0 font-mono text-xs text-muted-foreground">
                  {className.split(' ')[0]}
                </code>
                <span className={cn('min-w-0 truncate', className)}>{sample}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </article>
  )
}
