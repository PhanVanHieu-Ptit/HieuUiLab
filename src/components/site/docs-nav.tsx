import { useId } from 'react'
import { NavLink } from 'react-router'

import { Badge } from '@/components/ui/badge'
import type { NavItem, NavSection } from '@/config/site'
import { cn } from '@/lib/cn'

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-8 items-center gap-2 rounded-md px-2 py-1 text-sm focus-ring-inset transition-colors',
    isActive
      ? 'bg-primary-subtle font-medium text-primary-subtle-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  )

function ItemLabel({ item }: { item: NavItem }) {
  return (
    <>
      <span className="truncate">{item.title}</span>
      {item.status && item.status !== 'stable' ? (
        <Badge
          size="sm"
          variant={item.status === 'experimental' ? 'warning' : 'neutral'}
          className="ml-auto"
        >
          {item.status === 'experimental' ? 'Experimental' : 'Planned'}
        </Badge>
      ) : null}
      {item.label ? (
        <Badge size="sm" className="ml-auto">
          {item.label}
        </Badge>
      ) : null}
    </>
  )
}

interface ItemListProps {
  items: readonly NavItem[]
  onNavigate: (() => void) | undefined
  /** A nested list is indented under its parent item. */
  nested?: boolean
}

/** One level of links. A page with child pages lists them beneath it, always expanded. */
function ItemList({ items, onNavigate, nested = false }: ItemListProps) {
  return (
    <ul className={cn('flex flex-col gap-0.5', nested && 'mt-0.5 ml-3 border-l pl-2')}>
      {items.map((item) => (
        <li key={item.href}>
          {item.disabled ? (
            <span
              aria-disabled="true"
              className={cn(itemClass({ isActive: false }), 'disabled-state')}
            >
              <ItemLabel item={item} />
            </span>
          ) : (
            <NavLink
              to={item.href}
              end={!item.matchNested}
              className={itemClass}
              onClick={onNavigate}
            >
              <ItemLabel item={item} />
            </NavLink>
          )}
          {item.children && item.children.length > 0 ? (
            <ItemList items={item.children} onNavigate={onNavigate} nested />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

interface NavListProps {
  sections: readonly NavSection[]
  /** Called after a link is followed, e.g. to close the mobile drawer. */
  onNavigate?: () => void
  className?: string
}

/** Grouped documentation links, shared by the desktop sidebar and the mobile drawer. */
export function DocsNavList({ sections, onNavigate, className }: NavListProps) {
  // Sidebar and drawer can both be mounted; keep heading ids unique.
  const idPrefix = useId()
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {sections.map((section) => {
        const headingId = `${idPrefix}-${section.title.toLowerCase().replace(/\s+/g, '-')}`
        return (
          <section key={section.title} aria-labelledby={headingId}>
            <h2
              id={headingId}
              className="mb-1.5 px-2 text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              {section.title}
            </h2>
            <ItemList items={section.items} onNavigate={onNavigate} />
          </section>
        )
      })}
    </div>
  )
}
