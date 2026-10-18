import type { ReactNode } from 'react'

import { inlineCodeClass, tableWrapClass } from '@/components/site/prose'
import { ScrollRegion } from '@/components/site/scroll-region'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/cn'
import css from '@/styles/globals.css?raw'

import { tokenDocs, typographySamples, utilityDocs } from './token-docs'
import { parseDesignTokens, type DesignToken, type TokenGroup } from './tokens'

// Read from the stylesheet itself, so the tables cannot disagree with it.
const parsed = parseDesignTokens(css)

const groupLabels: Record<TokenGroup, string> = {
  color: 'Color',
  radius: 'Radius',
  elevation: 'Elevation',
  stacking: 'Stacking',
  typography: 'Typography',
  layout: 'Layout',
  motion: 'Motion',
  utilities: 'Interaction state utilities',
}

/** Groups whose values differ between the light and dark themes. */
const themedGroups: readonly TokenGroup[] = ['color', 'elevation']

function TokenTable({
  caption,
  columns,
  children,
}: {
  caption: string
  columns: readonly string[]
  children: ReactNode
}) {
  return (
    <ScrollRegion label={`${caption}, scrollable`} className={tableWrapClass}>
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </ScrollRegion>
  )
}

const valueCell = 'align-top font-mono text-xs break-words text-muted-foreground'

function TokenRow({ token, themed }: { token: DesignToken; themed: boolean }) {
  const parts = Object.entries(token.parts)
  return (
    <TableRow>
      <TableHead scope="row" className="h-auto py-2.5 align-top text-foreground">
        <span className="flex items-center gap-2">
          {token.group === 'color' ? (
            <span
              aria-hidden="true"
              className="size-5 shrink-0 rounded-sm border"
              // Reads the variable, so the swatch follows the theme it is shown in.
              style={{ background: `var(--${token.name})` }}
            />
          ) : null}
          <code className="font-mono text-xs font-medium">--{token.name}</code>
        </span>
      </TableHead>
      <TableCell className={valueCell}>
        {token.light}
        {parts.length > 0 ? (
          <span className="mt-1 block font-sans">
            {parts.map(([name, value]) => `${name} ${value}`).join(' · ')}
          </span>
        ) : null}
      </TableCell>
      {themed ? <TableCell className={valueCell}>{token.dark ?? '—'}</TableCell> : null}
      <TableCell className="align-top text-muted-foreground">
        {tokenDocs[token.name] ?? '—'}
      </TableCell>
    </TableRow>
  )
}

/** The typography sizes at their real size. */
function TypographySamples() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        {typographySamples.map((sample) => (
          <div
            key={sample.label}
            className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6"
          >
            <code className="w-48 shrink-0 font-mono text-xs text-muted-foreground">
              {sample.label}
            </code>
            <span className={cn('min-w-0 truncate', sample.className)}>{sample.sample}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** One group of the design tokens in `globals.css`, with a usage note per token. */
export function DesignTokensView({ group }: { group: TokenGroup }) {
  if (group === 'utilities') {
    return (
      <TokenTable caption={groupLabels.utilities} columns={['Utility', 'Effect']}>
        {parsed.utilities.map((name) => (
          <TableRow key={name}>
            <TableHead scope="row" className="h-auto py-2.5 align-top text-foreground">
              <code className={inlineCodeClass}>{name}</code>
            </TableHead>
            <TableCell className="text-muted-foreground">{utilityDocs[name] ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TokenTable>
    )
  }

  const themed = themedGroups.includes(group)
  return (
    <div className="flex flex-col gap-4">
      <TokenTable
        caption={`${groupLabels[group]} tokens`}
        columns={themed ? ['Token', 'Light', 'Dark', 'Usage'] : ['Token', 'Value', 'Usage']}
      >
        {parsed.tokens
          .filter((token) => token.group === group)
          .map((token) => (
            <TokenRow key={token.name} token={token} themed={themed} />
          ))}
      </TokenTable>
      {group === 'typography' ? <TypographySamples /> : null}
    </div>
  )
}
