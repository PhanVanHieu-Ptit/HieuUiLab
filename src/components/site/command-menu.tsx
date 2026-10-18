import { CornerDownLeft, FileText, SearchIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { docsNav, flattenNavItems, type NavItem } from '@/config/site'
import { cn } from '@/lib/cn'

import { StatusBadge } from './status-badge'

interface SearchGroup {
  title: string
  items: readonly NavItem[]
}

const searchGroups: readonly SearchGroup[] = docsNav.map((section) => ({
  title: section.title,
  items: flattenNavItems(section.items).filter((item) => !item.disabled),
}))

function filterGroups(query: string): SearchGroup[] {
  const needle = query.trim().toLowerCase()
  return searchGroups
    .map((group) => ({
      title: group.title,
      items: needle
        ? group.items.filter((item) =>
            `${item.title} ${item.description ?? ''} ${item.keywords?.join(' ') ?? ''}`
              .toLowerCase()
              .includes(needle),
          )
        : group.items,
    }))
    .filter((group) => group.items.length > 0)
}

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Search dialog over docs pages and registry entries (⌘K / Ctrl+K). */
export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="max-w-xl">
        <DialogTitle className="sr-only">Search documentation</DialogTitle>
        <DialogDescription className="sr-only">
          Type to filter pages and components. Use the arrow keys to move and Enter to open.
        </DialogDescription>
        {/* Mounted only while open, so the query resets on every open. */}
        <CommandPalette
          onSelect={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function CommandPalette({ onSelect }: { onSelect: () => void }) {
  const navigate = useNavigate()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const groups = useMemo(() => filterGroups(query), [query])
  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups])
  const active = flat[Math.min(activeIndex, flat.length - 1)]
  const optionId = (item: NavItem) => `${listId}-${item.href}`

  useEffect(() => {
    if (!active) return
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' })
    // optionId only depends on listId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  function go(item: NavItem) {
    onSelect()
    void navigate(item.href)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const last = flat.length - 1
    const current = Math.min(activeIndex, last)
    const moves: Partial<Record<string, number>> = {
      ArrowDown: current >= last ? 0 : current + 1,
      ArrowUp: current <= 0 ? last : current - 1,
      Home: 0,
      End: last,
    }
    const next = moves[event.key]
    if (next !== undefined && flat.length > 0) {
      event.preventDefault()
      setActiveIndex(next)
    } else if (event.key === 'Enter' && active) {
      event.preventDefault()
      go(active)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b px-4">
        <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <input
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active ? optionId(active) : undefined}
          aria-label="Search documentation"
          placeholder="Search docs and components…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={onKeyDown}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Kbd aria-hidden="true">Esc</Kbd>
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label="Results"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
      >
        {groups.map((group) => (
          <div key={group.title} role="group" aria-label={group.title} className="pb-2 last:pb-0">
            <div
              aria-hidden="true"
              className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground"
            >
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive = item === active
              return (
                // Keyboard selection lives on the combobox input (aria-activedescendant pattern).
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <div
                  key={item.href}
                  id={optionId(item)}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  onPointerMove={() => {
                    if (!isActive) setActiveIndex(flat.indexOf(item))
                  }}
                  onClick={() => {
                    go(item)
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm',
                    isActive && 'bg-accent text-accent-foreground',
                  )}
                >
                  <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    {item.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {item.status && item.status !== 'stable' ? (
                    <StatusBadge status={item.status} size="sm" />
                  ) : null}
                  {isActive ? (
                    <CornerDownLeft
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
        {flat.length === 0 ? (
          <p role="status" className="px-2 py-8 text-center text-sm text-muted-foreground">
            No results for “{query.trim()}”.
          </p>
        ) : null}
      </div>
    </>
  )
}
